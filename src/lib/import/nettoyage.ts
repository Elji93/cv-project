import { VOCABULAIRE_CV } from '../../data/vocabulaireCv';
// ============================================================================
//  Nettoyage du texte importé : icônes, pictogrammes, barres de niveau…
//  (fréquents dans les CV Canva, et illisibles pour les ATS)
// ============================================================================

/** Émojis, pictogrammes, flèches, formes géométriques, icônes de polices (zone « usage privé ») */
const ICONES = /[←-⇿⌀-⏿①-⓿▀-➿⤀-⥿⬀-⯿-\u{1F000}-\u{1FAFF}\u{F0000}-\u{FFFFD}️‍]/gu;

/** Puces en début de ligne : • ● ▪ – - * > ✓ … */
export const PUCE = /^\s*[•●○▪■□◆◇►▶➢➤✓✔·*–—-]\s+/;

/** Barres de niveau du type « ●●●○○ » ou « ★★★☆☆ » */
const BARRE_NIVEAU = /[●○◉◯★☆■□▰▱]{2,}/g;

/** Nettoie une ligne. Les puces de début de ligne sont conservées sous la forme « • » */
export function nettoyerLigne(ligne: string): string {
  let t = ligne.replace(/ /g, ' ').replace(/\t/g, ' ');
  // Seules les vraies puces comptent (une icône de téléphone ou d'enveloppe n'est pas une puce)
  const estPuce = PUCE.test(t) || /^\s*[•●▪■►▶➢➤✓✔]/.test(t);
  t = t.replace(PUCE, '').replace(BARRE_NIVEAU, ' ').replace(ICONES, ' ');
  t = recollerLettres(t);
  t = t.replace(/\s*[|]\s*$/g, '').replace(/^\s*[|,;:]\s*/g, '').replace(/\s{2,}/g, ' ').trim();
  return t && estPuce ? '• ' + t : t;
}

/**
 * « E X P É R I E N C E S » -> « EXPÉRIENCES » (lettres espacées des titres Canva).
 * Un double espace sépare les mots : « P R O F I L  P R O » -> « PROFIL PRO ».
 */
export function recollerLettres(t: string): string {
  return t.replace(/(?:^|(?<=\s))(?:[A-Za-zÀ-ÿ&'’] ){2,}[A-Za-zÀ-ÿ&'’](?=\s|$)/g, bloc => segmenterMots(bloc.replace(/ /g, '')))
    .replace(/(?<=[A-Za-zÀ-ÿ]) {2,}(?=[A-Za-zÀ-ÿ])/g, ' ');
}

const baseLettre = (c: string) => c.normalize('NFD')[0].toLowerCase();
const DICO = new Set(VOCABULAIRE_CV);
const LONGUEUR_MAX = Math.max(...VOCABULAIRE_CV.map(m => m.length));

/**
 * Redécoupe un mot collé en mots connus : « Ressourceshumainesenalternance » -> « Ressources humaines en alternance ».
 * Programmation dynamique : on cherche le découpage avec le moins de mots, chaque lettre inconnue coûtant cher.
 * Si le mot est court ou déjà connu, il est rendu tel quel.
 */
export function segmenterMots(mot: string): string {
  if (mot.length < 10) return mot;
  const base = [...mot].map(baseLettre).join('');
  if (DICO.has(base)) return mot;
  const n = base.length;
  const cout = new Array<number>(n + 1).fill(Infinity);
  const coupe = new Array<number>(n + 1).fill(-1);
  cout[0] = 0;
  for (let i = 1; i <= n; i++) {
    // lettre inconnue (coût 3)
    if (cout[i - 1] + 3 < cout[i]) { cout[i] = cout[i - 1] + 3; coupe[i] = i - 1; }
    for (let l = 1; l <= Math.min(LONGUEUR_MAX, i); l++) {
      if (DICO.has(base.slice(i - l, i)) && cout[i - l] + 1 < cout[i]) { cout[i] = cout[i - l] + 1; coupe[i] = i - l; }
    }
  }
  // Trop de lettres inconnues : on ne touche à rien
  const morceaux: string[] = [];
  for (let i = n; i > 0; i = coupe[i]) morceaux.unshift(mot.slice(coupe[i], i));
  const inconnues = morceaux.filter(m => m.length === 1 && !DICO.has(baseLettre(m))).length;
  if (inconnues > 2) return mot;
  // Les lettres inconnues consécutives restent collées entre elles
  const mots: string[] = [];
  for (const m of morceaux) {
    const inconnu = m.length === 1 && !DICO.has(baseLettre(m));
    if (inconnu && mots.length && mots[mots.length - 1].endsWith('\u0000')) mots[mots.length - 1] = mots[mots.length - 1].slice(0, -1) + m + '\u0000';
    else mots.push(inconnu ? m + '\u0000' : m);
  }
  return mots.map(m => m.replace('\u0000', '')).join(' ');
}

/** Une ligne ne contient-elle plus rien d'utile (que des symboles, une page « 1/2 »…) ? */
export const ligneVide = (t: string) => !t.replace(/[•\s|.,;:\-–—_/\\()[\]]/g, '').length || /^(page\s*)?\d+\s*(\/\s*\d+)?$/i.test(t.trim());
