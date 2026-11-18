// ============================================================================
//  Carte « Booster votre candidature » : certifications recommandées pour le ou les
//  métiers choisis (détectés dans l'offre ou le CV) et autres leviers. Utilisée dans
//  l'analyseur et dans l'onglet Certifications de l'éditeur.
//  Les métiers se choisissent dans une liste déroulante, plusieurs à la fois.
// ============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Archive, Award, Check, ChevronDown, Plus, Rocket } from 'lucide-react';
import type { CV } from '../../types';
import { LIBELLE_NIVEAU, type NiveauCertif } from '../../data/certifications';
import { recommander, type CertifResultat, type ParcoursResultat } from '../../lib/ats/recommandations';
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

/** Métiers affichés : le choix de l'utilisatrice, sinon les métiers détectés, sinon « Pour tous les profils » */
export function parcoursAffiches(r: ReturnType<typeof recommander>, choix: string[] | null): ParcoursResultat[] {
  const liste = [...r.tous, r.transversal];
  if (choix) {
    const choisis = liste.filter(p => choix.includes(p.parcours.id));
    if (choisis.length) return choisis;
  }
  return r.detectes.length ? r.detectes : [r.transversal];
}

/** Liste déroulante à cases à cocher (plusieurs métiers à la fois) */
function ChoixMetiers({ r, actifs, onChange }: { r: ReturnType<typeof recommander>; actifs: ParcoursResultat[]; onChange: (ids: string[] | null) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const boite = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => { if (!boite.current?.contains(e.target as Node)) setOuvert(false); };
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false); };
    document.addEventListener('mousedown', fermer);
    document.addEventListener('keydown', echap);
    return () => { document.removeEventListener('mousedown', fermer); document.removeEventListener('keydown', echap); };
  }, [ouvert]);

  const ids = actifs.map(p => p.parcours.id);
  const basculer = (id: string) => {
    const suivant = ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id];
    onChange(suivant.length ? suivant : null);
  };
  const ligne = (p: ParcoursResultat) => (
    <label key={p.parcours.id} className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 cursor-pointer">
      <input type="checkbox" checked={ids.includes(p.parcours.id)} onChange={() => basculer(p.parcours.id)} />
      <span className="flex-1">{p.parcours.libelle}</span>
      {r.detectes.includes(p) && <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-brand-2/10 text-brand-2">détecté</span>}
    </label>
  );
  const autres = r.tous.filter(p => !r.detectes.includes(p));

  return (
    <div ref={boite} className="relative mb-2">
      <button type="button" aria-haspopup="listbox" aria-expanded={ouvert} onClick={() => setOuvert(o => !o)}
        className="w-full flex items-center gap-2 text-left text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50">
        <span className="text-xs font-semibold text-gray-500 shrink-0">Métiers :</span>
        <span className="flex-1 min-w-0 truncate">{actifs.map(p => p.parcours.libelle).join(', ')}</span>
        <ChevronDown size={15} className={`shrink-0 text-gray-400 transition-transform ${ouvert ? 'rotate-180' : ''}`} />
      </button>
      {ouvert && (
        <div role="listbox" aria-multiselectable="true" className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {r.detectes.length > 0 && <>
            <div className="px-3 pt-1 pb-0.5 text-[10.5px] font-bold uppercase tracking-wider text-gray-400">Détectés</div>
            {r.detectes.map(ligne)}
          </>}
          <div className="px-3 pt-2 pb-0.5 text-[10.5px] font-bold uppercase tracking-wider text-gray-400">Autres métiers</div>
          {autres.map(ligne)}
          {ligne(r.transversal)}
          <div className="flex justify-between gap-2 px-3 pt-2 pb-1 mt-1 border-t border-gray-100">
            <button type="button" className="text-xs text-brand-2 underline" onClick={() => onChange(null)}>Revenir aux métiers détectés</button>
            <button type="button" className="btn-sm" onClick={() => setOuvert(false)}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function BoosterCandidature({ cv, offre = '', compact }: Props) {
  const r = useMemo(() => recommander(cv, offre), [cv, offre]);
  const [choix, setChoix] = useState<string[] | null>(null);
  const [plusTard, setPlusTard] = useState(false);
  const actifs = parcoursAffiches(r, choix);

  const ajouter = (c: CertifResultat) => useAppStore.getState().modifierCv(x => {
    x.donnees.certifications.push({ id: uid(), intitule: c.nom, organisme: c.organisme, annee: x.langue === 'en' ? 'In progress' : 'En cours' });
    x.sectionsMasquees = x.sectionsMasquees.filter(s => s !== 'certifications');
  }, cv.id);

  /** Certification ajoutée avec « + En cours » (même intitulé) : on peut la retirer du CV */
  const ajouteeIci = (c: CertifResultat) => cv.donnees.certifications.some(x => !x.masquee && x.intitule === c.nom);
  const retirer = (c: CertifResultat) => useAppStore.getState().modifierCv(x => {
    x.donnees.certifications = x.donnees.certifications.filter(y => y.masquee || y.intitule !== c.nom);
  }, cv.id);

  // Une certification commune à plusieurs métiers (SST, Green Belt…) n'apparaît qu'une fois
  const vues = new Set<string>();
  const sections = actifs.map(p => {
    const propres = p.certifications.filter(c => !vues.has(c.id) && (vues.add(c.id), true));
    // Profil junior : les certifications « expérimenté » sont repliées
    const visibles = propres.filter(c => !r.profilJunior || c.niveau !== 'avance' || c.dansOffre || c.surCv || plusTard);
    return { p, visibles, masquees: propres.length - visibles.length };
  });
  const masquees = sections.reduce((n, s) => n + s.masquees, 0);
  const leviers = [...new Set([
    ...actifs.flatMap(p => p.parcours.leviers),
    ...(actifs.includes(r.transversal) ? [] : r.transversal.parcours.leviers.slice(0, 2)),
  ])];

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
          ? <span className="shrink-0 flex flex-col items-end gap-1 mt-0.5">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><Check size={14} /> Sur votre CV</span>
              {ajouteeIci(c) && <button className="text-[11px] text-gray-500 underline hover:text-red-700" onClick={() => retirer(c)}
                title="Retire du CV la certification ajoutée avec « + En cours »">Retirer</button>}
            </span>
          : c.enReserve.length
          ? <button className="btn-sm shrink-0" title="Cette certification est dans votre réserve : la remettre sur le CV"
              onClick={() => useAppStore.getState().modifierCv(x => { x.donnees.certifications.forEach(y => { if (c.enReserve.includes(y.id)) y.masquee = false; }); x.sectionsMasquees = x.sectionsMasquees.filter(s => s !== 'certifications'); }, cv.id)}>
              <Archive size={12} /> Remettre sur le CV</button>
          : <button className="btn-sm shrink-0" onClick={() => ajouter(c)} title="Ajoute la certification au CV avec la mention « En cours »"><Plus size={12} /> En cours</button>}
      </div>
    </li>
  );

  return (
    <div className={compact ? 'mt-5 min-w-0' : 'card min-w-0'}>
      <h3 className="font-semibold mb-1 flex items-center gap-1.5"><Rocket size={16} className="text-brand-2" /> Booster votre candidature</h3>
      <p className="text-xs text-gray-500 mb-3">
        {r.detectes.length
          ? <>Métier détecté {offre.trim() ? 'dans l’offre' : 'dans votre CV'} : <b>{r.detectes.map(p => p.parcours.libelle).join(', ')}</b>.</>
          : <>Aucun métier reconnu {offre.trim() ? 'dans l’offre' : '(précisez le poste visé dans le titre du CV)'} : choisissez-en un ou plusieurs ci-dessous.</>}
        {' '}Certifications et leviers qui font la différence auprès des recruteurs et des ATS.
      </p>

      {r.manquantesOffre.length > 0 && (
        <div className="flex items-start gap-2 text-[12.5px] bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2 mb-3">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <span>Certification{r.manquantesOffre.length > 1 ? 's' : ''} citée{r.manquantesOffre.length > 1 ? 's' : ''} dans l’offre et absente{r.manquantesOffre.length > 1 ? 's' : ''} de votre CV : <b>{r.manquantesOffre.map(c => c.nom).join(', ')}</b>.
            Si vous l’avez ou la préparez, ajoutez-la : les ATS filtrent souvent dessus.</span>
        </div>
      )}

      <ChoixMetiers r={r} actifs={actifs} onChange={ids => { setChoix(ids); setPlusTard(false); }} />

      {sections.map(({ p, visibles }) => visibles.length > 0 && (
        <div key={p.parcours.id}>
          {sections.length > 1 && <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-3">{p.parcours.libelle}</h4>}
          <ul className="divide-y divide-gray-100">{visibles.map(ligne)}</ul>
        </div>
      ))}
      {masquees > 0 && (
        <button className="text-xs text-brand-2 underline mt-1" onClick={() => setPlusTard(true)}>
          + {masquees} certification{masquees > 1 ? 's' : ''} pour profils expérimentés (plus tard dans votre carrière)
        </button>
      )}

      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mt-4 mb-1.5 flex items-center gap-1"><Award size={13} /> Autres leviers</h4>
      <ul className="list-disc pl-4 text-[12.5px] text-gray-700 space-y-1 leading-snug">
        {leviers.map(l => <li key={l}>{l}</li>)}
      </ul>
      <p className="text-[11px] text-gray-400 mt-3">
        N’ajoutez une certification que si vous l’avez obtenue ou la préparez réellement : les recruteurs la vérifient. Pensez au CPF pour en financer une.
      </p>
    </div>
  );
}
