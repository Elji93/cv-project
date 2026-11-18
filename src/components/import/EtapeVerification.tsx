// Étape 2 de l'import : vérifier ce qui a été reconnu avant de créer le CV
import { AlertCircle, CheckCircle2, ClipboardCopy, Inbox } from 'lucide-react';
import { useState } from 'react';
import type { InfosPerso, Photo } from '../../types';
import { calculerBilan, type ResultatImport } from '../../lib/import/decouperSections';
import type { LigneImportee } from '../../lib/import/lirePdf';
import { pointsACompleter, type Destination } from '../../lib/import/classer';
import { ChoixSection } from './ChoixSection';
import { formaterPeriode } from '../../lib/dates';
import { LIBELLES_SECTIONS, ORDRE_PAR_DEFAUT } from '../../data/constantes';
import { FragmentACocher } from './FragmentACocher';

interface Props {
  lignes: LigneImportee[];
  resultat: ResultatImport;
  /** Envoie des lignes d'un texte « À classer » vers une section (null = supprimer) */
  onClasser: (fragmentId: string, lignes: number[], section: Destination | null) => void;
  onInfo: (k: Exclude<keyof InfosPerso, 'photo'>, v: string) => void;
  /** Recopie une ligne du texte extrait vers un champ ou une rubrique (la ligne reste aussi où elle est) */
  onAttribuer: (texte: string, destination: Destination) => void;
  onPhoto: (p: Photo | null) => void;
}

const CHAMPS: [Exclude<keyof InfosPerso, 'photo'>, string][] = [
  ['prenom', 'Prénom'], ['nom', 'Nom'], ['titre', 'Titre / poste visé'], ['email', 'Email'],
  ['telephone', 'Téléphone'], ['ville', 'Ville'], ['linkedin', 'LinkedIn'], ['dateNaissance', 'Date de naissance'],
];

export function EtapeVerification({ lignes, resultat, onClasser, onInfo, onAttribuer, onPhoto }: Props) {
  const [ligneChoisie, setLigneChoisie] = useState<number | null>(null);
  const d = resultat.donnees;
  // On garde la photo trouvée de côté pour pouvoir la décocher puis la recocher
  const [photoTrouvee] = useState(d.infosPerso.photo);
  const [copie, setCopie] = useState('');
  /** Copie le texte extrait (pour le signaler si la reconnaissance se trompe) */
  const copier = async () => {
    const texte = lignes.map(l => (l.zone === 'pleine' ? '' : `[${l.zone}] `) + `[${Math.round(l.taille)}] ` + l.texte).join('\n');
    try { await navigator.clipboard.writeText(texte); setCopie('Copié ✓'); }
    catch { setCopie('Copie impossible'); }
    window.setTimeout(() => setCopie(''), 2500);
  };
  const bilan = calculerBilan(d);
  const points = pointsACompleter(d);
  return (
    <div className="grid lg:grid-cols-[1fr_1.3fr] gap-4">
      {/* Texte brut extrait, pour comparer */}
      <div className="min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="subhead mb-0 flex-1">Texte extrait ({lignes.length} lignes)</h4>
          <button className="btn-sm" onClick={copier} title="Copie le texte extrait, avec la colonne et la taille de chaque ligne, pour signaler une erreur de reconnaissance">
            <ClipboardCopy size={13} /> {copie || 'Copier'}
          </button>
        </div>
        <ol className="max-h-[55vh] overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-2 font-mono text-[11px] leading-relaxed text-gray-700">
          {lignes.map((l, i) => (
            <li key={i} title={l.zone === 'pleine' ? 'Cliquez pour attribuer cette ligne à vos infos perso' : `Colonne de ${l.zone} — cliquez pour l'attribuer à vos infos perso`}>
              <button type="button" onClick={() => setLigneChoisie(ligneChoisie === i ? null : i)}
                className={`w-full text-left rounded px-0.5 ${ligneChoisie === i ? 'bg-sky-100 ring-1 ring-sky-300' : 'hover:bg-white'} ${l.zone === 'gauche' ? 'text-sky-800' : ''}`}>
                {l.texte}
              </button>
            </li>
          ))}
        </ol>
        {ligneChoisie !== null && lignes[ligneChoisie] && (
          <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50 p-2 text-xs">
            <p className="mb-1.5 text-gray-700">Ligne choisie : <b className="break-words">« {lignes[ligneChoisie].texte} »</b></p>
            <ChoixSection valeur={null} donnees={d} libelleAucune="Attribuer à…" ariaLabel="Attribuer la ligne à un champ ou une rubrique"
              onChange={dest => { if (dest) { onAttribuer(lignes[ligneChoisie].texte, dest); setLigneChoisie(null); } }} />
            <p className="mt-1 text-[11px] text-gray-500">La ligne est recopiée à l'endroit choisi (infos perso, mission d'une expérience, dates d'une formation…). Vérifiez ensuite le résultat à droite.</p>
          </div>
        )}
        {ligneChoisie === null && <p className="text-[11px] text-gray-500 mt-1">Astuce : cliquez sur une ligne pour l'attribuer à un champ (ville, date de naissance, dates ou missions d'une expérience…).</p>}
        {lignes.some(l => l.zone !== 'pleine') && <p className="text-[11px] text-gray-500 mt-1">Mise en page en 2 colonnes détectée : la colonne de gauche (en bleu) est lue en premier.</p>}
      </div>

      {/* Ce que l'outil a compris */}
      <div className="min-w-0 max-h-[60vh] overflow-auto pr-1">
        <h4 className="subhead">Photo</h4>
        {photoTrouvee ? (
          <label className="flex items-center gap-3 mb-4 text-[13px] cursor-pointer">
            <img src={photoTrouvee.image} alt="Photo trouvée dans le CV" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
            <span className="flex items-center gap-1.5">
              <input type="checkbox" checked={!!d.infosPerso.photo} onChange={e => onPhoto(e.target.checked ? photoTrouvee : null)} />
              Importer cette photo <span className="text-gray-500">(recadrage et zoom ensuite dans Infos & photo)</span>
            </span>
          </label>
        ) : (
          <p className="text-[12.5px] text-gray-500 mb-4">Aucune photo trouvée dans le fichier. Vous pourrez en ajouter une dans Infos & photo.</p>
        )}

        <h4 className="subhead">Coordonnées (modifiables)</h4>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {CHAMPS.map(([k, libelle]) => (
            <label key={k} className={`flex flex-col gap-0.5 ${k === 'titre' ? 'col-span-2' : ''}`}>
              <span className="text-[11px] font-semibold text-gray-500">{libelle}</span>
              <input className={`input py-1 ${d.infosPerso[k] || k === 'dateNaissance' ? '' : 'border-amber-300 bg-amber-50'}`} value={d.infosPerso[k]} onChange={e => onInfo(k, e.target.value)} />
            </label>
          ))}
        </div>

        {d.rythmeAlternance && <p className="text-[13px] mb-4"><b>Rythme d'alternance</b> (ajouté au Profil) : {d.rythmeAlternance}</p>}

        <h4 className="subhead">Sections reconnues</h4>
        <ul className="grid grid-cols-2 gap-1.5 mb-4 text-[13px]">
          {ORDRE_PAR_DEFAUT.map(s => (
            <li key={s} className={`flex items-center gap-1.5 rounded-md px-2 py-1 ${bilan[s] ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-50 text-gray-400'}`}>
              {bilan[s] ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {LIBELLES_SECTIONS[s]} {s !== 'accroche' && <b className="ml-auto">{bilan[s]}</b>}
            </li>
          ))}
        </ul>

        {d.experiences.length > 0 && (
          <>
            <h4 className="subhead">Expériences</h4>
            <ul className="mb-4 space-y-1 text-[13px]">
              {d.experiences.map(e => (
                <li key={e.id} className="rounded-md border border-gray-200 px-2 py-1">
                  <b>{e.poste || <i className="text-amber-700">poste ?</i>}</b> — {e.entreprise || <i className="text-amber-700">entreprise ?</i>}
                  <span className="text-gray-500"> · {formaterPeriode(e.periode, 'fr') || 'dates ?'} · {e.puces.length} puce(s)</span>
                </li>
              ))}
            </ul>
          </>
        )}
        {d.formations.length > 0 && (
          <>
            <h4 className="subhead">Formation</h4>
            <ul className="mb-4 space-y-1 text-[13px]">
              {d.formations.map(f => (
                <li key={f.id} className="rounded-md border border-gray-200 px-2 py-1">
                  <b>{f.diplome || <i className="text-amber-700">diplôme ?</i>}</b> — {f.etablissement || <i className="text-amber-700">école ?</i>}
                  <span className="text-gray-500"> · {formaterPeriode(f.periode, 'fr') || 'dates ?'}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {resultat.aClasser.length > 0 && (
          <>
            <h4 className="subhead flex items-center gap-1.5"><Inbox size={13} /> À classer ({resultat.aClasser.length})</h4>
            <p className="text-[11.5px] text-gray-500 mb-2">Cochez les lignes qui vont ensemble puis choisissez leur section (le bilan ci-dessus se met à jour). Ce que vous laissez ici restera « à classer » dans l'éditeur.</p>
            <div className="space-y-2 mb-4">
              {resultat.aClasser.map(f => (
                <FragmentACocher key={f.id + f.texte.length} fragment={f} donnees={d} onEnvoyer={(l, s) => onClasser(f.id, l, s)} />
              ))}
            </div>
          </>
        )}

        {points.length > 0 && (
          <>
            <h4 className="subhead">À compléter ensuite</h4>
            <ul className="list-disc pl-5 text-[12.5px] text-gray-600 space-y-0.5">{points.map(p => <li key={p}>{p}</li>)}</ul>
          </>
        )}
      </div>
    </div>
  );
}
