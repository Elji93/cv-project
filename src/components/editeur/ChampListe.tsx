// Zone de texte « éléments séparés par des virgules » reliée à une liste (string[])
// On garde le texte tapé tel quel pendant la frappe (sinon impossible de taper « , »)
import { useEffect, useRef, useState } from 'react';
import { decouperListe } from '../../lib/cv';
import { Champ } from '../commun/Champs';

interface Props {
  libelle: string;
  elements: string[];
  onElements: (l: string[]) => void;
  indication?: string;
  aide?: string;
  lignes?: number;
}

export function ChampListe({ libelle, elements, onElements, indication, aide, lignes = 2 }: Props) {
  const [texte, setTexte] = useState(elements.join(', '));
  const ref = useRef<HTMLTextAreaElement>(null);
  // Changement venu d'ailleurs (feuille, annuler…) : on réaffiche, sauf pendant la frappe
  useEffect(() => {
    if (document.activeElement !== ref.current) setTexte(elements.join(', '));
  }, [elements]);
  return (
    <Champ libelle={libelle} aide={aide}>
      <textarea ref={ref} rows={lignes} className="input resize-y leading-relaxed" value={texte} placeholder={indication}
        onChange={e => { setTexte(e.target.value); onElements(decouperListe(e.target.value)); }}
        onBlur={() => setTexte(elements.join(', '))} />
    </Champ>
  );
}
