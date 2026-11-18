// ============================================================================
//  Constantes d'affichage : couleurs, polices, style par défaut
//  (les modèles de CV sont décrits dans components/feuille/templates.ts)
// ============================================================================
import type { CleSection, NiveauCECRL, PoliceId, StyleCV } from '../types';

/** Ordre par défaut des sections */
export const ORDRE_PAR_DEFAUT: CleSection[] = [
  'accroche', 'experiences', 'formations', 'competences', 'qualites', 'langues', 'certifications', 'centresInteret',
];

/** Libellés courts des sections dans l'interface */
export const LIBELLES_SECTIONS: Record<CleSection, string> = {
  accroche: 'Accroche',
  experiences: 'Expériences',
  formations: 'Formation',
  competences: 'Compétences',
  qualites: 'Savoir-être',
  langues: 'Langues',
  certifications: 'Certifications',
  centresInteret: "Centres d'intérêt",
};

export const COULEURS: { nom: string; valeur: string }[] = [
  { nom: 'Bleu marine', valeur: '#1f3a5f' },
  { nom: 'Bordeaux', valeur: '#7b1e2b' },
  { nom: 'Anthracite', valeur: '#3a3f47' },
  { nom: 'Vert forêt', valeur: '#1e4d3a' },
  { nom: 'Noir', valeur: '#111111' },
];

/** css = rendu écran ; word = police écrite dans le fichier .docx */
export const POLICES: { id: PoliceId; css: string; word: string }[] = [
  { id: 'Calibri', css: 'Calibri, Carlito, Arial, sans-serif', word: 'Calibri' },
  { id: 'Arial', css: 'Arial, "Liberation Sans", Helvetica, sans-serif', word: 'Arial' },
  { id: 'Georgia', css: 'Georgia, "Times New Roman", serif', word: 'Georgia' },
  { id: 'Garamond', css: 'Garamond, "EB Garamond", "Times New Roman", serif', word: 'Garamond' },
  { id: 'Inter', css: 'Inter, Arial, sans-serif', word: 'Inter' },
  { id: 'Roboto', css: 'Roboto, Arial, sans-serif', word: 'Roboto' },
];

export const STYLE_PAR_DEFAUT: StyleCV = {
  couleur: '#1f3a5f',
  police: 'Calibri',
  taillePolice: 10.5,
  interligne: 1.22,
  marges: 14,
  espacementSections: 1,
  majusculesTitres: true,
};

/** Taille minimale utilisée par « Tout faire tenir sur 1 page » */
export const TAILLE_POLICE_MIN = 9.5;

export const NIVEAUX_CECRL: { id: NiveauCECRL; fr: string; en: string }[] = [
  { id: 'natif', fr: 'Langue maternelle', en: 'Native' },
  { id: 'C2', fr: 'Bilingue (C2)', en: 'Proficient (C2)' },
  { id: 'C1', fr: 'Courant (C1)', en: 'Fluent (C1)' },
  { id: 'B2', fr: 'Professionnel (B2)', en: 'Upper intermediate (B2)' },
  { id: 'B1', fr: 'Intermédiaire (B1)', en: 'Intermediate (B1)' },
  { id: 'A2', fr: 'Notions (A2)', en: 'Elementary (A2)' },
  { id: 'A1', fr: 'Débutant (A1)', en: 'Beginner (A1)' },
];
