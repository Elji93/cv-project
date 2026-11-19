// ============================================================================
//  Analyseur ATS — grille inspirée des recommandations APEC (sur 100)
//  Titre (20) · Mots-clés & hard skills (40) · Expériences & impact chiffré (25) · Conformité (15)
//  Un terme français et son équivalent anglais comptent comme le même mot-clé.
// ============================================================================
import type { CV, EquivalencePerso } from '../../types';
import { INTITULES_POSTES, type CategorieMotCle } from '../../data/synonymes';
import { MOTS_VIDES } from '../../data/motsVides';
import { VERBES_ACTION_EN, VERBES_ACTION_FR } from '../../data/verbesAction';
import { NIVEAUX_CECRL } from '../../data/constantes';
import { affichees, nomComplet, titreSection, infosVisibles } from '../cv';
import { formaterPeriode } from '../dates';
import { contient, detecterLangue, mots, normaliser, sansAccents } from './normalisation';
import { dictionnaire, extraireMotsCles, type Priorite } from './extraction';
import { genererConseils } from './conseils';

const rempli = (s?: string) => !!s && s.trim().length > 0;

// ---------------------------------------------------------------------------
//  Types de résultat
// ---------------------------------------------------------------------------
export interface MotCleResultat {
  libelle: string;
  categorie: CategorieMotCle | 'Offre';
  /** Terme tel qu'écrit dans l'offre */
  termeOffre: string;
  /** Terme retrouvé dans le CV (peut être un synonyme, ex. « modélisation financière » pour « financial modeling ») */
  termeCv: string;
  viaSynonyme: boolean;
  /** fort = titre / accroche / compétences ; experience = seulement expériences / formation ; absent */
  ou: 'fort' | 'experience' | 'absent';
  priorite: Priorite;
  poids: number;
  /** Toutes les façons d'écrire ce mot-clé (FR, EN, acronymes) */
  termes: string[];
}
export interface Verification { libelle: string; ok: boolean }
export interface Critere { id: 'titre' | 'motsCles' | 'impact' | 'conformite'; libelle: string; max: number; score: number; verifications: Verification[] }
export interface Conseil { priorite: 'haute' | 'moyenne' | 'basse'; texte: string }
export interface ResultatAts {
  total: number;
  intitule: string;
  langueOffre: 'fr' | 'en';
  criteres: Critere[];
  motsCles: MotCleResultat[];
  conseils: Conseil[];
}

// ---------------------------------------------------------------------------
//  Intitulé du poste
// ---------------------------------------------------------------------------
const CONTRAT_OU_LIEU = /^(cdi|cdd|stage|alternance|apprentissage|apprenticeship|work[- ]study|internship|graduate program(me)?|freelance|int[ée]rim|v\.?i\.?e|temps (plein|partiel)|full[- ]time|part[- ]time|\d+\s*(mois|months?|ans|years?)|(stage|cdd|internship)\s+(de\s+)?\d+\s*(mois|months?)|paris|lyon|marseille|lille|bordeaux|toulouse|nantes|nice|strasbourg|london|londres|luxembourg|gen[eè]ve|bruxelles|brussels|la d[ée]fense|[ée]le-de-france|france|remote|t[ée]l[ée]travail|hybride?)$/i;

/** Devine l'intitulé du poste : la première ligne courte qui ressemble à un métier */
export function devinerIntitule(offre: string) {
  const lignes = offre.split('\n').map(l => l.trim()).filter(Boolean);
  const cand = lignes.find(l => l.length < 100 && /(analyst|analyste|associate|stagiaire|stage|intern|contr[ôo]leu|audit|charg[ée]|manager|gestionnaire|consultant|trader|comptable|accountant|tr[ée]sor|treasury|risk|risque|cr[ée]dit|financ|paie|payroll|sirh|hris|rh\b|hr\b|recruit|officer|specialist)/i.test(l));
  return (cand || lignes[0] || '')
    .replace(/\(?\s*\b(h\/f|f\/h|m\/f|f\/m|m\/w|w\/m)\b\s*\)?/gi, ' ')
    .replace(/\(\s*\)/g, '').replace(/^(intitul[ée] du poste|poste|job title|position)\s*:\s*/i, '')
    .replace(/\s{2,}/g, ' ').trim()
    .split(/\s+[-–—|]\s+|\s*\|\s*/)
    .filter((seg, i) => i === 0 || !CONTRAT_OU_LIEU.test(seg.trim()))
    .join(' – ').trim();
}

const MOTS_GENERIQUES_TITRE = new Set(['h/f', 'f/h', 'cdi', 'cdd', 'temps', 'plein', 'poste', 'offre', 'emploi', 'mois', 'month', 'paris']);

/**
 * Adéquation du titre : exacte (20), synonyme FR/EN ou correspondance partielle (10 à 15), absente (0).
 */
function noterTitre(titreCv: string, intitule: string, perso: EquivalencePerso[]): { score: number; nature: 'exact' | 'synonyme' | 'partiel' | 'absent' | 'manquant'; ratio: number } {
  if (!rempli(titreCv)) return { score: 0, nature: 'manquant', ratio: 0 };
  const cvN = normaliser(titreCv), offreN = normaliser(intitule);
  const motsOffre = mots(intitule).filter(m => !MOTS_VIDES.has(m) && !MOTS_GENERIQUES_TITRE.has(m) && m.length > 1);
  if (!motsOffre.length) return { score: 10, nature: 'partiel', ratio: 0 };
  // 1. Exact : l'intitulé de l'offre figure tel quel dans le titre du CV (ou l'inverse)
  if (contient(cvN, motsOffre.join(' ')) || contient(offreN, mots(titreCv).join(' '))) return { score: 20, nature: 'exact', ratio: 1 };
  // 2. Synonyme : les deux titres désignent le même métier (« M&A Analyst » = « Analyste fusions-acquisitions »)
  const metiers = INTITULES_POSTES.filter(g => g.termes.some(t => mots(t).length >= 2 || t.length > 4));
  const metierOffre = metiers.filter(g => g.termes.some(t => contient(offreN, t)));
  const metierCv = metiers.filter(g => g.termes.some(t => contient(cvN, t)));
  const metierCommun = metierOffre.some(g => metierCv.includes(g) && !/junior|senior|stagiaire|responsable/i.test(g.libelle));
  // 3. Partiel : part des mots de l'intitulé retrouvés (directement ou via le dictionnaire FR ↔ EN)
  const groupes = [...dictionnaire(perso).map(g => g.termes), ...INTITULES_POSTES.map(g => g.termes)];
  const retrouve = (m: string) => contient(cvN, m) || groupes.some(g => g.some(t => mots(t).join(' ') === m) && g.some(t => contient(cvN, t)));
  const ratio = motsOffre.filter(retrouve).length / motsOffre.length;
  if (metierCommun) return { score: 15, nature: 'synonyme', ratio: Math.max(ratio, 0.8) };
  if (ratio === 0) return { score: 0, nature: 'absent', ratio };
  return { score: Math.min(15, Math.round(10 + 5 * ratio)), nature: 'partiel', ratio };
}

// ---------------------------------------------------------------------------
//  Texte brut du CV (prompt IA, conformité)
// ---------------------------------------------------------------------------
export function texteBrutCv(cv: CV) {
  // (coordonnées masquées : absentes du CV, donc absentes pour les ATS)
  const d = cv.donnees, p = infosVisibles(cv);
  const out: string[] = [nomComplet(cv), p.titre, [p.email, p.telephone, p.ville, p.linkedin, p.site, p.dateNaissance].filter(rempli).join(' | ')];
  cv.ordreSections.filter(k => !cv.sectionsMasquees.includes(k)).forEach(cle => {
    const sec: string[] = [];
    if (cle === 'accroche' && rempli(d.accroche)) sec.push(d.accroche);
    if (cle === 'accroche' && rempli(d.rythmeAlternance)) sec.push("Rythme d'alternance : " + d.rythmeAlternance);
    if (cle === 'qualites' && d.qualites.length) sec.push(d.qualites.join(', '));
    if (cle === 'experiences') affichees(d.experiences).forEach(e => {
      sec.push([e.entreprise, e.poste, e.ville, formaterPeriode(e.periode, cv.langue)].filter(rempli).join(' | '));
      e.puces.filter(x => rempli(x.texte)).forEach(x => sec.push('- ' + x.texte));
    });
    if (cle === 'formations') affichees(d.formations).forEach(f => {
      sec.push([f.etablissement, f.diplome, f.ville, formaterPeriode(f.periode, cv.langue)].filter(rempli).join(' | '));
      f.puces.filter(x => rempli(x.texte)).forEach(x => sec.push('- ' + x.texte));
    });
    if (cle === 'competences') affichees(d.competences).filter(g => g.elements.length).forEach(g => sec.push((rempli(g.categorie) ? g.categorie + ' : ' : '') + g.elements.join(', ')));
    if (cle === 'langues') affichees(d.langues).filter(l => rempli(l.langue)).forEach(l => sec.push(`${l.langue} : ${NIVEAUX_CECRL.find(n => n.id === l.niveau)?.fr ?? l.niveau}${rempli(l.precision) ? ' — ' + l.precision : ''}`));
    if (cle === 'certifications') affichees(d.certifications).filter(c => rempli(c.intitule)).forEach(c => sec.push([c.intitule, c.organisme, c.annee].filter(rempli).join(', ')));
    if (cle === 'centresInteret' && d.centresInteret.length) sec.push(d.centresInteret.join(', '));
    if (sec.length) out.push('', titreSection(cv, cle).toUpperCase(), ...sec);
  });
  return out.join('\n');
}

// ---------------------------------------------------------------------------
//  Outils
// ---------------------------------------------------------------------------
/** Émojis, pictogrammes, flèches, formes, icônes de polices : illisibles pour certains ATS */
const CARACTERES_SPECIAUX = /[\u{2190}-\u{21FF}\u{2580}-\u{27BF}\u{2B00}-\u{2BFF}\u{E000}-\u{F8FF}\u{1F000}-\u{1FAFF}]/gu;
/** Résultat chiffré : €, k€, M€, %, volumes, délais… */
export const CHIFFRE = /(\d[\d\s.,]*\s?(%|€|k€|m€|md€|keur|meur|k\b|m\b|mds?\b|millions?|milliards?|x\b|fois|mois|semaines?|jours?|ans|heures?|h\b|clients?|dossiers?|missions?|personnes?|collaborateurs?|deals?|transactions?|entit[ée]s|soci[ée]t[ée]s|participations?|salari[ée]s|bulletins?|factures?|bps|pb|pts?|days?|weeks?|months?|people|users?)|[$£€]\s?\d|\d+\s?[-–]\s?\d+|\b\d{2,}\b)/i;

const VERBES = new Set([...VERBES_ACTION_FR, ...VERBES_ACTION_EN]);

/** La puce commence-t-elle par un verbe d'action (français ou anglais) ? */
export function commenceParVerbe(puce: string): boolean {
  const premier = puce.trim().split(/\s+/)[0] ?? '';
  const n = sansAccents(premier.toLowerCase()).replace(/[^a-z]/g, '');
  if (VERBES.has(n) || VERBES.has(n.replace(/e?s$/, '')) || VERBES.has(n.replace(/e$/, ''))) return true;
  if (/^(mis|mise|mises)$/.test(n)) return true;
  // participe passé français (Audité, Réalisée) ou passé anglais (Managed, Built)
  return (/[ée]e?s?$/.test(premier) && premier.length > 4 && /^[A-ZÀ-Ý]/.test(premier)) || /^[A-Z][a-z]{2,}ed$/.test(premier);
}

const POIDS_CATEGORIE: Record<CategorieMotCle | 'Offre', number> = {
  Domaine: 1, Technique: 1.2, Outil: 1.2, Certification: 0.8, Langue: 0.9, 'Savoir-être': 0.4, Offre: 0.5,
};
/** Les mots-clés exigés pèsent double ; les « un plus » un peu moins */
const POIDS_PRIORITE: Record<Priorite, number> = { obligatoire: 2, normal: 1, souhaite: 0.6 };

// ---------------------------------------------------------------------------
//  Analyse
// ---------------------------------------------------------------------------
export function analyserCv(cv: CV, offre: string, intituleSaisi: string, tientSurUnePage: boolean, perso: EquivalencePerso[] = []): ResultatAts {
  // (coordonnées masquées : absentes du CV, donc absentes pour les ATS)
  const d = cv.donnees, p = infosVisibles(cv);
  const visible = (k: Parameters<typeof titreSection>[1]) => !cv.sectionsMasquees.includes(k);
  const langueOffre = detecterLangue(offre);

  // Zones du CV : « fort » (titre, accroche, compétences…) et « expériences » (expériences, formation)
  const zoneForte = normaliser([
    p.titre,
    visible('accroche') ? `${d.accroche} ${d.rythmeAlternance}` : '',
    visible('competences') ? affichees(d.competences).map(g => `${g.categorie} , ${g.elements.join(' , ')}`).join(' , ') : '',
    visible('qualites') ? d.qualites.join(' , ') : '',
    visible('certifications') ? affichees(d.certifications).map(c => `${c.intitule} ${c.organisme}`).join(' , ') : '',
    visible('langues') ? affichees(d.langues).map(l => `${l.langue} ${NIVEAUX_CECRL.find(n => n.id === l.niveau)?.fr ?? ''} ${NIVEAUX_CECRL.find(n => n.id === l.niveau)?.en ?? ''} ${l.niveau} ${l.precision}`).join(' , ') : '',
  ].join(' , '));
  const zoneExperiences = normaliser([
    visible('experiences') ? affichees(d.experiences).map(e => [e.poste, e.entreprise, ...e.puces.map(x => x.texte)].join(' , ')).join(' , ') : '',
    visible('formations') ? affichees(d.formations).map(f => [f.diplome, f.etablissement, ...f.puces.map(x => x.texte)].join(' , ')).join(' , ') : '',
    visible('centresInteret') ? d.centresInteret.join(' , ') : '',
  ].join(' , '));
  const experiencesSeules = normaliser(visible('experiences') ? affichees(d.experiences).map(e => [e.poste, ...e.puces.map(x => x.texte)].join(' , ')).join(' , ') : '');

  // ===== 1. Titre (20) =====
  const intitule = (intituleSaisi.trim() || devinerIntitule(offre)).trim();
  const titre = noterTitre(p.titre, intitule, perso);

  // ===== 2. Mots-clés (40) =====
  const motsCles: MotCleResultat[] = extraireMotsCles(offre, perso).map(k => {
    // on cherche d'abord le terme de l'offre lui-même, puis ses synonymes
    const ordre = [k.termeOffre, ...k.termes.filter(t => t !== k.termeOffre)];
    const fort = ordre.find(t => contient(zoneForte, t));
    const exp = fort ? undefined : ordre.find(t => contient(zoneExperiences, t));
    const termeCv = fort ?? exp ?? '';
    return {
      libelle: k.libelle, categorie: k.categorie, termeOffre: k.termeOffre, termes: k.termes, termeCv,
      viaSynonyme: !!termeCv && mots(termeCv).join(' ') !== mots(k.termeOffre).join(' '),
      ou: fort ? 'fort' : exp ? 'experience' : 'absent',
      priorite: k.priorite,
      poids: POIDS_CATEGORIE[k.categorie] * POIDS_PRIORITE[k.priorite],
    };
  });
  const credit = (k: MotCleResultat) => (k.ou === 'fort' ? 1 : k.ou === 'experience' ? 0.75 : 0);
  const poidsTotal = motsCles.reduce((s, k) => s + k.poids, 0);
  const scoreMots = poidsTotal ? Math.round(40 * motsCles.reduce((s, k) => s + k.poids * credit(k), 0) / poidsTotal) : 20;
  const metier = motsCles.filter(k => k.categorie !== 'Offre' && k.categorie !== 'Savoir-être');
  const exiges = motsCles.filter(k => k.priorite === 'obligatoire');

  // ===== 3. Expériences & impact chiffré (25) =====
  const experiences = visible('experiences') ? affichees(d.experiences).filter(e => rempli(e.entreprise) || rempli(e.poste)) : [];
  const puces = experiences.flatMap(e => e.puces.map(x => x.texte).filter(rempli));
  const chiffrees = puces.filter(t => CHIFFRE.test(t));
  const avecVerbe = puces.filter(commenceParVerbe);
  const mobilisees = metier.filter(k => [k.termeOffre, k.termeCv].filter(Boolean).some(t => contient(experiencesSeules, t))).length;
  const pertinence = !experiences.length ? 0 : metier.length ? Math.min(1, mobilisees / Math.max(2, metier.length * 0.4)) : 0.7;
  const ratioChiffres = puces.length ? chiffrees.length / puces.length : 0;
  const ratioVerbes = puces.length ? avecVerbe.length / puces.length : 0;
  const scoreImpact = Math.round(10 * pertinence + 8 * Math.min(1, ratioChiffres / 0.6) + 7 * Math.min(1, ratioVerbes / 0.8));

  // ===== 4. Conformité & lisibilité ATS (15) =====
  const speciaux = [...new Set(texteBrutCv(cv).match(CARACTERES_SPECIAUX) ?? [])];
  const titresOk = {
    experiences: visible('experiences') && /exp[ée]riences?|professional experience|work experience|employment/i.test(titreSection(cv, 'experiences')),
    formations: visible('formations') && /formations?|[ée]tudes|education|dipl[ôo]mes|academic/i.test(titreSection(cv, 'formations')),
    competences: visible('competences') && /comp[ée]tences|skills/i.test(titreSection(cv, 'competences')),
  };
  const contact = { email: /[\w.+-]+@[\w-]+\.[\w.-]+/.test(p.email), telephone: p.telephone.replace(/\D/g, '').length >= 9, ville: rempli(p.ville), linkedin: /linkedin/i.test(p.linkedin) };
  const nbTitres = Object.values(titresOk).filter(Boolean).length;
  const nbContact = Object.values(contact).filter(Boolean).length;
  // Tous les modèles de l'application sont à une colonne (point acquis)
  const scoreConformite = Math.round((speciaux.length ? 0 : 3) + (4 * nbTitres) / 3 + nbContact + (tientSurUnePage ? 3 : 0) + 1);

  const pct = (n: number) => `${Math.round(n * 100)} %`;
  const criteres: Critere[] = [
    { id: 'titre', libelle: 'Adéquation du titre', max: 20, score: titre.score, verifications: [
      { libelle: rempli(p.titre) ? `Titre du CV : « ${p.titre} »` : 'Aucun titre sous le nom', ok: rempli(p.titre) },
      { libelle: titre.nature === 'exact' ? `Intitulé exact de l'offre repris (« ${intitule} »)`
        : titre.nature === 'synonyme' ? `Même métier que « ${intitule} » (synonyme FR / EN)`
          : titre.nature === 'partiel' ? `Correspondance partielle avec « ${intitule} » (${pct(titre.ratio)})`
            : `Ne correspond pas à « ${intitule} »`, ok: titre.nature === 'exact' },
    ] },
    { id: 'motsCles', libelle: 'Mots-clés & hard skills', max: 40, score: scoreMots, verifications: [
      { libelle: `Compétences métier trouvées : ${metier.filter(k => k.ou !== 'absent').length}/${metier.length}`, ok: !metier.length || metier.filter(k => k.ou !== 'absent').length / metier.length >= 0.75 },
      { libelle: `Mots-clés exigés trouvés : ${exiges.filter(k => k.ou !== 'absent').length}/${exiges.length}`, ok: exiges.every(k => k.ou !== 'absent') },
      { libelle: `Placés dans l'accroche ou les compétences : ${metier.filter(k => k.ou === 'fort').length}/${metier.length}`, ok: !metier.length || metier.filter(k => k.ou === 'fort').length / metier.length >= 0.6 },
      { libelle: `Trouvés grâce à un synonyme FR / EN : ${motsCles.filter(k => k.viaSynonyme).length}`, ok: true },
    ] },
    { id: 'impact', libelle: 'Expériences & impact chiffré', max: 25, score: scoreImpact, verifications: [
      { libelle: `Expériences en lien avec l'offre (${mobilisees} compétences mobilisées)`, ok: pertinence >= 0.75 },
      { libelle: `Résultats chiffrés (€, %, délais, volumes) : ${chiffrees.length}/${puces.length} puces`, ok: ratioChiffres >= 0.6 },
      { libelle: `Verbes d'action en début de puce : ${avecVerbe.length}/${puces.length}`, ok: ratioVerbes >= 0.8 },
    ] },
    { id: 'conformite', libelle: 'Conformité & lisibilité ATS', max: 15, score: Math.min(15, scoreConformite), verifications: [
      { libelle: speciaux.length ? `Caractères spéciaux à retirer : ${speciaux.join(' ')}` : 'Aucun émoji ni symbole décoratif', ok: !speciaux.length },
      { libelle: `Intitulé standard « ${titreSection(cv, 'experiences')} »`, ok: titresOk.experiences },
      { libelle: `Intitulé standard « ${titreSection(cv, 'formations')} »`, ok: titresOk.formations },
      { libelle: `Intitulé standard « ${titreSection(cv, 'competences')} »`, ok: titresOk.competences },
      { libelle: 'Email', ok: contact.email }, { libelle: 'Téléphone', ok: contact.telephone },
      { libelle: 'Ville', ok: contact.ville }, { libelle: 'Profil LinkedIn', ok: contact.linkedin },
      { libelle: 'Une seule page A4', ok: tientSurUnePage },
      { libelle: 'Modèle à une colonne', ok: true },
    ] },
  ];

  const resultat: ResultatAts = {
    total: criteres.reduce((s, c) => s + c.score, 0),
    intitule, langueOffre, criteres, motsCles, conseils: [],
  };
  resultat.conseils = genererConseils(cv, resultat, {
    titre, speciaux, titresOk, contact, tientSurUnePage,
    puces, chiffrees: chiffrees.length, experiences,
  });
  return resultat;
}

// ---------------------------------------------------------------------------
//  Réserve : expériences et formations gardées en mémoire mais absentes du CV,
//  qui contiennent des mots-clés de l'offre (à remettre sur le CV ?)
// ---------------------------------------------------------------------------
export type TypeReserve = 'experience' | 'formation' | 'certification' | 'competences' | 'langue';
export interface SuggestionReserve {
  type: TypeReserve;
  id: string;
  libelle: string;
  /** Mots-clés de l'offre trouvés dans cette entrée */
  motsCles: string[];
  /** Dont mots-clés absents du CV actuel */
  manquants: number;
}

export function suggestionsReserve(cv: CV, r: ResultatAts): SuggestionReserve[] {
  const metier = r.motsCles.filter(k => k.categorie !== 'Savoir-être');
  const entrees = [
    ...cv.donnees.experiences.filter(e => e.masquee).map(e => ({
      type: 'experience' as const, id: e.id, libelle: [e.poste, e.entreprise].filter(rempli).join(' — ') || 'Expérience',
      texte: [e.poste, e.entreprise, ...e.puces.map(p => p.texte)].join(' , '),
    })),
    ...cv.donnees.formations.filter(f => f.masquee).map(f => ({
      type: 'formation' as const, id: f.id, libelle: [f.diplome, f.etablissement].filter(rempli).join(' — ') || 'Formation',
      texte: [f.diplome, f.etablissement, ...f.puces.map(p => p.texte)].join(' , '),
    })),
    ...cv.donnees.certifications.filter(c => c.masquee).map(c => ({
      type: 'certification' as const, id: c.id, libelle: c.intitule || 'Certification', texte: [c.intitule, c.organisme].join(' , '),
    })),
    ...cv.donnees.competences.filter(g => g.masquee).map(g => ({
      type: 'competences' as const, id: g.id, libelle: g.categorie || 'Groupe de compétences', texte: [g.categorie, ...g.elements].join(' , '),
    })),
    ...cv.donnees.langues.filter(l => l.masquee).map(l => ({
      type: 'langue' as const, id: l.id, libelle: l.langue || 'Langue', texte: [l.langue, l.precision].join(' , '),
    })),
  ];
  return entrees.map(e => {
    const n = normaliser(e.texte);
    const trouves = metier.filter(k => k.termes.some(t => contient(n, t)));
    return { type: e.type, id: e.id, libelle: e.libelle, motsCles: trouves.map(k => k.termeOffre), manquants: trouves.filter(k => k.ou === 'absent').length };
  }).filter(s => s.motsCles.length > 0).sort((a, b) => b.manquants - a.manquants || b.motsCles.length - a.motsCles.length);
}
