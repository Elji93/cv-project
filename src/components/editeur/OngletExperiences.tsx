// Onglet « Expériences »
import { ArrowLeftRight, Plus } from 'lucide-react';
import type { Experience } from '../../types';
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { experienceVide } from '../../lib/cv';
import { Astuce, ChampTexte } from '../commun/Champs';
import { ChampPeriode } from './ChampPeriode';
import { EditeurPuces } from './EditeurPuces';
import { OutilsBloc, deplacer } from './OutilsBloc';

export function OngletExperiences() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  const liste = cv.donnees.experiences;
  /** Modifie l'expérience n° i */
  const maj = (i: number, modif: (e: Experience) => void) => modifier(c => modif(c.donnees.experiences[i]));

  return (
    <>
      <Astuce>Commencez chaque puce par un verbe d'action (Audité, Modélisé, Piloté…) et chiffrez : € / k€ / M€, %, délais, volumes.</Astuce>
      {liste.map((e, i) => (
        <div key={e.id} className="card-entry">
          <OutilsBloc titre={e.poste || e.entreprise || 'Nouvelle expérience'} premier={i === 0} dernier={i === liste.length - 1}
            onMonter={() => modifier(c => deplacer(c.donnees.experiences, i, -1))}
            onDescendre={() => modifier(c => deplacer(c.donnees.experiences, i, 1))}
            onSupprimer={() => modifier(c => { c.donnees.experiences.splice(i, 1); })} />
          <div className="grid grid-cols-[1fr_auto_1fr] gap-1 items-end">
            <ChampTexte libelle="Poste" valeur={e.poste} onValeur={v => maj(i, x => { x.poste = v; })} />
            <button className="icon-btn mb-3" title="Inverser poste et entreprise" aria-label="Inverser poste et entreprise"
              onClick={() => maj(i, x => { [x.poste, x.entreprise] = [x.entreprise, x.poste]; })}><ArrowLeftRight size={14} /></button>
            <ChampTexte libelle="Entreprise" valeur={e.entreprise} onValeur={v => maj(i, x => { x.entreprise = v; })} />
          </div>
          <ChampTexte libelle="Ville" valeur={e.ville} onValeur={v => maj(i, x => { x.ville = v; })} />
          <ChampPeriode periode={e.periode} onChange={m => maj(i, x => m(x.periode))} />
          <EditeurPuces libelle="Réalisations" puces={e.puces} onChange={m => maj(i, x => m(x.puces))} />
        </div>
      ))}
      <button className="btn" onClick={() => modifier(c => { c.donnees.experiences.push(experienceVide()); })}><Plus size={14} /> Ajouter une expérience</button>
    </>
  );
}
