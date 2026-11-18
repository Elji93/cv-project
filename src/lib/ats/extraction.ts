// ============================================================================
//  Extraction des mots-clés d'une offre :
//  - termes du dictionnaire FR ↔ EN (et des équivalences personnelles)
//  - expressions fréquentes de 2 à 4 mots propres à l'offre
//  - chaque mot-clé est « exigé », « normal » ou « apprécié » selon la phrase où il apparaît
// ============================================================================
import type { EquivalencePerso } from '../../types';
import { SYNONYMES, type CategorieMotCle, type GroupeSynonymes } from '../../data/synonymes';
import { MOTS_VIDES } from '../../data/motsVides';
import { contient, mots, normaliser, occurrences, regexSurlignage } from './normalisation';

export type Priorite = 'obligatoire' | 'normal' | 'souhaite';

export interface MotCleOffre {
  libelle: string;
  categorie: CategorieMotCle | 'Offre';
  /** Le terme tel qu'il apparaît dans l'offre (forme du dictionnaire) */
  termeOffre: string;
  /** Toutes les façons équivalentes de l'écrire (FR, EN, acronymes) */
  termes: string[];
  priorite: Priorite;
  occurrences: number;
}

// ---------------------------------------------------------------------------
//  Exigé ou apprécié ?
// ---------------------------------------------------------------------------
/** Marqueurs dans la phrase même */
const MARQUEURS_EXIGE = /\b(exig|imp[ée]rati|indispensable|obligatoire|requis|required|requirement|must|mandatory|essential|n[ée]cessaire|ma[iî]trise (de|d['’]|du|des)|vous ma[iî]trisez|maitrise imp|minimum)/i;
const MARQUEURS_SOUHAITE = /(id[ée]alement|un plus|serait un (plus|atout)|est un (plus|atout)|appr[ée]ci|souhait|nice to have|preferred|ideally|is a plus|would be a plus|a plus\b|bonus|optionnel|desirable|un atout)/i;
/** Intertitres de l'offre qui changent la priorité des lignes suivantes */
const SECTION_EXIGEE = /^(profil recherch|votre profil|vous [eê]tes|vous avez|pr[ée]requis|comp[ée]tences (requises|attendues|techniques)|requirements|qualifications|what you (bring|need)|must have|who you are|required skills)/i;
const SECTION_SOUHAITEE = /^(atouts?|les plus|un plus|nice to have|bonus|preferred|desired|appr[ée]ci)/i;

/** Découpe l'offre en phrases, chacune avec sa priorité */
export function phrasesAvecPriorite(offre: string): { texte: string; priorite: Priorite }[] {
  const res: { texte: string; priorite: Priorite }[] = [];
  let section: Priorite = 'normal';
  for (const ligne of offre.replace(/\r/g, '').split('\n')) {
    const brut = ligne.replace(/^[\s•●▪■◦*–—-]+/, '').trim();
    if (!brut) continue;
    // Un intertitre court change la priorité par défaut des lignes qui suivent
    if (brut.length <= 60) {
      if (SECTION_EXIGEE.test(brut)) section = 'obligatoire';
      else if (SECTION_SOUHAITEE.test(brut)) section = 'souhaite';
      else if (/^(missions?|vos missions|responsabilit|le poste|description|what you.?ll do|your role|about)/i.test(brut)) section = 'normal';
    }
    for (const phrase of brut.split(/(?<=[.;!?])\s+/)) {
      const priorite: Priorite = MARQUEURS_SOUHAITE.test(phrase) ? 'souhaite' : MARQUEURS_EXIGE.test(phrase) ? 'obligatoire' : section;
      res.push({ texte: phrase, priorite });
    }
  }
  return res;
}

const RANG: Record<Priorite, number> = { souhaite: 0, normal: 1, obligatoire: 2 };

/** Dictionnaire complet : dictionnaire de l'application + équivalences personnelles */
export function dictionnaire(perso: EquivalencePerso[] = []): GroupeSynonymes[] {
  return [
    ...SYNONYMES,
    ...perso.filter(e => e.termes.length >= 2).map(e => ({ libelle: e.termes[0], categorie: 'Technique' as const, termes: e.termes })),
  ];
}

// ---------------------------------------------------------------------------
//  Extraction
// ---------------------------------------------------------------------------
export function extraireMotsCles(offre: string, perso: EquivalencePerso[] = []): MotCleOffre[] {
  const phrases = phrasesAvecPriorite(offre).map(p => ({ ...p, n: normaliser(p.texte) }));
  const offreN = normaliser(offre);
  const resultat: MotCleOffre[] = [];

  // 1. Termes du dictionnaire
  for (const g of dictionnaire(perso)) {
    // le terme le plus long trouvé dans l'offre (« audit interne » plutôt que « audit »)
    const trouves = g.termes.filter(t => contient(offreN, t)).sort((a, b) => mots(b).length - mots(a).length || b.length - a.length);
    if (!trouves.length) continue;
    // priorité : la plus forte des phrases où il apparaît… sauf s'il n'apparaît que dans des phrases « un plus »
    const rangs = phrases.filter(p => g.termes.some(t => contient(p.n, t))).map(p => RANG[p.priorite]);
    const rang = rangs.length ? Math.max(...rangs) : 1;
    const priorite = (Object.keys(RANG) as Priorite[]).find(k => RANG[k] === rang) ?? 'normal';
    // On affiche le terme tel qu'il est écrit dans l'offre (« Excel », « SILAE », « Power BI »)
    const re = regexSurlignage(trouves[0]);
    const commeDansOffre = (re && offre.match(re)?.[0]) || trouves[0];
    resultat.push({
      libelle: g.libelle, categorie: g.categorie, termeOffre: commeDansOffre, termes: g.termes, priorite,
      occurrences: g.termes.reduce((n, t) => n + occurrences(offreN, t), 0),
    });
  }

  // 2. Expressions fréquentes de 2 à 4 mots (et mots isolés très fréquents) absentes du dictionnaire
  const dejaVus = resultat.flatMap(k => k.termes.map(t => mots(t).join(' ')));
  const couvert = (expr: string) => dejaVus.some(v => v.includes(expr) || expr.includes(v));
  const compte = new Map<string, number>();
  for (const p of phrases) {
    const liste = mots(p.texte);
    for (let taille = 1; taille <= 4; taille++) {
      for (let i = 0; i + taille <= liste.length; i++) {
        const morceau = liste.slice(i, i + taille);
        // pas de mot vide ni de nombre au début ou à la fin
        if ([morceau[0], morceau[morceau.length - 1]].some(m => MOTS_VIDES.has(m) || m.length < 3 || /^\d+$/.test(m))) continue;
        const expr = morceau.join(' ');
        compte.set(expr, (compte.get(expr) ?? 0) + 1);
      }
    }
  }
  const candidates = [...compte.entries()]
    .filter(([e, n]) => !couvert(e) && (e.includes(' ') ? n >= 2 : n >= 3 && e.length >= 5))
    // les plus longues d'abord à fréquence égale : « gestion de la paie » plutôt que « gestion »
    .sort((a, b) => b[1] - a[1] || b[0].split(' ').length - a[0].split(' ').length)
    .map(([e]) => e);
  const retenues: string[] = [];
  for (const e of candidates) {
    if (retenues.length >= 10) break;
    if (retenues.some(r => r.includes(e) || e.includes(r))) continue;
    retenues.push(e);
  }
  for (const e of retenues) {
    const rangs = phrases.filter(p => contient(p.n, e)).map(p => RANG[p.priorite]);
    const rang = rangs.length ? Math.max(...rangs) : 1;
    const re = regexSurlignage(e);
    resultat.push({
      libelle: e, categorie: 'Offre', termeOffre: (re && offre.match(re)?.[0]) || e, termes: [e],
      priorite: rang === 2 ? 'obligatoire' : rang === 0 ? 'souhaite' : 'normal',
      occurrences: occurrences(offreN, e),
    });
  }
  return resultat;
}
