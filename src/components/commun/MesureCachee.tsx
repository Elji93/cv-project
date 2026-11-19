// ============================================================================
//  Rendu invisible d'une feuille, uniquement pour la mesurer (tient-elle sur une page ?).
//  La boîte est fixe, de taille nulle et coupe ce qui dépasse : la copie cachée
//  (au moins 297 mm de haut) ne peut jamais agrandir la page. Sans cela, Firefox
//  rendait toute la page défilable et laissait une grande zone vide en bas.
// ============================================================================
import type { ReactNode } from 'react';

export function MesureCachee({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" data-mesure-cachee=""
      style={{ position: 'fixed', left: 0, top: 0, width: 0, height: 0, overflow: 'hidden', visibility: 'hidden', pointerEvents: 'none' }}>
      {children}
    </div>
  );
}
