// Onglet « Infos personnelles & photo »
// Chaque coordonnée peut être masquée sur le CV (elle reste en mémoire) : bouton œil à côté du libellé.
import { Eye, EyeOff } from 'lucide-react';
import type { ChampContact, EmplacementRqth, InfosPerso } from '../../types';
import { EMPLACEMENTS_RQTH } from '../../lib/rqth';
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { estMasque } from '../../lib/cv';
import { Astuce, ChampTexte } from '../commun/Champs';
import { EditeurPhoto } from './EditeurPhoto';

type CleTexte = Exclude<keyof InfosPerso, 'photo' | 'masques' | 'mentionRqth'>;
const MASQUABLES: CleTexte[] = ['email', 'telephone', 'ville', 'linkedin', 'site', 'dateNaissance'];

export function OngletInfosPerso() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  const p = cv.donnees.infosPerso;

  const basculer = (k: ChampContact) => modifier(c => {
    const m = new Set(c.donnees.infosPerso.masques ?? []);
    if (m.has(k)) m.delete(k); else m.add(k);
    c.donnees.infosPerso.masques = MASQUABLES.filter(x => m.has(x as ChampContact)) as ChampContact[];
  });

  const champ = (k: CleTexte, libelle: string, indication = '', type = 'text') => {
    if (!MASQUABLES.includes(k)) {
      return <ChampTexte libelle={libelle} type={type} placeholder={indication} valeur={p[k]} onValeur={v => modifier(c => { c.donnees.infosPerso[k] = v; })} />;
    }
    const masque = estMasque(cv, k as ChampContact);
    return (
      <div className="flex flex-col gap-1 mb-3 min-w-0">
        <div className="flex items-center gap-1.5">
          <label htmlFor={`info-${k}`} className="text-xs font-semibold text-gray-500 flex-1 min-w-0 truncate">{libelle}</label>
          <button type="button" onClick={() => basculer(k as ChampContact)} aria-pressed={!masque}
            title={masque ? 'Masqué : n’apparaît pas sur le CV (ni PDF, ni Word, ni lettre). Cliquer pour l’afficher.' : 'Affiché sur le CV. Cliquer pour le masquer (l’information reste en mémoire).'}
            className={`shrink-0 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${masque ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
            {masque ? <><EyeOff size={12} /> Masqué</> : <><Eye size={12} /> <span className="sr-only">Affiché sur le CV, cliquer pour masquer</span></>}
          </button>
        </div>
        <input id={`info-${k}`} className={`input ${masque ? 'text-gray-400 line-through decoration-gray-300' : ''}`} type={type} placeholder={indication}
          value={p[k]} onChange={e => { const v = e.target.value; modifier(c => { c.donnees.infosPerso[k] = v; }); }} />
      </div>
    );
  };

  const nbMasques = p.masques?.length ?? 0;
  return (
    <>
      <EditeurPhoto />
      <div className="grid grid-cols-2 gap-2">{champ('prenom', 'Prénom')}{champ('nom', 'Nom')}</div>
      <div className="grid grid-cols-2 gap-2">{champ('email', 'Email', 'prenom.nom@email.com', 'email')}{champ('telephone', 'Téléphone', '+33 6 …', 'tel')}</div>
      <div className="grid grid-cols-2 gap-2">{champ('ville', 'Ville', 'Paris')}{champ('linkedin', 'LinkedIn', 'linkedin.com/in/…')}</div>
      <div className="grid grid-cols-2 gap-2">{champ('site', 'Site / GitHub / autre', 'Mobilité, permis…')}{champ('dateNaissance', 'Date de naissance (facultatif)', '12/03/2003 ou 22 ans')}</div>
      <Astuce>
        Pour ne pas afficher une coordonnée, cliquez sur l’œil <Eye size={12} className="inline align-[-1px]" /> à côté de son nom :
        elle reste enregistrée mais n’apparaît plus sur le CV, le PDF, le Word ni la lettre.
        {nbMasques > 0 && <> <b>{nbMasques} masquée{nbMasques > 1 ? 's' : ''}.</b></>}
      </Astuce>
      <div className="mb-3 rounded-lg border border-gray-200 p-3">
        <label htmlFor="mention-rqth" className="text-xs font-semibold text-gray-500">Mention RQTH (facultative)</label>
        <select id="mention-rqth" className="input mt-1" value={p.mentionRqth ?? ''}
          onChange={e => { const v = e.target.value as EmplacementRqth | ''; modifier(c => { if (v) c.donnees.infosPerso.mentionRqth = v; else delete c.donnees.infosPerso.mentionRqth; }); }}>
          {EMPLACEMENTS_RQTH.map(o => <option key={o.valeur} value={o.valeur}>{o.libelle}</option>)}
        </select>
        <p className="text-[11.5px] text-gray-500 leading-snug mt-1.5">
          {EMPLACEMENTS_RQTH.find(o => o.valeur === (p.mentionRqth ?? ''))?.aide}
          {' '}Ne précisez jamais la nature du handicap : un employeur n’a pas à la connaître.
        </p>
      </div>
      <Astuce ton="alerte">La date de naissance est facultative en France et déconseillée pour les candidatures UK / US (risque de discrimination par l'âge). Les ATS ne s'en servent pas.</Astuce>
      <Astuce>Email, téléphone, ville et LinkedIn complets font partie des contrôles ATS.</Astuce>
    </>
  );
}
