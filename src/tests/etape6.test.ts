// Tests de l'étape 6 : lettre de motivation et suivi des candidatures
import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import JSZip from 'jszip';
import { cvExemple } from '../data/cvExemple';
import {
  aRelancer, brouillonLettre, candidatureVide, filtrerCandidatures, joursDepuis, lettreVierge, lieuDateAuto,
  nomFichierLettre, paragraphes, trierCandidatures, verifierLettre,
} from '../lib/lettre';
import { construireLettreWord } from '../lib/export/exportLettreWord';
import { creerSauvegarde } from '../lib/export/exportJson';
import { migrerDonnees } from '../store/migrations';
import { VERSION_SCHEMA, type DonneesApp } from '../types';

const cv = () => {
  const c = cvExemple();
  c.donnees.infosPerso.ville = 'Paris';
  return c;
};

describe('lettre de motivation', () => {
  it('reprend le CV relié et prépare objet, formules et destinataire', () => {
    const c = cv();
    const l = lettreVierge(c, { entreprise: 'KPMG', poste: 'Auditeur junior' });
    expect(l.cvId).toBe(c.id);
    expect(l.objet).toBe('Candidature au poste d’Auditeur junior');
    expect(l.appel).toBe('Madame, Monsieur,');
    expect(l.destinataire).toContain('KPMG');
    expect(l.nom).toBe('Lettre — KPMG');
    expect(lettreVierge(c, { poste: 'Contrôleur de gestion' }).objet).toBe('Candidature au poste de Contrôleur de gestion');
  });

  it('formules en anglais pour un CV anglais', () => {
    const c = cv();
    c.langue = 'en';
    const l = lettreVierge(c, { poste: 'M&A Analyst' });
    expect(l.appel).toBe('Dear Hiring Manager,');
    expect(l.objet).toBe('Application for the M&A Analyst position');
    expect(lieuDateAuto(c, new Date(2026, 10, 18))).toBe('Paris, 18 November 2026');
  });

  it('lieu et date en français (« 1er » le premier du mois)', () => {
    expect(lieuDateAuto(cv(), new Date(2026, 10, 18))).toBe('Paris, le 18 novembre 2026');
    expect(lieuDateAuto(cv(), new Date(2026, 2, 1))).toBe('Paris, le 1er mars 2026');
  });

  it('le brouillon est prérempli avec le CV et signale les passages à compléter', () => {
    const c = cv();
    const l = { ...lettreVierge(c, { entreprise: 'Mazars', poste: 'Auditeur' }) };
    l.corps = brouillonLettre(c, l);
    expect(paragraphes(l.corps)).toHaveLength(3);
    expect(l.corps).toContain('Mazars');
    expect(l.corps).toContain(c.donnees.experiences[0].entreprise);
    expect(verifierLettre(c, l).some(a => a.includes('crochets'))).toBe(true);
  });

  it('vérifie que l’entreprise est citée et que la lettre n’est pas vide', () => {
    const c = cv();
    const l = lettreVierge(c, { entreprise: 'EY' });
    expect(verifierLettre(c, l)).toContain('Le corps de la lettre est vide.');
    l.destinataire = '';
    l.corps = 'Bonjour.';
    expect(verifierLettre(c, l).some(a => a.includes('« EY »'))).toBe(true);
  });

  it('nom de fichier Lettre_Prenom_Nom_Entreprise', () => {
    const c = cv();
    const l = lettreVierge(c, { entreprise: 'Société Générale & Co' });
    const p = c.donnees.infosPerso;
    expect(nomFichierLettre(c, l)).toBe(`Lettre_${p.prenom}_${p.nom}_Societe_Generale_and_Co`);
  });

  it('export Word : en-tête du CV, police du CV, texte justifié', async () => {
    const c = cv();
    const l = lettreVierge(c, { entreprise: 'KPMG', poste: 'Auditeur junior' });
    l.corps = 'Premier paragraphe.\n\nDeuxième paragraphe.';
    const zip = await JSZip.loadAsync(await Packer.toBuffer(await construireLettreWord(c, l)));
    const doc = await zip.file('word/document.xml')!.async('string');
    expect(doc).toContain(c.donnees.infosPerso.titre.replace(/&/g, '&amp;'));
    expect(doc).toContain('Deuxième paragraphe.');
    expect(doc).toContain('Candidature au poste d’Auditeur junior');
    expect(doc).toContain('w:val="both"'); // justifié
    expect(doc).toContain('w:ascii="Calibri"');
    expect(doc).not.toContain('<w:tbl>');
  });
});

describe('suivi des candidatures', () => {
  const liste = [
    candidatureVide({ entreprise: 'KPMG', poste: 'Auditeur', dateEnvoi: '2026-11-01', scoreAts: 72, statut: 'envoyee' }),
    candidatureVide({ entreprise: 'Deloitte', poste: 'Analyste TS', dateEnvoi: '2026-11-15', scoreAts: 85, statut: 'entretien' }),
    candidatureVide({ entreprise: 'ey', poste: 'Contrôleur de gestion', dateEnvoi: '2026-10-20', scoreAts: null, statut: 'refus', notes: 'paie' }),
  ];

  it('trie par date, score (vides à la fin) et entreprise sans tenir compte des majuscules', () => {
    expect(trierCandidatures(liste, 'dateEnvoi', -1).map(c => c.entreprise)).toEqual(['Deloitte', 'KPMG', 'ey']);
    expect(trierCandidatures(liste, 'scoreAts', -1).map(c => c.entreprise)).toEqual(['Deloitte', 'KPMG', 'ey']);
    expect(trierCandidatures(liste, 'scoreAts', 1).map(c => c.entreprise)).toEqual(['KPMG', 'Deloitte', 'ey']);
    expect(trierCandidatures(liste, 'entreprise', 1).map(c => c.entreprise)).toEqual(['Deloitte', 'ey', 'KPMG']);
  });

  it('filtre par statut et par recherche (entreprise, poste, notes)', () => {
    expect(filtrerCandidatures(liste, ['entretien', 'refus'], '').map(c => c.entreprise)).toEqual(['Deloitte', 'ey']);
    expect(filtrerCandidatures(liste, [], 'controleur').map(c => c.entreprise)).toEqual(['ey']);
    expect(filtrerCandidatures(liste, [], 'PAIE')).toHaveLength(1);
  });

  it('signale les candidatures à relancer après 10 jours sans réponse', () => {
    const jour = new Date(2026, 10, 18);
    expect(joursDepuis('2026-11-01', jour)).toBe(17);
    expect(aRelancer(liste[0], jour)).toBe(true);
    expect(aRelancer(liste[1], jour)).toBe(false); // entretien
    expect(aRelancer({ ...liste[0], dateEnvoi: '2026-11-12' }, jour)).toBe(false);
  });

  it('candidatures et lettres sont incluses dans l’export JSON et relues à l’identique', () => {
    const c = cv();
    const l = lettreVierge(c, { entreprise: 'KPMG' });
    const d: DonneesApp = { versionSchema: VERSION_SCHEMA, cvs: [c], cvActifId: c.id, candidatures: [{ ...liste[0], lettreId: l.id, cvId: c.id }], lettres: [l], synonymesPerso: [] };
    const relu = migrerDonnees(JSON.parse(JSON.stringify(creerSauvegarde(d))));
    expect(relu.candidatures).toEqual(d.candidatures);
    expect(relu.lettres).toEqual(d.lettres);
  });

  it('complète les candidatures et lettres d’un ancien format', () => {
    const c = cv();
    const relu = migrerDonnees({
      cvs: [c], cvActifId: c.id,
      candidatures: [{ id: 'a', entreprise: 'KPMG', poste: 'Audit', dateEnvoi: '2026-01-05', cvId: null, scoreAts: null, statut: 'bizarre', notes: '' }],
      lettres: [{ id: 'l', cvId: c.id, destinataire: '', objet: 'Objet', corps: 'Texte', dateModification: '2026-01-05T00:00:00Z' }],
    });
    expect(relu.candidatures[0]).toMatchObject({ lettreId: null, lien: '', statut: 'envoyee' });
    expect(relu.lettres[0]).toMatchObject({ entreprise: '', appel: '', politesse: '', corps: 'Texte', nom: 'Lettre' });
  });
});
