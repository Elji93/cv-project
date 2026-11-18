// ============================================================================
//  Petits composants de formulaire réutilisés partout
// ============================================================================
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

/** Un libellé + son champ + une aide facultative */
export function Champ({ libelle, aide, children }: { libelle: string; aide?: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 mb-3 min-w-0">
      <span className="text-xs font-semibold text-gray-500">{libelle}</span>
      {children}
      {aide && <span className="text-[11.5px] text-gray-500 leading-snug">{aide}</span>}
    </label>
  );
}

type PropsTexte = { libelle: string; aide?: ReactNode; valeur: string; onValeur: (v: string) => void };

export function ChampTexte({ libelle, aide, valeur, onValeur, ...reste }: PropsTexte & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <Champ libelle={libelle} aide={aide}>
      <input className="input" value={valeur} onChange={e => onValeur(e.target.value)} {...reste} />
    </Champ>
  );
}

export function ZoneTexte({ libelle, aide, valeur, onValeur, ...reste }: PropsTexte & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'>) {
  return (
    <Champ libelle={libelle} aide={aide}>
      <textarea className="input resize-y leading-relaxed" value={valeur} onChange={e => onValeur(e.target.value)} {...reste} />
    </Champ>
  );
}

/** Encadré de conseil (bleu) ou d'avertissement (orange) */
export function Astuce({ children, ton = 'info' }: { children: ReactNode; ton?: 'info' | 'alerte' }) {
  return (
    <div className={`text-[12.5px] leading-relaxed rounded-lg px-3 py-2 mb-3 border ${ton === 'alerte' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-sky-50 border-sky-200 text-sky-900'}`}>
      {children}
    </div>
  );
}
