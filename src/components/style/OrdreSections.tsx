// ============================================================================
//  Ordre des sections : glisser-déposer (@dnd-kit, souris, tactile et clavier)
//  ou boutons monter / descendre. On peut aussi renommer et masquer une section.
// ============================================================================
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical } from 'lucide-react';
import {
  closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CleSection } from '../../types';
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { LIBELLES_SECTIONS } from '../../data/constantes';
import { titreSection } from '../../lib/cv';

export function OrdreSections() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  const capteurs = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const deplacer = (de: number, vers: number) => modifier(c => { c.ordreSections = arrayMove(c.ordreSections, de, vers); });

  const finGlisser = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    deplacer(cv.ordreSections.indexOf(active.id as CleSection), cv.ordreSections.indexOf(over.id as CleSection));
  };

  return (
    <DndContext sensors={capteurs} collisionDetection={closestCenter} onDragEnd={finGlisser}>
      <SortableContext items={cv.ordreSections} strategy={verticalListSortingStrategy}>
        <ul className="mb-5">
          {cv.ordreSections.map((cle, i) => (
            <LigneSection key={cle} cle={cle} index={i} total={cv.ordreSections.length} onDeplacer={deplacer} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function LigneSection({ cle, index, total, onDeplacer }: { cle: CleSection; index: number; total: number; onDeplacer: (de: number, vers: number) => void }) {
  const cv = useCvActif();
  const modifier = useModifierCv();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: cle });
  const masquee = cv.sectionsMasquees.includes(cle);

  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 mb-1.5 text-[13px] ${isDragging ? 'border-brand-2 shadow-md relative z-10' : 'border-gray-200'} ${masquee ? 'opacity-50' : ''}`}>
      <button ref={setActivatorNodeRef} {...attributes} {...listeners} className="icon-btn cursor-grab active:cursor-grabbing touch-none"
        aria-label={`Déplacer la section ${LIBELLES_SECTIONS[cle]} (glisser, ou Espace puis flèches)`}>
        <GripVertical size={15} />
      </button>
      <input className="flex-1 min-w-0 bg-transparent outline-none" value={titreSection(cv, cle)} aria-label={`Titre de la section ${LIBELLES_SECTIONS[cle]}`}
        onChange={e => modifier(c => { c.titresPersonnalises[cle] = e.target.value; })} />
      <button className="icon-btn" aria-label={masquee ? 'Afficher la section' : 'Masquer la section'}
        onClick={() => modifier(c => { c.sectionsMasquees = masquee ? c.sectionsMasquees.filter(x => x !== cle) : [...c.sectionsMasquees, cle]; })}>
        {masquee ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button className="icon-btn" aria-label="Monter" disabled={index === 0} onClick={() => onDeplacer(index, index - 1)}><ArrowUp size={14} /></button>
      <button className="icon-btn" aria-label="Descendre" disabled={index === total - 1} onClick={() => onDeplacer(index, index + 1)}><ArrowDown size={14} /></button>
    </li>
  );
}
