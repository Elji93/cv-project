// Liste de puces modifiable : une ligne par puce, Entrée = nouvelle puce
import { Plus, Trash2 } from 'lucide-react';
import type { Puce } from '../../types';
import { puce } from '../../lib/cv';

interface Props {
  libelle: string;
  puces: Puce[];
  onChange: (modif: (puces: Puce[]) => void) => void;
  indication?: string;
}

export function EditeurPuces({ libelle, puces, onChange, indication = "Verbe d'action + résultat chiffré" }: Props) {
  const focaliser = (id: string) => setTimeout(() => document.querySelector<HTMLInputElement>(`[data-puce="${id}"]`)?.focus(), 0);
  const ajouter = (apres: number) => {
    const nouvelle = puce();
    onChange(l => { l.splice(apres + 1, 0, nouvelle); });
    focaliser(nouvelle.id);
  };
  return (
    <div className="mb-3">
      <span className="text-xs font-semibold text-gray-500">{libelle}</span>
      <ul className="mt-1 space-y-1.5">
        {puces.map((x, i) => (
          <li key={x.id} className="flex items-center gap-1.5">
            <span className="text-gray-400">•</span>
            <input
              className="input" data-puce={x.id} value={x.texte} placeholder={indication}
              onChange={e => onChange(l => { const t = l.find(y => y.id === x.id); if (t) t.texte = e.target.value; })}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); ajouter(i); }
                if (e.key === 'Backspace' && !x.texte && puces.length > 1) {
                  e.preventDefault();
                  onChange(l => { l.splice(i, 1); });
                  if (i > 0) focaliser(puces[i - 1].id);
                }
              }}
            />
            <button className="icon-btn text-gray-400 hover:text-red-600" aria-label="Supprimer la puce" onClick={() => onChange(l => { l.splice(i, 1); })}><Trash2 size={14} /></button>
          </li>
        ))}
      </ul>
      <button className="btn-sm mt-1.5" onClick={() => ajouter(puces.length - 1)}><Plus size={13} /> Ajouter une puce</button>
    </div>
  );
}
