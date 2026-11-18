// Création d'un CV : copie du CV actuel, page vierge ou CV exemple
import { useState } from 'react';
import { useAppStore, type DepartNouveauCv } from '../../store/useAppStore';
import { Modale } from '../commun/Modale';

const CHOIX: [DepartNouveauCv, string, string][] = [
  ['copie', 'Copie du CV actuel', 'Idéal pour adapter votre CV à une offre précise'],
  ['vierge', 'Page vierge', 'Toutes les sections vides'],
  ['exemple', 'CV exemple Analyste Finance / Audit', 'Pour tester rapidement'],
];

export function ModaleNouveauCv({ onFermer, onImporter }: { onFermer: () => void; onImporter: () => void }) {
  const creer = useAppStore(e => e.creerCv);
  const [nom, setNom] = useState('');
  const [depart, setDepart] = useState<DepartNouveauCv>('copie');
  return (
    <Modale titre="Nouveau CV" onFermer={onFermer}>
      <label className="flex flex-col gap-1 mb-3">
        <span className="text-xs font-semibold text-gray-500">Nom de la version (pour vous y retrouver)</span>
        <input className="input" autoFocus value={nom} placeholder="ex. CV Analyste M&A — Banque XYZ" onChange={e => setNom(e.target.value)} />
      </label>
      <div className="flex flex-col gap-2 mb-4 text-sm">
        {CHOIX.map(([v, titre, desc]) => (
          <label key={v} className={`flex gap-2 p-2.5 rounded-lg border cursor-pointer ${depart === v ? 'border-brand-2 bg-sky-50' : 'border-gray-200'}`}>
            <input type="radio" checked={depart === v} onChange={() => setDepart(v)} />
            <span><b className="block">{titre}</b><span className="text-gray-500 text-xs">{desc}</span></span>
          </label>
        ))}
      </div>
      <button className="w-full text-left p-2.5 rounded-lg border border-dashed border-gray-300 hover:border-brand-2 mb-4 text-sm" onClick={onImporter}>
        <b className="block">Importer un CV existant</b>
        <span className="text-gray-500 text-xs">PDF (y compris Canva), Word ou texte : converti au format Finance</span>
      </button>
      <div className="flex justify-end gap-2">
        <button className="btn" onClick={onFermer}>Annuler</button>
        <button className="btn-primary" onClick={() => { creer(depart, nom.trim() || undefined); onFermer(); }}>Créer</button>
      </div>
    </Modale>
  );
}
