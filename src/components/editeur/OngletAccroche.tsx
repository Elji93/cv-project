// Onglet « Titre & accroche »
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { ChampTexte, ZoneTexte } from '../commun/Champs';

export function OngletAccroche() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  return (
    <>
      <ChampTexte libelle="Titre du CV" placeholder="Analyste M&A — Stage de fin d'études" valeur={cv.donnees.infosPerso.titre}
        onValeur={v => modifier(c => { c.donnees.infosPerso.titre = v; })}
        aide={<>Reprenez <b>l'intitulé exact</b> de l'offre : c'est le premier critère de tri des ATS.</>} />
      <ZoneTexte libelle="Accroche" rows={6} valeur={cv.donnees.accroche}
        placeholder="2 à 3 lignes : poste visé, formation, années d'expérience, compétences clés de l'offre."
        onValeur={v => modifier(c => { c.donnees.accroche = v; })}
        aide="Les mots-clés placés ici et dans Compétences pèsent davantage dans le score ATS." />
      <ChampTexte libelle="Rythme d'alternance (si vous cherchez une alternance)" placeholder="3 semaines en entreprise / 1 semaine à l'école"
        valeur={cv.donnees.rythmeAlternance} onValeur={v => modifier(c => { c.donnees.rythmeAlternance = v; })}
        aide="Affiché dans le Profil, sous l'accroche. Laissez vide si vous ne cherchez pas d'alternance." />
    </>
  );
}
