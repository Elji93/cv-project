// Version anglaise / française d'un CV (aller-retour avec une IA)
import { describe, expect, it } from 'vitest';
import { cvExemple } from '../data/cvExemple';
import { contenuTraduisible, creerVersion, lireReponse, promptTraduction, traduireNomLangue } from '../lib/traduction';
import { titreSection } from '../lib/cv';

/** Simule la réponse d'une IA : traduit quelques textes, garde les ids */
function reponseIA(cv = cvExemple()) {
  const c = contenuTraduisible(cv);
  c.titre = 'Financial Analyst — Audit & Transaction Services';
  c.accroche = 'Financial analyst with a Master’s degree in Accounting, Control & Audit.';
  c.experiences[0].poste = 'Financial Auditor (work-study)';
  c.experiences[0].puces[0].texte = 'Audited the annual and consolidated accounts of 6 clients (revenue €50M to €1.2bn)';
  c.formations[0].diplome = 'Master CCA (MSc in Accounting, Control & Audit)';
  c.competences[0].categorie = 'Technical skills';
  c.qualites = ['Rigour', 'Analytical mind'];
  c.langues[0].langue = 'French';
  return `Voici la traduction :\n\`\`\`json\n${JSON.stringify(c)}\n\`\`\`\nBonne candidature !`;
}

describe('version traduite d’un CV', () => {
  it('le prompt contient le contenu en JSON avec les ids et les consignes', () => {
    const cv = cvExemple();
    const p = promptTraduction(cv, 'en');
    expect(p).toContain(cv.donnees.experiences[0].id);
    expect(p).toContain(cv.donnees.experiences[0].puces[0].texte);
    expect(p).toContain('Ne traduis pas les noms propres');
    expect(p).toContain('```json');
  });

  it('lit la réponse de l’IA, même entourée de texte', () => {
    expect(lireReponse(reponseIA()).titre).toBe('Financial Analyst — Audit & Transaction Services');
    const brut = JSON.stringify(contenuTraduisible(cvExemple()));
    expect(lireReponse(`Sure! ${brut} Hope this helps`).experiences).toHaveLength(3);
    expect(() => lireReponse('Désolé, je ne peux pas.')).toThrow(/JSON/);
    expect(() => lireReponse('```json\n{"autre": 1}\n```')).toThrow(/experiences/);
  });

  it('crée un nouveau CV en anglais, texte remplacé par id, original intact', () => {
    const cv = cvExemple();
    const { cv: en, remplaces, ignores } = creerVersion(cv, 'en', lireReponse(reponseIA(cv)));
    expect(en.id).not.toBe(cv.id);
    expect(en.nom).toBe(`${cv.nom} (EN)`);
    expect(en.langue).toBe('en');
    expect(titreSection(en, 'experiences')).toBe('Professional Experience');
    expect(en.donnees.infosPerso.titre).toBe('Financial Analyst — Audit & Transaction Services');
    expect(en.donnees.experiences[0].puces[0].texte).toMatch(/^Audited the annual/);
    expect(en.donnees.experiences[0].puces[0].id).toBe(cv.donnees.experiences[0].puces[0].id);
    expect(en.donnees.qualites).toEqual(['Rigour', 'Analytical mind']);
    expect(en.donnees.experiences[0].entreprise).toBe(cv.donnees.experiences[0].entreprise);
    expect(remplaces).toBeGreaterThan(20);
    expect(ignores).toBe(0);
    // l'original n'a pas bougé
    expect(cv.langue).toBe('fr');
    expect(cv.donnees.infosPerso.titre).not.toMatch(/^Financial/);
  });

  it('ignore les éléments inventés par l’IA et ne supprime rien', () => {
    const cv = cvExemple();
    const c = contenuTraduisible(cv);
    c.experiences = [{ id: 'invente', poste: 'Hacker', entreprise: '', ville: '', puces: [] }];
    const { cv: en, ignores } = creerVersion(cv, 'en', c);
    expect(ignores).toBe(1);
    expect(en.donnees.experiences).toHaveLength(cv.donnees.experiences.length);
    expect(en.donnees.experiences.some(e => e.poste === 'Hacker')).toBe(false);
  });

  it('sans IA : copie avec langues et « En cours » traduits', () => {
    const cv = cvExemple();
    cv.donnees.certifications = [{ id: 'c', intitule: 'CFA Level I', organisme: 'CFA Institute', annee: 'En cours' }];
    const { cv: en, remplaces } = creerVersion(cv, 'en');
    expect(remplaces).toBe(0);
    expect(en.donnees.langues.map(l => l.langue)).toEqual(cv.donnees.langues.map(l => traduireNomLangue(l.langue, 'en')));
    expect(en.donnees.langues[0].langue).toBe('French');
    expect(en.donnees.certifications[0].annee).toBe('In progress');
    expect(creerVersion(en, 'fr').cv.nom).toBe(`${cv.nom} (FR)`);
  });
});
