// Ajout, recadrage (zoom + déplacement) et forme de la photo
import { useRef, useState, type PointerEvent } from 'react';
import { ImagePlus, Move, Trash2 } from 'lucide-react';
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { compresserPhoto, styleRecadrage } from '../../lib/photo';
import { definitionTemplate } from '../feuille/templates';
import { Astuce } from '../commun/Champs';

export function EditeurPhoto() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  const [erreur, setErreur] = useState('');
  const photo = cv.donnees.infosPerso.photo;
  /** Position de départ d'un glisser (pour déplacer la photo dans son cadre) */
  const depart = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);
  const borner = (v: number) => Math.max(-50, Math.min(50, Math.round(v)));

  const commencer = (e: PointerEvent<HTMLDivElement>) => {
    if (!photo) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    depart.current = { x: e.clientX, y: e.clientY, dx: photo.decalageX, dy: photo.decalageY };
  };
  const glisser = (e: PointerEvent<HTMLDivElement>) => {
    const d = depart.current;
    if (!d || !photo) return;
    const taille = e.currentTarget.clientWidth; // déplacement en % du cadre, corrigé du zoom
    const x = borner(d.dx + ((e.clientX - d.x) / taille) * 100 / photo.zoom);
    const y = borner(d.dy + ((e.clientY - d.y) / taille) * 100 / photo.zoom);
    if (x !== photo.decalageX || y !== photo.decalageY) modifier(c => { c.donnees.infosPerso.photo!.decalageX = x; c.donnees.infosPerso.photo!.decalageY = y; });
  };

  const charger = async (f?: File) => {
    if (!f) return;
    try {
      const image = await compresserPhoto(f);
      modifier(c => {
        c.donnees.infosPerso.photo = { image, forme: 'rond', zoom: 1, decalageX: 0, decalageY: 0, affichee: true };
      });
      setErreur('');
    } catch (e) { setErreur((e as Error).message); }
  };

  return (
    <div className="mb-4">
      <div className="flex gap-3 items-start">
        <div className={`w-24 h-24 shrink-0 overflow-hidden bg-gray-100 border border-gray-200 relative touch-none ${photo ? 'cursor-move' : ''} ${photo?.forme === 'rond' ? 'rounded-full' : ''}`}
          title={photo ? 'Glissez pour déplacer la photo dans le cadre' : undefined}
          onPointerDown={commencer} onPointerMove={glisser} onPointerUp={() => { depart.current = null; }} onPointerCancel={() => { depart.current = null; }}>
          {photo
            ? <img src={photo.image} alt="Aperçu" draggable={false} className="absolute inset-0 w-full h-full object-cover select-none" style={styleRecadrage(photo)} />
            : <span className="absolute inset-0 grid place-items-center text-gray-400"><ImagePlus size={22} /></span>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-2">
            <label className="btn cursor-pointer"><ImagePlus size={14} /> {photo ? 'Changer' : 'Ajouter une photo'}
              <input type="file" accept="image/*" hidden onChange={e => { charger(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            {photo && <button className="btn text-red-600" onClick={() => modifier(c => { c.donnees.infosPerso.photo = null; })}><Trash2 size={14} /> Retirer</button>}
          </div>
          {photo && (
            <>
              <div className="flex flex-wrap gap-3 text-xs mb-1">
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={photo.affichee} onChange={e => modifier(c => { c.donnees.infosPerso.photo!.affichee = e.target.checked; })} /> Afficher</label>
                <label className="flex items-center gap-1.5"><input type="radio" checked={photo.forme === 'rond'} onChange={() => modifier(c => { c.donnees.infosPerso.photo!.forme = 'rond'; })} /> Ronde</label>
                <label className="flex items-center gap-1.5"><input type="radio" checked={photo.forme === 'carre'} onChange={() => modifier(c => { c.donnees.infosPerso.photo!.forme = 'carre'; })} /> Carrée</label>
              </div>
              {([['zoom', 'Zoom', 1, 3, 0.05], ['decalageX', 'Horizontal', -50, 50, 1], ['decalageY', 'Vertical', -50, 50, 1]] as const).map(([k, l, min, max, pas]) => (
                <label key={k} className="grid grid-cols-[70px_1fr] items-center gap-2 text-xs text-gray-600">
                  {l}<input type="range" min={min} max={max} step={pas} value={photo[k]} onChange={e => modifier(c => { c.donnees.infosPerso.photo![k] = +e.target.value; })} />
                </label>
              ))}
            </>
          )}
        </div>
      </div>
      {erreur && <p className="text-xs text-red-600 mt-1">{erreur}</p>}
      {photo && <p className="flex items-center gap-1 text-[11.5px] text-gray-500 mt-1.5"><Move size={12} /> Glissez la photo pour la recadrer, ajustez le zoom avec le curseur.</p>}
      {photo && !definitionTemplate(cv.templateId).photo && <Astuce ton="alerte">Le modèle RH n'affiche pas de photo : choisissez « Finance » (petite photo) ou « Moderne » dans Mise en forme. Votre photo est conservée.</Astuce>}
      <Astuce ton="alerte">La photo est courante en France mais déconseillée pour les candidatures UK / US. Les ATS l'ignorent.</Astuce>
    </div>
  );
}
