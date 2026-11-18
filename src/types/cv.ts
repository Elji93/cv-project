// ============================================================================
//  Structure d'un CV
// ============================================================================
import type { StyleCV, TemplateId } from './style';

/** Langue du CV : change les intitulés de sections et le format des dates */
export type LangueCV = 'fr' | 'en';

/** Les sections que l'on peut réordonner / masquer */
export type CleSection =
  | 'accroche'
  | 'experiences'
  | 'formations'
  | 'competences'
  | 'qualites'
  | 'langues'
  | 'certifications'
  | 'centresInteret';

/**
 * Une date au format « AAAA-MM » (ex. '2024-09') ou « AAAA » (ex. '2024'), ou '' si inconnue.
 * L'affichage s'adapte à la langue : « Sept. 2024 » / « Sep 2024 ».
 */
export type MoisAnnee = string;

export interface Periode {
  debut: MoisAnnee;
  /** Ignorée si enCours = true */
  fin: MoisAnnee;
  /** Affiche « Présent » / « Present » */
  enCours: boolean;
}

/** Une puce de liste. L'identifiant stable sert à l'édition directe et au glisser-déposer. */
export interface Puce {
  id: string;
  texte: string;
}

export interface Photo {
  /** Image compressée (dataURL JPEG) */
  image: string;
  forme: 'carre' | 'rond';
  /** Zoom de 1 à 3 */
  zoom: number;
  /** Décalage horizontal et vertical, de -50 à 50 (%) */
  decalageX: number;
  decalageY: number;
  /** Permet de garder la photo en mémoire sans l'afficher */
  affichee: boolean;
}

export interface InfosPerso {
  prenom: string;
  nom: string;
  /** Intitulé du poste visé : 1er critère des ATS */
  titre: string;
  email: string;
  telephone: string;
  ville: string;
  linkedin: string;
  site: string;
  /** Facultatif, texte libre : « 12/03/2003 », « 22 ans »… */
  dateNaissance: string;
  photo: Photo | null;
}

export interface Experience {
  id: string;
  poste: string;
  entreprise: string;
  ville: string;
  periode: Periode;
  puces: Puce[];
  /** En réserve : gardée en mémoire mais absente du CV (feuille, PDF, Word, score ATS) */
  masquee?: boolean;
}

export interface Formation {
  id: string;
  diplome: string;
  etablissement: string;
  ville: string;
  periode: Periode;
  /** Mention, cours, mémoire… */
  puces: Puce[];
  /** En réserve : gardée en mémoire mais absente du CV */
  masquee?: boolean;
}

/** Un groupe de compétences, ex. « Outils » : Excel, SAP, Power BI */
export interface GroupeCompetences {
  id: string;
  categorie: string;
  /** Un élément = un mot-clé (plus fiable pour le score ATS) */
  elements: string[];
  /** En réserve : gardé(e) en mémoire mais absent(e) du CV */
  masquee?: boolean;
}

export type NiveauCECRL = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'natif';

export interface Langue {
  id: string;
  langue: string;
  niveau: NiveauCECRL;
  /** Facultatif, ex. « TOEIC 945 » */
  precision: string;
  /** En réserve : gardé(e) en mémoire mais absent(e) du CV */
  masquee?: boolean;
}

export interface Certification {
  id: string;
  intitule: string;
  organisme: string;
  annee: string;
  /** En réserve : gardé(e) en mémoire mais absent(e) du CV */
  masquee?: boolean;
}

/** Morceau de texte importé que l'outil n'a pas su classer (à traiter plus tard) */
export interface FragmentAClasser {
  id: string;
  texte: string;
  /** Section suggérée par l'outil, à confirmer */
  sectionDetectee: CleSection | null;
}

/** Le contenu du CV */
export interface DonneesCV {
  infosPerso: InfosPerso;
  accroche: string;
  /** Si alternance : affiché dans le Profil, ex. « 3 semaines en entreprise / 1 semaine à l'école » */
  rythmeAlternance: string;
  experiences: Experience[];
  formations: Formation[];
  competences: GroupeCompetences[];
  /** Savoir-être / traits de personnalité : « Rigueur », « Esprit d'équipe »… */
  qualites: string[];
  langues: Langue[];
  certifications: Certification[];
  centresInteret: string[];
}

/** Une version de CV */
export interface CV {
  id: string;
  /** Nom de la version, ex. « CV M&A — Banque XYZ » */
  nom: string;
  langue: LangueCV;
  templateId: TemplateId;
  style: StyleCV;
  ordreSections: CleSection[];
  sectionsMasquees: CleSection[];
  /** Titres modifiés à la main ; sinon titre standard selon la langue */
  titresPersonnalises: Partial<Record<CleSection, string>>;
  /** Dates ISO 8601 */
  dateCreation: string;
  dateModification: string;
  donnees: DonneesCV;
  /** Texte importé restant à classer (vide pour un CV créé à la main) */
  aClasser: FragmentAClasser[];
  /** Date d'import (ISO) si ce CV vient d'un fichier importé (PDF, Word…) */
  importeLe?: string;
}
