// ============================================================================
//  Mention RQTH (reconnaissance de la qualité de travailleur handicapé) : toujours
//  facultative, choisie par la personne. Jamais la nature du handicap, jamais en titre.
// ============================================================================
import type { CV, EmplacementRqth } from '../types';

export const EMPLACEMENTS_RQTH: { valeur: EmplacementRqth | ''; libelle: string; aide: string }[] = [
  { valeur: '', libelle: 'Ne pas l’indiquer', aide: 'Choix par défaut. Vous pourrez en parler en entretien, ou jamais : c’est votre décision.' },
  { valeur: 'entete', libelle: 'Dans l’en-tête, avec les coordonnées', aide: 'Bien visible : utile pour viser les entreprises engagées (Mission Handicap, obligation d’emploi).' },
  { valeur: 'bas', libelle: 'En bas du CV', aide: 'Plus discret : une ligne à la fin du CV (« RQTH » ; mention courte en anglais sur une version anglaise).' },
  { valeur: 'lettre', libelle: 'Seulement dans la lettre de motivation', aide: 'Rien sur le CV ; une phrase sobre est proposée dans la lettre.' },
];

/**
 * Sur le CV (en-tête ou bas) : « RQTH » seul sur un CV en français ;
 * sur la version anglaise, une mention courte compréhensible hors de France.
 */
const MENTION_CV = (cv: CV) => (cv.langue === 'en' ? 'Recognised disability (RQTH)' : 'RQTH');
export const texteRqthEntete = MENTION_CV;
export const texteRqthBas = MENTION_CV;

/** Phrase sobre pour la lettre de motivation (dans la langue du CV) */
export const phraseRqthLettre = (cv: CV) => (cv.langue === 'en'
  ? 'I also hold a recognised disability status (RQTH), which has no bearing on my ability to perform this role.'
  : 'Je bénéficie par ailleurs d’une reconnaissance de la qualité de travailleur handicapé (RQTH), sans incidence sur ma capacité à occuper ce poste.');

export const rqthEnTete = (cv: CV) => cv.donnees.infosPerso.mentionRqth === 'entete';
export const rqthEnBas = (cv: CV) => cv.donnees.infosPerso.mentionRqth === 'bas';
export const rqthDansLettre = (cv: CV) => cv.donnees.infosPerso.mentionRqth === 'lettre';
