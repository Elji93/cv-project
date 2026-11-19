// Mise en page reproduite d'un CV Canva réel « barre latérale beige sur toute la hauteur + colonne de droite »,
// avec un contenu entièrement INVENTÉ (aucune donnée du CV d'origine).
// Positions relevées sur une capture de 773 × 1090 px ; page A4 de 595 × 842 pt.
import type { Morceau } from '../../lib/import/lirePdf';

export const LARGEUR_PAGE = 595;
const ECHELLE = 595 / 773;
const HAUT = 1090;

/**
 * Une ligne de texte entre x0 et x1 (px de la capture), à la hauteur y (px, depuis le haut).
 * lettresEspacees : texte « crénelé » de Canva, chaque lettre est un morceau séparé, sans caractère espace.
 */
function ligne(texte: string, x0: number, x1: number, y: number, taillePx = 11, lettresEspacees = false): Morceau[] {
  const taille = taillePx * ECHELLE, yPdf = (HAUT - y) * ECHELLE;
  if (!lettresEspacees) return [{ texte, x: x0 * ECHELLE, y: yPdf, largeur: (x1 - x0) * ECHELLE, taille }];
  // chaque caractère occupe une case ; l'espace est une case vide (pas de morceau)
  const cases = [...texte];
  const pasCase = ((x1 - x0) * ECHELLE) / cases.length;
  return cases.flatMap((c, i) => (c === ' ' ? [] : [{ texte: c, x: x0 * ECHELLE + i * pasCase, y: yPdf, largeur: pasCase * 0.62, taille }]));
}

export function morceauxCvBarreLaterale(): Morceau[] {
  return [
    // ----- Barre latérale (gauche)
    ...ligne('Lucas', 33, 140, 175, 34), ...ligne('MARTEL', 33, 200, 215, 34),
    ...ligne('Né le 1er janvier 2004', 33, 160, 255, 12),
    ...ligne('CONTACT', 35, 147, 284, 14, true),
    ...ligne('12 rue des Lilas 75000 Paris', 52, 200, 304),
    ...ligne('lucas.martel@exemple.fr', 52, 215, 327),
    ...ligne('06 00 00 00 00', 52, 150, 350),
    ...ligne('www.linkedin.com/in/....', 52, 205, 372),
    ...ligne('RQTH', 52, 90, 394),
    ...ligne("RYTHME D'ALTERNANCE", 33, 215, 429, 14, true),
    ...ligne('2 semaines en formation', 37, 187, 449, 11, true),
    ...ligne('2 semaines en entreprise', 37, 189, 467, 11, true),
    ...ligne('LOGICIELS', 33, 115, 502, 14, true),
    ...['Arduino (débutant)', 'Proteus (débutant)', 'QGIS (débutant)', 'Solidworks (Intermédiaire)', 'Catia (Intermédiaire)', 'Autocad (débutant)', 'Pack Office (Intermédiaire)']
      .flatMap((t, i) => ligne(`• ${t}`, 37, 37 + t.length * 7.4, 521 + i * 17.3, 11, true)),
    ...ligne('COMPÉTENCES', 35, 160, 695, 14, true),
    ...ligne('• Contrôler un produit fini', 52, 248, 714, 11, true),
    ...ligne('• Régler les paramètres des machines', 52, 296, 731, 11, true),
    ...ligne('• Détecter des dysfonctionnements', 52, 277, 748, 11, true),
    ...ligne('SOFT SKILLS :', 33, 125, 802, 14),
    ...ligne('• Organisé', 37, 112, 821), ...ligne('• Créatif', 37, 100, 840), ...ligne('• Rigoureux', 37, 108, 858),
    ...ligne('LANGUES', 33, 105, 894, 14),
    ...ligne('• Anglais niveau B1', 37, 158, 913), ...ligne('• Allemand niveau A2', 37, 160, 931),
    ...ligne("CENTRES D'INTÉRÊTS", 35, 194, 973, 14),
    ...ligne('• Violoncelliste (8 ans)', 37, 188, 994), ...ligne('• Pianiste (5 ans)', 37, 145, 1011), ...ligne('• Les échecs (en ligne)', 37, 175, 1028),
    // ----- Colonne de droite
    ...ligne('Technicien électronique en alternance', 313, 740, 40, 18, true),
    ...ligne('PROFIL PERSONNEL', 302, 435, 64, 13),
    ...ligne('Étudiant motivé en études, je souhaite me spécialiser en électronique grâce à mon BTS. Mes qualités de sérieux', 302, 745, 85, 8),
    ...ligne("et d'organisation me poussent à chercher une alternance où je pourrai mettre en valeur mon potentiel et apprendre", 302, 745, 106, 8),
    ...ligne('davantage.', 302, 346, 127, 8),
    ...ligne('EXPÉRIENCES PROFESSIONNELLES', 307, 614, 157, 15, true),
    ...ligne('Technicien en maintenance (stage)', 307, 555, 195, 14),
    ...ligne('ELEKTRA, PARIS 75011', 307, 452, 214, 11),
    ...ligne('05/2024 - 07/2024', 307, 420, 232, 11),
    ...ligne('• Nettoyage de cartes électroniques', 315, 545, 250),
    ...ligne('Projet réalisation et maintenance du PCB', 307, 560, 268, 14),
    ...ligne('Lycée Exemple, PARIS 75011', 307, 457, 295, 11),
    ...ligne('02/2024', 307, 360, 312),
    ...ligne('• Prise en main de Tinkercad', 315, 475, 329), ...ligne('• Simulation du PCB sous Proteus', 315, 500, 347), ...ligne('• Dessin du PCB avec le routage', 315, 497, 364),
    ...ligne('Concepteur 3D (stage)', 307, 466, 391, 14),
    ...ligne('Bureau Études Nord, MEUDON 92190', 307, 478, 410, 11),
    ...ligne('01/2023 - 04/2023', 307, 410, 428),
    ...ligne('• Modification de la carrosserie de la voiture', 315, 552, 463), ...ligne('• Mise à l’échelle de la conception', 315, 600, 497),
    ...ligne('FORMATIONS', 302, 432, 818, 15, true),
    ...ligne('2024 - 2026 : BTS Cybersécurité Informatique et Réseau, Electronique', 301, 743, 855, 11),
    ...ligne('option B : électronique et réseau', 301, 470, 868, 11),
    ...ligne('Lycée Exemple, PARIS 75011', 301, 452, 881),
    ...ligne("2024 : Formation chargés d'études et de projets en", 301, 745, 905, 11),
    ...ligne('réseaux de télécommunication', 301, 445, 918, 11),
    ...ligne('Campus Numérique, MONTEREAU 77130', 301, 600, 932),
    ...ligne('2021 - 2022 : LP Mécanique : Innovation et Conception 3D', 301, 670, 956, 11),
    ...ligne('IUT Exemple, SAINT-DENIS 93200', 301, 553, 970),
    ...ligne('2019 - 2021 : BTS Conception et Industrialisation en', 301, 745, 997, 11),
    ...ligne('Microtechniques', 301, 381, 1010, 11),
    ...ligne('Lycée Exemple, VILLEPINTE 93420', 301, 520, 1024),
    ...ligne("2019 : Baccalauréat Scientifique option Sciences de l'ingénieur", 301, 724, 1051, 11),
    ...ligne('Lycée Exemple, VILLEPINTE 93420', 301, 520, 1065),
  ];
}
