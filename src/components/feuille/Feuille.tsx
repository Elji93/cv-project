// ============================================================================
//  La feuille CV A4 : rendu modifiable (éditeur) ou figé (impression, mesure)
//  Une seule colonne, du vrai texte, aucun tableau : lisible par les ATS.
// ============================================================================
import { forwardRef, type ReactNode } from 'react';
import type { CleSection, CV, Experience, Formation } from '../../types';
import { affichees, decouperListe, puce, titreSection } from '../../lib/cv';
import { formaterDate, formaterPeriode, lireDate, estEnCours } from '../../lib/dates';
import { NIVEAUX_CECRL } from '../../data/constantes';
import { ChampEditable, libererFocus, placerCurseur } from './ChampEditable';
import { EnteteCv, variablesFeuille } from './EnteteCv';
import { definitionTemplate, estGroupeOutils, groupesAffiches } from './templates';
import './feuille.css';

interface Props {
  cv: CV;
  /** Si présent : édition directe sur la feuille */
  modifier?: (modif: (cv: CV) => void) => void;
}

const rempli = (s?: string) => !!s && s.trim().length > 0;

export const Feuille = forwardRef<HTMLDivElement, Props>(function Feuille({ cv, modifier }, ref) {
  const edition = !!modifier;
  const { style: s, donnees: d, langue } = cv;
  const modele = definitionTemplate(cv.templateId);

  /** Un champ texte : modifiable en édition, simple texte sinon (masqué s'il est vide) */
  const champ = (valeur: string, ecrire: (cv: CV, v: string) => void, indication: string, className = '', bloc = false): ReactNode => {
    if (!edition) return rempli(valeur) ? <span className={className}>{valeur}</span> : null;
    return <ChampEditable valeur={valeur} indication={indication} className={className} bloc={bloc} onChange={v => modifier!(c => ecrire(c, v))} />;
  };

  const variables = variablesFeuille(cv);

  // ---------------------------------------------------------------- En-tête
  const entete = <EnteteCv cv={cv} modifier={modifier} />;

  // ---------------------------------------------------------------- Dates
  const dates = (periode: Experience['periode'], ecrire: (c: CV) => Experience['periode']) => {
    if (!edition) {
      const t = formaterPeriode(periode, langue);
      return t ? <span>{t}</span> : null;
    }
    const fin = periode.enCours ? (langue === 'en' ? 'Present' : 'Présent') : formaterDate(periode.fin, langue);
    return (
      <>
        <ChampEditable valeur={formaterDate(periode.debut, langue)} indication="Début"
          onValider={v => modifier!(c => { const per = ecrire(c); per.debut = lireDate(v) ?? v; })} />
        {' – '}
        <ChampEditable valeur={fin} indication="Fin"
          onValider={v => modifier!(c => {
            const per = ecrire(c);
            per.enCours = estEnCours(v);
            per.fin = per.enCours ? '' : (lireDate(v) ?? v);
          })} />
      </>
    );
  };

  // ---------------------------------------------------------------- Puces
  const puces = (bloc: Experience | Formation, cherche: (c: CV) => Experience | Formation | undefined, avecVide: boolean) => {
    const liste = edition ? (bloc.puces.length || !avecVide ? bloc.puces : null) : bloc.puces.filter(x => rempli(x.texte));
    if (edition && liste === null) {
      // Bloc sans puce : une puce « fantôme » pour pouvoir commencer à écrire
      return (
        <ul className="cv-bullets"><li>
          <ChampEditable valeur="" indication="Verbe d'action + résultat chiffré…"
            onChange={v => {
              // la puce réelle remplace la puce fantôme : on y replace le curseur
              const nouvelle = puce(v);
              modifier!(c => { const b = cherche(c); if (b && !b.puces.length) b.puces.push(nouvelle); });
              placerCurseur(nouvelle.id);
            }} />
        </li></ul>
      );
    }
    if (!liste || !liste.length) return null;
    return (
      <ul className="cv-bullets">
        {liste.map((x, i) => (
          <li key={x.id}>
            {edition ? (
              <ChampEditable
                valeur={x.texte}
                indication="Verbe d'action + résultat chiffré (€, %, délais)…"
                repere={x.id}
                onChange={v => modifier!(c => { const t = cherche(c)?.puces.find(y => y.id === x.id); if (t) t.texte = v; })}
                onEntree={() => {
                  const nouvelle = puce();
                  libererFocus();
                  modifier!(c => { cherche(c)?.puces.splice(i + 1, 0, nouvelle); });
                  placerCurseur(nouvelle.id);
                }}
                onEffacerVide={() => {
                  libererFocus();
                  modifier!(c => { const b = cherche(c); if (b) b.puces = b.puces.filter(y => y.id !== x.id); });
                  if (i > 0) placerCurseur(liste[i - 1].id);
                }}
              />
            ) : x.texte}
          </li>
        ))}
      </ul>
    );
  };

  // ---------------------------------------------------------------- Sections
  const contenuSection = (cle: CleSection): ReactNode => {
    switch (cle) {
      case 'accroche':
        if (!edition && !rempli(d.accroche) && !rempli(d.rythmeAlternance)) return null;
        return (
          <>
            <p className="cv-summary">{champ(d.accroche, (c, v) => { c.donnees.accroche = v; }, 'Accroche : 2-3 lignes reprenant le poste visé et vos atouts clés…', '', true)}</p>
            {/* Rythme d'alternance : affiché seulement s'il est rempli (il se saisit dans « Titre & accroche ») */}
            {rempli(d.rythmeAlternance) && (
              <p className="cv-rythme"><b>{langue === 'en' ? 'Work-study schedule: ' : "Rythme d'alternance : "}</b>
                {champ(d.rythmeAlternance, (c, v) => { c.donnees.rythmeAlternance = v; }, '3 semaines en entreprise / 1 semaine à l’école')}</p>
            )}
          </>
        );

      case 'experiences': {
        const liste = affichees(d.experiences).filter(e => edition || rempli(e.poste) || rempli(e.entreprise));
        if (!liste.length) return null;
        return liste.map(e => {
          const cherche = (c: CV) => c.donnees.experiences.find(x => x.id === e.id);
          return (
            <div className="cv-entry" key={e.id}>
              <div className="cv-line">
                <div className="l">{champ(e.entreprise, (c, v) => { const t = cherche(c); if (t) t.entreprise = v; }, 'Entreprise', 'cv-org')}</div>
                <div className="r">{champ(e.ville, (c, v) => { const t = cherche(c); if (t) t.ville = v; }, 'Ville')}</div>
              </div>
              <div className="cv-line">
                <div className="l">{champ(e.poste, (c, v) => { const t = cherche(c); if (t) t.poste = v; }, 'Intitulé du poste', 'cv-role')}</div>
                <div className="r">{dates(e.periode, c => cherche(c)!.periode)}</div>
              </div>
              {puces(e, cherche, true)}
            </div>
          );
        });
      }

      case 'formations': {
        const liste = affichees(d.formations).filter(f => edition || rempli(f.diplome) || rempli(f.etablissement));
        if (!liste.length) return null;
        return liste.map(f => {
          const cherche = (c: CV) => c.donnees.formations.find(x => x.id === f.id);
          return (
            <div className="cv-entry" key={f.id}>
              <div className="cv-line">
                <div className="l">{champ(f.etablissement, (c, v) => { const t = cherche(c); if (t) t.etablissement = v; }, 'École / Université', 'cv-org')}</div>
                <div className="r">{champ(f.ville, (c, v) => { const t = cherche(c); if (t) t.ville = v; }, 'Ville')}</div>
              </div>
              <div className="cv-line">
                <div className="l">{champ(f.diplome, (c, v) => { const t = cherche(c); if (t) t.diplome = v; }, 'Diplôme, spécialité', 'cv-role')}</div>
                <div className="r">{dates(f.periode, c => cherche(c)!.periode)}</div>
              </div>
              {puces(f, cherche, false)}
            </div>
          );
        });
      }

      case 'competences': {
        const liste = groupesAffiches(d.competences, cv.templateId).filter(g => edition || g.elements.length);
        if (!liste.length) return null;
        return liste.map(g => {
          const cherche = (c: CV) => c.donnees.competences.find(x => x.id === g.id);
          return (
            <div className={`cv-skill${modele.outilsEnAvant && estGroupeOutils(g) ? ' outils' : ''}`} key={g.id}>
              {(edition || rempli(g.categorie)) && <b>{champ(g.categorie, (c, v) => { const t = cherche(c); if (t) t.categorie = v; }, 'Catégorie')} : </b>}
              {champ(g.elements.join(', '), (c, v) => { const t = cherche(c); if (t) t.elements = decouperListe(v); }, 'Excel, VBA, IFRS…')}
            </div>
          );
        });
      }

      case 'langues': {
        const liste = d.langues.filter(l => rempli(l.langue));
        if (!liste.length && !edition) return null;
        return (
          <div className="cv-inline">
            {liste.map(l => {
              const niveau = NIVEAUX_CECRL.find(n => n.id === l.niveau)?.[langue] ?? l.niveau;
              return (
                <span className="item" key={l.id}>
                  <b>{champ(l.langue, (c, v) => { const t = c.donnees.langues.find(x => x.id === l.id); if (t) t.langue = v; }, 'Langue')}</b>
                  {' : '}{niveau}{rempli(l.precision) && ` — ${l.precision}`}
                </span>
              );
            })}
            {edition && !liste.length && <span className="text-gray-400">Ajoutez vos langues dans le panneau « Compétences & langues »</span>}
          </div>
        );
      }

      case 'certifications': {
        const liste = d.certifications.filter(x => edition || rempli(x.intitule));
        if (!liste.length) return null;
        return (
          <div className="cv-inline">
            {liste.map(x => {
              const cherche = (c: CV) => c.donnees.certifications.find(y => y.id === x.id);
              const infos = [x.organisme, x.annee].filter(rempli).join(', ');
              return (
                <span className="item" key={x.id}>
                  {champ(x.intitule, (c, v) => { const t = cherche(c); if (t) t.intitule = v; }, 'Certification')}
                  {edition
                    ? <> ({champ(x.organisme, (c, v) => { const t = cherche(c); if (t) t.organisme = v; }, 'Organisme')}, {champ(x.annee, (c, v) => { const t = cherche(c); if (t) t.annee = v; }, 'Année')})</>
                    : infos && ` (${infos})`}
                </span>
              );
            })}
          </div>
        );
      }

      case 'qualites':
        if (!edition && !d.qualites.length) return null;
        return <p className="cv-qualites">{champ(d.qualites.join(' · '), (c, v) => { c.donnees.qualites = decouperListe(v, /[,;·•|]/); }, 'Rigueur, esprit d’équipe, curiosité…', '', true)}</p>;

      case 'centresInteret':
        if (!edition && !d.centresInteret.length) return null;
        return <p>{champ(d.centresInteret.join(', '), (c, v) => { c.donnees.centresInteret = decouperListe(v); }, 'Sport, engagement associatif…', '', true)}</p>;
    }
  };

  return (
    <div ref={ref} className={`cv-page tpl-${cv.templateId}${s.majusculesTitres ? ' upper' : ''}`} style={variables} lang={langue}>
      {entete}
      {cv.ordreSections.filter(k => !cv.sectionsMasquees.includes(k)).map(cle => {
        const contenu = contenuSection(cle);
        if (!contenu) return null;
        return (
          <section className="cv-section" key={cle} data-section={cle}>
            <h2>{edition
              ? <ChampEditable valeur={titreSection(cv, cle)} indication="Titre de section" onChange={v => modifier!(c => { c.titresPersonnalises[cle] = v; })} />
              : titreSection(cv, cle)}</h2>
            {contenu}
          </section>
        );
      })}
    </div>
  );
});
