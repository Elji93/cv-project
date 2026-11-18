// ============================================================================
//  « Booster votre candidature » : métier détecté (offre ou CV), certifications
//  recommandées (déjà sur le CV ? demandées dans l'offre ?) et autres leviers.
// ============================================================================
import type { CV } from '../../types';
import { PARCOURS, TRANSVERSAL, type CertificationReco, type Parcours } from '../../data/certifications';
import { contient, normaliser } from './normalisation';
import { texteBrutCv } from './scoring';

export interface CertifResultat extends CertificationReco {
  /** Déjà mentionnée dans le CV */
  surCv: boolean;
  /** Citée dans l'offre */
  dansOffre: boolean;
  /** Absente du CV mais gardée en réserve : identifiants des certifications à remettre sur le CV */
  enReserve: string[];
}

export interface ParcoursResultat {
  parcours: Parcours;
  /** Nombre de termes du métier trouvés */
  score: number;
  certifications: CertifResultat[];
}

export interface Recommandations {
  /** Métiers reconnus, du plus probable au moins probable */
  detectes: ParcoursResultat[];
  /** Tous les parcours (détectés en premier) */
  tous: ParcoursResultat[];
  transversal: ParcoursResultat;
  /** Certifications citées dans l'offre et absentes du CV */
  manquantesOffre: CertifResultat[];
  /** Moins de 3 ans d'expérience : les certifications « expérimenté » passent au second plan */
  profilJunior: boolean;
}

/** Nombre de termes distincts d'un métier présents dans un texte normalisé */
export const scoreParcours = (texteN: string, p: Parcours) => p.detection.filter(t => contient(texteN, t)).length;

/** Mois d'expérience cumulés (approximation à partir des dates des expériences) */
export function moisExperience(cv: CV, aujourdhui = new Date()): number {
  const mois = (d: string) => {
    const m = /^(\d{4})(?:-(\d{1,2}))?$/.exec(d.trim());
    return m ? +m[1] * 12 + (m[2] ? +m[2] - 1 : 0) : null;
  };
  const maintenant = aujourdhui.getFullYear() * 12 + aujourdhui.getMonth();
  return cv.donnees.experiences.reduce((total, e) => {
    const debut = mois(e.periode.debut);
    const fin = e.periode.enCours ? maintenant : mois(e.periode.fin) ?? debut;
    return debut === null || fin === null ? total : total + Math.max(1, fin - debut + 1);
  }, 0);
}

export function recommander(cv: CV, offre = ''): Recommandations {
  const cvN = normaliser(texteBrutCv(cv));
  const offreN = offre.trim() ? normaliser(offre) : '';
  // Le métier se lit dans l'offre si elle est fournie (plus le titre du CV), sinon dans le CV
  const sourceN = offreN ? normaliser(`${offre}\n${cv.donnees.infosPerso.titre}`) : cvN;

  const reserve = cv.donnees.certifications.filter(x => x.masquee).map(x => ({ id: x.id, n: normaliser(`${x.intitule} ${x.organisme}`) }));
  const evaluer = (c: CertificationReco): CertifResultat => {
    const surCv = c.termes.some(t => contient(cvN, t));
    return {
      ...c,
      surCv,
      dansOffre: !!offreN && c.termes.some(t => contient(offreN, t)),
      enReserve: surCv ? [] : reserve.filter(r => c.termes.some(t => contient(r.n, t))).map(r => r.id),
    };
  };
  // Les certifications citées dans l'offre et pas encore sur le CV passent en tête
  const ordonner = (liste: CertifResultat[]) => [...liste].sort((a, b) => Number(b.dansOffre && !b.surCv) - Number(a.dansOffre && !a.surCv));
  const resultat = (p: Parcours): ParcoursResultat => ({ parcours: p, score: scoreParcours(sourceN, p), certifications: ordonner(p.certifications.map(evaluer)) });

  const tous = PARCOURS.map(resultat).sort((a, b) => b.score - a.score);
  const detectes = tous.filter(p => p.score >= 2).slice(0, 3);
  const transversal = resultat(TRANSVERSAL);

  const vues = new Set<string>();
  const manquantesOffre = [...tous, transversal].flatMap(p => p.certifications)
    .filter(c => c.dansOffre && !c.surCv && !vues.has(c.id) && vues.add(c.id));

  return { detectes, tous, transversal, manquantesOffre, profilJunior: moisExperience(cv) < 36 };
}
