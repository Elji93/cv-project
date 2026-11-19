// ============================================================================
//  Conseils actionnables, classés par priorité, à partir du résultat de l'analyse
// ============================================================================
import type { CV, Experience } from '../../types';
import { titreSection } from '../cv';
import type { Conseil, ResultatAts } from './scoring';
import { CHIFFRE, commenceParVerbe } from './scoring';

interface Contexte {
  titre: { nature: 'exact' | 'synonyme' | 'partiel' | 'absent' | 'manquant' };
  speciaux: string[];
  titresOk: { experiences: boolean; formations: boolean; competences: boolean };
  contact: { email: boolean; telephone: boolean; ville: boolean; linkedin: boolean };
  tientSurUnePage: boolean;
  puces: string[];
  chiffrees: number;
  experiences: Experience[];
}

const guillemets = (l: string[]) => l.map(t => `« ${t} »`).join(', ');
const rempli = (s?: string) => !!s && s.trim().length > 0;

export function genererConseils(cv: CV, r: ResultatAts, c: Contexte): Conseil[] {
  const conseils: Conseil[] = [];
  const p = cv.donnees.infosPerso;
  const enAnglais = r.langueOffre === 'en';

  // ----- Titre
  if (c.titre.nature === 'manquant') conseils.push({ priorite: 'haute', texte: `Ajoutez un titre sous votre nom avec l'intitulé exact de l'offre : « ${r.intitule} ».` });
  else if (c.titre.nature !== 'exact' && r.intitule) conseils.push({
    priorite: c.titre.nature === 'synonyme' ? 'moyenne' : 'haute',
    texte: `Ajoutez l'intitulé exact « ${r.intitule} » en titre de votre CV (actuellement « ${p.titre} »). Les ATS comparent d'abord ces deux libellés${c.titre.nature === 'synonyme' ? ' : un synonyme est reconnu, mais l’intitulé exact rapporte plus' : ''}.`,
  });

  // ----- Mots-clés
  const metier = r.motsCles.filter(k => k.categorie !== 'Offre' && k.categorie !== 'Savoir-être');
  const exigesManquants = r.motsCles.filter(k => k.ou === 'absent' && k.priorite === 'obligatoire');
  const autresManquants = metier.filter(k => k.ou === 'absent' && k.priorite === 'normal');
  const apprecies = metier.filter(k => k.ou === 'absent' && k.priorite === 'souhaite');
  if (exigesManquants.length) conseils.push({ priorite: 'haute', texte: `Mots-clés exigés absents de votre CV : ${guillemets(exigesManquants.slice(0, 8).map(k => k.termeOffre))}. Si vous les maîtrisez, ajoutez-les dans les Compétences et prouvez-les dans une expérience.` });
  if (autresManquants.length) conseils.push({ priorite: 'haute', texte: `Compétences de l'offre à intégrer si vous les avez : ${guillemets(autresManquants.slice(0, 8).map(k => k.termeOffre))}.` });
  const certifs = r.motsCles.filter(k => k.categorie === 'Certification' && k.ou === 'absent');
  if (certifs.length) conseils.push({
    priorite: certifs.some(k => k.priorite === 'obligatoire') ? 'haute' : 'moyenne',
    texte: `Certification${certifs.length > 1 ? 's' : ''} citée${certifs.length > 1 ? 's' : ''} dans l'offre : ${guillemets(certifs.map(k => k.termeOffre))}. Si vous l'avez ou la préparez, ajoutez-la dans la section ${titreSection(cv, 'certifications')} (avec « en cours » et la date d'examen prévue) : voir « Booster votre candidature ».`,
  });
  const outils = [...exigesManquants, ...autresManquants].filter(k => k.categorie === 'Outil');
  if (outils.length) conseils.push({ priorite: 'moyenne', texte: `Les ATS filtrent souvent sur les outils : ${guillemets(outils.map(k => k.termeOffre))}. Indiquez votre niveau (ex. « Excel avancé : TCD, VBA »).` });

  // Offre en anglais, CV en français : écrire les deux termes
  const viaFrancais = r.motsCles.filter(k => k.viaSynonyme && k.ou !== 'absent');
  if (enAnglais && viaFrancais.length) {
    const exemple = viaFrancais[0];
    conseils.push({ priorite: 'moyenne', texte: `L'offre est en anglais : ajoutez les termes anglais entre parenthèses, ex. « ${majuscule(exemple.termeCv)} (${exemple.termeOffre}) ». Termes concernés : ${guillemets(viaFrancais.slice(0, 6).map(k => k.termeOffre))}.` });
  } else if (viaFrancais.length) {
    conseils.push({ priorite: 'basse', texte: `Reconnus grâce à un synonyme : ${viaFrancais.slice(0, 5).map(k => `« ${k.termeOffre} » (vous avez écrit « ${k.termeCv} »)`).join(', ')}. Reprendre le mot exact de l'offre est encore plus sûr pour les ATS.` });
  }

  const seulementExperiences = metier.filter(k => k.ou === 'experience');
  if (seulementExperiences.length) conseils.push({ priorite: 'moyenne', texte: `${guillemets(seulementExperiences.slice(0, 6).map(k => k.termeOffre))} n'apparai${seulementExperiences.length > 1 ? 'ssent' : 't'} que dans vos expériences : reprenez-les aussi dans l'accroche ou les Compétences, où ils pèsent plus.` });
  if (apprecies.length) conseils.push({ priorite: 'basse', texte: `Atouts appréciés par l'offre (« un plus ») : ${guillemets(apprecies.slice(0, 6).map(k => k.termeOffre))}. À ajouter seulement si c'est vrai.` });
  const expressions = r.motsCles.filter(k => k.categorie === 'Offre' && k.ou === 'absent');
  if (expressions.length) conseils.push({ priorite: 'basse', texte: `Expressions qui reviennent dans l'offre : ${guillemets(expressions.slice(0, 6).map(k => k.termeOffre))}. Reprenez-les si elles décrivent ce que vous avez fait.` });
  const savoirEtre = r.motsCles.filter(k => k.categorie === 'Savoir-être' && k.ou === 'absent');
  if (savoirEtre.length) conseils.push({ priorite: 'basse', texte: `Savoir-être recherchés : ${guillemets(savoirEtre.map(k => k.termeOffre))}. Ajoutez-les dans la section ${titreSection(cv, 'qualites')} et illustrez-les par un fait (« Coordonné une équipe de 4… »).` });

  // ----- Expériences & impact
  if (!c.experiences.length) conseils.push({ priorite: 'haute', texte: 'Ajoutez au moins une expérience (stage, alternance, job étudiant) avec 3 à 5 puces de réalisations.' });
  const derniere = c.experiences[0];
  if (derniere) {
    const lignes = derniere.puces.map(x => x.texte).filter(rempli);
    const avecChiffre = lignes.filter(t => CHIFFRE.test(t)).length;
    const nom = [derniere.poste, derniere.entreprise].filter(rempli).join(' — ');
    if (!lignes.length) conseils.push({ priorite: 'haute', texte: `Décrivez votre dernière expérience (${nom}) en 3 à 5 puces de réalisations.` });
    else if (avecChiffre / lignes.length < 0.6) conseils.push({ priorite: 'haute', texte: `Chiffrez davantage vos missions sur votre dernière expérience (${nom}) : ${avecChiffre}/${lignes.length} puce(s) chiffrée(s). Ajoutez montants (k€, M€), %, volumes, délais.` });
  }
  const sansVerbe = c.puces.filter(t => !commenceParVerbe(t));
  if (sansVerbe.length) conseils.push({ priorite: 'moyenne', texte: `Commencez chaque puce par un verbe d'action (${enAnglais ? 'Led, Built, Delivered' : 'Piloté, Réalisé, Optimisé'}…) : ${sansVerbe.slice(0, 2).map(t => `« ${t.slice(0, 60)}${t.length > 60 ? '…' : ''} »`).join(' ; ')}${sansVerbe.length > 2 ? ` (+${sansVerbe.length - 2})` : ''}.` });

  // ----- Conformité
  if (c.speciaux.length) conseils.push({ priorite: 'haute', texte: `Retirez les caractères spéciaux ${c.speciaux.join(' ')} : certains ATS les rendent illisibles.` });
  if (!c.titresOk.experiences) conseils.push({ priorite: 'haute', texte: `Renommez la section « ${titreSection(cv, 'experiences')} » en « ${enAnglais ? 'Professional Experience' : 'Expériences professionnelles'} ».` });
  if (!c.titresOk.formations) conseils.push({ priorite: 'haute', texte: `Renommez la section « ${titreSection(cv, 'formations')} » en « ${enAnglais ? 'Education' : 'Formation'} ».` });
  if (!c.titresOk.competences) conseils.push({ priorite: 'haute', texte: `Affichez une section « ${enAnglais ? 'Skills' : 'Compétences'} » : c'est là que les ATS cherchent les mots-clés.` });
  const NOMS_CONTACT = { email: 'email', telephone: 'téléphone', ville: 'ville', linkedin: 'URL LinkedIn' };
  const absents = (Object.entries(c.contact) as [keyof Contexte['contact'], boolean][]).filter(([, ok]) => !ok).map(([k]) => k);
  // masquée volontairement : on le signale sans insister ; vide : on invite à la compléter
  const masques = absents.filter(k => cv.donnees.infosPerso.masques?.includes(k)).map(k => NOMS_CONTACT[k]);
  const manque = absents.filter(k => !cv.donnees.infosPerso.masques?.includes(k)).map(k => NOMS_CONTACT[k]);
  if (manque.length) conseils.push({ priorite: 'moyenne', texte: `Complétez vos coordonnées : ${manque.join(', ')}.` });
  if (masques.length) conseils.push({ priorite: 'basse', texte: `Vous avez masqué : ${masques.join(', ')}. C'est votre choix ; sachez seulement que certains ATS et recruteurs s'attendent à les trouver.` });
  if (!c.tientSurUnePage) conseils.push({ priorite: 'haute', texte: 'Votre CV dépasse une page A4 : utilisez « Tout faire tenir sur 1 page » dans l’éditeur.' });
  if (enAnglais && cv.langue === 'fr') conseils.push({ priorite: 'basse', texte: 'Offre en anglais : créez une version anglaise du CV (Mise en forme › « Créer une version anglaise ») : le texte est traduit via ChatGPT / Claude, titres de sections et dates compris.' });
  if (enAnglais && p.photo?.affichee) conseils.push({ priorite: 'basse', texte: 'Offre en anglais : la photo est déconseillée pour les candidatures UK / US. Décochez « Afficher » dans Infos & photo.' });

  const ordre = { haute: 0, moyenne: 1, basse: 2 };
  return conseils.sort((a, b) => ordre[a.priorite] - ordre[b.priorite]);
}

const majuscule = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
