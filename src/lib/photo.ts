// ============================================================================
//  Photo de profil : compression avant stockage et recadrage
// ============================================================================
import type { Photo } from '../types';

/** Réduit l'image (côté max 400 px, JPEG 80 %) pour ne pas saturer le localStorage */
export function compresserPhoto(fichier: File, max = 400, qualite = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onerror = () => reject(new Error('Lecture du fichier impossible'));
    lecteur.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image illisible'));
      img.onload = () => {
        const ratio = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * ratio);
        c.height = Math.round(img.height * ratio);
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', qualite));
      };
      img.src = lecteur.result as string;
    };
    lecteur.readAsDataURL(fichier);
  });
}

/** Style CSS de l'image recadrée (même calcul que le canvas ci-dessous) */
export const styleRecadrage = (p: Photo) => ({
  transform: `scale(${p.zoom}) translate(${p.decalageX}%, ${p.decalageY}%)`,
  transformOrigin: 'center',
});

/** Image carrée recadrée au format PNG (pour l'export Word) */
export function photoRecadreePng(p: Photo, taille = 400): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error('Photo illisible'));
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = taille;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, taille, taille);
      const couverture = Math.max(taille / img.width, taille / img.height);
      const echelle = couverture * p.zoom;
      const l = img.width * echelle, h = img.height * echelle;
      const x = taille / 2 - l / 2 + p.zoom * (p.decalageX / 100) * taille;
      const y = taille / 2 - h / 2 + p.zoom * (p.decalageY / 100) * taille;
      if (p.forme === 'rond') {
        ctx.beginPath();
        ctx.arc(taille / 2, taille / 2, taille / 2, 0, Math.PI * 2);
        ctx.clip();
      }
      ctx.drawImage(img, x, y, l, h);
      c.toBlob(b => {
        if (!b) return reject(new Error('Conversion impossible'));
        b.arrayBuffer().then(buf => resolve(new Uint8Array(buf)));
      }, 'image/png');
    };
    img.src = p.image;
  });
}
