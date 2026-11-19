// En-tête d'un bloc (expérience, formation…) avec boutons monter / descendre / supprimer
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Eye, EyeOff, Trash2 } from 'lucide-react';
import { confirmer } from '../../store/dialogues';

interface Props {
  titre: string;
  premier: boolean;
  dernier: boolean;
  onMonter: () => void;
  onDescendre: () => void;
  onSupprimer: () => void;
  /** Case « Sur le CV » (réserve) : absente si non fournie */
  surCv?: boolean;
  onSurCv?: (v: boolean) => void;
  /** Bloc replié (entrée en réserve) : clic sur le titre pour déplier */
  replie?: boolean;
  onDeplier?: () => void;
}

export function OutilsBloc({ titre, premier, dernier, onMonter, onDescendre, onSupprimer, surCv, onSurCv, replie, onDeplier }: Props) {
  return (
    <div className={`flex items-center gap-1 ${replie ? '' : 'mb-2'}`}>
      {onSurCv && (
        // Même bouton œil que pour les coordonnées : masquer garde l'entrée en mémoire (réserve)
        <button type="button" onClick={() => onSurCv(!surCv)} aria-pressed={!!surCv}
          title={surCv ? 'Affiché sur le CV. Cliquer pour le masquer : l’entrée reste en mémoire (réserve).' : 'Masqué : n’apparaît pas sur le CV. Cliquer pour l’afficher.'}
          className={`shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${surCv ? 'text-gray-500 hover:text-gray-800 hover:bg-gray-100' : 'bg-gray-200 text-gray-700'}`}>
          {surCv ? <><Eye size={13} /> Sur le CV</> : <><EyeOff size={13} /> Masqué</>}
        </button>
      )}
      {onDeplier ? (
        <button className="flex-1 min-w-0 inline-flex items-center gap-1 text-left" onClick={onDeplier} aria-expanded={!replie}>
          {replie ? <ChevronRight size={14} className="shrink-0" /> : <ChevronDown size={14} className="shrink-0" />}
          <strong className={`text-[13px] truncate ${surCv === false ? 'text-gray-500' : ''}`}>{titre}</strong>
        </button>
      ) : <strong className="flex-1 text-[13px] truncate">{titre}</strong>}
      <button className="icon-btn" aria-label="Monter" disabled={premier} onClick={onMonter}><ArrowUp size={14} /></button>
      <button className="icon-btn" aria-label="Descendre" disabled={dernier} onClick={onDescendre}><ArrowDown size={14} /></button>
      <button className="icon-btn text-red-600" aria-label="Supprimer" onClick={async () => { if (await confirmer({ titre: 'Supprimer ce bloc ?', message: `« ${titre} » sera supprimé (Ctrl+Z pour annuler).`, libelleOk: 'Supprimer', danger: true })) onSupprimer(); }}><Trash2 size={14} /></button>
    </div>
  );
}

/** Échange un élément avec son voisin dans un tableau (modifie le tableau) */
export function deplacer<T>(liste: T[], i: number, sens: -1 | 1) {
  const j = i + sens;
  if (j < 0 || j >= liste.length) return;
  [liste[i], liste[j]] = [liste[j], liste[i]];
}
