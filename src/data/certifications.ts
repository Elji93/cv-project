// ============================================================================
//  Recommandations pour « booster » une candidature : certifications et autres leviers,
//  par famille de métiers. Utilisé par la carte « Booster votre candidature »
//  (analyseur et onglet Certifications) et par le dictionnaire ATS.
//
//  Pour enrichir : ajoutez une certification dans « certifications » d'un parcours,
//  avec les façons de l'écrire dans « termes » (sert à savoir si elle est déjà sur le CV
//  ou demandée dans l'offre). Les accents et majuscules n'ont pas d'importance.
//  Aucun prix n'est indiqué : ils changent souvent. « gratuit » seulement quand c'est le cas.
// ============================================================================
import { PARCOURS_SECTEURS } from './parcoursSecteurs';

export type NiveauCertif = 'debutant' | 'intermediaire' | 'avance';

export interface CertificationReco {
  id: string;
  nom: string;
  organisme: string;
  niveau: NiveauCertif;
  /** Pourquoi elle aide, prérequis éventuels */
  note: string;
  /** Façons de l'écrire (CV, offre) */
  termes: string[];
  gratuit?: boolean;
}

export interface Parcours {
  id: string;
  libelle: string;
  /** Termes qui révèlent ce métier dans l'offre ou le CV */
  detection: string[];
  certifications: CertificationReco[];
  /** Autres leviers que les certifications */
  leviers: string[];
}

export const LIBELLE_NIVEAU: Record<NiveauCertif, string> = {
  debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Expérimenté',
};

// ---------------------------------------------------------------------------
//  Certifications partagées entre plusieurs parcours
// ---------------------------------------------------------------------------
const ITIL: CertificationReco = {
  id: 'itil4', nom: 'ITIL 4 Foundation', organisme: 'PeopleCert / Axelos', niveau: 'debutant',
  note: 'Bonnes pratiques de gestion des services IT (incidents, demandes, changements) : souvent citée en support, exploitation et gestion de projet.',
  termes: ['itil 4 foundation', 'itil foundation', 'itil v4', 'certification itil', 'itil 4', 'itil'],
};
const RGPD_CNIL: CertificationReco = {
  id: 'atelier-rgpd', nom: 'MOOC « L’atelier RGPD »', organisme: 'CNIL', niveau: 'debutant', gratuit: true,
  note: 'Bases de la protection des données personnelles, avec attestation de suivi. Utile en RH, SIRH et cybersécurité.',
  termes: ['atelier rgpd', 'mooc rgpd', 'mooc cnil'],
};
const PL300: CertificationReco = {
  id: 'pl-300', nom: 'Microsoft Power BI Data Analyst (PL-300)', organisme: 'Microsoft', niveau: 'intermediaire',
  note: 'Prouve la maîtrise de Power BI (modélisation, DAX, tableaux de bord) : recherchée en data, contrôle de gestion et reporting RH.',
  termes: ['pl-300', 'pl 300', 'power bi data analyst', 'da-100'],
};

// ---------------------------------------------------------------------------
//  Parcours métiers
// ---------------------------------------------------------------------------
export const PARCOURS: Parcours[] = [
  {
    id: 'cyber',
    libelle: 'Cybersécurité',
    detection: ['cybersecurite', 'cybersecurity', 'securite informatique', 'securite des systemes d information', 'ssi', 'soc', 'siem', 'pentest',
      'test d intrusion', 'iso 27001', 'rssi', 'ciso', 'edr', 'xdr', 'vulnerabilite', 'vulnerabilites', 'ebios', 'grc', 'nis2', 'anssi',
      'reponse a incident', 'incident response', 'threat intelligence', 'red team', 'blue team', 'forensic', 'owasp', 'iam', 'zero trust',
      'analyste soc', 'pentester', 'malware', 'durcissement', 'hardening'],
    certifications: [
      { id: 'secnum', nom: 'SecNumacadémie', organisme: 'ANSSI', niveau: 'debutant', gratuit: true,
        note: 'MOOC officiel de l’ANSSI sur les bases de la sécurité numérique, avec attestation de réussite. Idéal pour démarrer ou pour un profil non technique.',
        termes: ['secnumacademie', 'secnum academie', 'mooc anssi'] },
      { id: 'isc2-cc', nom: 'Certified in Cybersecurity (CC)', organisme: 'ISC2', niveau: 'debutant',
        note: 'Certification d’entrée de gamme reconnue internationalement : bon signal pour un stage, une alternance ou un premier poste.',
        termes: ['certified in cybersecurity', 'isc2 cc'] },
      { id: 'secplus', nom: 'CompTIA Security+', organisme: 'CompTIA', niveau: 'debutant',
        note: 'Référence mondiale pour un premier poste en cybersécurité (analyste SOC, administrateur sécurité). Très présente dans les offres en anglais.',
        termes: ['security+', 'comptia security', 'sec+'] },
      { id: 'sc-200', nom: 'Microsoft Security Operations Analyst (SC-200)', organisme: 'Microsoft', niveau: 'intermediaire',
        note: 'Détection et réponse avec Microsoft Sentinel et Defender : pertinente pour les SOC qui utilisent l’écosystème Microsoft.',
        termes: ['sc-200', 'sc 200', 'security operations analyst'] },
      { id: 'ceh', nom: 'Certified Ethical Hacker (CEH)', organisme: 'EC-Council', niveau: 'intermediaire',
        note: 'Souvent citée dans les offres de pentest et d’audit technique, surtout dans les grands groupes et le conseil.',
        termes: ['ceh', 'certified ethical hacker'] },
      { id: 'iso27001', nom: 'ISO/IEC 27001 Lead Implementer ou Lead Auditor', organisme: 'PECB, LSTI, AFNOR…', niveau: 'intermediaire',
        note: 'Pour la gouvernance, les risques et la conformité (GRC) : mise en place ou audit d’un SMSI.',
        termes: ['27001 lead implementer', '27001 lead auditor', 'iso 27001 li', 'iso 27001 la', 'lead implementer', 'lead auditor 27001'] },
      { id: 'ebios', nom: 'Formation EBIOS Risk Manager', organisme: 'Organismes labellisés (méthode ANSSI)', niveau: 'intermediaire',
        note: 'La méthode d’analyse de risques de l’ANSSI, attendue dans le secteur public, la défense et chez les opérateurs d’importance vitale.',
        termes: ['ebios risk manager', 'ebios rm', 'certification ebios', 'formation ebios'] },
      { id: 'oscp', nom: 'OffSec Certified Professional (OSCP)', organisme: 'OffSec', niveau: 'avance',
        note: 'La référence en test d’intrusion : examen 100 % pratique. Très valorisée par les cabinets de pentest.',
        termes: ['oscp', 'offensive security certified professional', 'offsec certified professional'] },
      { id: 'cism', nom: 'CISM', organisme: 'ISACA', niveau: 'avance',
        note: 'Management de la sécurité de l’information ; demande plusieurs années d’expérience.',
        termes: ['cism', 'certified information security manager'] },
      { id: 'cissp', nom: 'CISSP', organisme: 'ISC2', niveau: 'avance',
        note: 'La certification la plus demandée pour les postes de RSSI et d’architecte sécurité (5 ans d’expérience requis).',
        termes: ['cissp'] },
      RGPD_CNIL,
    ],
    leviers: [
      'Plateformes de CTF et de labs (Root-Me, TryHackMe, Hack The Box) : indiquez votre rang ou le nombre de challenges réussis.',
      'Un home lab documenté (Active Directory vulnérable, SIEM Wazuh ou Elastic, pare-feu pfSense) avec les étapes publiées sur GitHub ou un blog.',
      'Des write-ups de challenges ou une veille partagée (alertes CERT-FR, CVE marquantes) : la preuve d’une vraie curiosité technique.',
      'Bug bounty (YesWeHack, HackerOne) : même une seule vulnérabilité acceptée se valorise.',
      'Participer à des événements et associations (European Cyber Week, Le Hack, BSides, CTF étudiants).',
    ],
  },
  {
    id: 'reseaux',
    libelle: 'Réseaux & systèmes',
    detection: ['administrateur reseau', 'administrateur reseaux', 'administrateur systeme', 'administrateur systemes', 'administration reseau',
      'administration systeme', 'reseaux informatiques', 'infrastructure', 'tssr', 'technicien reseaux', 'lan', 'wan', 'vlan', 'routage',
      'switching', 'cisco', 'tcp/ip', 'dns', 'dhcp', 'active directory', 'gpo', 'windows server', 'linux', 'virtualisation', 'vmware',
      'proxmox', 'hyper-v', 'firewall', 'pare-feu', 'fortinet', 'stormshield', 'veeam', 'supervision reseau', 'zabbix', 'centreon', 'vpn',
      'sysadmin', 'network administrator', 'system administrator'],
    certifications: [
      { id: 'netacad', nom: 'Cours Cisco Networking Academy (NetAcad)', organisme: 'Cisco', niveau: 'debutant', gratuit: true,
        note: 'Plusieurs cours gratuits en ligne (introduction aux réseaux, Packet Tracer, cybersécurité) avec badge à afficher sur LinkedIn.',
        termes: ['netacad', 'cisco networking academy', 'networking academy'] },
      { id: 'netplus', nom: 'CompTIA Network+', organisme: 'CompTIA', niveau: 'debutant',
        note: 'Fondamentaux réseaux indépendants des constructeurs : bon point de départ avant le CCNA.',
        termes: ['network+', 'comptia network'] },
      { id: 'linux-ess', nom: 'LPI Linux Essentials ou LPIC-1', organisme: 'Linux Professional Institute', niveau: 'debutant',
        note: 'Valide l’administration Linux de base (ligne de commande, droits, services).',
        termes: ['linux essentials', 'lpic-1', 'lpic 1', 'lpic1', 'lpic'] },
      { id: 'ccna', nom: 'Cisco CCNA', organisme: 'Cisco', niveau: 'intermediaire',
        note: 'La certification réseau la plus citée dans les offres d’administrateur et de technicien réseaux (routage, commutation, VLAN, sécurité).',
        termes: ['ccna', 'cisco certified network associate'] },
      { id: 'titre-pro', nom: 'Titre professionnel TSSR ou AIS', organisme: 'Ministère du Travail (RNCP)', niveau: 'intermediaire',
        note: 'Technicien supérieur systèmes et réseaux (TSSR) ou Administrateur d’infrastructures sécurisées (AIS) : accessibles en alternance ou par VAE, bien connus des recruteurs.',
        termes: ['tssr', 'technicien superieur systemes et reseaux', 'administrateur d infrastructures securisees', 'titre professionnel ais'] },
      { id: 'rhcsa', nom: 'Red Hat Certified System Administrator (RHCSA)', organisme: 'Red Hat', niveau: 'intermediaire',
        note: 'Examen pratique d’administration Linux, très reconnu dans les infrastructures d’entreprise.',
        termes: ['rhcsa', 'red hat certified system administrator'] },
      { id: 'az-800', nom: 'Windows Server Hybrid Administrator (AZ-800 / AZ-801)', organisme: 'Microsoft', niveau: 'intermediaire',
        note: 'Administration Windows Server et Active Directory, sur site et dans Azure.',
        termes: ['az-800', 'az-801', 'windows server hybrid administrator'] },
      { id: 'csna', nom: 'Stormshield CSNA', organisme: 'Stormshield', niveau: 'intermediaire',
        note: 'Pare-feu français très présent dans le secteur public et les PME : un vrai plus pour les postes en France.',
        termes: ['csna', 'stormshield certified network administrator', 'certification stormshield'] },
      { id: 'fortinet', nom: 'Fortinet Certified Associate / Professional (ex-NSE)', organisme: 'Fortinet', niveau: 'intermediaire',
        note: 'Pare-feu FortiGate, très répandu : plusieurs modules d’initiation sont gratuits en ligne.',
        termes: ['fortinet certified', 'fortinet nse', 'nse 4', 'nse4', 'fcp network security'] },
      { id: 'vcp', nom: 'VMware Certified Professional (VCP-DCV)', organisme: 'VMware (Broadcom)', niveau: 'avance',
        note: 'Virtualisation vSphere : recherchée pour les postes d’ingénieur systèmes et d’infrastructure.',
        termes: ['vcp-dcv', 'vcp dcv', 'vmware certified professional', 'vcp'] },
      { id: 'ccnp', nom: 'Cisco CCNP Enterprise', organisme: 'Cisco', niveau: 'avance',
        note: 'Niveau ingénieur réseaux : routage avancé, SD-WAN, architecture.',
        termes: ['ccnp', 'cisco certified network professional'] },
    ],
    leviers: [
      'Un home lab documenté (Packet Tracer, GNS3 ou EVE-NG, Proxmox) : schéma réseau, VLAN, routage, Active Directory et GPO, publiés sur GitHub.',
      'Chiffrez votre périmètre : nombre de postes, de serveurs, de sites, d’utilisateurs, taux de disponibilité, délais de résolution.',
      'Des scripts PowerShell ou Bash qui automatisent une tâche réelle (création de comptes, sauvegardes, inventaire).',
      'Citez les outils exacts de l’offre (GLPI, Veeam, Zabbix, FortiGate…) dans les Compétences ET dans une expérience.',
    ],
  },
  {
    id: 'support',
    libelle: 'Support & service desk',
    detection: ['support informatique', 'support utilisateurs', 'helpdesk', 'help desk', 'service desk', 'technicien support', 'technicien de proximite',
      'support n1', 'support n2', 'niveau 1', 'niveau 2', 'glpi', 'servicenow', 'ticketing', 'gestion de parc', 'parc informatique',
      'deploiement de postes', 'masterisation', 'intune', 'sccm', 'itil'],
    certifications: [
      { id: 'google-it', nom: 'Google IT Support Professional Certificate', organisme: 'Google (Coursera)', niveau: 'debutant',
        note: 'Programme en ligne complet pour débuter dans le support informatique.',
        termes: ['google it support'] },
      { id: 'aplus', nom: 'CompTIA A+', organisme: 'CompTIA', niveau: 'debutant',
        note: 'Référence du support technique (matériel, systèmes, dépannage) : très présente dans les offres internationales.',
        termes: ['comptia a+', 'a+ certification'] },
      ITIL,
      { id: 'md-102', nom: 'Microsoft 365 Endpoint Administrator (MD-102)', organisme: 'Microsoft', niveau: 'intermediaire',
        note: 'Déploiement et gestion des postes avec Intune et Windows : idéale pour évoluer vers l’administration.',
        termes: ['md-102', 'md 102', 'endpoint administrator', 'md-100', 'md-101'] },
    ],
    leviers: [
      'Chiffrez votre activité : tickets traités par jour, taux de résolution au premier niveau, nombre d’utilisateurs ou de postes suivis.',
      'Citez l’outil de ticketing (GLPI, ServiceNow…) et les procédures que vous avez rédigées.',
      'Mettez en avant le savoir-être client : pédagogie, sens du service, gestion des utilisateurs mécontents.',
    ],
  },
  {
    id: 'cloud',
    libelle: 'Cloud & DevOps',
    detection: ['cloud', 'aws', 'azure', 'gcp', 'google cloud', 'devops', 'devsecops', 'ci/cd', 'docker', 'kubernetes', 'terraform', 'ansible',
      'infrastructure as code', 'sre', 'conteneurisation', 'microservices', 'jenkins', 'gitlab ci', 'github actions', 'architecte cloud', 'ingenieur cloud'],
    certifications: [
      { id: 'az-900', nom: 'Microsoft Azure Fundamentals (AZ-900)', organisme: 'Microsoft', niveau: 'debutant',
        note: 'Bases du cloud et d’Azure ; les parcours de préparation Microsoft Learn sont gratuits.',
        termes: ['az-900', 'az 900', 'azure fundamentals'] },
      { id: 'aws-ccp', nom: 'AWS Certified Cloud Practitioner', organisme: 'Amazon Web Services', niveau: 'debutant',
        note: 'Bases du cloud AWS ; préparation gratuite sur AWS Skill Builder.',
        termes: ['cloud practitioner', 'aws ccp', 'aws certified cloud practitioner'] },
      { id: 'aws-saa', nom: 'AWS Certified Solutions Architect – Associate', organisme: 'Amazon Web Services', niveau: 'intermediaire',
        note: 'L’une des certifications cloud les plus demandées par les recruteurs.',
        termes: ['solutions architect associate', 'aws saa', 'saa-c03', 'aws solutions architect'] },
      { id: 'az-104', nom: 'Microsoft Azure Administrator (AZ-104)', organisme: 'Microsoft', niveau: 'intermediaire',
        note: 'Administration Azure (réseau, identités, stockage, machines virtuelles).',
        termes: ['az-104', 'az 104', 'azure administrator'] },
      { id: 'gcp-ace', nom: 'Google Cloud Associate Cloud Engineer', organisme: 'Google Cloud', niveau: 'intermediaire',
        note: 'Déploiement et exploitation sur Google Cloud.',
        termes: ['associate cloud engineer', 'gcp ace'] },
      { id: 'terraform', nom: 'HashiCorp Terraform Associate', organisme: 'HashiCorp', niveau: 'intermediaire',
        note: 'Infrastructure as Code : souvent citée dans les offres DevOps.',
        termes: ['terraform associate', 'hashicorp certified'] },
      { id: 'cka', nom: 'Certified Kubernetes Administrator (CKA)', organisme: 'Linux Foundation / CNCF', niveau: 'avance',
        note: 'Examen pratique d’administration Kubernetes, très valorisé en DevOps et SRE.',
        termes: ['cka', 'certified kubernetes administrator', 'ckad'] },
    ],
    leviers: [
      'Un projet déployé de bout en bout (application conteneurisée, pipeline CI/CD, infrastructure en Terraform) avec le lien GitHub dans l’en-tête du CV.',
      'Indiquez les gains obtenus : temps de déploiement divisé par X, coûts cloud réduits de Y %, disponibilité.',
      'Les parcours gratuits Microsoft Learn, AWS Skill Builder et Google Cloud Skills Boost donnent des badges à afficher sur LinkedIn.',
    ],
  },
  {
    id: 'dev',
    libelle: 'Développement',
    detection: ['developpeur', 'developpeuse', 'developer', 'developpement logiciel', 'developpement web', 'software engineer', 'full stack',
      'front-end', 'back-end', 'javascript', 'typescript', 'react', 'angular', 'java', 'php', 'c#', 'dotnet', 'api rest', 'git', 'programmation'],
    certifications: [
      { id: 'pcep', nom: 'Python Institute PCEP / PCAP', organisme: 'Python Institute', niveau: 'debutant',
        note: 'Valide les bases (PCEP) puis un niveau associé (PCAP) en Python.',
        termes: ['pcep', 'pcap python', 'python institute'] },
      { id: 'ocp-java', nom: 'Oracle Certified Professional – Java SE Developer', organisme: 'Oracle', niveau: 'intermediaire',
        note: 'Reconnue dans les ESN et les grands comptes qui développent en Java.',
        termes: ['oracle certified professional java', 'ocp java', 'java se developer', 'ocpjp'] },
      { id: 'az-204', nom: 'Microsoft Azure Developer Associate (AZ-204)', organisme: 'Microsoft', niveau: 'intermediaire',
        note: 'Développement d’applications cloud sur Azure.',
        termes: ['az-204', 'az 204', 'azure developer associate'] },
      { id: 'psd', nom: 'Professional Scrum Developer (PSD I)', organisme: 'Scrum.org', niveau: 'intermediaire',
        note: 'Prouve que vous savez travailler en équipe Scrum (tests, intégration continue).',
        termes: ['professional scrum developer', 'psd i', 'psd 1'] },
    ],
    leviers: [
      'Un portfolio GitHub soigné : 2 ou 3 projets avec README clair, captures, démo en ligne et tests. Mettez le lien dans l’en-tête (champ « Site »).',
      'Reprenez exactement la stack de l’offre (langages, frameworks, versions) si vous l’avez réellement pratiquée.',
      'Contributions open source, hackathons, projets d’école menés en équipe : décrivez votre rôle et le résultat.',
    ],
  },
  {
    id: 'data',
    libelle: 'Data & BI',
    detection: ['data analyst', 'data scientist', 'data engineer', 'business intelligence', 'informatique decisionnelle', 'power bi', 'tableau software',
      'sql', 'etl', 'data visualisation', 'dataviz', 'machine learning', 'databricks', 'snowflake', 'data warehouse', 'analyse de donnees', 'python'],
    certifications: [
      { id: 'google-da', nom: 'Google Data Analytics Professional Certificate', organisme: 'Google (Coursera)', niveau: 'debutant',
        note: 'Programme complet pour débuter en analyse de données (SQL, tableurs, visualisation).',
        termes: ['google data analytics'] },
      { id: 'tableau', nom: 'Tableau Desktop Specialist', organisme: 'Tableau (Salesforce)', niveau: 'debutant',
        note: 'Certification d’entrée sur Tableau.',
        termes: ['tableau desktop specialist', 'tableau certified'] },
      { id: 'dp-900', nom: 'Microsoft Azure Data Fundamentals (DP-900)', organisme: 'Microsoft', niveau: 'debutant',
        note: 'Bases des données relationnelles, non relationnelles et analytiques dans le cloud.',
        termes: ['dp-900', 'dp 900', 'azure data fundamentals'] },
      PL300,
      { id: 'databricks', nom: 'Databricks Certified Data Engineer Associate', organisme: 'Databricks', niveau: 'intermediaire',
        note: 'Pipelines de données avec Spark et Databricks.',
        termes: ['databricks certified', 'data engineer associate'] },
    ],
    leviers: [
      'Un tableau de bord public (Power BI ou Tableau Public) construit sur des données ouvertes (data.gouv.fr, INSEE).',
      'Des notebooks Kaggle ou GitHub qui montrent une démarche complète : question, nettoyage, analyse, conclusion.',
      'Chiffrez l’impact : temps de reporting gagné, décisions prises grâce à vos analyses.',
    ],
  },
  {
    id: 'projet',
    libelle: 'Gestion de projet & agilité',
    detection: ['chef de projet', 'cheffe de projet', 'project manager', 'gestion de projet', 'pmo', 'agile', 'scrum', 'product owner', 'scrum master',
      'moa', 'amoa', 'business analyst', 'recette', 'cahier des charges', 'conduite du changement', 'prince2', 'pmp'],
    certifications: [
      { id: 'psm1', nom: 'Professional Scrum Master (PSM I)', organisme: 'Scrum.org', niveau: 'debutant',
        note: 'Certification Scrum reconnue, sans obligation de formation préalable.',
        termes: ['psm i', 'psm 1', 'psm1', 'professional scrum master', 'csm', 'certified scrummaster'] },
      { id: 'pspo1', nom: 'Professional Scrum Product Owner (PSPO I)', organisme: 'Scrum.org', niveau: 'debutant',
        note: 'Pour les rôles de Product Owner, de business analyst et d’AMOA.',
        termes: ['pspo', 'pspo i', 'professional scrum product owner'] },
      ITIL,
      { id: 'prince2', nom: 'PRINCE2 Foundation', organisme: 'PeopleCert / Axelos', niveau: 'debutant',
        note: 'Méthode de gestion de projet structurée, appréciée dans les grands groupes et le secteur public.',
        termes: ['prince2', 'prince 2'] },
      { id: 'capm', nom: 'CAPM', organisme: 'PMI', niveau: 'debutant',
        note: 'Bases de la gestion de projet selon le PMI, sans expérience requise.',
        termes: ['capm', 'certified associate in project management'] },
      { id: 'pmp', nom: 'PMP', organisme: 'PMI', niveau: 'avance',
        note: 'La certification de chef de projet la plus reconnue (3 ans d’expérience en gestion de projet requis).',
        termes: ['pmp', 'project management professional'] },
    ],
    leviers: [
      'Chiffrez vos projets : budget, durée, nombre d’utilisateurs ou de sites, respect des délais.',
      'Nommez la méthode (Scrum, cycle en V) et les outils (Jira, Confluence, MS Project).',
      'Montrez la conduite du changement : formations animées, supports rédigés, adoption mesurée.',
    ],
  },
  {
    id: 'finance',
    libelle: 'Finance, audit & contrôle de gestion',
    detection: ['m&a', 'fusions acquisitions', 'audit', 'auditeur', 'private equity', 'valorisation', 'valuation', 'analyste financier', 'banque',
      'marches financiers', 'controle de gestion', 'controleur de gestion', 'comptabilite', 'consolidation', 'ifrs', 'fp&a', 'tresorerie',
      'transaction services', 'modelisation financiere', 'gestion d actifs', 'asset management', 'risk management'],
    certifications: [
      { id: 'amf', nom: 'Certification AMF', organisme: 'AMF (via des organismes certifiés)', niveau: 'debutant',
        note: 'Exigée pour de nombreuses fonctions en banque, gestion d’actifs et conseil en investissement ; souvent passée en école ou prise en charge par l’employeur.',
        termes: ['certification amf', 'examen amf', 'amf'] },
      { id: 'bmc', nom: 'Bloomberg Market Concepts (BMC)', organisme: 'Bloomberg', niveau: 'debutant',
        note: 'Module en ligne court sur les marchés ; souvent accessible gratuitement via le terminal Bloomberg de votre école.',
        termes: ['bloomberg market concepts', 'bmc'] },
      { id: 'fmva', nom: 'Financial Modeling & Valuation Analyst (FMVA)', organisme: 'Corporate Finance Institute', niveau: 'intermediaire',
        note: 'Modélisation financière et valorisation sur Excel : utile pour M&A, Transaction Services et FP&A.',
        termes: ['fmva', 'financial modeling & valuation analyst', 'financial modeling and valuation analyst'] },
      { id: 'dipifr', nom: 'Diploma in IFRS (DipIFR)', organisme: 'ACCA', niveau: 'intermediaire',
        note: 'Normes IFRS : valorisé en audit, consolidation et reporting groupe.',
        termes: ['dipifr', 'diploma in ifrs', 'diploma in international financial reporting'] },
      { id: 'cfa1', nom: 'CFA Level I', organisme: 'CFA Institute', niveau: 'intermediaire',
        note: 'Signal fort en gestion d’actifs, recherche actions et banque d’affaires, même au niveau I.',
        termes: ['cfa', 'chartered financial analyst', 'cfa level i', 'cfa level 1'] },
      { id: 'frm', nom: 'FRM Part I', organisme: 'GARP', niveau: 'intermediaire',
        note: 'Pour la gestion des risques (marché, crédit) en banque et en assurance.',
        termes: ['frm', 'financial risk manager'] },
      { id: 'cia', nom: 'Certified Internal Auditor (CIA)', organisme: 'IIA (IFACI en France)', niveau: 'avance',
        note: 'La référence de l’audit interne.',
        termes: ['certified internal auditor', 'cia ifaci'] },
      { id: 'dscg', nom: 'DSCG / DEC', organisme: 'Diplômes d’État (expertise comptable)', niveau: 'avance',
        note: 'Parcours de l’expertise comptable et du commissariat aux comptes : très lisible pour les cabinets d’audit.',
        termes: ['dscg', 'diplome d expertise comptable', 'expertise comptable', 'expert-comptable'] },
    ],
    leviers: [
      'Excel avancé prouvé (score TOSA ou MOS) et un modèle financier propre que vous pouvez montrer en entretien.',
      'Concours et cas pratiques : CFA Research Challenge, stock pitch, challenges de cabinets ; citez votre classement.',
      'Une note d’analyse sur une opération récente du secteur visé : excellent support pour la lettre et l’entretien.',
      'Chiffrez vos missions : taille des dossiers (M€), nombre d’entités, délais de clôture.',
    ],
  },
  {
    id: 'rh',
    libelle: 'RH, paie & SIRH',
    detection: ['paie', 'payroll', 'ressources humaines', 'human resources', 'sirh', 'hris', 'dsn', 'gestionnaire de paie', 'administration du personnel',
      'recrutement', 'charge rh', 'charge de recrutement', 'workday', 'silae', 'successfactors', 'adp', 'convention collective', 'droit du travail'],
    certifications: [
      { id: 'tp-paie', nom: 'Titre professionnel Gestionnaire de paie', organisme: 'Ministère du Travail (RNCP)', niveau: 'intermediaire',
        note: 'Titre reconnu par les cabinets et services paie ; accessible en alternance ou par VAE.',
        termes: ['titre professionnel gestionnaire de paie', 'tp gestionnaire de paie'] },
      { id: 'editeurs-paie', nom: 'Formations éditeurs (Silae, Cegid, Sage, ADP…)', organisme: 'Éditeurs et partenaires', niveau: 'intermediaire',
        note: 'Certaines sont certifiantes : précisez le module (paie, GTA, DSN) et la version dans vos Compétences.',
        termes: ['certification silae', 'certification cegid', 'certification sage paie', 'formation silae'] },
      PL300,
      { id: 'workday', nom: 'Certification Workday (Workday Pro)', organisme: 'Workday', niveau: 'avance',
        note: 'Réservée aux clients et partenaires Workday : un vrai plus pour un poste SIRH chez un client ou un intégrateur.',
        termes: ['workday pro', 'certification workday', 'workday certified'] },
      { id: 'sf-ec', nom: 'SAP SuccessFactors Employee Central', organisme: 'SAP', niveau: 'avance',
        note: 'Certification consultant SuccessFactors : recherchée par les intégrateurs SIRH.',
        termes: ['successfactors employee central', 'certification successfactors', 'sap certified application associate successfactors'] },
      RGPD_CNIL,
    ],
    leviers: [
      'Chiffrez votre périmètre : nombre de bulletins par mois, effectif géré, nombre de conventions collectives et d’établissements.',
      'Citez les logiciels exacts (Silae, ADP, Cegid, Workday…) et les modules utilisés (paie, GTA, DSN, portail RH).',
      'Montrez votre veille sociale : loi de finances, PLFSS, évolutions de la DSN, taux et plafonds de l’année.',
      'Pour le SIRH : décrivez un projet (paramétrage, recette, reprise de données, formation des utilisateurs) avec un résultat mesurable.',
    ],
  },
  // Commerce, marketing, supply chain, industrie, BTP, santé, juridique, assistanat, hôtellerie, formation
  ...PARCOURS_SECTEURS,
];

// ---------------------------------------------------------------------------
//  Utile pour tous les profils
// ---------------------------------------------------------------------------
export const TRANSVERSAL: Parcours = {
  id: 'transversal',
  libelle: 'Pour tous les profils',
  detection: [],
  certifications: [
    { id: 'anglais', nom: 'TOEIC, TOEFL, IELTS ou Linguaskill', organisme: 'ETS, British Council, Cambridge…', niveau: 'debutant',
      note: 'Chiffrez votre anglais : « TOEIC 905 » convainc plus que « anglais courant ».',
      termes: ['toeic', 'toefl', 'ielts', 'linguaskill', 'cambridge english', 'b2 first', 'c1 advanced', 'bright english'] },
    { id: 'tosa', nom: 'TOSA ou MOS Excel', organisme: 'Isograd / Microsoft', niveau: 'debutant',
      note: 'Un score Excel certifié (TOSA sur 1000, MOS Expert) prouve un niveau souvent simplement déclaré.',
      termes: ['tosa', 'mos excel', 'microsoft office specialist', 'mos expert'] },
    { id: 'pix', nom: 'Certification Pix', organisme: 'GIP Pix', niveau: 'debutant',
      note: 'Compétences numériques reconnues par l’État ; la plateforme d’entraînement est gratuite.',
      termes: ['pix', 'certification pix'] },
    { id: 'voltaire', nom: 'Certificat Voltaire', organisme: 'Projet Voltaire', niveau: 'debutant',
      note: 'Atteste la maîtrise de l’orthographe : apprécié pour les postes avec beaucoup d’écrit (RH, audit, conseil).',
      termes: ['certificat voltaire', 'projet voltaire'] },
  ],
  leviers: [
    'Reprenez l’intitulé exact de l’offre en titre du CV et dans la première ligne de l’accroche.',
    'Une certification « en cours » se valorise : indiquez-la avec la date d’examen prévue.',
    'Profil LinkedIn aligné sur le CV (même titre, mêmes dates) avec l’URL personnalisée dans l’en-tête.',
    'Une recommandation LinkedIn d’un tuteur ou d’un manager, et une relance une semaine après l’envoi.',
  ],
};
