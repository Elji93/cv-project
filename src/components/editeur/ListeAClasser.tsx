// Textes « à classer » du CV ouvert, chacun avec ses cases et son menu « Envoyer vers… »
import type { CV } from '../../types';
import { classerSelection } from '../../lib/import/classer';
import { FragmentACocher } from '../import/FragmentACocher';

export function ListeAClasser({ cv, modifier }: { cv: CV; modifier: (m: (c: CV) => void) => void }) {
  return (
    <>
      {cv.aClasser.map(f => (
        <FragmentACocher key={f.id + f.texte.length} fragment={f}
          donnees={cv.donnees} onEnvoyer={(lignes, section) => modifier(c => classerSelection(c, f.id, lignes, section))} />
      ))}
    </>
  );
}
