// ============================================================================
//  Liste déroulante « Envoyer vers… » :
//  - un champ des infos perso (ville, date de naissance, nom…)
//  - une rubrique (nouvelle entrée détectée automatiquement)
//  - un champ précis d'une entrée existante (missions, poste, dates d'une expérience,
//    école d'une formation, groupe de compétences…)
// ============================================================================
import type { DonneesCV } from '../../types';
import { LIBELLES_SECTIONS } from '../../data/constantes';
import { CHAMPS_EXPERIENCE, CHAMPS_FORMATION, CHAMPS_INFOS, type Destination } from '../../lib/import/classer';
import { formaterPeriode } from '../../lib/dates';

interface Props {
  valeur: Destination | null;
  onChange: (s: Destination | null) => void;
  /** Libellé de l'option « ne rien faire » */
  libelleAucune?: string;
  /** Contenu actuel du CV : sert à proposer ses expériences, formations et groupes de compétences */
  donnees?: DonneesCV;
  /** Libellé lisible de la destination de l'option (pour les lecteurs d'écran) */
  ariaLabel?: string;
}

const court = (t: string, n = 38) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

export function ChoixSection({ valeur, onChange, libelleAucune = 'Laisser à classer', donnees, ariaLabel = 'Envoyer vers la section' }: Props) {
  const L = LIBELLES_SECTIONS;
  return (
    <select className="input py-1 text-xs" value={valeur ?? ''} onChange={e => onChange((e.target.value || null) as Destination | null)} aria-label={ariaLabel}>
      <option value="">{libelleAucune}</option>
      <optgroup label="Infos perso">
        {CHAMPS_INFOS.map(([c, libelle]) => <option key={c} value={`infos.${c}`}>→ {libelle}</option>)}
      </optgroup>
      <optgroup label={L.accroche}>
        <option value="accroche">→ Ajouter à l'accroche</option>
        <option value="accroche.remplacer">→ Remplacer l'accroche</option>
      </optgroup>

      <optgroup label={L.experiences}>
        <option value="experiences">→ Nouvelle(s) expérience(s) (détection automatique)</option>
      </optgroup>
      {donnees?.experiences.map(e => (
        <optgroup key={e.id} label={`Expérience : ${court([e.poste, e.entreprise].filter(Boolean).join(' — ') || 'sans titre')}${formaterPeriode(e.periode, 'fr') ? ` (${formaterPeriode(e.periode, 'fr')})` : ''}${e.masquee ? ' — en réserve' : ''}`}>
          {CHAMPS_EXPERIENCE.map(([c, libelle]) => <option key={c} value={`exp.${e.id}.${c}`}>→ {libelle}</option>)}
        </optgroup>
      ))}

      <optgroup label={L.formations}>
        <option value="formations">→ Nouvelle(s) formation(s) (détection automatique)</option>
      </optgroup>
      {donnees?.formations.map(f => (
        <optgroup key={f.id} label={`Formation : ${court([f.diplome, f.etablissement].filter(Boolean).join(' — ') || 'sans titre')}${f.masquee ? ' — en réserve' : ''}`}>
          {CHAMPS_FORMATION.map(([c, libelle]) => <option key={c} value={`form.${f.id}.${c}`}>→ {libelle}</option>)}
        </optgroup>
      ))}

      <optgroup label={L.competences}>
        <option value="competences">→ Nouveau(x) groupe(s) (détection automatique)</option>
        {donnees?.competences.map(g => <option key={g.id} value={`comp.${g.id}`}>→ Ajouter au groupe « {court(g.categorie || 'Compétences', 30)} »</option>)}
      </optgroup>

      <optgroup label="Autres rubriques">
        {(['qualites', 'langues', 'certifications', 'centresInteret'] as const).map(s => <option key={s} value={s}>→ {L[s]}</option>)}
      </optgroup>
    </select>
  );
}
