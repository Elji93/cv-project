// Onglet « Certifications »
import { Plus, Trash2 } from 'lucide-react';
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { uid } from '../../lib/cv';
import { Astuce, ChampTexte } from '../commun/Champs';
import { lazy, Suspense } from 'react';
// La carte « Booster » utilise le moteur ATS : chargée seulement à l'ouverture de cet onglet
const BoosterCandidature = lazy(() => import('../commun/BoosterCandidature').then(m => ({ default: m.BoosterCandidature })));
import { CaseSurCv } from './CaseSurCv';

export function OngletCertifications() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  const liste = cv.donnees.certifications;
  return (
    <>
      <Astuce>CFA, AMF, CCNA, Security+, ITIL, TOEIC… avec l'année (ou « en cours »). Suggestions selon votre métier plus bas.</Astuce>
      {liste.length > 1 && <p className="text-[11.5px] text-gray-500 mb-2">Sur le CV : {liste.filter(x => !x.masquee).length} / {liste.length}. Décochez une certification pour la garder en réserve.</p>}
      {liste.map((x, i) => (
        <div key={x.id} className={`grid grid-cols-[auto_1.4fr_1fr_.6fr_auto] gap-2 items-end ${x.masquee ? 'opacity-60' : ''}`}>
          <CaseSurCv valeur={!x.masquee} onChange={v => modifier(c => { c.donnees.certifications[i].masquee = !v; })} />
          <ChampTexte libelle="Intitulé" placeholder="CFA Level I" valeur={x.intitule} onValeur={v => modifier(c => { c.donnees.certifications[i].intitule = v; })} />
          <ChampTexte libelle="Organisme" valeur={x.organisme} onValeur={v => modifier(c => { c.donnees.certifications[i].organisme = v; })} />
          <ChampTexte libelle="Année" valeur={x.annee} onValeur={v => modifier(c => { c.donnees.certifications[i].annee = v; })} />
          <button className="icon-btn mb-3 text-red-600" aria-label="Supprimer la certification" onClick={() => modifier(c => { c.donnees.certifications.splice(i, 1); })}><Trash2 size={15} /></button>
        </div>
      ))}
      <button className="btn" onClick={() => modifier(c => { c.donnees.certifications.push({ id: uid(), intitule: '', organisme: '', annee: '' }); })}><Plus size={14} /> Ajouter une certification</button>
      <Suspense fallback={null}><BoosterCandidature cv={cv} compact /></Suspense>
    </>
  );
}
