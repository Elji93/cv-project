// ============================================================================
//  « Sauvegarder mes données » / « Restaurer » au format JSON
// ============================================================================
import { saveAs } from 'file-saver';
import type { DonneesApp } from '../../types';
import { migrerDonnees } from '../../store/migrations';

export interface FichierSauvegarde {
  application: 'CV Studio';
  exporteLe: string;
  donnees: DonneesApp;
}

/** Contenu du fichier de sauvegarde (toutes les données) */
export const creerSauvegarde = (d: DonneesApp): FichierSauvegarde => ({
  application: 'CV Studio',
  exporteLe: new Date().toISOString(),
  donnees: d,
});

/** Télécharge la sauvegarde complète */
export function telechargerSauvegarde(d: DonneesApp) {
  const jour = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(creerSauvegarde(d), null, 2)], { type: 'application/json' });
  saveAs(blob, `cv-studio-sauvegarde-${jour}.json`);
}

/** Lit un fichier JSON (sauvegarde complète ou CV seul, ancien ou nouveau format) */
export async function lireSauvegarde(fichier: File): Promise<{ donnees: DonneesApp; complete: boolean }> {
  let brut: unknown;
  try { brut = JSON.parse(await fichier.text()); }
  catch { throw new Error("Ce fichier n'est pas un JSON valide."); }
  const complete = !!brut && typeof brut === 'object' && ('application' in brut || 'cvs' in brut);
  return { donnees: migrerDonnees(brut), complete };
}
