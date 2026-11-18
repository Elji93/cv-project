// ============================================================================
//  Export Word (.docx)
//  - une seule colonne, vrais styles Word (Titre, Titre 1, Titre 2), vraies puces
//  - mêmes tailles, interlignes et espacements que l'aperçu (feuille.css),
//    en points et en millimètres : un CV qui tient sur une page à l'écran
//    tient aussi sur une page dans Word
//  - police, couleur, filets et photo du modèle choisi
// ============================================================================
import {
  AlignmentType, BorderStyle, Document, HeadingLevel, HorizontalPositionAlign, HorizontalPositionRelativeFrom, ImageRun,
  LevelFormat, LineRuleType, Packer, Paragraph, ShadingType, TabStopType, TextRun, TextWrappingSide, TextWrappingType,
  VerticalPositionRelativeFrom, type IBorderOptions, type IRunOptions, type ParagraphChild,
} from 'docx';
import { saveAs } from 'file-saver';
import type { CV, Experience, Formation } from '../../types';
import { affichees, nomComplet, policeWord, titreSection } from '../cv';
import { formaterPeriode } from '../dates';
import { NIVEAUX_CECRL } from '../../data/constantes';
import { photoRecadreePng } from '../photo';
import { nomFichier } from './nomFichier';
import { definitionTemplate, estGroupeOutils, groupesAffiches } from '../../components/feuille/templates';

const rempli = (s?: string) => !!s && s.trim().length > 0;

/** Unités Word : 1 pt = 20 twips ; 1 mm = 56,7 twips ; tailles de police en demi-points */
const twipsPt = (pt: number) => Math.round(pt * 20);
const twipsMm = (mm: number) => Math.round(mm * 56.7);
const demiPoints = (pt: number) => Math.round(pt * 2);

/** Taille du nom selon le modèle (mêmes valeurs que feuille.css) */
const TAILLE_NOM: Record<string, number> = { finance: 1.75, moderne: 2.1, rh: 1.85 };
const TAILLE_TITRE_SECTION: Record<string, number> = { finance: 1.06, moderne: 1.15, rh: 1.04 };

/** Construit le document Word (sans le télécharger) — utilisé aussi par les tests */
export async function construireDocumentWord(cv: CV, avecPhoto = true): Promise<Document> {
  const { style: s, donnees: d, langue } = cv;
  const p = d.infosPerso;
  const police = policeWord(cv);
  const S = s.taillePolice; // taille du texte courant, en points
  const lh = s.interligne;
  const gap = s.espacementSections;
  const couleur = s.couleur.replace('#', '').toUpperCase();
  const marge = twipsMm(s.marges);
  const largeurPage = 11906; // A4 = 210 mm
  const largeurTexte = largeurPage - marge * 2;
  const modele = definitionTemplate(cv.templateId);
  const moderne = cv.templateId === 'moderne';
  const rh = cv.templateId === 'rh';
  const finance = !moderne && !rh;
  const NOIR = '1A1A1A';

  /** Texte : police du CV, taille en points */
  const T = (text: string, o: IRunOptions & { pt?: number } = {}) => {
    const { pt = S, ...reste } = o;
    return new TextRun({ text, font: police, size: demiPoints(pt), ...reste });
  };
  /** Interligne exact, comme line-height en CSS */
  const interligne = (pt: number, facteur = lh) => ({ line: twipsPt(pt * facteur), lineRule: LineRuleType.EXACT });

  const paragraphes: Paragraph[] = [];

  // ------------------------------------------------------------------ En-tête
  paragraphes.push(...await enteteWord(cv, { avecPhoto }));

  // ------------------------------------------------------------------ Briques
  const tTitre = S * (TAILLE_TITRE_SECTION[cv.templateId] ?? 1.06);
  const titre = (texte: string) => new Paragraph({
    heading: HeadingLevel.HEADING_1,
    keepNext: true, keepLines: true,
    // RH : le titre a une marge intérieure de 0,4 mm en haut et en bas dans l'aperçu
    // (Moderne : le filet Word ajoute ~0,2 mm par titre, on le reprend sur l'espace après)
    spacing: { before: twipsMm(2.8 * gap + (rh ? 0.4 : 0)), after: twipsMm(1.5 * gap + (rh ? 0.4 : 0) - (moderne ? 0.25 : 0)), ...interligne(tTitre) },
    // Finance : filet noir ; Moderne : filet gris ; RH : barre de couleur à gauche + fond léger
    border: rh
      ? { left: { style: BorderStyle.SINGLE, size: 20, color: couleur, space: 7 } }
      : { bottom: { style: BorderStyle.SINGLE, size: 5, color: finance ? NOIR : 'C9CED6', space: 1 } },
    shading: rh ? { type: ShadingType.CLEAR, fill: 'F1F4F8', color: 'auto' } : undefined,
    children: [T(texte, { pt: tTitre, bold: true, allCaps: s.majusculesTitres, color: finance ? NOIR : couleur })],
  });
  /** Ligne « texte à gauche ……… texte à droite » (tabulation alignée à droite) */
  const deuxCotes = (gauche: ParagraphChild[], droite: string, o: { titre2?: boolean; apres?: number } = {}) => new Paragraph({
    heading: o.titre2 ? HeadingLevel.HEADING_2 : undefined,
    keepNext: true, keepLines: true,
    tabStops: [{ type: TabStopType.RIGHT, position: largeurTexte }],
    spacing: { before: 0, after: o.apres ?? 0, ...interligne(S) },
    children: [...gauche, ...(rempli(droite) ? [T('\t' + droite)] : [])],
  });
  const puce = (texte: string, premiere: boolean, apres: number) => new Paragraph({
    numbering: { reference: 'puces', level: 0 },
    spacing: { before: twipsMm(premiere ? 0.6 : 0.2), after: apres, ...interligne(S) },
    children: [T(texte)],
  });
  const paragraphe = (runs: ParagraphChild[], o: { avant?: number; apres?: number; justifie?: boolean } = {}) => new Paragraph({
    alignment: o.justifie ? AlignmentType.JUSTIFIED : AlignmentType.LEFT,
    spacing: { before: o.avant ?? 0, after: o.apres ?? 0, ...interligne(S) },
    children: runs,
  });
  /** Une expérience ou une formation ; l'espace entre deux blocs est porté par le dernier paragraphe */
  const bloc = (haut: string, bas: string, lieu: string, b: Experience | Formation, dernier: boolean) => {
    const apresBloc = dernier ? 0 : twipsMm(1.8 * gap);
    const puces = b.puces.filter(x => rempli(x.texte));
    const periode = formaterPeriode(b.periode, langue);
    const ligne2 = rempli(bas) || periode;
    const out = [deuxCotes([T(haut, { bold: true, color: moderne ? couleur : undefined })], lieu, { titre2: true, apres: !ligne2 && !puces.length ? apresBloc : 0 })];
    if (ligne2) out.push(deuxCotes([T(bas, { italics: true })], periode, { apres: puces.length ? 0 : apresBloc }));
    puces.forEach((x, i) => out.push(puce(x.texte.trim(), i === 0, i === puces.length - 1 ? apresBloc : 0)));
    return out;
  };

  // ------------------------------------------------------------------ Sections
  cv.ordreSections.filter(k => !cv.sectionsMasquees.includes(k)).forEach(cle => {
    const contenu: Paragraph[] = [];
    if (cle === 'accroche') {
      if (rempli(d.accroche)) contenu.push(paragraphe([T(d.accroche.trim())], { justifie: true }));
      if (rempli(d.rythmeAlternance)) contenu.push(paragraphe(
        [T(langue === 'en' ? 'Work-study schedule: ' : "Rythme d'alternance : ", { bold: true }), T(d.rythmeAlternance.trim())],
        { avant: rempli(d.accroche) ? twipsMm(0.8) : 0 }));
    }
    if (cle === 'experiences') {
      const l = affichees(d.experiences).filter(e => rempli(e.poste) || rempli(e.entreprise));
      l.forEach((e, i) => contenu.push(...bloc(e.entreprise, e.poste, e.ville, e, i === l.length - 1)));
    }
    if (cle === 'formations') {
      const l = affichees(d.formations).filter(f => rempli(f.diplome) || rempli(f.etablissement));
      l.forEach((f, i) => contenu.push(...bloc(f.etablissement, f.diplome, f.ville, f, i === l.length - 1)));
    }
    if (cle === 'competences') {
      const groupes = groupesAffiches(d.competences, cv.templateId).filter(g => g.elements.length);
      groupes.forEach((g, i) => {
        const encadre = modele.outilsEnAvant && estGroupeOutils(g); // modèle RH : groupe Outils encadré
        contenu.push(new Paragraph({
          spacing: { before: 0, after: i < groupes.length - 1 ? twipsMm(encadre ? 1.2 : 0.5) : 0, ...interligne(S) },
          border: encadre ? Object.fromEntries((['top', 'bottom', 'left', 'right'] as const).map(c => [c, { style: BorderStyle.SINGLE, size: 4, color: 'B9C3D0', space: 3 }])) : undefined,
          children: [...(rempli(g.categorie) ? [T(g.categorie + ' : ', { bold: true, color: encadre ? couleur : undefined })] : []), T(g.elements.join(', '))],
        }));
      });
    }
    if (cle === 'qualites' && d.qualites.length) contenu.push(paragraphe([T(d.qualites.join('  ·  '))]));
    if (cle === 'langues') {
      const runs: ParagraphChild[] = [];
      d.langues.filter(l => rempli(l.langue)).forEach((l, i) => {
        if (i) runs.push(T('  |  ', { color: '9AA0A8' }));
        runs.push(T(l.langue, { bold: true }));
        runs.push(T(' : ' + (NIVEAUX_CECRL.find(n => n.id === l.niveau)?.[langue] ?? l.niveau) + (rempli(l.precision) ? ` — ${l.precision}` : '')));
      });
      if (runs.length) contenu.push(paragraphe(runs));
    }
    if (cle === 'certifications') {
      const l = d.certifications.filter(c => rempli(c.intitule)).map(c => {
        const infos = [c.organisme, c.annee].filter(rempli).join(', ');
        return c.intitule + (infos ? ` (${infos})` : '');
      });
      if (l.length) contenu.push(paragraphe([T(l.join('  |  '))]));
    }
    if (cle === 'centresInteret' && d.centresInteret.length) contenu.push(paragraphe([T(d.centresInteret.join(', '))]));
    if (contenu.length) paragraphes.push(titre(titreSection(cv, cle)), ...contenu);
  });

  // Styles Word natifs : « Title », « heading 1 », « heading 2 » (affichés « Titre », « Titre 1 », « Titre 2 »
  // dans un Word en français). Leur apparence est fixée paragraphe par paragraphe ci-dessus.
  const style = (id: string, name: string) => ({
    id, name, basedOn: 'Normal', next: 'Normal', quickFormat: true,
    run: { font: police, size: demiPoints(S), color: NOIR },
    paragraph: { spacing: { before: 0, after: 0 } },
  });

  return new Document({
    creator: nomComplet(cv) || 'CV Studio',
    title: `CV ${nomComplet(cv)}`.trim(),
    description: p.titre,
    styles: {
      default: { document: { run: { font: police, size: demiPoints(S), color: NOIR }, paragraph: { spacing: { before: 0, after: 0 } } } },
      paragraphStyles: [style('Title', 'Title'), style('Heading1', 'heading 1'), style('Heading2', 'heading 2')],
    },
    numbering: {
      config: [{
        reference: 'puces',
        // retrait identique à l'aperçu : texte à 4,6 mm, puce dans la marge de 3,2 mm
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: twipsMm(4.6), hanging: twipsMm(3.2) } }, run: { color: couleur } } }],
      }],
    },
    sections: [{
      properties: { page: { size: { width: largeurPage, height: 16838 }, margin: { top: Math.round(marge * 0.8), bottom: Math.round(marge * 0.8), left: marge, right: marge, header: 0, footer: 0 } } },
      children: paragraphes,
    }],
  });
}

/** En-tête Word (nom, titre, coordonnées, photo) — identique à l'aperçu ; partagé avec la lettre */
export async function enteteWord(cv: CV, o: { avecPhoto?: boolean; sansNaissance?: boolean; apresMm?: number } = {}): Promise<Paragraph[]> {
  const { style: s } = cv;
  const p = cv.donnees.infosPerso;
  const police = policeWord(cv);
  const S = s.taillePolice;
  const couleur = s.couleur.replace('#', '').toUpperCase();
  const modele = definitionTemplate(cv.templateId);
  const moderne = cv.templateId === 'moderne';
  const rh = cv.templateId === 'rh';
  const finance = !moderne && !rh;
  const alignementEntete = modele.enteteCentre ? AlignmentType.CENTER : AlignmentType.LEFT;
  const NOIR = '1A1A1A';
  const T = (text: string, r: IRunOptions & { pt: number }) => {
    const { pt, ...reste } = r;
    return new TextRun({ text, font: police, size: demiPoints(pt), ...reste });
  };
  const interligne = (pt: number, facteur = s.interligne) => ({ line: twipsPt(pt * facteur), lineRule: LineRuleType.EXACT });
  const paragraphes: Paragraph[] = [];

  const barreRh: { left: IBorderOptions } | undefined = rh ? { left: { style: BorderStyle.SINGLE, size: 24, color: couleur, space: 11 } } : undefined;
  const nom: ParagraphChild[] = [];
  if (o.avecPhoto && modele.photo && p.photo?.affichee) {
    try {
      const cote = Math.round(modele.taillePhotoMm * 3.78); // mm -> pixels à 96 ppp
      nom.push(new ImageRun({
        type: 'png',
        data: await photoRecadreePng(p.photo),
        transformation: { width: cote, height: cote },
        floating: {
          horizontalPosition: { relative: HorizontalPositionRelativeFrom.MARGIN, align: HorizontalPositionAlign.RIGHT },
          verticalPosition: { relative: VerticalPositionRelativeFrom.PARAGRAPH, offset: 0 },
          wrap: { type: TextWrappingType.SQUARE, side: TextWrappingSide.LEFT },
          margins: { left: 114300 },
        },
      }));
    } catch { /* photo ignorée */ }
  }
  const tNom = S * (TAILLE_NOM[cv.templateId] ?? 1.9);
  nom.push(T(nomComplet(cv), { pt: tNom, bold: true, allCaps: finance, color: moderne ? couleur : NOIR }));
  paragraphes.push(new Paragraph({
    heading: HeadingLevel.TITLE, alignment: alignementEntete, border: barreRh,
    spacing: { before: 0, after: 0, ...interligne(tNom, 1.1) }, children: nom,
  }));
  if (rempli(p.titre)) {
    const t = S * 1.12;
    paragraphes.push(new Paragraph({
      alignment: alignementEntete, border: barreRh,
      spacing: { before: twipsMm(0.8), after: 0, ...interligne(t) },
      children: [T(p.titre, { pt: t, bold: true, color: moderne ? NOIR : couleur })],
    }));
  }
  const coordonnees = [p.email, p.telephone, p.ville, p.linkedin, p.site, o.sansNaissance ? '' : p.dateNaissance].filter(rempli).join('  |  ');
  const tContact = S * 0.94;
  paragraphes.push(new Paragraph({
    alignment: alignementEntete,
    // (Moderne : le filet sous l'en-tête est à 3 mm du texte, comme dans l'aperçu)
    spacing: { before: twipsMm(1.2), after: twipsMm(o.apresMm ?? 3 * s.espacementSections), ...interligne(tContact) },
    border: moderne ? { bottom: { style: BorderStyle.SINGLE, size: 16, color: couleur, space: 8 } } : barreRh,
    children: [T(coordonnees, { pt: tContact })],
  }));
  return paragraphes;
}

export async function exporterWord(cv: CV) {
  const doc = await construireDocumentWord(cv);
  saveAs(await Packer.toBlob(doc), nomFichier(cv) + '.docx');
}
