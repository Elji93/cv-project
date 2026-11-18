// ============================================================================
//  Un texte « à classer » affiché ligne par ligne, avec une case par ligne :
//  on coche les lignes voulues, puis on choisit la section où les envoyer.
//  Sans case cochée, c'est tout le texte qui est envoyé.
// ============================================================================
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { CleSection, FragmentAClasser } from '../../types';
import { LIBELLES_SECTIONS } from '../../data/constantes';
import { ChoixSection } from './ChoixSection';
import { confirmer } from '../../store/dialogues';

interface Props {
  fragment: FragmentAClasser;
  /** lignes = numéros des lignes cochées (vide = tout) ; section null = supprimer */
  onEnvoyer: (lignes: number[], section: CleSection | null) => void;
}

export function FragmentACocher({ fragment, onEnvoyer }: Props) {
  const lignes = fragment.texte.split('\n');
  const [cochees, setCochees] = useState<number[]>([]);
  const [dernier, setDernier] = useState<number | null>(null);

  /** Clic sur une ligne ; Maj+clic coche toute la plage depuis le clic précédent */
  const basculer = (i: number, plage: boolean) => {
    if (plage && dernier !== null) {
      const [a, b] = [Math.min(dernier, i), Math.max(dernier, i)];
      const zone = Array.from({ length: b - a + 1 }, (_, k) => a + k);
      setCochees(c => [...new Set([...c, ...zone])]);
    } else setCochees(c => (c.includes(i) ? c.filter(x => x !== i) : [...c, i]));
    setDernier(i);
  };

  const envoyer = (section: CleSection | null) => {
    onEnvoyer(cochees, section);
    setCochees([]);
    setDernier(null);
  };

  const suggestion = fragment.sectionDetectee ? ` (suggestion : ${LIBELLES_SECTIONS[fragment.sectionDetectee]})` : '';
  return (
    <div className="bg-white rounded-md border border-amber-200 p-2">
      {lignes.length > 1 && (
        <div className="flex items-center gap-2 mb-1 text-[11px] text-gray-500">
          <button className="underline" onClick={() => setCochees(cochees.length === lignes.length ? [] : lignes.map((_, i) => i))}>
            {cochees.length === lignes.length ? 'Tout décocher' : 'Tout cocher'}
          </button>
          <span>· Maj+clic pour cocher plusieurs lignes d'un coup</span>
        </div>
      )}
      <ul className="mb-1.5 max-h-60 overflow-auto">
        {lignes.map((l, i) => (
          <li key={i}>
            <label className={`flex items-start gap-1.5 rounded px-1 py-0.5 text-xs cursor-pointer select-none ${cochees.includes(i) ? 'bg-sky-100' : 'hover:bg-gray-50'}`}
              onClick={e => { e.preventDefault(); basculer(i, e.shiftKey); }}>
              <input type="checkbox" className="mt-0.5" checked={cochees.includes(i)} readOnly tabIndex={-1} />
              <span className="text-gray-700 whitespace-pre-wrap">{l || ' '}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-1.5">
        <ChoixSection valeur={null} onChange={s => s && envoyer(s)}
          libelleAucune={(cochees.length ? `Envoyer ${cochees.length} ligne${cochees.length > 1 ? 's' : ''} vers…` : 'Envoyer tout vers…') + suggestion} />
        <button className="icon-btn text-red-600" title={cochees.length ? 'Supprimer les lignes cochées' : 'Supprimer ce texte'} aria-label="Supprimer"
          onClick={async () => { if (await confirmer({ titre: cochees.length ? 'Supprimer les lignes cochées ?' : 'Supprimer tout ce texte ?', message: 'Ctrl+Z pour annuler.', libelleOk: 'Supprimer', danger: true })) envoyer(null); }}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
