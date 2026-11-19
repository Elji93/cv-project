// ============================================================================
//  Lecture d'un PDF (y compris CV Canva en 2 colonnes) avec pdf.js
//  On récupère chaque morceau de texte et sa position, puis on reconstruit
//  les lignes dans le bon ordre de lecture, colonne par colonne.
// ============================================================================
import type { Photo } from '../../types';
import { ligneVide, nettoyerLigne } from './nettoyage';
import { extrairePhotoPdf } from './extrairePhoto';

/** Un morceau de texte positionné dans la page (coordonnées PDF, origine en bas à gauche) */
export interface Morceau {
  texte: string;
  x: number;
  y: number;
  largeur: number;
  /** Taille de police approximative */
  taille: number;
}

/** Une ligne reconstruite */
export interface LigneImportee {
  texte: string;
  /** Taille de police (sert à repérer les titres) */
  taille: number;
  /** Zone de la page : 'pleine' (en-tête sur toute la largeur), 'gauche' ou 'droite' */
  zone: 'pleine' | 'gauche' | 'droite';
}

/** Écart-type (dispersion) d'une liste de nombres */
const dispersion = (v: number[]) => {
  if (!v.length) return 0;
  const moy = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((a, b) => a + (b - moy) ** 2, 0) / v.length);
};

/**
 * Cherche une gouttière verticale (bande quasi vide) qui sépare deux colonnes.
 * Renvoie sa position x, ou null si la page n'a qu'une colonne.
 * - Tolérante : quelques morceaux peuvent traverser la bande (nom ou titre en grand en haut de page).
 * - Prudente : des dates alignées à droite dans un CV à une colonne ne sont pas une colonne.
 */
export function trouverGouttiere(morceaux: Morceau[], largeurPage: number): number | null {
  const pas = 2;
  const cases = Math.ceil(largeurPage / pas);
  const couverture = new Array<number>(cases).fill(0);
  // Les lignes très larges (paragraphe sur toute la page) sont ignorées ici
  const etroits = morceaux.filter(m => m.largeur < largeurPage * 0.55);
  if (etroits.length < 8) return null;
  for (const m of etroits) {
    for (let i = Math.floor(m.x / pas); i <= Math.min(cases - 1, Math.floor((m.x + m.largeur) / pas)); i++) couverture[i]++;
  }
  // Bandes où presque rien ne passe (≤ 4 % des morceaux), entre 15 % et 85 % de la largeur
  const seuil = Math.max(1, Math.round(etroits.length * 0.04));
  const bandes: { debut: number; fin: number }[] = [];
  let debut = -1;
  const fin = Math.ceil(cases * 0.85);
  for (let i = Math.floor(cases * 0.15); i <= fin + 1; i++) {
    const libre = i <= fin && couverture[i] <= seuil;
    if (libre) { if (debut < 0) debut = i; }
    else if (debut >= 0) { if ((i - debut) * pas >= 6) bandes.push({ debut, fin: i }); debut = -1; }
  }
  // On garde la bande qui laisse le plus de texte des DEUX côtés (puis la plus large)
  let milieu = -1, meilleurScore = -1;
  let gauche: Morceau[] = [], droite: Morceau[] = [];
  for (const b of bandes) {
    const x = ((b.debut + b.fin) / 2) * pas;
    const g = etroits.filter(m => m.x + m.largeur <= x);
    const d = etroits.filter(m => m.x >= x);
    const score = Math.min(g.length, d.length) * 1000 + (b.fin - b.debut);
    if (score > meilleurScore) { meilleurScore = score; milieu = x; gauche = g; droite = d; }
  }
  // Il faut assez de texte de chaque côté pour parler de colonnes
  if (milieu < 0 || gauche.length < 4 || droite.length < 4) return null;
  // La séparation est placée juste avant le début de la colonne de droite (le x le plus à gauche
  // de ses lignes, longues lignes comprises), pas au milieu de la bande vide : une longue ligne de
  // la colonne de gauche (texte aux lettres espacées de Canva) peut s'avancer presque jusqu'à elle.
  // (un x où commencent au moins 3 lignes ; une lettre au milieu d'un mot espacé n'est pas un début de ligne)
  const debutDeLigne = (m: Morceau) => !morceaux.some(o => o !== m && Math.abs(o.y - m.y) < Math.max(2, m.taille * 0.45)
    && o.x < m.x && m.x - (o.x + o.largeur) < m.taille * 1.2);
  const departs = morceaux.filter(m => m.x >= milieu && debutDeLigne(m)).map(m => m.x);
  const debutDroite = Math.min(...departs.filter(x => departs.filter(y => Math.abs(y - x) < 1.5).length >= 3));
  const separation = Number.isFinite(debutDroite) ? Math.max(milieu, debutDroite - 0.5) : milieu;
  // Une vraie colonne est alignée à gauche (ses lignes commencent au même x).
  // Des dates ou des villes alignées à droite (CV à une colonne) ont au contraire le bord droit aligné.
  const alignesADroite = (cote: Morceau[]) => dispersion(cote.map(m => m.x + m.largeur)) < dispersion(cote.map(m => m.x)) * 0.6;
  if (alignesADroite(droite)) return null;
  return separation;
}

/** Regroupe des morceaux en lignes (même hauteur), de haut en bas puis de gauche à droite */
/** « R é g l e r », « ( d é b u t a n t ) », « 2 0 2 3 » : caractères isolés séparés par une seule espace */
const LETTRES_ESPACEES = /^\S(?: \S)+$/;

function grouperEnLignes(morceaux: Morceau[], zone: LigneImportee['zone']): LigneImportee[] {
  const tries = [...morceaux].sort((a, b) => b.y - a.y || a.x - b.x);
  const lignes: Morceau[][] = [];
  for (const m of tries) {
    const derniere = lignes[lignes.length - 1];
    if (derniere && Math.abs(derniere[0].y - m.y) < Math.max(2, m.taille * 0.45)) derniere.push(m);
    else lignes.push([m]);
  }
  return lignes.map(brutes => {
    // Lettres très espacées (Canva) : pdf.js renvoie un morceau par mot, « R é g l e r », séparé du mot
    // suivant par un morceau « » : on recolle les lettres de chaque mot, la séparation entre morceaux
    // donnera l'espace entre les mots (sinon « Réglerlesparamètres » une fois tout recollé)
    const espacees = brutes.some(m => LETTRES_ESPACEES.test(m.texte.trim()) && m.texte.trim().length >= 5);
    const l = espacees ? brutes.map(m => (LETTRES_ESPACEES.test(m.texte.trim()) ? { ...m, texte: m.texte.trim().replace(/ /g, '') } : m)) : brutes;
    l.sort((a, b) => a.x - b.x);
    // Titres Canva aux lettres espacées : chaque lettre est un morceau séparé.
    // On ne met alors une espace que pour les écarts nettement plus grands que l'écart habituel entre lettres.
    const lettres = l.filter(m => m.texte.trim().length === 1).length;
    const espace = l.length >= 4 && lettres / l.length > 0.6;
    const ecarts = l.slice(1).map((m, i) => m.x - (l[i].x + l[i].largeur)).sort((a, b) => a - b);
    const ecartLettres = ecarts[Math.floor(ecarts.length / 2)] ?? 0;
    let texte = '';
    l.forEach((m, i) => {
      if (i > 0) {
        const precedent = l[i - 1];
        const ecart = m.x - (precedent.x + precedent.largeur);
        // espace = écart habituel entre lettres + environ 1/8 de la taille du texte
        const seuilEspace = espace ? Math.max(ecartLettres, 0) + m.taille * 0.12 : m.taille * 0.15;
        // un grand écart horizontal sur une même ligne = deux informations distinctes
        texte += ecart > m.taille * 2 ? ' | ' : ecart > seuilEspace && !texte.endsWith(' ') && !m.texte.startsWith(' ') ? ' ' : '';
      }
      texte += m.texte;
    });
    return { texte, taille: Math.max(...l.map(m => m.taille)), zone };
  });
}

/**
 * Remet les morceaux d'une page dans l'ordre de lecture.
 * La page est découpée en bandes horizontales (rangées de texte) :
 * - une bande où des lignes passent par-dessus la séparation est lue normalement (pleine largeur) ;
 * - une suite de rangées sans aucune ligne qui traverse, avec du texte des deux côtés, est lue
 *   en deux colonnes : d'abord tout le côté gauche, puis tout le côté droit.
 * Ainsi un CV Canva « haut de page pleine largeur + bas en deux colonnes » est bien lu.
 */
export function reconstruireLignes(morceaux: Morceau[], largeurPage: number): LigneImportee[] {
  const utiles = morceaux.filter(m => m.texte.trim());
  // Un « tableau » dont les cellules sont de part et d'autre de la séparation des colonnes n'en est pas un :
  // ce sont deux colonnes dont des lignes tombent par hasard à la même hauteur (barre latérale Canva)
  // (la séparation est cherchée sans le contenu des tableaux, dont les colonnes ressemblent à une gouttière)
  const candidats = extraireTableaux(utiles);
  const dansTableaux = new Set(candidats.flatMap(t => t.morceaux));
  const gouttiere = candidats.length ? trouverGouttiere(utiles.filter(m => !dansTableaux.has(m)), largeurPage) : null;
  const tableaux = candidats.filter(t => gouttiere === null
    || !(t.morceaux.some(m => m.x + m.largeur <= gouttiere) && t.morceaux.some(m => m.x >= gouttiere)));
  if (!tableaux.length) return lireEnColonnes(utiles, largeurPage);
  // Chaque tableau est remplacé par un repère pleine largeur (il coupe donc les colonnes),
  // puis le repère est remplacé par les lignes du tableau
  const retires = new Set(tableaux.flatMap(t => t.morceaux));
  const reperes = tableaux.map((t, i) => ({ texte: `\u0000T${i}\u0000`, x: t.x, y: t.y, largeur: largeurPage * 0.9, taille: t.lignes[0]?.taille ?? 10 }));
  return lireEnColonnes([...utiles.filter(m => !retires.has(m)), ...reperes], largeurPage).flatMap(l => {
    const m = l.texte.match(/\u0000T(\d+)\u0000/);
    if (!m) return [l];
    const autour = l.texte.replace(m[0], ' ').replace(/\s*\|\s*$|^\s*\|\s*/g, '').trim();
    return [...(autour ? [{ ...l, texte: autour }] : []), ...tableaux[+m[1]].lignes];
  });
}

// ---------------------------------------------------------------------------
//  Tableaux (Word / Google Docs / générateurs IA) : « Année | Intitulé | Organisme »,
//  « Catégorie | compétences… ». Une cellule peut tenir sur plusieurs lignes, ou être
//  centrée verticalement : lue ligne par ligne, la rangée serait mélangée. On reconstruit
//  donc chaque rangée du tableau en une seule ligne « cellule | cellule | cellule ».
// ---------------------------------------------------------------------------
interface Tableau { x: number; y: number; morceaux: Morceau[]; lignes: LigneImportee[] }

const EN_TETE_TABLEAU = /^(ann[ée]es?|dates?|p[ée]riodes?|intitul|dipl[oô]mes?|formations?|certifications?|organismes?|[ée]tablissements?|niveaux?|postes?|entreprises?|soci[ée]t[ée]s?|missions?|cat[ée]gories?|domaines?|comp[ée]tences?|outils?|libell[ée]s?|descriptions?|d[ée]tails?|lieux?|villes?|year|title|degree|school|institution|company|role|skills?|level)\b/i;

export function extraireTableaux(morceaux: Morceau[]): Tableau[] {
  // Lignes visuelles (même hauteur), découpées en cellules aux grands écarts horizontaux
  const tries = [...morceaux].sort((a, b) => b.y - a.y || a.x - b.x);
  const lignes: { y: number; taille: number; morceaux: Morceau[]; cellules: { x: number; fin: number }[] }[] = [];
  for (const m of tries) {
    const d = lignes[lignes.length - 1];
    if (d && Math.abs(d.y - m.y) < Math.max(2, m.taille * 0.45)) d.morceaux.push(m);
    else lignes.push({ y: m.y, taille: m.taille, morceaux: [m], cellules: [] });
  }
  for (const l of lignes) {
    l.morceaux.sort((a, b) => a.x - b.x);
    l.taille = Math.max(...l.morceaux.map(m => m.taille));
    for (const m of l.morceaux) {
      const c = l.cellules[l.cellules.length - 1];
      if (c && m.x - c.fin <= Math.max(8, m.taille * 1.2)) c.fin = Math.max(c.fin, m.x + m.largeur);
      else l.cellules.push({ x: m.x, fin: m.x + m.largeur });
    }
  }

  const tableaux: Tableau[] = [];
  let i = 0;
  while (i < lignes.length) {
    const depart = lignes[i];
    if (depart.cellules.length < 2) { i++; continue; }
    // Colonnes : bords gauches des cellules de la première ligne, bien espacés
    const ancres = depart.cellules.map(c => c.x);
    if (ancres.some((a, k) => k > 0 && a - ancres[k - 1] < 40)) { i++; continue; }
    const colonne = (x: number) => ancres.findIndex(a => Math.abs(a - x) <= 4);
    const run = [depart];
    for (let j = i + 1; j < lignes.length; j++) {
      const l = lignes[j], prec = run[run.length - 1];
      if (Math.abs(l.taille - depart.taille) > 1.2 || prec.y - l.y > depart.taille * 4) break;
      // chaque cellule commence sur une colonne et ne déborde pas sur la suivante
      const ok = l.cellules.every(c => {
        const k = colonne(c.x);
        return k >= 0 && (k === ancres.length - 1 || c.fin <= ancres[k + 1] + 2);
      });
      if (!ok) break;
      run.push(l);
    }
    // Rangées : séparées par un écart vertical nettement plus grand que l'interligne
    const ecarts = run.slice(1).map((l, k) => run[k].y - l.y);
    const mini = Math.min(...ecarts);
    const rangees: (typeof run)[] = [[run[0]]];
    ecarts.forEach((e, k) => { if (e > mini * 1.5) rangees.push([run[k + 1]]); else rangees[rangees.length - 1].push(run[k + 1]); });
    const multiCellules = run.filter(l => l.cellules.length >= 2).length;
    const rangeesSurPlusieursLignes = rangees.filter(r => r.length >= 2).length;
    // Un vrai tableau : au moins 3 lignes, 2 lignes à plusieurs cellules et des rangées sur plusieurs lignes
    // (deux colonnes Canva au même interligne n'en sont pas)
    if (run.length < 3 || multiCellules < 2 || rangeesSurPlusieursLignes < 1 || rangees.length < 2) { i++; continue; }

    const lignesTableau: LigneImportee[] = [];
    rangees.forEach((r, k) => {
      const cellules = ancres.map((_, c) => r.flatMap(l => l.morceaux).filter(m => colonne(m.x) === c || (colonne(m.x) < 0 && m.x > ancres[c] && (c === ancres.length - 1 || m.x < ancres[c + 1])))
        .sort((a, b) => b.y - a.y || a.x - b.x).map(m => m.texte.trim()).join(' ').replace(/\s+/g, ' ').trim());
      const texte = cellules.filter(Boolean).join(' | ');
      // Rangée d'en-tête (« Année | Intitulé | Organisme / Niveau ») : sans intérêt pour le CV
      const enTete = k === 0 && !/\d/.test(texte) && cellules.filter(Boolean).every(c => c.length <= 45 && EN_TETE_TABLEAU.test(c));
      if (texte && !enTete) lignesTableau.push({ texte, taille: Math.max(...r.map(l => l.taille)), zone: 'pleine' });
    });
    tableaux.push({ x: Math.min(...ancres), y: depart.y, morceaux: run.flatMap(l => l.morceaux), lignes: lignesTableau });
    i += run.length;
  }
  return tableaux;
}

/** Lecture d'une page sans tableau : une colonne, ou deux colonnes (Canva) */
function lireEnColonnes(utiles: Morceau[], largeurPage: number): LigneImportee[] {
  const gouttiere = trouverGouttiere(utiles, largeurPage);
  if (gouttiere === null) return grouperEnLignes(utiles, 'pleine');

  // 1. Rangées de texte (même hauteur), de haut en bas
  const tries = [...utiles].sort((a, b) => b.y - a.y);
  const rangees: Morceau[][] = [];
  for (const m of tries) {
    const r = rangees[rangees.length - 1];
    if (r && Math.abs(r[0].y - m.y) < Math.max(2, m.taille * 0.45)) r.push(m);
    else rangees.push([m]);
  }
  const traverse = (m: Morceau) => m.x < gouttiere - 1 && m.x + m.largeur > gouttiere + 1;
  // Côté d'un morceau : celui où il commence (une longue ligne de la colonne de gauche peut déborder)
  const aGauche = (m: Morceau) => m.x < gouttiere;

  // 2. Suites de rangées sans ligne qui traverse
  const zones: { colonnes: boolean; rangees: Morceau[][] }[] = [];
  for (const r of rangees) {
    const libre = !r.some(traverse);
    const derniere = zones[zones.length - 1];
    if (derniere && derniere.colonnes === libre) derniere.rangees.push(r);
    else zones.push({ colonnes: libre, rangees: [r] });
  }

  // Une ou deux rangées isolées qui débordent, au milieu d'une zone en colonnes, n'interrompent pas
  // les colonnes (ex. « 2025 - 2026 : Licence Professionnelle Gestion de la Paie… » trop long pour sa colonne)
  for (let i = zones.length - 2; i >= 1; i--) {
    if (!zones[i].colonnes && zones[i].rangees.length <= 2 && zones[i - 1].colonnes && zones[i + 1].colonnes) {
      zones[i - 1].rangees.push(...zones[i].rangees, ...zones[i + 1].rangees);
      zones.splice(i, 2);
    }
  }

  // 3. Une suite « libre » n'est lue en colonnes que si c'est vraisemblable
  const resultat: LigneImportee[] = [];
  for (const z of zones) {
    // (statistiques sur les rangées qui ne débordent pas)
    const nettes = z.rangees.filter(r => !r.some(traverse));
    const avecG = nettes.filter(r => r.some(aGauche)).length;
    const avecD = nettes.filter(r => r.some(m => !aGauche(m))).length;
    const lesDeux = nettes.filter(r => r.some(aGauche) && r.some(m => !aGauche(m))).length;
    // Tableau « étiquette | texte » (ou « intitulé | dates ») : chaque élément d'un côté a son voisin
    // sur la même ligne de l'autre côté, et ce côté a nettement moins de lignes. Ce ne sont pas des colonnes.
    const tableau = (avecG > 0 && lesDeux / avecG >= 0.8 && avecG <= avecD * 0.6)
      || (avecD > 0 && lesDeux / avecD >= 0.8 && avecD <= avecG * 0.6);
    const morceauxZone = z.rangees.flat();
    // Les débordements tolérés doivent rester rares : sinon c'est un CV à une colonne
    // (lignes longues qui passent sans cesse « par-dessus » une fausse séparation)
    const traversees = z.rangees.filter(r => r.some(traverse)).length;
    const peuTraversee = traversees <= Math.max(2, z.rangees.length * 0.1);
    if (z.colonnes && avecG >= 3 && avecD >= 3 && !tableau && peuTraversee) {
      resultat.push(...grouperEnLignes(morceauxZone.filter(aGauche), 'gauche'));
      resultat.push(...grouperEnLignes(morceauxZone.filter(m => !aGauche(m)), 'droite'));
    } else {
      resultat.push(...grouperEnLignes(morceauxZone, 'pleine'));
    }
  }
  return resultat;
}

// ---------------------------------------------------------------------------
//  En-têtes et pieds de page (« CV — Profil X | Page 1 of 2 ») : ils couperaient
//  une expérience en deux et finiraient dans le CV.
// ---------------------------------------------------------------------------
const NUMERO_PAGE = /\b(?:page|p\.)\s*\d+\s*(?:\/|of|sur|de)\s*\d+\b|^\s*(?:[1-9]|1\d)\s*\/\s*(?:[1-9]|1\d)\s*$|^\s*(?:page|p\.)\s*\d+\s*$/i;
const simplifier = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function retirerEntetesEtPieds(pages: LigneImportee[][]): LigneImportee[] {
  // 1. Textes accompagnant un numéro de page (« CV Anonyme — Profil X | Page 1 of 2 ») : ce sont des pieds de page
  const pieds = new Set<string>();
  for (const l of pages.flat()) {
    if (!NUMERO_PAGE.test(l.texte)) continue;
    const reste = simplifier(l.texte.replace(NUMERO_PAGE, ' '));
    if (reste) pieds.add(reste);
  }
  // 2. Plusieurs pages : une ligne identique en haut ou en bas de plusieurs pages est un en-tête / pied de page
  //    (on garde toutefois sa première apparition en haut de la page 1 : c'est souvent le nom)
  const repetes = new Set<string>();
  if (pages.length >= 2) {
    const vues = new Map<string, number>();
    for (const p of pages) {
      const bords = new Set([...p.slice(0, 2), ...p.slice(-2)].map(l => simplifier(l.texte)).filter(t => t.length >= 4));
      bords.forEach(t => vues.set(t, (vues.get(t) ?? 0) + 1));
    }
    vues.forEach((n, t) => { if (n >= 2) repetes.add(t); });
  }
  return pages.flatMap((p, numero) => p.filter((l, i) => {
    const t = simplifier(l.texte);
    if (NUMERO_PAGE.test(l.texte) || pieds.has(t)) return false;
    return !repetes.has(t) || (numero === 0 && i < 2);
  }));
}

/**
 * Complète un lien LinkedIn raccourci à l'affichage (« linkedin.com/in/… », « linkedin.com/in/ »)
 * avec l'adresse complète du lien cliquable du PDF. S'il n'y a aucun lien LinkedIn dans le texte
 * mais un lien cliquable, on l'ajoute juste après la ligne de l'e-mail (en-tête).
 */
export function completerLiens(lignes: LigneImportee[], liens: string[]): LigneImportee[] {
  const complet = liens.map(u => u.trim()).find(u => /linkedin\.com\/(in|pub)\/[^/?#\s]+/i.test(u));
  if (!complet) return lignes;
  const adresse = complet.replace(/^https?:\/\/(www\.)?/i, '').replace(/[/?#]+$/, '');
  const RACCOURCI = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/?(?:[^\s|,;]*?)(?:\.{3,}|…)|(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/?(?=\s|$|\|)/i;
  let trouve = false;
  const res = lignes.map(l => {
    if (!/linkedin\.com/i.test(l.texte)) return l;
    trouve = true;
    return RACCOURCI.test(l.texte) ? { ...l, texte: l.texte.replace(RACCOURCI, adresse) } : l;
  });
  if (trouve) return res;
  const iEmail = res.findIndex(l => /@[\w-]+\.[a-z]{2,}/i.test(l.texte));
  if (iEmail < 0) return res;
  return [...res.slice(0, iEmail + 1), { ...res[iEmail], texte: adresse }, ...res.slice(iEmail + 1)];
}

export class PdfImageErreur extends Error {
  constructor() {
    super("Ce PDF ne contient pas de texte lisible : il a sans doute été exporté comme une image (« aplati »). " +
      "Dans Canva, réexportez-le avec Partager › Télécharger › PDF Standard, sans cocher « Aplatir le PDF ». " +
      'Vous pouvez aussi copier-coller le texte du CV.');
  }
}

/** Ce que l'on tire d'un fichier : le texte (en lignes) et la photo éventuelle */
// ---------------------------------------------------------------------------
//  Lettres espacées sur toute une ligne (Canva) : pdf.js rend « C o n t r ô l e r u n p r o d u i t »,
//  avec la même espace entre les lettres et entre les mots. Les vrais caractères « espace » existent
//  pourtant dans le PDF : on les retrouve dans la suite des caractères dessinés (liste des opérations).
// ---------------------------------------------------------------------------
/** Suite des caractères dessinés : chaque caractère visible, et s'il est précédé d'une vraie espace */
export interface FluxCaracteres { lettres: string; espaceAvant: boolean[] }

/** Construit le flux à partir des groupes de caractères dessinés (un groupe = une opération d'écriture) */
export function fluxDepuisGlyphes(groupes: (string | null)[][]): FluxCaracteres {
  let lettres = '';
  const espaceAvant: boolean[] = [];
  for (const groupe of groupes) {
    // (début d'opération : pas d'espace supposée, car certains PDF écrivent chaque lettre à part)
    let espace = false;
    for (const u of groupe) {
      if (u === null) continue; // simple décalage (espacement des lettres)
      if (!u.trim()) { espace = true; continue; }
      for (const [k, c] of [...u.normalize('NFKC')].entries()) {
        lettres += c;
        espaceAvant.push(k === 0 && espace);
      }
      espace = false;
    }
  }
  return { lettres, espaceAvant };
}

/**
 * Remet les espaces entre les mots d'un texte aux lettres espacées, grâce au flux de caractères.
 * Renvoie null si le texte n'est pas aux lettres espacées ou n'est pas retrouvé.
 */
export function respacer(texte: string, flux: FluxCaracteres, depuis = 0): { texte: string; fin: number } | null {
  const t = texte.trim();
  if (!LETTRES_ESPACEES.test(t) || t.length < 7) return null;
  const compact = t.replace(/ /g, '').normalize('NFKC');
  let pos = flux.lettres.indexOf(compact, depuis);
  if (pos < 0) pos = flux.lettres.indexOf(compact);
  if (pos < 0) return null;
  let out = '';
  [...compact].forEach((c, j) => { out += (j > 0 && flux.espaceAvant[pos + j] ? ' ' : '') + c; });
  return { texte: out, fin: pos + compact.length };
}

/** Page pdf.js, réduite à ce qui sert ici */
interface PageAvecOperations { getOperatorList(): Promise<{ fnArray: number[]; argsArray: unknown[][] }> }

/** Corrige les morceaux aux lettres espacées d'une page (« C o n t r ô l e r u n » -> « Contrôler un ») */
export async function respacerMorceaux(page: PageAvecOperations, morceaux: Morceau[], opEcriture: number): Promise<void> {
  if (!morceaux.some(m => LETTRES_ESPACEES.test(m.texte.trim()) && m.texte.trim().length >= 7)) return;
  try {
    const ops = await page.getOperatorList();
    const groupes: (string | null)[][] = [];
    ops.fnArray.forEach((f, k) => {
      if (f !== opEcriture) return;
      const glyphes = ops.argsArray[k]?.[0];
      if (Array.isArray(glyphes)) groupes.push(glyphes.map(g => (g && typeof g === 'object' && typeof (g as { unicode?: unknown }).unicode === 'string' ? (g as { unicode: string }).unicode : null)));
    });
    const flux = fluxDepuisGlyphes(groupes);
    let curseur = 0;
    for (const m of morceaux) {
      const r = respacer(m.texte, flux, curseur);
      if (r) { m.texte = r.texte; curseur = r.fin; }
    }
  } catch { /* liste des opérations illisible : on garde le texte tel quel */ }
}

export interface ContenuImporte {
  lignes: LigneImportee[];
  photo: Photo | null;
}

/** Lit un fichier PDF : lignes nettoyées dans l'ordre de lecture + photo de profil */
export async function lirePdf(fichier: File): Promise<ContenuImporte> {
  // pdf.js est chargé seulement quand on en a besoin (il est volumineux)
  const pdfjs = await import('pdfjs-dist');
  const { default: urlWorker } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = urlWorker;

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await fichier.arrayBuffer()) }).promise;
  const pages: LigneImportee[][] = [];
  const liens: string[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const largeur = page.getViewport({ scale: 1 }).width;
    const contenu = await page.getTextContent();
    const morceaux: Morceau[] = [];
    for (const item of contenu.items) {
      if (!('str' in item) || !item.str) continue;
      const [a, b, , , x, y] = item.transform as number[];
      morceaux.push({ texte: item.str, x, y, largeur: item.width, taille: Math.hypot(a, b) || item.height || 10 });
    }
    // Lettres espacées sur toute une ligne : on retrouve les vrais espaces dans les caractères dessinés
    await respacerMorceaux(page, morceaux, pdfjs.OPS.showText);
    pages.push(reconstruireLignes(morceaux, largeur));
    // Liens cliquables : l'adresse complète, même quand le texte affiché est raccourci
    try {
      for (const a of await page.getAnnotations()) if (a?.subtype === 'Link' && typeof a.url === 'string') liens.push(a.url);
    } catch { /* PDF sans annotations lisibles */ }
  }
  const lignes = completerLiens(retirerEntetesEtPieds(pages)
    .map(l => ({ ...l, texte: nettoyerLigne(l.texte) }))
    .filter(l => !ligneVide(l.texte)), liens);
  if (lignes.reduce((n, l) => n + l.texte.length, 0) < 60) throw new PdfImageErreur();
  const photo = await extrairePhotoPdf(pdf, pdfjs.OPS as unknown as Record<string, number>);
  return { lignes, photo };
}
