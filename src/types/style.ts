// ============================================================================
//  Apparence d'un CV (modèle, couleurs, police, espacements)
// ============================================================================

/** Les 3 modèles de CV disponibles */
export type TemplateId = 'finance' | 'moderne' | 'rh';

/** Polices compatibles ATS (Calibri et Garamond sont affichées à l'écran avec Carlito et EB Garamond) */
export type PoliceId = 'Arial' | 'Calibri' | 'Georgia' | 'Garamond' | 'Inter' | 'Roboto';

export interface StyleCV {
  /** Couleur d'accent, ex. '#1f3a5f' (bleu marine) */
  couleur: string;
  police: PoliceId;
  /** Taille du texte courant, en points */
  taillePolice: number;
  /** Interligne, ex. 1.2 */
  interligne: number;
  /** Marges gauche/droite, en millimètres */
  marges: number;
  /** Espacement entre les sections : 1 = normal, 0.6 = serré */
  espacementSections: number;
  /** Titres de sections en MAJUSCULES */
  majusculesTitres: boolean;
}
