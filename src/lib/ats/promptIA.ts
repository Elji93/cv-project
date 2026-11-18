// Prompt d'audit complet à coller dans ChatGPT ou Claude (CV + offre + critères APEC + score obtenu)
import type { CV } from '../../types';
import { texteBrutCv, type ResultatAts } from './scoring';

export function promptAudit(cv: CV, offre: string, r: ResultatAts): string {
  const manquants = r.motsCles.filter(k => k.ou === 'absent');
  const exiges = manquants.filter(k => k.priorite === 'obligatoire').map(k => k.termeOffre);
  const autres = manquants.filter(k => k.priorite !== 'obligatoire').map(k => k.termeOffre);
  const synonymes = r.motsCles.filter(k => k.viaSynonyme).map(k => `${k.termeOffre} ↔ ${k.termeCv}`);
  return `Tu es un recruteur expert (finance, audit, conseil, RH / paie / SIRH) et un spécialiste de l'optimisation de CV pour les ATS.

## Mission
Audite mon CV au regard de l'offre ci-dessous en appliquant les critères de filtrage ATS recommandés par l'APEC, puis propose une version réécrite.

## Grille d'évaluation (sur 100)
1. Adéquation du titre du CV avec l'intitulé du poste (20 pts) : intitulé exact (20), synonyme français / anglais ou correspondance partielle (10 à 15), absent (0).
2. Mots-clés & compétences techniques (40 pts) : termes de l'offre présents à l'identique (ou leur équivalent FR / EN), les mots-clés exigés pesant double ; idéalement dans l'accroche et la section Compétences ET prouvés dans les expériences.
3. Expériences & impact chiffré (25 pts) : pertinence des expériences, verbe d'action en début de puce, résultats chiffrés (€, k€, M€, %, volumes, délais).
4. Conformité & lisibilité ATS (15 pts) : une colonne, aucun émoji ni symbole décoratif, intitulés de sections standards, coordonnées complètes (email, téléphone, ville, LinkedIn), une seule page A4.

## Pré-analyse automatique
- Score obtenu : ${r.total}/100 (${r.criteres.map(c => `${c.libelle} ${c.score}/${c.max}`).join(' ; ')})
- Langue de l'offre : ${r.langueOffre === 'en' ? 'anglais' : 'français'}
- Intitulé du poste détecté : ${r.intitule || 'non détecté'}
- Mots-clés exigés absents : ${exiges.length ? exiges.join(', ') : 'aucun'}
- Autres mots-clés absents : ${autres.length ? autres.join(', ') : 'aucun'}
- Trouvés via un synonyme : ${synonymes.length ? synonymes.join(' ; ') : 'aucun'}

## Ce que j'attends
1. Un score détaillé par critère, avec justification.
2. Les 5 modifications prioritaires, classées par impact sur le score.
3. Un titre et une accroche réécrits (3 lignes maximum), reprenant l'intitulé exact de l'offre.
4. Chaque puce d'expérience réécrite : verbe d'action + action + résultat chiffré. N'invente aucun chiffre : écris [À COMPLÉTER] si une donnée manque.
5. La section Compétences réorganisée avec les mots-clés exacts de l'offre que je possède réellement${r.langueOffre === 'en' ? ' (en ajoutant le terme anglais entre parenthèses quand mon CV est en français)' : ''}.
Contraintes : une page A4, ton professionnel, aucune information inventée.

## Offre d'emploi
"""
${offre.trim()}
"""

## Mon CV (texte brut)
"""
${texteBrutCv(cv)}
"""`;
}
