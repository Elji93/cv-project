// ============================================================================
//  Panneau « Mise en forme » : modèle, langue, couleur, police, espacements,
//  ordre et visibilité des sections
// ============================================================================
import { RotateCcw } from 'lucide-react';
import type { LangueCV, StyleCV } from '../../types';
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { COULEURS, POLICES, STYLE_PAR_DEFAUT } from '../../data/constantes';
import { OrdreSections } from './OrdreSections';
import { definitionTemplate } from '../feuille/templates';
import { ChoixTemplate } from './ChoixTemplate';

type CleCurseur = 'taillePolice' | 'interligne' | 'espacementSections' | 'marges';

export function PanneauStyle() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  const s = cv.style;

  const changerStyle = <K extends keyof StyleCV>(k: K, v: StyleCV[K]) => modifier(c => { c.style[k] = v; });

  const curseur = (k: CleCurseur, libelle: string, min: number, max: number, pas: number, unite: string) => (
    <label className="grid grid-cols-[120px_1fr_56px] items-center gap-2 text-[12.5px] mb-2">
      <span>{libelle}</span>
      <input type="range" min={min} max={max} step={pas} value={s[k]} onChange={e => changerStyle(k, +e.target.value)} />
      <output className="text-right text-gray-500 tabular-nums">{s[k]}{unite}</output>
    </label>
  );

  return (
    <div className="p-4 overflow-y-auto h-full">
      <h4 className="subhead">Modèle</h4>
      <ChoixTemplate />
      <p className="text-[11.5px] text-gray-500 mb-5">
        {cv.templateId === 'moderne' && (cv.donnees.infosPerso.photo ? 'La photo se règle dans Saisie › Infos & photo.' : 'Ajoutez une photo dans Saisie › Infos & photo.')}
        {cv.templateId === 'rh' && 'Le groupe de compétences « Outils » (ou « Logiciels », « SIRH »…) est affiché en premier et encadré.'}
        {cv.templateId === 'finance' && "Le modèle le plus sûr pour les ATS des banques et cabinets. La petite photo est facultative : décochez « Afficher » (Infos & photo) pour les candidatures UK / US."}
        {!definitionTemplate(cv.templateId).photo && cv.donnees.infosPerso.photo?.affichee && ' Votre photo est conservée mais masquée dans ce modèle.'}
      </p>

      <h4 className="subhead">Langue du CV</h4>
      <div className="flex gap-2 mb-5">
        {(['fr', 'en'] as LangueCV[]).map(l => (
          <button key={l} onClick={() => modifier(c => { c.langue = l; })} className={`btn ${cv.langue === l ? 'border-brand-2 text-brand-2' : ''}`}>
            {l === 'fr' ? 'Français' : 'Anglais'}
          </button>
        ))}
        <span className="text-[11.5px] text-gray-500 self-center">Titres de sections et dates</span>
      </div>

      <h4 className="subhead">Couleur d'accent</h4>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {COULEURS.map(c => (
          <button key={c.valeur} title={c.nom} aria-label={c.nom} onClick={() => changerStyle('couleur', c.valeur)}
            className={`w-8 h-8 rounded-full border-2 border-white ${s.couleur.toLowerCase() === c.valeur ? 'ring-2 ring-brand-2' : 'ring-1 ring-gray-300'}`}
            style={{ background: c.valeur }} />
        ))}
        <label className="inline-flex items-center gap-1.5 text-xs text-gray-500">
          <input type="color" value={s.couleur} onChange={e => changerStyle('couleur', e.target.value)} className="w-9 h-8 rounded border border-gray-200 bg-white p-0.5 cursor-pointer" />
          Libre
        </label>
      </div>

      <h4 className="subhead">Police (compatibles ATS)</h4>
      <div className="grid grid-cols-3 gap-1.5 mb-5">
        {POLICES.map(f => (
          <button key={f.id} onClick={() => changerStyle('police', f.id)} style={{ fontFamily: f.css }}
            className={`rounded-md border px-2 py-1.5 text-[13px] bg-white ${s.police === f.id ? 'border-brand-2 ring-1 ring-brand-2' : 'border-gray-200 hover:border-gray-300'}`}>
            {f.id}
          </button>
        ))}
      </div>

      <h4 className="subhead">Mise en page</h4>
      {curseur('taillePolice', 'Taille du texte', 9, 12, 0.25, ' pt')}
      {curseur('interligne', 'Interligne', 1, 1.6, 0.02, '')}
      {curseur('espacementSections', 'Espacement sections', 0.5, 1.6, 0.05, '×')}
      {curseur('marges', 'Marges', 8, 25, 1, ' mm')}
      <label className="flex items-center justify-between text-[13px] my-3">
        Titres de section en majuscules
        <input type="checkbox" checked={s.majusculesTitres} onChange={e => changerStyle('majusculesTitres', e.target.checked)} />
      </label>

      <h4 className="subhead mt-4">Ordre des sections</h4>
      <p className="text-[11.5px] text-gray-500 mb-2">Glissez la poignée ⋮⋮ (ou Espace puis flèches au clavier), ou utilisez les flèches. Étudiant : Formation avant Expériences ; profil confirmé : l'inverse.</p>
      <OrdreSections />

      <button className="btn" onClick={() => modifier(c => { c.style = { ...STYLE_PAR_DEFAUT }; c.titresPersonnalises = {}; })}>
        <RotateCcw size={14} /> Réinitialiser la mise en forme
      </button>
    </div>
  );
}
