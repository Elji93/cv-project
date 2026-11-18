// Liste déroulante « Envoyer vers… » : un champ des infos perso (ville, date de naissance, nom…)
// ou une rubrique du CV
import { LIBELLES_SECTIONS, ORDRE_PAR_DEFAUT } from '../../data/constantes';
import { CHAMPS_INFOS, type Destination } from '../../lib/import/classer';

interface Props {
  valeur: Destination | null;
  onChange: (s: Destination | null) => void;
  /** Libellé de l'option « ne rien faire » */
  libelleAucune?: string;
}

export function ChoixSection({ valeur, onChange, libelleAucune = 'Laisser à classer' }: Props) {
  return (
    <select className="input py-1 text-xs" value={valeur ?? ''} onChange={e => onChange((e.target.value || null) as Destination | null)} aria-label="Envoyer vers la section">
      <option value="">{libelleAucune}</option>
      <optgroup label="Infos perso">
        {CHAMPS_INFOS.map(([c, libelle]) => <option key={c} value={`infos.${c}`}>→ {libelle}</option>)}
      </optgroup>
      <optgroup label="Rubriques du CV">
        {ORDRE_PAR_DEFAUT.map(s => <option key={s} value={s}>→ {LIBELLES_SECTIONS[s]}</option>)}
      </optgroup>
    </select>
  );
}
