// ============================================================================
//  Dictionnaire bilingue de synonymes (FR ↔ EN, acronymes) utilisé par l'analyseur ATS.
//  Les ATS des grandes banques et cabinets sont souvent paramétrés en anglais :
//  un terme français et son équivalent anglais comptent comme le même mot-clé.
//
//  Pour enrichir : ajoutez un terme dans « termes » d'un groupe existant, ou un nouveau groupe.
//  Les accents, majuscules et pluriels n'ont pas d'importance.
//  (L'utilisatrice peut aussi ajouter ses propres équivalences depuis l'analyseur.)
// ============================================================================

import { PARCOURS, TRANSVERSAL } from './certifications';
import { INTITULES_SECTEURS, SYNONYMES_SECTEURS } from './secteurs';

export type CategorieMotCle = 'Domaine' | 'Technique' | 'Outil' | 'Certification' | 'Langue' | 'Savoir-être';

export interface GroupeSynonymes {
  /** Nom affiché */
  libelle: string;
  categorie: CategorieMotCle;
  /** Toutes les façons de l'écrire (français, anglais, acronymes) */
  termes: string[];
}

export const SYNONYMES: GroupeSynonymes[] = [
  // ----- Domaine
  { libelle: 'Fusions & acquisitions (M&A)', categorie: 'Domaine', termes: ['m&a', 'fusions acquisitions', 'fusions-acquisitions', 'fusions et acquisitions', 'mergers and acquisitions', 'mergers & acquisitions', 'm and a'] },
  { libelle: 'Private Equity', categorie: 'Domaine', termes: ['private equity', 'capital investissement', 'capital-investissement', 'PE'] },
  { libelle: 'Venture Capital', categorie: 'Domaine', termes: ['venture capital', 'capital risque', 'capital-risque', 'VC'] },
  { libelle: 'Corporate Finance', categorie: 'Domaine', termes: ['corporate finance', 'finance d entreprise'] },
  { libelle: 'Asset Management', categorie: 'Domaine', termes: ['asset management', 'gestion d actifs', 'gestion de portefeuille', 'portfolio management'] },
  { libelle: 'Equity Research', categorie: 'Domaine', termes: ['equity research', 'analyse actions', 'recherche actions'] },
  { libelle: 'Leveraged Finance', categorie: 'Domaine', termes: ['leveraged finance', 'levfin', 'financements structures', 'financement d acquisition', 'acquisition finance'] },
  { libelle: 'Debt Capital Markets (DCM)', categorie: 'Domaine', termes: ['dcm', 'debt capital markets', 'marche obligataire', 'emissions obligataires'] },
  { libelle: 'Equity Capital Markets (ECM)', categorie: 'Domaine', termes: ['ecm', 'equity capital markets', 'introduction en bourse', 'ipo'] },
  { libelle: 'Transaction Services', categorie: 'Domaine', termes: ['transaction services', 'tas', 'financial due diligence', 'due diligence financiere'] },
  { libelle: 'Audit', categorie: 'Domaine', termes: ['audit', 'auditeur', 'commissariat aux comptes', 'external audit', 'audit externe', 'audit interne', 'internal audit', 'commissaire aux comptes', 'statutory auditor'] },
  { libelle: 'Contrôle de gestion', categorie: 'Domaine', termes: ['controle de gestion', 'controleur de gestion', 'management control', 'business controlling', 'controlling', 'FP&A', 'financial planning and analysis'] },
  { libelle: 'FP&A', categorie: 'Domaine', termes: ['fp&a', 'financial planning', 'planification financiere'] },
  { libelle: 'Trésorerie', categorie: 'Domaine', termes: ['tresorerie', 'treasury', 'cash management', 'gestion de tresorerie'] },
  { libelle: 'Gestion des risques', categorie: 'Domaine', termes: ['gestion des risques', 'risk management', 'risques financiers', 'market risk', 'risque de marche', 'credit risk', 'risque de credit'] },
  { libelle: 'Conformité / Compliance', categorie: 'Domaine', termes: ['compliance', 'conformite'] },
  { libelle: 'Analyse crédit', categorie: 'Domaine', termes: ['analyse credit', 'credit analysis', 'analyste credit', 'credit analyst', 'notation', 'credit rating'] },
  { libelle: 'Marchés financiers', categorie: 'Domaine', termes: ['marches financiers', 'capital markets', 'financial markets', 'salle des marches', 'trading', 'sales & trading', 'marchés de capitaux'] },
  { libelle: 'Banque d\'affaires / IB', categorie: 'Domaine', termes: ['banque d affaires', 'investment banking', 'banque d investissement', 'corporate & investment banking', 'cib'] },
  { libelle: 'Comptabilité', categorie: 'Domaine', termes: ['comptabilite', 'accounting', 'comptable', 'bookkeeping', 'comptabilité générale', 'general accounting'] },
  { libelle: 'Consolidation', categorie: 'Domaine', termes: ['consolidation', 'consolidated', 'consolide', 'group reporting'] },
  { libelle: 'Fiscalité', categorie: 'Domaine', termes: ['fiscalite', 'tax', 'fiscal'] },
  { libelle: 'Immobilier / Real Estate', categorie: 'Domaine', termes: ['real estate', 'immobilier'] },
  { libelle: 'Restructuring', categorie: 'Domaine', termes: ['restructuring', 'restructuration'] },
  { libelle: 'Wealth Management', categorie: 'Domaine', termes: ['wealth management', 'gestion de patrimoine', 'gestion privee', 'private banking', 'banque privee'] },
  { libelle: 'Financement de projets', categorie: 'Domaine', termes: ['project finance', 'financement de projets', 'infrastructure finance'] },
  { libelle: 'ALM', categorie: 'Domaine', termes: ['alm', 'asset liability management', 'gestion actif passif', 'gestion actif-passif'] },
  // ----- Technique
  { libelle: 'Modélisation financière', categorie: 'Technique', termes: ['modelisation financiere', 'financial modeling', 'financial modelling', 'modele financier', 'business plan', 'modeles financiers', 'three statement model', '3-statement'] },
  { libelle: 'Valorisation', categorie: 'Technique', termes: ['valorisation', 'valuation', 'evaluation d entreprise', 'evaluation financiere', 'business valuation'] },
  { libelle: 'DCF', categorie: 'Technique', termes: ['dcf', 'discounted cash flow', 'flux de tresorerie actualises', 'flux actualises', 'actualisation des flux de trésorerie'] },
  { libelle: 'LBO', categorie: 'Technique', termes: ['lbo', 'leveraged buy-out', 'leveraged buyout', 'leverage buy out', 'rachat à effet de levier'] },
  { libelle: 'Comparables / multiples', categorie: 'Technique', termes: ['comparables', 'multiples', 'comps', 'trading comps', 'transaction comps', 'precedent transactions', 'transactions comparables', 'comparables boursiers', 'trading comparables'] },
  { libelle: 'Analyse financière', categorie: 'Technique', termes: ['analyse financiere', 'financial analysis', 'analyse des etats financiers', 'financial statement analysis'] },
  { libelle: 'Due diligence', categorie: 'Technique', termes: ['due diligence', 'due diligences', 'audit d acquisition', 'DD'] },
  { libelle: 'Pitch book', categorie: 'Technique', termes: ['pitch book', 'pitchbook', 'pitch', 'presentations clients', 'présentation commerciale', 'mémo', 'information memorandum', 'IM'] },
  { libelle: 'Information memorandum', categorie: 'Technique', termes: ['information memorandum', 'memorandum d information', 'teaser'] },
  { libelle: 'Reporting', categorie: 'Technique', termes: ['reporting', 'reportings', 'tableaux de bord', 'dashboard', 'dashboards', 'tableau de bord'] },
  { libelle: 'Budget / prévisions', categorie: 'Technique', termes: ['budget', 'budgets', 'budgetaire', 'forecast', 'forecasts', 'previsions', 'reforecast', 'atterrissage', 'prévisionnel', 'forecasting'] },
  { libelle: 'Clôtures comptables', categorie: 'Technique', termes: ['cloture', 'clotures', 'closing mensuel', 'month-end', 'month end close', 'closing'] },
  { libelle: 'États financiers', categorie: 'Technique', termes: ['etats financiers', 'financial statements', 'bilan', 'compte de resultat', 'p&l', 'balance sheet', 'income statement', 'cash flow statement'] },
  { libelle: 'IFRS', categorie: 'Technique', termes: ['ifrs', 'normes IFRS', 'international financial reporting standards'] },
  { libelle: 'US GAAP', categorie: 'Technique', termes: ['us gaap', 'gaap'] },
  { libelle: 'Normes françaises (PCG)', categorie: 'Technique', termes: ['pcg', 'normes francaises', 'french gaap', 'normes comptables françaises'] },
  { libelle: 'Produits dérivés', categorie: 'Technique', termes: ['derives', 'produits derives', 'derivatives', 'swaps', 'futures'] },
  { libelle: 'Taux / Fixed Income', categorie: 'Technique', termes: ['fixed income', 'taux d interet', 'obligations', 'obligataire', 'bonds'] },
  { libelle: 'Actions / Equity', categorie: 'Technique', termes: ['equities', 'actions cotees', 'cash equity'] },
  { libelle: 'VaR', categorie: 'Technique', termes: ['var', 'value at risk'] },
  { libelle: 'Bâle III / prudentiel', categorie: 'Technique', termes: ['bale iii', 'bale 3', 'basel iii', 'basel', 'crd', 'prudentiel', 'solvabilite ii', 'solvency ii'] },
  { libelle: 'KYC', categorie: 'Technique', termes: ['kyc', 'know your customer', 'connaissance client', 'lutte anti-blanchiment', 'AML', 'anti-money laundering'] },
  { libelle: 'LCB-FT / AML', categorie: 'Technique', termes: ['lcb-ft', 'lcb ft', 'aml', 'anti money laundering', 'anti-money laundering', 'blanchiment'] },
  { libelle: 'Gestion de portefeuille', categorie: 'Technique', termes: ['allocation d actifs', 'asset allocation', 'construction de portefeuille', 'portfolio construction'] },
  { libelle: 'Analyse sectorielle', categorie: 'Technique', termes: ['analyse sectorielle', 'industry analysis', 'sector analysis', 'etude de marche', 'market research'] },
  { libelle: 'Recherche de cibles', categorie: 'Technique', termes: ['recherche de cibles', 'sourcing', 'deal sourcing', 'origination', 'screening'] },
  { libelle: 'Suivi de participations', categorie: 'Technique', termes: ['suivi de participations', 'portfolio monitoring', 'monitoring des participations'] },
  { libelle: 'Cash-flow / BFR', categorie: 'Technique', termes: ['bfr', 'working capital', 'besoin en fonds de roulement', 'cash flow', 'cash-flow', 'free cash flow'] },
  { libelle: 'Contrôle interne', categorie: 'Technique', termes: ['controle interne', 'internal control', 'internal controls', 'sox'] },
  { libelle: 'Analyse de rentabilité', categorie: 'Technique', termes: ['rentabilite', 'profitability', 'tri', 'irr', 'van', 'npv', 'roi', 'roe'] },
  { libelle: 'Statistiques / économétrie', categorie: 'Technique', termes: ['statistiques', 'statistics', 'econometrie', 'econometrics', 'regression'] },
  { libelle: 'EBITDA / qualité des résultats', categorie: 'Technique', termes: ['ebitda', 'quality of earnings', 'qualite des resultats', 'qoe', 'ebitda normatif'] },
  { libelle: 'Dette nette', categorie: 'Technique', termes: ['dette nette', 'net debt'] },
  { libelle: 'Databook', categorie: 'Technique', termes: ['databook', 'databooks'] },
  { libelle: 'Commissariat aux comptes / audit légal', categorie: 'Technique', termes: ['audit legal', 'statutory audit', 'certification des comptes'] },
  // ----- Outil
  { libelle: 'Alteryx', categorie: 'Outil', termes: ['alteryx'] },
  { libelle: 'Excel', categorie: 'Outil', termes: ['excel', 'microsoft excel', 'ms excel', 'tableur', 'spreadsheet'] },
  { libelle: 'VBA', categorie: 'Outil', termes: ['vba', 'macros', 'macros VBA'] },
  { libelle: 'PowerPoint', categorie: 'Outil', termes: ['powerpoint', 'power point', 'ppt'] },
  { libelle: 'Python', categorie: 'Outil', termes: ['python', 'pandas'] },
  { libelle: 'SQL', categorie: 'Outil', termes: ['sql', 'mysql', 'postgresql'] },
  { libelle: 'R', categorie: 'Outil', termes: ['rstudio', 'langage r'] },
  { libelle: 'Bloomberg', categorie: 'Outil', termes: ['bloomberg'] },
  { libelle: 'Capital IQ', categorie: 'Outil', termes: ['capital iq', 'capiq', 's&p capital iq'] },
  { libelle: 'FactSet', categorie: 'Outil', termes: ['factset'] },
  { libelle: 'Refinitiv / Eikon', categorie: 'Outil', termes: ['refinitiv', 'eikon', 'thomson reuters', 'datastream'] },
  { libelle: 'PitchBook', categorie: 'Outil', termes: ['pitchbook data'] },
  { libelle: 'Mergermarket', categorie: 'Outil', termes: ['mergermarket'] },
  { libelle: 'SAP', categorie: 'Outil', termes: ['sap', 's/4hana', 's4hana', 'sap fi', 'sap co'] },
  { libelle: 'Oracle / Hyperion', categorie: 'Outil', termes: ['oracle', 'hyperion', 'essbase'] },
  { libelle: 'Power BI', categorie: 'Outil', termes: ['power bi', 'powerbi'] },
  { libelle: 'Tableau', categorie: 'Outil', termes: ['tableau software'] },
  { libelle: 'Matlab', categorie: 'Outil', termes: ['matlab'] },
  { libelle: 'ERP', categorie: 'Outil', termes: ['erp'] },
  { libelle: 'Anaplan', categorie: 'Outil', termes: ['anaplan'] },
  // ----- Certification
  { libelle: 'CFA', categorie: 'Certification', termes: ['cfa', 'chartered financial analyst'] },
  { libelle: 'Certification AMF', categorie: 'Certification', termes: ['amf', 'certification amf'] },
  { libelle: 'FRM', categorie: 'Certification', termes: ['frm', 'financial risk manager'] },
  { libelle: 'ACCA / DSCG / DEC', categorie: 'Certification', termes: ['acca', 'dscg', 'dcg', 'expertise comptable', 'expert-comptable', 'cpa'] },
  { libelle: 'Bloomberg Market Concepts', categorie: 'Certification', termes: ['bmc', 'bloomberg market concepts'] },
  // ----- Langue
  { libelle: 'Anglais', categorie: 'Langue', termes: ['anglais', 'english', 'toeic', 'toefl', 'ielts', 'bilingue anglais'] },
  { libelle: 'Allemand', categorie: 'Langue', termes: ['allemand', 'german', 'deutsch'] },
  { libelle: 'Espagnol', categorie: 'Langue', termes: ['espagnol', 'spanish'] },
  { libelle: 'Italien', categorie: 'Langue', termes: ['italien', 'italian'] },
  { libelle: 'Chinois', categorie: 'Langue', termes: ['chinois', 'mandarin', 'chinese'] },
  { libelle: 'Arabe', categorie: 'Langue', termes: ['arabe', 'arabic'] },
  // ----- Savoir-être
  { libelle: 'Rigueur', categorie: 'Savoir-être', termes: ['rigueur', 'rigoureux', 'rigoureuse', 'attention to detail', 'detail-oriented', 'detail oriented', 'souci du detail', 'precision'] },
  { libelle: 'Esprit d\'analyse', categorie: 'Savoir-être', termes: ['esprit d analyse', 'analytique', 'analytical', 'esprit analytique', 'capacites d analyse', 'analytical skills', 'esprit de synthese', 'synthese'] },
  { libelle: 'Travail en équipe', categorie: 'Savoir-être', termes: ['travail en equipe', 'teamwork', 'team player', 'esprit d equipe', 'collaboration'] },
  { libelle: 'Communication', categorie: 'Savoir-être', termes: ['communication', 'aisance relationnelle', 'relationnel', 'interpersonal', 'presentation skills', 'redactionnel', 'written skills'] },
  { libelle: 'Autonomie', categorie: 'Savoir-être', termes: ['autonomie', 'autonome', 'autonomous', 'self-starter', 'independent'] },
  { libelle: 'Résistance au stress', categorie: 'Savoir-être', termes: ['resistance au stress', 'pression', 'under pressure', 'fast-paced', 'disponibilite', 'charge de travail'] },
  { libelle: 'Leadership', categorie: 'Savoir-être', termes: ['leadership', 'management d equipe', 'encadrement', 'team management', 'manager une equipe'] },
  { libelle: 'Organisation', categorie: 'Savoir-être', termes: ['organisation', 'organise', 'organized', 'organised', 'priorisation', 'gestion des priorites', 'time management'] },
  { libelle: 'Curiosité', categorie: 'Savoir-être', termes: ['curiosite', 'curieux', 'curieuse', 'curious', 'intellectual curiosity'] },
  { libelle: 'Proactivité', categorie: 'Savoir-être', termes: ['proactif', 'proactive', 'force de proposition', 'initiative'] },
  // ----- Technique
  { libelle: 'Clôture mensuelle', categorie: 'Technique', termes: ['clôture mensuelle', 'month-end closing', 'monthly close'] },
  // ----- Domaine
  { libelle: 'Levée de fonds', categorie: 'Domaine', termes: ['levée de fonds', 'fundraising', 'capital raising'] },
  { libelle: 'Paie', categorie: 'Domaine', termes: ['paie', 'payroll'] },
  { libelle: 'Administration du personnel', categorie: 'Domaine', termes: ['administration du personnel', 'HR administration', 'personnel administration'] },
  // ----- Technique
  { libelle: 'DSN', categorie: 'Technique', termes: ['déclaration sociale nominative', 'DSN'] },
  // ----- Outil
  { libelle: 'SIRH', categorie: 'Outil', termes: ['système d\'information RH', 'HRIS', 'SIRH', 'HCM'] },
  // ----- Domaine
  { libelle: 'Gestion des talents', categorie: 'Domaine', termes: ['gestion des talents', 'talent management'] },
  // ----- Technique
  { libelle: 'Conduite du changement', categorie: 'Technique', termes: ['conduite du changement', 'change management'] },
  { libelle: 'Gestion de projet', categorie: 'Technique', termes: ['gestion de projet', 'project management', 'PMO'] },
  { libelle: 'Cahier des charges', categorie: 'Technique', termes: ['cahier des charges', 'specifications', 'business requirements'] },
  { libelle: 'Recette', categorie: 'Technique', termes: ['recette', 'user acceptance testing', 'UAT'] },
  // ----- Outil
  { libelle: 'Tableaux croisés dynamiques', categorie: 'Outil', termes: ['tableaux croisés dynamiques', 'TCD', 'pivot tables'] },
  // ----- Langue
  { libelle: 'Anglais courant', categorie: 'Langue', termes: ['anglais courant', 'fluent English', 'business English'] },
  // ----- Outil
  { libelle: 'Silae', categorie: 'Outil', termes: ['silae'] },
  { libelle: 'ADP', categorie: 'Outil', termes: ['adp decidium', 'adp'] },
  { libelle: 'Workday', categorie: 'Outil', termes: ['workday'] },
  { libelle: 'SAP HR', categorie: 'Outil', termes: ['sap hr', 'sap hcm', 'successfactors'] },
  // ----- Technique
  { libelle: 'Congés payés / absences', categorie: 'Technique', termes: ['congés payés', 'gestion des absences', 'absences', 'leave management'] },
  { libelle: 'Paramétrage', categorie: 'Technique', termes: ['paramétrage', 'configuration', 'setup'] },
  { libelle: 'Analyse fonctionnelle', categorie: 'Technique', termes: ['analyse fonctionnelle', 'spécifications fonctionnelles', 'functional analysis', 'functional specifications'] },
  { libelle: 'Support utilisateurs', categorie: 'Technique', termes: ['support utilisateurs', 'assistance utilisateurs', 'user support', 'helpdesk'] },
  { libelle: 'Droit du travail', categorie: 'Technique', termes: ['droit du travail', 'droit social', 'labour law', 'employment law'] },
  { libelle: 'Conventions collectives', categorie: 'Technique', termes: ['convention collective', 'conventions collectives', 'collective agreements'] },
  // ==========================================================================
  //  Informatique, cybersécurité, réseaux & systèmes, cloud, data
  //  (pas de sigles de 2 lettres ambigus : « SI », « IT », « AD », « IA »…)
  // ==========================================================================
  // ----- Domaine
  { libelle: 'Cybersécurité', categorie: 'Domaine', termes: ['cybersecurite', 'cybersecurity', 'cyber securite', 'securite informatique', 'securite des systemes d information', 'securite du systeme d information', 'information security', 'infosec', 'ssi', 'it security'] },
  { libelle: 'Sécurité opérationnelle (SOC)', categorie: 'Domaine', termes: ['soc', 'security operations center', 'centre des operations de securite', 'blue team', 'detection et reponse', 'detection and response'] },
  { libelle: 'Test d\'intrusion (pentest)', categorie: 'Domaine', termes: ['pentest', 'pentesting', 'test d intrusion', 'tests d intrusion', 'penetration testing', 'ethical hacking', 'hacking ethique', 'red team', 'audit de securite technique'] },
  { libelle: 'Gouvernance, risques et conformité (GRC)', categorie: 'Domaine', termes: ['grc', 'gouvernance de la securite', 'governance risk and compliance', 'pssi', 'politique de securite', 'security policy', 'analyse de risques cyber'] },
  { libelle: 'Réseaux', categorie: 'Domaine', termes: ['reseaux informatiques', 'administration reseau', 'administration des reseaux', 'network administration', 'networking', 'infrastructure reseau', 'network infrastructure', 'reseaux et telecoms', 'telecommunications'] },
  { libelle: 'Administration systèmes', categorie: 'Domaine', termes: ['administration systeme', 'administration systemes', 'administration des systemes', 'system administration', 'systems administration', 'sysadmin', 'infrastructure systeme', 'exploitation informatique', 'it operations'] },
  { libelle: 'Systèmes d\'information', categorie: 'Domaine', termes: ['systemes d information', 'systeme d information', 'information systems', 'dsi', 'direction des systemes d information', 'informatique de gestion'] },
  { libelle: 'Cloud computing', categorie: 'Domaine', termes: ['cloud', 'cloud computing', 'informatique en nuage', 'iaas', 'paas', 'saas', 'cloud public', 'cloud hybride', 'hybrid cloud'] },
  { libelle: 'DevOps', categorie: 'Domaine', termes: ['devops', 'devsecops', 'sre', 'site reliability engineering', 'integration continue', 'continuous integration', 'ci/cd', 'ci cd', 'deploiement continu', 'continuous delivery', 'continuous deployment'] },
  { libelle: 'Développement logiciel', categorie: 'Domaine', termes: ['developpement logiciel', 'software development', 'software engineering', 'genie logiciel', 'developpement informatique', 'programmation', 'programming', 'coding'] },
  { libelle: 'Développement web', categorie: 'Domaine', termes: ['developpement web', 'web development', 'front-end', 'frontend', 'front end', 'back-end', 'backend', 'back end', 'full stack', 'fullstack', 'full-stack'] },
  { libelle: 'Data / Business Intelligence', categorie: 'Domaine', termes: ['business intelligence', 'informatique decisionnelle', 'decisionnel', 'data analysis', 'analyse de donnees', 'data analytics', 'data visualisation', 'data visualization', 'dataviz'] },
  { libelle: 'Data science / IA', categorie: 'Domaine', termes: ['data science', 'machine learning', 'apprentissage automatique', 'intelligence artificielle', 'artificial intelligence', 'deep learning', 'apprentissage profond', 'ia generative', 'generative ai', 'llm'] },
  { libelle: 'Support informatique', categorie: 'Domaine', termes: ['support informatique', 'it support', 'service desk', 'help desk', 'support technique', 'technical support', 'support niveau 1', 'support niveau 2', 'support n1', 'support n2', 'assistance informatique'] },
  { libelle: 'Gestion des services IT (ITSM)', categorie: 'Domaine', termes: ['itsm', 'it service management', 'gestion des services informatiques', 'gestion des incidents', 'incident management', 'gestion des problemes', 'problem management', 'gestion des changements', 'change management itil'] },
  // ----- Technique : cybersécurité
  { libelle: 'Gestion des vulnérabilités', categorie: 'Technique', termes: ['gestion des vulnerabilites', 'vulnerability management', 'scan de vulnerabilites', 'vulnerability assessment', 'audit de vulnerabilites', 'patch management', 'gestion des correctifs', 'cve'] },
  { libelle: 'Réponse à incident', categorie: 'Technique', termes: ['reponse a incident', 'reponse aux incidents', 'incident response', 'gestion des incidents de securite', 'security incident', 'csirt', 'cert-fr', 'forensic', 'forensics', 'investigation numerique', 'analyse forensique'] },
  { libelle: 'Threat intelligence', categorie: 'Technique', termes: ['threat intelligence', 'cyber threat intelligence', 'cti', 'renseignement sur la menace', 'veille cyber', 'threat hunting', 'chasse aux menaces'] },
  { libelle: 'Analyse de risques (EBIOS RM)', categorie: 'Technique', termes: ['ebios', 'ebios rm', 'ebios risk manager', 'analyse de risques', 'risk assessment', 'analyse des risques', 'iso 27005'] },
  { libelle: 'ISO 27001', categorie: 'Technique', termes: ['iso 27001', 'iso/iec 27001', 'iso 27002', 'smsi', 'isms', 'systeme de management de la securite de l information'] },
  { libelle: 'Conformité cyber (NIS2, DORA, RGPD)', categorie: 'Technique', termes: ['nis2', 'nis 2', 'dora', 'rgpd', 'gdpr', 'loi de programmation militaire', 'lpm', 'secnumcloud', 'pci dss', 'pci-dss', 'hds'] },
  { libelle: 'Gestion des identités et des accès (IAM)', categorie: 'Technique', termes: ['iam', 'gestion des identites', 'identity and access management', 'gestion des acces', 'access management', 'pam', 'privileged access management', 'sso', 'single sign-on', 'mfa', 'authentification multifacteur', 'multi-factor authentication', 'double authentification', 'zero trust'] },
  { libelle: 'Cryptographie / PKI', categorie: 'Technique', termes: ['cryptographie', 'cryptography', 'chiffrement', 'encryption', 'pki', 'infrastructure a cles publiques', 'public key infrastructure', 'certificats ssl', 'tls'] },
  { libelle: 'Sécurité réseau', categorie: 'Technique', termes: ['securite reseau', 'network security', 'pare-feu', 'pare feu', 'firewall', 'firewalls', 'ids', 'ips', 'ids/ips', 'waf', 'segmentation reseau', 'network segmentation', 'dmz', 'proxy'] },
  { libelle: 'Sécurité du cloud', categorie: 'Technique', termes: ['securite du cloud', 'cloud security', 'cspm', 'casb'] },
  { libelle: 'Sécurité applicative', categorie: 'Technique', termes: ['securite applicative', 'application security', 'appsec', 'owasp', 'owasp top 10', 'sast', 'dast', 'revue de code securite', 'secure coding', 'developpement securise'] },
  { libelle: 'Sensibilisation à la sécurité', categorie: 'Technique', termes: ['sensibilisation a la securite', 'sensibilisation cyber', 'security awareness', 'campagne de phishing', 'phishing simulation', 'hameconnage'] },
  { libelle: 'Durcissement (hardening)', categorie: 'Technique', termes: ['durcissement', 'hardening', 'system hardening', 'cis benchmarks', 'guides anssi', 'recommandations anssi'] },
  { libelle: 'Continuité d\'activité (PCA / PRA)', categorie: 'Technique', termes: ['pca', 'pra', 'plan de continuite d activite', 'plan de reprise d activite', 'business continuity', 'disaster recovery', 'bcp', 'drp'] },
  { libelle: 'Malware / analyse de code malveillant', categorie: 'Technique', termes: ['malware', 'logiciel malveillant', 'analyse de malware', 'malware analysis', 'reverse engineering', 'retro-ingenierie', 'ransomware', 'rancongiciel'] },
  // ----- Technique : réseaux & systèmes
  { libelle: 'TCP/IP', categorie: 'Technique', termes: ['tcp/ip', 'tcp ip', 'modele osi', 'osi model', 'adressage ip', 'ip addressing', 'ipv4', 'ipv6', 'subnetting', 'sous-reseaux', 'decoupage en sous-reseaux'] },
  { libelle: 'LAN / WAN', categorie: 'Technique', termes: ['lan', 'wan', 'reseau local', 'local area network', 'wide area network', 'sd-wan', 'mpls'] },
  { libelle: 'VLAN / commutation', categorie: 'Technique', termes: ['vlan', 'vlans', 'commutation', 'switching', 'switch', 'switches', 'commutateur', 'commutateurs', 'spanning tree', 'stp'] },
  { libelle: 'Routage', categorie: 'Technique', termes: ['routage', 'routing', 'routeur', 'routeurs', 'router', 'routers', 'ospf', 'bgp', 'eigrp', 'nat', 'routage statique', 'routage dynamique'] },
  { libelle: 'Wi-Fi', categorie: 'Technique', termes: ['wifi', 'wi-fi', 'wlan', 'reseau sans fil', 'wireless'] },
  { libelle: 'VPN', categorie: 'Technique', termes: ['vpn', 'ipsec', 'openvpn', 'wireguard', 'reseau prive virtuel', 'virtual private network'] },
  { libelle: 'Services réseau (DNS, DHCP)', categorie: 'Technique', termes: ['dns', 'dhcp', 'ntp', 'smtp', 'sftp', 'ssh', 'snmp', 'ldap', 'radius', '802.1x'] },
  { libelle: 'Active Directory', categorie: 'Technique', termes: ['active directory', 'ad ds', 'annuaire active directory', 'gpo', 'strategies de groupe', 'group policy', 'group policies', 'entra id', 'azure ad', 'azure active directory'] },
  { libelle: 'Virtualisation', categorie: 'Technique', termes: ['virtualisation', 'virtualization', 'hyperviseur', 'hypervisor', 'machines virtuelles', 'virtual machines', 'vm', 'vdi'] },
  { libelle: 'Sauvegarde', categorie: 'Technique', termes: ['sauvegarde des donnees', 'sauvegardes informatiques', 'sauvegarde informatique', 'backup', 'backups', 'restauration de donnees', 'restauration des donnees', 'plan de sauvegarde informatique', 'backup policy'] },
  { libelle: 'Supervision / monitoring', categorie: 'Technique', termes: ['supervision reseau', 'supervision informatique', 'supervision des infrastructures', 'outil de supervision', 'monitoring it', 'monitoring des infrastructures', 'infrastructure monitoring', 'it monitoring', 'network monitoring', 'metrologie', 'observabilite', 'observability', 'alerting'] },
  { libelle: 'Scripting / automatisation', categorie: 'Technique', termes: ['scripting', 'script', 'scripts', 'automatisation', 'automation', 'bash', 'shell script', 'scripts shell', 'powershell', 'batch'] },
  { libelle: 'Infrastructure as Code', categorie: 'Technique', termes: ['infrastructure as code', 'iac', 'infrastructure en tant que code'] },
  { libelle: 'Conteneurisation', categorie: 'Technique', termes: ['conteneurisation', 'containerisation', 'containerization', 'conteneurs', 'containers', 'microservices', 'micro-services'] },
  { libelle: 'Gestion de parc informatique', categorie: 'Technique', termes: ['gestion de parc', 'parc informatique', 'it asset management', 'inventaire informatique', 'masterisation', 'deploiement de postes', 'deploiement de postes de travail', 'imaging', 'mdm', 'gestion des terminaux', 'endpoint management'] },
  { libelle: 'Messagerie / collaboration', categorie: 'Technique', termes: ['messagerie electronique', 'microsoft exchange', 'exchange online', 'exchange server', 'microsoft 365', 'office 365', 'm365', 'o365', 'google workspace', 'sharepoint', 'microsoft teams'] },
  { libelle: 'Téléphonie / VoIP', categorie: 'Technique', termes: ['voip', 'toip', 'telephonie ip', 'ip telephony', 'sip', 'ipbx', 'pabx'] },
  { libelle: 'Haute disponibilité', categorie: 'Technique', termes: ['haute disponibilite', 'high availability', 'redondance', 'redundancy', 'load balancing', 'equilibrage de charge', 'repartition de charge', 'cluster', 'clustering', 'failover'] },
  { libelle: 'Stockage (SAN / NAS)', categorie: 'Technique', termes: ['stockage informatique', 'stockage de donnees', 'storage', 'san', 'nas', 'raid', 'iscsi'] },
  { libelle: 'Datacenter', categorie: 'Technique', termes: ['datacenter', 'data center', 'centre de donnees', 'salle serveur', 'salle serveurs', 'baie de brassage', 'cablage reseau', 'cablage informatique', 'cabling'] },
  // ----- Technique : développement, data, méthodes
  { libelle: 'API REST', categorie: 'Technique', termes: ['api', 'apis', 'api rest', 'rest api', 'restful', 'graphql', 'web services', 'webservices', 'soap'] },
  { libelle: 'Bases de données', categorie: 'Technique', termes: ['bases de donnees', 'base de donnees', 'databases', 'database', 'sgbd', 'sgbdr', 'rdbms', 'nosql', 'modelisation de donnees', 'data modeling', 'merise', 'uml'] },
  { libelle: 'ETL / pipelines de données', categorie: 'Technique', termes: ['etl', 'elt', 'pipeline de donnees', 'data pipeline', 'data pipelines', 'data engineering', 'ingenierie des donnees', 'entrepot de donnees', 'data warehouse', 'datawarehouse', 'data lake', 'datalake'] },
  { libelle: 'Tests logiciels', categorie: 'Technique', termes: ['tests unitaires', 'unit tests', 'unit testing', 'tests automatises', 'automated testing', 'test automation', 'tdd', 'tests d integration', 'integration testing', 'qa', 'assurance qualite logicielle'] },
  { libelle: 'Méthodes agiles', categorie: 'Technique', termes: ['agile', 'agilite', 'methodes agiles', 'scrum', 'kanban', 'framework safe', 'sprint', 'sprints', 'user stories', 'product backlog'] },
  { libelle: 'ITIL', categorie: 'Technique', termes: ['itil', 'itil v4', 'itil 4', 'bonnes pratiques itil'] },
  { libelle: 'Versionnage (Git)', categorie: 'Technique', termes: ['git', 'gestion de versions', 'version control', 'versionning', 'versioning', 'github', 'gitlab', 'bitbucket'] },
  { libelle: 'MOA / AMOA', categorie: 'Technique', termes: ['moa', 'amoa', 'maitrise d ouvrage', 'assistance a maitrise d ouvrage', 'moe', 'maitrise d oeuvre', 'business analysis', 'business analyst'] },
  { libelle: 'Documentation technique', categorie: 'Technique', termes: ['documentation technique', 'technical documentation', 'procedures informatiques', 'procedures techniques', 'modes operatoires', 'dossier d architecture', 'schema reseau', 'network diagram'] },
  // ----- Outil : systèmes & réseaux
  { libelle: 'Linux', categorie: 'Outil', termes: ['linux', 'debian', 'ubuntu', 'red hat', 'redhat', 'rhel', 'centos', 'rocky linux', 'unix'] },
  { libelle: 'Windows Server', categorie: 'Outil', termes: ['windows server', 'windows serveur', 'serveur windows', 'hyper-v', 'wsus', 'iis'] },
  { libelle: 'Windows (poste de travail)', categorie: 'Outil', termes: ['windows 10', 'windows 11', 'poste de travail windows'] },
  { libelle: 'macOS', categorie: 'Outil', termes: ['macos', 'mac os', 'jamf'] },
  { libelle: 'Cisco', categorie: 'Outil', termes: ['cisco', 'cisco ios', 'meraki', 'packet tracer'] },
  { libelle: 'Matériel réseau (HPE Aruba, Juniper…)', categorie: 'Outil', termes: ['aruba', 'hpe aruba', 'juniper', 'ubiquiti', 'mikrotik', 'extreme networks'] },
  { libelle: 'Pare-feu (Fortinet, Stormshield, Palo Alto…)', categorie: 'Outil', termes: ['fortinet', 'fortigate', 'stormshield', 'palo alto', 'checkpoint', 'check point', 'pfsense', 'opnsense', 'sophos'] },
  { libelle: 'VMware', categorie: 'Outil', termes: ['vmware', 'vsphere', 'esxi', 'vcenter'] },
  { libelle: 'Proxmox', categorie: 'Outil', termes: ['proxmox', 'proxmox ve'] },
  { libelle: 'Citrix', categorie: 'Outil', termes: ['citrix', 'xenapp', 'xendesktop'] },
  { libelle: 'Veeam', categorie: 'Outil', termes: ['veeam', 'veeam backup'] },
  { libelle: 'Supervision (Zabbix, Centreon, Nagios…)', categorie: 'Outil', termes: ['zabbix', 'centreon', 'nagios', 'prtg', 'grafana', 'prometheus', 'eyes of network', 'datadog'] },
  { libelle: 'Wireshark', categorie: 'Outil', termes: ['wireshark', 'tcpdump', 'analyse de trames', 'packet analysis'] },
  { libelle: 'GLPI / outils de ticketing', categorie: 'Outil', termes: ['glpi', 'servicenow', 'service now', 'jira service management', 'easyvista', 'freshservice', 'zendesk', 'ticketing', 'outil de ticketing', 'gestion des tickets'] },
  { libelle: 'Intune / SCCM', categorie: 'Outil', termes: ['intune', 'microsoft intune', 'sccm', 'mecm', 'configuration manager', 'wds', 'mdt', 'fog project', 'ocs inventory'] },
  { libelle: 'Ansible', categorie: 'Outil', termes: ['ansible'] },
  { libelle: 'Terraform', categorie: 'Outil', termes: ['terraform', 'opentofu'] },
  { libelle: 'Docker', categorie: 'Outil', termes: ['docker', 'docker compose', 'podman'] },
  { libelle: 'Kubernetes', categorie: 'Outil', termes: ['kubernetes', 'k8s', 'openshift', 'helm', 'aks', 'eks', 'gke'] },
  { libelle: 'CI/CD (Jenkins, GitLab CI…)', categorie: 'Outil', termes: ['jenkins', 'gitlab ci', 'github actions', 'azure devops', 'argocd', 'argo cd'] },
  // ----- Outil : cloud
  { libelle: 'AWS', categorie: 'Outil', termes: ['aws', 'amazon web services', 'ec2', 'aws lambda'] },
  { libelle: 'Microsoft Azure', categorie: 'Outil', termes: ['azure', 'microsoft azure'] },
  { libelle: 'Google Cloud', categorie: 'Outil', termes: ['google cloud', 'gcp', 'google cloud platform'] },
  { libelle: 'OVHcloud', categorie: 'Outil', termes: ['ovh', 'ovhcloud', 'scaleway', 'outscale'] },
  // ----- Outil : cybersécurité
  { libelle: 'SIEM (Splunk, Sentinel, QRadar…)', categorie: 'Outil', termes: ['siem', 'splunk', 'microsoft sentinel', 'azure sentinel', 'qradar', 'elastic security', 'elk', 'elastic stack', 'wazuh', 'logpoint', 'graylog'] },
  { libelle: 'EDR / XDR', categorie: 'Outil', termes: ['edr', 'xdr', 'mdr', 'crowdstrike', 'sentinelone', 'microsoft defender', 'defender for endpoint', 'harfanglab', 'cortex xdr', 'antivirus'] },
  { libelle: 'Scanners de vulnérabilités (Nessus, Qualys…)', categorie: 'Outil', termes: ['nessus', 'qualys', 'openvas', 'rapid7', 'tenable', 'nmap'] },
  { libelle: 'Outils de pentest (Burp, Metasploit…)', categorie: 'Outil', termes: ['burp', 'burp suite', 'metasploit', 'kali', 'kali linux', 'bloodhound', 'hashcat', 'john the ripper', 'sqlmap', 'nikto', 'mimikatz'] },
  { libelle: 'SOAR', categorie: 'Outil', termes: ['soar', 'cortex xsoar', 'thehive', 'misp'] },
  // ----- Outil : développement & data
  { libelle: 'Java', categorie: 'Outil', termes: ['java', 'spring', 'spring boot', 'jee', 'java ee'] },
  { libelle: 'JavaScript / TypeScript', categorie: 'Outil', termes: ['javascript', 'typescript', 'node.js', 'nodejs', 'node js', 'ecmascript'] },
  { libelle: 'React / Angular / Vue', categorie: 'Outil', termes: ['react', 'reactjs', 'react.js', 'angular', 'vue.js', 'vuejs', 'next.js', 'nextjs'] },
  { libelle: 'C# / .NET', categorie: 'Outil', termes: ['c#', 'dotnet', 'asp.net', '.net core', 'net core'] },
  { libelle: 'C / C++', categorie: 'Outil', termes: ['c++', 'langage c', 'c/c++'] },
  { libelle: 'PHP', categorie: 'Outil', termes: ['php', 'symfony', 'laravel', 'wordpress'] },
  { libelle: 'Go / Rust', categorie: 'Outil', termes: ['golang', 'rust'] },
  { libelle: 'HTML / CSS', categorie: 'Outil', termes: ['html', 'html5', 'css', 'css3', 'sass', 'tailwind'] },
  { libelle: 'Oracle Database / SQL Server', categorie: 'Outil', termes: ['sql server', 'microsoft sql server', 'oracle database', 'pl/sql', 't-sql', 'mariadb', 'mongodb', 'redis'] },
  { libelle: 'Databricks / Snowflake / Spark', categorie: 'Outil', termes: ['databricks', 'snowflake', 'spark', 'apache spark', 'pyspark', 'hadoop', 'bigquery', 'dbt'] },
  { libelle: 'Jira / Confluence', categorie: 'Outil', termes: ['jira', 'confluence', 'trello', 'ms project', 'microsoft project'] },
  // Autres secteurs : commerce, marketing, supply chain, industrie, BTP, santé, juridique… (secteurs.ts)
  ...SYNONYMES_SECTEURS,
];

// Les certifications recommandées (certifications.ts) deviennent aussi des mots-clés ATS,
// sauf celles dont un terme est déjà présent ci-dessus (CFA, AMF, TOEIC, ITIL…)
{
  const simple = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const connus = new Set(SYNONYMES.flatMap(g => g.termes.map(simple)));
  const vues = new Set<string>();
  for (const c of [...PARCOURS, TRANSVERSAL].flatMap(p => p.certifications)) {
    if (vues.has(c.id) || c.termes.some(t => connus.has(simple(t)))) continue;
    vues.add(c.id);
    SYNONYMES.push({ libelle: c.nom, categorie: 'Certification', termes: c.termes });
  }
}

/** Intitulés de postes équivalents (servent au critère « Adéquation du titre ») */
export const INTITULES_POSTES: { libelle: string; termes: string[] }[] = [
  { libelle: 'Analyste fusions-acquisitions', termes: ['analyste fusions-acquisitions', 'analyste M&A', 'M&A analyst', 'analyste fusions et acquisitions'] },
  { libelle: 'Auditeur financier', termes: ['auditeur financier', 'auditrice financière', 'auditeur', 'auditrice', 'financial auditor', 'audit associate', 'auditor'] },
  { libelle: 'Contrôleur de gestion', termes: ['contrôleur de gestion', 'contrôleuse de gestion', 'financial controller', 'FP&A analyst', 'business controller'] },
  { libelle: 'Chargé d\'affaires', termes: ['chargé d\'affaires', 'chargée d\'affaires', 'relationship manager', 'account manager'] },
  { libelle: 'Gestionnaire de paie', termes: ['gestionnaire de paie', 'gestionnaire paie', 'payroll specialist', 'payroll officer', 'payroll administrator'] },
  { libelle: 'Chef de projet SIRH', termes: ['chef de projet SIRH', 'HRIS project manager', 'consultant SIRH', 'consultante SIRH', 'HRIS consultant'] },
  { libelle: 'Consultant', termes: ['consultant', 'consultante', 'advisor', 'adviser'] },
  { libelle: 'Stagiaire / alternant', termes: ['stagiaire', 'stage', 'intern', 'internship', 'alternant', 'alternante', 'alternance', 'apprenti', 'apprentie', 'apprentice', 'work-study'] },
  { libelle: 'Analyste financier', termes: ['analyste financier', 'analyste financière', 'financial analyst'] },
  { libelle: 'Comptable', termes: ['comptable', 'assistant comptable', 'assistante comptable', 'accountant', 'accounting assistant'] },
  { libelle: 'Trésorier', termes: ['trésorier', 'trésorière', 'treasurer', 'treasury analyst'] },
  { libelle: 'Analyste crédit', termes: ['analyste crédit', 'credit analyst'] },
  { libelle: 'Associate', termes: ['associate', 'associé', 'associée'] },
  { libelle: 'Junior', termes: ['junior', 'débutant', 'entry level', 'graduate'] },
  { libelle: 'Senior', termes: ['senior', 'confirmé', 'confirmée', 'experienced'] },
  { libelle: 'Responsable / manager', termes: ['responsable', 'manager', 'head of'] },
  { libelle: 'Chargé de recrutement', termes: ['chargé de recrutement', 'chargée de recrutement', 'recruiter', 'talent acquisition'] },
  { libelle: 'Chargé RH', termes: ['chargé RH', 'chargée RH', 'HR officer', 'HR generalist', 'gestionnaire RH'] },
  // ----- Informatique, cybersécurité, réseaux
  { libelle: 'Administrateur systèmes et réseaux', termes: ['administrateur systemes et reseaux', 'administratrice systemes et reseaux', 'administrateur systeme et reseau', 'administratrice systeme et reseau', 'administrateur reseaux', 'administratrice reseaux', 'administrateur reseau', 'administratrice reseau', 'administrateur systemes', 'administratrice systemes', 'administrateur systeme', 'administratrice systeme', 'system administrator', 'systems administrator', 'network administrator', 'sysadmin', 'administrateur infrastructure', 'administratrice infrastructure'] },
  { libelle: 'Technicien systèmes et réseaux', termes: ['technicien systemes et reseaux', 'technicienne systemes et reseaux', 'technicien reseaux', 'technicienne reseaux', 'technicien informatique', 'technicienne informatique', 'tssr', 'it technician', 'network technician'] },
  { libelle: 'Ingénieur réseaux', termes: ['ingenieur reseaux', 'ingenieure reseaux', 'ingenieur reseau', 'ingenieure reseau', 'network engineer', 'ingenieur infrastructure', 'ingenieure infrastructure', 'infrastructure engineer', 'ingenieur systemes', 'ingenieure systemes', 'systems engineer'] },
  { libelle: 'Technicien support / helpdesk', termes: ['technicien support', 'technicienne support', 'technicien helpdesk', 'technicienne helpdesk', 'technicien de proximite', 'technicienne de proximite', 'support technician', 'helpdesk technician', 'it support technician', 'service desk analyst', 'it support specialist', 'technicien support informatique', 'technicienne support informatique'] },
  { libelle: 'Analyste SOC', termes: ['analyste soc', 'soc analyst', 'analyste cybersecurite', 'cybersecurity analyst', 'analyste securite', 'security analyst', 'analyste cyber'] },
  { libelle: 'Pentesteur', termes: ['pentesteur', 'pentesteuse', 'pentester', 'penetration tester', 'auditeur securite', 'auditrice securite', 'auditeur technique securite', 'ethical hacker', 'consultant pentest', 'consultante pentest'] },
  { libelle: 'Ingénieur cybersécurité', termes: ['ingenieur cybersecurite', 'ingenieure cybersecurite', 'ingenieur securite', 'ingenieure securite', 'security engineer', 'cybersecurity engineer', 'ingenieur securite informatique', 'ingenieure securite informatique', 'administrateur securite', 'administratrice securite'] },
  { libelle: 'Consultant cybersécurité / GRC', termes: ['consultant cybersecurite', 'consultante cybersecurite', 'consultant grc', 'consultante grc', 'cybersecurity consultant', 'grc analyst', 'analyste grc', 'consultant securite', 'consultante securite', 'chef de projet securite', 'cheffe de projet securite'] },
  { libelle: 'RSSI', termes: ['rssi', 'responsable de la securite des systemes d information', 'ciso', 'chief information security officer', 'information security manager', 'responsable securite informatique'] },
  { libelle: 'Architecte cloud / infrastructure', termes: ['architecte cloud', 'cloud architect', 'architecte infrastructure', 'infrastructure architect', 'architecte securite', 'security architect', 'architecte reseau', 'network architect'] },
  { libelle: 'Ingénieur DevOps / Cloud', termes: ['ingenieur devops', 'ingenieure devops', 'devops engineer', 'ingenieur cloud', 'ingenieure cloud', 'cloud engineer', 'sre', 'site reliability engineer', 'administrateur cloud', 'administratrice cloud'] },
  { libelle: 'Développeur', termes: ['developpeur', 'developpeuse', 'developer', 'software developer', 'software engineer', 'ingenieur logiciel', 'ingenieure logiciel', 'ingenieur developpement', 'developpeur full stack', 'developpeuse full stack', 'full stack developer', 'developpeur web', 'developpeuse web', 'web developer', 'developpeur front-end', 'developpeur back-end', 'frontend developer', 'backend developer'] },
  { libelle: 'Data analyst', termes: ['data analyst', 'analyste de donnees', 'analyste data', 'analyste bi', 'bi analyst', 'business intelligence analyst', 'consultant bi', 'consultante bi'] },
  { libelle: 'Data engineer / scientist', termes: ['data engineer', 'ingenieur data', 'ingenieure data', 'ingenieur de donnees', 'data scientist', 'machine learning engineer', 'ml engineer'] },
  { libelle: 'Chef de projet informatique', termes: ['chef de projet informatique', 'cheffe de projet informatique', 'chef de projet it', 'it project manager', 'chef de projet si', 'chef de projet technique', 'cheffe de projet technique', 'technical project manager', 'chef de projet moa', 'chef de projet amoa', 'product owner', 'scrum master'] },
  { libelle: 'DSI / responsable informatique', termes: ['dsi', 'directeur des systemes d information', 'directrice des systemes d information', 'cio', 'responsable informatique', 'it manager', 'responsable infrastructure', 'head of it'] },
  // Autres secteurs (secteurs.ts)
  ...INTITULES_SECTEURS,
];
