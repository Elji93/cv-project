// ============================================================================
//  Carte « Booster votre candidature » : certifications recommandées pour le métier
//  (détecté dans l'offre ou le CV) et autres leviers. Utilisée dans l'analyseur
//  et dans l'onglet Certifications de l'éditeur.
// ============================================================================
import { useMemo, useState } from 'react';
import { AlertTriangle, Archive, Award, Check, Plus, Rocket } from 'lucide-react';
import type { CV } from '../../types';
import { LIBELLE_NIVEAU, type NiveauCertif } from '../../data/certifications';
import { recommander, type CertifResultat } from '../../lib/ats/recommandations';
import { useAppStore } from '../../store/useAppStore';
import { uid } from '../../lib/cv';

const COULEUR_NIVEAU: Record<NiveauCertif, string> = {
  debutant: 'bg-emerald-50 text-emerald-800',
  intermediaire: 'bg-sky-50 text-sky-800',
  avance: 'bg-violet-50 text-violet-800',
};

interface Props {
  cv: CV;
  /** Texte de l'offre (analyseur) ; sans offre, le métier est lu dans le CV */
  offre?: string;
  /** Présentation plus compacte (panneau de l'éditeur) */
  compact?: boolean;
}

export function BoosterCandidature({ cv, offre = '', compact }: Props) {
  const r = useMemo(() => recommander(cv, offre), [cv, offre]);
  const [choix, setChoix] = useState<string | null>(null);
  const [plusTard, setPlusTard] = useState(false);
  const actif = [...r.tous, r.transversal].find(p => p.parcours.id === choix)
    ?? r.detectes[0] ?? r.transversal;

  const ajouter = (c: CertifResultat) => useAppStore.getState().modifierCv(x => {
    x.donnees.certifications.push({ id: uid(), intitule: c.nom, organisme: c.organisme, annee: x.langue === 'en' ? 'In progress' : 'En cours' });
    x.sectionsMasquees = x.sectionsMasquees.filter(s => s !== 'certifications');
  }, cv.id);

  // Profil junior : les certifications « expérimenté » sont repliées
  const visibles = actif.certifications.filter(c => !r.profilJunior || c.niveau !== 'avance' || c.dansOffre || c.surCv || plusTard);
  const masquees = actif.certifications.length - visibles.length;

  const ligne = (c: CertifResultat) => (
    <li key={c.id} className={`py-2.5 ${c.dansOffre && !c.surCv ? 'bg-amber-50/60 -mx-2 px-2 rounded-lg' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-sm">{c.nom}</span>
            <span className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded ${COULEUR_NIVEAU[c.niveau]}`}>{LIBELLE_NIVEAU[c.niveau]}</span>
            {c.gratuit && <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-lime-100 text-lime-800">Gratuit</span>}
            {c.dansOffre && <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">Citée dans l’offre</span>}
          </div>
          <div className="text-xs text-gray-500">{c.organisme}</div>
          <p className="text-[12.5px] text-gray-700 mt-0.5 leading-snug">{c.note}</p>
        </div>
        {c.surCv
          ? <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-0.5"><Check size={14} /> Sur votre CV</span>
          : c.enReserve.length
          ? <button className="btn-sm shrink-0" title="Cette certification est dans votre réserve : la remettre sur le CV"
              onClick={() => useAppStore.getState().modifierCv(x => { x.donnees.certifications.forEach(y => { if (c.enReserve.includes(y.id)) y.masquee = false; }); x.sectionsMasquees = x.sectionsMasquees.filter(s => s !== 'certifications'); }, cv.id)}>
              <Archive size={12} /> Remettre sur le CV</button>
          : <button className="btn-sm shrink-0" onClick={() => ajouter(c)} title="Ajoute la certification au CV avec la mention « En cours »"><Plus size={12} /> En cours</button>}
      </div>
    </li>
  );

  return (
    <div className={compact ? 'mt-5' : 'card'}>
      <h3 className="font-semibold mb-1 flex items-center gap-1.5"><Rocket size={16} className="text-brand-2" /> Booster votre candidature</h3>
      <p className="text-xs text-gray-500 mb-3">
        {r.detectes.length
          ? <>Métier détecté {offre.trim() ? 'dans l’offre' : 'dans votre CV'} : <b>{r.detectes.map(p => p.parcours.libelle).join(', ')}</b>.</>
          : <>Aucun métier reconnu {offre.trim() ? 'dans l’offre' : '(précisez le poste visé dans le titre du CV)'} : choisissez-en un ci-dessous.</>}
        {' '}Certifications et leviers qui font la différence auprès des recruteurs et des ATS.
      </p>

      {r.manquantesOffre.length > 0 && (
        <div className="flex items-start gap-2 text-[12.5px] bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2 mb-3">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>Certification{r.manquantesOffre.length > 1 ? 's' : ''} citée{r.manquantesOffre.length > 1 ? 's' : ''} dans l’offre et absente{r.manquantesOffre.length > 1 ? 's' : ''} de votre CV : <b>{r.manquantesOffre.map(c => c.nom).join(', ')}</b>.
            Si vous l’avez ou la préparez, ajoutez-la : les ATS filtrent souvent dessus.</span>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-2" role="tablist">
        {[...r.tous, r.transversal].map(p => {
          const estDetecte = r.detectes.includes(p);
          return (
            <button key={p.parcours.id} role="tab" aria-selected={actif === p} onClick={() => { setChoix(p.parcours.id); setPlusTard(false); }}
              className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${actif === p ? 'bg-brand-2 text-white border-brand-2' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {estDetecte && <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle ${actif === p ? 'bg-white' : 'bg-brand-2'}`} />}
              {p.parcours.libelle}
            </button>
          );
        })}
      </div>

      <ul className="divide-y divide-gray-100">{visibles.map(ligne)}</ul>
      {masquees > 0 && (
        <button className="text-xs text-brand-2 underline mt-1" onClick={() => setPlusTard(true)}>
          + {masquees} certification{masquees > 1 ? 's' : ''} pour profils expérimentés (plus tard dans votre carrière)
        </button>
      )}

      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-4 mb-1.5 flex items-center gap-1"><Award size={13} /> Autres leviers</h4>
      <ul className="list-disc pl-4 text-[12.5px] text-gray-700 space-y-1 leading-snug">
        {[...actif.parcours.leviers, ...(actif === r.transversal ? [] : r.transversal.parcours.leviers.slice(0, 2))].map(l => <li key={l}>{l}</li>)}
      </ul>
      <p className="text-[11px] text-gray-400 mt-3">
        N’ajoutez une certification que si vous l’avez obtenue ou la préparez réellement : les recruteurs la vérifient. Pensez au CPF pour en financer une.
      </p>
    </div>
  );
}
