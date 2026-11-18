// Liste déroulante « Envoyer vers… » une section du CV
import type { CleSection } from '../../types';
import { LIBELLES_SECTIONS, ORDRE_PAR_DEFAUT } from '../../data/constantes';

interface Props {
  valeur: CleSection | null;
  onChange: (s: CleSection | null) => void;
  /** Libellé de l'option « ne rien faire » */
  libelleAucune?: string;
}

export function ChoixSection({ valeur, onChange, libelleAucune = 'Laisser à classer' }: Props) {
  return (
    <select className="input py-1 text-xs" value={valeur ?? ''} onChange={e => onChange((e.target.value || null) as CleSection | null)} aria-label="Envoyer vers la section">
      <option value="">{libelleAucune}</option>
      {ORDRE_PAR_DEFAUT.map(s => <option key={s} value={s}>→ {LIBELLES_SECTIONS[s]}</option>)}
    </select>
  );
}
