// ============================================================================
//  En-tête du CV (nom, titre, coordonnées, photo) — partagé par la feuille CV
//  et la lettre de motivation, pour une candidature à l'identité visuelle unique.
// ============================================================================
import { Fragment, type CSSProperties, type ReactNode } from 'react';
import type { ChampContact, CV, InfosPerso } from '../../types';
import { styleRecadrage } from '../../lib/photo';
import { estMasque, policeCss } from '../../lib/cv';
import { ChampEditable } from './ChampEditable';
import { definitionTemplate } from './templates';

const rempli = (s?: string) => !!s && s.trim().length > 0;

const COORDONNEES: [keyof InfosPerso, string][] = [
  ['email', 'Email'], ['telephone', 'Téléphone'], ['ville', 'Ville'], ['linkedin', 'LinkedIn'], ['site', 'Site / autre'],
  ['dateNaissance', 'Date de naissance'],
];

interface Props {
  cv: CV;
  /** Si présent : édition directe sur la feuille */
  modifier?: (modif: (cv: CV) => void) => void;
  /** La lettre n'affiche pas la photo */
  sansPhoto?: boolean;
  /** Coordonnées sans la date de naissance (lettre) */
  sansNaissance?: boolean;
}

export function EnteteCv({ cv, modifier, sansPhoto, sansNaissance }: Props) {
  const edition = !!modifier;
  const p = cv.donnees.infosPerso;
  const modele = definitionTemplate(cv.templateId);

  const champ = (valeur: string, ecrire: (cv: CV, v: string) => void, indication: string): ReactNode => {
    if (!edition) return rempli(valeur) ? <span>{valeur}</span> : null;
    return <ChampEditable valeur={valeur} indication={indication} onChange={v => modifier!(c => ecrire(c, v))} />;
  };

  const visibles = COORDONNEES
    .filter(([k]) => !(sansNaissance && k === 'dateNaissance'))
    // coordonnée masquée par l'utilisatrice : jamais affichée (ni imprimée), même en mode édition
    .filter(([k]) => !estMasque(cv, k as ChampContact))
    .filter(([k], i) => rempli(p[k] as string) || (edition && i < 4));
  const photo = !sansPhoto && modele.photo && p.photo?.affichee ? p.photo : null;

  return (
    <header className={`cv-header${photo ? ' avec-photo' : ''}`} data-section="entete">
      {photo && (
        <div className={`cv-photo ${photo.forme === 'rond' ? 'round' : ''}`} style={{ width: `${modele.taillePhotoMm}mm`, height: `${modele.taillePhotoMm}mm` }}>
          <img src={photo.image} alt="" style={styleRecadrage(photo)} />
        </div>
      )}
      <div className="cv-id">
        <h1 className="cv-name">
          {champ(p.prenom, (c, v) => { c.donnees.infosPerso.prenom = v; }, 'Prénom')}
          {(edition || (rempli(p.prenom) && rempli(p.nom))) && ' '}
          {champ(p.nom, (c, v) => { c.donnees.infosPerso.nom = v; }, 'Nom')}
        </h1>
        {(edition || rempli(p.titre)) && <div className="cv-title">{champ(p.titre, (c, v) => { c.donnees.infosPerso.titre = v; }, 'Intitulé exact du poste visé')}</div>}
        <div className="cv-contact">
          {visibles.map(([k, indication], i) => (
            <Fragment key={k}>
              {i > 0 && <span className="sep">|</span>}
              {champ(p[k] as string, (c, v) => { (c.donnees.infosPerso[k] as string) = v; }, indication)}
            </Fragment>
          ))}
        </div>
      </div>
    </header>
  );
}


/** Variables CSS de la feuille (couleur, police, taille…) tirées du style du CV */
export const variablesFeuille = (cv: CV) => ({
  '--cv-accent': cv.style.couleur,
  '--cv-font': policeCss(cv),
  '--cv-size': `${cv.style.taillePolice}pt`,
  '--cv-lh': cv.style.interligne,
  '--cv-margin': `${cv.style.marges}mm`,
  '--cv-gap': cv.style.espacementSections,
}) as CSSProperties;
