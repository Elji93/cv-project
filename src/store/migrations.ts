// ============================================================================
//  Migrations : transforme d'anciennes données (ou un fichier JSON importé)
//  en données au format actuel (version 3), sans rien perdre.
// ============================================================================
import type {
  Candidature, CleSection, CV, LettreMotivation, DonneesApp, Experience, Formation, GroupeCompetences, Langue, NiveauCECRL, Periode, StyleCV,
} from '../types';
import { VERSION_SCHEMA } from '../types';
import { ORDRE_PAR_DEFAUT, STYLE_PAR_DEFAUT } from '../data/constantes';
import { cvVierge, decouperListe, maintenant, puce, uid } from '../lib/cv';
import { estEnCours, lireDate } from '../lib/dates';

// ---------------------------------------------------------------------------
//  Format de la version 2 (application précédente)
// ---------------------------------------------------------------------------
interface EntreeV2 { id?: string; org?: string; role?: string; location?: string; start?: string; end?: string; bullets?: string[] }
interface CvV2 {
  id: string; name?: string; createdAt?: number; updatedAt?: number;
  personal?: { firstName?: string; lastName?: string; title?: string; email?: string; phone?: string; city?: string; linkedin?: string; website?: string; extra?: string; photo?: string; photoCrop?: { zoom?: number; x?: number; y?: number } };
  summary?: string; experience?: EntreeV2[]; education?: EntreeV2[]; activities?: EntreeV2[];
  skills?: { id?: string; category?: string; items?: string }[];
  languages?: { id?: string; name?: string; level?: string }[];
  certifications?: { id?: string; name?: string; issuer?: string; date?: string }[];
  interests?: string; order?: string[]; hidden?: string[]; titles?: Record<string, string>;
  style?: { template?: string; accent?: string; font?: string; fontSize?: number; lineHeight?: number; margin?: number; spacing?: number; showPhoto?: boolean; photoShape?: string; uppercaseTitles?: boolean };
}

const CLES_V2: Record<string, CleSection | undefined> = {
  summary: 'accroche', experience: 'experiences', education: 'formations', skills: 'competences',
  languages: 'langues', certifications: 'certifications', interests: 'centresInteret',
};

const estCvV2 = (o: unknown): o is CvV2 => !!o && typeof o === 'object' && 'personal' in o && !('donnees' in o);
const estCvV3 = (o: unknown): o is CV => !!o && typeof o === 'object' && 'donnees' in o;

/** « Sept. 2024 » + « Présent » -> période structurée (le texte non reconnu est gardé tel quel) */
function periodeDepuisTexte(debut = '', fin = ''): Periode {
  const enCours = estEnCours(fin);
  return {
    debut: lireDate(debut) ?? debut.trim(),
    fin: enCours ? '' : (lireDate(fin) ?? fin.trim()),
    enCours,
  };
}

/** « Courant (TOEIC 945) » -> niveau C1 + précision « TOEIC 945 » */
export function niveauDepuisTexte(texte = ''): { niveau: NiveauCECRL; precision: string } {
  const t = texte.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const code = texte.match(/\b([ABC][12])\b/i)?.[1].toUpperCase() as NiveauCECRL | undefined;
  let niveau: NiveauCECRL = code
    ?? (/(maternelle|natif|native|mother)/.test(t) ? 'natif'
      : /(bilingue|bilingual)/.test(t) ? 'C2'
        : /(courant|fluent|avance|advanced)/.test(t) ? 'C1'
          : /(professionnel|professional|upper)/.test(t) ? 'B2'
            : /(intermediaire|intermediate)/.test(t) ? 'B1'
              : /(notions|elementary|scolaire|basic)/.test(t) ? 'A2' : 'B1');
  if (/(maternelle|natif|native)/.test(t)) niveau = 'natif';
  const parenthese = texte.match(/\(([^)]*)\)/)?.[1] ?? '';
  const precision = parenthese.replace(/\b[ABC][12]\b/i, '').replace(/^[\s,–-]+|[\s,–-]+$/g, '');
  return { niveau, precision };
}

/** Convertit un CV de la version 2 */
export function cvDepuisV2(v: CvV2): CV {
  const cv = cvVierge(v.name || 'CV importé');
  const p = v.personal ?? {};
  const s = v.style ?? {};
  const date = (n?: number) => (n ? new Date(n).toISOString() : cv.dateCreation);

  cv.id = v.id || cv.id;
  cv.dateCreation = date(v.createdAt);
  cv.dateModification = date(v.updatedAt);
  cv.templateId = s.template === 'modern' ? 'moderne' : 'finance';
  cv.style = {
    couleur: s.accent ?? STYLE_PAR_DEFAUT.couleur,
    police: (['Arial', 'Calibri', 'Georgia', 'Garamond', 'Inter', 'Roboto'].includes(s.font ?? '') ? s.font : 'Calibri') as StyleCV['police'],
    taillePolice: s.fontSize ?? STYLE_PAR_DEFAUT.taillePolice,
    interligne: s.lineHeight ?? STYLE_PAR_DEFAUT.interligne,
    marges: s.margin ?? STYLE_PAR_DEFAUT.marges,
    espacementSections: s.spacing ?? 1,
    majusculesTitres: s.uppercaseTitles ?? true,
  };

  const ordre = (v.order ?? []).map(k => CLES_V2[k]).filter((k): k is CleSection => !!k);
  ORDRE_PAR_DEFAUT.forEach(k => { if (!ordre.includes(k)) ordre.push(k); });
  cv.ordreSections = ordre;
  cv.sectionsMasquees = (v.hidden ?? []).map(k => CLES_V2[k]).filter((k): k is CleSection => !!k);
  cv.titresPersonnalises = {};
  Object.entries(v.titles ?? {}).forEach(([k, t]) => { const c = CLES_V2[k]; if (c && t) cv.titresPersonnalises[c] = t; });

  const exp = (e: EntreeV2): Experience => ({
    id: e.id || uid(), poste: e.role ?? '', entreprise: e.org ?? '', ville: e.location ?? '',
    periode: periodeDepuisTexte(e.start, e.end), puces: (e.bullets ?? []).filter(b => b.trim()).map(b => puce(b)),
  });
  const form = (e: EntreeV2): Formation => ({
    id: e.id || uid(), diplome: e.role ?? '', etablissement: e.org ?? '', ville: e.location ?? '',
    periode: periodeDepuisTexte(e.start, e.end), puces: (e.bullets ?? []).filter(b => b.trim()).map(b => puce(b)),
  });

  cv.donnees = {
    infosPerso: {
      prenom: p.firstName ?? '', nom: p.lastName ?? '', titre: p.title ?? '', email: p.email ?? '', telephone: p.phone ?? '',
      ville: p.city ?? '', linkedin: p.linkedin ?? '', site: [p.website, p.extra].filter(Boolean).join(' | '), dateNaissance: '',
      photo: p.photo ? {
        image: p.photo, forme: s.photoShape === 'round' ? 'rond' : 'carre',
        zoom: p.photoCrop?.zoom ?? 1, decalageX: p.photoCrop?.x ?? 0, decalageY: p.photoCrop?.y ?? 0, affichee: !!s.showPhoto,
      } : null,
    },
    accroche: v.summary ?? '',
    rythmeAlternance: '',
    qualites: [],
    experiences: (v.experience ?? []).map(exp),
    formations: (v.education ?? []).map(form),
    competences: (v.skills ?? []).map((g): GroupeCompetences => ({ id: g.id || uid(), categorie: g.category ?? '', elements: decouperListe(g.items ?? '') })),
    langues: (v.languages ?? []).filter(l => l.name).map((l): Langue => ({ id: l.id || uid(), langue: l.name ?? '', ...niveauDepuisTexte(l.level) })),
    certifications: (v.certifications ?? []).map(c => ({ id: c.id || uid(), intitule: c.name ?? '', organisme: c.issuer ?? '', annee: c.date ?? '' })),
    centresInteret: decouperListe(v.interests ?? ''),
  };

  // La section « Activités » n'existe plus : son contenu part dans « À classer » pour ne rien perdre
  cv.aClasser = (v.activities ?? []).filter(a => a.org || a.role || a.bullets?.length).map(a => ({
    id: uid(),
    texte: [[a.role, a.org, a.location, [a.start, a.end].filter(Boolean).join(' – ')].filter(Boolean).join(' | '), ...(a.bullets ?? []).filter(Boolean).map(b => '• ' + b)].join('\n'),
    sectionDetectee: 'experiences',
  }));
  return cv;
}

/** Complète un CV v3 incomplet ou abîmé avec les valeurs par défaut */
export function normaliserCv(brut: Partial<CV>): CV {
  const base = cvVierge();
  const d = brut.donnees ?? base.donnees;
  const cv: CV = {
    ...base,
    ...brut,
    style: { ...STYLE_PAR_DEFAUT, ...(brut.style ?? {}) },
    titresPersonnalises: brut.titresPersonnalises ?? {},
    sectionsMasquees: brut.sectionsMasquees ?? [],
    aClasser: brut.aClasser ?? [],
    donnees: {
      ...base.donnees,
      ...d,
      infosPerso: { ...base.donnees.infosPerso, ...(d.infosPerso ?? {}) },
      experiences: d.experiences ?? [],
      formations: d.formations ?? [],
      competences: d.competences ?? [],
      langues: d.langues ?? [],
      certifications: d.certifications ?? [],
      centresInteret: d.centresInteret ?? [],
      qualites: d.qualites ?? [],
      rythmeAlternance: d.rythmeAlternance ?? '',
    },
  };
  const ordre = (brut.ordreSections ?? []).filter(k => ORDRE_PAR_DEFAUT.includes(k));
  // Section ajoutée dans une version plus récente : on l'insère à sa place habituelle
  ORDRE_PAR_DEFAUT.forEach((k, i) => {
    if (ordre.includes(k)) return;
    const precedente = ORDRE_PAR_DEFAUT.slice(0, i).reverse().find(x => ordre.includes(x));
    ordre.splice(precedente ? ordre.indexOf(precedente) + 1 : 0, 0, k);
  });
  cv.ordreSections = ordre;
  return cv;
}

/** Complète une candidature enregistrée par une version plus ancienne */
export const normaliserCandidature = (c: Partial<Candidature>): Candidature => ({
  id: c.id || uid(), entreprise: c.entreprise ?? '', poste: c.poste ?? '', dateEnvoi: c.dateEnvoi ?? '',
  cvId: c.cvId ?? null, lettreId: c.lettreId ?? null, scoreAts: typeof c.scoreAts === 'number' ? c.scoreAts : null,
  statut: c.statut && ['envoyee', 'relance', 'entretien', 'refus', 'offre'].includes(c.statut) ? c.statut : 'envoyee',
  lien: c.lien ?? '', notes: c.notes ?? '',
});

/** Complète une lettre enregistrée par une version plus ancienne */
export const normaliserLettre = (l: Partial<LettreMotivation>): LettreMotivation => ({
  id: l.id || uid(), nom: l.nom || 'Lettre', cvId: l.cvId ?? '', entreprise: l.entreprise ?? '', poste: l.poste ?? '',
  destinataire: l.destinataire ?? '', lieuDate: l.lieuDate ?? '', objet: l.objet ?? '', appel: l.appel ?? '',
  corps: l.corps ?? '', politesse: l.politesse ?? '',
  dateCreation: l.dateCreation ?? l.dateModification ?? maintenant(), dateModification: l.dateModification ?? maintenant(),
});

/** Données vides (aucun CV) — l'appelant ajoute le CV exemple */
export const donneesVides = (cvs: CV[]): DonneesApp => ({
  versionSchema: VERSION_SCHEMA, cvs, cvActifId: cvs[0]?.id ?? '', candidatures: [], lettres: [], synonymesPerso: [],
});

/**
 * Accepte n'importe quel format connu et renvoie des données v3 :
 * sauvegarde complète v3, enveloppe d'export, liste de CV v2, CV seul (v2 ou v3).
 * Lève une erreur si le contenu n'est pas reconnu.
 */
export function migrerDonnees(brut: unknown): DonneesApp {
  if (brut && typeof brut === 'object' && 'donnees' in brut && 'application' in brut) {
    return migrerDonnees((brut as { donnees: unknown }).donnees);
  }
  if (brut && typeof brut === 'object' && 'cvs' in brut && Array.isArray((brut as DonneesApp).cvs)) {
    const d = brut as Partial<DonneesApp>;
    const cvs = (d.cvs ?? []).map(c => (estCvV2(c) ? cvDepuisV2(c) : normaliserCv(c)));
    if (!cvs.length) throw new Error('Aucun CV dans ce fichier.');
    return {
      versionSchema: VERSION_SCHEMA,
      cvs,
      cvActifId: cvs.some(c => c.id === d.cvActifId) ? d.cvActifId! : cvs[0].id,
      candidatures: (Array.isArray(d.candidatures) ? d.candidatures : []).map(normaliserCandidature),
      lettres: (Array.isArray(d.lettres) ? d.lettres : []).map(normaliserLettre),
      synonymesPerso: d.synonymesPerso ?? [],
    };
  }
  if (Array.isArray(brut)) {
    const cvs = brut.map(c => (estCvV2(c) ? cvDepuisV2(c) : estCvV3(c) ? normaliserCv(c) : null)).filter((c): c is CV => !!c);
    if (!cvs.length) throw new Error('Aucun CV reconnu dans ce fichier.');
    return donneesVides(cvs);
  }
  if (estCvV2(brut)) return donneesVides([cvDepuisV2(brut)]);
  if (estCvV3(brut)) return donneesVides([normaliserCv(brut)]);
  throw new Error("Ce fichier n'est pas une sauvegarde CV Studio.");
}
