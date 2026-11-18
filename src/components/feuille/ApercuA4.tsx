// ============================================================================
//  Aperçu de la feuille A4 : mise à l'échelle, zoom, alerte de dépassement,
//  bouton « Tout faire tenir sur 1 page »
// ============================================================================
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Minus, MoveHorizontal, Plus, Scan } from 'lucide-react';
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { HAUTEUR_A4_PX, LARGEUR_A4_PX, tientSurUnePage, useMesurePage } from '../../lib/mesurePage';
import { TAILLE_POLICE_MIN } from '../../data/constantes';
import type { StyleCV } from '../../types';
import { Feuille } from './Feuille';

/**
 * Réduit d'abord les espacements, puis l'interligne, puis la taille de police (jamais sous 9,5 pt),
 * en mesurant la feuille à chaque étape.
 */
export function calculerAjustement(page: HTMLElement, depart: StyleCV): StyleCV {
  const s = { ...depart };
  const appliquer = () => {
    page.style.setProperty('--cv-gap', String(s.espacementSections));
    page.style.setProperty('--cv-lh', String(s.interligne));
    page.style.setProperty('--cv-size', `${s.taillePolice}pt`);
    page.style.setProperty('--cv-margin', `${s.marges}mm`);
  };
  const etapes: (() => boolean)[] = [
    () => s.espacementSections > 0.6 && ((s.espacementSections = +(s.espacementSections - 0.1).toFixed(2)), true),
    () => s.interligne > 1.1 && ((s.interligne = +(s.interligne - 0.04).toFixed(2)), true),
    () => s.marges > 10 && ((s.marges -= 1), true),
    () => s.taillePolice > TAILLE_POLICE_MIN && ((s.taillePolice = Math.max(TAILLE_POLICE_MIN, +(s.taillePolice - 0.25).toFixed(2))), true),
  ];
  for (let garde = 0; garde < 100 && !tientSurUnePage(page.scrollHeight); garde++) {
    const etape = etapes.find(e => e()); // la première réduction encore possible
    if (!etape) break;
    appliquer();
  }
  return s;
}

export function ApercuA4() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  const pageRef = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const { hauteur, tient, depassementPct } = useMesurePage(pageRef);
  /** 'largeur' = la feuille occupe la largeur ; 'page' = la page entière est visible ; nombre = zoom manuel */
  const [zoom, setZoom] = useState<'largeur' | 'page' | number>('largeur');
  const [zone, setZone] = useState({ l: 800, h: 800 });
  const [message, setMessage] = useState('');

  // On suit la taille de la zone d'aperçu pour calculer l'échelle de la feuille
  useEffect(() => {
    const el = zoneRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setZone({ l: el.clientWidth, h: el.clientHeight }));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const zoomLargeur = Math.min(1.25, Math.max(0.3, (zone.l - 48) / LARGEUR_A4_PX));
  const zoomPage = Math.min(zoomLargeur, Math.max(0.3, (zone.h - 100) / HAUTEUR_A4_PX));
  const z = zoom === 'largeur' ? zoomLargeur : zoom === 'page' ? zoomPage : zoom;

  const ajuster = () => {
    if (!pageRef.current) return;
    const style = calculerAjustement(pageRef.current, cv.style);
    modifier(c => { c.style = style; });
    setMessage(tientSurUnePage(pageRef.current.scrollHeight)
      ? 'CV ajusté sur une page ✓'
      : 'Toujours trop long à 9,5 pt : raccourcissez quelques puces ou masquez une section.');
    window.setTimeout(() => setMessage(''), 4000);
  };

  return (
    <div ref={zoneRef} id="apercu" className="flex-1 min-w-0 overflow-auto relative">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 px-4 py-2 bg-gray-100/95 backdrop-blur border-b border-gray-200">
        {tient ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full"><CheckCircle2 size={14} /> Tient sur 1 page A4</span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-red-600 px-2.5 py-1 rounded-full"><AlertTriangle size={14} /> Dépasse la page A4 (+{depassementPct} %)</span>
        )}
        <button onClick={ajuster} className="btn-sm"><Scan size={14} /> Tout faire tenir sur 1 page</button>
        <span className="text-xs text-gray-500 hidden md:inline">{message || 'Cliquez sur la feuille pour modifier le texte.'}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <button className="btn-sm px-1.5" aria-label="Dézoomer" onClick={() => setZoom(Math.max(0.3, +(z - 0.1).toFixed(2)))}><Minus size={14} /></button>
          <span className="w-10 text-center tabular-nums">{Math.round(z * 100)}%</span>
          <button className="btn-sm px-1.5" aria-label="Zoomer" onClick={() => setZoom(Math.min(2, +(z + 0.1).toFixed(2)))}><Plus size={14} /></button>
          <button className={`btn-sm ${zoom === 'largeur' ? 'border-brand-2 text-brand-2' : ''}`} onClick={() => setZoom('largeur')} title="Adapter à la largeur"><MoveHorizontal size={13} /> Largeur</button>
          <button className={`btn-sm ${zoom === 'page' ? 'border-brand-2 text-brand-2' : ''}`} onClick={() => setZoom('page')} title="Voir la page entière"><FileText size={13} /> Page</button>
        </div>
      </div>

      <div className="py-6 flex justify-center">
        <div style={{ width: LARGEUR_A4_PX * z, height: Math.max(hauteur, HAUTEUR_A4_PX) * z }}>
          <div className="relative shadow-[0_2px_6px_rgba(0,0,0,.08),0_12px_40px_rgba(0,0,0,.12)]" style={{ transform: `scale(${z})`, transformOrigin: 'top left', width: LARGEUR_A4_PX }}>
            <Feuille ref={pageRef} cv={cv} modifier={modifier} />
            <div className={`page-limit${tient ? '' : ' depasse'}`}><span>{tient ? 'Fin de la page A4' : 'Fin de la page A4 — le texte en dessous sera coupé'}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
