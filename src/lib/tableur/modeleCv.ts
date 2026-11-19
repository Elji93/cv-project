// ============================================================================
//  CV <-> tableau à remplir (Excel, LibreOffice Calc, Google Sheets)
//  Un onglet par rubrique, une ligne par expérience / formation / langue…
//  La ligne grise « Exemple » du modèle vide est ignorée à l'import.
// ============================================================================
import type { DonneesCV, Experience, Formation, Periode } from '../../types';
import { cvVierge, decouperListe, puce, uid } from '../cv';
import { dateVersSaisie, estEnCours, lireDate } from '../dates';
import { niveauDepuisTexte } from '../../store/migrations';
import { calculerBilan, type ResultatImport } from '../import/decouperSections';
import type { LigneImportee } from '../import/lirePdf';
import { ecrireXlsx, type Cellule, type FeuilleXlsx } from './ecrireXlsx';
import type { FeuilleLue } from './lireTableur';

const sansAccents = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// ---------------------------------------------------------------------------
//  Onglets et colonnes
// ---------------------------------------------------------------------------
export const ONGLETS = {
  infos: 'Infos et profil',
  experiences: 'Expériences',
  formations: 'Formations',
  competences: 'Compétences',
  langues: 'Langues',
  certifications: 'Certifications',
} as const;

/** Rubriques de l'onglet « Infos et profil » : clé, libellé affiché, aide */
const INFOS: [CleInfo, string, string][] = [
  ['prenom', 'Prénom', 'Ex. : Camille'],
  ['nom', 'Nom', 'Ex. : Martin'],
  ['titre', 'Poste visé', 'Ex. : Contrôleuse de gestion. C’est le 1er élément lu par les logiciels de recrutement.'],
  ['email', 'Email', 'Ex. : camille.martin@email.com'],
  ['telephone', 'Téléphone', 'Ex. : 06 12 34 56 78'],
  ['ville', 'Ville', 'Ex. : Lyon'],
  ['linkedin', 'LinkedIn', 'Ex. : linkedin.com/in/camille-martin (facultatif)'],
  ['site', 'Site / GitHub / autre', 'Facultatif : site, portfolio, permis B, mobilité…'],
  ['dateNaissance', 'Date de naissance', 'Facultatif, souvent déconseillé.'],
  ['accroche', 'Profil (2 à 4 phrases)', 'Qui vous êtes, ce que vous savez faire, ce que vous cherchez.'],
  ['rythmeAlternance', 'Rythme d’alternance', 'Seulement pour une alternance. Ex. : 3 semaines en entreprise / 1 semaine à l’école'],
  ['qualites', 'Qualités', 'Séparées par des virgules. Ex. : Rigueur, Esprit d’équipe, Curiosité'],
  ['centresInteret', 'Centres d’intérêt', 'Séparés par des virgules. Ex. : Course à pied, Photographie'],
];
type CleInfo = 'prenom' | 'nom' | 'titre' | 'email' | 'telephone' | 'ville' | 'linkedin' | 'site' | 'dateNaissance'
  | 'accroche' | 'rythmeAlternance' | 'qualites' | 'centresInteret';

const COL_EXP = ['Poste', 'Entreprise', 'Ville', 'Début (MM/AAAA)', 'Fin (MM/AAAA ou « en cours »)', 'Missions (une par ligne : Alt+Entrée dans la cellule, ou ligne suivante)'];
const COL_FORM = ['Diplôme', 'École / université', 'Ville', 'Début (MM/AAAA)', 'Fin (MM/AAAA ou « en cours »)', 'Détails : mention, cours, mémoire… (un par ligne)'];
const COL_COMP = ['Catégorie', 'Compétences (séparées par des virgules)'];
const COL_LANG = ['Langue', 'Niveau (A1, A2, B1, B2, C1, C2 ou natif)', 'Précision (facultatif)'];
const COL_CERT = ['Intitulé', 'Organisme', 'Année'];
export const NIVEAUX = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'natif'];

const LIGNES_A_REMPLIR = 40;
const entete = (cols: string[]): Cellule[] => cols.map(texte => ({ texte, style: 'entete' }));
const exemple = (cols: string[]): Cellule[] => cols.map((texte, i) => ({ texte: i === 0 ? `Exemple : ${texte}` : texte, style: 'exemple' }));
const periodeVersCellules = (p: Periode) => [dateVersSaisie(p.debut), p.enCours ? 'en cours' : dateVersSaisie(p.fin)];

const MODE_EMPLOI = [
  'Remplissez un onglet par rubrique (en bas de l’écran) : Infos et profil, Expériences, Formations…',
  'Une ligne = une expérience, une formation, une langue… Les lignes grises « Exemple » sont ignorées : écrivez en dessous.',
  'Plusieurs missions pour un même poste : allez à la ligne dans la cellule (Alt+Entrée, ou Ctrl+Entrée dans LibreOffice et Google Sheets), ou écrivez la mission suivante sur la ligne d’en dessous en laissant « Poste » vide.',
  'Dates : 09/2024, 2024 ou « en cours ». Laissez vide une colonne que vous ne connaissez pas.',
  'Enregistrez le fichier (.xlsx ou .ods ; dans Google Sheets : Fichier › Télécharger › Microsoft Excel), puis importez-le dans CV Studio : Mes CV › Importer.',
  'Le fichier reste sur votre ordinateur : CV Studio le lit dans votre navigateur, sans l’envoyer nulle part.',
];

/** Construit les onglets du tableau : vide (avec exemples) ou rempli avec un CV */
export function feuillesModele(d: DonneesCV | null): FeuilleXlsx[] {
  const p = d?.infosPerso;
  const valeurInfo = (k: CleInfo): string => {
    if (!d || !p) return '';
    if (k === 'accroche' || k === 'rythmeAlternance') return d[k];
    if (k === 'qualites' || k === 'centresInteret') return d[k].join(', ');
    return p[k];
  };
  const lignesVides = (n: number) => Array.from({ length: n }, () => Array<string>(0));

  const infos: FeuilleXlsx = {
    nom: ONGLETS.infos, largeurs: [26, 60, 60], figerEntete: true,
    lignes: [entete(['Rubrique', 'Votre réponse', 'Aide']),
      ...INFOS.map(([k, libelle, aide]) => [{ texte: libelle, style: 'entete' as const }, valeurInfo(k), { texte: aide, style: 'aide' as const }])],
  };
  const exp: FeuilleXlsx = {
    nom: ONGLETS.experiences, largeurs: [30, 26, 16, 14, 18, 70], figerEntete: true,
    lignes: [entete(COL_EXP), ...(d
      ? d.experiences.filter(e => !e.masquee).map(e => [e.poste, e.entreprise, e.ville, ...periodeVersCellules(e.periode), e.puces.map(x => x.texte).filter(Boolean).join('\n')])
      : [exemple(['Assistante contrôle de gestion', 'Société Exemple', 'Lyon', '09/2023', 'en cours', 'Préparation du reporting mensuel\nAnalyse des écarts budget / réel']), ...lignesVides(LIGNES_A_REMPLIR)])],
  };
  const form: FeuilleXlsx = {
    nom: ONGLETS.formations, largeurs: [34, 30, 16, 14, 18, 60], figerEntete: true,
    lignes: [entete(COL_FORM), ...(d
      ? d.formations.filter(f => !f.masquee).map(f => [f.diplome, f.etablissement, f.ville, ...periodeVersCellules(f.periode), f.puces.map(x => x.texte).filter(Boolean).join('\n')])
      : [exemple(['Master Finance', 'Université Exemple', 'Lyon', '2022', '2024', 'Mention bien']), ...lignesVides(LIGNES_A_REMPLIR)])],
  };
  const comp: FeuilleXlsx = {
    nom: ONGLETS.competences, largeurs: [24, 80], figerEntete: true,
    lignes: [entete(COL_COMP), ...(d
      ? d.competences.filter(c => !c.masquee).map(c => [c.categorie, c.elements.join(', ')])
      : [exemple(['Outils', 'Excel (TCD, RECHERCHEX), Power BI, SAP']), ...lignesVides(LIGNES_A_REMPLIR)])],
  };
  const lang: FeuilleXlsx = {
    nom: ONGLETS.langues, largeurs: [22, 26, 30], figerEntete: true,
    lignes: [entete(COL_LANG), ...(d
      ? d.langues.filter(l => !l.masquee).map(l => [l.langue, l.niveau, l.precision])
      : [exemple(['Anglais', 'C1', 'TOEIC 945']), ...lignesVides(LIGNES_A_REMPLIR)])],
    listes: [{ colonne: 1, choix: NIVEAUX, premiereLigne: 2, derniereLigne: 200 }],
  };
  const cert: FeuilleXlsx = {
    nom: ONGLETS.certifications, largeurs: [40, 30, 10], figerEntete: true,
    lignes: [entete(COL_CERT), ...(d
      ? d.certifications.filter(c => !c.masquee).map(c => [c.intitule, c.organisme, c.annee])
      : [exemple(['Certification Voltaire', 'Projet Voltaire', '2024']), ...lignesVides(LIGNES_A_REMPLIR)])],
  };
  const aide: FeuilleXlsx = {
    nom: 'Mode d’emploi', largeurs: [110],
    lignes: [[{ texte: 'CV Studio : tableau à remplir', style: 'titre' }], [],
      ...MODE_EMPLOI.map(t => [{ texte: `• ${t}`, style: 'aide' as const }])],
  };
  return [aide, infos, exp, form, comp, lang, cert];
}

/** Fichier .xlsx du tableau (vide, ou rempli avec un CV) */
export const tableauCv = (d: DonneesCV | null) => ecrireXlsx(feuillesModele(d), 1);

// ---------------------------------------------------------------------------
//  Lecture du tableau rempli
// ---------------------------------------------------------------------------
/** Valeur de date lue dans une cellule : texte « 09/2024 », date ISO (LibreOffice) ou numéro de jour Excel */
export function dateCellule(v: string): { date: string | null; enCours: boolean } {
  const t = v.trim();
  if (!t) return { date: '', enCours: false };
  if (estEnCours(t)) return { date: '', enCours: true };
  const iso = t.match(/^(\d{4})-(\d{2})-\d{2}/);
  if (iso) return { date: `${iso[1]}-${iso[2]}`, enCours: false };
  // Numéro de jour Excel (1 = 1er janvier 1900) : une date convertie automatiquement par le tableur
  if (/^\d{5}(\.\d+)?$/.test(t)) {
    const jour = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(t)) * 86400000);
    return { date: `${jour.getUTCFullYear()}-${String(jour.getUTCMonth() + 1).padStart(2, '0')}`, enCours: false };
  }
  return { date: lireDate(t), enCours: false };
}

/** Lignes multiples d'une cellule, sans puce en début de ligne */
const lignesCellule = (v: string) => v.split(/\r?\n/).map(l => l.replace(/^\s*[-•*–·▪]\s*/, '').trim()).filter(Boolean);

/** Trouve l'onglet d'une rubrique d'après son nom (accents et majuscules ignorés) */
function onglet(feuilles: FeuilleLue[], ...mots: string[]): FeuilleLue | undefined {
  return feuilles.find(f => mots.some(m => sansAccents(f.nom).includes(m)));
}

/** Associe chaque colonne attendue à sa position, d'après les en-têtes (sinon : ordre du modèle) */
function colonnes(f: FeuilleLue, mots: string[][]): number[] {
  const entetes = (f.lignes[0] ?? []).map(sansAccents);
  return mots.map((variantes, i) => {
    const j = entetes.findIndex(e => variantes.some(v => e.startsWith(v)));
    return j >= 0 ? j : i;
  });
}

/** Lignes de données : sans l'en-tête, sans les lignes vides ni les lignes « Exemple » */
const lignesDonnees = (f: FeuilleLue | undefined) => (f?.lignes.slice(1) ?? [])
  .filter(l => l.some(c => c.trim()) && !/^exemple\b/i.test(sansAccents(l[0] ?? '')));

export function resultatDepuisTableau(feuilles: FeuilleLue[]): { resultat: ResultatImport; lignes: LigneImportee[] } {
  const donnees = cvVierge().donnees;
  donnees.experiences = []; donnees.formations = []; donnees.competences = []; donnees.langues = [];
  const aClasser: ResultatImport['aClasser'] = [];
  const signaler = (texte: string) => aClasser.push({ id: uid(), texte, sectionDetectee: null });

  // Infos et profil : colonne A = rubrique, colonne B = réponse
  const fInfos = onglet(feuilles, 'info', 'profil');
  for (const l of fInfos?.lignes.slice(1) ?? []) {
    const rubrique = sansAccents(l[0] ?? '');
    const v = (l[1] ?? '').trim();
    if (!rubrique || !v) continue;
    const trouve = INFOS.find(([, libelle]) => rubrique.startsWith(sansAccents(libelle).split(/[ (/]/)[0]));
    const k = trouve?.[0];
    if (!k) { signaler(`${l[0]} : ${v}`); continue; }
    if (k === 'accroche' || k === 'rythmeAlternance') donnees[k] = v;
    else if (k === 'qualites' || k === 'centresInteret') donnees[k] = decouperListe(v.replace(/\n/g, ','));
    else donnees.infosPerso[k] = v.replace(/\s*\n\s*/g, ' ');
  }

  const periode = (debut: string, fin: string, quoi: string): Periode => {
    const d = dateCellule(debut);
    const f = dateCellule(fin);
    if (d.date === null) signaler(`Date de début non reconnue pour « ${quoi} » : ${debut}`);
    if (f.date === null) signaler(`Date de fin non reconnue pour « ${quoi} » : ${fin}`);
    return { debut: d.date ?? '', fin: f.enCours ? '' : f.date ?? '', enCours: f.enCours || d.enCours };
  };

  // Expériences et formations : même forme (3 champs, début, fin, puces)
  const entrees = <T extends Experience | Formation>(f: FeuilleLue | undefined, mots: string[][], creer: (c: string[], p: Periode) => T): T[] => {
    if (!f) return [];
    const [a, b, c, deb, fin, det] = colonnes(f, mots);
    const liste: T[] = [];
    for (const l of lignesDonnees(f)) {
      const v = (i: number) => (l[i] ?? '').trim();
      const puces = lignesCellule(l[det] ?? '').map(t => puce(t));
      // Ligne sans intitulé ni dates : suite des missions de l'entrée précédente
      if (!v(a) && !v(b) && !v(c) && !v(deb) && !v(fin) && liste.length) { liste[liste.length - 1].puces.push(...puces); continue; }
      const e = creer([v(a), v(b), v(c)], periode(v(deb), v(fin), v(a) || v(b)));
      e.puces = puces;
      liste.push(e);
    }
    return liste;
  };
  donnees.experiences = entrees(onglet(feuilles, 'experience'), [['poste'], ['entreprise', 'societe', 'employeur'], ['ville', 'lieu'], ['debut'], ['fin'], ['mission', 'detail']],
    ([poste, entreprise, ville], p) => ({ id: uid(), poste, entreprise, ville, periode: p, puces: [] }));
  donnees.formations = entrees(onglet(feuilles, 'formation'), [['diplome', 'formation'], ['ecole', 'etablissement', 'universite'], ['ville', 'lieu'], ['debut'], ['fin'], ['detail', 'mention']],
    ([diplome, etablissement, ville], p) => ({ id: uid(), diplome, etablissement, ville, periode: p, puces: [] }));

  const fComp = onglet(feuilles, 'competence');
  if (fComp) {
    const [cat, el] = colonnes(fComp, [['categorie'], ['competence']]);
    for (const l of lignesDonnees(fComp)) {
      const elements = decouperListe((l[el] ?? '').replace(/\n/g, ','));
      if (elements.length) donnees.competences.push({ id: uid(), categorie: (l[cat] ?? '').trim(), elements });
    }
  }

  const fLang = onglet(feuilles, 'langue');
  if (fLang) {
    const [nom, niv, prec] = colonnes(fLang, [['langue'], ['niveau'], ['precision']]);
    for (const l of lignesDonnees(fLang)) {
      const langue = (l[nom] ?? '').trim();
      if (!langue) continue;
      const n = niveauDepuisTexte((l[niv] ?? '').trim() || 'B1');
      donnees.langues.push({ id: uid(), langue, niveau: n.niveau, precision: (l[prec] ?? '').trim() || n.precision });
    }
  }

  const fCert = onglet(feuilles, 'certification');
  if (fCert) {
    const [int, org, an] = colonnes(fCert, [['intitule', 'certification'], ['organisme'], ['annee']]);
    for (const l of lignesDonnees(fCert)) {
      const intitule = (l[int] ?? '').trim();
      if (intitule) donnees.certifications.push({ id: uid(), intitule, organisme: (l[org] ?? '').trim(), annee: dateCellule(l[an] ?? '').date?.slice(0, 4) || (l[an] ?? '').trim() });
    }
  }

  // Texte affiché à gauche de l'écran de vérification : le contenu du tableau, onglet par onglet
  const lignes: LigneImportee[] = feuilles.filter(f => f.lignes.length > 1 && !/emploi/.test(sansAccents(f.nom))).flatMap(f => [
    `— ${f.nom} —`,
    ...(f === fInfos
      ? f.lignes.slice(1).filter(l => (l[1] ?? '').trim()).map(l => [l[0], l[1]])
      : lignesDonnees(f)
    ).map(l => l.map(c => (c ?? '').replace(/\s*\n\s*/g, ' / ').trim()).filter(Boolean).join(' | ')),
  ]).map(texte => ({ texte, taille: 10, zone: 'pleine' as const }));

  return { resultat: { donnees, aClasser, bilan: calculerBilan(donnees) }, lignes };
}

/** Ce classeur ressemble-t-il au tableau CV Studio ? (au moins un onglet reconnu) */
export const estTableauCv = (feuilles: FeuilleLue[]) =>
  !!(onglet(feuilles, 'info', 'profil') || onglet(feuilles, 'experience') || onglet(feuilles, 'formation'));
