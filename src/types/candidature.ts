// Suivi des candidatures (étape 6)
export type StatutCandidature = 'envoyee' | 'relance' | 'entretien' | 'refus' | 'offre';

export interface Candidature {
  id: string;
  entreprise: string;
  poste: string;
  /** Date ISO (AAAA-MM-JJ) */
  dateEnvoi: string;
  /** Version du CV envoyée */
  cvId: string | null;
  /** Lettre de motivation envoyée avec */
  lettreId: string | null;
  scoreAts: number | null;
  statut: StatutCandidature;
  /** Lien vers l'offre */
  lien: string;
  notes: string;
}
