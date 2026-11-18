// Liste des CV (ouvrir, renommer, dupliquer, supprimer) + sauvegarde / restauration JSON
import { useState } from 'react';
import { Copy, Download, FileUp, Pencil, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { extraireDonnees, useAppStore } from '../../store/useAppStore';
import { estImporte, nomComplet } from '../../lib/cv';
import { lireSauvegarde, telechargerSauvegarde } from '../../lib/export/exportJson';
import { confirmer, saisirTexte } from '../../store/dialogues';
import { Modale } from '../commun/Modale';

export function ModaleMesCv({ onFermer }: { onFermer: () => void }) {
  const etat = useAppStore();
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);
  /** CV cochés pour une suppression groupée */
  const [coches, setCoches] = useState<string[]>([]);
  const importes = etat.cvs.filter(estImporte).map(c => c.id);
  const basculer = (id: string) => setCoches(l => (l.includes(id) ? l.filter(x => x !== id) : [...l, id]));

  const supprimerSelection = async () => {
    if (!coches.length) return;
    const tous = coches.length === etat.cvs.length;
    if (!await confirmer({ titre: `Supprimer ${coches.length} CV ?`, message: `${tous ? 'Un CV vierge sera créé, car il en faut au moins un.\n' : ''}Vous pourrez annuler avec Ctrl+Z tant que la page reste ouverte.`, libelleOk: 'Supprimer', danger: true })) return;
    etat.supprimerCvs(coches);
    setMessage({ ok: true, texte: `${coches.length} CV supprimé${coches.length > 1 ? 's' : ''}. Ctrl+Z pour annuler.` });
    setCoches([]);
  };

  const restaurer = async (fichier?: File) => {
    if (!fichier) return;
    try {
      const { donnees, complete } = await lireSauvegarde(fichier);
      const n = donnees.cvs.length;
      if (complete) {
        if (!await confirmer({ titre: `Restaurer cette sauvegarde (${n} CV) ?`, message: 'Vos données actuelles seront remplacées (Ctrl+Z pour revenir en arrière).', libelleOk: 'Restaurer', danger: true })) return;
        etat.restaurer(donnees);
        setMessage({ ok: true, texte: `Sauvegarde restaurée : ${n} CV.` });
      } else {
        etat.ajouterCvs(donnees.cvs);
        setMessage({ ok: true, texte: `${n} CV ajouté${n > 1 ? 's' : ''}.` });
      }
    } catch (e) {
      setMessage({ ok: false, texte: (e as Error).message });
    }
  };

  return (
    <Modale titre="Mes CV" onFermer={onFermer}>
      {/* Sélection groupée */}
      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={coches.length === etat.cvs.length && etat.cvs.length > 0}
            onChange={e => setCoches(e.target.checked ? etat.cvs.map(c => c.id) : [])} />
          Tout sélectionner
        </label>
        {importes.length > 0 && (
          <button className="btn-sm" onClick={() => setCoches(importes)}><FileUp size={12} /> Sélectionner les CV importés ({importes.length})</button>
        )}
        <div className="flex-1" />
        <button className="btn-sm text-red-600 border-red-200 disabled:opacity-40" disabled={!coches.length} onClick={supprimerSelection}>
          <Trash2 size={12} /> Supprimer la sélection{coches.length ? ` (${coches.length})` : ''}
        </button>
      </div>
      <ul className="flex flex-col gap-2 mb-5">
        {etat.cvs.map(c => (
          <li key={c.id} className={`flex items-center gap-1.5 p-2 rounded-lg border ${coches.includes(c.id) ? 'border-red-300 bg-red-50' : c.id === etat.cvActifId ? 'border-brand-2 bg-sky-50' : 'border-gray-200'}`}>
            <input type="checkbox" checked={coches.includes(c.id)} onChange={() => basculer(c.id)} aria-label={`Sélectionner ${c.nom}`} />
            <button className="flex-1 min-w-0 text-left" onClick={() => { etat.selectionnerCv(c.id); onFermer(); }}>
              <b className="flex items-center gap-1.5 text-sm min-w-0">
                <span className="truncate">{c.nom}</span>
                {estImporte(c) && <span className="shrink-0 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5">Importé</span>}
              </b>
              <span className="text-xs text-gray-500">{nomComplet(c) || 'Sans nom'} · modifié le {new Date(c.dateModification).toLocaleDateString('fr-FR')}</span>
            </button>
            <button className="icon-btn" title="Renommer" aria-label={`Renommer ${c.nom}`}
              onClick={async () => { const n = await saisirTexte({ titre: 'Renommer le CV', message: 'Nouveau nom de la version :', valeur: c.nom }); if (n?.trim()) etat.renommerCv(c.id, n.trim()); }}><Pencil size={15} /></button>
            <button className="icon-btn" title="Dupliquer" aria-label={`Dupliquer ${c.nom}`} onClick={() => etat.dupliquerCv(c.id)}><Copy size={15} /></button>
            <button className="icon-btn text-red-600" title="Supprimer" aria-label={`Supprimer ${c.nom}`}
              onClick={async () => { if (await confirmer({ titre: 'Supprimer ce CV ?', message: `« ${c.nom} »\nVous pourrez annuler avec Ctrl+Z tant que la page reste ouverte.`, libelleOk: 'Supprimer', danger: true })) etat.supprimerCv(c.id); }}><Trash2 size={15} /></button>
          </li>
        ))}
      </ul>

      <h4 className="subhead">Sauvegarde</h4>
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={() => telechargerSauvegarde(extraireDonnees(etat))}><Download size={14} /> Sauvegarder mes données</button>
        <label className="btn cursor-pointer"><Upload size={14} /> Restaurer
          <input type="file" accept=".json,application/json" hidden onChange={e => { restaurer(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      </div>
      {message && <p className={`text-sm mt-2 ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>{message.texte}</p>}
      <p className="flex gap-1.5 text-xs text-gray-500 mt-4">
        <ShieldCheck size={15} className="shrink-0 text-emerald-600" />
        Vos données restent dans ce navigateur : rien n'est envoyé sur internet. Le fichier de sauvegarde (CV, candidatures, lettres) permet de les transférer sur un autre ordinateur.
      </p>
    </Modale>
  );
}
