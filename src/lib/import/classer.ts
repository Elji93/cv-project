// ============================================================================
//  Après l'import : création du CV, classement des textes « À classer »,
//  liste des points à compléter
// ============================================================================
import type { CleSection, CV, DonneesCV, FragmentAClasser, InfosPerso } from '../../types';
import { cvVierge, puce, uid } from '../cv';
import { lignesDepuisTexte } from './lireDocx';
import { coordonneesDepuisTexte, detecterTitre, extraireDates, separerNom, versCentresInteret, versCertifications, versCompetences, versExperiences, versFormations, versLangues, type ResultatImport } from './decouperSections';

/** Crée un CV au format Finance à partir du résultat de l'import */
export function cvDepuisImport(r: ResultatImport, nom?: string): CV {
  const cv = cvVierge(nom);
  cv.templateId = 'finance';
  cv.donnees = structuredClone(r.donnees);
  cv.aClasser = structuredClone(r.aClasser);
  const qui = [r.donnees.infosPerso.prenom, r.donnees.infosPerso.nom].filter(Boolean).join(' ');
  cv.nom = nom || (qui ? `CV importé — ${qui}` : 'CV importé');
  cv.importeLe = cv.dateCreation;
  return cv;
}

/** Remplace le contenu d'un CV existant (style, modèle et nom conservés ; photo conservée si l'import n'en a pas) */
export function remplacerContenu(cv: CV, r: ResultatImport) {
  const photo = cv.donnees.infosPerso.photo;
  cv.donnees = structuredClone(r.donnees);
  if (!cv.donnees.infosPerso.photo) cv.donnees.infosPerso.photo = photo;
  cv.aClasser = [...cv.aClasser, ...structuredClone(r.aClasser)];
}

// ---------------------------------------------------------------------------
//  Destinations possibles d'un texte « à classer » : une rubrique du CV,
//  ou un champ précis des informations personnelles
// ---------------------------------------------------------------------------
export type ChampInfo = 'nomComplet' | 'prenom' | 'nom' | 'titre' | 'email' | 'telephone' | 'ville' | 'linkedin' | 'site'
  | 'dateNaissance' | 'rythmeAlternance' | 'rqth' | 'auto';
/** Champ d'une expérience ou d'une formation existante */
export type ChampExperience = 'puces' | 'poste' | 'entreprise' | 'ville' | 'dates';
export type ChampFormation = 'puces' | 'diplome' | 'etablissement' | 'ville' | 'dates';
/**
 * Où envoyer un texte :
 * - une rubrique (nouvelle entrée détectée automatiquement) : 'experiences', 'competences'…
 * - un champ des infos perso : 'infos.ville'
 * - l'accroche, en la remplaçant : 'accroche.remplacer'
 * - un champ d'une entrée existante : 'exp.<id>.puces', 'form.<id>.dates', 'comp.<id>' (groupe de compétences)
 */
export type Destination = CleSection | `infos.${ChampInfo}` | 'accroche.remplacer'
  | `exp.${string}.${ChampExperience}` | `form.${string}.${ChampFormation}` | `comp.${string}`;

export const CHAMPS_EXPERIENCE: [ChampExperience, string][] = [
  ['puces', 'Missions / réalisations'], ['poste', 'Poste'], ['entreprise', 'Entreprise'], ['ville', 'Ville'], ['dates', 'Dates'],
];
export const CHAMPS_FORMATION: [ChampFormation, string][] = [
  ['puces', 'Détails (mention, cours…)'], ['diplome', 'Diplôme'], ['etablissement', 'École'], ['ville', 'Ville'], ['dates', 'Dates'],
];

/** Sous-rubriques de « Infos perso », dans l'ordre du menu */
export const CHAMPS_INFOS: [ChampInfo, string][] = [
  ['auto', 'Détection automatique (email, téléphone, ville…)'],
  ['nomComplet', 'Prénom et nom'],
  ['prenom', 'Prénom'],
  ['nom', 'Nom'],
  ['titre', 'Titre / poste visé'],
  ['email', 'Email'],
  ['telephone', 'Téléphone'],
  ['ville', 'Ville / localisation'],
  ['linkedin', 'LinkedIn'],
  ['site', 'Site / GitHub / portfolio'],
  ['dateNaissance', 'Date de naissance'],
  ['rythmeAlternance', 'Rythme d’alternance'],
  ['rqth', 'Mention RQTH (en-tête, modifiable dans Infos & photo)'],
];

export const estInfo = (d: Destination): d is `infos.${ChampInfo}` => d.startsWith('infos.');

/** Libellé lisible d'une destination : « Infos perso › Ville / localisation », « Expérience « Analyste » › Dates » */
export function libelleDestination(d: Destination, libellesSections: Record<CleSection, string>, donnees?: DonneesCV): string {
  if (estInfo(d)) {
    const champ = d.slice(6) as ChampInfo;
    return `Infos perso › ${CHAMPS_INFOS.find(([c]) => c === champ)?.[1] ?? champ}`;
  }
  if (d === 'accroche.remplacer') return `${libellesSections.accroche} (remplacer)`;
  const [type, id, champ] = d.split('.');
  if (type === 'exp') {
    const e = donnees?.experiences.find(x => x.id === id);
    return `Expérience « ${e ? e.poste || e.entreprise : '?'} » › ${CHAMPS_EXPERIENCE.find(([c]) => c === champ)?.[1] ?? champ}`;
  }
  if (type === 'form') {
    const f = donnees?.formations.find(x => x.id === id);
    return `Formation « ${f ? f.diplome || f.etablissement : '?'} » › ${CHAMPS_FORMATION.find(([c]) => c === champ)?.[1] ?? champ}`;
  }
  if (type === 'comp') return `Compétences › ${donnees?.competences.find(g => g.id === id)?.categorie || 'groupe'}`;
  return libellesSections[d as CleSection];
}

/** Lignes d'un texte, sans puces ; les lignes coupées (suite en minuscule) sont recollées */
function lignesPropres(texte: string): string[] {
  const out: string[] = [];
  for (const brut of texte.split('\n')) {
    const l = brut.replace(/^\s*[•\-–]\s*/, '').trim();
    if (!l) continue;
    if (out.length && /^[a-zà-ÿ(]/.test(l) && !/^\s*[•\-–]/.test(brut)) out[out.length - 1] += ' ' + l;
    else out.push(l);
  }
  return out;
}

/** Remplit un champ d'une expérience / formation existante ; renvoie les lignes non utilisées */
function versEntree(d: DonneesCV, destination: string, texte: string): string[] {
  const [type, id, champ] = destination.split('.');
  const lignes = lignesPropres(texte);
  if (type === 'comp') {
    const g = d.competences.find(x => x.id === id);
    if (!g) return lignes;
    const elements = versCompetences(lignes).flatMap(x => x.elements);
    g.elements.push(...elements.filter(e => !g.elements.includes(e)));
    return [];
  }
  const entree = type === 'exp' ? d.experiences.find(x => x.id === id) : d.formations.find(x => x.id === id);
  if (!entree) return lignes;
  if (champ === 'puces') { entree.puces.push(...lignes.map(l => puce(l))); return []; }
  const valeur = sansEtiquette(lignes.join(' '));
  if (champ === 'dates') {
    const dates = extraireDates(valeur);
    if (!dates) return lignes; // aucune date reconnue : le texte reste à classer
    entree.periode = dates.periode;
    return [];
  }
  (entree as unknown as Record<string, string>)[champ] = valeur;
  return [];
}

/** Retire une étiquette en début de texte : « Ville : Lyon » -> « Lyon », « Poste visé : Analyste » -> « Analyste » */
const sansEtiquette = (t: string) => t.replace(/^\s*[A-Za-zÀ-ÿ'’ /.-]{2,30}\s*:\s+/, '').trim();

/** Remplit un champ des infos perso ; renvoie les lignes non utilisées (détection automatique) */
function versInfos(d: DonneesCV, lignes: string[], champ: ChampInfo): string[] {
  const p = d.infosPerso;
  const propres = lignes.map(l => l.replace(/^•\s*/, '').trim()).filter(Boolean);
  const { coordonnees: c, restes } = coordonneesDepuisTexte(propres);
  if (champ === 'auto') {
    (Object.keys(c) as (keyof typeof c)[]).forEach(k => { if (c[k]) p[k] = c[k]; });
    return restes;
  }
  const valeur = sansEtiquette(propres.join(' ').replace(/\s+/g, ' '));
  if (!valeur) return [];
  switch (champ) {
    case 'nomComplet': {
      const [prenom, nom] = separerNom(valeur);
      p.prenom = prenom; p.nom = nom;
      break;
    }
    case 'rythmeAlternance':
      d.rythmeAlternance = valeur;
      break;
    // Mention RQTH : on active l'option (texte standard) plutôt que de recopier la ligne
    case 'rqth':
      p.mentionRqth = 'entete';
      break;
    // Pour l'email, le téléphone, LinkedIn et le site : la valeur reconnue si possible, sinon le texte tel quel
    case 'email': case 'telephone': case 'linkedin': case 'site':
      p[champ] = c[champ] || valeur;
      break;
    default:
      (p as Record<Exclude<keyof InfosPerso, 'photo' | 'masques' | 'mentionRqth'>, string>)[champ as Exclude<ChampInfo, 'rqth' | 'nomComplet' | 'rythmeAlternance' | 'auto'>] = valeur;
  }
  return [];
}

/**
 * Ajoute un texte libre dans une section du CV, ou dans un champ des infos perso (modifie `d`).
 * Renvoie les lignes qui n'ont pas pu être utilisées (elles restent « à classer »).
 */
export function ajouterTexte(d: DonneesCV, texte: string, destination: Destination): string[] {
  if (estInfo(destination)) return versInfos(d, texte.split('\n'), destination.slice(6) as ChampInfo);
  if (/^(exp|form|comp)\./.test(destination)) return versEntree(d, destination, texte);
  if (destination === 'accroche.remplacer') { d.accroche = lignesPropres(texte).join(' '); return []; }
  const section = destination as CleSection;
  // On retire une éventuelle première ligne de titre de section (« Projets », « Bénévolat »…)
  const lignes = lignesDepuisTexte(texte).filter((l, i) => !(i === 0 && detecterTitre(l))).map(l => l.texte);
  switch (section) {
    case 'accroche':
      d.accroche = [d.accroche, lignes.map(l => l.replace(/^•\s*/, '')).join(' ')].filter(Boolean).join(' ');
      break;
    case 'experiences':
      d.experiences.push(...versExperiences(lignes));
      break;
    case 'formations':
      d.formations.push(...versFormations(lignes));
      break;
    case 'competences': {
      const nouveaux = versCompetences(lignes);
      for (const g of nouveaux) {
        const existant = d.competences.find(x => x.categorie.toLowerCase() === g.categorie.toLowerCase());
        if (existant) existant.elements.push(...g.elements.filter(e => !existant.elements.includes(e)));
        else d.competences.push(g);
      }
      break;
    }
    case 'langues':
      d.langues.push(...versLangues(lignes));
      break;
    case 'certifications':
      d.certifications.push(...versCertifications(lignes));
      break;
    case 'centresInteret':
      d.centresInteret.push(...versCentresInteret(lignes));
      break;
    case 'qualites':
      // (« Rigueur, autonomie » -> deux savoir-être)
      d.qualites.push(...versCentresInteret(lignes).filter(q => !d.qualites.includes(q)));
      break;
  }
  return [];
}

/** Envoie un fragment « À classer » vers une section, puis le retire de la liste */
export function classerFragment(cv: CV, fragmentId: string, section: Destination) {
  cv.aClasser = classerLignes(cv.donnees, cv.aClasser, fragmentId, [], section);
}

/**
 * Envoie seulement certaines lignes d'un fragment vers une section.
 * Les lignes restantes restent « à classer ». Renvoie la nouvelle liste « À classer ».
 * (lignes = numéros des lignes choisies ; vide = tout le fragment)
 */
export function classerLignes(d: DonneesCV, aClasser: FragmentAClasser[], fragmentId: string, lignes: number[], section: Destination | null): FragmentAClasser[] {
  const f = aClasser.find(x => x.id === fragmentId);
  if (!f) return aClasser;
  const toutes = f.texte.split('\n');
  const choisies = lignes.length ? lignes : toutes.map((_, i) => i);
  // section null = supprimer les lignes choisies
  const nonUtilisees = section ? ajouterTexte(d, choisies.sort((a, b) => a - b).map(i => toutes[i]).join('\n'), section) : [];
  const restantes = [...toutes.filter((_, i) => !choisies.includes(i)), ...nonUtilisees];
  return restantes.some(l => l.trim())
    ? aClasser.map(x => (x.id === fragmentId ? { ...x, texte: restantes.join('\n') } : x))
    : aClasser.filter(x => x.id !== fragmentId);
}

/** Version pour un CV complet */
export function classerSelection(cv: CV, fragmentId: string, lignes: number[], section: Destination | null) {
  cv.aClasser = classerLignes(cv.donnees, cv.aClasser, fragmentId, lignes, section);
}

/** Découpe un fragment en lignes séparées (pour les classer une par une) */
export function scinderFragment(cv: CV, fragmentId: string) {
  const i = cv.aClasser.findIndex(x => x.id === fragmentId);
  if (i < 0) return;
  const lignes = cv.aClasser[i].texte.split('\n').map(l => l.trim()).filter(Boolean);
  cv.aClasser.splice(i, 1, ...lignes.map(texte => ({ id: uid(), texte, sectionDetectee: cv.aClasser[i]?.sectionDetectee ?? null })));
}

/** Ce qui manque encore pour un CV finance lisible par les ATS */
export function pointsACompleter(d: DonneesCV): string[] {
  const p = d.infosPerso;
  const points: string[] = [];
  if (!p.prenom || !p.nom) points.push('Vérifiez le prénom et le nom.');
  if (!p.titre) points.push("Ajoutez un titre : l'intitulé exact du poste visé.");
  if (!p.email) points.push('Email non trouvé.');
  if (!p.telephone) points.push('Téléphone non trouvé.');
  if (!p.ville) points.push('Ville non trouvée.');
  if (!p.linkedin) points.push('Ajoutez votre URL LinkedIn.');
  if (!d.accroche) points.push('Rédigez une accroche de 2-3 lignes.');
  if (!d.experiences.length) points.push('Aucune expérience détectée : ajoutez-les ou classez-les depuis « À classer ».');
  const sansDates = d.experiences.filter(e => !e.periode.debut && !e.periode.fin && !e.periode.enCours).length;
  if (sansDates) points.push(`${sansDates} expérience(s) sans dates.`);
  const puces = d.experiences.flatMap(e => e.puces.map(x => x.texte));
  const nonChiffrees = puces.filter(t => !/\d/.test(t)).length;
  if (puces.length && nonChiffrees) points.push(`${nonChiffrees} puce(s) d'expérience sans chiffre : ajoutez montants, %, volumes ou délais.`);
  if (!d.formations.length) points.push('Aucune formation détectée.');
  if (!d.competences.length) points.push('Aucune compétence détectée.');
  return points;
}
