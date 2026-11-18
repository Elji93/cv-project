// ============================================================================
//  Raccourcis clavier globaux
//  Ctrl+Z annuler · Ctrl+Y ou Ctrl+Maj+Z rétablir
//  Ctrl+S sauvegarde JSON · Ctrl+P export PDF (CV, ou lettre sur la page Lettre)
//  (Cmd sur Mac)
// ============================================================================
import { useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';

/** Événement envoyé par Ctrl+P : une page peut le prendre en charge (ex. la lettre) avec preventDefault() */
export const EVENEMENT_PDF = 'cvstudio:pdf';

interface Actions {
  /** Ctrl+P quand aucune page ne l'a pris en charge : PDF du CV */
  onPdf: () => void;
  /** Ctrl+S */
  onSauvegarder: () => void;
}

export function useRaccourcis(actions: Actions) {
  const ref = useRef(actions);
  ref.current = actions;
  useEffect(() => {
    const surTouche = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const t = e.key.toLowerCase();
      if (t === 's') {
        e.preventDefault(); // pas de « Enregistrer la page » du navigateur
        if (!e.repeat) ref.current.onSauvegarder();
        return;
      }
      if (t === 'p') {
        e.preventDefault(); // la fenêtre d'impression s'ouvre après l'aide, sur la bonne feuille
        if (e.repeat) return;
        const pasPrisEnCharge = window.dispatchEvent(new Event(EVENEMENT_PDF, { cancelable: true }));
        if (pasPrisEnCharge) ref.current.onPdf();
        return;
      }
      const annuler = t === 'z' && !e.shiftKey;
      const retablir = t === 'y' || (t === 'z' && e.shiftKey);
      if (!annuler && !retablir) return;
      // L'historique de l'application remplace celui du navigateur, y compris dans les champs
      e.preventDefault();
      (document.activeElement as HTMLElement | null)?.blur?.(); // les champs se resynchronisent
      if (annuler) useAppStore.getState().annuler();
      else useAppStore.getState().retablir();
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, []);
}
