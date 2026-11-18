// ============================================================================
//  Normalisation du texte pour comparer une offre et un CV :
//  minuscules, sans accents, pluriels ramenés au singulier, ponctuation retirée
//  (sauf dans les termes techniques comme « M&A », « C++ », « C# », « S/4HANA »).
// ============================================================================

/** « Évaluée » -> « evaluee » */
export const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Découpage en mots. Un « mot » peut contenir & + # (M&A, C++, C#, P&L, FP&A, Bac+5)
 * et une barre oblique suivie d'un chiffre (S/4HANA). « budget/forecast » donne deux mots.
 */
const MOT = /[a-z0-9]+(?:(?:[&+#]|\/(?=\d))[a-z0-9+#]*)*/g;

/** Pluriel -> singulier (règle simple, appliquée de la même façon à l'offre et au CV) */
export function singulier(mot: string): string {
  if (mot.length <= 3 || /[&+#/\d]/.test(mot)) return mot;
  if (mot.endsWith('aux') && mot.length > 4) return mot.slice(0, -3) + 'al'; // fiscaux -> fiscal
  if (/(ss|us|is|ys)$/.test(mot)) return mot;                               // process, bonus, analysis
  if (/[sx]$/.test(mot)) return mot.slice(0, -1);                            // comptes -> compte
  return mot;
}

/** Liste des mots normalisés d'un texte */
export function mots(texte: string): string[] {
  const t = sansAccents(String(texte || '').toLowerCase()).replace(/[’']/g, ' ');
  return (t.match(MOT) ?? []).map(singulier);
}

/** Texte normalisé, entouré d'espaces pour chercher des mots entiers : « ␣mot1␣mot2␣ » */
export const normaliser = (texte: string) => ` ${mots(texte).join(' ')} `;

/** Le texte normalisé contient-il ce terme (mots entiers, dans l'ordre) ? */
export function contient(texteNormalise: string, terme: string): boolean {
  const t = mots(terme).join(' ');
  return !!t && texteNormalise.includes(` ${t} `);
}

/** Nombre d'occurrences d'un terme dans un texte normalisé */
export function occurrences(texteNormalise: string, terme: string): number {
  const t = mots(terme).join(' ');
  return t ? texteNormalise.split(` ${t} `).length - 1 : 0;
}

// ---------------------------------------------------------------------------
//  Langue de l'offre
// ---------------------------------------------------------------------------
const INDICES_FR = new Set('le la les des du de et pour avec vous nous dans une est sur au aux votre vos sera notre ses ou qui que'.split(' '));
const INDICES_EN = new Set('the and of to in for with you we our is are as on at an your will be this that who or'.split(' '));

/** Langue de l'offre : on compte les petits mots typiques de chaque langue */
export function detecterLangue(texte: string): 'fr' | 'en' {
  const liste = sansAccents(texte.toLowerCase()).split(/[^a-z]+/);
  let fr = 0, en = 0;
  for (const m of liste) { if (INDICES_FR.has(m)) fr++; if (INDICES_EN.has(m)) en++; }
  return en > fr ? 'en' : 'fr';
}

// ---------------------------------------------------------------------------
//  Surlignage sur la feuille
// ---------------------------------------------------------------------------
const VARIANTES: Record<string, string> = {
  a: 'aàâäáã', e: 'eéèêë', i: 'iîïí', o: 'oôöóõ', u: 'uùûüú', c: 'cç', y: 'yÿ', n: 'nñ',
};
// (mode Unicode : on n'échappe que les vrais caractères spéciaux des expressions régulières)
const echapper = (c: string) => c.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

/**
 * Expression régulière qui retrouve un terme dans le texte d'origine
 * (avec ou sans accents, majuscules, pluriel, tirets) — pour le surligner.
 */
export function regexSurlignage(terme: string): RegExp | null {
  const liste = mots(terme);
  if (!liste.length || liste.join('').length < 2) return null;
  const motif = liste.map(m => {
    const lettres = [...m].map(c => (VARIANTES[c] ? `[${VARIANTES[c]}]` : echapper(c))).join('');
    return `${lettres}(?:e?s|x)?`;
  }).join(`[\\s\\-'’]+(?:(?:d|l)['’])?`);
  return new RegExp(`(?<![\\p{L}\\p{N}])${motif}(?![\\p{L}\\p{N}])`, 'giu');
}
