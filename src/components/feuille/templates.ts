// ============================================================================
//  Les 3 modèles de CV. Tous partagent la même structure HTML (une colonne,
//  lisible par les ATS) : seuls l'apparence (feuille.css) et ces réglages changent.
//  Changer de modèle ne modifie donc jamais les données du CV.
// ============================================================================
import type { GroupeCompetences, TemplateId } from '../../types';

export interface DefinitionTemplate {
  id: TemplateId;
  nom: string;
  description: string;
  /** La photo peut-elle apparaître ? */
  photo: boolean;
  /** Côté de la photo en millimètres (petite dans le modèle Finance) */
  taillePhotoMm: number;
  /** Nom et coordonnées centrés */
  enteteCentre: boolean;
  /** Le groupe « Outils / logiciels » passe en tête des compétences et est encadré */
  outilsEnAvant: boolean;
}

export const TEMPLATES: DefinitionTemplate[] = [
  {
    id: 'finance', nom: 'Finance / M&A / Conseil', description: 'Ultra-sobre et dense, filets fins, petite photo en option',
    photo: true, taillePhotoMm: 20, enteteCentre: true, outilsEnAvant: false,
  },
  {
    id: 'moderne', nom: 'Moderne / Structuré', description: 'Nom en couleur, photo de profil possible',
    photo: true, taillePhotoMm: 28, enteteCentre: false, outilsEnAvant: false,
  },
  {
    id: 'rh', nom: 'RH / Paie / SIRH', description: 'Sobre, outils et logiciels mis en avant',
    photo: false, taillePhotoMm: 0, enteteCentre: false, outilsEnAvant: true,
  },
];

export const definitionTemplate = (id: TemplateId) => TEMPLATES.find(t => t.id === id) ?? TEMPLATES[0];

/** Un groupe de compétences parle-t-il d'outils / logiciels ? (ex. « Outils », « Logiciels », « SIRH », « Software ») */
export const estGroupeOutils = (g: GroupeCompetences) =>
  /(outil|logiciel|software|tool|sirh|hris|informatique|bureautique|\bit\b)/i.test(g.categorie);

/** Ordre d'affichage des groupes de compétences selon le modèle (les données ne bougent pas) */
export function groupesAffiches(groupes: GroupeCompetences[], id: TemplateId): GroupeCompetences[] {
  if (!definitionTemplate(id).outilsEnAvant) return groupes;
  return [...groupes.filter(estGroupeOutils), ...groupes.filter(g => !estGroupeOutils(g))];
}
