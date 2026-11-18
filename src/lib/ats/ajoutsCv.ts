// ============================================================================
//  Mots-clés de l'offre ajoutés au CV depuis l'analyseur : ils vont dans le groupe
//  « Compétences clés ». On peut les retirer en décochant (seulement ceux de ce groupe,
//  pour ne jamais toucher aux compétences saisies ailleurs).
// ============================================================================
import type { CV } from '../../types';
import { uid } from '../cv';
import { mots } from './normalisation';

/** Groupe de compétences qui reçoit les mots-clés ajoutés (« Compétences clés », « Key skills »…) */
const GROUPE_CLES = /cl[ée]s|offre|key/i;
export const groupeCles = (cv: CV) => cv.donnees.competences.find(g => GROUPE_CLES.test(g.categorie));

const memeTerme = (a: string, b: string) => { const x = mots(a).join(' '); return !!x && x === mots(b).join(' '); };

/** Ajoute des mots-clés au groupe « Compétences clés » (créé en tête s'il n'existe pas) */
export function ajouterMotsCles(cv: CV, termes: string[]) {
  let g = groupeCles(cv);
  if (!g) { g = { id: uid(), categorie: 'Compétences clés', elements: [] }; cv.donnees.competences.unshift(g); }
  g.elements = [...g.elements, ...termes.filter(t => !g!.elements.some(e => memeTerme(e, t)))];
  g.masquee = false;
  cv.sectionsMasquees = cv.sectionsMasquees.filter(h => h !== 'competences');
}

/** Ce mot-clé (sous l'une de ses formes) est-il dans le groupe « Compétences clés » ? */
export const motAjoute = (cv: CV, termes: string[]) =>
  !!groupeCles(cv)?.elements.some(e => termes.some(t => memeTerme(e, t)));

/** Retire le mot-clé du groupe « Compétences clés » ; le groupe disparaît s'il devient vide */
export function retirerMotCle(cv: CV, termes: string[]) {
  const g = groupeCles(cv);
  if (!g) return;
  g.elements = g.elements.filter(e => !termes.some(t => memeTerme(e, t)));
  if (!g.elements.length) cv.donnees.competences = cv.donnees.competences.filter(x => x !== g);
}
