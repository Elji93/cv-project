// ============================================================================
//  Tout ce qui est sauvegardé dans le navigateur et exporté en JSON
// ============================================================================
import type { CV } from './cv';
import type { Candidature } from './candidature';
import type { LettreMotivation } from './lettre';

/** Équivalence ajoutée par l'utilisatrice, ex. ['SIRH', 'HRIS', 'Workday'] */
export interface EquivalencePerso {
  id: string;
  termes: string[];
}

export const VERSION_SCHEMA = 3;

export interface DonneesApp {
  /** Numéro de version du format, pour les migrations futures */
  versionSchema: typeof VERSION_SCHEMA;
  cvs: CV[];
  cvActifId: string;
  candidatures: Candidature[];
  lettres: LettreMotivation[];
  synonymesPerso: EquivalencePerso[];
}
