// Onglet « Formation »
import { ArrowLeftRight, Plus } from 'lucide-react';
import type { Formation } from '../../types';
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { formationVide } from '../../lib/cv';
import { ChampTexte } from '../commun/Champs';
import { ChampPeriode } from './ChampPeriode';
import { EditeurPuces } from './EditeurPuces';
import { OutilsBloc, deplacer } from './OutilsBloc';

export function OngletFormations() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  const liste = cv.donnees.formations;
  const maj = (i: number, modif: (f: Formation) => void) => modifier(c => modif(c.donnees.formations[i]));

  return (
    <>
      {liste.map((f, i) => (
        <div key={f.id} className="card-entry">
          <OutilsBloc titre={f.diplome || f.etablissement || 'Nouvelle formation'} premier={i === 0} dernier={i === liste.length - 1}
            onMonter={() => modifier(c => deplacer(c.donnees.formations, i, -1))}
            onDescendre={() => modifier(c => deplacer(c.donnees.formations, i, 1))}
            onSupprimer={() => modifier(c => { c.donnees.formations.splice(i, 1); })} />
          <div className="grid grid-cols-[1fr_auto_1fr] gap-1 items-end">
            <ChampTexte libelle="Diplôme, spécialité" valeur={f.diplome} onValeur={v => maj(i, x => { x.diplome = v; })} />
            <button className="icon-btn mb-3" title="Inverser diplôme et école" aria-label="Inverser diplôme et école"
              onClick={() => maj(i, x => { [x.diplome, x.etablissement] = [x.etablissement, x.diplome]; })}><ArrowLeftRight size={14} /></button>
            <ChampTexte libelle="École / Université" valeur={f.etablissement} onValeur={v => maj(i, x => { x.etablissement = v; })} />
          </div>
          <ChampTexte libelle="Ville" valeur={f.ville} onValeur={v => maj(i, x => { x.ville = v; })} />
          <ChampPeriode periode={f.periode} onChange={m => maj(i, x => m(x.periode))} />
          <EditeurPuces libelle="Détails (mention, cours, mémoire…)" indication="Mention Bien, major de promotion…" puces={f.puces} onChange={m => maj(i, x => m(x.puces))} />
        </div>
      ))}
      <button className="btn" onClick={() => modifier(c => { c.donnees.formations.push(formationVide()); })}><Plus size={14} /> Ajouter une formation</button>
    </>
  );
}
