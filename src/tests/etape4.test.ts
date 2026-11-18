// Tests de l'étape 4 : export Word (structure du .docx) et nom de fichier
import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { cvExemple } from '../data/cvExemple';
import { construireDocumentWord } from '../lib/export/exportWord';
import { nomFichier } from '../lib/export/nomFichier';

async function xmlWord(cv = cvExemple()) {
  const zip = await JSZip.loadAsync(await Packer.toBuffer(await construireDocumentWord(cv, false)));
  return { doc: await zip.file('word/document.xml')!.async('string'), styles: await zip.file('word/styles.xml')!.async('string') };
}
const compter = (texte: string, motif: string) => texte.split(motif).length - 1;

describe('export Word', () => {
  it('utilise les vrais styles Word Titre / Titre 1 / Titre 2', async () => {
    const cv = cvExemple();
    const { doc, styles } = await xmlWord(cv);
    const sections = cv.ordreSections.filter(k => !cv.sectionsMasquees.includes(k)).length;
    expect(compter(doc, '<w:pStyle w:val="Title"/>')).toBe(1);
    expect(compter(doc, '<w:pStyle w:val="Heading1"/>')).toBe(sections);
    expect(compter(doc, '<w:pStyle w:val="Heading2"/>')).toBe(cv.donnees.experiences.length + cv.donnees.formations.length);
    expect(styles).toContain('<w:name w:val="heading 1"/>');
    expect(styles).toContain('<w:name w:val="heading 2"/>');
  });

  it('fait de vraies listes à puces, dans la police du CV, avec un interligne exact', async () => {
    const cv = cvExemple();
    const { doc } = await xmlWord(cv);
    const puces = [...cv.donnees.experiences, ...cv.donnees.formations].reduce((n, e) => n + e.puces.length, 0);
    expect(compter(doc, '<w:numPr>')).toBe(puces);
    expect(doc).toContain('w:ascii="Calibri"');
    expect(doc).toContain('w:lineRule="exact"');
    // une seule colonne : aucun tableau ni zone de texte
    expect(doc).not.toContain('<w:tbl>');
    expect(doc).not.toContain('<w:txbxContent>');
  });

  it('reprend tout le texte du CV', async () => {
    const cv = cvExemple();
    const { doc } = await xmlWord(cv);
    const texte = doc.replace(/<[^>]+>/g, '').replace(/&apos;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"');
    for (const e of cv.donnees.experiences) {
      expect(texte).toContain(e.poste);
      for (const p of e.puces) expect(texte).toContain(p.texte);
    }
    for (const q of cv.donnees.qualites) expect(texte).toContain(q);
  });
});

describe('nom de fichier', () => {
  it('CV_Prenom_Nom_Poste, sans accents ni caractères spéciaux', () => {
    const cv = cvExemple();
    expect(nomFichier(cv)).toBe('CV_Camille_Martin_Analyste_Financiere');
    cv.donnees.infosPerso.titre = 'Analyste M&A / Stage';
    expect(nomFichier(cv)).toBe('CV_Camille_Martin_Analyste_MandA_Stage');
  });
});
