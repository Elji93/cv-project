// ============================================================================
//  Zone « À classer » : textes importés que l'outil n'a pas su ranger.
//  Ils restent enregistrés avec le CV : on peut les traiter plus tard.
// ============================================================================
import { lazy, Suspense, useState } from 'react';
import { ChevronDown, ChevronRight, Inbox } from 'lucide-react';
import { useCvActif, useModifierCv } from '../../store/useAppStore';
// La liste (et la reconnaissance des CV qu'elle utilise) n'est chargée que s'il y a quelque chose à classer
const ListeAClasser = lazy(() => import('./ListeAClasser').then(m => ({ default: m.ListeAClasser })));

export function ZoneAClasser() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  const [ouvert, setOuvert] = useState(true);
  if (!cv.aClasser.length) return null;

  return (
    <div className="mx-3 mt-3 rounded-lg border border-amber-300 bg-amber-50 text-[13px]">
      <button className="w-full flex items-center gap-2 px-3 py-2 font-semibold text-amber-900" onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert}>
        {ouvert ? <ChevronDown size={15} /> : <ChevronRight size={15} />}<Inbox size={15} /> À classer
        <span className="ml-auto rounded-full bg-amber-500 text-white text-[11px] px-2">{cv.aClasser.length}</span>
      </button>
      {ouvert && (
        <div className="px-3 pb-3 space-y-2 max-h-[45vh] overflow-auto">
          <p className="text-[11.5px] text-amber-900">Cochez les lignes qui vont ensemble (ex. un poste, son entreprise, ses dates et ses puces), puis choisissez la section. Vérifiez ensuite le résultat sur la feuille.</p>
          <Suspense fallback={<p className="text-[11.5px] text-amber-900">Chargement…</p>}><ListeAClasser cv={cv} modifier={modifier} /></Suspense>
        </div>
      )}
    </div>
  );
}
