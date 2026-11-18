// ============================================================================
//  CV exemple pré-rempli : profil Analyste Finance / Audit
// ============================================================================
import type { CV } from '../types';
import { cvVierge, puce, uid } from '../lib/cv';

export function cvExemple(): CV {
  const cv = cvVierge('Exemple — Analyste Finance / Audit');
  cv.donnees = {
    infosPerso: {
      prenom: 'Camille',
      nom: 'Martin',
      titre: 'Analyste Financière — Audit & Transaction Services',
      email: 'camille.martin@email.com',
      telephone: '+33 6 12 34 56 78',
      ville: 'Paris',
      linkedin: 'linkedin.com/in/camille-martin',
      site: '',
      dateNaissance: '',
      photo: null,
    },
    accroche:
      "Analyste financière diplômée d'un Master CCA (Bac+5), 2 ans d'expérience en audit légal, Transaction Services et contrôle de gestion. Maîtrise des normes IFRS et French GAAP, de la modélisation financière et de la due diligence. Anglais courant (TOEIC 945).",
    rythmeAlternance: '',
    experiences: [
      {
        id: uid(), poste: 'Auditrice financière (alternance)', entreprise: 'Cabinet Big 4', ville: 'Paris La Défense',
        periode: { debut: '2024-09', fin: '2025-08', enCours: false },
        puces: [
          puce('Audité les comptes annuels et consolidés de 6 clients (CA de 50 M€ à 1,2 Md€) en normes IFRS et French GAAP'),
          puce("Réalisé les tests de contrôle interne sur les cycles ventes, achats et trésorerie : 14 points d'amélioration identifiés"),
          puce('Analysé les provisions et les tests de dépréciation (goodwill de 85 M€) et revu les estimations du management'),
        ],
      },
      {
        id: uid(), poste: 'Stagiaire Transaction Services', entreprise: 'Cabinet Big 4', ville: 'Paris',
        periode: { debut: '2024-01', fin: '2024-06', enCours: false },
        puces: [
          puce('Participé à 4 due diligences financières buy-side et sell-side (VE de 30 à 250 M€) pour des fonds de Private Equity'),
          puce("Analysé la qualité des résultats (EBITDA normatif), le BFR et la dette nette : 3,5 M€ d'ajustements identifiés"),
          puce('Construit des databooks et modèles de cash-flow sous Excel, réduisant de 20 % le temps de production'),
        ],
      },
      {
        id: uid(), poste: 'Stagiaire Contrôle de gestion', entreprise: 'Groupe industriel (CA 400 M€)', ville: 'Lyon',
        periode: { debut: '2023-06', fin: '2023-08', enCours: false },
        puces: [
          puce('Préparé le reporting mensuel de 3 business units et analysé les écarts budget / réel'),
          puce('Automatisé le tableau de bord des coûts sous Power BI : clôture mensuelle accélérée de 2 jours'),
        ],
      },
    ],
    formations: [
      {
        id: uid(), diplome: 'Master Comptabilité, Contrôle, Audit (CCA)', etablissement: 'IAE Paris-Sorbonne', ville: 'Paris',
        periode: { debut: '2023', fin: '2025', enCours: false },
        puces: [puce('Mention Bien — Mémoire : « Les ajustements EBITDA en due diligence »')],
      },
      {
        id: uid(), diplome: 'Licence Gestion — parcours Finance', etablissement: 'Université Paris-Dauphine', ville: 'Paris',
        periode: { debut: '2020', fin: '2023', enCours: false },
        puces: [],
      },
    ],
    competences: [
      { id: uid(), categorie: 'Techniques', elements: ['Audit légal', 'IFRS', 'French GAAP', 'Consolidation', 'Contrôle interne', 'Due diligence', 'Modélisation financière', 'Analyse financière'] },
      { id: uid(), categorie: 'Outils', elements: ['Excel avancé (TCD, VBA)', 'PowerPoint', 'SAP FI', 'Power BI', 'Alteryx'] },
    ],
    qualites: ['Rigueur', "Esprit d'analyse", 'Travail en équipe', 'Résistance au stress'],
    langues: [
      { id: uid(), langue: 'Français', niveau: 'natif', precision: '' },
      { id: uid(), langue: 'Anglais', niveau: 'C1', precision: 'TOEIC 945' },
      { id: uid(), langue: 'Espagnol', niveau: 'B2', precision: '' },
    ],
    certifications: [{ id: uid(), intitule: 'DSCG — UE 4 Comptabilité et audit', organisme: 'Éducation nationale', annee: '2025' }],
    centresInteret: ['Semi-marathon (1h42)', 'Tennis en compétition', 'Trésorière de la Junior Conseil IAE (budget 80 k€)'],
  };
  return cv;
}
