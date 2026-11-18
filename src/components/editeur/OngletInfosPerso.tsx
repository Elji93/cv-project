// Onglet « Infos personnelles & photo »
import type { InfosPerso } from '../../types';
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { Astuce, ChampTexte } from '../commun/Champs';
import { EditeurPhoto } from './EditeurPhoto';

type CleTexte = Exclude<keyof InfosPerso, 'photo'>;

export function OngletInfosPerso() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  const p = cv.donnees.infosPerso;
  const champ = (k: CleTexte, libelle: string, indication = '', type = 'text') => (
    <ChampTexte libelle={libelle} type={type} placeholder={indication} valeur={p[k]}
      onValeur={v => modifier(c => { c.donnees.infosPerso[k] = v; })} />
  );
  return (
    <>
      <EditeurPhoto />
      <div className="grid grid-cols-2 gap-2">{champ('prenom', 'Prénom')}{champ('nom', 'Nom')}</div>
      <div className="grid grid-cols-2 gap-2">{champ('email', 'Email', 'prenom.nom@email.com', 'email')}{champ('telephone', 'Téléphone', '+33 6 …', 'tel')}</div>
      <div className="grid grid-cols-2 gap-2">{champ('ville', 'Ville', 'Paris')}{champ('linkedin', 'LinkedIn', 'linkedin.com/in/…')}</div>
      <div className="grid grid-cols-2 gap-2">{champ('site', 'Site / GitHub / autre', 'Mobilité, permis…')}{champ('dateNaissance', 'Date de naissance (facultatif)', '12/03/2003 ou 22 ans')}</div>
      <Astuce ton="alerte">La date de naissance est facultative en France et déconseillée pour les candidatures UK / US (risque de discrimination par l'âge). Les ATS ne s'en servent pas.</Astuce>
      <Astuce>Email, téléphone, ville et LinkedIn complets font partie des contrôles ATS.</Astuce>
    </>
  );
}
