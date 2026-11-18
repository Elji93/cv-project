// Tests de l'import : colonnes Canva, nettoyage, découpage en sections, classement
import { describe, expect, it } from 'vitest';
import { reconstruireLignes, retirerEntetesEtPieds, trouverGouttiere, type Morceau } from '../lib/import/lirePdf';
import { ligneVide, nettoyerLigne } from '../lib/import/nettoyage';
import { lignesDepuisTexte } from '../lib/import/lireDocx';
import { decouperCv, detecterTitre, extraireDates, recollerParagraphes, separerNom } from '../lib/import/decouperSections';
import { classerFragment, cvDepuisImport } from '../lib/import/classer';

/** Fabrique un morceau de texte positionné (y décroissant = vers le bas de la page) */
const m = (texte: string, x: number, y: number, taille = 10): Morceau => ({ texte, x, y, largeur: texte.length * taille * 0.5, taille });

describe('PDF en deux colonnes (type Canva)', () => {
  // Colonne de gauche (x=30) : contact, compétences, langues ; colonne de droite (x=230) : nom, profil, expérience
  const gauche = ['CONTACT', 'camille@mail.fr', '06 12 34 56 78', 'Paris', 'COMPÉTENCES', 'Excel', 'IFRS', 'LANGUES', 'Anglais', 'Courant (C1)'];
  const droite = ['CAMILLE MARTIN', 'Analyste financière', 'PROFIL', 'Analyste diplômée, 2 ans en audit.', 'EXPÉRIENCE', 'Auditrice junior', 'Cabinet Big 4 | 2023 - 2025', '• Audité 6 clients'];
  const morceaux = [
    ...gauche.map((t, i) => m(t, 30, 780 - i * 18, 9)),
    ...droite.map((t, i) => m(t, 230, 780 - i * 18, i === 0 ? 20 : 10)),
  ];

  it('trouve la gouttière entre les colonnes', () => {
    const g = trouverGouttiere(morceaux, 595)!;
    expect(g).toBeGreaterThan(80);
    expect(g).toBeLessThan(230);
  });

  it('lit la colonne de gauche puis celle de droite (pas de lignes mélangées)', () => {
    const lignes = reconstruireLignes(morceaux, 595).map(l => l.texte);
    expect(lignes.slice(0, gauche.length)).toEqual(gauche);
    expect(lignes.slice(gauche.length)).toEqual(droite);
  });

  it('découpe le CV en sections malgré les colonnes', () => {
    const r = decouperCv(reconstruireLignes(morceaux, 595));
    const p = r.donnees.infosPerso;
    expect([p.prenom, p.nom]).toEqual(['Camille', 'MARTIN']);
    expect(p.titre).toBe('Analyste financière');
    expect(p.email).toBe('camille@mail.fr');
    expect(p.ville).toBe('Paris');
    expect(r.donnees.accroche).toContain('2 ans en audit');
    expect(r.donnees.experiences[0]).toMatchObject({ poste: 'Auditrice junior', entreprise: 'Cabinet Big 4' });
    expect(r.donnees.experiences[0].periode).toEqual({ debut: '2023', fin: '2025', enCours: false });
    expect(r.donnees.langues[0]).toMatchObject({ langue: 'Anglais', niveau: 'C1' });
    expect(r.donnees.competences.flatMap(g => g.elements)).toEqual(expect.arrayContaining(['Excel', 'IFRS']));
  });
});

describe('nettoyage', () => {
  it('retire icônes et barres de niveau, garde les puces', () => {
    expect(nettoyerLigne('📞 06 12 34 56 78')).toBe('06 12 34 56 78');
    expect(nettoyerLigne('Excel ●●●●○')).toBe('Excel');
    expect(nettoyerLigne('● Analysé 30 dossiers')).toBe('• Analysé 30 dossiers');
    expect(nettoyerLigne('- Participé à 4 deals')).toBe('• Participé à 4 deals');
  });
});

describe('titres et dates', () => {
  it('reconnaît les titres créatifs', () => {
    const l = (texte: string, taille = 10) => ({ texte, taille, zone: 'pleine' as const });
    expect(detecterTitre(l('MON PARCOURS PROFESSIONNEL'))).toBe('experiences');
    expect(detecterTitre(l('Ce que je sais faire'))).toBe('competences');
    expect(detecterTitre(l('Work Experience'))).toBe('experiences');
    expect(detecterTitre(l('À propos de moi'))).toBe('accroche');
    expect(detecterTitre(l("J'ai piloté la formation de 20 personnes"))).toBeNull();
  });
  it('lit les périodes', () => {
    expect(extraireDates('Sept. 2022 – Aujourd’hui')?.periode).toEqual({ debut: '2022-09', fin: '', enCours: true });
    expect(extraireDates('Depuis janvier 2024')?.periode).toEqual({ debut: '2024-01', fin: '', enCours: true });
    expect(extraireDates('(06/2021 - 08/2021)')?.periode).toEqual({ debut: '2021-06', fin: '2021-08', enCours: false });
  });
  it('sépare prénom et nom', () => {
    expect(separerNom('MARTIN Camille')).toEqual(['Camille', 'MARTIN']);
    expect(separerNom('Jean-Paul Dupont')).toEqual(['Jean-Paul', 'Dupont']);
  });
});

describe('texte collé et « À classer »', () => {
  const texte = `Léa Durand
Contrôleuse de gestion
lea.durand@mail.fr | +33 6 11 22 33 44 | Lyon | linkedin.com/in/lea-durand

EXPÉRIENCES PROFESSIONNELLES
Contrôleuse de gestion junior chez Groupe SEB
Sept. 2023 - Présent
- Piloté le budget annuel (120 M€)

FORMATION
Master CCA - IAE Lyon - 2021 - 2023

PROJETS
Création d'un club d'investissement (15 membres)

LANGUES
Anglais : C1 | Allemand : B1`;
  const r = decouperCv(lignesDepuisTexte(texte));

  it('remplit les sections', () => {
    expect(r.donnees.infosPerso).toMatchObject({ prenom: 'Léa', nom: 'Durand', titre: 'Contrôleuse de gestion', ville: 'Lyon', linkedin: 'linkedin.com/in/lea-durand' });
    expect(r.donnees.experiences[0]).toMatchObject({ poste: 'Contrôleuse de gestion junior', entreprise: 'Groupe SEB' });
    expect(r.donnees.experiences[0].periode.enCours).toBe(true);
    expect(r.donnees.formations[0]).toMatchObject({ diplome: 'Master CCA', etablissement: 'IAE Lyon' });
    expect(r.donnees.langues.map(l => l.niveau)).toEqual(['C1', 'B1']);
  });

  it('garde les sections inconnues dans « À classer », puis les classe en un clic', () => {
    expect(r.aClasser).toHaveLength(1);
    expect(r.aClasser[0].sectionDetectee).toBe('experiences');
    const cv = cvDepuisImport(r);
    expect(cv.templateId).toBe('finance');
    classerFragment(cv, cv.aClasser[0].id, 'experiences');
    expect(cv.aClasser).toHaveLength(0);
    expect(cv.donnees.experiences.map(e => e.poste)).toContain("Création d'un club d'investissement (15 membres)");
  });
});

describe('cas réels de PDF Canva', () => {
  const texte = `CONTACT
in linkedin.com/in/sarah-
benali
EXPÉRIENCE
Contrôleuse de gestion
Groupe ABC | Lyon
Janv. 2023 - Aujourd'hui
• Piloté le budget annuel de 45 M€ de 3 usines et animé
les revues mensuelles avec les directeurs
PROJETS
Création d'un tableau de bord RSE pour une association
(bénévolat)`;
  const r = decouperCv(lignesDepuisTexte(texte));

  it('recolle une URL LinkedIn coupée en deux lignes', () => {
    expect(r.donnees.infosPerso.linkedin).toBe('linkedin.com/in/sarah-benali');
  });
  it('recolle une puce coupée en deux lignes', () => {
    expect(r.donnees.experiences[0].puces.map(p => p.texte)).toEqual(['Piloté le budget annuel de 45 M€ de 3 usines et animé les revues mensuelles avec les directeurs']);
    expect(r.donnees.experiences[0].ville).toBe('Lyon');
  });
  it('ne perd pas une ligne qui ressemble à un titre (« (bénévolat) »)', () => {
    expect(r.aClasser.map(f => f.texte).join('\n')).toContain('(bénévolat)');
  });
});

describe('titres aux lettres espacées et blocs sans titre', () => {
  it('recolle « E X P É R I E N C E S »', () => {
    expect(nettoyerLigne('E X P É R I E N C E S')).toBe('EXPÉRIENCES');
    expect(nettoyerLigne('P R O F I L  P R O')).toBe('PROFIL PRO');
    expect(nettoyerLigne('Excel, VBA, R')).toBe('Excel, VBA, R');
  });

  it('range les blocs datés même sans titre de section reconnu', () => {
    const texte = `Sarah BENALI
Contrôleuse de gestion
MON CHEMIN
Contrôleuse de gestion
Groupe ABC
2023 - 2025
• Piloté le budget de 45 M€
Master Finance
IAE Lyon
2020 - 2022
Permis B, mobile`;
    // « MON CHEMIN » : titre inconnu, plus gros que le texte (comme dans un PDF)
    const lignes = lignesDepuisTexte(texte).map(l => (l.texte === 'MON CHEMIN' ? { ...l, taille: 14 } : l.texte === 'Sarah BENALI' ? { ...l, taille: 22 } : l));
    const r = decouperCv(lignes);
    expect(r.donnees.experiences.map(e => e.entreprise)).toEqual(['Groupe ABC']);
    expect(r.donnees.formations.map(f => f.etablissement)).toEqual(['IAE Lyon']);
    // rien n'est perdu : la ligne finit dans la formation (détail) ou dans « À classer »
    expect(JSON.stringify(r)).toContain('Permis B');
  });
});

describe('classer seulement certaines lignes', () => {
  it('envoie les lignes cochées et garde le reste à classer', async () => {
    const { classerLignes } = await import('../lib/import/classer');
    const { cvVierge } = await import('../lib/cv');
    const cv = cvVierge();
    cv.donnees.experiences = [];
    const aClasser = [{ id: 'f', texte: 'Analyste\nBanque XYZ\n2022 - 2023\nPermis B', sectionDetectee: null }];
    const reste = classerLignes(cv.donnees, aClasser, 'f', [0, 1, 2], 'experiences');
    expect(cv.donnees.experiences[0]).toMatchObject({ poste: 'Analyste', entreprise: 'Banque XYZ' });
    expect(reste).toEqual([{ id: 'f', texte: 'Permis B', sectionDetectee: null }]);
    expect(classerLignes(cv.donnees, reste, 'f', [], null)).toEqual([]);
  });
});

describe('titre de section inconnu après une section', () => {
  it("n'aspire pas les expériences dans l'accroche", () => {
    const texte = `Sarah BENALI
PROFIL
Contrôleuse de gestion avec 3 ans d'expérience.
MON CHEMIN
Contrôleuse de gestion
Groupe ABC
2023 - 2025
• Piloté le budget de 45 M€`;
    const lignes = lignesDepuisTexte(texte).map(l => (l.texte === 'MON CHEMIN' ? { ...l, taille: 14 } : l));
    const r = decouperCv(lignes);
    expect(r.donnees.accroche).toBe("Contrôleuse de gestion avec 3 ans d'expérience.");
    expect(r.donnees.experiences[0]).toMatchObject({ poste: 'Contrôleuse de gestion', entreprise: 'Groupe ABC' });
  });
});

describe('mises en page Canva courantes : expériences', () => {
  const r = decouperCv(lignesDepuisTexte(`EXPÉRIENCES
Analyste financière
KPMG
Sept. 2022 - Août 2023
Gestion du reporting mensuel
Analyse des écarts budgétaires
Contrôleur de gestion junior
Groupe Renault | Paris
2023 - Aujourd'hui
Suivi des KPIs de production
Préparation du budget 2024
2021 - 2022
Stagiaire Audit
Mazars, Lyon
Revue des comptes clients
Participation à l'inventaire
BNP PARIBAS
Chargée d'affaires entreprises
2020 - 2021
Accompagnement de 40 PME`));
  const e = r.donnees.experiences;

  it('trouve chaque expérience', () => expect(e).toHaveLength(4));
  it('ne confond pas description et intitulé de poste', () => {
    expect(e.map(x => x.poste)).toEqual(['Analyste financière', 'Contrôleur de gestion junior', 'Stagiaire Audit', "Chargée d'affaires entreprises"]);
    expect(e[0].puces.map(p => p.texte)).toEqual(['Gestion du reporting mensuel', 'Analyse des écarts budgétaires']);
    expect(e[1].puces.map(p => p.texte)).toEqual(['Suivi des KPIs de production', 'Préparation du budget 2024']);
  });
  it('sépare entreprise et ville', () => {
    expect(e.map(x => x.entreprise)).toEqual(['KPMG', 'Groupe Renault', 'Mazars', 'BNP PARIBAS']);
    expect(e.map(x => x.ville)).toEqual(['', 'Paris', 'Lyon', '']);
  });
});

describe('mises en page Canva courantes : formation', () => {
  const f = decouperCv(lignesDepuisTexte(`FORMATION
IAE LYON
Master Finance d'entreprise
Lyon
2020 - 2022
Master Contrôle de gestion - IAE Lyon, Lyon
2019 - 2021
2016 - 2019
Licence Économie-Gestion
Université Jean Moulin Lyon 3 | Villeurbanne
ESSEC Business School
Programme Grande École — Majeure Finance
Cergy
2018 - 2021`)).donnees.formations;

  it('distingue diplôme, école et ville', () => {
    expect(f.map(x => [x.diplome, x.etablissement, x.ville])).toEqual([
      ["Master Finance d'entreprise", 'IAE LYON', 'Lyon'],
      ['Master Contrôle de gestion', 'IAE Lyon', 'Lyon'],
      ['Licence Économie-Gestion', 'Université Jean Moulin Lyon 3', 'Villeurbanne'],
      ['Programme Grande École — Majeure Finance', 'ESSEC Business School', 'Cergy'],
    ]);
  });
});

describe('nom sur deux lignes', () => {
  const pdf = (lignes: [string, number][]) => lignes.map(([texte, taille]) => ({ texte, taille, zone: 'pleine' as const }));

  it('PDF : prénom et nom en gros sur deux lignes', () => {
    const r = decouperCv(pdf([['Camille', 28], ['MARTIN', 28], ['Analyste financière', 13], ['camille@mail.fr', 10], ['PROFIL', 12], ['Texte du profil.', 10]]));
    expect(r.donnees.infosPerso).toMatchObject({ prenom: 'Camille', nom: 'MARTIN', titre: 'Analyste financière' });
  });

  it('PDF : nom de famille en premier', () => {
    const r = decouperCv(pdf([['MARTIN', 26], ['Camille', 26], ['Contrôleuse de gestion', 12], ['PROFIL', 12], ['Texte.', 10]]));
    expect(r.donnees.infosPerso).toMatchObject({ prenom: 'Camille', nom: 'MARTIN', titre: 'Contrôleuse de gestion' });
  });

  it('PDF : nom composé', () => {
    const r = decouperCv(pdf([['Marie-Anne', 26], ['DE LA FONTAINE', 26], ['Auditrice junior', 12], ['PROFIL', 12], ['Texte.', 10]]));
    expect(r.donnees.infosPerso).toMatchObject({ prenom: 'Marie-Anne', nom: 'DE LA FONTAINE', titre: 'Auditrice junior' });
  });

  it('PDF : nom sur une ligne suivi d’un titre en majuscules', () => {
    const r = decouperCv(pdf([['Camille MARTIN', 28], ['ANALYSTE', 26], ['PROFIL', 12], ['Texte.', 10]]));
    expect(r.donnees.infosPerso).toMatchObject({ prenom: 'Camille', nom: 'MARTIN', titre: 'ANALYSTE' });
  });

  it('texte collé : « Camille » puis « MARTIN »', () => {
    const r = decouperCv(lignesDepuisTexte('Camille\nMARTIN\nAnalyste M&A\ncamille@mail.fr'));
    expect(r.donnees.infosPerso).toMatchObject({ prenom: 'Camille', nom: 'MARTIN', titre: 'Analyste M&A' });
  });
});

describe('dates difficiles', () => {
  const periodes = (texte: string) => decouperCv(lignesDepuisTexte('EXPÉRIENCES\n' + texte)).donnees.experiences.map(e => e.periode);
  it('début et fin sur deux lignes', () => {
    expect(periodes('Analyste\nKPMG\nSept. 2022 –\nJuin 2023\n• Audité 5 clients')).toEqual([{ debut: '2022-09', fin: '2023-06', enCours: false }]);
    expect(periodes('Analyste\nKPMG\nSept. 2022\nAujourd’hui')).toEqual([{ debut: '2022-09', fin: '', enCours: true }]);
  });
  it('mois sans année au début, année scolaire, années sur 2 chiffres', () => {
    expect(extraireDates('Juin - Août 2023')?.periode).toEqual({ debut: '2023-06', fin: '2023-08', enCours: false });
    expect(extraireDates('Novembre - Février 2023')?.periode).toEqual({ debut: '2022-11', fin: '2023-02', enCours: false });
    expect(extraireDates('2021/2022')?.periode).toEqual({ debut: '2021', fin: '2022', enCours: false });
    expect(extraireDates('09/22 - 06/23')?.periode).toEqual({ debut: '2022-09', fin: '2023-06', enCours: false });
  });
});

describe('titre du CV', () => {
  const pdf = (lignes: [string, number][]) => lignes.map(([texte, taille]) => ({ texte, taille, zone: 'pleine' as const }));
  it('titre sur deux lignes', () => {
    const r = decouperCv(pdf([['Camille MARTIN', 26], ['Analyste financière', 14], ['en alternance', 14], ['camille@mail.fr', 10], ['PROFIL', 12], ['Texte.', 10]]));
    expect(r.donnees.infosPerso.titre).toBe('Analyste financière en alternance');
  });
  it('écriture inclusive conservée', () => {
    const r = decouperCv(lignesDepuisTexte('Camille Martin\nAuditeur·rice financier·e\ncamille@mail.fr'));
    expect(r.donnees.infosPerso.titre).toBe('Auditeur·rice financier·e');
  });
});

describe('formation : spécialités, lycées, villes', () => {
  const f = decouperCv(lignesDepuisTexte(`FORMATION
Baccalauréat général
Spécialités Mathématiques et SES
Lycée Saint-Exupéry
LYON
2018 - 2021
BTS Comptabilité et Gestion
Lycée La Martinière Duchère, Lyon
2019 - 2021
Licence Économie et Gestion
Parcours Finance
Université Paris Nanterre
Nanterre
2021 - 2024`)).donnees.formations;
  it('range chaque information au bon endroit', () => {
    expect(f.map(x => [x.diplome, x.etablissement, x.ville])).toEqual([
      ['Baccalauréat général — Spécialités Mathématiques et SES', 'Lycée Saint-Exupéry', 'LYON'],
      ['BTS Comptabilité et Gestion', 'Lycée La Martinière Duchère', 'Lyon'],
      ['Licence Économie et Gestion — Parcours Finance', 'Université Paris Nanterre', 'Nanterre'],
    ]);
  });
});

describe('date de naissance, rythme d’alternance, savoir-être, accents', () => {
  const r = decouperCv(lignesDepuisTexte(`Camille MARTIN
Analyste financière en alternance – rythme 3 sem. entreprise / 1 sem. école
camille@mail.fr | 06 12 34 56 78 | Née le 12/03/2003 | Lyon
PROFIL
Étudiante en Master, je souhaite travailler à un rythme soutenu.
COMPÉTENCES
Excel, IFRS, Rigueur, Esprit d'équipe
QUALITÉS
Curiosité, Autonomie
FORMATION
Master Finance
École de Management de Lyon (Écully)
2023 - 2025
Baccalauréat STMG
Établissement Saint-Marc
LYON
2018 - 2021`));
  const d = r.donnees;

  it('détecte la date de naissance', () => expect(d.infosPerso.dateNaissance).toBe('Née le 12/03/2003'));
  it('met le rythme dans le profil et garde le titre', () => {
    expect(d.rythmeAlternance).toBe('3 sem. entreprise / 1 sem. école');
    expect(d.infosPerso.titre).toBe('Analyste financière en alternance');
    expect(d.accroche).toContain('rythme soutenu');
  });
  it('range les qualités dans Savoir-être', () => {
    expect(d.qualites).toEqual(expect.arrayContaining(['Curiosité', 'Autonomie', 'Rigueur', "Esprit d'équipe"]));
    expect(d.competences.flatMap(g => g.elements)).toEqual(expect.arrayContaining(['Excel', 'IFRS']));
    expect(d.competences.flatMap(g => g.elements)).not.toContain('Rigueur');
  });
  it('reconnaît « École » et « Établissement » malgré l’accent, et la ville entre parenthèses', () => {
    expect(d.formations.map(f => [f.diplome, f.etablissement, f.ville])).toEqual([
      ['Master Finance', 'École de Management de Lyon', 'Écully'],
      ['Baccalauréat STMG', 'Établissement Saint-Marc', 'LYON'],
    ]);
  });
});

describe('colonnes Canva difficiles', () => {
  const m2 = (texte: string, x: number, y: number, taille = 10, largeur?: number): Morceau =>
    ({ texte, x, y, largeur: largeur ?? texte.length * taille * 0.5, taille });
  const barre = ['CONTACT', 'lea@mail.fr', '06 11 22 33 44', 'Lyon', 'COMPÉTENCES', 'PowerPoint', 'Excel', 'SAP', 'LANGUES', 'Anglais C1'];
  const principal = ['PROFIL', 'Contrôleuse de gestion, 3 ans.', 'EXPÉRIENCES', 'Contrôleuse de gestion', 'Groupe ABC', '2022 - 2025', '• Piloté le budget de 45 M€', 'FORMATION', 'Master CCA', 'IAE Lyon', '2020 - 2022'];

  it('barre à gauche + nom en grand qui traverse les deux colonnes', () => {
    const morceaux = [
      m2('LÉA DURAND', 150, 800, 28, 300), // traverse la gouttière
      ...barre.map((t, i) => m2(t, 30, 740 - i * 18, 9)),
      ...principal.map((t, i) => m2(t, 230, 740 - i * 18)),
    ];
    const r = decouperCv(reconstruireLignes(morceaux, 595));
    expect([r.donnees.infosPerso.prenom, r.donnees.infosPerso.nom]).toEqual(['Léa', 'DURAND']);
    expect(r.donnees.experiences[0]).toMatchObject({ poste: 'Contrôleuse de gestion', entreprise: 'Groupe ABC', ville: '' });
    expect(r.donnees.formations[0]).toMatchObject({ diplome: 'Master CCA', etablissement: 'IAE Lyon' });
    expect(r.donnees.competences.flatMap(g => g.elements)).toEqual(expect.arrayContaining(['PowerPoint', 'Excel', 'SAP']));
  });

  it('barre à droite', () => {
    const morceaux = [
      ...principal.map((t, i) => m2(t, 40, 780 - i * 18)),
      ...barre.map((t, i) => m2(t, 420, 780 - i * 18, 9)),
    ];
    const r = decouperCv(reconstruireLignes(morceaux, 595));
    expect(r.donnees.infosPerso.email).toBe('lea@mail.fr');
    expect(r.donnees.experiences).toHaveLength(1);
    expect(r.donnees.experiences[0].entreprise).toBe('Groupe ABC');
    expect(r.donnees.competences.flatMap(g => g.elements)).toEqual(expect.arrayContaining(['PowerPoint']));
  });

  it('une seule colonne avec dates alignées à droite : pas de fausses colonnes', () => {
    const lignes: Morceau[] = [];
    ['Cabinet Big 4', 'Auditrice', '• Audité 6 clients', 'Banque XYZ', 'Analyste', '• Analysé 30 dossiers', 'ESSEC', 'Master Finance'].forEach((t, i) => lignes.push(m2(t, 40, 700 - i * 18)));
    ['Paris', 'Sept. 2024 – Août 2025', 'Lyon', 'Janv. 2023 – Juin 2023', 'Cergy', '2021 – 2023'].forEach((t, i) => {
      const largeur = t.length * 5;
      lignes.push(m2(t, 555 - largeur, 700 - [0, 1, 3, 4, 6, 7][i] * 18, 10, largeur));
    });
    expect(trouverGouttiere(lignes, 595)).toBeNull();
  });

  it('« PowerPoint » n’est jamais une ville', () => {
    const r = decouperCv(lignesDepuisTexte('EXPÉRIENCES\nAssistante de gestion\nCabinet ABC\nPowerpoint\n2022 - 2023'));
    expect(r.donnees.experiences[0].ville).toBe('');
  });

  it('« Aptitudes » va dans Compétences', () => {
    const r = decouperCv(lignesDepuisTexte('APTITUDES\nAnalyse financière, Excel'));
    expect(r.donnees.qualites).toEqual([]);
    expect(r.donnees.competences.flatMap(g => g.elements)).toEqual(expect.arrayContaining(['Analyse financière', 'Excel']));
  });
});

describe('CV une colonne avec étiquettes à gauche et dates à droite (type LibreOffice / Word)', () => {
  // Structure inspirée d'un vrai CV (contenu rendu anonyme)
  const r = decouperCv(recollerParagraphes(lignesDepuisTexte(`Prénom NOM
ALTERNANCE - CONSULTANTE SIRH / MOA
Future étudiante en Master SIRH, je m'oriente vers la gestion de projet et la maîtrise
d'ouvrage SIRH grâce à mon intérêt pour la logique des outils et l'analyse des données.
prenom.nom@mail.fr | Bondy (93140) | 06 00 00 00 00 | Née le 01/01/2001 | LinkedIn : @prenom-nom
Rythme d'alternance : Contrat de 2 ans Master SIRH · Présence à l'école 3 jours: lundi, mardi,
mercredi (tous les 15 jours)
COMPÉTENCES
SIRH & Fonctionnel | Paramétrage de progiciel (absences, variables, taux), analyse fonctionnelle, spécifications
fonctionnelles, tests fonctionnels / recette, support utilisateurs
Outils SIRH | SILAE (intermédiaire) · Excel (intermédiaire) · Power BI (débutant) · Python
(débutant) · PowerPoint (intermédiaire)· HTML/CSS (débutant)
Langues | Anglais B2 (intermédiaire) · Chinois A1 (débutant)
EXPÉRIENCES PROFESSIONNELLES
Gestionnaire paie junior - Groupe Paie Conseil | 09/2025 - 08/2026 · Paris
Intégration, organisation et contrôle des flux de données paie issus de SILAE (ERP paie)
Analyse et résolution d'anomalies paie (métier + outil) - gestion et suivi de tickets
Assistante comptable - Cabinet ABC | 10/2023 - 08/2025 · Paris
Traitement et contrôle des factures fournisseurs et clients
DIPLÔMES ET FORMATIONS
Master SIRH (Systèmes d'Information Ressources Humaines) -
09/2026 - 08/2028 · Paris
Université Panthéon-Sorbonne
Licence Pro - Gestion de la Paie & Administration du Personnel -
10/2025 - 07/2026 · Paris 8e
IGEN / Université Paris-Nord (UPN)
BTS Comptabilité et Gestion - Lycée Jean Moulin | 09/2023 - 07/2025 · Paris 16e
ATOUTS Analyse · Esprit critique · Organisation · Rigueur
CENTRES D'INTÉRÊT DIY(Do It Yourself) · Couture · Lecture`)));
  const d = r.donnees;

  it('en-tête, coordonnées et rythme', () => {
    expect(d.infosPerso).toMatchObject({ prenom: 'Prénom', nom: 'NOM', titre: 'ALTERNANCE - CONSULTANTE SIRH / MOA', ville: 'Bondy', linkedin: 'linkedin.com/in/prenom-nom', dateNaissance: 'Née le 01/01/2001' });
    expect(d.accroche).toContain("maîtrise d'ouvrage SIRH");
    expect(d.rythmeAlternance).toBe("Contrat de 2 ans Master SIRH · Présence à l'école 3 jours: lundi, mardi, mercredi (tous les 15 jours)");
  });
  it('tableau de compétences et ligne Langues', () => {
    expect(d.competences.map(g => g.categorie)).toEqual(['SIRH & Fonctionnel', 'Outils SIRH']);
    expect(d.competences[0].elements).toContain('spécifications fonctionnelles');
    expect(d.competences[1].elements).toContain('PowerPoint (intermédiaire)');
    expect(d.langues.map(l => [l.langue, l.niveau])).toEqual([['Anglais', 'B2'], ['Chinois', 'A1']]);
  });
  it('expériences : poste, entreprise, dates, ville, missions', () => {
    expect(d.experiences.map(e => [e.poste, e.entreprise, e.ville, e.periode.debut, e.periode.fin, e.puces.length])).toEqual([
      ['Gestionnaire paie junior', 'Groupe Paie Conseil', 'Paris', '2025-09', '2026-08', 2],
      ['Assistante comptable', 'Cabinet ABC', 'Paris', '2023-10', '2025-08', 1],
    ]);
  });
  it('formations : école écrite sous les dates', () => {
    expect(d.formations.map(f => [f.diplome, f.etablissement, f.ville])).toEqual([
      ["Master SIRH (Systèmes d'Information Ressources Humaines)", 'Université Panthéon-Sorbonne', 'Paris'],
      ['Licence Pro — Gestion de la Paie & Administration du Personnel', 'IGEN / Université Paris-Nord (UPN)', 'Paris 8e'],
      ['BTS Comptabilité et Gestion', 'Lycée Jean Moulin', 'Paris 16e'],
    ]);
  });
  it('titres sur la même ligne que leur contenu', () => {
    expect(d.qualites).toEqual(['Analyse', 'Esprit critique', 'Organisation', 'Rigueur']);
    expect(d.centresInteret).toEqual(['DIY(Do It Yourself)', 'Couture', 'Lecture']);
  });
});

describe('CV Canva mixtes (haut pleine largeur, bas en deux colonnes)', () => {
  const m3 = (texte: string, x: number, y: number, taille = 10, largeur?: number): Morceau =>
    ({ texte, x, y, largeur: largeur ?? texte.length * taille * 0.45, taille });
  it('lit le haut en pleine largeur puis le bas colonne par colonne', () => {
    const haut = ['PROFIL PERSONNEL', "Titulaire d'un BTS, je souhaite me spécialiser en SIRH et chercher une alternance de deux ans.", 'COMPÉTENCES', 'Gestion de la paie : calcul des bulletins et des indemnités selon les conventions en vigueur.'];
    const gauche = ['EXPÉRIENCES PROFESSIONNELLES', 'Gestionnaire de paie (alternance)', 'Cabinet Paie, PARIS 75009', 'Sept.25 - présent', 'Saisie des éléments variables', 'FORMATIONS', '2023 - 2025 : BTS Comptabilité gestion', 'Lycée Jean Moulin, PARIS 75016'];
    const droite = ['CENTRES D’INTÉRÊTS', 'Théâtre', 'Lecture', 'LANGUES', 'Anglais niveau B2', 'LOGICIELS', 'Excel'];
    const morceaux = [
      ...haut.map((t, i) => m3(t, 40, 800 - i * 16, 10, t.length > 30 ? 500 : undefined)), // lignes longues du haut
      ...gauche.map((t, i) => m3(t, 40, 700 - i * 16, 10, Math.min(300, t.length * 4.5))),
      ...droite.map((t, i) => m3(t, 450, 696 - i * 17)), // la barre n'est pas alignée sur les lignes de gauche
    ];
    const r = decouperCv(reconstruireLignes(morceaux, 595));
    expect(r.donnees.experiences[0]).toMatchObject({ poste: 'Gestionnaire de paie (alternance)', entreprise: 'Cabinet Paie', ville: 'PARIS' });
    expect(r.donnees.experiences[0].periode).toEqual({ debut: '2025-09', fin: '', enCours: true });
    expect(r.donnees.formations[0]).toMatchObject({ diplome: 'BTS Comptabilité gestion', etablissement: 'Lycée Jean Moulin', ville: 'PARIS' });
    expect(r.donnees.centresInteret).toEqual(['Théâtre', 'Lecture']);
    expect(r.donnees.competences.map(g => g.categorie)).toContain('Logiciels');
  });
});

describe('autres cas Canva', () => {
  it('redécoupe les grands titres collés lettre par lettre', () => {
    expect(nettoyerLigne('R e s s o u r c e s h u m a i n e s e n a l t e r n a n c e')).toBe('Ressources humaines en alternance');
    expect(nettoyerLigne('E X P É R I E N C E S P R O F E S S I O N N E L L E S')).toBe('EXPÉRIENCES PROFESSIONNELLES');
  });
  it('dates « Oct-23 - présent » et « Sept.25 »', () => {
    expect(extraireDates('Oct-23 - présent')?.periode).toEqual({ debut: '2023-10', fin: '', enCours: true });
    expect(extraireDates('Oct.23 - Sept.25')?.periode).toEqual({ debut: '2023-10', fin: '2025-09', enCours: false });
  });
  it('expériences avec intitulé détaillé, bénévolat daté entre parenthèses', () => {
    const e = decouperCv(recollerParagraphes(lignesDepuisTexte(`EXPÉRIENCES PROFESSIONNELLES
Cabinet Compta, PARIS 75016 (depuis OCT 2023)
Assistante comptable (lettrage, déclaration TVA,
bilan, classement et archivage des pièces comptables)
Compétence acquises :
• méthode et organisation
Magasin Bio, AULNAY-SOUS-BOIS (JUIL 2022-OCT 2023)
Employée polyvalente (mise en rayon, gestion des
stocks, vente, conseil clientèle)
Bénévolat à la Journée olympique 2022, SAINT-DENIS
(JUIN 2022)
(Accueil et information, guider, mettre en relation
avec l'interlocuteur adapté)
Recruteur de donateurs chez une ONG, PARIS (JUIL 2021)
(Identifier des cibles, initier le contact, mettre en
confiance l'interlocuteur)`))).donnees.experiences;
    expect(e.map(x => [x.poste, x.entreprise, x.ville])).toEqual([
      ['Assistante comptable', 'Cabinet Compta', 'PARIS'],
      ['Employée polyvalente', 'Magasin Bio', 'AULNAY-SOUS-BOIS'],
      ['Bénévolat à la Journée olympique 2022', '', 'SAINT-DENIS'],
      ['Recruteur de donateurs', 'une ONG', 'PARIS'],
    ]);
    expect(e[0].periode).toEqual({ debut: '2023-10', fin: '', enCours: true });
    expect(e[2].periode.fin).toBe('2022-06');
    expect(e[2].puces[0].texte).toContain('Accueil et information');
  });
  it('formation : école sous la ligne « années : diplôme »', () => {
    const f = decouperCv(lignesDepuisTexte(`FORMATIONS
2023 - 2025 : BTS Comptabilité gestion
Lycée Jean Moulin, PARIS 75016
CFA Académique de Paris
2021 - 2023 : Licence LLCER Chinois
Université de Paris Cité
2020 - 2021 : Licence Histoire
Université de Sorbonne`)).donnees.formations;
    expect(f.map(x => [x.diplome, x.etablissement])).toEqual([
      ['BTS Comptabilité gestion', 'Lycée Jean Moulin – CFA Académique de Paris'],
      ['Licence LLCER Chinois', 'Université de Paris Cité'],
      ['Licence Histoire', 'Université de Sorbonne'],
    ]);
  });
});

describe('CV généré par une IA (Word / Docs) : tableaux, pieds de page, en-tête anonyme', () => {
  // Reproduit la mise en page du modèle : coordonnées PDF, y décroissant vers le bas
  const mm = (texte: string, x: number, y: number, taille = 9.8) => ({ texte, x, y, largeur: texte.length * taille * 0.48, taille });
  const page1 = [
    mm('CANDIDATURE ANONYMISÉE — RÉF. CYBER-2026-482', 51, 781, 9.5),
    mm('Administrateur Systèmes, Réseaux & Cybersécurité', 51, 757, 19),
    mm("5 ans d'expérience — Infrastructures critiques, Sécurisation réseau", 51, 737, 11.5),
    mm('Localisation : Île-de-France | Disponibilité : Sous 1 mois | Langues : Français', 59, 710, 9.5),
    mm('(natif), Anglais (C1 — TOEIC 890) | Contact référent : Cabinet IT — Réf. #482', 59, 696, 9.5),
    mm("Spécialiste en sécurité opérationnelle des systèmes d'information, expérience confirmée en durcissement.", 62, 654, 10.5),
    mm('COMPÉTENCES TECHNIQUES', 51, 576, 12),
    // tableau « catégorie | compétences » : la catégorie passe à la ligne
    mm('Sécurité Réseau &', 51, 547), mm('Périmétrique', 51, 533),
    mm('Pare-feu (Fortinet, Stormshield), VPN IPsec,', 189, 547), mm('WAF, IDS/IPS, filtrage DNS', 189, 533), mm('(802.1X / NAC).', 189, 519),
    mm('Réseaux & Infrastructures', 51, 495), mm('VLAN, BGP, OSPF, SD-WAN,', 189, 495), mm('Wi-Fi sécurisé.', 189, 480),
    mm('EXPÉRIENCES PROFESSIONNELLES', 51, 440, 12),
    mm('Administrateur Réseaux & Cybersécurité', 51, 415, 11), mm('09/2023 – Présent', 465, 415, 9.5),
    mm('Entreprise de Services Numériques (Clients Banque & Assurance) — Île-de-France', 51, 400),
    mm('Refonte de la segmentation réseau (VLAN, filtrage strict) réduisant de', 64, 380, 10.5),
    mm("65 % la surface d'exposition interne.", 64, 365, 10.5),
    mm('CV Anonyme — Profil Administrateur Réseaux & Cybersécurité', 51, 37, 8.5), mm('Page 1 of 2', 500, 37, 8.5),
  ];
  const page2 = [
    mm('Administrateur Systèmes & Réseaux', 51, 771, 11), mm('09/2021 – 08/2023', 465, 771, 9.5),
    mm('Groupe Industriel Européen (ETI — 1 500 collaborateurs) — Hauts-de-France', 51, 755),
    mm("Gestion du cluster VMware vSphere (40 hôtes) et des tunnels VPN IPsec.", 64, 735, 10.5),
    mm('FORMATION & CERTIFICATIONS', 51, 590, 12),
    // tableau à 3 colonnes, cellules centrées verticalement, avec ligne d'en-tête
    mm('Année', 57, 562, 9.5), mm('Intitulé du diplôme ou de la certification', 165, 562, 9.5), mm('Organisme / Niveau', 402, 562, 9.5),
    mm('2025', 57, 533), mm('Fortinet Certified Professional (FCP) — Network', 165, 540), mm('Security', 165, 526), mm('Fortinet', 402, 533),
    mm('2022', 57, 467), mm('Cisco Certified Network Associate (CCNA)', 165, 467), mm('Cisco', 402, 467),
    mm('2019 – 2021', 57, 438), mm('Mastère Expert en Sécurité Digitale & Réseaux', 165, 438), mm("École d'Ingénierie Informatique", 402, 444), mm('(Bac+5)', 402, 430),
    mm('CV Anonyme — Profil Administrateur Réseaux & Cybersécurité', 51, 37, 8.5), mm('Page 2 of 2', 500, 37, 8.5),
  ];
  const lignes = retirerEntetesEtPieds([reconstruireLignes(page1, 595), reconstruireLignes(page2, 595)])
    .map(l => ({ ...l, texte: nettoyerLigne(l.texte) })).filter(l => !ligneVide(l.texte));
  const d = decouperCv(lignes).donnees;
  const textes = lignes.map(l => l.texte);

  it('reconstruit chaque rangée de tableau sur une ligne (cellules sur plusieurs lignes ou centrées)', () => {
    expect(textes).toContain('Sécurité Réseau & Périmétrique | Pare-feu (Fortinet, Stormshield), VPN IPsec, WAF, IDS/IPS, filtrage DNS (802.1X / NAC).');
    expect(textes).toContain('2025 | Fortinet Certified Professional (FCP) — Network Security | Fortinet');
    expect(textes.some(t => /^Année \|/.test(t))).toBe(false); // ligne d'en-tête du tableau retirée
  });

  it('retire les pieds de page', () => {
    expect(textes.some(t => /Page \d of|CV Anonyme/.test(t))).toBe(false);
  });

  it('CV anonyme : pas de faux nom, titre, lieu, langues et accroche', () => {
    expect([d.infosPerso.prenom, d.infosPerso.nom]).toEqual(['', '']);
    expect(d.infosPerso.titre).toBe('Administrateur Systèmes, Réseaux & Cybersécurité');
    expect(d.infosPerso.ville).toBe('Île-de-France');
    expect(d.langues.map(l => [l.langue, l.niveau])).toEqual([['Français', 'natif'], ['Anglais', 'C1']]);
    expect(d.langues[1].precision).toBe('TOEIC 890');
    expect(d.accroche).toMatch(/^5 ans d'expérience/);
    expect(d.accroche).not.toMatch(/Disponibilit|Contact/);
  });

  it('une référence « CYBER-2026-482 » n’est pas une date', () => {
    expect(extraireDates('RÉF. CYBER-2026-482')).toBeNull();
    expect(extraireDates('2023-2025 Analyste')?.periode).toMatchObject({ debut: '2023', fin: '2025' });
  });

  it('compétences : une catégorie par rangée du tableau', () => {
    expect(d.competences.map(g => g.categorie)).toEqual(['Sécurité Réseau & Périmétrique', 'Réseaux & Infrastructures']);
    expect(d.competences[1].elements).toEqual(expect.arrayContaining(['VLAN', 'BGP', 'OSPF']));
  });

  it('expériences sur deux pages, entreprise avec tiret entre parenthèses, région comme ville', () => {
    expect(d.experiences).toHaveLength(2);
    expect(d.experiences[0]).toMatchObject({ poste: 'Administrateur Réseaux & Cybersécurité', ville: 'Île-de-France', periode: { debut: '2023-09', enCours: true } });
    expect(d.experiences[0].puces.map(p => p.texte)).toEqual(["Refonte de la segmentation réseau (VLAN, filtrage strict) réduisant de 65 % la surface d'exposition interne."]);
    expect(d.experiences[1]).toMatchObject({ entreprise: 'Groupe Industriel Européen (ETI — 1 500 collaborateurs)', ville: 'Hauts-de-France' });
  });

  it('section « Formation & Certifications » : diplôme d’un côté, certifications de l’autre', () => {
    expect(d.formations.map(f => [f.diplome, f.etablissement])).toEqual([['Mastère Expert en Sécurité Digitale & Réseaux', "École d'Ingénierie Informatique (Bac+5)"]]);
    expect(d.certifications.map(c => [c.intitule, c.organisme, c.annee])).toEqual([
      ['Fortinet Certified Professional (FCP) — Network Security', 'Fortinet', '2025'],
      ['Cisco Certified Network Associate (CCNA)', 'Cisco', '2022'],
    ]);
  });
});
