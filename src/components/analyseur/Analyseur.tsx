// ============================================================================
//  Analyseur & score ATS : le score se met à jour en direct quand on modifie
//  l'offre ou le CV (y compris en ajoutant un mot-clé manquant).
// ============================================================================
import { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardCopy, ClipboardList, Copy, Lightbulb, Mail, Plus, Send, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, useCvActif } from '../../store/useAppStore';
import { analyserCv } from '../../lib/ats/scoring';
import { promptAudit } from '../../lib/ats/promptIA';
import { detecterLangue } from '../../lib/ats/normalisation';
import { nomComplet, uid } from '../../lib/cv';
import { useMesurePage } from '../../lib/mesurePage';
import { Feuille } from '../feuille/Feuille';
import { CarteScore } from './CarteScore';
import { ListeMotsCles } from './ListeMotsCles';
import { FeuilleSurlignee } from './FeuilleSurlignee';
import { MesEquivalences } from './MesEquivalences';
import { BoosterCandidature } from '../commun/BoosterCandidature';
import { saisirTexte } from '../../store/dialogues';
import { candidatureVide, lettreVierge } from '../../lib/lettre';

const CLE_OFFRE = 'cvstudio.v3.offre';
const CLE_INTITULE = 'cvstudio.v3.intituleOffre';
const lire = (k: string) => { try { return localStorage.getItem(k) ?? ''; } catch { return ''; } };

export function Analyseur() {
  const cvs = useAppStore(e => e.cvs);
  const selectionner = useAppStore(e => e.selectionnerCv);
  const dupliquer = useAppStore(e => e.dupliquerCv);
  const modifierCv = useAppStore(e => e.modifierCv);
  const perso = useAppStore(e => e.synonymesPerso);
  const cv = useCvActif();
  const [offre, setOffre] = useState(() => lire(CLE_OFFRE));
  const [intitule, setIntitule] = useState(() => lire(CLE_INTITULE));
  // L'analyse suit la saisie avec un petit délai (pas de recalcul à chaque lettre)
  const [offreAnalysee, setOffreAnalysee] = useState(offre);
  const [coches, setCoches] = useState<string[]>([]);
  const [copie, setCopie] = useState('');
  const mesureRef = useRef<HTMLDivElement>(null);
  const { tient } = useMesurePage(mesureRef);

  useEffect(() => {
    const h = window.setTimeout(() => {
      setOffreAnalysee(offre);
      try { localStorage.setItem(CLE_OFFRE, offre); localStorage.setItem(CLE_INTITULE, intitule); } catch { /* ignoré */ }
    }, 300);
    return () => window.clearTimeout(h);
  }, [offre, intitule]);

  const r = useMemo(
    () => (offreAnalysee.trim().length >= 80 ? analyserCv(cv, offreAnalysee, intitule, tient, perso) : null),
    [cv, offreAnalysee, intitule, tient, perso],
  );

  const basculer = (t: string) => setCoches(l => (l.includes(t) ? l.filter(x => x !== t) : [...l, t]));

  /** Ajoute les mots-clés cochés au groupe « Compétences clés » (du CV, ou d'une copie adaptée à l'offre) */
  const ajouter = (surCopie: boolean) => {
    if (!coches.length) return;
    const appliquer = (c: typeof cv) => {
      let g = c.donnees.competences.find(s => /cl[ée]s|offre|key/i.test(s.categorie));
      if (!g) { g = { id: uid(), categorie: 'Compétences clés', elements: [] }; c.donnees.competences.unshift(g); }
      g.elements = [...g.elements, ...coches.filter(k => !g!.elements.includes(k))];
      c.sectionsMasquees = c.sectionsMasquees.filter(h => h !== 'competences');
      if (surCopie && r?.intitule) c.donnees.infosPerso.titre = r.intitule;
    };
    if (surCopie) modifierCv(appliquer, dupliquer(cv.id, `${cv.nom} — ${(r?.intitule || 'offre').slice(0, 40)}`));
    else modifierCv(appliquer);
    setCoches([]);
  };

  const naviguer = useNavigate();
  /** Enregistre la candidature dans le suivi (avec le score), et en option crée la lettre */
  const postuler = async (avecLettre: boolean) => {
    if (!r) return;
    const entreprise = await saisirTexte({ titre: 'Entreprise', message: `Candidature « ${r.intitule || cv.donnees.infosPerso.titre} » avec le CV « ${cv.nom} » (score ${r.total}/100).`, valeur: '', libelleOk: 'Enregistrer' });
    if (entreprise === null) return;
    const poste = r.intitule || cv.donnees.infosPerso.titre;
    const { ajouterCandidature, ajouterLettre } = useAppStore.getState();
    const lettre = avecLettre ? lettreVierge(cv, { entreprise, poste }) : null;
    if (lettre) ajouterLettre(lettre);
    ajouterCandidature(candidatureVide({ entreprise: entreprise.trim(), poste, cvId: cv.id, lettreId: lettre?.id ?? null, scoreAts: r.total }));
    naviguer(lettre ? `/lettre/${lettre.id}` : '/candidatures');
  };

  const copierPrompt = async () => {
    if (!r) return;
    try { await navigator.clipboard.writeText(promptAudit(cv, offreAnalysee, r)); setCopie('Prompt copié ✓ — collez-le dans ChatGPT ou Claude.'); }
    catch { setCopie("Copie impossible : autorisez l'accès au presse-papiers."); }
    window.setTimeout(() => setCopie(''), 4000);
  };

  const langue = offre.trim().length >= 80 ? detecterLangue(offre) : null;
  const termesTrouves = r ? r.motsCles.filter(k => k.ou !== 'absent').map(k => k.termeCv) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="text-brand-2" /> Analyseur & score ATS</h1>
      <p className="text-gray-500 mt-1 mb-5 max-w-3xl">Collez l'offre : votre CV est noté sur 100 selon les critères de tri recommandés par l'APEC. Les synonymes français ↔ anglais sont reconnus. Le score se met à jour en direct. Tout est calculé dans votre navigateur.</p>

      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4 mb-4">
        <div className="card">
          <div className="grid sm:grid-cols-2 gap-2 mb-2">
            <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-500">CV analysé</span>
              <select className="input" value={cv.id} onChange={e => selectionner(e.target.value)}>
                {cvs.map(c => <option key={c.id} value={c.id}>{c.nom}{nomComplet(c) ? ` — ${nomComplet(c)}` : ''}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1"><span className="text-xs font-semibold text-gray-500">Intitulé du poste (facultatif)</span>
              <input className="input" placeholder={r?.intitule ? `Détecté : ${r.intitule}` : 'ex. M&A Analyst'} value={intitule} onChange={e => setIntitule(e.target.value)} />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-2">
              Texte complet de l'offre
              {langue && <span className="rounded bg-sky-100 text-sky-800 px-1.5 text-[10.5px]">Offre en {langue === 'en' ? 'anglais' : 'français'}</span>}
            </span>
            <textarea className="input min-h-[230px] leading-relaxed" value={offre} onChange={e => setOffre(e.target.value)}
              placeholder="Collez ici l'offre : missions, profil recherché, compétences, « exigé », « un plus »…" />
          </label>
          {offre.trim().length > 0 && offre.trim().length < 80 && <p className="text-xs text-amber-700 mt-1">Collez le texte complet de l'offre (au moins quelques lignes).</p>}
        </div>
        {r ? <CarteScore r={r} /> : (
          <div className="card grid place-items-center text-center text-gray-500 text-sm">Le score apparaîtra ici dès que l'offre sera collée.</div>
        )}
      </div>

      {r && (
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
          <div className="flex flex-col gap-4">
            <div className="card">
              <h3 className="font-semibold mb-3 flex items-center gap-1.5"><Lightbulb size={16} className="text-amber-500" /> Conseils pour améliorer votre score</h3>
              <ul className="divide-y divide-gray-100">
                {r.conseils.map((t, i) => (
                  <li key={i} className="flex gap-3 py-2.5 text-sm leading-relaxed">
                    <span className={`shrink-0 h-fit text-[10.5px] font-bold uppercase px-2 py-0.5 rounded ${t.priorite === 'haute' ? 'bg-red-50 text-red-700' : t.priorite === 'moyenne' ? 'bg-amber-50 text-amber-800' : 'bg-sky-50 text-sky-800'}`}>
                      {{ haute: 'Priorité', moyenne: 'Important', basse: 'Bonus' }[t.priorite]}
                    </span>
                    <span>{t.texte}</span>
                  </li>
                ))}
                {!r.conseils.length && <li className="py-2 text-sm text-emerald-700">Excellent : aucun point bloquant détecté.</li>}
              </ul>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-1">Mots-clés de l'offre</h3>
              <p className="text-xs text-gray-500 mb-3">
                <span className="text-emerald-700">Vert</span> : trouvé (pointillés = seulement dans les expériences) ·
                <span className="text-red-700"> rouge</span> : manquant · <span className="text-amber-700">orange</span> : manquant mais seulement « apprécié ».
              </p>
              <ListeMotsCles motsCles={r.motsCles} coches={coches} onCocher={basculer} />
              {r.motsCles.some(k => k.ou === 'absent') && (
                <div className="mt-3 rounded-lg bg-sky-50 border border-sky-200 p-3 text-[13px]">
                  Cochez les mots-clés manquants <b>que vous maîtrisez réellement</b> ({coches.length} sélectionné{coches.length > 1 ? 's' : ''}), puis :
                  <div className="flex flex-wrap gap-2 mt-2">
                    <button className="btn-primary" disabled={!coches.length} onClick={() => ajouter(false)}><Plus size={14} /> Ajouter à ce CV</button>
                    <button className="btn" disabled={!coches.length} onClick={() => ajouter(true)}><Copy size={14} /> Créer une copie adaptée à l'offre</button>
                  </div>
                </div>
              )}
            </div>

            <BoosterCandidature cv={cv} offre={offreAnalysee} />

            <MesEquivalences />

            <div className="card">
              <h3 className="font-semibold mb-2 flex items-center gap-1.5"><ClipboardCopy size={16} /> Audit approfondi par IA</h3>
              <p className="text-xs text-gray-500 mb-3">Copie un prompt complet (CV + offre + critères APEC + score obtenu) à coller dans ChatGPT ou Claude pour une réécriture fine.</p>
              <button className="btn" onClick={copierPrompt}><Copy size={14} /> Copier le prompt d'audit IA</button>
              {copie && <p className="text-xs text-emerald-700 mt-2">{copie}</p>}
            </div>

            <div className="card">
              <h3 className="font-semibold mb-2 flex items-center gap-1.5"><Send size={16} /> Postuler</h3>
              <p className="text-xs text-gray-500 mb-3">Enregistre la candidature dans le suivi avec ce CV et son score ({r.total}/100).</p>
              <div className="flex flex-wrap gap-2">
                <button className="btn" onClick={() => postuler(false)}><ClipboardList size={14} /> Ajouter au suivi</button>
                <button className="btn" onClick={() => postuler(true)}><Mail size={14} /> Ajouter et rédiger la lettre</button>
              </div>
            </div>
          </div>
          <FeuilleSurlignee cv={cv} termes={termesTrouves} />
        </div>
      )}

      {/* Rendu invisible du CV pour savoir s'il tient sur une page */}
      <div aria-hidden="true" style={{ position: 'absolute', left: -10000, top: 0, visibility: 'hidden', pointerEvents: 'none' }}>
        <Feuille ref={mesureRef} cv={cv} />
      </div>
    </div>
  );
}
