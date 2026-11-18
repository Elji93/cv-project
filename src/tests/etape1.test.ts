// Tests de l'étape 1 : dates, migrations, sauvegarde JSON, persistance, annuler / rétablir
import { beforeEach, describe, expect, it } from 'vitest';
import { decouperListe } from '../lib/cv';
import { formaterPeriode, lireDate, lirePeriode } from '../lib/dates';
import { cvDepuisV2, migrerDonnees, niveauDepuisTexte } from '../store/migrations';
import { chargerDonnees, CLE_STOCKAGE, ecrireDonnees } from '../store/persistance';
import { creerSauvegarde } from '../lib/export/exportJson';
import { cvExemple } from '../data/cvExemple';
import { extraireDonnees, useAppStore } from '../store/useAppStore';
import * as H from '../store/historique';

describe('dates', () => {
  it('lit les formats courants', () => {
    expect(lireDate('Sept. 2024')).toBe('2024-09');
    expect(lireDate('09/2024')).toBe('2024-09');
    expect(lireDate('September 2024')).toBe('2024-09');
    expect(lireDate('févr. 23')).toBe('2023-02');
    expect(lireDate('2023')).toBe('2023');
    expect(lireDate('bonjour')).toBeNull();
  });
  it('affiche en français et en anglais', () => {
    const p = { debut: '2024-09', fin: '', enCours: true };
    expect(formaterPeriode(p, 'fr')).toBe('Sept. 2024 – Présent');
    expect(formaterPeriode(p, 'en')).toBe('Sep 2024 – Present');
    expect(lirePeriode('Janv. 2024 - Juin 2024')).toEqual({ debut: '2024-01', fin: '2024-06', enCours: false });
  });
});

describe('listes', () => {
  it('ne coupe pas les virgules entre parenthèses', () => {
    expect(decouperListe('Excel (TCD, VBA), SAP, Power BI')).toEqual(['Excel (TCD, VBA)', 'SAP', 'Power BI']);
  });
});

describe('migration depuis la version 2', () => {
  const ancien = {
    id: 'abc', name: 'Mon CV', personal: { firstName: 'Léa', lastName: 'Durand', title: 'Analyste', email: 'lea@x.fr', photo: '' },
    experience: [{ id: 'e1', org: 'Banque', role: 'Stagiaire', start: 'Janv. 2024', end: 'Présent', bullets: ['Analysé 30 dossiers', ''] }],
    education: [{ id: 'f1', org: 'ESSEC', role: 'Master', start: '2022', end: '2024', bullets: [] }],
    activities: [{ id: 'a1', org: 'BDE', role: 'Trésorière', bullets: ['Budget 20 k€'] }],
    skills: [{ id: 's1', category: 'Outils', items: 'Excel (TCD, VBA), SAP' }],
    languages: [{ id: 'l1', name: 'Anglais', level: 'Courant (TOEIC 950)' }],
    interests: 'Tennis, Échecs',
    order: ['education', 'experience', 'activities', 'skills'], hidden: ['interests'],
    style: { template: 'modern', accent: '#7b1e2b', font: 'Georgia', fontSize: 10 },
  };
  const cv = cvDepuisV2(ancien);

  it('convertit le contenu sans rien perdre', () => {
    expect(cv.id).toBe('abc');
    expect(cv.donnees.infosPerso.prenom).toBe('Léa');
    expect(cv.donnees.experiences[0].periode).toEqual({ debut: '2024-01', fin: '', enCours: true });
    expect(cv.donnees.experiences[0].puces.map(p => p.texte)).toEqual(['Analysé 30 dossiers']);
    expect(cv.donnees.formations[0]).toMatchObject({ etablissement: 'ESSEC', diplome: 'Master' });
    expect(cv.donnees.competences[0].elements).toEqual(['Excel (TCD, VBA)', 'SAP']);
    expect(cv.donnees.langues[0]).toMatchObject({ niveau: 'C1', precision: 'TOEIC 950' });
    expect(cv.donnees.centresInteret).toEqual(['Tennis', 'Échecs']);
    expect(cv.templateId).toBe('moderne');
    expect(cv.style).toMatchObject({ couleur: '#7b1e2b', police: 'Georgia', taillePolice: 10 });
  });
  it('garde l’ordre et place les activités dans « À classer »', () => {
    expect(cv.ordreSections.slice(0, 3)).toEqual(['formations', 'experiences', 'competences']);
    expect(cv.sectionsMasquees).toEqual(['centresInteret']);
    expect(cv.aClasser).toHaveLength(1);
    expect(cv.aClasser[0].texte).toContain('Budget 20 k€');
  });
  it('reconnaît les niveaux de langue', () => {
    expect(niveauDepuisTexte('Langue maternelle').niveau).toBe('natif');
    expect(niveauDepuisTexte('Intermédiaire (B2)')).toEqual({ niveau: 'B2', precision: '' });
  });
});

describe('sauvegarde JSON', () => {
  it('export puis import redonne exactement les mêmes données', () => {
    const d = migrerDonnees({ cvs: [cvExemple(), cvExemple()], cvActifId: 'x' });
    const fichier = JSON.parse(JSON.stringify(creerSauvegarde(d)));
    const relu = migrerDonnees(fichier);
    expect(relu).toEqual(d);
  });
  it('refuse un fichier inconnu', () => {
    expect(() => migrerDonnees({ bonjour: 1 })).toThrow();
  });
});

describe('persistance localStorage', () => {
  beforeEach(() => localStorage.clear());
  it('relit ce qui a été écrit', () => {
    const d = migrerDonnees({ cvs: [cvExemple()] });
    expect(ecrireDonnees(d)).toBeNull();
    expect(chargerDonnees()).toEqual(d);
  });
  it('migre automatiquement les anciennes données', () => {
    localStorage.setItem('cvstudio.v2.cvs', JSON.stringify([{ id: 'old', name: 'Ancien', personal: { firstName: 'Paul' } }]));
    const d = chargerDonnees();
    expect(d.cvs[0].donnees.infosPerso.prenom).toBe('Paul');
    expect(localStorage.getItem(CLE_STOCKAGE)).toBeNull();
  });
});

describe('annuler / rétablir', () => {
  beforeEach(() => {
    H.couperRegroupement();
    useAppStore.setState({ ...migrerDonnees({ cvs: [cvExemple()] }), passe: [], futur: [] });
  });
  const accroche = () => useAppStore.getState().cvs[0].donnees.accroche;

  it('annule puis rétablit une modification', () => {
    const avant = accroche();
    useAppStore.getState().modifierCv(c => { c.donnees.accroche = 'Nouvelle accroche'; });
    useAppStore.getState().annuler();
    expect(accroche()).toBe(avant);
    useAppStore.getState().retablir();
    expect(accroche()).toBe('Nouvelle accroche');
  });
  it('regroupe une frappe rapide en une seule action', () => {
    const avant = accroche();
    for (const t of ['A', 'An', 'Ana']) useAppStore.getState().modifierCv(c => { c.donnees.accroche = t; });
    useAppStore.getState().annuler();
    expect(accroche()).toBe(avant);
  });
  it('annule une suppression de CV', () => {
    useAppStore.getState().creerCv('vierge', 'Test');
    const id = useAppStore.getState().cvActifId;
    useAppStore.getState().supprimerCv(id);
    expect(useAppStore.getState().cvs.some(c => c.id === id)).toBe(false);
    useAppStore.getState().annuler();
    expect(useAppStore.getState().cvs.some(c => c.id === id)).toBe(true);
  });
  it('garde au maximum 50 actions', () => {
    for (let i = 0; i < 60; i++) { H.couperRegroupement(); useAppStore.getState().renommerCv(useAppStore.getState().cvs[0].id, 'v' + i); }
    expect(useAppStore.getState().passe).toHaveLength(50);
    expect(extraireDonnees(useAppStore.getState()).cvs[0].nom).toBe('v59');
  });
});

describe('suppression de plusieurs CV', () => {
  beforeEach(() => {
    H.couperRegroupement();
    useAppStore.setState({ ...migrerDonnees({ cvs: [cvExemple(), cvExemple(), cvExemple()] }), passe: [], futur: [] });
  });
  it('supprime la sélection en une action, annulable d’un seul Ctrl+Z', () => {
    const [a, b, c] = useAppStore.getState().cvs.map(x => x.id);
    useAppStore.getState().supprimerCvs([a, b]);
    expect(useAppStore.getState().cvs.map(x => x.id)).toEqual([c]);
    expect(useAppStore.getState().cvActifId).toBe(c);
    useAppStore.getState().annuler();
    expect(useAppStore.getState().cvs.map(x => x.id)).toEqual([a, b, c]);
  });
  it('tout supprimer laisse un CV vierge', () => {
    useAppStore.getState().supprimerCvs(useAppStore.getState().cvs.map(x => x.id));
    expect(useAppStore.getState().cvs).toHaveLength(1);
    expect(useAppStore.getState().cvs[0].nom).toBe('Nouveau CV');
  });
});
