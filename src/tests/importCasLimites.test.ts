// Import : cas limites signalés sur un CV réel (reproduits avec des données inventées)
import { describe, expect, it } from 'vitest';
import { decouperCv, extraireDates } from '../lib/import/decouperSections';
import { completerLiens, fluxDepuisGlyphes, reconstruireLignes, respacer, trouverGouttiere } from '../lib/import/lirePdf';
import { morceauxCvBarreLaterale, LARGEUR_PAGE } from './donnees/cvBarreLaterale';
import { morceauxCvBarreLaterale2, LARGEUR_PAGE_2 } from './donnees/cvBarreLaterale2';
import { ligneVide, nettoyerLigne } from '../lib/import/nettoyage';

const l = (texte: string, taille = 10) => ({ texte, taille, zone: 'pleine' as const });

describe('import : informations sensibles', () => {
  it('une mention RQTH ne devient jamais le titre du CV : elle va dans « À classer »', () => {
    for (const mention of ['RQTH', 'Reconnaissance de la qualité de travailleur handicapé', 'Travailleur handicapé (BOETH)']) {
      const r = decouperCv([l('Jean Exemple', 20), l(mention, 11), l('Technicien de maintenance industrielle', 12),
        l('jean.exemple@mail.fr | 06 00 00 00 00 | Lyon'), l('EXPÉRIENCES PROFESSIONNELLES', 13), l('ACME – 2024'), l('Technicien'), l('• Dépannage')]);
      expect(r.donnees.infosPerso.titre, mention).toBe('Technicien de maintenance industrielle');
      expect(r.aClasser.map(a => a.texte), mention).toContain(mention);
      expect(JSON.stringify(r.donnees), mention).not.toContain(mention);
    }
  });

  it('un métier du handicap reste un titre normal', () => {
    const r = decouperCv([l('Jean Exemple', 20), l('Chargé de mission handicap', 12), l('jean.exemple@mail.fr')]);
    expect(r.donnees.infosPerso.titre).toBe('Chargé de mission handicap');
  });
});

describe('import : dates mois/année', () => {
  it('lit « 05 / 2025 » et « 05-2025 » sans laisser de morceau dans le nom', () => {
    for (const t of ['C-COM – 05 / 2025', 'C-COM – 05-2025', 'C-COM – 05/2025']) {
      const d = extraireDates(t);
      expect(d?.periode.fin, t).toBe('2025-05');
      expect(d?.reste.replace(/[\s–-]+$/, ''), t).toBe('C-COM');
    }
  });

  it('ne confond pas une plage d’années ou une référence avec un mois', () => {
    expect(extraireDates('2021-2022')?.periode).toEqual({ debut: '2021', fin: '2022', enCours: false });
    expect(extraireDates('2012-2025')?.periode).toEqual({ debut: '2012', fin: '2025', enCours: false });
    expect(extraireDates('Réf. CYBER-2026-482')).toBeNull();
  });

  it('entreprise et ville sur la même ligne que la date : pas de tiret qui traîne', () => {
    const r = decouperCv([l('Jean Exemple', 20), l('EXPÉRIENCES PROFESSIONNELLES', 13),
      l('C-COM – 05/2025 | PARIS'), l('Technicien en maintenance (stage) | 07/2025'), l('• Nettoyage de cartes électroniques')]);
    const e = r.donnees.experiences[0];
    expect(e.entreprise).toBe('C-COM');
    expect(e.ville).toBe('PARIS');
    expect(e.periode).toEqual({ debut: '2025-05', fin: '2025-07', enCours: false });
  });
});

describe('import : lien LinkedIn raccourci', () => {
  it('complète « linkedin.com/in/… » avec le lien cliquable du PDF', () => {
    for (const affiche of ['www.linkedin.com/in/…', 'www.linkedin.com/in/...', 'www.linkedin.com/in/....', 'linkedin.com/in/', 'linkedin.com/in/jean-exem…'])
      expect(completerLiens([l(affiche)], ['https://www.linkedin.com/in/jean-exemple-1234/'])[0].texte, affiche).toBe('linkedin.com/in/jean-exemple-1234');
  });

  it('ajoute le lien après l’e-mail s’il n’apparaît pas dans le texte, et garde un lien déjà complet', () => {
    expect(completerLiens([l('Jean Exemple'), l('jean.exemple@mail.fr | Lyon'), l('PROFIL')], ['https://fr.linkedin.com/in/jean-exemple']).map(x => x.texte))
      .toEqual(['Jean Exemple', 'jean.exemple@mail.fr | Lyon', 'fr.linkedin.com/in/jean-exemple', 'PROFIL']);
    expect(completerLiens([l('linkedin.com/in/jean-exemple')], ['https://www.linkedin.com/in/autre'])[0].texte).toBe('linkedin.com/in/jean-exemple');
    expect(completerLiens([l('jean.exemple@mail.fr')], ['https://exemple.fr'])).toHaveLength(1);
  });
});

describe('import : CV Canva avec barre latérale sur toute la hauteur (mise en page réelle, contenu inventé)', () => {
  const lire = () => completerLiens(reconstruireLignes(morceauxCvBarreLaterale(), LARGEUR_PAGE), ['https://www.linkedin.com/in/lucas-martel-0000/']);

  it('sépare les colonnes juste avant la colonne de droite, même si une ligne de gauche s’en approche', () => {
    const g = trouverGouttiere(morceauxCvBarreLaterale(), LARGEUR_PAGE)!;
    expect(g).toBeGreaterThan(228); // fin de « Régler les paramètres des machines »
    expect(g).toBeLessThan(232);    // début de la colonne de droite
    // aucune ligne lue « en travers » des deux colonnes
    expect(lire().filter(l => l.zone === 'pleine')).toEqual([]);
  });

  it('texte aux lettres espacées : les mots restent séparés', () => {
    const textes = lire().map(l => l.texte);
    for (const t of ['• Contrôler un produit fini', '• Régler les paramètres des machines', '• Détecter des dysfonctionnements']) expect(textes).toContain(t);
  });

  it('chaque rubrique de la barre latérale reste à sa place', () => {
    const r = decouperCv(lire()), d = r.donnees;
    expect(d.infosPerso.titre).toBe('Technicien électronique en alternance');
    expect(d.infosPerso.linkedin).toBe('linkedin.com/in/lucas-martel-0000');
    expect(r.aClasser.map(a => a.texte)).toEqual(['RQTH']);
    expect(d.competences.find(c => /comp/i.test(c.categorie))?.elements).toEqual(['Contrôler un produit fini', 'Régler les paramètres des machines', 'Détecter des dysfonctionnements']);
    expect(d.langues.map(l => [l.langue, l.niveau])).toEqual([['Anglais', 'B1'], ['Allemand', 'A2']]);
    expect(d.centresInteret).toEqual(['Violoncelliste (8 ans)', 'Pianiste (5 ans)', 'Les échecs (en ligne)']);
    expect(d.qualites).toEqual(['Organisé', 'Créatif', 'Rigoureux']);
    // les formations ne reçoivent rien de la barre latérale
    expect(JSON.stringify(d.formations)).not.toMatch(/Anglais|Violoncell|Pianiste|échecs/);
    expect(d.formations.map(f => f.diplome)).toContain('BTS Conception et Industrialisation en Microtechniques');
  });

  it('« Concepteur 3D (stage) » est un intitulé de poste, pas une puce de l’expérience précédente', () => {
    const exp = decouperCv(lire()).donnees.experiences;
    expect(exp.map(e => [e.poste, e.entreprise])).toEqual([
      ['Technicien en maintenance (stage)', 'ELEKTRA'],
      ['Projet réalisation et maintenance du PCB', 'Lycée Exemple'],
      ['Concepteur 3D (stage)', 'Bureau Études Nord'],
    ]);
    expect(exp[1].puces).toHaveLength(3);
  });
});

describe('import : 2e CV Canva à barre latérale (lettres très espacées, titre sur 2 lignes, accroche sans rubrique)', () => {
  // même chaîne que lirePdf : lignes reconstruites, puis nettoyées
  const lire = () => reconstruireLignes(morceauxCvBarreLaterale2(), LARGEUR_PAGE_2)
    .map(l => ({ ...l, texte: nettoyerLigne(l.texte) })).filter(l => !ligneVide(l.texte));

  it('remet les espaces entre les mots des textes aux lettres espacées', () => {
    const textes = lire().map(l => l.texte);
    expect(textes).toContain('• Contrôler un produit fini');
    expect(textes).toContain('• Arduino (débutant)');
    expect(textes).toContain('Recherche dans le domaine de la maintenance');
    expect(textes).toContain('2021 - 2023 : BTS Cybersécurité Informatique et Réseau,');
  });

  it('titre complet, LinkedIn complet, accroche reconnue', () => {
    const d = decouperCv(lire()).donnees;
    expect(d.infosPerso.titre).toBe('Recherche dans le domaine de la maintenance électronique, des réseaux & de l’informatique');
    expect(d.infosPerso.linkedin).toBe('linkedin.com/in/hugo-dumont-l%C3%A9o-0a1b2c3d/');
    expect(d.accroche).toMatch(/^Titulaire d’un BTS en électronique.*mes connaissances\.$/);
    // la 2e ligne du titre n'est pas une rubrique « Informatique »
    expect(d.competences.map(c => c.categorie)).toEqual(['Logiciels', 'Compétences']);
  });

  it('les puces coupées sur deux lignes sont recollées', () => {
    const d = decouperCv(lire()).donnees;
    expect(d.competences[1].elements).toEqual(['Contrôler un produit fini', 'Régler les paramètres des machines', 'Détecter des dysfonctionnements', 'Décoder des trames sur l’oscilloscope']);
  });

  it('expériences : intitulés centrés en plus gros, dates « 05/2023-07/2023 »', () => {
    const exp = decouperCv(lire()).donnees.experiences;
    expect(exp.map(e => [e.poste, e.entreprise, e.periode.debut, e.periode.fin])).toEqual([
      ['Technicien en maintenance (stage)', 'ELEKTRA', '2023-05', '2023-07'],
      ['Projet réalisation et maintenance du PCB', 'Lycée Exemple', '', '2022-02'],
      ['Concepteur 3D (stage)', 'Société Delta', '2021-01', '2021-04'],
      ['Projet Vélo Assistance électrique', 'Lycée Exemple', '2019-11', '2020-06'],
    ]);
    expect(exp[2].puces).toHaveLength(5);
  });

  it('formations séparées', () => {
    const f = decouperCv(lire()).donnees.formations;
    expect(f.map(x => x.diplome)).toEqual([
      'Formation en infrastructure réseau et informatique',
      'BTS Cybersécurité Informatique et Réseau, Electronique option B : électronique et réseau',
      'LP Mécanique : Innovation et Conception 3D',
      'BTS Conception et Industrialisation en Microtechniques',
      'Baccalauréat Scientifique option Sciences de l’ingénieur',
    ]);
  });

  it('une adresse raccourcie n’avale pas la ligne suivante, et une mention RQTH reste à classer', () => {
    const r = decouperCv(lire());
    expect(r.aClasser.map(a => a.texte)).toEqual(['RQTH']);
  });
});

describe('import : lettres espacées sur toute la ligne (un seul morceau « C o n t r ô l e r u n … »)', () => {
  // Caractères tels que dessinés dans le PDF : chaque lettre suivie d'un décalage (null), vraies espaces entre les mots
  const dessine = (t: string) => [...t].flatMap(c => [c, null]);
  const flux = fluxDepuisGlyphes([dessine('Contrôler un produit fini'), dessine('Régler les paramètres des'), dessine('EXPÉRIENCES PROFESSIONNELLES')]);

  it('retrouve les vrais espaces entre les mots', () => {
    expect(respacer('C o n t r ô l e r u n p r o d u i t f i n i', flux)?.texte).toBe('Contrôler un produit fini');
    expect(respacer('E X P É R I E N C E S P R O F E S S I O N N E L L E S', flux)?.texte).toBe('EXPÉRIENCES PROFESSIONNELLES');
  });

  it('laisse tranquille un texte normal ou introuvable', () => {
    expect(respacer('Texte normal', flux)).toBeNull();
    expect(respacer('Z z z z z z z z', flux)).toBeNull();
  });

  it('une ligne coupée après « des » ou « sur » est recollée, même sans puce', () => {
    const l = (texte: string) => ({ texte, taille: 10, zone: 'gauche' as const });
    const r = decouperCv([l('Jean Exemple'), l('COMPÉTENCES'), l('Régler les paramètres des'), l('machines'), l('Décoder des trames sur'), l('l’oscilloscope')]);
    expect(r.donnees.competences.flatMap(c => c.elements)).toEqual(['Régler les paramètres des machines', 'Décoder des trames sur l’oscilloscope']);
  });
});

describe('import : expériences sans dates lisibles, intitulés à peine plus gros', () => {
  it('chaque intitulé un peu plus gros (12 pt contre 11) ouvre une nouvelle expérience', () => {
    const l = (texte: string, taille = 11) => ({ texte, taille, zone: 'droite' as const });
    const r = decouperCv([l('Jean Exemple', 20), l('EXPÉRIENCES PROFESSIONNELLES', 13),
      l('Technicien en maintenance (stage)', 12), l('ACME, PARIS'), l('Nettoyage de cartes électroniques'), l('Démontage des composants défectueux'),
      l('Projet réalisation et maintenance du PCB', 12), l('Lycée Exemple, PARIS'), l('Simulation du circuit sous Proteus'),
      l('Concepteur 3D (stage)', 12), l('Société Delta, MEUDON'), l('Modification de la structure du châssis'), l('Ajout de matière sur la pièce')]);
    expect(r.donnees.experiences.map(e => e.poste)).toEqual(['Technicien en maintenance (stage)', 'Projet réalisation et maintenance du PCB', 'Concepteur 3D (stage)']);
    expect(r.donnees.experiences[2].puces).toHaveLength(2);
  });
});
