// ============================================================================
//  Dates des expériences : lecture d'un texte libre et affichage FR / EN
// ============================================================================
import type { LangueCV, MoisAnnee, Periode } from '../types';

const MOIS_FR = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
const MOIS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Débuts de noms de mois reconnus (sans accents), index 0 = janvier */
const RACINES_MOIS: string[][] = [
  ['jan'], ['fev', 'feb'], ['mar'], ['avr', 'apr'], ['mai', 'may'], ['juin', 'jun'],
  ['juil', 'jul'], ['aou', 'aug'], ['sep'], ['oct'], ['nov'], ['dec'],
];

const sansAccents = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Mots signifiant « en cours » */
export const estEnCours = (texte: string) =>
  /^(present|aujourd.?hui|actuel(lement)?|en cours|now|today|current|ce jour)$/.test(sansAccents(texte.trim()));

/**
 * Transforme un texte libre en MoisAnnee.
 * Accepte : « 2024-09 », « 09/2024 », « 9/24 », « Sept. 2024 », « September 2024 », « 2024 ».
 * Renvoie null si le texte n'est pas reconnu.
 */
export function lireDate(texte: string): MoisAnnee | null {
  const t = sansAccents(texte.trim()).replace(/\s+/g, ' ');
  if (!t) return '';
  let m = t.match(/^(\d{4})-(\d{1,2})$/);
  if (m) return mois(+m[1], +m[2]);
  m = t.match(/^(\d{1,2})[/.\-](\d{2}|\d{4})$/);
  if (m) return mois(annee(m[2]), +m[1]);
  m = t.match(/^([a-z]+)\.?\s*[-'’]?\s*(\d{2}|\d{4})$/);
  if (m) {
    const idx = RACINES_MOIS.findIndex(r => r.some(x => m![1].startsWith(x)));
    if (idx >= 0) return mois(annee(m[2]), idx + 1);
  }
  m = t.match(/^(\d{4})$/);
  if (m) return m[1];
  return null;
}

const annee = (s: string) => (s.length === 2 ? 2000 + +s : +s);
const mois = (a: number, m: number): MoisAnnee | null =>
  m >= 1 && m <= 12 && a > 1950 && a < 2100 ? `${a}-${String(m).padStart(2, '0')}` : null;

/** Affiche une date : « Sept. 2024 » (fr) ou « Sep 2024 » (en) */
export function formaterDate(d: MoisAnnee, langue: LangueCV): string {
  if (!d) return '';
  const [a, m] = d.split('-');
  if (!m) return a;
  return `${(langue === 'en' ? MOIS_EN : MOIS_FR)[+m - 1]} ${a}`;
}

/** Affiche une période : « Sept. 2024 – Présent » */
export function formaterPeriode(p: Periode, langue: LangueCV): string {
  const debut = formaterDate(p.debut, langue);
  const fin = p.enCours ? (langue === 'en' ? 'Present' : 'Présent') : formaterDate(p.fin, langue);
  if (debut && fin && debut !== fin) return `${debut} – ${fin}`;
  return debut || fin;
}

/** Format court pour les champs de saisie : « 09/2024 » ou « 2024 » */
export function dateVersSaisie(d: MoisAnnee): string {
  if (!d) return '';
  const [a, m] = d.split('-');
  return m ? `${m}/${a}` : a;
}

/** Lit une période écrite en une fois, ex. « Sept. 2024 – Présent » ou « 2020 - 2023 » */
export function lirePeriode(texte: string): Periode | null {
  const parties = texte.split(/\s*(?:[–—-]|à|to)\s+|\s+[–—-]\s*|\s*[–—]\s*/).map(s => s.trim()).filter(Boolean);
  if (parties.length === 1) {
    const d = lireDate(parties[0]);
    return d === null ? null : { debut: d, fin: '', enCours: false };
  }
  if (parties.length === 2) {
    const debut = lireDate(parties[0]);
    if (debut === null) return null;
    if (estEnCours(parties[1])) return { debut, fin: '', enCours: true };
    const fin = lireDate(parties[1]);
    return fin === null ? null : { debut, fin, enCours: false };
  }
  return null;
}
