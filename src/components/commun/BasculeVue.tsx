// Sur téléphone et tablette en portrait : on bascule entre la saisie et l'aperçu A4
// (sur grand écran, les deux sont côte à côte et ce bouton est masqué)
import type { ReactNode } from 'react';
import { Eye, PenLine } from 'lucide-react';

export type Vue = 'saisie' | 'apercu';

export function BasculeVue({ vue, onVue }: { vue: Vue; onVue: (v: Vue) => void }) {
  const bouton = (v: Vue, libelle: string, icone: ReactNode) => (
    <button onClick={() => onVue(v)} aria-pressed={vue === v}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[13px] font-semibold ${vue === v ? 'bg-white text-brand-2 shadow-sm' : 'text-gray-600'}`}>
      {icone}{libelle}
    </button>
  );
  return (
    <div className="lg:hidden flex gap-1 p-1 m-2 mb-0 rounded-lg bg-gray-200/80">
      {bouton('saisie', 'Modifier', <PenLine size={14} />)}
      {bouton('apercu', 'Aperçu A4', <Eye size={14} />)}
    </div>
  );
}

/** Classes à appliquer : la partie masquée reste montée (on garde sa position de défilement) */
export const classesVue = (vue: Vue) => ({
  saisie: vue === 'apercu' ? 'hidden lg:flex' : 'flex',
  apercu: vue === 'saisie' ? 'hidden lg:flex' : 'flex',
});
