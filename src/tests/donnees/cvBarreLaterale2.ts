// Deuxième CV Canva « barre latérale beige + colonne de droite », mise en page relevée sur une capture
// anonymisée de 1390 × 2000 px (page A4 de 595 × 842 pt), avec un contenu entièrement INVENTÉ.
// Particularités : titre sur 2 lignes sans rubrique « Profil », accroche juste en dessous, lien LinkedIn
// coupé sur 2 lignes, puces de compétences qui passent à la ligne, texte aux lettres très espacées.
import type { Morceau } from '../../lib/import/lirePdf';

export const LARGEUR_PAGE_2 = 595;
const ECHELLE = 595 / 1390;
const HAUT = 2000;

/**
 * Une ligne de texte entre x0 et x1 (px de la capture), à la hauteur y (px, depuis le haut).
 * espacee : lettres très espacées (Canva). pdf.js renvoie alors un morceau par mot, lettres séparées
 * par une espace (« R é g l e r »), et un morceau « » entre les mots : c'est ce que reproduit ce mode.
 */
function ligne(texte: string, x0: number, x1: number, y: number, taillePx = 22, espacee = false): Morceau[] {
  const taille = taillePx * ECHELLE, yPdf = (HAUT - y) * ECHELLE;
  if (!espacee) return [{ texte, x: x0 * ECHELLE, y: yPdf, largeur: (x1 - x0) * ECHELLE, taille }];
  const pas = ((x1 - x0) * ECHELLE) / [...texte].length;
  const out: Morceau[] = [];
  let i = 0;
  for (const mot of texte.split(' ')) {
    const n = [...mot].length;
    if (n) out.push({ texte: [...mot].join(' '), x: x0 * ECHELLE + i * pas, y: yPdf, largeur: (n - 0.4) * pas, taille });
    i += n;
    out.push({ texte: ' ', x: x0 * ECHELLE + i * pas - 0.4 * pas, y: yPdf, largeur: pas * 1.4, taille });
    i += 1;
  }
  out.pop();
  return out;
}

export function morceauxCvBarreLaterale2(): Morceau[] {
  return [
    // ----- Barre latérale (gauche)
    ...ligne('Hugo', 40, 170, 365, 34), ...ligne('DUMONT', 40, 265, 410, 34),
    ...ligne('Né le 03/04/2001', 50, 280, 467, 24),
    ...ligne('CONTACT', 37, 190, 519, 28, true),
    ...ligne('93000 Saint-Exemple', 65, 270, 553),
    ...ligne('hugo.dumont@exemple.fr', 65, 350, 597),
    ...ligne('06 00 00 91 48', 65, 225, 635),
    ...ligne('RQTH', 75, 140, 675, 20),
    ...ligne('https://www.linkedin.com/in/h', 120, 442, 715),
    ...ligne('ugo-dumont-l%C3%A9o-0a1b2c3d/', 108, 445, 745),
    ...ligne('LOGICIELS', 33, 185, 917, 28, true),
    ...['Arduino (débutant)', 'Proteus (débutant)', 'QGIS (débutant)', 'Solidworks (Intermédiaire)', 'CATIA (Intermédiaire)', 'Pack Office (Intermédiaire)', 'HTML5 CSS3 (débutant)']
      .flatMap((t, i) => ligne(`• ${t}`, 45, 70 + t.length * 12, 955 + i * 31.3, 22, true)),
    ...ligne('COMPÉTENCES', 43, 273, 1208, 28, true),
    ...ligne('• Contrôler un produit fini', 45, 375, 1243, 22, true),
    ...ligne('• Régler les paramètres des', 45, 395, 1275, 22, true),
    ...ligne('machines', 70, 160, 1306, 22, true),
    ...ligne('• Détecter des dysfonctionnements', 45, 485, 1337, 22, true),
    ...ligne('• Décoder des trames sur', 45, 365, 1369, 22, true),
    ...ligne('l’oscilloscope', 70, 230, 1400, 22, true),
    ...ligne('SOFT SKILLS :', 33, 210, 1460, 28),
    ...ligne('• Organisé', 45, 160, 1496), ...ligne('• Créatif', 45, 145, 1529), ...ligne('• Rigoureux', 45, 170, 1562),
    ...ligne('LANGUES', 33, 165, 1632, 28),
    ...ligne('• Anglais niveau B1', 45, 245, 1669), ...ligne('• Allemand niveau A2', 45, 290, 1701),
    ...ligne('CENTRES D’INTÉRÊTS', 33, 325, 1779, 28),
    ...ligne('• Guitariste (6 ans)', 45, 300, 1816), ...ligne('• Natation (4 ans)', 45, 270, 1848), ...ligne('• Les échecs (en ligne)', 45, 290, 1879),
    // ----- Colonne de droite
    ...ligne('Recherche dans le domaine de la maintenance', 585, 1322, 66, 32, true),
    ...ligne('électronique, des réseaux & de l’informatique', 602, 1305, 120, 32, true),
    ...ligne('Titulaire d’un BTS en électronique, passionné par les systèmes embarqués. Motivé, ponctuel et', 547, 1296, 178),
    ...ligne('méthodique, je cherche une première mission pour mettre en pratique mes connaissances.', 547, 1300, 226),
    ...ligne('EXPÉRIENCES PROFESSIONNELLES', 657, 1218, 313, 30, true),
    ...ligne('Technicien en maintenance (stage)', 740, 1195, 420, 26),
    ...ligne('ELEKTRA, PARIS 75011 05/2023-07/2023', 732, 1197, 456),
    ...ligne('Réparation de cartes électroniques Contrôle et mise à jour des', 603, 1327, 492),
    ...ligne('routeurs', 922, 1003, 527),
    ...ligne('Remplacement des composants défectueux après diagnostic sur', 604, 1326, 562),
    ...ligne('banc de test', 903, 1027, 597),
    ...ligne('Projet réalisation et maintenance du PCB', 703, 1232, 652, 26),
    ...ligne('Lycée Exemple, PARIS 75011 02/2022', 758, 1180, 689),
    ...ligne('Prise en main de Tinkercad Simulation du circuit', 716, 1222, 725),
    ...ligne('sous Proteus Dessin du PCB avec le routage', 728, 1210, 760),
    ...ligne('Concepteur 3D (stage)', 810, 1100, 837, 26),
    ...ligne('Société Delta, MEUDON 92190 01/2021-04/2021', 671, 1235, 874),
    ...ligne('Conception d’un drone de livraison', 713, 1190, 910),
    ...ligne('Modification de la structure du châssis', 712, 1186, 944),
    ...ligne('Correction des erreurs de conception et amélioration de l’existant', 579, 1327, 980),
    ...ligne('Mise à l’échelle de la conception par rapport à la maquette', 620, 1279, 1015),
    ...ligne('Ajout de matière sur la pièce', 797, 1109, 1050),
    ...ligne('Projet Vélo Assistance électrique', 728, 1158, 1140, 26),
    ...ligne('Lycée Exemple, SAINT-EXEMPLE 93000', 737, 1160, 1176),
    ...ligne('11/2019-06/2020', 856, 1057, 1211),
    ...ligne('Modélisation du kit permettant de transformer un vélo standard en vélo', 562, 1344, 1245),
    ...ligne('électrique', 893, 1012, 1280),
    ...ligne('Modélisation des pièces sur Solidworks', 741, 1165, 1315),
    ...ligne('Injection plastique pour créer des pièces', 724, 1182, 1350),
    ...ligne('Écriture d’un programme de limitation de vitesse sur Arduino', 622, 1283, 1385),
    ...ligne('Usinage des pièces', 846, 1060, 1420),
    ...ligne('FORMATIONS', 546, 785, 1482, 30, true),
    ...ligne('2023 : Formation en infrastructure réseau et informatique,', 546, 1266, 1558, 22, true),
    ...ligne('Cours d’adultes de Paris, Paris 75006', 546, 956, 1584),
    ...ligne('2021 - 2023 : BTS Cybersécurité Informatique et Réseau,', 546, 1240, 1632, 22, true),
    ...ligne('Electronique', 548, 702, 1655, 22, true),
    ...ligne('option B : électronique et réseau', 548, 952, 1679, 22, true),
    ...ligne('Lycée Exemple, PARIS 75011', 546, 842, 1706),
    ...ligne('2019 - 2021 : LP Mécanique : Innovation et Conception 3D', 546, 1258, 1747, 22, true),
    ...ligne('IUT Exemple, SAINT-DENIS 93200', 546, 1060, 1781),
    ...ligne('2017 - 2019 BTS Conception et Industrialisation en', 546, 1345, 1815, 22, true),
    ...ligne('Microtechniques', 546, 766, 1849, 22, true),
    ...ligne('Lycée Exemple, SAINT-EXEMPLE 93', 546, 995, 1873),
    ...ligne('2017 : Baccalauréat Scientifique option Sciences de l’ingénieur', 546, 1315, 1906, 22, true),
    ...ligne('Lycée Exemple, SAINT-EXEMPLE 93', 546, 995, 1935),
  ];
}
