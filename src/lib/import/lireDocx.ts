// Lecture d'un fichier Word (.docx) avec mammoth : texte brut, un paragraphe par ligne
import { ligneVide, nettoyerLigne } from './nettoyage';
import type { ContenuImporte, LigneImportee } from './lirePdf';
import { photoDepuisImagesWord } from './extrairePhoto';

export async function lireDocx(fichier: File): Promise<ContenuImporte> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await fichier.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  // Les images du document, pour retrouver la photo
  const images: { type: string; base64: string }[] = [];
  await mammoth.convertToHtml({ arrayBuffer }, {
    convertImage: mammoth.images.imgElement(async image => {
      images.push({ type: image.contentType, base64: await image.read('base64') });
      return { src: '' };
    }),
  });
  return { lignes: lignesDepuisTexte(value), photo: await photoDepuisImagesWord(images) };
}

/** Texte collé ou .txt : une ligne = une ligne */
export function lignesDepuisTexte(texte: string): LigneImportee[] {
  return texte.replace(/\r/g, '').split('\n')
    .map(l => nettoyerLigne(l))
    .filter(l => !ligneVide(l))
    .map(texte => ({ texte, taille: 10, zone: 'pleine' as const }));
}
