// ============================================================================
//  Page « Lettre de motivation » : saisie guidée à gauche, feuille A4 à droite.
//  La lettre reprend l'en-tête, la police et la couleur du CV relié.
// ============================================================================
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, ClipboardList, FileDown, FileText, Loader2, Mail, Plus, Sparkles, Trash2,
} from 'lucide-react';
import { useAppStore, useCvActif } from '../store/useAppStore';
import { confirmer } from '../store/dialogues';
import { useImpression } from '../store/impression';
import { ChampTexte, ZoneTexte, Astuce, Champ } from '../components/commun/Champs';
import { FeuilleLettre } from '../components/lettre/FeuilleLettre';
import { ModaleExportPdf } from '../components/export/ModaleExportPdf';
import { BasculeVue, classesVue, type Vue } from '../components/commun/BasculeVue';
import { EVENEMENT_PDF } from '../components/commun/useRaccourcis';
import { LARGEUR_A4_PX, useMesurePage } from '../lib/mesurePage';
import { imprimer } from '../lib/export/exportPdf';
import {
  brouillonLettre, candidatureVide, lettreVierge, lieuDateAuto, nomFichierLettre, objetAuto, verifierLettre,
} from '../lib/lettre';
import type { LettreMotivation } from '../types';

const CLE_LETTRE_ACTIVE = 'cvstudio.v3.lettreActive';
const lire = () => { try { return localStorage.getItem(CLE_LETTRE_ACTIVE) ?? ''; } catch { return ''; } };

export function PageLettre() {
  const { id: idUrl } = useParams();
  const naviguer = useNavigate();
  const lettres = useAppStore(e => e.lettres);
  const cvs = useAppStore(e => e.cvs);
  const cvActif = useCvActif();
  const { ajouterLettre, modifierLettre, supprimerLettres } = useAppStore.getState();

  const id = idUrl ?? lire();
  const lettre = lettres.find(l => l.id === id) ?? lettres[0];
  useEffect(() => {
    if (lettre) try { localStorage.setItem(CLE_LETTRE_ACTIVE, lettre.id); } catch { /* ignoré */ }
  }, [lettre]);

  const nouvelle = () => {
    const l = lettreVierge(cvActif);
    ajouterLettre(l);
    naviguer(`/lettre/${l.id}`);
  };

  if (!lettre) {
    return (
      <main className="flex-1 grid place-items-center p-6">
        <div className="max-w-md text-center bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <Mail size={32} className="mx-auto text-brand-2 mb-3" />
          <h2 className="font-semibold text-lg mb-2">Lettre de motivation</h2>
          <p className="text-sm text-gray-600 mb-4">
            La lettre reprend automatiquement l'en-tête, la police et la couleur de votre CV « {cvActif.nom} ».
            Exportez-la ensuite en PDF ou en Word.
          </p>
          <button className="btn-primary" onClick={nouvelle}><Plus size={15} /> Créer ma première lettre</button>
        </div>
      </main>
    );
  }
  return <EditeurLettre key={lettre.id} lettre={lettre} lettres={lettres} cvs={cvs}
    onChoisir={i => naviguer(`/lettre/${i}`)} onNouvelle={nouvelle}
    onModifier={m => modifierLettre(lettre.id, m)}
    onSupprimer={async () => {
      if (!await confirmer({ titre: 'Supprimer cette lettre ?', message: `« ${lettre.nom} » sera supprimée (Ctrl+Z pour annuler).`, libelleOk: 'Supprimer', danger: true })) return;
      supprimerLettres([lettre.id]);
      naviguer('/lettre');
    }} />;
}

interface PropsEditeur {
  lettre: LettreMotivation;
  lettres: LettreMotivation[];
  cvs: ReturnType<typeof useAppStore.getState>['cvs'];
  onChoisir: (id: string) => void;
  onNouvelle: () => void;
  onModifier: (m: (l: LettreMotivation) => void) => void;
  onSupprimer: () => void;
}

function EditeurLettre({ lettre: l, lettres, cvs, onChoisir, onNouvelle, onModifier, onSupprimer }: PropsEditeur) {
  const naviguer = useNavigate();
  const cv = cvs.find(c => c.id === l.cvId) ?? cvs[0];
  const pageRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const { hauteur, tient, depassementPct } = useMesurePage(pageRef);
  const [largeur, setLargeur] = useState(800);
  const [aidePdf, setAidePdf] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState('');
  const [vue, setVue] = useState<Vue>('saisie');
  const cl = classesVue(vue);
  const candidature = useAppStore(e => e.candidatures.find(c => c.lettreId === l.id));

  useEffect(() => {
    const el = zoneRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setLargeur(el.clientWidth));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  // Ctrl+P sur cette page : PDF de la lettre (et non du CV)
  useEffect(() => {
    const surPdf = (e: Event) => { e.preventDefault(); setAidePdf(true); };
    window.addEventListener(EVENEMENT_PDF, surPdf);
    return () => window.removeEventListener(EVENEMENT_PDF, surPdf);
  }, []);
  // En quittant la lettre, la zone d'impression revient au CV
  useEffect(() => () => useImpression.setState({ lettreId: null }), []);
  const zoom = Math.min(1.1, Math.max(0.3, (largeur - 48) / LARGEUR_A4_PX));

  const notifier = (m: string) => { setMessage(m); window.setTimeout(() => setMessage(''), 3500); };
  const champ = <K extends keyof LettreMotivation>(k: K) => (v: LettreMotivation[K]) => onModifier(x => { x[k] = v; });
  const alertes = verifierLettre(cv, l);
  const mots = l.corps.split(/\s+/).filter(Boolean).length;

  const preremplir = async () => {
    if (l.corps.trim() && !await confirmer({ titre: 'Remplacer le texte ?', message: 'Le corps actuel sera remplacé par un brouillon (Ctrl+Z pour revenir en arrière).', libelleOk: 'Remplacer' })) return;
    onModifier(x => { x.corps = brouillonLettre(cv, x); });
  };

  const changerEntreprise = (v: string) => onModifier(x => {
    const ancien = x.entreprise;
    x.entreprise = v;
    // le nom et le destinataire suivent tant qu'ils n'ont pas été personnalisés
    if (x.nom === 'Nouvelle lettre' || x.nom === `Lettre — ${ancien}`) x.nom = v.trim() ? `Lettre — ${v.trim()}` : 'Nouvelle lettre';
    if (!x.destinataire.trim() || x.destinataire === `Service Recrutement\n${ancien}`) x.destinataire = v.trim() ? `Service Recrutement\n${v.trim()}` : '';
  });
  const changerPoste = (v: string) => onModifier(x => {
    if (x.objet === objetAuto(cv, x.poste)) x.objet = objetAuto(cv, v);
    x.poste = v;
  });

  const word = async () => {
    setEnCours(true);
    try { const { exporterLettreWord } = await import('../lib/export/exportLettreWord'); await exporterLettreWord(cv, l); notifier('Fichier Word téléchargé ✓'); }
    catch (e) { console.error(e); notifier('Erreur export Word : ' + (e as Error).message); }
    finally { setEnCours(false); }
  };
  const pdf = () => {
    useImpression.setState({ lettreId: l.id });
    imprimer(nomFichierLettre(cv, l), () => useImpression.setState({ lettreId: null }));
  };

  const suivre = () => {
    if (candidature) { naviguer('/candidatures'); return; }
    useAppStore.getState().ajouterCandidature(candidatureVide({
      entreprise: l.entreprise, poste: l.poste, cvId: cv.id, lettreId: l.id,
    }));
    notifier('Candidature ajoutée au suivi ✓');
  };

  return (
    <main className="flex-1 min-h-0 flex flex-col lg:flex-row">
      <BasculeVue vue={vue} onVue={setVue} />
      <aside className={`${cl.saisie} lg:w-[400px] xl:w-[440px] flex-1 lg:flex-none bg-white lg:border-r border-gray-200 flex-col min-h-0`}>
        <div className="flex items-center gap-2 p-3 border-b border-gray-200">
          <select className="input flex-1" value={l.id} onChange={e => onChoisir(e.target.value)} aria-label="Lettre ouverte">
            {lettres.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}
          </select>
          <button className="icon-btn" onClick={onNouvelle} title="Nouvelle lettre" aria-label="Nouvelle lettre"><Plus size={17} /></button>
          <button className="icon-btn" onClick={onSupprimer} title="Supprimer cette lettre" aria-label="Supprimer cette lettre"><Trash2 size={16} /></button>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4">
          <Champ libelle="CV relié (en-tête, police et couleur)">
            <select className="input" value={cv.id} onChange={e => onModifier(x => { x.cvId = e.target.value; })}>
              {cvs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </Champ>
          <div className="grid grid-cols-2 gap-x-3">
            <ChampTexte libelle="Entreprise" valeur={l.entreprise} onValeur={changerEntreprise} placeholder="ex. KPMG" />
            <ChampTexte libelle="Poste visé" valeur={l.poste} onValeur={changerPoste} placeholder={cv.donnees.infosPerso.titre || 'ex. Auditeur junior'} />
          </div>
          <ChampTexte libelle="Nom de la lettre" valeur={l.nom} onValeur={champ('nom')} />
          <ZoneTexte libelle="Destinataire" rows={3} valeur={l.destinataire} onValeur={champ('destinataire')}
            placeholder={'Mme Claire Dupont\nResponsable recrutement\nKPMG — 2 avenue Gambetta, 92400 Courbevoie'}
            aide="Nommez la personne quand vous la connaissez : c'est plus engageant." />
          <ChampTexte libelle="Lieu et date" valeur={l.lieuDate} onValeur={champ('lieuDate')} placeholder={`Automatique : ${lieuDateAuto(cv)}`} />
          <ChampTexte libelle="Objet" valeur={l.objet} onValeur={champ('objet')} />
          <ChampTexte libelle="Formule d'appel" valeur={l.appel} onValeur={champ('appel')} />

          <div className="flex items-center mb-1">
            <span className="text-xs font-semibold text-gray-500 flex-1">Corps de la lettre <span className="font-normal">— {mots} mots</span></span>
            <button className="btn-sm" onClick={preremplir}><Sparkles size={13} /> Préremplir un brouillon</button>
          </div>
          <ZoneTexte libelle="" rows={14} valeur={l.corps} onValeur={champ('corps')}
            placeholder="Séparez les paragraphes par une ligne vide."
            aide={<>Plan conseillé en 3 paragraphes : <b>vous</b> (pourquoi cette entreprise), <b>moi</b> (2 réalisations chiffrées liées à l'offre), <b>nous</b> (ce que vous apporterez, demande d'entretien). Les passages entre [crochets] sont à remplacer.</>} />
          <ZoneTexte libelle="Formule de politesse" rows={2} valeur={l.politesse} onValeur={champ('politesse')} />

          {alertes.length > 0 ? (
            <Astuce ton="alerte">
              <b className="flex items-center gap-1 mb-1"><AlertTriangle size={14} /> À vérifier avant l'envoi</b>
              <ul className="list-disc pl-4">{alertes.map(a => <li key={a}>{a}</li>)}</ul>
            </Astuce>
          ) : (
            <Astuce><span className="flex items-center gap-1"><CheckCircle2 size={14} /> Lettre complète, prête à être exportée.</span></Astuce>
          )}
          <button className="btn w-full" onClick={suivre}>
            <ClipboardList size={15} /> {candidature ? 'Voir dans le suivi des candidatures' : 'Ajouter au suivi des candidatures'}
          </button>
        </div>
      </aside>

      <div ref={zoneRef} className={`${cl.apercu} flex-col flex-1 min-w-0 min-h-0 overflow-auto relative`}>
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 px-4 py-2 bg-gray-100/95 backdrop-blur border-b border-gray-200">
          {tient ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full"><CheckCircle2 size={14} /> Tient sur 1 page A4</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-red-600 px-2.5 py-1 rounded-full"><AlertTriangle size={14} /> Dépasse la page A4 (+{depassementPct} %)</span>
          )}
          <div className="flex-1" />
          <button className="btn" onClick={() => setAidePdf(true)}><FileDown size={15} /> PDF</button>
          <button className="btn" onClick={word} disabled={enCours}>
            {enCours ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} Word
          </button>
        </div>
        <div className="p-6 flex justify-center">
          <div style={{ width: LARGEUR_A4_PX * zoom, height: hauteur * zoom }} className="relative">
            <div className="absolute top-0 left-0 shadow-lg origin-top-left" style={{ transform: `scale(${zoom})` }}>
              <FeuilleLettre ref={pageRef} cv={cv} lettre={l} />
            </div>
          </div>
        </div>
        {message && <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">{message}</div>}
      </div>

      {aidePdf && <ModaleExportPdf nom={nomFichierLettre(cv, l)} quoi="lettre" tient={tient} onImprimer={pdf} onFermer={() => setAidePdf(false)} />}
    </main>
  );
}
