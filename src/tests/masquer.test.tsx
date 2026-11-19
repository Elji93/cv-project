// Coordonnées masquées (téléphone, LinkedIn, GitHub…) : gardées en mémoire, absentes du CV,
// du PDF, du Word, de la lettre et de l'analyse ATS
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { cvExemple } from '../data/cvExemple';
import { Feuille } from '../components/feuille/Feuille';
import { EnteteCv } from '../components/feuille/EnteteCv';
import { construireDocumentWord } from '../lib/export/exportWord';
import { analyserCv, texteBrutCv } from '../lib/ats/scoring';
import { estMasque, infosVisibles } from '../lib/cv';
import type { CV } from '../types';

const OFFRE = `Analyste financier H/F
Missions : reporting mensuel, analyse des écarts, clôtures. Maîtrise de Power BI et d'Excel exigée.
Profil : rigueur, esprit d'analyse, anglais courant.`;

function cvMasque(): CV {
  const cv = cvExemple();
  cv.donnees.infosPerso.telephone = '+33 6 11 22 33 44';
  cv.donnees.infosPerso.site = 'github.com/camille-exemple';
  cv.donnees.infosPerso.masques = ['telephone', 'site'];
  return cv;
}

describe('coordonnées masquées', () => {
  it('restent en mémoire mais sont vides dans ce qui est affiché', () => {
    const cv = cvMasque();
    expect(cv.donnees.infosPerso.telephone).toBe('+33 6 11 22 33 44');
    expect(estMasque(cv, 'telephone')).toBe(true);
    expect(estMasque(cv, 'email')).toBe(false);
    const v = infosVisibles(cv);
    expect([v.telephone, v.site]).toEqual(['', '']);
    expect(v.email).toBe(cv.donnees.infosPerso.email);
  });

  it('n’apparaissent ni sur la feuille (PDF) ni dans l’en-tête de la lettre, même en mode édition', () => {
    const cv = cvMasque();
    for (const html of [renderToStaticMarkup(<Feuille cv={cv} />), renderToStaticMarkup(<EnteteCv cv={cv} sansPhoto sansNaissance />)]) {
      expect(html).not.toContain('11 22 33 44');
      expect(html).not.toContain('github.com/camille-exemple');
      expect(html).toContain(cv.donnees.infosPerso.email);
    }
    // en mode édition (le texte est posé après l'affichage) : seules les coordonnées visibles ont un champ
    const edition = renderToStaticMarkup(<EnteteCv cv={cv} modifier={() => {}} />);
    expect(edition).not.toContain('Téléphone');
    expect(edition).not.toContain('Site / autre');
    expect(edition).toContain('Email');
  });

  it('n’apparaissent pas dans le fichier Word', async () => {
    const cv = cvMasque();
    const zip = await JSZip.loadAsync(await Packer.toBuffer(await construireDocumentWord(cv, false)));
    const doc = await zip.file('word/document.xml')!.async('string');
    expect(doc).not.toContain('11 22 33 44');
    expect(doc).not.toContain('camille-exemple');
    expect(doc).toContain(cv.donnees.infosPerso.email);
  });

  it('l’ATS les considère absentes, avec un conseil adapté (pas « complétez »)', () => {
    const cv = cvMasque();
    expect(texteBrutCv(cv)).not.toContain('11 22 33 44');
    const r = analyserCv(cv, OFFRE, '', true);
    const conformite = r.criteres.find(c => c.id === 'conformite')!;
    expect(JSON.stringify(conformite.verifications)).toMatch(/T[ée]l[ée]phone/);
    const textes = r.conseils.map(c => c.texte).join('\n');
    expect(textes).toMatch(/Vous avez masqué : téléphone/);
    expect(textes).not.toMatch(/Complétez vos coordonnées : téléphone/);
  });

  it('réaffichée, la coordonnée revient partout', () => {
    const cv = cvMasque();
    cv.donnees.infosPerso.masques = [];
    expect(renderToStaticMarkup(<Feuille cv={cv} />)).toContain('11 22 33 44');
    expect(texteBrutCv(cv)).toContain('github.com/camille-exemple');
  });
});
