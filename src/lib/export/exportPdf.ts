// PDF : impression navigateur de la zone #print-root (texte vectoriel, sélectionnable)
import type { CV } from '../../types';
import { nomFichier } from './nomFichier';

/** Ouvre la fenêtre d'impression ; « titre » devient le nom proposé pour le PDF */
export function imprimer(titre: string, apres?: () => void) {
  const ancien = document.title;
  document.title = titre; // nom proposé par « Enregistrer au format PDF »
  const remettre = () => { document.title = ancien; window.removeEventListener('afterprint', remettre); apres?.(); };
  window.addEventListener('afterprint', remettre);
  window.setTimeout(() => window.print(), 50);
}

export const exporterPdf = (cv: CV) => imprimer(nomFichier(cv));
