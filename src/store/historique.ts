// ============================================================================
//  Annuler / rétablir : on garde des « photos » (instantanés) des données
// ============================================================================
import type { DonneesApp } from '../types';

/** Ce qui est mémorisé à chaque action (les tableaux ne sont jamais modifiés sur place, donc pas de copie) */
export type Instantane = Pick<DonneesApp, 'cvs' | 'cvActifId' | 'candidatures' | 'lettres' | 'synonymesPerso'>;

export const TAILLE_HISTORIQUE = 50;

/** Les frappes rapprochées dans le même CV comptent pour une seule action */
const DELAI_REGROUPEMENT_MS = 1000;

export interface Historique {
  passe: Instantane[];
  futur: Instantane[];
}

let derniereCle = '';
let dernierInstant = 0;

/** Faut-il créer une nouvelle entrée d'historique pour cette modification ? */
export function nouvelleEntree(cle: string, instant = Date.now()): boolean {
  const regrouper = cle !== '' && cle === derniereCle && instant - dernierInstant < DELAI_REGROUPEMENT_MS;
  derniereCle = cle;
  dernierInstant = instant;
  return !regrouper;
}

/** Oublie le regroupement en cours (après annuler / rétablir) */
export function couperRegroupement() {
  derniereCle = '';
  dernierInstant = 0;
}

/** Ajoute l'état « avant » au passé (max 50) et vide le futur */
export function memoriser(h: Historique, avant: Instantane): Historique {
  return { passe: [...h.passe, avant].slice(-TAILLE_HISTORIQUE), futur: [] };
}

export function annuler(h: Historique, actuel: Instantane): { h: Historique; etat: Instantane } | null {
  if (!h.passe.length) return null;
  const etat = h.passe[h.passe.length - 1];
  return { h: { passe: h.passe.slice(0, -1), futur: [actuel, ...h.futur].slice(0, TAILLE_HISTORIQUE) }, etat };
}

export function retablir(h: Historique, actuel: Instantane): { h: Historique; etat: Instantane } | null {
  if (!h.futur.length) return null;
  const etat = h.futur[0];
  return { h: { passe: [...h.passe, actuel].slice(-TAILLE_HISTORIQUE), futur: h.futur.slice(1) }, etat };
}
