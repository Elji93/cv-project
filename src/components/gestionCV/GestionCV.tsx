// ============================================================================
//  Barre de gestion des CV : choisir le CV ouvert, en créer un, gérer la liste
// ============================================================================
import { lazy, Suspense, useState } from 'react';
import { FileUp, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { confirmer } from '../../store/dialogues';
import { nomComplet } from '../../lib/cv';
import { ModaleNouveauCv } from './ModaleNouveauCv';
import { ModaleMesCv } from './ModaleMesCv';
// La fenêtre d'import (et la reconnaissance des CV) est chargée à la demande
const ModaleImport = lazy(() => import('../import/ModaleImport').then(m => ({ default: m.ModaleImport })));

export function GestionCV() {
  const cvs = useAppStore(e => e.cvs);
  const actif = useAppStore(e => e.cvActifId);
  const selectionner = useAppStore(e => e.selectionnerCv);
  const supprimer = useAppStore(e => e.supprimerCv);
  const nomActif = cvs.find(c => c.id === actif)?.nom ?? '';
  const [ouverte, setOuverte] = useState<null | 'nouveau' | 'liste' | 'import'>(null);
  return (
    <div className="flex items-center gap-1.5 p-3 border-b border-gray-200">
      <select className="input flex-1 min-w-0" value={actif} onChange={e => selectionner(e.target.value)} aria-label="CV ouvert">
        {cvs.map(c => <option key={c.id} value={c.id}>{c.nom}{nomComplet(c) ? ` — ${nomComplet(c)}` : ''}</option>)}
      </select>
      <button className="icon-btn border border-gray-200" title="Nouveau CV" aria-label="Nouveau CV" onClick={() => setOuverte('nouveau')}><Plus size={16} /></button>
      <button className="icon-btn border border-gray-200" title="Importer un CV (PDF, Canva, Word, LibreOffice, tableau Excel)" aria-label="Importer un CV" onClick={() => setOuverte('import')}><FileUp size={16} /></button>
      <button className="icon-btn border border-gray-200 text-red-600" title="Supprimer ce CV" aria-label="Supprimer ce CV"
        onClick={async () => { if (await confirmer({ titre: 'Supprimer ce CV ?', message: `« ${nomActif} »\nVous pourrez annuler avec Ctrl+Z tant que la page reste ouverte.`, libelleOk: 'Supprimer', danger: true })) supprimer(actif); }}>
        <Trash2 size={16} />
      </button>
      <button className="icon-btn border border-gray-200" title="Mes CV et sauvegardes" aria-label="Mes CV et sauvegardes" onClick={() => setOuverte('liste')}><FolderOpen size={16} /></button>
      {ouverte === 'nouveau' && <ModaleNouveauCv onFermer={() => setOuverte(null)} onImporter={() => setOuverte('import')} />}
      {ouverte === 'import' && <Suspense fallback={null}><ModaleImport onFermer={() => setOuverte(null)} /></Suspense>}
      {ouverte === 'liste' && <ModaleMesCv onFermer={() => setOuverte(null)} />}
    </div>
  );
}
