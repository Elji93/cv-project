// ============================================================================
//  Export Word de la lettre de motivation : mêmes dimensions que l'aperçu
//  (lettre.css) et même en-tête que le CV relié.
// ============================================================================
import { AlignmentType, Document, LineRuleType, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import type { CV, LettreMotivation } from '../../types';
import { nomComplet, policeWord } from '../cv';
import { lieuDate, nomFichierLettre, paragraphes } from '../lettre';
import { enteteWord } from './exportWord';

const twipsMm = (mm: number) => Math.round(mm * 56.7);
const NOIR = '1A1A1A';

export async function construireLettreWord(cv: CV, l: LettreMotivation): Promise<Document> {
  const police = policeWord(cv);
  const taille = Math.max(cv.style.taillePolice, 10.5);
  const ligne = { line: Math.round(taille * 1.38 * 20), lineRule: LineRuleType.EXACT };
  const largeurTexte = 11906 - twipsMm(20) * 2;
  const retraitDroite = largeurTexte - twipsMm(75); // bloc de 75 mm calé à droite
  const T = (text: string, bold = false) => new TextRun({ text, font: police, size: Math.round(taille * 2), bold });
  const para = (children: TextRun[], o: { apres?: number; avant?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; retrait?: number } = {}) =>
    new Paragraph({
      alignment: o.align ?? AlignmentType.LEFT,
      indent: o.retrait ? { left: o.retrait } : undefined,
      spacing: { before: o.avant ?? 0, after: o.apres ?? 0, ...ligne },
      children,
    });

  const corps: Paragraph[] = [...await enteteWord(cv, { sansNaissance: true, apresMm: 9 })];
  const dest = l.destinataire.replace(/\r/g, '').split('\n').map(x => x.trim()).filter(Boolean);
  dest.forEach((x, i) => corps.push(para([T(x)], { retrait: retraitDroite, apres: i === dest.length - 1 ? twipsMm(6) : 0 })));
  corps.push(para([T(lieuDate(cv, l))], { align: AlignmentType.RIGHT, apres: twipsMm(7) }));
  if (l.objet.trim()) corps.push(para([T(cv.langue === 'en' ? 'Subject: ' : 'Objet : ', true), T(l.objet.trim())], { apres: twipsMm(6) }));
  const texte = [l.appel.trim(), ...paragraphes(l.corps), ...paragraphes(l.politesse)].filter(Boolean);
  for (const x of texte) corps.push(para([T(x)], { align: AlignmentType.JUSTIFIED, apres: twipsMm(3.2) }));
  corps.push(para([T(nomComplet(cv), true)], { retrait: retraitDroite, avant: twipsMm(9 - 3.2) }));

  return new Document({
    creator: nomComplet(cv) || 'CV Studio',
    title: `Lettre de motivation ${nomComplet(cv)}`.trim(),
    styles: { default: { document: { run: { font: police, size: Math.round(taille * 2), color: NOIR }, paragraph: { spacing: { before: 0, after: 0 } } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: twipsMm(16), bottom: twipsMm(16), left: twipsMm(20), right: twipsMm(20), header: 0, footer: 0 } } },
      children: corps,
    }],
  });
}

export async function exporterLettreWord(cv: CV, l: LettreMotivation) {
  const doc = await construireLettreWord(cv, l);
  saveAs(await Packer.toBlob(doc), nomFichierLettre(cv, l) + '.docx');
}
