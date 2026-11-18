// ============================================================================
//  Découpage automatique d'un CV importé (PDF, Word, Canva, texte collé)
//  lignes de texte  ->  sections du CV  ->  données structurées
//  Ce que l'outil ne sait pas classer part dans « À classer » : rien n'est perdu.
// ============================================================================
import type {
  CleSection, Certification, DonneesCV, Experience, Formation, FragmentAClasser, GroupeCompetences, Langue, Periode,
} from '../../types';
import { decouperListe, puce, uid, periodeVide } from '../cv';
import { estEnCours, lireDate } from '../dates';
import { niveauDepuisTexte } from '../../store/migrations';
import { SYNONYMES } from '../../data/synonymes';
import { PARCOURS, TRANSVERSAL } from '../../data/certifications';
import type { LigneImportee } from './lirePdf';

// ---------------------------------------------------------------------------
//  Outils de base
// ---------------------------------------------------------------------------
const sansAccents = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const normaliser = (s: string) => sansAccents(s).replace(/[’']/g, ' ').replace(/[^a-z0-9&+ ]+/g, ' ').replace(/\s+/g, ' ').trim();
const estPuce = (t: string) => t.startsWith('• ');
/** Teste une liste de mots sur le texte sans accents (« École » et « Ecole » sont reconnus pareil) */
const mot = (re: RegExp, t: string) => re.test(sansAccents(t));
const sansPuce = (t: string) => t.replace(/^•\s*/, '');

// ---------------------------------------------------------------------------
//  Titres de sections reconnus (français, anglais, titres « créatifs » Canva)
// ---------------------------------------------------------------------------
type CleImport = CleSection | 'contact' | 'autre';

const TITRES: Record<CleImport, string[]> = {
  accroche: ['profil', 'mon profil', 'a propos', 'a propos de moi', 'about', 'about me', 'summary', 'profile', 'objectif', 'objectif professionnel', 'presentation', 'qui suis je', 'resume', 'professional summary'],
  experiences: ['experience', 'experiences', 'experience professionnelle', 'experiences professionnelles', 'parcours professionnel', 'mon parcours', 'parcours', 'emplois', 'work experience', 'professional experience', 'employment', 'employment history', 'career', 'stages', 'stages et emplois', 'experiences pro'],
  formations: ['formation', 'formations', 'education', 'etudes', 'diplomes', 'diplomes et formations', 'parcours academique', 'cursus', 'scolarite', 'academic background', 'academic'],
  competences: ['competences', 'mes competences', 'competences techniques', 'skills', 'hard skills', 'savoir faire', 'ce que je sais faire', 'expertise', 'expertises', 'outils', 'logiciels', 'outils et logiciels', 'informatique', 'software', 'tools', 'technical skills', 'key skills', 'competences cles', 'aptitudes', 'mes aptitudes', 'aptitudes professionnelles', 'langages', 'langages informatiques', 'informatiques', 'langages de programmation', 'programmation', 'competences informatiques'],
  qualites: ['savoir etre', 'soft skills', 'qualites', 'mes qualites', 'qualites personnelles', 'personnalite', 'ma personnalite', 'traits de personnalite', 'atouts', 'mes atouts', 'points forts', 'mes points forts', 'soft skill', 'competences humaines', 'competences comportementales'],
  langues: ['langues', 'languages', 'langue'],
  certifications: ['certifications', 'certification', 'certificats', 'certificates', 'habilitations', 'licences'],
  centresInteret: ['centres d interet', 'centre d interet', 'interets', 'loisirs', 'hobbies', 'interests', 'passions', 'activites extra professionnelles', 'divers'],
  contact: ['contact', 'contacts', 'coordonnees', 'informations personnelles', 'infos', 'informations'],
  autre: ['references', 'projets', 'projects', 'benevolat', 'volunteering', 'volunteer', 'activites', 'vie associative', 'engagements', 'engagement associatif', 'associatif', 'prix', 'awards', 'distinctions', 'publications', 'realisations', 'leadership'],
};

/** Taille de police « normale » du document (médiane) */
function tailleMediane(lignes: LigneImportee[]) {
  const t = lignes.map(l => l.taille).sort((a, b) => a - b);
  return t[Math.floor(t.length / 2)] || 10;
}

/** Cette ligne est-elle un titre de section ? Renvoie la section, ou null */
export function detecterTitre(ligne: LigneImportee, mediane = 10): CleImport | null {
  const brut = sansPuce(ligne.texte).replace(/[:\-–—_.]+$/, '').trim();
  // Un titre ne commence pas par une parenthèse et ne contient ni chiffres longs ni email
  if (!brut || brut.length > 45 || /\d{3,}|@/.test(brut) || /^[(\[]/.test(brut)) return null;
  const n = normaliser(brut);
  // Mis en valeur : en MAJUSCULES ou plus gros que le texte courant
  const enValeur = (brut === brut.toUpperCase() && /[A-Z]/.test(brut)) || ligne.taille >= mediane * 1.15;
  const compact = n.replace(/ /g, '');
  for (const [cle, mots] of Object.entries(TITRES) as [CleImport, string[]][]) {
    if (mots.some(m => n === m || compact === m.replace(/ /g, '')
      || (enValeur && (n.startsWith(m + ' ') || n.endsWith(' ' + m) || (m.length >= 6 && compact.startsWith(m.replace(/ /g, ''))))))) return cle;
  }
  return null;
}

// ---------------------------------------------------------------------------
//  Dates
// ---------------------------------------------------------------------------
const MOIS = "(?:janv(?:ier)?|f[ée]vr?(?:ier)?|mars|avr(?:il)?|mai|juin|juil(?:let)?|ao[uû]t|sept?(?:embre)?|oct(?:obre)?|nov(?:embre)?|d[ée]c(?:embre)?|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|september|october|november|december)\\.?";
// (une année collée à une référence, « CYBER-2026-482 », n'est pas une date)
const DATE = `(?:(?:${MOIS}\\s*)?(?:\\d{1,2}[/.])?(?<![A-Za-zÀ-ÿ]-)(?:19|20)\\d{2}(?!-\\d{1,3}\\b)|\\d{1,2}/\\d{2}(?![\\d/])|${MOIS}\\s*[-'’]?\\d{2}(?![\\d/]))`;
const FIN = `(?:${DATE}|aujourd['’ ]?hui|pr[ée]sent|actuel(?:lement)?|en cours|now|today|current)`;
const PLAGE = new RegExp(`(?:depuis|since|de|from|du)?\\s*\\(?(${DATE})\\s*(?:[-–—]|à|a|to|au|>)\\s*(${FIN})\\)?`, 'i');
const DEPUIS = new RegExp(`(?:depuis|since)\\s+(${DATE})`, 'i');
const SEULE = new RegExp(`\\(?\\b(${DATE})\\b\\)?`, 'i');
/** « 2021/2022 » ou « 2021 / 2022 » (année scolaire) */
const ANNEES = /\b((?:19|20)\d{2})\s*\/\s*((?:19|20)\d{2})\b/;
/** « Juin - Août 2023 » : le mois de début n'a pas d'année */
const PLAGE_MOIS = new RegExp(`\\b(${MOIS})\\s*(?:[-–—]|à|a|to|au)\\s*(${MOIS}\\s*((?:19|20)\\d{2}))`, 'i');

/** Extrait une période d'une ligne. Renvoie la période et le texte restant. */
export function extraireDates(ligne: string): { periode: Periode; reste: string } | null {
  const lire = (t: string) => lireDate(t.replace(/\s+/g, ' ')) ?? '';
  let m = ligne.match(ANNEES);
  if (m) return { periode: { debut: m[1], fin: m[2], enCours: false }, reste: ligne.replace(m[0], ' ') };
  m = ligne.match(PLAGE_MOIS);
  if (m) {
    const fin = lire(m[2]);
    const moisDebut = lire(`${m[1]} ${m[3]}`);
    // « Novembre - Février 2023 » : le début est l'année précédente
    const debut = moisDebut && fin && moisDebut > fin ? lire(`${m[1]} ${+m[3] - 1}`) : moisDebut;
    return { periode: { debut, fin, enCours: false }, reste: ligne.replace(m[0], ' ') };
  }
  m = ligne.match(PLAGE);
  if (m) {
    const enCours = estEnCours(m[2]) || /aujourd/i.test(m[2]);
    return { periode: { debut: lire(m[1]), fin: enCours ? '' : lire(m[2]), enCours }, reste: ligne.replace(m[0], ' ').replace(/\(\s*\)/g, ' ') };
  }
  m = ligne.match(DEPUIS);
  if (m) return { periode: { debut: lire(m[1]), fin: '', enCours: true }, reste: ligne.replace(m[0], ' ').replace(/\(\s*\)/g, ' ') };
  m = ligne.match(SEULE);
  if (m) {
    // Une année isolée dans une phrase (« Préparation du budget 2024 ») n'est pas une date d'expérience
    const reste = ligne.replace(m[0], ' ').replace(/\(\s*\)/g, ' ').trim();
    // (une date entre parenthèses, « … , PARIS (JUIL 2021) », est toujours une date)
    const entreParentheses = /^\(.*\)$/.test(m[0].trim());
    // (une date en tête de ligne suivie d'un séparateur, « 2025 | Certification … », aussi)
    const enTete = ligne.trimStart().startsWith(m[0].trim()) && /^\s*[|:–—-]/.test(ligne.slice(ligne.indexOf(m[0]) + m[0].length));
    if (!entreParentheses && !enTete && (mot(DEBUT_DESCRIPTION, reste) || reste.split(/\s+/).length > 6)) return null;
    return { periode: { debut: '', fin: lire(m[1]), enCours: false }, reste };
  }
  return null;
}

// ---------------------------------------------------------------------------
//  Coordonnées
// ---------------------------------------------------------------------------
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const TELEPHONE = /(?:\+\d{1,3}[\s.-]?)?\(?0?\d(?:[\s.-]?\d{2}){4}\b|\+\d[\d\s.-]{8,}\d/;
const LINKEDIN = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/[^\s|,;]+/i;
const SITE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+\.(?:com|fr|io|net|org|dev|me|eu|be|ch)(?:\/[^\s|,;]*)?/i;
/** « Née le 12/03/2003 », « Date de naissance : 12 mars 2003 », « 22 ans », « Born 12/03/2003 » */
const NAISSANCE = /(?:n[ée]e?(?:\(e\))?\s+le\s+[\d/.\- a-zéû]+\d{4}|date de naissance\s*:?\s*[\d/.\- a-zéû]+\d{4}|born(?: on)?\s+[\w/.\- ]+\d{4}|\b\d{2}\s*ans\b)/i;
const VILLES = ['paris', 'lyon', 'marseille', 'lille', 'bordeaux', 'toulouse', 'nantes', 'nice', 'strasbourg', 'rennes', 'montpellier', 'grenoble', 'rouen', 'reims', 'tours', 'dijon', 'angers', 'nancy', 'metz', 'caen', 'orleans', 'le havre', 'la defense', 'neuilly', 'boulogne', 'versailles', 'londres', 'london', 'bruxelles', 'brussels', 'geneve', 'geneva', 'luxembourg', 'zurich', 'new york', 'singapour', 'dubai', 'montreal', 'ile de france', 'hauts de france', 'auvergne rhone alpes', 'provence alpes cote d azur', 'paca', 'occitanie', 'nouvelle aquitaine', 'grand est', 'bretagne', 'normandie', 'pays de la loire', 'centre val de loire', 'bourgogne franche comte', 'corse', 'cergy', 'nanterre', 'courbevoie', 'puteaux', 'issy les moulineaux', 'levallois'];

/** Ce morceau de texte ressemble-t-il à une ville ? */
export function ressembleVille(t: string) {
  const n = normaliser(t);
  if (mot(MOTS_ECOLE, t)) return false; // « IAE Lyon » est une école, pas une ville
  return (n.split(' ').length <= 5 && VILLES.some(v => n === v || n.startsWith(v + ' ')))
    || /\b\d{5}\b/.test(t) || /,\s*(france|belgique|suisse|uk|royaume uni)$/i.test(t.trim());
}

interface Coordonnees { email: string; telephone: string; ville: string; linkedin: string; site: string; dateNaissance: string }

/** Extrait les coordonnées d'une ligne ; renvoie le texte restant non reconnu */
function extraireCoordonnees(ligne: string, c: Coordonnees): string {
  const restes: string[] = [];
  // « · » et « • » ne séparent que s'ils sont entourés d'espaces (sinon : écriture inclusive « Auditeur·rice »)
  for (const morceau of ligne.split(/\s*\|\s*|\s+[•·]\s+/)) {
    let t = morceau;
    const li = t.match(LINKEDIN); if (li && !c.linkedin) { c.linkedin = li[0].replace(/^https?:\/\/(www\.)?/, ''); t = t.replace(li[0], ''); }
    // « LinkedIn : @prenom-nom » ou « LinkedIn : prenom-nom »
    const pseudo = t.match(/linked\s?in\s*:?\s*@?([\w-]{3,})/i);
    if (pseudo && !c.linkedin) { c.linkedin = `linkedin.com/in/${pseudo[1]}`; t = t.replace(pseudo[0], ''); }
    const em = t.match(EMAIL); if (em && !c.email) { c.email = em[0]; t = t.replace(em[0], ''); }
    const na = t.match(NAISSANCE); if (na && !c.dateNaissance) { c.dateNaissance = na[0].trim(); t = t.replace(na[0], ''); }
    const te = t.match(TELEPHONE); if (te && !c.telephone && te[0].replace(/\D/g, '').length >= 9) { c.telephone = te[0].trim(); t = t.replace(te[0], ''); }
    const si = !EMAIL.test(t) && t.match(SITE); if (si && !c.site) { c.site = si[0]; t = t.replace(si[0], ''); }
    t = t.replace(/^[\s,;:-]+|[\s,;:-]+$/g, '').replace(/^(t[ée]l[ée]phone|t[ée]l|phone|mobile|e-?mail|mail|adresse|address|linkedin|site)\s*:?\s*/i, '').trim();
    if (t && !c.ville && ressembleVille(t)) { c.ville = t.replace(/\(?\s*\b\d{5}\b\s*\)?/, ' ').replace(/\s+/g, ' ').trim(); t = ''; }
    if (t) restes.push(t);
  }
  return restes.join(' | ');
}

// ---------------------------------------------------------------------------
//  Expériences et formations
// ---------------------------------------------------------------------------
const MOTS_POSTE = /\b(stagiaire|stage|alternan|apprenti|analyste|analyst|intern|associate|associ[ée]|contr[ôo]leu|auditeu|auditri|auditor|manager|charg[ée]|assistant|consultant|junior|senior|directeu|director|responsable|trader|comptable|accountant|gestionnaire|tr[ée]sori|vendeu|employ[ée]|serveu|caissi|conseill|officer|specialist|sp[ée]cialiste|chef|head|lead|administrat|technicien|technician|ing[ée]nieu|engineer|d[ée]veloppeu|developer|architecte|architect|pentest|sysadmin|devops|rssi|ciso|product owner|scrum master|data analyst|data scientist)/i;
const MOTS_DIPLOME = /\b(mast[eè]re|master|licence|bachelor|msc|mba|dipl[ôo]me|bac\b|baccalaur|dut|bts|but\b|cpge|pr[ée]pa|doctorat|phd|programme grande [ée]cole|pge|dcg|dscg|ma[iî]trise|degree|l[123]\b|m[12]\b)/i;
// (testé sur le texte sans accents ; les débuts de mots comme « universit » n'exigent pas de fin de mot,
//  les sigles courts oui, pour ne pas reconnaître « esc » dans « escalade »)
const MOTS_ECOLE = /\b(?:(?:ecole|school|universit|institut|business school|essec|hec|escp|edhec|em lyon|emlyon|skema|neoma|kedge|audencia|dauphine|sorbonne|sciences po|lycee|college|polytechnique|centrale|campus|academie|conservatoire|ieseg|inseec|ipag|efrei|epita|estp|montpellier business|faculte|grenoble em|etablissement|institution|ensemble scolaire|groupe scolaire|enoes)|(?:iae|iut|esc|isc|ece|esce|ism|utc|gem|cfa|tbs|psb|insa|cnam|ens|mines)\b)/i;

interface Brouillon {
  titres: string[];
  periode: Periode | null;
  puces: string[];
  posteEnPremier: boolean;
  /** La dernière puce venait-elle d'une vraie puce « • » (et pas d'une ligne de description) ? */
  dernierePuceVraie: boolean;
}

const nouveauBrouillon = (): Brouillon => ({ titres: [], periode: null, puces: [], posteEnPremier: false, dernierePuceVraie: false });

function ajouterTitre(b: Brouillon, texte: string) {
  if (/\s(chez|at|@)\s/i.test(texte)) b.posteEnPremier = true;
  decouperListe(texte, /[|]/)
    // (« Groupe Industriel (ETI — 1 500 collaborateurs) — Lille » : le tiret entre parenthèses ne sépare pas)
    .flatMap(p => couperHorsParentheses(p, /\s+[-–—]\s+|\s+(?:chez|at|@)\s+/gi))
    // « 09/2025 – 08/2026 · Paris » : le point médian sépare aussi
    .flatMap(p => p.split(/\s+·\s+/))
    // « Lycée Saint-Joseph (Lyon) » : ville entre parenthèses
    .flatMap(p => {
      const m = p.match(/^(.{3,}?)\s*\(([^()]{2,40})\)$/);
      return m && (ressembleVille(m[2]) || villePossible(m[2])) ? [m[1], m[2]] : [p];
    })
    // « IAE Lyon, Lyon » ou « Cabinet X, Paris (75) » : la fin après la virgule est la ville
    .flatMap(p => {
      const m = p.match(/^(.{3,}?),\s*(.{2,})$/);
      if (!m) return [p];
      // « …, PARIS 75016 / CFA Académique » : la ville, puis un second établissement
      const [ville, ...suite] = m[2].split(/\s+\/\s+/);
      if (ressembleVille(ville) || villePossible(ville)) return [m[1], ville, ...suite];
      return [p];
    })
    .map(p => equilibrer(p.replace(/^[\s,;:·•-]+|[\s,;:·•-]+$/g, '').trim()))
    .filter(Boolean)
    .forEach(p => b.titres.push(p));
}

/** Découpe un texte aux séparateurs situés hors des parenthèses */
export function couperHorsParentheses(t: string, sep: RegExp): string[] {
  let prof = 0;
  // même longueur que le texte : les caractères entre parenthèses sont masqués
  const masque = [...t].map(c => { if (c === '(') prof++; const r = prof > 0 ? '_' : c; if (c === ')') prof = Math.max(0, prof - 1); return r; }).join('');
  const morceaux: string[] = [];
  let debut = 0;
  for (const m of masque.matchAll(sep)) { morceaux.push(t.slice(debut, m.index)); debut = m.index! + m[0].length; }
  morceaux.push(t.slice(debut));
  return morceaux;
}

/** Retire une parenthèse orpheline au début ou à la fin (reste d'une date entre parenthèses) */
function equilibrer(t: string) {
  const ouvrantes = (t.match(/\(/g) ?? []).length, fermantes = (t.match(/\)/g) ?? []).length;
  if (ouvrantes > fermantes) return t.replace(/\(\s*$/, '').replace(/^\(\s*/, '').trim();
  if (fermantes > ouvrantes) return t.replace(/^\s*\)/, '').replace(/\)\s*$/, '').trim();
  return t;
}

// Mots qui ouvrent une description de mission (et pas un intitulé de poste)
const DEBUT_DESCRIPTION = /^(gestion|suivi|suivre|analyse[rs]?|r[ée]alis|participa|mise en place|mettre en place|mise à jour|[ée]labor|accompagn|pr[ée]para|pr[ée]parer|pilot|r[ée]dact|r[ée]dig|cr[ée]ation|cr[ée]er|d[ée]velopp|coordin|coordonn|traitement|traiter|contr[ôo]le (des|du|de la|de l)|assur|assistance|support|veille|relation|prospect|saisie|saisir|[ée]tablissement (des?|du) |optimis|am[ée]lior|concept|animation|animer|encadr|recherche|organis|tenue|cl[ôo]ture|reporting|revue|v[ée]rif|calcul|construi|mod[ée]lis|n[ée]goci|automatis|identifi|[ée]valu|conseil (aux|des|a)|interlocut|en charge|charg[ée]e? de|responsable (du|de la|des|de l)|responsible for|in charge|managed|led|built|prepared|performed|supported|conducted|developed|assisted|reviewed|analy[sz]ed|created|coordinated|drafted|monitored|handled)/i;

const nbMots = (t: string) => t.trim().split(/\s+/).length;

/** Cette ligne courte décrit-elle une mission plutôt qu'un intitulé ? */
export function ressembleDescription(t: string): boolean {
  if (mot(MOTS_ECOLE, t) && nbMots(t) <= 6) return false; // « Établissement Saint-Marc » est une école
  if (mot(DEBUT_DESCRIPTION, t.trim())) return true;
  // Phrase coupée par la mise en page (« … réduisant de ») : un intitulé ne finit pas par un mot de liaison
  if (nbMots(t) >= 4 && /\s(de|des|du|la|le|les|à|au|aux|et|en|sur|pour|par|avec|un|une|dont|sous|of|the|and|to|for|with)$/i.test(t.trim())) return true;
  // Vraie phrase : assez longue, plusieurs petits mots de liaison, pas de séparateurs « | » ou « – »
  const liaisons = (t.match(/\s(de|du|des|la|le|les|et|en|pour|avec|sur|à|au|aux|dans|par)\s/gi) ?? []).length;
  if (nbMots(t) >= 8 && liaisons >= 2 && !/[|–—]|\s-\s/.test(t)) return true;
  // participe passé en tête : « Audité », « Réalisée », « Construits »… (mais pas « Chargée d'affaires »)
  const premier = t.trim().split(/\s+/)[0] ?? '';
  const nomEnE = /^(universit|soci[ée]t|comit|sp[ée]cialit|facult|entit|communaut|mutualit|activit|qualit|propri[ée]t|dur[ée]e|ann[ée]e|journ[ée]e|arm[ée]e|lyc[ée]e|mus[ée]e|coll[èe]ge)/i;
  return /^[A-ZÀ-Ý][a-zà-ÿ]+ée?s?$/.test(premier) && premier.length > 4 && nbMots(t) >= 3
    && !mot(MOTS_POSTE, premier) && !nomEnE.test(premier) && !mot(MOTS_ECOLE, t) && !mot(MOTS_ENTREPRISE, t);
}

/** Découpe les lignes d'une section en blocs (expériences ou formations) */
function decouperBlocs(lignes: string[]): Brouillon[] {
  const blocs: Brouillon[] = [];
  let cur: Brouillon | null = null;
  const nouveau = () => { cur = nouveauBrouillon(); blocs.push(cur); return cur; };

  /**
   * Cette ligne ouvre-t-elle une nouvelle entrée ? Oui si des dates arrivent juste après
   * (1 ou 2 lignes plus bas, jusqu'à 4 pour un intitulé de poste / diplôme évident).
   */
  const annonceEntree = (i: number) => {
    const evident = (mot(MOTS_POSTE, lignes[i]) || mot(MOTS_DIPLOME, lignes[i]) || mot(MOTS_ECOLE, lignes[i])) && nbMots(lignes[i]) <= 7;
    for (let j = i + 1; j <= Math.min(lignes.length - 1, i + (evident ? 4 : 2)); j++) {
      if (estPuce(lignes[j]) || ressembleDescription(lignes[j])) return false;
      const dj = extraireDates(lignes[j]);
      // « 2021 - 2023 : Licence LLCER » porte son propre intitulé : la ligne courante appartient à l'entrée précédente
      if (dj) return !(j === i + 1 && dj.reste.replace(/[^A-Za-zÀ-ÿ]/g, '').length >= 4 && !ressembleVille(dj.reste.replace(/^[\s|,;:·–-]+/, '')));
    }
    return false;
  };

  lignes.forEach((ligne, i) => {
    const c0 = cur as Brouillon | null;
    if (estPuce(ligne)) { const c = c0 ?? nouveau(); c.puces.push(sansPuce(ligne)); c.dernierePuceVraie = true; return; }
    // Suite d'une puce coupée en deux lignes : commence par une minuscule,
    // ou 1-2 mots seuls après une puce non terminée (« … en normes IFRS et French » / « GAAP »)
    if (c0?.puces.length) {
      const derniere = c0.puces[c0.puces.length - 1];
      const suiteCourte = c0.dernierePuceVraie && nbMots(ligne) <= 2 && !/[.!;:]$/.test(derniere) && !extraireDates(ligne) && !mot(MOTS_POSTE, ligne) && !annonceEntree(i);
      const coupeeApresLiaison = /\s(de|des|du|d['’]|la|le|les|l['’]|à|au|aux|et|en|sur|pour|par|avec|un|une|dont|sous|entre|vers|of|the|and|to|for|with|by|in|on)$/i.test(derniere) && !extraireDates(ligne) && !estPuce(ligne);
      if (/^[a-zà-ÿ(]/.test(ligne) || suiteCourte || coupeeApresLiaison) { c0.puces[c0.puces.length - 1] = `${derniere} ${ligne}`; return; }
    }
    // Précision entre parenthèses sous un intitulé, ex. « (bénévolat) » : on la rattache à l'intitulé
    if (c0?.titres.length && !c0.puces.length && /^\(.{1,30}\)$/.test(ligne) && !extraireDates(ligne)) { c0.titres[c0.titres.length - 1] += ' ' + ligne; return; }
    // Description entre parenthèses sous l'intitulé : « (Accueil et information, guider…) »
    if (c0?.titres.length && /^\(.{30,}\)$/.test(ligne)) { c0.puces.push(ligne.slice(1, -1).trim()); c0.dernierePuceVraie = false; return; }

    // Début et fin sur deux lignes : « Sept. 2022 – » puis « Juin 2023 » (ou « Aujourd'hui »)
    const dateSeule = (p: Periode | null) => !!p && !p.debut && !!p.fin && !p.enCours;
    if (c0 && dateSeule(c0.periode) && !c0.puces.length && estEnCours(ligne.replace(/^[\s–—-]+/, ''))) {
      c0.periode = { debut: c0.periode!.fin, fin: '', enCours: true };
      return;
    }
    // « Compétences acquises : » : simple intertitre au-dessus des puces, on l'ignore
    if (/^comp[ée]tences?\s+acquises?\s*:?\s*$/i.test(ligne)) return;
    // « Assistante comptable (lettrage, déclaration TVA, bilan…) » : intitulé + détail des missions
    const posteDetaille = !extraireDates(ligne) && ligne.match(/^([^()]{3,60}?)\s*\((.{15,})\)\s*$/);
    if (posteDetaille && mot(MOTS_POSTE, posteDetaille[1]) && (!c0 || c0.puces.length || !c0.titres.some(t => mot(MOTS_POSTE, t)))) {
      const c = c0 && !c0.puces.length && c0.titres.length < 3 ? c0 : nouveau();
      ajouterTitre(c, posteDetaille[1]);
      c.puces.push(posteDetaille[2].replace(/^\s*\(|\)\s*$/g, '').trim());
      c.dernierePuceVraie = false;
      return;
    }
    const dates = extraireDates(ligne);
    if (dates && c0 && dateSeule(c0.periode) && dateSeule(dates.periode) && !c0.puces.length) {
      c0.periode = { debut: c0.periode!.fin, fin: dates.periode.fin, enCours: false };
      const reste = dates.reste.replace(/^[\s|,;:–—-]+|[\s|,;:–—-]+$/g, '').trim();
      if (reste) ajouterTitre(c0, reste);
      return;
    }
    if (dates) {
      const reste = dates.reste.replace(/^[\s|,;:–—-]+|[\s|,;:–—-]+$/g, '').trim();
      const c: Brouillon = c0 && !c0.periode && !c0.puces.length ? c0 : nouveau();
      c.periode = dates.periode;
      if (reste) ajouterTitre(c, reste);
      return;
    }
    // Phrase longue ou terminée par un point : description
    if (ligne.length > 90 || /[.!;]$/.test(ligne)) { const c = c0 ?? nouveau(); c.puces.push(ligne); c.dernierePuceVraie = false; return; }

    if (!c0) { ajouterTitre(nouveau(), ligne); return; }
    // Corps d'une entrée (après ses intitulés et ses dates) : description, sauf si une nouvelle entrée s'annonce
    // (une ville, ex. « · Paris » après les dates, ne compte pas comme intitulé)
    const intitules = c0.titres.filter(t => !ressembleVille(t) && !villePossible(t)).length;
    const corps = c0.puces.length > 0 || (!!c0.periode && intitules >= 2);
    if (corps) {
      // École écrite sous les dates d'un diplôme qui n'a pas encore d'école : elle lui appartient
      const ecoleManquante = !c0.puces.length && mot(MOTS_ECOLE, ligne) && !c0.titres.some(t => mot(MOTS_ECOLE, t)) && c0.titres.some(t => mot(MOTS_DIPLOME, t));
      // Second établissement juste sous le premier (« CFA Académique de Paris ») : il complète l'école
      const secondeEcole = !c0.puces.length && mot(MOTS_ECOLE, ligne) && c0.titres.some(t => mot(MOTS_DIPLOME, t)) && !annonceEntree(i);
      if (ecoleManquante || secondeEcole) ajouterTitre(c0, ligne);
      else if (!ressembleDescription(ligne) && annonceEntree(i)) ajouterTitre(nouveau(), ligne);
      else { c0.puces.push(ligne); c0.dernierePuceVraie = false; }
      return;
    }
    // En-tête d'une entrée : intitulé, sauf si la ligne décrit clairement une mission
    if (c0.titres.length && ressembleDescription(ligne)) { c0.puces.push(ligne); c0.dernierePuceVraie = false; }
    else ajouterTitre(c0, ligne);
  });
  return blocs.filter(b => b.titres.length || b.puces.length);
}

// ---------------------------------------------------------------------------
//  Répartition des intitulés d'un bloc (poste / entreprise / ville, diplôme / école / ville)
// ---------------------------------------------------------------------------
const MOTS_ENTREPRISE = /\b(sa|sas|sarl|se|group|groupe|bank|banque|cabinet|capital|partners|associ[ée]s|& ?co|consulting|holding|inc|ltd|llc|gmbh|soci[ée]t[ée]|cr[ée]dit|assurances?|bnp|kpmg|deloitte|ey|pwc|mazars|forvis|grant thornton|rothschild|lazard|natixis|axa|lvmh|total|airbus|l.or[ée]al|caisse|mutuelle|fonds|industries?|services|france|esn|ssii|entreprise|eti|pme|start-?up|num[ée]riques?|technologies|solutions|systems|software)\b/i;
/** Matières et spécialités : indices d'un intitulé de diplôme */
const MOTS_MATIERE = /\b(finance|gestion|management|comptab|contr[ôo]le|audit|[ée]conomie|droit|marketing|commerce|banque|assurance|ressources humaines|rh|math|informatique|ing[ée]nieur|r[ée]seaux|cybers[ée]curit|num[ée]rique|digital|sp[ée]cialit[ée]|option|parcours|majeure|mention|grande [ée]cole)/i;
/** Sigle d'école ou d'entreprise : « IAE », « EDHEC », « KPMG » */
const estSigle = (t: string) => /^[A-ZÀ-Ý&]{2,7}(\s+[A-ZÀ-Ý][\wÀ-ÿ-]*)*$/.test(t.trim()) && /^[A-ZÀ-Ý&]{2,7}\b/.test(t.trim());
/** Petit morceau qui pourrait être une ville non répertoriée : « Villeurbanne », « Saint-Denis » */
const villePossible = (t: string) => (/^[A-ZÀ-Ý][a-zà-ÿ'-]+(?:[ -][A-ZÀ-Ý]?[a-zà-ÿ'-]+)?(\s*\(\d{2,3}\))?$/.test(t.trim())
  || /^[A-ZÀ-Ý][A-ZÀ-Ý'-]{2,}(?:[ -][A-ZÀ-Ý'-]+)?(\s*\(\d{2,3}\))?$/.test(t.trim())) && nbMots(t) <= 3 && !mot(MOTS_ECOLE, t)
  // « PowerPoint », « Excel », « Rigueur »… ne sont pas des villes
  && !estOutil(t) && !estQualite(t) && !SYNONYMES.some(g => g.termes.some(x => normaliser(x) === normaliser(t)))
  // un sigle court (« CCA », « KPMG », « SAP ») n'est pas une ville inconnue
  && !/^[A-ZÀ-Ý]{2,5}$/.test(t.trim())
  // ni un diplôme, un poste, une matière ou une entreprise (« Master Finance », « Groupe Renault »)
  && !mot(MOTS_DIPLOME, t) && !mot(MOTS_POSTE, t) && !mot(MOTS_MATIERE, t) && !mot(MOTS_ENTREPRISE, t);
const COMMENCE_PAR_ECOLE = /^\W*(?:[ée]cole|universit[ée]|institut|lyc[ée]e|iut|iae|campus|facult[ée]|school|university|college)\b/i;
/** Ligne de spécialité (complète le diplôme) */
const SPECIALITE = /^(sp[ée]cialit[ée]s?|option|majeure|mineure|parcours|mention|dominante|fili[èe]re|major|track|concentration)\b/i;

function repartir(b: Brouillon, type: 'experience' | 'formation'): { quoi: string; ou: string; ville: string } {
  const titres = [...new Set(b.titres)];
  // 1. La ville (connue, ou code postal, ou « …, France »)
  let iVille = titres.findIndex(t => titres.length > 1 && ressembleVille(t));
  // 2. « Quoi » = le poste ou le diplôme ; « Où » = l'entreprise ou l'école
  const scoreQuoi = (t: string) => type === 'experience'
    ? (mot(MOTS_POSTE, t) ? 3 : 0) - (mot(MOTS_ENTREPRISE, t) ? 1 : 0) - (mot(MOTS_ECOLE, t) ? 2 : 0) - (estSigle(t) ? 1 : 0)
    : (mot(MOTS_DIPLOME, t) ? 3 : 0) + (mot(MOTS_MATIERE, t) ? 1 : 0) - (mot(MOTS_ECOLE, t) && !mot(MOTS_DIPLOME, t) ? 3 : 0) - (estSigle(t) ? 1 : 0)
      // « École d'Ingénierie Informatique (Bac+5) » : commence par le type d'établissement, c'est l'école
      - (COMMENCE_PAR_ECOLE.test(t) ? 4 : 0);
  const scoreOu = (t: string) => type === 'experience'
    ? (mot(MOTS_ENTREPRISE, t) ? 2 : 0) + (estSigle(t) ? 1 : 0) - (mot(MOTS_POSTE, t) ? 2 : 0)
    : (mot(MOTS_ECOLE, t) ? 3 : 0) + (estSigle(t) ? 2 : 0) - (mot(MOTS_DIPLOME, t) ? 2 : 0);
  const candidats = titres.map((_, i) => i).filter(i => i !== iVille);
  const meilleur = (liste: number[], score: (t: string) => number, parDefaut: number) =>
    liste.reduce((m, i) => (score(titres[i]) > score(titres[m]) ? i : m), parDefaut);

  // Sans indice, l'ordre le plus courant : poste/diplôme d'abord (ou l'inverse si « chez » / « at »)
  const iQuoi = candidats.length ? meilleur(candidats, scoreQuoi, b.posteEnPremier ? candidats[0] : candidats[0]) : -1;
  const restants = candidats.filter(i => i !== iQuoi);
  // Formation : spécialités et matières complètent le diplôme ; elles ne sont ni l'école ni la ville
  const complementsQuoi = type === 'formation'
    ? restants.filter(i => (mot(SPECIALITE, titres[i]) || (mot(MOTS_MATIERE, titres[i]) && scoreOu(titres[i]) <= 0)) && !mot(MOTS_ECOLE, titres[i]))
    : [];
  const pourOu = restants.filter(i => !complementsQuoi.includes(i));
  // L'école / l'entreprise : le meilleur score, sinon le premier morceau qui n'a pas l'air d'une ville
  const parDefautOu = pourOu.find(i => !(iVille < 0 && villePossible(titres[i]) && pourOu.length > 1)) ?? pourOu[0];
  const iOu = pourOu.length ? meilleur(pourOu, scoreOu, parDefautOu) : -1;
  let autres = pourOu.filter(i => i !== iOu);
  // Seul morceau restant et en forme de ville (« SAINT-DENIS », « Aulnay-sous-Bois ») : c'est la ville
  const formeDeVille = (t: string) => /^(saint|sainte|st|le|la|les)[ -]|-(sur|sous|les|en|le|la|de)-|\d{5}/i.test(t.trim());
  if (iVille < 0 && iOu >= 0 && !autres.length && villePossible(titres[iOu]) && formeDeVille(titres[iOu]) && scoreOu(titres[iOu]) <= 0) {
    iVille = iOu;
    autres = [];
    return {
      quoi: [iQuoi, ...complementsQuoi].filter(i => i >= 0).map(i => titres[i]).join(' — '),
      ou: '',
      ville: titres[iVille],
    };
  }
  // 3. Pas de ville connue : un dernier petit morceau en forme de nom de ville en fait office
  if (iVille < 0) {
    const v = autres.find(i => villePossible(titres[i]) && scoreQuoi(titres[i]) <= 0 && scoreOu(titres[i]) <= 0);
    if (v !== undefined) { iVille = v; autres = autres.filter(i => i !== v); }
  }
  return {
    quoi: [iQuoi, ...complementsQuoi].filter(i => i >= 0).map(i => titres[i]).join(' — '),
    ou: [iOu, ...autres].filter(i => i >= 0).map(i => titres[i]).join(' – '),
    ville: iVille >= 0 ? titres[iVille].replace(/\b\d{5}\b\s*/, '').trim() : '',
  };
}

function brouillonVersExperience(b: Brouillon): Experience {
  const { quoi, ou, ville } = repartir(b, 'experience');
  return { id: uid(), poste: quoi, entreprise: ou, ville, periode: b.periode ?? periodeVide(), puces: b.puces.map(t => puce(t)) };
}

function brouillonVersFormation(b: Brouillon): Formation {
  const { quoi, ou, ville } = repartir(b, 'formation');
  return { id: uid(), diplome: quoi, etablissement: ou, ville, periode: b.periode ?? periodeVide(), puces: b.puces.map(t => puce(t)) };
}

/** Un bloc parle-t-il d'études (diplôme, école) plutôt que d'un emploi ? */
const ressembleFormation = (b: Brouillon) =>
  b.titres.some(t => mot(MOTS_DIPLOME, t) || mot(MOTS_ECOLE, t)) && !b.titres.some(t => mot(MOTS_POSTE, t) && !mot(MOTS_DIPLOME, t));

export const versExperiences = (lignes: string[]) => decouperBlocs(lignes).map(brouillonVersExperience);
export const versFormations = (lignes: string[]) => decouperBlocs(lignes).map(brouillonVersFormation);

// ---------------------------------------------------------------------------
//  Compétences, langues, certifications, centres d'intérêt
// ---------------------------------------------------------------------------
const VARIANTES_OUTILS = SYNONYMES.filter(g => g.categorie === 'Outil').flatMap(g => g.termes.map(v => normaliser(v))).filter(v => v.length > 1);
const LOGICIELS = ['word', 'outlook', 'office', 'pack office', 'microsoft office', 'google sheets', 'canva', 'notion', 'salesforce', 'adp', 'silae', 'cegid', 'sage', 'workday', 'pennylane', 'quickbooks', 'tableau', 'jira', 'teams'];
const estOutil = (e: string) => {
  const n = normaliser(e);
  return [...VARIANTES_OUTILS, ...LOGICIELS].some(v => n === v || n.startsWith(v + ' ') || n.includes(' ' + v + ' ') || n.endsWith(' ' + v));
};

/** « Catégorie : a, b » ou « Catégorie | a, b » (tableau à deux colonnes) */
const LIGNE_GROUPE = /^([^:|]{2,35}?)\s*(?::|\s\|\s)\s*(.+)$/;
const SEPARATEURS_LISTE = /[,;|•·]/;

export function versCompetences(lignes: string[], categorieParDefaut = ''): GroupeCompetences[] {
  // 1. On regroupe le texte par catégorie (une catégorie peut s'étaler sur plusieurs lignes)
  const textesGroupes: { categorie: string; texte: string }[] = [];
  const libres: string[] = [];
  for (const brut of lignes) {
    const l = sansPuce(brut);
    const m = l.match(LIGNE_GROUPE);
    // « Communication orale : Capacité à transmettre… » : une compétence suivie de son explication
    const explication = m && nbMots(m[2]) >= 6 && (m[2].match(/,/g) ?? []).length <= 2
      && (/[.]$/.test(m[2].trim()) || (m[2].match(/\s(de|du|des|la|le|les|et|en|pour|avec|à|aux)\s/gi) ?? []).length >= 2);
    if (m && explication) libres.push(m[1].trim());
    else if (m && nbMots(m[1]) <= 5) textesGroupes.push({ categorie: m[1].trim(), texte: m[2] });
    else if (textesGroupes.length && !estPuce(brut)) textesGroupes[textesGroupes.length - 1].texte += ' ' + l;
    else libres.push(...decouperListe(l, SEPARATEURS_LISTE));
  }
  const groupes: GroupeCompetences[] = textesGroupes.map(g => ({
    id: uid(), categorie: g.categorie,
    // « intermédiaire)· HTML » : on remet une espace autour des points médians collés
    elements: decouperListe(g.texte.replace(/\s*·\s*/g, ' · '), SEPARATEURS_LISTE),
  }));
  if (libres.length && categorieParDefaut) {
    // Rubrique nommée (« Logiciels », « Langages informatiques ») : on garde son nom
    groupes.push({ id: uid(), categorie: categorieParDefaut, elements: libres });
  } else if (libres.length) {
    const outils = libres.filter(estOutil);
    const autres = libres.filter(e => !estOutil(e));
    if (autres.length) groupes.push({ id: uid(), categorie: categorieParDefaut || 'Compétences', elements: autres });
    if (outils.length) groupes.push({ id: uid(), categorie: 'Outils', elements: outils });
  }
  return groupes;
}

const NOMS_LANGUES = /\b(fran[cç]ais|anglais|espagnol|allemand|italien|portugais|chinois|mandarin|arabe|japonais|russe|n[ée]erlandais|polonais|turc|cor[ée]en|hindi|english|french|spanish|german|italian|portuguese|chinese|arabic|japanese|russian|dutch)\b/i;

/** « technique (C1 — TOEIC 890 » -> « technique, TOEIC 890 » ; un simple niveau (« Courant ») ne fait pas une précision */
function precisionLangue(reste: string): string {
  const p = reste.replace(/\b[ABC][12]\b/gi, ' ').replace(/[()]/g, ' ').replace(/\s*[—–]\s*|\s+-\s+/g, ', ')
    .replace(/\s+/g, ' ').replace(/\s+,/g, ',').replace(/(,\s*)+/g, ', ').replace(/^[\s,:;]+|[\s,:;]+$/g, '').trim();
  return /^(courant|fluent|natif|native|maternelle|langue maternelle|bilingue|bilingual|interm[ée]diaire|intermediate|notions|scolaire|avanc[ée]|advanced|professionnel|professional|lu,? [ée]crit,? parl[ée])?$/i.test(p) ? '' : p;
}

export function versLangues(lignes: string[]): Langue[] {
  const langues: Langue[] = [];
  const morceaux = lignes.flatMap(l => decouperListe(sansPuce(l), /[,;|•·]/));
  for (const m of morceaux) {
    const nom = m.match(NOMS_LANGUES);
    if (nom) {
      const reste = m.replace(nom[0], '').replace(/^[\s:–—()-]+|[\s:–—()-]+$/g, '');
      const natif = /fran[cç]ais|french/i.test(nom[0]) && !reste;
      const { niveau } = natif ? { niveau: 'natif' as const } : niveauDepuisTexte(reste ? `${reste} (${reste})` : '');
      langues.push({ id: uid(), langue: nom[0].charAt(0).toUpperCase() + nom[0].slice(1).toLowerCase(), niveau, precision: precisionLangue(reste) });
    } else if (langues.length) {
      // Ligne de niveau sous la langue (fréquent dans Canva) : « Courant », « C1 », « TOEIC 950 »
      const derniere = langues[langues.length - 1];
      const n = niveauDepuisTexte(`${m} (${m})`);
      if (/\b[ABC][12]\b|courant|fluent|bilingue|natif|maternelle|interm|notions|avanc|scolaire|professionnel/i.test(m)) derniere.niveau = n.niveau;
      if (/toeic|toefl|ielts|cambridge|\d{3}/i.test(m)) derniere.precision = m;
    }
  }
  return langues;
}

/** Toutes les façons d'écrire les certifications connues (« ccna », « security+ »…) */
const TERMES_CERTIFS = [...PARCOURS, TRANSVERSAL].flatMap(p => p.certifications.flatMap(c => c.termes)).map(normaliser).filter(t => t.length >= 3);

/** Ligne de certification (et non de diplôme) : « 2022 | Cisco Certified Network Associate (CCNA) | Cisco » */
export function estLigneCertification(ligne: string): boolean {
  const t = sansPuce(ligne);
  if (mot(MOTS_DIPLOME, t) || mot(MOTS_ECOLE, t)) return false;
  const n = ` ${normaliser(t)} `;
  return /\b(certifi|certified|certificat|mooc|badge)/i.test(t) || TERMES_CERTIFS.some(c => n.includes(` ${c} `));
}

export function versCertifications(lignes: string[]): Certification[] {
  return lignes.map(l => {
    const t = sansPuce(l);
    // Ligne de tableau « année | intitulé | organisme »
    if (/\s\|\s/.test(t)) {
      const annee = t.match(/\b(19|20)\d{2}\b/)?.[0] ?? '';
      const [intitule, ...autres] = couperHorsParentheses(t, /\s+\|\s+/g).map(x => x.trim())
        .filter(x => x && !/^\(?\s*(?:\d{1,2}[/.])?(19|20)\d{2}\s*\)?$/.test(x));
      return { id: uid(), intitule: intitule ?? t, organisme: autres.join(', '), annee };
    }
    const annee = t.match(/\b(19|20)\d{2}\b/)?.[0] ?? '';
    const [intitule, ...autres] = t.replace(annee, '').replace(/[()]/g, ' ').split(/\s+[-–—|]\s+|,\s+/).map(s => s.trim()).filter(Boolean);
    return { id: uid(), intitule: intitule ?? t, organisme: autres.join(', '), annee };
  }).filter(c => c.intitule);
}

export const versCentresInteret = (lignes: string[]) => lignes.flatMap(l => decouperListe(sansPuce(l), /[,;|•·]/));

// ---------------------------------------------------------------------------
//  Découpage complet
// ---------------------------------------------------------------------------
export interface ResultatImport {
  donnees: DonneesCV;
  aClasser: FragmentAClasser[];
  /** Nombre d'éléments trouvés par section (pour l'écran de vérification) */
  bilan: Record<CleSection, number>;
}

/** « Rythme : 3 semaines entreprise / 1 semaine école », « 4j entreprise / 1j école », « alternance 2 jours / 3 jours » */
// (« rythme » doit être suivi d'un chiffre : « travailler à un rythme soutenu » n'est pas un rythme d'alternance)
const RYTHME = /\(?\s*rythme(?:\s+d['’ ]alternance)?\s*:?[^|)\n\d]{0,40}\d[^|)\n]*\)?|\(?\d+\s*(?:j|jours?|sem\.?|semaines?|mois)\b[^/|\n]{0,30}\/\s*\d+\s*(?:j|jours?|sem\.?|semaines?|mois)\b[^|)\n]{0,30}\)?/i;

/** Qualités reconnues quand elles sont mélangées aux compétences */
const QUALITES = /^(rigueur|rigoureu|autonom|curiosit|curieu|dynami|adaptab|organis|sens de l|esprit d|travail(ler)? en [ée]quipe|leadership|cr[ée]ativit|pers[ée]v[ée]ran|ponctualit|r[ée]activit|polyvalen|relationnel|communica|empathi|motiv|proactiv|r[ée]sistance au stress|gestion du stress|s[ée]rieu|discr[ée]tion|fiabilit|patien|bienveillan|esprit critique|force de proposition|esprit de synth[èe]se|esprit d.analyse|team ?player|teamwork|attention to detail|problem solving)/i;
const estQualite = (e: string) => QUALITES.test(e.trim()) || SYNONYMES.some(g => g.categorie === 'Savoir-être' && g.termes.some(x => normaliser(e) === normaliser(x)));

/** Ligne de détail d'un rythme : « 2 jours en formation », « lundi et mardi à l'école », « 3 semaines en entreprise » */
const LIGNE_RYTHME = /\d+\s*(?:j|jours?|sem\.?|semaines?|mois)\b|lundi|mardi|mercredi|jeudi|vendredi|en (?:formation|entreprise|[ée]cole|cours)/i;

const SECTION_SUGGEREE: Record<string, CleSection | null> = {
  projets: 'experiences', projects: 'experiences', benevolat: 'experiences', volunteer: 'experiences', volunteering: 'experiences',
  activites: 'experiences', 'vie associative': 'experiences', engagements: 'experiences', associatif: 'experiences', leadership: 'experiences',
};

export function decouperCv(lignesBrutes: LigneImportee[]): ResultatImport {
  const toutesLignes = recollerParagraphes(lignesBrutes);
  // Rythme d'alternance : où qu'il soit dans le CV, il va dans le Profil
  // (si la ligne contient autre chose, ex. le titre « Analyste en alternance – rythme 3j/2j », on garde le reste)
  let rythmeAlternance = '';
  let attenteRythme = 0;
  const lignes: LigneImportee[] = [];
  for (const l of toutesLignes) {
    // Lignes qui suivent un titre « RYTHME D'ALTERNANCE » seul : « 2 jours en formation », « 3 jours en entreprise »
    // (on regarde les 4 lignes suivantes : une autre information peut s'intercaler, ex. « Née le… »)
    if (attenteRythme > 0) {
      attenteRythme--;
      if (LIGNE_RYTHME.test(l.texte) && l.texte.length <= 80 && !NAISSANCE.test(l.texte)) {
        rythmeAlternance = [rythmeAlternance, sansPuce(l.texte).replace(/[\s.,;]+$/, '')].filter(Boolean).join(' / ');
        continue;
      }
    }
    // Une ligne qui commence par « Rythme » : toute la ligne est le rythme
    if (!rythmeAlternance && /^\W*rythme\b/i.test(l.texte)) {
      rythmeAlternance = l.texte.replace(/^[(\s•]*rythme(?:\s+d['’ ]alternance)?\s*[:-]?\s*/i, '').replace(/\s+\|\s+/g, ' · ').replace(/[\s.,;]+$/, '').trim();
      if (!rythmeAlternance) attenteRythme = 4; // titre seul : le rythme est sur les lignes suivantes
      continue;
    }
    // Titre « RYTHME D'ALTERNANCE » collé à une autre information sur la même ligne (« titre | RYTHME… »)
    const finRythme = l.texte.match(/\s*\|\s*rythme(?:\s+d['’ ]alternance)?\s*:?\s*$/i);
    if (!rythmeAlternance && finRythme) {
      attenteRythme = 4;
      lignes.push({ ...l, texte: l.texte.slice(0, finRythme.index).trim() });
      continue;
    }
    const m = !rythmeAlternance && l.texte.length <= 160 ? l.texte.match(RYTHME) : null;
    if (!m) { lignes.push(l); continue; }
    rythmeAlternance = m[0].replace(/^[(\s•]*rythme(?:\s+d['’ ]alternance)?\s*[:-]?\s*/i, '').replace(/^[(\s]+|[)\s.,;–-]+$/g, '').trim();
    const reste = l.texte.replace(m[0], ' ').replace(/[\s(),;:|–-]+$/g, '').replace(/^[\s(),;:|–-]+/g, '').trim();
    if (reste.replace(/[^A-Za-zÀ-ÿ]/g, '').length >= 3 && reste !== '•') lignes.push({ ...l, texte: reste });
  }
  const mediane = tailleMediane(lignes);
  // 1. Répartition des lignes par section
  // Titre de section inconnu (« MON CHEMIN »…) : court, en MAJUSCULES, plus gros que le texte courant
  const titreInconnu = (l: LigneImportee) => l.texte.length <= 40 && !/\d/.test(l.texte) && !estPuce(l.texte)
    && l.texte === l.texte.toUpperCase() && /[A-Z]/.test(l.texte) && l.taille >= mediane * 1.1;
  const blocs: { cle: CleImport | 'entete' | 'inconnu'; titre: string; lignes: LigneImportee[] }[] = [{ cle: 'entete', titre: '', lignes: [] }];
  let zonePrecedente = lignes[0]?.zone;
  for (const l of lignes) {
    const titre = detecterTitre(l, mediane);
    if (titre) { blocs.push({ cle: titre, titre: l.texte, lignes: [] }); zonePrecedente = l.zone; continue; }
    // Titre et contenu sur la même ligne : « ATOUTS Analyse · Rigueur », « CENTRES D'INTÉRÊT Lecture »
    const enLigne = titreEnDebutDeLigne(l, mediane);
    if (enLigne) {
      blocs.push({ cle: enLigne.cle, titre: enLigne.titre, lignes: [{ ...l, texte: enLigne.reste }] });
      zonePrecedente = l.zone;
      continue;
    }
    // Passage de la colonne de gauche à celle de droite : le haut de la nouvelle colonne
    // (souvent le nom et le titre dans Canva) n'appartient pas à la section précédente
    if (l.zone !== zonePrecedente && l.zone !== 'pleine') blocs.push({ cle: 'entete', titre: '', lignes: [] });
    zonePrecedente = l.zone;
    // Un titre inconnu après une section ferme cette section (sinon tout ce qui suit y serait aspiré)
    if (blocs[blocs.length - 1].cle !== 'entete' && titreInconnu(l)) { blocs.push({ cle: 'inconnu', titre: l.texte, lignes: [] }); continue; }
    blocs[blocs.length - 1].lignes.push(l);
  }
  // Sécurité : un « titre » sans aucune ligne n'en était sans doute pas un -> on le garde comme texte
  for (let i = blocs.length - 1; i > 0; i--) {
    if (blocs[i].cle !== 'entete' && !blocs[i].lignes.length) {
      blocs[i - 1].lignes.push({ texte: blocs[i].titre, taille: mediane, zone: 'pleine' });
      blocs.splice(i, 1);
    }
  }
  const textes = (cle: CleImport | 'entete' | 'inconnu') => blocs.filter(b => b.cle === cle).flatMap(b => b.lignes.map(l => l.texte));

  // 2. En-tête : nom, titre, coordonnées
  const coord: Coordonnees = { email: '', telephone: '', ville: '', linkedin: '', site: '', dateNaissance: '' };
  const lignesEntete = joindreChampsEntete(recollerAdresses(blocs.filter(b => b.cle === 'entete').flatMap(b => b.lignes)));
  const restesEntete: LigneImportee[] = [];
  const languesEntete: Langue[] = [];
  const infosDiverses: string[] = [];
  // CV anonymisé (« CANDIDATURE ANONYMISÉE — RÉF. … ») : il n'y a pas de nom à chercher
  let anonyme = false;
  for (const l of [...lignesEntete, ...joindreChampsEntete(recollerAdresses(blocs.filter(b => b.cle === 'contact').flatMap(b => b.lignes)))]) {
    if (ANONYME.test(l.texte)) { anonyme = true; if (l.texte.length <= 120 && !/\s\|\s/.test(l.texte)) continue; }
    // Champs étiquetés : « Localisation : Lyon | Disponibilité : … | Langues : Français (natif), Anglais (C1) »
    const champs = couperHorsParentheses(sansPuce(l.texte), /\s+\|\s+/g).filter(champ => {
      const lieu = champ.match(/^\s*(?:localisation|lieu(?: de r[ée]sidence)?|ville|adresse|location|r[ée]sidence|based in|domicile)\s*:\s*(.+)$/i);
      if (lieu) { if (!coord.ville) coord.ville = lieu[1].trim(); return false; }
      const langues = champ.match(/^\s*(?:langues?|languages?)\s*:\s*(.+)$/i);
      if (langues) { languesEntete.push(...versLangues([langues[1]])); return false; }
      // Disponibilité, mobilité, référence de candidature… : à classer par l'utilisatrice
      if (/^\s*(disponibilit|mobilit|permis|contact r[ée]f|r[ée]f[ée]rence|r[ée]f\.|pr[ée]avis|pr[ée]tentions|salaire|t[ée]l[ée]travail|nationalit|statut)/i.test(champ)) { infosDiverses.push(champ.trim()); return false; }
      return true;
    });
    if (!champs.length) continue;
    const reste = extraireCoordonnees(champs.join(' | '), coord);
    // les restes très courts (« in », « @ »…) viennent d'icônes : on les ignore
    // (une puce reste une puce : elle décrit sans doute une expérience)
    if (reste && reste.replace(/[^A-Za-zÀ-ÿ0-9]/g, '').length > 2) restesEntete.push({ ...l, texte: estPuce(l.texte) ? '• ' + reste : reste });
  }
  const lettresSeules = (t: string) => /^[A-Za-zÀ-ÿ' -]{2,40}$/.test(t.trim());
  const ressembleNom = (t: string) => lettresSeules(t) && nbMots(t) >= 2 && nbMots(t) <= 4;

  // Prénom et nom sur deux lignes (fréquent dans Canva) : « Camille » puis « MARTIN » en gros caractères.
  // On cherche deux lignes consécutives, courtes, en lettres seules, écrites dans la plus grande taille.
  const tailleMax = Math.max(...restesEntete.map(l => l.taille), 0);
  const memeLigneNom = (a: LigneImportee, b: LigneImportee) => {
    // un seul mot puis 1 à 3 mots (« Marie-Anne » / « DE LA FONTAINE »), et aucun mot de métier
    if (!lettresSeules(a.texte) || !lettresSeules(b.texte) || nbMots(a.texte) !== 1 || nbMots(b.texte) > 3) return false;
    if (mot(MOTS_POSTE, a.texte) || mot(MOTS_POSTE, b.texte) || detecterTitre(b)) return false;
    const grands = a.taille >= tailleMax * 0.85 && b.taille >= tailleMax * 0.85 && tailleMax >= mediane * 1.3;
    // Sans tailles (texte collé) : un mot puis un mot en MAJUSCULES, tout en haut
    const majuscules = (t: string) => t === t.toUpperCase();
    const sansTaille = nbMots(b.texte) === 1 && (majuscules(a.texte) || majuscules(b.texte));
    return grands || sansTaille;
  };
  let ligneNom: LigneImportee | undefined;
  const lignesDuNom: LigneImportee[] = [];
  for (let i = 0; i < restesEntete.length - 1 && !ligneNom && !anonyme; i++) {
    const [a, b] = [restesEntete[i], restesEntete[i + 1]];
    const enHaut = a.taille >= tailleMax * 0.85 || i === 0;
    if (enHaut && memeLigneNom(a, b)) {
      lignesDuNom.push(a, b);
      ligneNom = { ...a, texte: `${a.texte.trim()} ${b.texte.trim()}`, taille: Math.max(a.taille, b.taille) };
    }
  }
  if (!ligneNom && !anonyme) {
    ligneNom = [...restesEntete.filter(l => ressembleNom(l.texte))].sort((x, y) => y.taille - x.taille)[0] ?? restesEntete[0];
    if (ligneNom) lignesDuNom.push(ligneNom);
  }
  const [prenom, nom] = ligneNom ? separerNom(ligneNom.texte) : ['', ''];
  const autres = restesEntete.filter(l => !lignesDuNom.includes(l));
  const premiereTitre = autres.find(l => l.texte.length <= 90 && !estPuce(l.texte) && !/[.!]$/.test(l.texte) && !extraireDates(l.texte));
  // Titre écrit sur deux lignes (« Analyste financière » / « en alternance ») : on recolle la suite
  const lignesDuTitre: LigneImportee[] = premiereTitre ? [premiereTitre] : [];
  if (premiereTitre) {
    const suite = autres[autres.indexOf(premiereTitre) + 1];
    const memeStyle = suite && Math.abs(suite.taille - premiereTitre.taille) < 0.6 && premiereTitre.taille >= mediane * 1.05;
    const continue_ = suite && (/^[a-zà-ÿ&(–-]/.test(suite.texte) || /\b(de|du|des|en|et|&|à|au|aux|-|–|,)$/i.test(premiereTitre.texte));
    if (suite && (memeStyle || continue_) && !estPuce(suite.texte) && !extraireDates(suite.texte) && suite.texte.length <= 60
      && !detecterTitre(suite, mediane) && !ressembleDescription(suite.texte) && (premiereTitre.texte + suite.texte).length <= 110) {
      lignesDuTitre.push(suite);
    }
  }
  const ligneTitre = premiereTitre && { ...premiereTitre, texte: lignesDuTitre.map(l => l.texte.trim()).join(' ').replace(/\s+([–-])\s*$/, '') };
  const restants = autres.filter(l => !lignesDuTitre.includes(l));
  // Sous-titre « 5 ans d'expérience — Infrastructures critiques, … » : il ouvre l'accroche
  const sousTitre = restants.find(l => ANNEES_EXPERIENCE.test(l.texte) && l.texte.length <= 160 && !extraireDates(l.texte));
  if (sousTitre) restants.splice(restants.indexOf(sousTitre), 1);

  // Lignes sans section reconnue (titres de section non détectés…) : on devine ce qu'on peut.
  //  - un bloc avec des dates = une expérience ou une formation (selon son contenu)
  //  - un paragraphe seul au début = l'accroche
  //  - le reste part dans « À classer »
  const accrocheEntete: string[] = [];
  const nonClasses: string[] = [];
  const devineesExp: Experience[] = [];
  const devineesForm: Formation[] = [];
  /** Range ce qui peut l'être ; renvoie les lignes restantes */
  const deviner = (textesBloc: string[], accrochePossible: boolean): string[] => {
    const restes: string[] = [];
    decouperBlocs(textesBloc).forEach((b, i) => {
      if (b.periode && b.titres.length) (ressembleFormation(b) ? devineesForm.push(brouillonVersFormation(b)) : devineesExp.push(brouillonVersExperience(b)));
      else if (accrochePossible && i === 0 && !b.titres.length && b.puces.join(' ').length > 80) accrocheEntete.push(...b.puces);
      else restes.push(...b.titres, ...b.puces.map(t => '• ' + t));
    });
    return restes;
  };
  // En-tête : un titre inconnu coupe les blocs
  const groupes: string[][] = [[]];
  for (const l of restants) {
    if (titreInconnu(l)) { nonClasses.push(l.texte); groupes.push([]); }
    else groupes[groupes.length - 1].push(l.texte);
  }
  groupes.forEach((g, i) => nonClasses.push(...deviner(g, i === 0)));
  nonClasses.push(...infosDiverses);
  // Sections au titre inconnu : on devine, le reste va dans « À classer » avec son titre
  const fragmentsInconnus = blocs.filter(b => b.cle === 'inconnu').map(b => ({ titre: b.titre, restes: deviner(b.lignes.map(l => l.texte), false) }));

  // Compétences : les qualités (« Rigueur », « Esprit d'équipe »…) partent dans Savoir-être,
  // une ligne « Langues | Anglais B2 · Chinois A1 » part dans Langues
  const qualites = versCentresInteret(textes('qualites'));
  const languesDesCompetences: Langue[] = [];
  // Chaque rubrique de compétences garde son nom (« LOGICIELS » -> groupe « Logiciels »), sauf les titres génériques
  const categorieDepuisTitre = (t: string) => {
    const n = normaliser(t);
    if (!n || /^(mes )?(competences?|skills|hard skills|key skills|technical skills|competences (techniques|cles))$/.test(n)) return '';
    const propre = sansPuce(t).replace(/[:\s]+$/, '').trim().toLowerCase();
    return propre.charAt(0).toUpperCase() + propre.slice(1);
  };
  const competencesSansQualites = blocs.filter(b => b.cle === 'competences')
    .flatMap(b => versCompetences(b.lignes.map(l => l.texte), categorieDepuisTitre(b.titre))).filter(g => {
    if (!/^(langues?|languages?)$/i.test(g.categorie.trim())) return true;
    languesDesCompetences.push(...versLangues(g.elements));
    return false;
  }).map(g => {
    qualites.push(...g.elements.filter(estQualite));
    return { ...g, elements: g.elements.filter(e => !estQualite(e)) };
  }).filter(g => g.elements.length);

  // Deux rubriques voisines au même nom sont fusionnées
  const competencesFusionnees: GroupeCompetences[] = [];
  for (const g of competencesSansQualites) {
    const meme = competencesFusionnees.find(x => x.categorie.toLowerCase() === g.categorie.toLowerCase());
    if (meme) meme.elements.push(...g.elements.filter(e => !meme.elements.includes(e)));
    else competencesFusionnees.push(g);
  }

  // Section « Formation & Certifications » : les certifications vont dans Certifications
  const certifsDeFormation: Certification[] = [];
  const formationsSansCertifs = textes('formations').filter(l => {
    if (!estLigneCertification(l)) return true;
    certifsDeFormation.push(...versCertifications([l]));
    return false;
  });

  const donnees: DonneesCV = {
    infosPerso: { prenom, nom, titre: ligneTitre?.texte ?? '', ...coord, photo: null },
    accroche: [...(sousTitre ? [sousTitre.texte.replace(/[\s.]*$/, '.')] : []), ...textes('accroche'), ...accrocheEntete]
      .map(sansPuce).join(' ').replace(/\s+/g, ' ').trim(),
    rythmeAlternance,
    qualites: [...new Set(qualites)],
    experiences: [...versExperiences(textes('experiences')), ...devineesExp],
    formations: [...versFormations(formationsSansCertifs), ...devineesForm],
    competences: competencesFusionnees,
    langues: [...versLangues(textes('langues')), ...languesDesCompetences, ...languesEntete],
    certifications: [...versCertifications(textes('certifications')), ...certifsDeFormation],
    centresInteret: versCentresInteret(textes('centresInteret')),
  };

  // 3. Ce qui reste : « À classer »
  const aClasser: FragmentAClasser[] = [];
  if (nonClasses.length) aClasser.push({ id: uid(), texte: nonClasses.join('\n'), sectionDetectee: null });
  for (const f of fragmentsInconnus.filter(x => x.restes.length)) {
    aClasser.push({ id: uid(), texte: [f.titre, ...f.restes].join('\n'), sectionDetectee: null });
  }
  for (const b of blocs.filter(x => x.cle === 'autre' && x.lignes.length)) {
    aClasser.push({ id: uid(), texte: [b.titre, ...b.lignes.map(l => l.texte)].join('\n'), sectionDetectee: SECTION_SUGGEREE[normaliser(b.titre)] ?? null });
  }

  return { donnees, aClasser, bilan: calculerBilan(donnees) };
}

/** Nombre d'éléments par section */
export function calculerBilan(donnees: DonneesCV): Record<CleSection, number> {
  return {
    accroche: donnees.accroche ? 1 : 0,
    experiences: donnees.experiences.length,
    formations: donnees.formations.length,
    competences: donnees.competences.reduce((n, g) => n + g.elements.length, 0),
    qualites: donnees.qualites.length,
    langues: donnees.langues.length,
    certifications: donnees.certifications.length,
    centresInteret: donnees.centresInteret.length,
  };
}

/** Une adresse (LinkedIn, site, email) coupée en fin de ligne est recollée avec la ligne suivante */
function recollerAdresses(lignes: LigneImportee[]): LigneImportee[] {
  const out: LigneImportee[] = [];
  for (const l of lignes) {
    const prec = out[out.length - 1];
    if (prec && /(linkedin\.com|https?:|www\.|@)\S*[-/._]$/i.test(prec.texte) && /^[\w./-]+$/.test(l.texte)) {
      out[out.length - 1] = { ...prec, texte: prec.texte + l.texte };
    } else out.push(l);
  }
  return out;
}

/**
 * Recolle les lignes d'un même paragraphe coupé par la mise en page :
 * une ligne longue sans ponctuation finale, suivie d'une ligne qui commence par une minuscule.
 */
export function recollerParagraphes(lignes: LigneImportee[]): LigneImportee[] {
  const out: LigneImportee[] = [];
  for (const l of lignes) {
    const prec = out[out.length - 1];
    const suite = prec && prec.zone === l.zone && prec.texte.length >= 50 && !/[.!?:]$/.test(prec.texte)
      && /^[a-zà-ÿ]/.test(l.texte) && !estPuce(l.texte) && Math.abs(prec.taille - l.taille) < 1.5
      // une ligne de coordonnées (email, site, « a | b ») n'est pas une suite de paragraphe
      && !/@|https?:|www\.|\s\|\s/.test(l.texte);
    // Parenthèse ouverte non refermée : la ligne suivante en fait partie
    const parentheseOuverte = prec && prec.zone === l.zone && (prec.texte.match(/\(/g) ?? []).length > (prec.texte.match(/\)/g) ?? []).length
      && !estPuce(l.texte) && Math.abs(prec.taille - l.taille) < 1.5 && prec.texte.length + l.texte.length < 300;
    if (suite || parentheseOuverte) out[out.length - 1] = { ...prec, texte: `${prec.texte} ${l.texte}` };
    else out.push(l);
  }
  return out;
}

/** « CANDIDATURE ANONYMISÉE », « CV anonyme », « Anonymous résumé » */
const ANONYME = /\b(anonymi[sz][ée]e?s?|cv anonyme|candidature anonyme|anonymous)\b/i;
/** « 5 ans d'expérience », « 10+ years of experience » */
const ANNEES_EXPERIENCE = /^\W*\d+\s*\+?\s*(?:ans?\s+d['’ ]\s*exp[ée]riences?|years?\s+(?:of\s+)?experience)/i;

/**
 * Lignes de champs étiquetés coupées par la mise en page :
 * « Langues : Français » puis « (natif), Anglais (C1) | Contact : … » -> une seule ligne
 */
function joindreChampsEntete(lignes: LigneImportee[]): LigneImportee[] {
  const out: LigneImportee[] = [];
  for (const l of lignes) {
    const prec = out[out.length - 1];
    if (prec && /\s\|\s|^[^:]{3,30}\s:\s/.test(prec.texte) && /^[(a-zà-ÿ,]/.test(l.texte.trim()) && !estPuce(l.texte)) {
      out[out.length - 1] = { ...prec, texte: `${prec.texte} ${l.texte.trim()}` };
    } else out.push(l);
  }
  return out;
}

/** « ATOUTS Analyse · Rigueur » -> titre « ATOUTS », section Savoir-être, reste « Analyse · Rigueur » */
function titreEnDebutDeLigne(l: LigneImportee, mediane: number): { cle: CleImport; titre: string; reste: string } | null {
  const m = l.texte.match(/^([A-ZÀ-Ý][A-ZÀ-Ý'’&\- ]{2,38}[A-ZÀ-Ý])\s*[:|]?\s+(.+)$/);
  if (!m || !/[a-zà-ÿ]/.test(m[2].slice(0, 20))) return null;
  // le titre peut avoir avalé le premier mot en majuscules du contenu (« CENTRES D'INTÉRÊT DIY(…) ») : on essaie de raccourcir
  const mots = m[1].split(' ');
  for (let n = mots.length; n >= 1; n--) {
    const titre = mots.slice(0, n).join(' ');
    const cle = detecterTitre({ ...l, texte: titre }, mediane);
    if (cle && cle !== 'contact') return { cle, titre, reste: [...mots.slice(n), m[2]].join(' ').trim() };
  }
  return null;
}

/** « Camille MARTIN » -> ['Camille', 'MARTIN'] ; « MARTIN Camille » -> ['Camille', 'MARTIN'] */
export function separerNom(texte: string): [string, string] {
  const mots = texte.trim().split(/\s+/);
  const majuscule = (m: string) => m.length > 1 && m === m.toUpperCase() && /[A-ZÀ-Ý]/.test(m);
  const tousMaj = mots.every(majuscule);
  if (!tousMaj) {
    const i = mots.findIndex(majuscule);
    if (i > 0) return [mots.slice(0, i).join(' '), mots.slice(i).join(' ')];
    if (i === 0) {
      const j = mots.findIndex(m => !majuscule(m));
      if (j > 0) return [mots.slice(j).join(' '), mots.slice(0, j).join(' ')];
    }
  }
  const cap = (m: string) => (tousMaj ? m.charAt(0) + m.slice(1).toLowerCase() : m);
  return [cap(mots[0] ?? ''), mots.slice(1).join(' ')];
}
