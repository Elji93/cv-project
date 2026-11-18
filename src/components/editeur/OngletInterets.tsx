// Onglet « Centres d'intérêt »
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { ChampListe } from './ChampListe';

export function OngletInterets() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  return (
    <ChampListe libelle="Centres d'intérêt (séparés par des virgules)" lignes={3}
      indication="Semi-marathon (1h42), tennis en compétition, bénévolat…"
      aide="Restez concret et différenciant : sport à bon niveau, responsabilités associatives (avec chiffres)."
      elements={cv.donnees.centresInteret} onElements={l => modifier(c => { c.donnees.centresInteret = l; })} />
  );
}
