// ============================================================================
//  Lettre de motivation : création, brouillon guidé, lieu et date, nom de fichier
//  et petites vérifications avant l'envoi.
// ============================================================================
import type { Candidature, CV, LettreMotivation, StatutCandidature } from '../types';
import { affichees, maintenant, nomComplet, uid } from './cv';
import { phraseRqthLettre, rqthDansLettre } from './rqth';

const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Date du jour en AAAA-MM-JJ (heure locale) */
export function aujourdhui(d = new Date()): string {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

/** « Paris, le 18 novembre 2026 » / « Paris, 18 November 2026 » */
export function lieuDateAuto(cv: CV, d = new Date()): string {
  const ville = cv.donnees.infosPerso.ville.split(/[,(]/)[0].replace(/^\d{5}\s*/, '').trim();
  if (cv.langue === 'en') return `${ville ? ville + ', ' : ''}${d.getDate()} ${MOIS_EN[d.getMonth()]} ${d.getFullYear()}`;
  const jour = d.getDate() === 1 ? '1er' : String(d.getDate());
  return `${ville ? ville + ', ' : ''}le ${jour} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

/** Lieu et date affichés : ceux saisis, sinon ville du CV + date du jour */
export const lieuDate = (cv: CV, l: LettreMotivation) => l.lieuDate.trim() || lieuDateAuto(cv);

/** Formules par défaut selon la langue du CV */
export const formules = (langue: CV['langue']) => langue === 'en'
  ? { appel: 'Dear Hiring Manager,', politesse: 'Thank you for considering my application. I look forward to the opportunity to discuss it with you.\n\nYours sincerely,' }
  : { appel: 'Madame, Monsieur,', politesse: 'Je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.' };

/** Objet par défaut : « Candidature au poste de … » */
export function objetAuto(cv: CV, poste: string): string {
  const p = poste.trim() || cv.donnees.infosPerso.titre.trim();
  if (cv.langue === 'en') return p ? `Application for the ${p} position` : 'Application';
  if (!p) return 'Candidature spontanée';
  // « de Analyste » -> « d’Analyste »
  return /^[aeiouyhàâéèêîïôû]/i.test(p) ? `Candidature au poste d’${p}` : `Candidature au poste de ${p}`;
}

/** Nouvelle lettre, reliée à un CV */
export function lettreVierge(cv: CV, o: { entreprise?: string; poste?: string } = {}): LettreMotivation {
  const entreprise = o.entreprise?.trim() ?? '';
  const poste = o.poste?.trim() ?? '';
  const f = formules(cv.langue);
  return {
    id: uid(),
    nom: entreprise ? `Lettre — ${entreprise}` : 'Nouvelle lettre',
    cvId: cv.id,
    entreprise, poste,
    destinataire: entreprise ? `Service Recrutement\n${entreprise}` : '',
    lieuDate: '',
    objet: objetAuto(cv, poste),
    appel: f.appel,
    corps: '',
    politesse: f.politesse,
    dateCreation: maintenant(),
    dateModification: maintenant(),
  };
}

/** Marque des passages à compléter dans le brouillon */
export const A_COMPLETER = /\[[^\]\n]{2,}\]/g;

/**
 * Brouillon en 3 temps (Vous / Moi / Nous), prérempli avec le CV.
 * Les passages entre crochets sont à remplacer avant l'envoi.
 */
export function brouillonLettre(cv: CV, l: Pick<LettreMotivation, 'entreprise' | 'poste'>): string {
  const d = cv.donnees;
  const ent = l.entreprise.trim() || '[nom de l’entreprise]';
  const poste = l.poste.trim() || d.infosPerso.titre.trim() || '[intitulé du poste]';
  const exp = affichees(d.experiences)[0];
  const form = affichees(d.formations)[0];
  const outils = affichees(d.competences).flatMap(g => g.elements).slice(0, 3).join(', ');
  if (cv.langue === 'en') {
    return [
      `I am writing to apply for the ${poste} position at ${ent}. [What attracts you to ${ent}: a recent deal, its sector, its values, its growth.]`,
      `${form ? `Currently ${form.diplome}${form.etablissement ? ` student at ${form.etablissement}` : ''}, ` : ''}${exp ? `I gained hands-on experience as ${exp.poste}${exp.entreprise ? ` at ${exp.entreprise}` : ''}, where I [main achievement with a figure].` : '[Your most relevant experience, with a figure.]'}${outils ? ` I am proficient in ${outils}.` : ''} [Link this to one or two requirements of the job offer.]`,
      ...(rqthDansLettre(cv) ? [phraseRqthLettre(cv)] : []),
      `Joining ${ent} would allow me to [what you will bring to the team]. ${d.rythmeAlternance ? `My work-study schedule: ${d.rythmeAlternance}. ` : ''}I would welcome the opportunity to discuss my application in an interview.`,
    ].join('\n\n');
  }
  return [
    `Votre annonce pour le poste de ${poste} a retenu toute mon attention. [Ce qui vous attire chez ${ent} : une opération récente, son secteur, ses valeurs, sa croissance.]`,
    `${form ? `Actuellement en ${form.diplome}${form.etablissement ? ` à ${form.etablissement}` : ''}, ` : ''}${exp ? `j’ai acquis une première expérience ${elision('en tant que', exp.poste)}${exp.entreprise ? ` chez ${exp.entreprise}` : ''}, où j’ai [réalisation principale, avec un chiffre].` : '[Votre expérience la plus proche du poste, avec un chiffre.]'}${outils ? ` Je maîtrise notamment ${outils}.` : ''} [Reliez ces compétences à une ou deux exigences de l’offre.]`,
    ...(rqthDansLettre(cv) ? [phraseRqthLettre(cv)] : []),
    `Rejoindre ${ent} me permettrait de [ce que vous apporterez à l’équipe]. ${d.rythmeAlternance ? `Mon rythme d’alternance : ${d.rythmeAlternance}. ` : ''}Je me tiens à votre disposition pour vous exposer plus en détail ma motivation lors d’un entretien.`,
  ].join('\n\n');
}

/** « que » + voyelle -> « qu’ », « de » + voyelle -> « d’ » */
function elision(avant: string, mot: string): string {
  if (/^[aeiouyhàâéèêîïôû]/i.test(mot) && /(que|de)$/.test(avant)) return `${avant.slice(0, -1)}’${mot}`;
  return `${avant} ${mot}`;
}

/** Paragraphes du corps (séparés par une ligne vide) */
export const paragraphes = (corps: string) => corps.replace(/\r/g, '').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

/** Points à vérifier avant d'envoyer la lettre */
export function verifierLettre(cv: CV, l: LettreMotivation): string[] {
  const alertes: string[] = [];
  const texte = [l.destinataire, l.objet, l.appel, l.corps, l.politesse].join('\n');
  const trous = texte.match(A_COMPLETER) ?? [];
  if (trous.length) alertes.push(`${trous.length} passage(s) entre crochets à compléter, ex. ${trous[0]}`);
  if (!l.corps.trim()) alertes.push('Le corps de la lettre est vide.');
  if (!nomComplet(cv)) alertes.push('Votre nom est vide dans le CV relié.');
  if (l.entreprise.trim() && !normal(texte).includes(normal(l.entreprise))) alertes.push(`Le nom de l’entreprise « ${l.entreprise} » n’apparaît nulle part dans la lettre.`);
  const mots = l.corps.split(/\s+/).filter(Boolean).length;
  if (mots > 0 && mots < 120) alertes.push(`Lettre courte (${mots} mots) : visez 200 à 350 mots.`);
  if (mots > 400) alertes.push(`Lettre longue (${mots} mots) : visez 200 à 350 mots pour tenir sur une page.`);
  return alertes;
}
const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Nom de fichier : Lettre_Prenom_Nom_Entreprise */
export function nomFichierLettre(cv: CV, l: LettreMotivation): string {
  const p = cv.donnees.infosPerso;
  const morceaux = ['Lettre', p.prenom, p.nom, l.entreprise || l.poste].map(s => s.trim()).filter(Boolean);
  return morceaux.join('_')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and').replace(/[^\w-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
    .slice(0, 80);
}

// ---------------------------------------------------------------------------
//  Suivi des candidatures
// ---------------------------------------------------------------------------
export const STATUTS: { id: StatutCandidature; libelle: string; classe: string }[] = [
  { id: 'envoyee', libelle: 'Envoyée', classe: 'bg-sky-50 text-sky-800 border-sky-200' },
  { id: 'relance', libelle: 'Relancée', classe: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'entretien', libelle: 'Entretien', classe: 'bg-violet-50 text-violet-800 border-violet-200' },
  { id: 'refus', libelle: 'Refus', classe: 'bg-gray-100 text-gray-600 border-gray-200' },
  { id: 'offre', libelle: 'Offre', classe: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
];

export function candidatureVide(o: Partial<Candidature> = {}): Candidature {
  return {
    id: uid(), entreprise: '', poste: '', dateEnvoi: aujourdhui(), cvId: null, lettreId: null,
    scoreAts: null, statut: 'envoyee', lien: '', notes: '', ...o,
  };
}

/** Nombre de jours depuis l'envoi */
export function joursDepuis(dateIso: string, maintenant = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  const jour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  return Math.round((jour.getTime() - d.getTime()) / 86400000);
}

/** Une candidature envoyée sans réponse depuis 10 jours ou plus est à relancer */
export const DELAI_RELANCE = 10;
export const aRelancer = (c: Candidature, d = new Date()) => c.statut === 'envoyee' && (joursDepuis(c.dateEnvoi, d) ?? 0) >= DELAI_RELANCE;

export type ColonneTri = 'entreprise' | 'poste' | 'dateEnvoi' | 'scoreAts' | 'statut';

/** Tri des candidatures (les valeurs vides toujours à la fin) */
export function trierCandidatures(liste: Candidature[], col: ColonneTri, sens: 1 | -1): Candidature[] {
  const ordreStatut = Object.fromEntries(STATUTS.map((s, i) => [s.id, i]));
  const valeur = (c: Candidature): string | number | null => {
    if (col === 'scoreAts') return c.scoreAts;
    if (col === 'statut') return ordreStatut[c.statut];
    const v = c[col].trim();
    return v ? (col === 'dateEnvoi' ? v : normal(v)) : null;
  };
  return [...liste].sort((a, b) => {
    const va = valeur(a), vb = valeur(b);
    if (va === null && vb === null) return 0;
    if (va === null) return 1;
    if (vb === null) return -1;
    return (va < vb ? -1 : va > vb ? 1 : 0) * sens;
  });
}

/** Filtre : statuts cochés + recherche libre (entreprise, poste, notes) */
export function filtrerCandidatures(liste: Candidature[], statuts: StatutCandidature[], recherche: string): Candidature[] {
  const q = normal(recherche);
  return liste.filter(c => (!statuts.length || statuts.includes(c.statut))
    && (!q || normal(`${c.entreprise} ${c.poste} ${c.notes}`).includes(q)));
}

/** Insère la phrase RQTH avant le dernier paragraphe (demande d'entretien), ou à la fin */
export function ajouterPhraseRqth(corps: string, phrase: string): string {
  const p = paragraphes(corps);
  if (p.some(x => /RQTH/i.test(x))) return corps;
  if (p.length < 2) return [...p, phrase].join('\n\n');
  return [...p.slice(0, -1), phrase, p[p.length - 1]].join('\n\n');
}
