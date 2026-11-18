// Équivalences personnelles (ex. « SIRH, HRIS, Workday ») : comptent comme des synonymes
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { decouperListe } from '../../lib/cv';

export function MesEquivalences() {
  const liste = useAppStore(e => e.synonymesPerso);
  const ajouter = useAppStore(e => e.ajouterSynonyme);
  const supprimer = useAppStore(e => e.supprimerSynonyme);
  const [texte, setTexte] = useState('');
  const termes = decouperListe(texte);
  const valider = () => { if (termes.length >= 2) { ajouter(termes); setTexte(''); } };
  return (
    <div className="card">
      <h3 className="font-semibold mb-1">Mes équivalences</h3>
      <p className="text-xs text-gray-500 mb-3">Le dictionnaire reconnaît déjà de nombreux synonymes français ↔ anglais (ex. « financial modeling » = « modélisation financière »). Ajoutez les vôtres : tous les termes d'une ligne compteront comme le même mot-clé.</p>
      <form className="flex gap-2 mb-3" onSubmit={e => { e.preventDefault(); valider(); }}>
        <input className="input" value={texte} onChange={e => setTexte(e.target.value)} placeholder="ex. SIRH, HRIS, logiciel RH" aria-label="Termes équivalents, séparés par des virgules" />
        <button className="btn" disabled={termes.length < 2}><Plus size={14} /> Ajouter</button>
      </form>
      {liste.length > 0 && (
        <ul className="space-y-1.5">
          {liste.map(e => (
            <li key={e.id} className="flex items-center gap-2 text-sm rounded-md border border-gray-200 px-2 py-1">
              <span className="flex-1">{e.termes.join(' = ')}</span>
              <button className="icon-btn text-red-600" aria-label="Supprimer cette équivalence" onClick={() => supprimer(e.id)}><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
