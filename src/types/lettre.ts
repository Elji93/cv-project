// Lettre de motivation (étape 6)
export interface LettreMotivation {
  id: string;
  /** Nom affiché dans la liste, ex. « Lettre — KPMG » */
  nom: string;
  /** Reprend l'en-tête, la police et la couleur de ce CV */
  cvId: string;
  /** Entreprise et poste visés (pour le nom du fichier et le suivi) */
  entreprise: string;
  poste: string;
  /** Bloc destinataire, sur plusieurs lignes */
  destinataire: string;
  /** « Paris, le 18 novembre 2026 » — vide : ville du CV + date du jour */
  lieuDate: string;
  objet: string;
  /** « Madame, Monsieur, » */
  appel: string;
  /** Paragraphes séparés par une ligne vide */
  corps: string;
  /** Formule de politesse */
  politesse: string;
  dateCreation: string;
  dateModification: string;
}
