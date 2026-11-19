// ============================================================================
//  La feuille A4 du CV, avec les mots-clés trouvés surlignés (activable)
//  On copie le rendu de la feuille dans un cadre à part pour pouvoir y ajouter
//  les surlignages sans gêner React.
// ============================================================================
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CV } from '../../types';
import { regexSurlignage } from '../../lib/ats/normalisation';
import { HAUTEUR_A4_PX, LARGEUR_A4_PX } from '../../lib/mesurePage';
import { Feuille } from '../feuille/Feuille';
import { MesureCachee } from '../commun/MesureCachee';

function surligner(racine: HTMLElement, termes: string[]) {
  const regexes = termes.map(regexSurlignage).filter((r): r is RegExp => !!r);
  if (!regexes.length) return;
  const noeuds: Text[] = [];
  const parcours = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT);
  while (parcours.nextNode()) noeuds.push(parcours.currentNode as Text);
  for (const noeud of noeuds) {
    const texte = noeud.data;
    // zones à surligner (sans chevauchement)
    const zones: [number, number][] = [];
    for (const re of regexes) {
      re.lastIndex = 0;
      for (let m = re.exec(texte); m; m = re.exec(texte)) {
        if (!zones.some(([a, b]) => m!.index < b && m!.index + m![0].length > a)) zones.push([m.index, m.index + m[0].length]);
      }
    }
    if (!zones.length) continue;
    zones.sort((a, b) => a[0] - b[0]);
    const fragment = document.createDocumentFragment();
    let pos = 0;
    for (const [a, b] of zones) {
      fragment.append(texte.slice(pos, a));
      const mark = document.createElement('mark');
      mark.className = 'cv-surligne';
      mark.textContent = texte.slice(a, b);
      fragment.append(mark);
      pos = b;
    }
    fragment.append(texte.slice(pos));
    noeud.replaceWith(fragment);
  }
}

export function FeuilleSurlignee({ cv, termes }: { cv: CV; termes: string[] }) {
  const source = useRef<HTMLDivElement>(null);
  const copie = useRef<HTMLDivElement>(null);
  const cadre = useRef<HTMLDivElement>(null);
  const [actif, setActif] = useState(true);
  const [echelle, setEchelle] = useState(0.6);

  useLayoutEffect(() => {
    if (!source.current || !copie.current) return;
    copie.current.innerHTML = source.current.outerHTML;
    if (actif) surligner(copie.current, termes);
  });

  useEffect(() => {
    const el = cadre.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setEchelle(Math.min(1, el.clientWidth / LARGEUR_A4_PX)));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold flex-1">Votre CV</h3>
        <label className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="checkbox" checked={actif} onChange={e => setActif(e.target.checked)} />
          Surligner les mots-clés trouvés <mark className="cv-surligne text-xs px-1">exemple</mark>
        </label>
      </div>
      <div ref={cadre} className="relative overflow-hidden border border-gray-100 rounded" style={{ height: HAUTEUR_A4_PX * echelle }}>
        <div ref={copie} style={{ transform: `scale(${echelle})`, transformOrigin: 'top left', width: LARGEUR_A4_PX }} />
      </div>
      {/* rendu d'origine, invisible, recopié ci-dessus */}
      <MesureCachee>
        <Feuille ref={source} cv={cv} />
      </MesureCachee>
    </div>
  );
}
