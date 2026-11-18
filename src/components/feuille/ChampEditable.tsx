// ============================================================================
//  Champ de texte modifiable directement sur la feuille A4 (contentEditable)
//  - texte brut uniquement : le collage depuis Word est nettoyé
//  - le DOM n'est réécrit que si la valeur change « de l'extérieur »
//    (panneau, annuler…), pour ne pas faire sauter le curseur pendant la frappe
// ============================================================================
import { useLayoutEffect, useRef, type KeyboardEvent } from 'react';

interface Props {
  valeur: string;
  /** Appelé à chaque frappe */
  onChange?: (v: string) => void;
  /** Appelé seulement en quittant le champ (utile pour les dates, relues à ce moment) */
  onValider?: (v: string) => void;
  indication: string;
  className?: string;
  /** Entrée : action personnalisée (ex. nouvelle puce) au lieu de quitter le champ */
  onEntree?: () => void;
  /** Retour arrière dans un champ vide (ex. supprimer la puce) */
  onEffacerVide?: () => void;
  /** Repère pour replacer le curseur après ajout / suppression de puce */
  repere?: string;
  bloc?: boolean;
}

/** Nettoie un texte : pas de retours à la ligne ni d'espaces multiples */
const nettoyer = (t: string) => t.replace(/[\r\n\t]+/g, ' ').replace(/ /g, ' ').replace(/ {2,}/g, ' ');

export function ChampEditable({ valeur, onChange, onValider, indication, className = '', onEntree, onEffacerVide, repere, bloc }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerText !== valeur) el.textContent = valeur;
  }, [valeur]);

  const surTouche = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (onEntree) onEntree();
      else ref.current?.blur();
    } else if (e.key === 'Backspace' && onEffacerVide && !ref.current?.innerText.trim()) {
      e.preventDefault();
      onEffacerVide();
    } else if (e.key === 'Escape') {
      ref.current?.blur();
    }
  };

  return (
    <span
      ref={ref}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck
      role="textbox"
      aria-label={indication}
      data-ph={indication}
      data-repere={repere}
      className={`${className}${bloc ? ' block-edit' : ''}`}
      onInput={e => onChange?.(nettoyer(e.currentTarget.innerText || ''))}
      onBlur={e => onValider?.(nettoyer(e.currentTarget.innerText || '').trim())}
      onKeyDown={surTouche}
      onPaste={e => {
        // Collage : on ne garde que le texte, sans aucune mise en forme
        e.preventDefault();
        document.execCommand('insertText', false, nettoyer(e.clipboardData.getData('text/plain')));
      }}
      onDrop={e => e.preventDefault()}
    />
  );
}

/** Place le curseur à la fin du champ portant ce repère (réessaie le temps que React l'affiche) */
export function placerCurseur(repere: string, essai = 0) {
  window.setTimeout(() => {
    const el = document.querySelector<HTMLElement>(`#apercu .cv-page [data-repere="${CSS.escape(repere)}"]`);
    if (!el) { if (essai < 10) placerCurseur(repere, essai + 1); return; }
    el.focus();
    const r = document.createRange();
    r.selectNodeContents(el);
    r.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
  }, 0);
}

/** Libère le champ actif : tous les textes de la feuille se resynchronisent */
export function libererFocus() {
  (document.activeElement as HTMLElement | null)?.blur?.();
}
