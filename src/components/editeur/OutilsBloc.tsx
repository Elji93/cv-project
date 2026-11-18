// En-tête d'un bloc (expérience, formation…) avec boutons monter / descendre / supprimer
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { confirmer } from '../../store/dialogues';

interface Props {
  titre: string;
  premier: boolean;
  dernier: boolean;
  onMonter: () => void;
  onDescendre: () => void;
  onSupprimer: () => void;
}

export function OutilsBloc({ titre, premier, dernier, onMonter, onDescendre, onSupprimer }: Props) {
  return (
    <div className="flex items-center gap-1 mb-2">
      <strong className="flex-1 text-[13px] truncate">{titre}</strong>
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
