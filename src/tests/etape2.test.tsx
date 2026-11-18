// Tests de l'étape 2 : templates (aucune perte de données), langue des intitulés
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { CV, TemplateId } from '../types';
import { cvExemple } from '../data/cvExemple';
import { Feuille } from '../components/feuille/Feuille';
import { groupesAffiches, TEMPLATES } from '../components/feuille/templates';
import { migrerDonnees } from '../store/migrations';
import { useAppStore } from '../store/useAppStore';

/** Texte visible de la feuille (balises retirées) */
const texte = (cv: CV) => renderToStaticMarkup(<Feuille cv={cv} />).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"');

/** Tous les textes saisis dans le CV */
function tousLesTextes(cv: CV): string[] {
  const d = cv.donnees;
  return [
    d.infosPerso.prenom, d.infosPerso.titre, d.infosPerso.email, d.accroche,
    ...d.experiences.flatMap(e => [e.poste, e.entreprise, ...e.puces.map(p => p.texte)]),
    ...d.formations.flatMap(f => [f.diplome, f.etablissement, ...f.puces.map(p => p.texte)]),
    ...d.competences.flatMap(g => g.elements),
    ...d.qualites,
    ...d.langues.map(l => l.langue),
    ...d.certifications.map(c => c.intitule),
    ...d.centresInteret,
  ].filter(Boolean);
}

describe('templates', () => {
  const ids: TemplateId[] = TEMPLATES.map(t => t.id);

  it.each(ids)('le modèle %s affiche toutes les informations', id => {
    const cv = { ...cvExemple(), templateId: id };
    const t = texte(cv);
    for (const morceau of tousLesTextes(cv)) expect(t).toContain(morceau);
  });

  it('changer de modèle ne modifie pas les données (y compris la photo)', () => {
    const cv = cvExemple();
    cv.donnees.infosPerso.photo = { image: 'data:image/jpeg;base64,AAAA', forme: 'rond', zoom: 1.4, decalageX: 5, decalageY: -3, affichee: true };
    useAppStore.setState({ ...migrerDonnees({ cvs: [cv] }), passe: [], futur: [] });
    const avant = structuredClone(useAppStore.getState().cvs[0].donnees);
    for (const id of ['moderne', 'rh', 'finance', 'moderne'] as TemplateId[]) {
      useAppStore.getState().modifierCv(c => { c.templateId = id; });
      expect(useAppStore.getState().cvs[0].donnees).toEqual(avant);
    }
  });

  it('photo : petite (20 mm) en Finance, normale (28 mm) en Moderne, absente en RH', () => {
    const cv = cvExemple();
    cv.donnees.infosPerso.photo = { image: 'data:image/jpeg;base64,AAAA', forme: 'carre', zoom: 1, decalageX: 0, decalageY: 0, affichee: true };
    expect(renderToStaticMarkup(<Feuille cv={{ ...cv, templateId: 'finance' }} />)).toContain('width:20mm');
    expect(renderToStaticMarkup(<Feuille cv={{ ...cv, templateId: 'moderne' }} />)).toContain('width:28mm');
    expect(renderToStaticMarkup(<Feuille cv={{ ...cv, templateId: 'rh' }} />)).not.toContain('cv-photo');
  });

  it('la photo est facultative : décochée, elle disparaît de la feuille', () => {
    const cv = cvExemple();
    cv.donnees.infosPerso.photo = { image: 'data:image/jpeg;base64,AAAA', forme: 'rond', zoom: 1, decalageX: 0, decalageY: 0, affichee: false };
    expect(renderToStaticMarkup(<Feuille cv={cv} />)).not.toContain('cv-photo');
  });

  it('le modèle RH place les outils en premier, sans toucher aux données', () => {
    const cv = cvExemple();
    expect(cv.donnees.competences[0].categorie).toBe('Techniques');
    expect(groupesAffiches(cv.donnees.competences, 'rh')[0].categorie).toBe('Outils');
    expect(groupesAffiches(cv.donnees.competences, 'finance')[0].categorie).toBe('Techniques');
    expect(renderToStaticMarkup(<Feuille cv={{ ...cv, templateId: 'rh' }} />)).toContain('cv-skill outils');
  });
});

describe('langue du CV', () => {
  it('les intitulés de sections et les dates suivent la langue', () => {
    const cv = cvExemple();
    const fr = texte(cv);
    const en = texte({ ...cv, langue: 'en' });
    expect(fr).toContain('Expériences professionnelles');
    expect(fr).toContain('Sept. 2024');
    expect(en).toContain('Professional Experience');
    expect(en).toContain('Education');
    expect(en).toContain('Sep 2024');
    expect(en).toContain('Fluent (C1)');
  });
});
