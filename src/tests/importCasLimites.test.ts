// Import : cas limites signalés sur un CV réel (reproduits avec des données inventées)
import { describe, expect, it } from 'vitest';
import { decouperCv, extraireDates } from '../lib/import/decouperSections';
import { completerLiens, reconstruireLignes, trouverGouttiere } from '../lib/import/lirePdf';
import { morceauxCvBarreLaterale, LARGEUR_PAGE } from './donnees/cvBarreLaterale';

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
