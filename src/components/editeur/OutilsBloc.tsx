// En-tête d'un bloc (expérience, formation…) avec boutons monter / descendre / supprimer
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
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
        <label className="inline-flex items-center gap-1 text-[11px] text-gray-600 shrink-0 cursor-pointer" title="Afficher cette entrée sur le CV">
          <input type="checkbox" checked={!!surCv} onChange={e => onSurCv(e.target.checked)} /> Sur le CV
        </label>
      )}
      {onDeplier ? (
        <button className="flex-1 min-w-0 inline-flex items-center gap-1 text-left" onClick={onDeplier} aria-expanded={!replie}>
          {replie ? <ChevronRight size={14} className="shrink-0" /> : <ChevronDown size={14} className="shrink-0" />}
          <strong className={`text-[13px] truncate ${surCv === false ? 'text-gray-500' : ''}`}>{titre}</strong>
          {surCv === false && <span className="shrink-0 text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">En réserve</span>}
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
