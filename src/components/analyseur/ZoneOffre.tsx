// ============================================================================
//  Zone de texte de l'offre (analyseur) : elle remplit toute la carte (pas de vide
//  sous la zone) et s'agrandit avec le texte au lieu d'afficher sa propre barre de défilement.
// ============================================================================
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

/** Hauteur minimale (px) : environ 8 lignes */
const HAUTEUR_MIN = 230;

interface Props {
  value: string;
  onChange: (texte: string) => void;
  placeholder?: string;
}

export function ZoneOffre({ value, onChange, placeholder }: Props) {
  const zone = useRef<HTMLTextAreaElement>(null);

  // Hauteur naturelle du texte, mesurée sans l'étirement de la carte (sinon elle ne rétrécirait jamais)
  const ajuster = useCallback(() => {
    const el = zone.current;
    if (!el) return;
    el.style.flex = 'none';
    el.style.height = 'auto';
    const bordures = el.offsetHeight - el.clientHeight;
    el.style.height = `${Math.max(HAUTEUR_MIN, el.scrollHeight + bordures)}px`;
    el.style.flex = '';
  }, []);

  useLayoutEffect(ajuster, [value, ajuster]);
  // La largeur change (fenêtre redimensionnée) : le texte se replie autrement
  useEffect(() => {
    window.addEventListener('resize', ajuster);
    return () => window.removeEventListener('resize', ajuster);
  }, [ajuster]);

  return (
    <textarea ref={zone} className="input grow shrink-0 resize-none overflow-hidden leading-relaxed" style={{ minHeight: HAUTEUR_MIN }}
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  );
}
