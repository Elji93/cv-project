// ============================================================================
//  Extraction de la photo de profil d'un CV importé (PDF ou Word)
//  On garde l'image qui ressemble à une photo d'identité : ni une petite icône,
//  ni un fond de page, à peu près carrée, plutôt en haut de la première page.
// ============================================================================
import type { Photo } from '../../types';

/** Taille max de la photo stockée (même règle que l'ajout manuel : 400 px, JPEG 80 %) */
const COTE_MAX = 400;

/** Dessine une source d'image dans un canvas réduit et renvoie un JPEG compressé */
function versJpeg(source: CanvasImageSource, largeur: number, hauteur: number): string {
  const ratio = Math.min(1, COTE_MAX / Math.max(largeur, hauteur));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(largeur * ratio));
  c.height = Math.max(1, Math.round(hauteur * ratio));
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.8);
}

export const photoDepuisImage = (image: string): Photo =>
  ({ image, forme: 'rond', zoom: 1, decalageX: 0, decalageY: 0, affichee: true });

// ---------------------------------------------------------------------------
//  PDF
// ---------------------------------------------------------------------------

/** Objet image renvoyé par pdf.js : soit une image prête (bitmap), soit des pixels bruts */
interface ImagePdf {
  width: number;
  height: number;
  bitmap?: ImageBitmap;
  data?: Uint8ClampedArray | Uint8Array;
  /** 1 = noir et blanc 1 bit, 2 = RVB, 3 = RVBA */
  kind?: number;
}

/** Convertit une image pdf.js en canvas */
function imagePdfVersCanvas(img: ImagePdf): HTMLCanvasElement | ImageBitmap | null {
  if (img.bitmap) return img.bitmap;
  if (!img.data || !img.width || !img.height) return null;
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d')!;
  const pixels = ctx.createImageData(img.width, img.height);
  const n = img.width * img.height;
  const src = img.data;
  if (img.kind === 3) pixels.data.set(src.subarray(0, n * 4));
  else if (img.kind === 2) {
    for (let i = 0; i < n; i++) {
      pixels.data[i * 4] = src[i * 3];
      pixels.data[i * 4 + 1] = src[i * 3 + 1];
      pixels.data[i * 4 + 2] = src[i * 3 + 2];
      pixels.data[i * 4 + 3] = 255;
    }
  } else return null; // image noir et blanc 1 bit : ce n'est pas une photo
  ctx.putImageData(pixels, 0, 0);
  return c;
}

/** Récupère un objet de la page pdf.js (il peut arriver un peu plus tard) */
function objetPdf(page: { objs: { get: (id: string, cb: (o: unknown) => void) => void }; commonObjs: { get: (id: string, cb: (o: unknown) => void) => void } }, id: string): Promise<ImagePdf | null> {
  return new Promise(resolve => {
    const depot = id.startsWith('g_') ? page.commonObjs : page.objs;
    const delai = setTimeout(() => resolve(null), 3000);
    try { depot.get(id, o => { clearTimeout(delai); resolve(o as ImagePdf); }); }
    catch { clearTimeout(delai); resolve(null); }
  });
}

type Matrice = [number, number, number, number, number, number];
const multiplier = (m: Matrice, n: Matrice): Matrice => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];

/**
 * Cherche la photo sur la première page du PDF.
 * `pdf` est le document pdf.js déjà ouvert ; `OPS` la table des opérations de pdf.js.
 */
export async function extrairePhotoPdf(
  // types volontairement souples : on ne dépend que de quelques méthodes de pdf.js
  pdf: { getPage: (n: number) => Promise<unknown> },
  OPS: Record<string, number>,
): Promise<Photo | null> {
  try {
    const page = await pdf.getPage(1) as {
      getViewport: (o: { scale: number }) => { width: number; height: number };
      getOperatorList: () => Promise<{ fnArray: number[]; argsArray: unknown[][] }>;
      objs: { get: (id: string, cb: (o: unknown) => void) => void };
      commonObjs: { get: (id: string, cb: (o: unknown) => void) => void };
    };
    const { width: lPage, height: hPage } = page.getViewport({ scale: 1 });
    const ops = await page.getOperatorList();

    // On suit la matrice de transformation pour connaître la taille et la position de chaque image
    let ctm: Matrice = [1, 0, 0, 1, 0, 0];
    const pile: Matrice[] = [];
    const candidates: { id?: string; inline?: ImagePdf; l: number; h: number; haut: number }[] = [];
    ops.fnArray.forEach((fn, i) => {
      const args = ops.argsArray[i];
      if (fn === OPS.save) pile.push(ctm);
      else if (fn === OPS.restore) ctm = pile.pop() ?? ctm;
      else if (fn === OPS.transform) ctm = multiplier(ctm, args as Matrice);
      else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
        const l = Math.hypot(ctm[0], ctm[1]);
        const h = Math.hypot(ctm[2], ctm[3]);
        const haut = ctm[5] + Math.max(0, ctm[3]); // bord haut de l'image (origine en bas de page)
        if (fn === OPS.paintImageXObject) candidates.push({ id: args[0] as string, l, h, haut });
        else candidates.push({ inline: args[0] as ImagePdf, l, h, haut });
      }
    });

    // Une photo : entre 35 et 300 points de côté, pas plus de 60 % de la page, à peu près carrée
    const plausibles = candidates.filter(c =>
      c.l >= 35 && c.h >= 35 && c.l <= 300 && c.h <= 300 && c.l < lPage * 0.6 && c.h < hPage * 0.5
      && c.l / c.h > 0.55 && c.l / c.h < 1.8);
    // La plus grande, en privilégiant le haut de la page
    plausibles.sort((a, b) => b.l * b.h * (0.5 + b.haut / hPage) - a.l * a.h * (0.5 + a.haut / hPage));

    for (const c of plausibles) {
      const img = c.inline ?? (c.id ? await objetPdf(page, c.id) : null);
      if (!img) continue;
      const source = imagePdfVersCanvas(img);
      if (!source) continue;
      if (img.width < 60 || img.height < 60) continue; // trop petite pour une photo
      return photoDepuisImage(versJpeg(source, img.width, img.height));
    }
  } catch (e) {
    console.warn('Photo non extraite', e);
  }
  return null;
}

// ---------------------------------------------------------------------------
//  Word : mammoth nous donne chaque image ; on garde la plus grande qui semble être une photo
// ---------------------------------------------------------------------------
export async function photoDepuisImagesWord(images: { type: string; base64: string }[]): Promise<Photo | null> {
  let meilleure: { url: string; l: number; h: number } | null = null;
  for (const im of images) {
    if (!/^image\/(jpe?g|png|gif|bmp|webp)$/.test(im.type)) continue;
    const url = `data:${im.type};base64,${im.base64}`;
    const dims = await new Promise<{ l: number; h: number } | null>(resolve => {
      const img = new Image();
      img.onload = () => resolve({ l: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = url;
    });
    if (!dims || dims.l < 80 || dims.h < 80 || dims.l / dims.h > 1.8 || dims.l / dims.h < 0.55) continue;
    if (!meilleure || dims.l * dims.h > meilleure.l * meilleure.h) meilleure = { url, ...dims };
  }
  if (!meilleure) return null;
  const img = new Image();
  img.src = meilleure.url;
  await img.decode();
  return photoDepuisImage(versJpeg(img, meilleure.l, meilleure.h));
}
