// Import par tableau (Excel / LibreOffice / Google Sheets) et import LibreOffice Writer (.odt)
import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { cvExemple } from '../data/cvExemple';
import { tableauCv, resultatDepuisTableau, dateCellule, estTableauCv } from '../lib/tableur/modeleCv';
import { lireTableur, type FeuilleLue } from '../lib/tableur/lireTableur';
import { lettreColonne } from '../lib/tableur/ecrireXlsx';
import { lireOdt, lignesOdt } from '../lib/import/lireOdt';

const relire = async (octets: Uint8Array) => lireTableur(octets);

describe('tableau à remplir (.xlsx)', () => {
  it('produit un classeur dont chaque fichier XML est valide', async () => {
    const zip = await JSZip.loadAsync(await tableauCv(null));
    const fichiers = Object.keys(zip.files).filter(f => f.endsWith('.xml') || f.endsWith('.rels'));
    expect(fichiers).toContain('xl/worksheets/sheet7.xml');
    for (const f of fichiers) {
      const doc = new DOMParser().parseFromString(await zip.file(f)!.async('string'), 'application/xml');
      expect(doc.getElementsByTagName('parsererror').length, f).toBe(0);
    }
  });

  it('vide : les lignes « Exemple » sont ignorées', async () => {
    const feuilles = await relire(await tableauCv(null));
    expect(feuilles.map(f => f.nom)).toContain('Expériences');
    expect(estTableauCv(feuilles)).toBe(true);
    const { resultat } = resultatDepuisTableau(feuilles);
    expect(resultat.donnees.experiences).toHaveLength(0);
    expect(resultat.donnees.formations).toHaveLength(0);
    expect(resultat.donnees.langues).toHaveLength(0);
    expect(resultat.donnees.infosPerso.prenom).toBe('');
    expect(resultat.aClasser).toHaveLength(0);
  });

  it('rempli avec un CV puis réimporté : on retrouve le même contenu', async () => {
    const cv = cvExemple();
    const { resultat } = resultatDepuisTableau(await relire(await tableauCv(cv.donnees)));
    const d = resultat.donnees;
    const o = cv.donnees;
    expect(d.infosPerso.prenom).toBe(o.infosPerso.prenom);
    expect(d.infosPerso.email).toBe(o.infosPerso.email);
    expect(d.accroche).toBe(o.accroche);
    expect(d.qualites).toEqual(o.qualites);
    expect(d.experiences.map(e => [e.poste, e.entreprise, e.periode, e.puces.map(p => p.texte)]))
      .toEqual(o.experiences.map(e => [e.poste, e.entreprise, e.periode, e.puces.map(p => p.texte).filter(Boolean)]));
    expect(d.formations.map(f => f.diplome)).toEqual(o.formations.map(f => f.diplome));
    expect(d.competences.map(c => c.elements)).toEqual(o.competences.map(c => c.elements));
    expect(d.langues.map(l => [l.langue, l.niveau])).toEqual(o.langues.map(l => [l.langue, l.niveau]));
    expect(resultat.aClasser).toHaveLength(0);
  });

  it('les éléments en réserve ne sont pas exportés', async () => {
    const cv = cvExemple();
    cv.donnees.experiences[0].masquee = true;
    const { resultat } = resultatDepuisTableau(await relire(await tableauCv(cv.donnees)));
    expect(resultat.donnees.experiences).toHaveLength(cv.donnees.experiences.length - 1);
  });
});

describe('lecture d’un tableau rempli à la main', () => {
  const feuilles: FeuilleLue[] = [
    { nom: 'Infos et profil', lignes: [['Rubrique', 'Votre réponse', 'Aide'], ['Prénom', 'Inès'], ['Nom', 'Exemplaire'], ['Poste visé', 'Gestionnaire de paie'], ['Qualités', 'Rigueur, Discrétion'], ['Rubrique inventée', 'texte libre']] },
    {
      nom: 'Expériences', lignes: [
        ['Poste', 'Entreprise', 'Ville', 'Début', 'Fin', 'Missions'],
        ['Exemple : Assistante', 'Société Exemple', '', '09/2023', 'en cours', 'à ignorer'],
        ['Gestionnaire de paie', 'Entreprise A', 'Lille', '45170', 'En cours', '• Paie de 300 salariés\n- DSN mensuelle'],
        ['', '', '', '', '', 'Veille sociale'],
        ['Assistante RH', 'Entreprise B', '', '2021-01-01', '2022', ''],
        ['Stagiaire', 'Entreprise C', '', 'été 2019', '', ''],
      ],
    },
    { nom: 'Langues', lignes: [['Langue', 'Niveau', 'Précision'], ['Anglais', 'courant', ''], ['Espagnol', 'B1', 'Erasmus']] },
  ];

  it('dates Excel, ISO, « en cours », lignes de suite et puces', () => {
    const { resultat, lignes } = resultatDepuisTableau(feuilles);
    const d = resultat.donnees;
    expect(d.infosPerso.titre).toBe('Gestionnaire de paie');
    expect(d.qualites).toEqual(['Rigueur', 'Discrétion']);
    expect(d.experiences).toHaveLength(3);
    expect(d.experiences[0].periode).toEqual({ debut: '2023-09', fin: '', enCours: true });
    expect(d.experiences[0].puces.map(p => p.texte)).toEqual(['Paie de 300 salariés', 'DSN mensuelle', 'Veille sociale']);
    expect(d.experiences[1].periode).toEqual({ debut: '2021-01', fin: '2022', enCours: false });
    expect(d.langues.map(l => l.niveau)).toEqual(['C1', 'B1']);
    // Ce qui n'a pas été compris est gardé « à classer », rien n'est perdu
    expect(resultat.aClasser.map(f => f.texte).join('\n')).toMatch(/Rubrique inventée : texte libre[\s\S]*été 2019/);
    expect(lignes[0].texte).toBe('— Infos et profil —');
  });

  it('dateCellule', () => {
    expect(dateCellule('09/2024')).toEqual({ date: '2024-09', enCours: false });
    expect(dateCellule('2024')).toEqual({ date: '2024', enCours: false });
    expect(dateCellule('Présent').enCours).toBe(true);
    expect(dateCellule('45536').date).toBe('2024-09');
  });

  it('un classeur sans rapport est refusé', () => {
    expect(estTableauCv([{ nom: 'Budget', lignes: [['Mois', 'Montant']] }])).toBe(false);
  });
});

describe('classeurs enregistrés par Excel et LibreOffice', () => {
  it('lit un .xlsx avec textes partagés (format d’Excel)', async () => {
    const zip = new JSZip();
    zip.file('xl/workbook.xml', '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Langues" sheetId="1" r:id="rId1"/></sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="x" Target="/xl/worksheets/sheet1.xml"/></Relationships>');
    zip.file('xl/sharedStrings.xml', '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><si><t>Langue</t></si><si><r><t>Ital</t></r><r><t>ien</t></r></si></sst>');
    zip.file('xl/worksheets/sheet1.xml', '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c></row><row r="3"><c r="C3" t="s"><v>1</v></c><c r="D3"><v>2024</v></c></row></sheetData></worksheet>');
    const [f] = await lireTableur(await zip.generateAsync({ type: 'uint8array' }));
    expect(f.lignes).toEqual([['Langue'], [], ['', '', 'Italien', '2024']]);
    expect(lettreColonne(27)).toBe('AB');
  });

  it('lit un .ods (cellules répétées, dates, retours à la ligne)', async () => {
    const zip = new JSZip();
    zip.file('content.xml', `<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:spreadsheet>
      <table:table table:name="Expériences">
        <table:table-row><table:table-cell office:value-type="string"><text:p>Poste</text:p></table:table-cell><table:table-cell table:number-columns-repeated="2"/><table:table-cell><text:p>Début</text:p></table:table-cell><table:table-cell><text:p>Fin</text:p></table:table-cell><table:table-cell><text:p>Missions</text:p></table:table-cell></table:table-row>
        <table:table-row><table:table-cell><text:p>Comptable</text:p></table:table-cell><table:table-cell><text:p>Cabinet<text:s text:c="2"/>X</text:p></table:table-cell><table:table-cell/><table:table-cell office:value-type="date" office:date-value="2022-03-01"><text:p>01/03/22</text:p></table:table-cell><table:table-cell><text:p>en cours</text:p></table:table-cell><table:table-cell><text:p>Bilans</text:p><text:p>Liasses fiscales</text:p></table:table-cell><table:table-cell table:number-columns-repeated="1000"/></table:table-row>
        <table:table-row table:number-rows-repeated="1048000"><table:table-cell table:number-columns-repeated="1024"/></table:table-row>
      </table:table></office:spreadsheet></office:body></office:document-content>`);
    zip.file('mimetype', 'application/vnd.oasis.opendocument.spreadsheet');
    const feuilles = await lireTableur(await zip.generateAsync({ type: 'uint8array' }));
    expect(feuilles[0].lignes).toHaveLength(2);
    const { resultat } = resultatDepuisTableau(feuilles);
    const e = resultat.donnees.experiences[0];
    expect([e.poste, e.entreprise, e.periode.debut, e.periode.enCours]).toEqual(['Comptable', 'Cabinet  X', '2022-03', true]);
    expect(e.puces.map(p => p.texte)).toEqual(['Bilans', 'Liasses fiscales']);
  });
});

describe('import LibreOffice Writer (.odt)', () => {
  const CONTENU = `<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0"><office:body><office:text>
    <text:h>Inès<text:s/>EXEMPLAIRE</text:h>
    <text:p>Comptable<text:line-break/>ines@exemple.fr</text:p>
    <text:p><draw:frame><draw:text-box><text:p>Texte dans une zone</text:p></draw:text-box></draw:frame>Après le cadre<office:annotation><text:p>commentaire</text:p></office:annotation></text:p>
    <text:list><text:list-item><text:p>Puce une</text:p></text:list-item></text:list>
    <table:table><table:table-row><table:table-cell><text:p>Cellule</text:p></table:table-cell></table:table-row></table:table>
  </office:text></office:body></office:document-content>`;

  it('un paragraphe = une ligne, zones de texte comprises, commentaires exclus', () => {
    expect(lignesOdt(CONTENU)).toEqual(['Inès EXEMPLAIRE', 'Comptable', 'ines@exemple.fr', 'Après le cadre', 'Texte dans une zone', 'Puce une', 'Cellule']);
  });

  it('lit le fichier .odt complet', async () => {
    const zip = new JSZip();
    zip.file('mimetype', 'application/vnd.oasis.opendocument.text');
    zip.file('content.xml', CONTENU);
    const { lignes, photo } = await lireOdt(await zip.generateAsync({ type: 'uint8array' }));
    expect(lignes.map(l => l.texte)).toContain('ines@exemple.fr');
    expect(photo).toBeNull();
  });
});
