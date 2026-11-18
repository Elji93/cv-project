// ============================================================================
//  Sauvegarde dans le localStorage du navigateur
// ============================================================================
import type { DonneesApp } from '../types';
import { cvExemple } from '../data/cvExemple';
import { donneesVides, migrerDonnees } from './migrations';

export const CLE_STOCKAGE = 'cvstudio.v3';
const ANCIENNES_CLES = { cvs: 'cvstudio.v2.cvs', actif: 'cvstudio.v2.current' };

export const DELAI_SAUVEGARDE_MS = 500;

/** Lit les données au démarrage : format actuel, sinon anciennes données migrées, sinon CV exemple */
export function chargerDonnees(stockage: Storage | undefined = globalThis.localStorage): DonneesApp {
  try {
    const actuel = stockage?.getItem(CLE_STOCKAGE);
    if (actuel) return migrerDonnees(JSON.parse(actuel));

    const ancien = stockage?.getItem(ANCIENNES_CLES.cvs);
    if (ancien) {
      const d = migrerDonnees(JSON.parse(ancien));
      const actif = stockage?.getItem(ANCIENNES_CLES.actif);
      if (actif && d.cvs.some(c => c.id === actif)) d.cvActifId = actif;
      return d;
    }
  } catch (e) {
    console.warn('Données locales illisibles, chargement du CV exemple', e);
  }
  return donneesVides([cvExemple()]);
}

/** Écrit immédiatement. Renvoie un message d'erreur, ou null si tout va bien. */
export function ecrireDonnees(d: DonneesApp, stockage: Storage | undefined = globalThis.localStorage): string | null {
  try {
    stockage?.setItem(CLE_STOCKAGE, JSON.stringify(d));
    return null;
  } catch {
    return 'Sauvegarde impossible : le stockage du navigateur est plein (photo trop lourde ?). Exportez vos données en JSON.';
  }
}

/**
 * Sauvegarde différée : on attend 500 ms sans modification avant d'écrire.
 * `vider()` force l'écriture immédiate (appelé quand on quitte ou recharge la page).
 */
export function creerSauvegardeDifferee(ecrire: () => void) {
  let minuteur: ReturnType<typeof setTimeout> | undefined;
  let enAttente = false;
  return {
    planifier() {
      enAttente = true;
      clearTimeout(minuteur);
      minuteur = setTimeout(() => { enAttente = false; ecrire(); }, DELAI_SAUVEGARDE_MS);
    },
    vider() {
      if (!enAttente) return;
      clearTimeout(minuteur);
      enAttente = false;
      ecrire();
    },
  };
}
