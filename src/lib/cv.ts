// ============================================================================
//  Fonctions utilitaires sur les CV : création de blocs vides, noms, titres
// ============================================================================
import type { CleSection, CV, Experience, Formation, Periode, Puce } from '../types';
import { ORDRE_PAR_DEFAUT, POLICES, STYLE_PAR_DEFAUT } from '../data/constantes';
import { INTITULES_SECTIONS } from '../data/intitulesSections';

/** Identifiant court et unique */
export const uid = () => Math.random().toString(36).slice(2, 10);

export const maintenant = () => new Date().toISOString();

export const periodeVide = (): Periode => ({ debut: '', fin: '', enCours: false });
export const puce = (texte = ''): Puce => ({ id: uid(), texte });

export const experienceVide = (): Experience => ({
  id: uid(), poste: '', entreprise: '', ville: '', periode: periodeVide(), puces: [puce()],
});

export const formationVide = (): Formation => ({
  id: uid(), diplome: '', etablissement: '', ville: '', periode: periodeVide(), puces: [],
});

/** Un CV vierge, prêt à remplir */
export function cvVierge(nom = 'Nouveau CV'): CV {
  const date = maintenant();
  return {
    id: uid(),
    nom,
    langue: 'fr',
    templateId: 'finance',
    style: { ...STYLE_PAR_DEFAUT },
    ordreSections: [...ORDRE_PAR_DEFAUT],
    sectionsMasquees: [],
    titresPersonnalises: {},
    dateCreation: date,
    dateModification: date,
    aClasser: [],
    donnees: {
      infosPerso: { prenom: '', nom: '', titre: '', email: '', telephone: '', ville: '', linkedin: '', site: '', dateNaissance: '', photo: null },
      accroche: '',
      rythmeAlternance: '',
      experiences: [experienceVide()],
      formations: [formationVide()],
      competences: [
        { id: uid(), categorie: 'Techniques', elements: [] },
        { id: uid(), categorie: 'Outils', elements: [] },
      ],
      qualites: [],
      langues: [{ id: uid(), langue: 'Anglais', niveau: 'B2', precision: '' }],
      certifications: [],
      centresInteret: [],
    },
  };
}

/** Copie profonde d'un CV avec de nouveaux identifiants de CV */
export function copierCv(cv: CV, nom: string): CV {
  const date = maintenant();
  return { ...structuredClone(cv), id: uid(), nom, dateCreation: date, dateModification: date };
}

export const nomComplet = (cv: CV) =>
  [cv.donnees.infosPerso.prenom, cv.donnees.infosPerso.nom].filter(Boolean).join(' ');

/** Titre affiché d'une section : titre personnalisé, sinon titre standard dans la langue du CV */
export const titreSection = (cv: CV, cle: CleSection) =>
  cv.titresPersonnalises[cle] || INTITULES_SECTIONS[cv.langue][cle];

export const policeCss = (cv: CV) => POLICES.find(p => p.id === cv.style.police)?.css ?? POLICES[0].css;
export const policeWord = (cv: CV) => POLICES.find(p => p.id === cv.style.police)?.word ?? 'Calibri';

/**
 * Découpe « Excel (TCD, VBA), SAP, Power BI » en ['Excel (TCD, VBA)', 'SAP', 'Power BI'] :
 * les virgules entre parenthèses ne coupent pas.
 */
export function decouperListe(texte: string, separateurs = /[,;]/): string[] {
  const out: string[] = [];
  let courant = '';
  let profondeur = 0;
  for (const c of texte) {
    if (c === '(') profondeur++;
    if (c === ')') profondeur = Math.max(0, profondeur - 1);
    if (profondeur === 0 && separateurs.test(c)) { out.push(courant); courant = ''; }
    else courant += c;
  }
  out.push(courant);
  return out.map(s => s.trim()).filter(Boolean);
}

/** Ce CV vient-il d'un fichier importé ? (les anciens imports sont reconnus à leur nom) */
export const estImporte = (cv: CV) => !!cv.importeLe || /^CV importé/i.test(cv.nom);

/** Entrées affichées sur le CV (les entrées « en réserve » sont gardées en mémoire mais exclues) */
export const affichees = <T extends { masquee?: boolean }>(liste: T[]): T[] => liste.filter(x => !x.masquee);
