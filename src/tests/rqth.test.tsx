// Mention RQTH facultative : rien par défaut ; en-tête, bas du CV ou lettre seulement, au choix
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { cvExemple } from '../data/cvExemple';
import { Feuille } from '../components/feuille/Feuille';
import { construireDocumentWord } from '../lib/export/exportWord';
import { texteBrutCv } from '../lib/ats/scoring';
import { ajouterPhraseRqth, brouillonLettre } from '../lib/lettre';
import { phraseRqthLettre } from '../lib/rqth';
import { ajouterTexte } from '../lib/import/classer';
import type { CV, EmplacementRqth } from '../types';

const avec = (e?: EmplacementRqth, langue: 'fr' | 'en' = 'fr'): CV => {
  const cv = cvExemple();
  cv.langue = langue;
  if (e) cv.donnees.infosPerso.mentionRqth = e;
  return cv;
};
const feuille = (cv: CV) => renderToStaticMarkup(<Feuille cv={cv} />);
const entete = (html: string) => html.slice(0, html.indexOf('</header>'));
const word = async (cv: CV) => (await (await JSZip.loadAsync(await Packer.toBuffer(await construireDocumentWord(cv, false)))).file('word/document.xml')!.async('string'));

describe('mention RQTH', () => {
  it('par défaut : nulle part (CV, Word, ATS, brouillon de lettre)', async () => {
    const cv = avec();
    expect(feuille(cv)).not.toMatch(/RQTH/);
    expect(await word(cv)).not.toMatch(/RQTH/);
    expect(texteBrutCv(cv)).not.toMatch(/RQTH/);
    expect(brouillonLettre(cv, { entreprise: 'ACME', poste: 'Analyste' })).not.toMatch(/RQTH/);
  });

  it('dans l’en-tête : avec les coordonnées, pas en bas', async () => {
    const cv = avec('entete');
    const html = feuille(cv);
    expect(entete(html)).toContain('RQTH');
    expect(html).not.toContain('cv-mention');
    expect(await word(cv)).toContain('RQTH');
    expect(texteBrutCv(cv).split('\n').slice(0, 3).join(' ')).toContain('RQTH');
  });

  it('en bas du CV : une ligne après les sections, pas dans l’en-tête', async () => {
    const cv = avec('bas');
    const html = feuille(cv);
    expect(entete(html)).not.toContain('RQTH');
    expect(html).toContain('<p class="cv-mention">RQTH</p>');
    expect(html.lastIndexOf('cv-mention')).toBeGreaterThan(html.lastIndexOf('</section>'));
    expect(await word(cv)).toContain('>RQTH<');
    expect(texteBrutCv(cv).trim().endsWith('RQTH')).toBe(true);
  });

  it('seulement dans la lettre : rien sur le CV, une phrase dans le brouillon et un bouton pour une lettre déjà écrite', () => {
    const cv = avec('lettre');
    expect(feuille(cv)).not.toMatch(/RQTH/);
    const brouillon = brouillonLettre(cv, { entreprise: 'ACME', poste: 'Analyste' });
    expect(brouillon).toContain(phraseRqthLettre(cv));
    // la phrase arrive avant le dernier paragraphe (demande d'entretien)
    expect(brouillon.trim().split(/\n\n/).at(-1)).toMatch(/entretien/);
    const corps = 'Paragraphe vous.\n\nParagraphe moi.\n\nParagraphe nous, entretien.';
    const ajoute = ajouterPhraseRqth(corps, phraseRqthLettre(cv));
    expect(ajoute.split('\n\n')).toEqual(['Paragraphe vous.', 'Paragraphe moi.', phraseRqthLettre(cv), 'Paragraphe nous, entretien.']);
    expect(ajouterPhraseRqth(ajoute, phraseRqthLettre(cv))).toBe(ajoute); // pas de doublon
  });

  it('CV en français : « RQTH » seul, sans précision', () => {
    const haut = entete(feuille(avec('entete')));
    expect(haut).toContain('<span>RQTH</span>');
    expect(haut).not.toMatch(/recognised|disability|travailleur/i);
    const bas = feuille(avec('bas'));
    expect(bas).toContain('<p class="cv-mention">RQTH</p>');
    expect(phraseRqthLettre(avec('lettre'))).toMatch(/^Je bénéficie/);
  });

  it('version anglaise du CV : mention courte en anglais, et phrase de lettre en anglais', () => {
    expect(entete(feuille(avec('entete', 'en')))).toContain('<span>Recognised disability (RQTH)</span>');
    expect(feuille(avec('bas', 'en'))).toContain('<p class="cv-mention">Recognised disability (RQTH)</p>');
    expect(phraseRqthLettre(avec('lettre', 'en'))).toMatch(/^I also hold a recognised disability status \(RQTH\)/);
    expect(brouillonLettre(avec('lettre', 'en'), { entreprise: 'ACME', poste: 'Analyst' })).toContain('I also hold a recognised disability status (RQTH)');
  });

  it('import : « Envoyer vers… › Mention RQTH » active l’option sans recopier la ligne', () => {
    const cv = avec();
    expect(ajouterTexte(cv.donnees, 'RQTH', 'infos.rqth')).toEqual([]);
    expect(cv.donnees.infosPerso.mentionRqth).toBe('entete');
    expect(cv.donnees.infosPerso.site).not.toMatch(/RQTH/);
  });
});
