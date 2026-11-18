// Nom de fichier automatique : CV_Prenom_Nom_Poste
import type { CV } from '../../types';

export function nomFichier(cv: CV): string {
  const p = cv.donnees.infosPerso;
  const morceaux = ['CV', p.prenom, p.nom, p.titre.split(/[—–|(]/)[0]].map(s => s.trim()).filter(Boolean);
  if (morceaux.length === 1) morceaux.push(cv.nom || 'sans_nom');
  return morceaux.join('_')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'and').replace(/[^\w-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
    .slice(0, 80);
}
