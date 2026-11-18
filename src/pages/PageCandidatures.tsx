// ============================================================================
//  Page « Suivi des candidatures » : tableau triable et filtrable.
//  Les candidatures sont sauvegardées avec le reste (navigateur + export JSON).
// ============================================================================
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, BellRing, ExternalLink, Mail, Plus, Search, Trash2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { confirmer } from '../store/dialogues';
import {
  aRelancer, candidatureVide, DELAI_RELANCE, filtrerCandidatures, joursDepuis, lettreVierge, STATUTS, trierCandidatures,
  type ColonneTri,
} from '../lib/lettre';
import type { Candidature, StatutCandidature } from '../types';

const COLONNES: { id: ColonneTri; libelle: string }[] = [
  { id: 'entreprise', libelle: 'Entreprise' },
  { id: 'poste', libelle: 'Poste' },
  { id: 'dateEnvoi', libelle: "Date d'envoi" },
];

export function PageCandidatures() {
  const candidatures = useAppStore(e => e.candidatures);
  const cvs = useAppStore(e => e.cvs);
  const lettres = useAppStore(e => e.lettres);
  const { ajouterCandidature, modifierCandidature, supprimerCandidatures, ajouterLettre } = useAppStore.getState();
  const [tri, setTri] = useState<{ col: ColonneTri; sens: 1 | -1 }>({ col: 'dateEnvoi', sens: -1 });
  const [statuts, setStatuts] = useState<StatutCandidature[]>([]);
  const [recherche, setRecherche] = useState('');
  const [selection, setSelection] = useState<string[]>([]);
  const naviguer = useNavigate();

  const visibles = useMemo(
    () => trierCandidatures(filtrerCandidatures(candidatures, statuts, recherche), tri.col, tri.sens),
    [candidatures, statuts, recherche, tri],
  );
  const relances = candidatures.filter(c => aRelancer(c));
  const compte = (s: StatutCandidature) => candidatures.filter(c => c.statut === s).length;
  const reponses = candidatures.filter(c => c.statut === 'entretien' || c.statut === 'offre' || c.statut === 'refus').length;

  const trier = (col: ColonneTri) => setTri(t => ({ col, sens: t.col === col ? (t.sens === 1 ? -1 : 1) : col === 'dateEnvoi' || col === 'scoreAts' ? -1 : 1 }));
  const basculerStatut = (s: StatutCandidature) => setStatuts(l => (l.includes(s) ? l.filter(x => x !== s) : [...l, s]));
  const modif = (id: string) => <K extends keyof Candidature>(k: K, v: Candidature[K]) => modifierCandidature(id, c => { c[k] = v; });

  const supprimer = async (ids: string[]) => {
    if (!ids.length) return;
    if (!await confirmer({
      titre: ids.length > 1 ? `Supprimer ${ids.length} candidatures ?` : 'Supprimer cette candidature ?',
      message: 'Les CV et les lettres liés ne sont pas supprimés. Ctrl+Z pour annuler.', libelleOk: 'Supprimer', danger: true,
    })) return;
    supprimerCandidatures(ids);
    setSelection([]);
  };

  const creerLettre = (c: Candidature) => {
    const cv = cvs.find(x => x.id === c.cvId) ?? cvs[0];
    const l = lettreVierge(cv, { entreprise: c.entreprise, poste: c.poste });
    ajouterLettre(l);
    modifierCandidature(c.id, x => { x.lettreId = l.id; });
    naviguer(`/lettre/${l.id}`);
  };

  const enTete = (col: ColonneTri, libelle: string, classe = '') => (
    <th className={`text-left font-semibold px-2 py-2 whitespace-nowrap ${classe}`}>
      <button className="inline-flex items-center gap-1 hover:text-brand-2" onClick={() => trier(col)}>
        {libelle}
        {tri.col === col ? (tri.sens === 1 ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} className="opacity-30" />}
      </button>
    </th>
  );

  const toutCoche = visibles.length > 0 && visibles.every(c => selection.includes(c.id));

  return (
    <main className="flex-1 min-h-0 overflow-auto p-4 lg:p-6">
      <div className="max-w-[1300px] mx-auto">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold flex-1">Suivi des candidatures</h2>
          <button className="btn-primary" onClick={() => ajouterCandidature(candidatureVide({ cvId: useAppStore.getState().cvActifId }))}>
            <Plus size={15} /> Nouvelle candidature
          </button>
        </div>

        {/* Chiffres clés */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
          <Chiffre libelle="Candidatures" valeur={candidatures.length} />
          {STATUTS.map(s => <Chiffre key={s.id} libelle={s.libelle} valeur={compte(s.id)} classe={s.classe} />)}
        </div>
        {candidatures.length > 0 && (
          <p className="text-xs text-gray-500 mb-3">
            Taux de réponse : <b>{Math.round((reponses / candidatures.length) * 100)} %</b> ({reponses} réponse{reponses > 1 ? 's' : ''} sur {candidatures.length}).
          </p>
        )}
        {relances.length > 0 && (
          <div className="flex items-start gap-2 text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2 mb-4">
            <BellRing size={16} className="shrink-0 mt-0.5" />
            <span>
              {relances.length} candidature{relances.length > 1 ? 's' : ''} sans réponse depuis {DELAI_RELANCE} jours ou plus :{' '}
              <b>{relances.map(c => c.entreprise || 'sans nom').join(', ')}</b>. Une relance courte par e-mail, puis passez le statut à « Relancée ».
            </span>
          </div>
        )}

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-8" placeholder="Rechercher (entreprise, poste, notes)" value={recherche} onChange={e => setRecherche(e.target.value)} />
          </div>
          {STATUTS.map(s => (
            <button key={s.id} onClick={() => basculerStatut(s.id)}
              className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statuts.includes(s.id) ? s.classe + ' ring-2 ring-offset-1 ring-sky-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {s.libelle}
            </button>
          ))}
          {(statuts.length > 0 || recherche) && <button className="text-xs text-brand-2 underline" onClick={() => { setStatuts([]); setRecherche(''); }}>Effacer les filtres</button>}
          <div className="flex-1" />
          {selection.length > 0 && <button className="btn text-red-700" onClick={() => supprimer(selection)}><Trash2 size={14} /> Supprimer ({selection.length})</button>}
        </div>

        {candidatures.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 text-center text-sm text-gray-600">
            Aucune candidature pour l'instant. Ajoutez-en une ici, depuis l'<Link to="/analyseur" className="text-brand-2 underline">analyseur</Link> (avec le score ATS)
            ou depuis une <Link to="/lettre" className="text-brand-2 underline">lettre de motivation</Link>.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[1050px]">
              <thead className="bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
                <tr>
                  <th className="px-2 py-2 w-8">
                    <input type="checkbox" aria-label="Tout sélectionner" checked={toutCoche}
                      onChange={() => setSelection(toutCoche ? [] : visibles.map(c => c.id))} />
                  </th>
                  {COLONNES.map(c => enTete(c.id, c.libelle))}
                  <th className="text-left font-semibold px-2 py-2">Version du CV</th>
                  <th className="text-left font-semibold px-2 py-2">Lettre</th>
                  {enTete('scoreAts', 'Score ATS')}
                  {enTete('statut', 'Statut')}
                  <th className="text-left font-semibold px-2 py-2">Notes</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {visibles.map(c => {
                  const m = modif(c.id);
                  const jours = joursDepuis(c.dateEnvoi);
                  const lettre = lettres.find(l => l.id === c.lettreId);
                  const statut = STATUTS.find(s => s.id === c.statut)!;
                  return (
                    <tr key={c.id} className="border-b border-gray-100 last:border-0 align-top hover:bg-gray-50/60">
                      <td className="px-2 py-2"><input type="checkbox" aria-label="Sélectionner" checked={selection.includes(c.id)}
                        onChange={() => setSelection(s => (s.includes(c.id) ? s.filter(x => x !== c.id) : [...s, c.id]))} /></td>
                      <td className="px-1 py-1.5 w-44">
                        <input className="input" value={c.entreprise} placeholder="Entreprise" onChange={e => m('entreprise', e.target.value)} />
                        <div className="flex items-center gap-1 mt-1">
                          <input className="input !py-0.5 !text-xs" value={c.lien} placeholder="Lien de l'offre" onChange={e => m('lien', e.target.value)} />
                          {/^https?:\/\//.test(c.lien) && <a href={c.lien} target="_blank" rel="noreferrer noopener" className="icon-btn" title="Ouvrir l'offre"><ExternalLink size={13} /></a>}
                        </div>
                      </td>
                      <td className="px-1 py-1.5 w-52"><input className="input" value={c.poste} placeholder="Intitulé du poste" onChange={e => m('poste', e.target.value)} /></td>
                      <td className="px-1 py-1.5 w-36">
                        <input type="date" className="input" value={c.dateEnvoi} onChange={e => m('dateEnvoi', e.target.value)} />
                        {jours !== null && jours >= 0 && <div className={`text-[11px] mt-0.5 ${aRelancer(c) ? 'text-amber-700 font-semibold' : 'text-gray-400'}`}>
                          {jours === 0 ? "aujourd'hui" : `il y a ${jours} j`}{aRelancer(c) ? ' · à relancer' : ''}
                        </div>}
                      </td>
                      <td className="px-1 py-1.5 w-44">
                        <select className="input" value={c.cvId ?? ''} onChange={e => m('cvId', e.target.value || null)}>
                          <option value="">—</option>
                          {cvs.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}
                          {c.cvId && !cvs.some(x => x.id === c.cvId) && <option value={c.cvId}>(CV supprimé)</option>}
                        </select>
                      </td>
                      <td className="px-1 py-1.5 w-32">
                        {lettre
                          ? <Link to={`/lettre/${lettre.id}`} className="inline-flex items-center gap-1 text-brand-2 hover:underline text-xs mt-1.5"><Mail size={13} /> Ouvrir</Link>
                          : <button className="btn-sm mt-1" onClick={() => creerLettre(c)}><Plus size={12} /> Rédiger</button>}
                      </td>
                      <td className="px-1 py-1.5 w-24">
                        <input type="number" min={0} max={100} className="input" value={c.scoreAts ?? ''} placeholder="—"
                          onChange={e => m('scoreAts', e.target.value === '' ? null : Math.max(0, Math.min(100, Math.round(+e.target.value))))} />
                      </td>
                      <td className="px-1 py-1.5 w-32">
                        <select className={`input font-medium ${statut.classe}`} value={c.statut} onChange={e => m('statut', e.target.value as StatutCandidature)}>
                          {STATUTS.map(s => <option key={s.id} value={s.id}>{s.libelle}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1.5 min-w-48">
                        <textarea className="input resize-y !text-xs" rows={1} value={c.notes} placeholder="Contact, date d'entretien…" onChange={e => m('notes', e.target.value)} />
                      </td>
                      <td className="px-1 py-1.5">
                        <button className="icon-btn" onClick={() => supprimer([c.id])} title="Supprimer" aria-label="Supprimer la candidature"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  );
                })}
                {visibles.length === 0 && (
                  <tr><td colSpan={10} className="text-center text-gray-500 py-6">Aucune candidature ne correspond aux filtres.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-3">
          Le suivi est enregistré dans ce navigateur et inclus dans la sauvegarde JSON (Mes CV › Sauvegarder mes données).
        </p>
      </div>
    </main>
  );
}

function Chiffre({ libelle, valeur, classe = 'bg-white text-gray-800 border-gray-200' }: { libelle: string; valeur: number; classe?: string }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${classe}`}>
      <div className="text-xl font-bold leading-tight">{valeur}</div>
      <div className="text-xs opacity-80">{libelle}</div>
    </div>
  );
}

