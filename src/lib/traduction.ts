// ============================================================================
//  Version anglaise (ou française) d'un CV, en aller-retour avec une IA :
//  1. on prépare un prompt avec le contenu du CV en JSON (chaque élément garde son id) ;
//  2. l'utilisatrice le colle dans ChatGPT / Claude ;
//  3. elle recolle la réponse : on l'applique, élément par élément, sur une copie du CV.
//  Rien n'est envoyé par le site lui-même : tout passe par le presse-papiers.
// ============================================================================
import type { CleSection, CV, LangueCV } from '../types';
import { copierCv } from './cv';

/** Contenu traduisible du CV (les ids permettent de remettre chaque texte à sa place) */
export interface ContenuTraduisible {
  titre: string;
  accroche: string;
  rythmeAlternance: string;
  experiences: { id: string; poste: string; entreprise: string; ville: string; puces: { id: string; texte: string }[] }[];
  formations: { id: string; diplome: string; etablissement: string; ville: string; puces: { id: string; texte: string }[] }[];
  competences: { id: string; categorie: string; elements: string[] }[];
  qualites: string[];
  langues: { id: string; langue: string; precision: string }[];
  certifications: { id: string; intitule: string; organisme: string; annee: string }[];
  centresInteret: string[];
  titresPersonnalises: Partial<Record<CleSection, string>>;
}

export function contenuTraduisible(cv: CV): ContenuTraduisible {
  const d = cv.donnees;
  return {
    titre: d.infosPerso.titre,
    accroche: d.accroche,
    rythmeAlternance: d.rythmeAlternance,
    experiences: d.experiences.map(e => ({ id: e.id, poste: e.poste, entreprise: e.entreprise, ville: e.ville, puces: e.puces.map(p => ({ id: p.id, texte: p.texte })) })),
    formations: d.formations.map(f => ({ id: f.id, diplome: f.diplome, etablissement: f.etablissement, ville: f.ville, puces: f.puces.map(p => ({ id: p.id, texte: p.texte })) })),
    competences: d.competences.map(g => ({ id: g.id, categorie: g.categorie, elements: [...g.elements] })),
    qualites: [...d.qualites],
    langues: d.langues.map(l => ({ id: l.id, langue: l.langue, precision: l.precision })),
    certifications: d.certifications.map(c => ({ id: c.id, intitule: c.intitule, organisme: c.organisme, annee: c.annee })),
    centresInteret: [...d.centresInteret],
    titresPersonnalises: Object.fromEntries(Object.entries(cv.titresPersonnalises).filter(([, v]) => v?.trim())),
  };
}

const NOM_LANGUE: Record<LangueCV, string> = { fr: 'français', en: 'anglais' };

/** Prompt à coller dans ChatGPT / Claude */
export function promptTraduction(cv: CV, cible: LangueCV): string {
  const vers = NOM_LANGUE[cible];
  const consignesEn = cible === 'en'
    ? `- Utilise l'anglais professionnel des CV (UK/US neutre), avec des verbes d'action au passé en début de puce (Led, Built, Audited, Reduced…).
- Traduis les intitulés de poste par leur équivalent reconnu (ex. « Contrôleur de gestion » -> « Financial Controller », « Alternance » -> « Work-study / Apprenticeship »).
- Pour un diplôme français sans équivalent exact, garde le nom d'origine et ajoute l'équivalent entre parenthèses (ex. « BTS Comptabilité et Gestion (2-year Higher National Diploma in Accounting) », « Master CCA (MSc in Accounting, Control & Audit) »).
- « Langue maternelle » -> « Native », « Courant » -> « Fluent ».`
    : `- Utilise le français professionnel des CV, avec des verbes d'action au participe passé en début de puce (Piloté, Réalisé, Audité…).
- Traduis les intitulés de poste par leur équivalent français reconnu ; garde l'anglais quand c'est l'usage (M&A, Private Equity, Transaction Services…).`;
  return `Tu es un traducteur spécialisé en CV et en recrutement. Traduis ce CV en ${vers}.

## Règles
- Réponds UNIQUEMENT avec le JSON traduit, dans un bloc \`\`\`json, sans aucun commentaire.
- Garde exactement la même structure et les mêmes valeurs « id » (ne les traduis pas, ne les modifie pas).
- Ne traduis pas les noms propres : noms d'entreprises, d'écoles, de logiciels, de villes, sigles (garde « Cabinet Big 4 », « IAE Paris-Sorbonne », « SAP », « IFRS »…). Traduis seulement les parties descriptives (ex. « Groupe industriel (CA 400 M€) » -> « Industrial group (revenue €400M) »).
- Garde tous les chiffres, montants, pourcentages et dates à l'identique (adapte seulement leur écriture : « 1,2 Md€ » -> « €1.2bn », « 50 M€ » -> « €50M »).
- N'invente rien, n'ajoute ni ne supprime aucun élément. Garde la même longueur environ (le CV doit tenir sur une page).
- « annee » des certifications : garde l'année ; traduis seulement « En cours » / « In progress ».
${consignesEn}

## CV (JSON)
\`\`\`json
${JSON.stringify(contenuTraduisible(cv), null, 2)}
\`\`\``;
}

/** Extrait le JSON d'une réponse d'IA (bloc ```json, ou du premier « { » au dernier « } ») */
export function lireReponse(reponse: string): ContenuTraduisible {
  const bloc = reponse.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const brut = bloc ?? reponse.slice(reponse.indexOf('{'), reponse.lastIndexOf('}') + 1);
  let donnees: unknown;
  try { donnees = JSON.parse(brut.trim()); }
  catch { throw new Error("La réponse ne contient pas de JSON lisible. Copiez toute la réponse de l'IA (le bloc qui commence par { et finit par })."); }
  if (!donnees || typeof donnees !== 'object' || !('experiences' in donnees)) {
    throw new Error("Ce JSON ne ressemble pas au CV envoyé (pas de rubrique « experiences »). Vérifiez que vous avez collé la bonne réponse.");
  }
  return donnees as ContenuTraduisible;
}

/** Noms de langues (traduits même sans IA) */
const LANGUES: [string, string][] = [
  ['Français', 'French'], ['Anglais', 'English'], ['Espagnol', 'Spanish'], ['Allemand', 'German'], ['Italien', 'Italian'],
  ['Portugais', 'Portuguese'], ['Chinois', 'Chinese'], ['Mandarin', 'Mandarin'], ['Arabe', 'Arabic'], ['Japonais', 'Japanese'],
  ['Russe', 'Russian'], ['Néerlandais', 'Dutch'], ['Polonais', 'Polish'], ['Turc', 'Turkish'], ['Coréen', 'Korean'], ['Hindi', 'Hindi'],
];
export function traduireNomLangue(nom: string, cible: LangueCV): string {
  const n = nom.trim().toLowerCase();
  const paire = LANGUES.find(([fr, en]) => fr.toLowerCase() === n || en.toLowerCase() === n);
  return paire ? (cible === 'en' ? paire[1] : paire[0]) : nom;
}

const texte = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const listeTextes = (v: unknown): v is string[] => Array.isArray(v) && v.every(x => typeof x === 'string');

/**
 * Crée la copie du CV dans la langue cible.
 * Sans réponse d'IA : copie avec titres de sections, dates et noms de langues traduits (le reste à traduire à la main).
 * Avec réponse : chaque texte traduit remplace l'original (par id). Renvoie aussi le nombre de textes remplacés.
 */
export function creerVersion(cv: CV, cible: LangueCV, reponse?: ContenuTraduisible): { cv: CV; remplaces: number; ignores: number } {
  const copie = copierCv(cv, `${cv.nom.replace(/\s*\((EN|FR)\)$/, '')} (${cible.toUpperCase()})`);
  copie.langue = cible;
  copie.titresPersonnalises = {};
  const d = copie.donnees;
  d.langues.forEach(l => { l.langue = traduireNomLangue(l.langue, cible); });
  d.certifications.forEach(c => {
    if (cible === 'en' && /^en cours$/i.test(c.annee.trim())) c.annee = 'In progress';
    if (cible === 'fr' && /^in progress$/i.test(c.annee.trim())) c.annee = 'En cours';
  });
  if (!reponse) return { cv: copie, remplaces: 0, ignores: 0 };

  let remplaces = 0, ignores = 0;
  const poser = <T extends object>(cible_: T, cle: keyof T, valeur: unknown) => {
    if (texte(valeur)) { (cible_[cle] as unknown) = valeur.trim(); remplaces++; }
  };
  /** Retrouve un élément par id ; compte ceux que l'IA a inventés ou mal recopiés */
  const parId = <T extends { id: string }>(liste: T[], id: unknown): T | undefined => {
    const x = liste.find(y => y.id === id);
    if (!x) ignores++;
    return x;
  };

  poser(d.infosPerso, 'titre', reponse.titre);
  poser(d, 'accroche', reponse.accroche);
  poser(d, 'rythmeAlternance', reponse.rythmeAlternance);
  for (const e of reponse.experiences ?? []) {
    const x = parId(d.experiences, e?.id);
    if (!x) continue;
    poser(x, 'poste', e.poste); poser(x, 'entreprise', e.entreprise); poser(x, 'ville', e.ville);
    for (const p of e.puces ?? []) { const y = parId(x.puces, p?.id); if (y) poser(y, 'texte', p.texte); }
  }
  for (const f of reponse.formations ?? []) {
    const x = parId(d.formations, f?.id);
    if (!x) continue;
    poser(x, 'diplome', f.diplome); poser(x, 'etablissement', f.etablissement); poser(x, 'ville', f.ville);
    for (const p of f.puces ?? []) { const y = parId(x.puces, p?.id); if (y) poser(y, 'texte', p.texte); }
  }
  for (const g of reponse.competences ?? []) {
    const x = parId(d.competences, g?.id);
    if (!x) continue;
    poser(x, 'categorie', g.categorie);
    if (listeTextes(g.elements) && g.elements.length) { x.elements = g.elements.map(s => s.trim()).filter(Boolean); remplaces++; }
  }
  if (listeTextes(reponse.qualites) && reponse.qualites.length) { d.qualites = reponse.qualites; remplaces++; }
  if (listeTextes(reponse.centresInteret) && reponse.centresInteret.length) { d.centresInteret = reponse.centresInteret; remplaces++; }
  for (const l of reponse.langues ?? []) {
    const x = parId(d.langues, l?.id);
    if (!x) continue;
    poser(x, 'langue', l.langue);
    if (typeof l.precision === 'string') x.precision = l.precision.trim();
  }
  for (const c of reponse.certifications ?? []) {
    const x = parId(d.certifications, c?.id);
    if (!x) continue;
    poser(x, 'intitule', c.intitule); poser(x, 'organisme', c.organisme); poser(x, 'annee', c.annee);
  }
  for (const [cle, titre] of Object.entries(reponse.titresPersonnalises ?? {})) {
    if (texte(titre) && copie.ordreSections.includes(cle as CleSection)) copie.titresPersonnalises[cle as CleSection] = titre.trim();
  }
  return { cv: copie, remplaces, ignores };
}
