// ============================================================================
//  Lecture d'un document LibreOffice Writer (.odt) : un fichier zip qui contient
//  le texte dans « content.xml ». Un paragraphe = une ligne, comme pour Word.
//  (Google Docs : Fichier › Télécharger › .docx ou .odt, les deux sont acceptés.)
// ============================================================================
import JSZip from 'jszip';
import { ligneVide, nettoyerLigne } from './nettoyage';
import type { ContenuImporte, LigneImportee } from './lirePdf';
import { photoDepuisImagesWord } from './extrairePhoto';

/** Éléments ignorés : commentaires, notes de bas de page, suivi des modifications */
const IGNORES = new Set(['annotation', 'annotation-end', 'note', 'tracked-changes', 'soft-page-break']);

/** Valeur d'un attribut d'après son nom sans préfixe (« c » pour « text:c »), quel que soit le préfixe utilisé */
export function attribut(e: Element, nomLocal: string): string | null {
  for (const a of Array.from(e.attributes)) if (a.localName === nomLocal) return a.value;
  return null;
}

/**
 * Texte d'un élément OpenDocument (paragraphe, cellule…) :
 * <text:s c="3"/> = 3 espaces, <text:tab/> = tabulation, <text:line-break/> = retour à la ligne.
 * Les cadres (zones de texte, images) sont laissés de côté : ils sont lus à part.
 */
export function texteOdf(el: Element): string {
  let out = '';
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType === 3) { out += n.nodeValue ?? ''; continue; }
    if (n.nodeType !== 1) continue;
    const e = n as Element;
    const nom = e.localName;
    if (IGNORES.has(nom) || nom === 'frame') continue;
    if (nom === 's') out += ' '.repeat(Math.max(1, Number(attribut(e, 'c') ?? 1) || 1));
    else if (nom === 'tab') out += '\t';
    else if (nom === 'line-break') out += '\n';
    else out += texteOdf(e);
  }
  return out;
}

/** Parcourt le document dans l'ordre et renvoie une ligne par paragraphe (titres, listes, tableaux, zones de texte) */
export function lignesOdt(contentXml: string): string[] {
  const doc = new DOMParser().parseFromString(contentXml, 'application/xml');
  const corps = Array.from(doc.getElementsByTagNameNS('*', 'text')).find(e => e.parentElement?.localName === 'body') ?? doc.documentElement;
  const lignes: string[] = [];
  const parcourir = (el: Element) => {
    for (const enfant of Array.from(el.children)) {
      const nom = enfant.localName;
      if (IGNORES.has(nom)) continue;
      if (nom === 'p' || nom === 'h') {
        lignes.push(...texteOdf(enfant).split('\n'));
        // Zones de texte ancrées dans ce paragraphe : lues juste après
        for (const cadre of Array.from(enfant.getElementsByTagNameNS('*', 'frame'))) parcourir(cadre);
      } else parcourir(enfant);
    }
  };
  parcourir(corps);
  return lignes;
}

const TYPES_IMAGE: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp' };

export async function lireOdt(fichier: File | ArrayBuffer | Uint8Array): Promise<ContenuImporte> {
  const zip = await JSZip.loadAsync(fichier instanceof File ? await fichier.arrayBuffer() : fichier);
  const contenu = zip.file('content.xml');
  if (!contenu) throw new Error('Ce fichier .odt est illisible (contenu introuvable). Réenregistrez-le depuis LibreOffice ou exportez-le en .docx.');
  const lignes: LigneImportee[] = lignesOdt(await contenu.async('string'))
    .map(l => nettoyerLigne(l))
    .filter(l => !ligneVide(l))
    .map(texte => ({ texte, taille: 10, zone: 'pleine' as const }));
  // Images du document (dossier Pictures/), pour retrouver la photo
  const images: { type: string; base64: string }[] = [];
  for (const [chemin, f] of Object.entries(zip.files)) {
    const type = TYPES_IMAGE[chemin.split('.').pop()?.toLowerCase() ?? ''];
    if (chemin.startsWith('Pictures/') && type && !f.dir) images.push({ type, base64: await f.async('base64') });
  }
  return { lignes, photo: images.length && typeof document !== 'undefined' ? await photoDepuisImagesWord(images) : null };
}
