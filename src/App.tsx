// ============================================================================
//  Structure générale : barre du haut, pages (HashRouter), zone d'impression
// ============================================================================
import { lazy, Suspense, useRef, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ClipboardList, FileDown, FileText, Gauge, Loader2, Mail, PenLine, Redo2, ShieldCheck, Undo2 } from 'lucide-react';
import { extraireDonnees, useAppStore, useCvActif } from './store/useAppStore';
import { Feuille } from './components/feuille/Feuille';
import { useRaccourcis } from './components/commun/useRaccourcis';
import { Dialogues } from './components/commun/Dialogues';
import { ModaleExportPdf } from './components/export/ModaleExportPdf';
import { useMesurePage } from './lib/mesurePage';
import { confirmer } from './store/dialogues';
import { exporterPdf } from './lib/export/exportPdf';
import { nomFichier } from './lib/export/nomFichier';
import { PageEditeur } from './pages/PageEditeur';
// Pages chargées à la demande : l'éditeur s'ouvre plus vite
const PageAnalyseur = lazy(() => import('./pages/PageAnalyseur').then(m => ({ default: m.PageAnalyseur })));
const PageLettre = lazy(() => import('./pages/PageLettre').then(m => ({ default: m.PageLettre })));
const PageCandidatures = lazy(() => import('./pages/PageCandidatures').then(m => ({ default: m.PageCandidatures })));
import { FeuilleLettre } from './components/lettre/FeuilleLettre';
import { useImpression } from './store/impression';
import { telechargerSauvegarde } from './lib/export/exportJson';
import { MesureCachee } from './components/commun/MesureCachee';

export function App() {
  const cv = useCvActif();
  const erreurSauvegarde = useAppStore(e => e.erreurSauvegarde);
  const peutAnnuler = useAppStore(e => e.passe.length > 0);
  const peutRetablir = useAppStore(e => e.futur.length > 0);
  const [enCours, setEnCours] = useState(false);
  const [notification, setNotification] = useState('');
  const [aidePdf, setAidePdf] = useState(false);
  // Feuille invisible qui sert à vérifier que le CV tient sur une page avant l'export
  const mesureRef = useRef<HTMLDivElement>(null);
  const { tient } = useMesurePage(mesureRef);
  const { pathname } = useLocation();
  const pageCv = pathname === '/' || pathname.startsWith('/analyseur');
  // Zone d'impression : le CV actif, ou la lettre demandée par la page Lettre
  const idImpression = useImpression(e => e.lettreId);
  const lettreAImprimer = useAppStore(e => (idImpression ? e.lettres.find(l => l.id === idImpression) : undefined));
  const cvs = useAppStore(e => e.cvs);

  const notifier = (m: string) => { setNotification(m); window.setTimeout(() => setNotification(''), 3500); };
  const word = async () => {
    if (!tient && !await confirmer({
      titre: 'Le CV dépasse une page',
      message: 'Le fichier Word fera plus d’une page. Utilisez « Tout faire tenir sur 1 page » dans l’aperçu, ou exportez quand même.',
      libelleOk: 'Exporter quand même',
    })) return;
    setEnCours(true);
    // (la bibliothèque Word est chargée seulement au moment de l'export : le site s'ouvre plus vite)
    try { const { exporterWord } = await import('./lib/export/exportWord'); await exporterWord(cv); notifier('Fichier Word téléchargé ✓'); }
    catch (e) { console.error(e); notifier('Erreur export Word : ' + (e as Error).message); }
    finally { setEnCours(false); }
  };
  const pdf = () => setAidePdf(true);
  useRaccourcis({
    onPdf: pdf,
    onSauvegarder: () => {
      telechargerSauvegarde(extraireDonnees(useAppStore.getState()));
      notifier('Sauvegarde JSON téléchargée ✓ (CV, lettres, candidatures)');
    },
  });

  const PAGES = [
    { to: '/', icone: <PenLine size={15} />, court: 'Éditeur', long: 'Éditeur' },
    { to: '/analyseur', icone: <Gauge size={15} />, court: 'Score ATS', long: 'Analyseur & Score ATS' },
    { to: '/lettre', icone: <Mail size={15} />, court: 'Lettre', long: 'Lettre de motivation' },
    { to: '/candidatures', icone: <ClipboardList size={15} />, court: 'Suivi', long: 'Candidatures' },
  ];

  const lien = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-md text-sm whitespace-nowrap ${isActive ? 'bg-white/15 text-white' : 'text-sky-100 hover:bg-white/10'}`;
  const bouton = 'inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg border border-white/30 hover:bg-white/10 text-sm disabled:opacity-40';
  // Barre d'onglets en bas de l'écran sur téléphone
  const onglet = ({ isActive }: { isActive: boolean }) =>
    `flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-medium ${isActive ? 'text-brand-2' : 'text-gray-500'}`;

  return (
    <>
      <div className="flex flex-col h-full pb-[calc(3.25rem+env(safe-area-inset-bottom))] md:pb-0">
        <header className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 bg-brand text-white sticky top-0 z-30">
          <div className="flex items-center gap-2 font-bold text-[17px] shrink-0">
            <span className="w-7 h-7 rounded-md bg-white text-brand grid place-items-center text-xs font-extrabold">CV</span>
            <span className="md:hidden lg:inline">CV Studio</span>
          </div>
          {/* Tablette et ordinateur : onglets dans la barre ; téléphone : barre en bas */}
          <nav className="hidden md:flex gap-1 min-w-0 overflow-x-auto no-scrollbar">
            {PAGES.map(p => (
              <NavLink key={p.to} to={p.to} end={p.to === '/'} className={lien} title={p.long}>
                {p.icone}<span className="xl:hidden">{p.court}</span><span className="hidden xl:inline">{p.long}</span>
              </NavLink>
            ))}
          </nav>
          <div className="flex-1" />
          <span className="hidden 2xl:inline-flex items-center gap-1 text-xs text-sky-100" title="Aucune donnée n'est envoyée sur internet">
            <ShieldCheck size={14} /> Données stockées uniquement sur cet appareil
          </span>
          <div className="flex gap-1 shrink-0">
            <button className={bouton} disabled={!peutAnnuler} onClick={() => useAppStore.getState().annuler()} title="Annuler (Ctrl+Z)" aria-label="Annuler"><Undo2 size={15} /></button>
            <button className={bouton} disabled={!peutRetablir} onClick={() => useAppStore.getState().retablir()} title="Rétablir (Ctrl+Y)" aria-label="Rétablir"><Redo2 size={15} /></button>
          </div>
          {pageCv && <div className="flex gap-1 shrink-0">
            <button onClick={pdf} className={bouton} title="Exporter le CV en PDF (Ctrl+P)" aria-label="Exporter le CV en PDF"><FileDown size={15} /><span className="hidden sm:inline">PDF</span></button>
            <button onClick={word} disabled={enCours} className={bouton} title="Exporter le CV en Word" aria-label="Exporter le CV en Word">
              {enCours ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}<span className="hidden sm:inline">Word</span>
            </button>
          </div>}
        </header>

        {erreurSauvegarde && <div className="bg-red-50 text-red-700 text-sm px-4 py-1.5 border-b border-red-200">{erreurSauvegarde}</div>}

        <Suspense fallback={<main className="flex-1 grid place-items-center text-sm text-gray-500"><Loader2 size={20} className="animate-spin" /></main>}>
        <Routes>
          <Route path="/" element={<PageEditeur />} />
          <Route path="/analyseur" element={<PageAnalyseur />} />
          <Route path="/lettre/:id?" element={<PageLettre />} />
          <Route path="/candidatures" element={<PageCandidatures />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>

        {aidePdf && <ModaleExportPdf nom={nomFichier(cv)} tient={tient} onImprimer={() => { useImpression.setState({ lettreId: null }); exporterPdf(cv); }} onFermer={() => setAidePdf(false)} />}
        <Dialogues />
        <MesureCachee>
          <Feuille ref={mesureRef} cv={cv} />
        </MesureCachee>
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]" aria-label="Navigation">
          {PAGES.map(p => (
            <NavLink key={p.to} to={p.to} end={p.to === '/'} className={onglet}>{p.icone}{p.court}</NavLink>
          ))}
        </nav>
        {notification && <div className="fixed bottom-16 md:bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">{notification}</div>}
      </div>

      {/* Rendu figé utilisé uniquement à l'impression (PDF) */}
      <div id="print-root" aria-hidden="true">
        {lettreAImprimer
          ? <FeuilleLettre cv={cvs.find(c => c.id === lettreAImprimer.cvId) ?? cv} lettre={lettreAImprimer} />
          : <Feuille cv={cv} />}
      </div>
    </>
  );
}
