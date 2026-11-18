// Réserve d'expériences / formations (cocher pour afficher sur le CV) et sous-rubriques du classement
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { cvExemple } from '../data/cvExemple';
import { LIBELLES_SECTIONS } from '../data/constantes';
import { Feuille } from '../components/feuille/Feuille';
import { construireDocumentWord } from '../lib/export/exportWord';
import { analyserCv, suggestionsReserve, texteBrutCv } from '../lib/ats/scoring';
import { affichees, experienceVide, formationVide } from '../lib/cv';
import { classerLignes, libelleDestination } from '../lib/import/classer';
import { recommander } from '../lib/ats/recommandations';

const OFFRE = `Analyste Transaction Services
Vous réaliserez des due diligences financières et des analyses de qualité des résultats (EBITDA normatif).
Profil : maîtrise d'Excel exigée, connaissance de la consolidation IFRS appréciée.`;

/** CV exemple + une expérience en réserve qui parle de due diligence */
function cvAvecReserve() {
  const cv = cvExemple();
  const e = experienceVide();
  Object.assign(e, { poste: 'Stagiaire Due Diligence', entreprise: 'Cabinet Réserve', masquee: true, puces: [{ id: 'p1', texte: 'Réalisé 4 due diligences financières (EBITDA normatif, dette nette)' }] });
  cv.donnees.experiences.push(e);
  const f = formationVide();
  Object.assign(f, { diplome: 'Certificat de chinois', etablissement: 'Institut Réserve', masquee: true });
  cv.donnees.formations.push(f);
  return cv;
}

describe('réserve : les entrées décochées restent en mémoire mais ne sont pas sur le CV', () => {
  it('ne sont affichées ni sur la feuille ni dans le Word', async () => {
    const cv = cvAvecReserve();
    const html = renderToStaticMarkup(<Feuille cv={cv} />);
    expect(html).not.toContain('Cabinet Réserve');
    expect(html).not.toContain('Institut Réserve');
    expect(html).toContain(cv.donnees.experiences[0].entreprise);
    const zip = await JSZip.loadAsync(await Packer.toBuffer(await construireDocumentWord(cv, false)));
    const doc = await zip.file('word/document.xml')!.async('string');
    expect(doc).not.toContain('Cabinet Réserve');
    expect(cv.donnees.experiences).toHaveLength(4); // toujours en mémoire
    expect(affichees(cv.donnees.experiences)).toHaveLength(3);
  });

  it('ne comptent pas dans le score ATS ni dans le texte du prompt IA', () => {
    const cv = cvAvecReserve();
    expect(texteBrutCv(cv)).not.toContain('Cabinet Réserve');
    const avant = analyserCv(cv, OFFRE, '', true);
    cv.donnees.experiences[3].masquee = false;
    const apres = analyserCv(cv, OFFRE, '', true);
    expect(texteBrutCv(cv)).toContain('Cabinet Réserve');
    expect(apres.total).toBeGreaterThanOrEqual(avant.total);
  });

  it('l’analyseur signale une entrée en réserve qui correspond à l’offre', () => {
    const cv = cvAvecReserve();
    const s = suggestionsReserve(cv, analyserCv(cv, OFFRE, '', true));
    expect(s.map(x => x.libelle)).toEqual(['Stagiaire Due Diligence — Cabinet Réserve']);
    expect(s[0].motsCles.length).toBeGreaterThanOrEqual(2);
  });
});

describe('sous-rubriques : envoyer un texte vers un champ précis d’une entrée existante', () => {
  const fragment = (texte: string) => [{ id: 'f', texte, sectionDetectee: null }];

  it('missions, dates et poste d’une expérience existante', () => {
    const d = cvExemple().donnees;
    const e = d.experiences[1];
    const nbPuces = e.puces.length;
    classerLignes(d, fragment('• Construit un modèle LBO\n• Préparé 3 mémos d’investissement pour le\ncomité'), 'f', [], `exp.${e.id}.puces`);
    expect(e.puces.slice(nbPuces).map(p => p.texte)).toEqual(['Construit un modèle LBO', 'Préparé 3 mémos d’investissement pour le comité']);
    classerLignes(d, fragment('Sept. 2022 - Mars 2023'), 'f', [], `exp.${e.id}.dates`);
    expect(e.periode).toEqual({ debut: '2022-09', fin: '2023-03', enCours: false });
    classerLignes(d, fragment('Poste : Analyste M&A'), 'f', [], `exp.${e.id}.poste`);
    expect(e.poste).toBe('Analyste M&A');
  });

  it('des dates illisibles restent à classer', () => {
    const d = cvExemple().donnees;
    const f = d.formations[0];
    const reste = classerLignes(d, fragment('bientôt'), 'f', [], `form.${f.id}.dates`);
    expect(reste[0].texte).toBe('bientôt');
  });

  it('école d’une formation, groupe de compétences, accroche remplacée, savoir-être', () => {
    const d = cvExemple().donnees;
    const f = d.formations[0];
    classerLignes(d, fragment('ESSEC Business School'), 'f', [], `form.${f.id}.etablissement`);
    expect(f.etablissement).toBe('ESSEC Business School');
    const g = d.competences[0];
    classerLignes(d, fragment('Power BI, Alteryx'), 'f', [], `comp.${g.id}`);
    expect(g.elements).toEqual(expect.arrayContaining(['Power BI', 'Alteryx']));
    classerLignes(d, fragment('Nouvelle accroche\nsur deux lignes'), 'f', [], 'accroche.remplacer');
    expect(d.accroche).toBe('Nouvelle accroche sur deux lignes');
    classerLignes(d, fragment('Rigueur, autonomie'), 'f', [], 'qualites');
    expect(d.qualites).toEqual(expect.arrayContaining(['Rigueur', 'autonomie']));
  });

  it('libellés lisibles', () => {
    const d = cvExemple().donnees;
    const e = d.experiences[0];
    expect(libelleDestination(`exp.${e.id}.dates`, LIBELLES_SECTIONS, d)).toBe(`Expérience « ${e.poste} » › Dates`);
    expect(libelleDestination('accroche.remplacer', LIBELLES_SECTIONS)).toBe('Accroche (remplacer)');
  });
});

describe('réserve partout : certifications, groupes de compétences, langues', () => {
  function cvComplet() {
    const cv = cvExemple();
    cv.donnees.certifications = [
      { id: 'c1', intitule: 'Certification AMF', organisme: 'AMF', annee: '2024' },
      { id: 'c2', intitule: 'Cisco CCNA', organisme: 'Cisco', annee: '2022', masquee: true },
    ];
    cv.donnees.competences.push({ id: 'g-res', categorie: 'Réseaux', elements: ['VLAN', 'Routage OSPF'], masquee: true });
    cv.donnees.langues.push({ id: 'l-res', langue: 'Italien', niveau: 'B1', precision: '', masquee: true });
    return cv;
  }

  it('absents de la feuille, du Word et du texte analysé, mais toujours en mémoire', async () => {
    const cv = cvComplet();
    const html = renderToStaticMarkup(<Feuille cv={cv} />);
    for (const t of ['Cisco CCNA', 'Routage OSPF', 'Italien']) expect(html, t).not.toContain(t);
    expect(html).toContain('Certification AMF');
    const doc = await (await JSZip.loadAsync(await Packer.toBuffer(await construireDocumentWord(cv, false)))).file('word/document.xml')!.async('string');
    for (const t of ['Cisco CCNA', 'Routage OSPF', 'Italien']) expect(doc, t).not.toContain(t);
    expect(texteBrutCv(cv)).not.toMatch(/CCNA|OSPF|Italien/);
    expect(cv.donnees.certifications).toHaveLength(2);
  });

  it('l’analyseur propose de remettre la certification et le groupe correspondant à l’offre', () => {
    const cv = cvComplet();
    const offre = 'Administrateur réseaux\nVous gérez les VLAN et le routage OSPF des sites.\nProfil : certification CCNA exigée, italien apprécié.';
    const s = suggestionsReserve(cv, analyserCv(cv, offre, '', true));
    expect(s.map(x => x.type).sort()).toEqual(['certification', 'competences', 'langue']);
  });

  it('carte « Booster » : la certification en réserve est reconnue (pas proposée à rajouter)', () => {
    const cv = cvComplet();
    const r = recommander(cv, 'Technicien réseaux : routage, VLAN, Cisco, CCNA exigée, switching, DHCP.');
    const ccna = r.tous.flatMap(p => p.certifications).find(c => c.id === 'ccna')!;
    expect(ccna.surCv).toBe(false);
    expect(ccna.enReserve).toEqual(['c2']);
  });
});
