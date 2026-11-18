// ============================================================================
//  Mesure de la feuille : tient-elle sur une page A4 ?
// ============================================================================
import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';

/** 297 mm et 210 mm convertis en pixels CSS (96 px par pouce) */
export const HAUTEUR_A4_PX = (297 * 96) / 25.4;
export const LARGEUR_A4_PX = (210 * 96) / 25.4;

/** Petite tolérance pour les arrondis */
export const tientSurUnePage = (hauteur: number) => hauteur <= HAUTEUR_A4_PX + 2;

export function useMesurePage(ref: RefObject<HTMLElement | null>) {
  const [hauteur, setHauteur] = useState(HAUTEUR_A4_PX);

  // Mesure immédiate après chaque affichage (le texte vient de changer)
  useLayoutEffect(() => {
    const h = ref.current?.scrollHeight;
    if (h !== undefined && h !== hauteur) setHauteur(h);
  });

  // Mesure aussi quand la taille change pour une autre raison (chargement des polices…)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mesurer = () => setHauteur(el.scrollHeight);
    mesurer();
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    document.fonts?.ready.then(mesurer);
    return () => obs.disconnect();
  }, [ref]);
  return {
    hauteur,
    tient: tientSurUnePage(hauteur),
    depassementPct: Math.max(0, Math.round((hauteur / HAUTEUR_A4_PX - 1) * 100)),
  };
}
