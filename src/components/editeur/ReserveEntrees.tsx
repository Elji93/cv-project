// ============================================================================
//  Réserve d'expériences / de formations : tout reste en mémoire,
//  on coche ce qui apparaît sur le CV (pratique pour adapter le CV à chaque offre).
// ============================================================================
import { Archive, Check } from 'lucide-react';

export interface EntreeReserve {
  id: string;
  libelle: string;
  detail: string;
  masquee?: boolean;
}

interface Props {
  /** « expériences », « formations » */
  quoi: string;
  entrees: EntreeReserve[];
  onBasculer: (id: string, afficher: boolean) => void;
  onTout: (afficher: boolean) => void;
}

export function ReserveEntrees({ quoi, entrees, onBasculer, onTout }: Props) {
  if (entrees.length < 2) return null;
  const surCv = entrees.filter(e => !e.masquee).length;
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3 mb-3">
      <div className="flex items-center gap-2 mb-1">
        <Archive size={15} className="text-brand-2" />
        <strong className="text-[13px] flex-1">Sur le CV : {surCv} / {entrees.length} {quoi}</strong>
        <button className="text-[11.5px] text-brand-2 underline" onClick={() => onTout(surCv < entrees.length)}>
          {surCv < entrees.length ? 'Tout cocher' : 'Tout décocher'}
        </button>
      </div>
      <p className="text-[11.5px] text-gray-600 mb-2">Décochez une entrée pour la garder en réserve : elle reste en mémoire mais n'apparaît plus sur le CV, le PDF, le Word ni dans le score ATS.</p>
      <ul className="space-y-0.5">
        {entrees.map(e => (
          <li key={e.id}>
            <label className={`flex items-start gap-2 rounded-md px-1.5 py-1 cursor-pointer text-[12.5px] ${e.masquee ? 'text-gray-500' : 'text-gray-800'} hover:bg-white`}>
              <input type="checkbox" className="mt-0.5" checked={!e.masquee} onChange={ev => onBasculer(e.id, ev.target.checked)} />
              <span className="min-w-0 flex-1">
                <span className={`font-medium ${e.masquee ? 'line-through decoration-gray-300' : ''}`}>{e.libelle}</span>
                {e.detail && <span className="text-gray-500"> — {e.detail}</span>}
              </span>
              {!e.masquee && <Check size={13} className="text-emerald-600 shrink-0 mt-0.5" />}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
