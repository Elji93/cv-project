// Choix du modèle : chaque carte montre une miniature du CV actuel dans ce modèle
import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { LARGEUR_A4_PX, HAUTEUR_A4_PX } from '../../lib/mesurePage';
import { TEMPLATES } from '../feuille/templates';
import { Feuille } from '../feuille/Feuille';

export function ChoixTemplate() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  // L'échelle de la miniature s'adapte à la largeur réelle des cartes
  const grille = useRef<HTMLDivElement>(null);
  const [echelle, setEchelle] = useState(0.16);
  useEffect(() => {
    const el = grille.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      const cadre = el.querySelector<HTMLElement>('[data-miniature]');
      if (cadre) setEchelle(cadre.clientWidth / LARGEUR_A4_PX);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={grille} className="grid grid-cols-3 gap-2 mb-2">
      {TEMPLATES.map(t => {
        const actif = cv.templateId === t.id;
        return (
          <button key={t.id} onClick={() => modifier(c => { c.templateId = t.id; })} aria-pressed={actif}
            className={`text-left rounded-lg border p-1.5 bg-white transition ${actif ? 'border-brand-2 ring-1 ring-brand-2' : 'border-gray-200 hover:border-gray-300'}`}>
            {/* Miniature : la vraie feuille, réduite */}
            <div className="relative overflow-hidden rounded border border-gray-100 bg-white pointer-events-none"
              data-miniature style={{ width: '100%', aspectRatio: `${LARGEUR_A4_PX} / ${HAUTEUR_A4_PX}` }} aria-hidden="true">
              <div style={{ transform: `scale(${echelle})`, transformOrigin: 'top left', width: LARGEUR_A4_PX }}>
                <Feuille cv={{ ...cv, templateId: t.id }} />
              </div>
              {actif && <span className="absolute top-1 right-1 rounded-full bg-brand-2 text-white p-0.5"><Check size={11} /></span>}
            </div>
            <b className="block text-[12px] leading-tight mt-1.5">{t.nom}</b>
            <span className="block text-[10.5px] text-gray-500 leading-snug">{t.description}</span>
          </button>
        );
      })}
    </div>
  );
}
