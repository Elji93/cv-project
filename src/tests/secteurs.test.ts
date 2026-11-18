// Tests du lexique ATS multisecteur (commerce, marketing, supply chain, industrie, BTP,
// santé, juridique, assistanat, hôtellerie, formation) et des parcours « Booster »
import { describe, expect, it } from 'vitest';
import { cvExemple } from '../data/cvExemple';
import { SYNONYMES_SECTEURS, INTITULES_SECTEURS } from '../data/secteurs';
import { SYNONYMES, INTITULES_POSTES } from '../data/synonymes';
import { PARCOURS } from '../data/certifications';
import { extraireMotsCles } from '../lib/ats/extraction';
import { analyserCv } from '../lib/ats/scoring';
import { recommander } from '../lib/ats/recommandations';
import { contient, mots, normaliser, regexSurlignage } from '../lib/ats/normalisation';
import type { CV } from '../types';

/** Une offre type par secteur : parcours attendu et mots-clés du dictionnaire attendus */
const OFFRES: { parcours: string; offre: string; motsCles: string[] }[] = [
  { parcours: 'commerce', motsCles: ['Développement commercial', 'Négociation', 'CRM', 'Salesforce', 'B2B / B2C', 'Grands comptes (KAM)'],
    offre: `Commercial terrain B2B H/F
Vous développez un portefeuille clients PME et grands comptes : prospection, négociation, suivi dans Salesforce.
Profil : 2 ans d'expérience en vente, maîtrise d'un CRM exigée, sens commercial et ténacité. Permis B indispensable.` },
  { parcours: 'marketing', motsCles: ['Marketing digital', 'SEO', 'Réseaux sociaux', 'Google Analytics', 'Emailing / marketing automation', 'Canva'],
    offre: `Chargé(e) de marketing digital
Missions : piloter le SEO et les campagnes Google Ads, animer les réseaux sociaux, créer des newsletters (Brevo).
Vous maîtrisez Google Analytics et Canva ; la Suite Adobe est un plus.` },
  { parcours: 'supply', motsCles: ['Achats', 'Gestion des fournisseurs', 'Négociation', 'Gestion des stocks', 'Approvisionnement', 'SAP'],
    offre: `Acheteur / approvisionneur H/F
Rattaché à la direction supply chain, vous gérez les achats de composants, la gestion des fournisseurs et la négociation des prix.
Suivi des approvisionnements et de la gestion des stocks sous SAP. Connaissance des Incoterms appréciée.` },
  { parcours: 'industrie', motsCles: ['Qualité', 'Normes ISO (9001, 14001, 45001…)', 'Non-conformités / CAPA', 'Amélioration continue / Lean', 'Résolution de problèmes (AMDEC, 8D…)'],
    offre: `Technicien qualité – site de production
Vous animez le système de management de la qualité ISO 9001, traitez les non-conformités (8D, AMDEC) et pilotez les actions correctives.
Démarche d'amélioration continue (5S, lean manufacturing). Une certification Green Belt serait un plus.` },
  { parcours: 'btp', motsCles: ['BTP', 'Conduite de travaux / chantier', 'Études de prix / métré', 'AutoCAD', 'BIM'],
    offre: `Conducteur de travaux gros œuvre H/F
Vous assurez la conduite de travaux de logements collectifs : suivi de chantier, planning, réunions de chantier, métrés.
Maîtrise d'AutoCAD exigée ; une première approche du BIM est appréciée. Habilitation AIPR souhaitée.` },
  { parcours: 'sante', motsCles: ['Soins', 'Établissements de santé', 'Gériatrie / personnes âgées', 'Hygiène / asepsie'],
    offre: `Aide-soignant(e) en EHPAD
Vous réalisez les soins d'hygiène et de confort des résidents, la prise en charge des patients et les transmissions ciblées.
Respect des protocoles d'hygiène. Expérience en gériatrie appréciée, AFGSU à jour.` },
  { parcours: 'juridique', motsCles: ['Juridique', 'Droit des contrats', 'Droit des affaires / des sociétés', 'Veille juridique', 'Contentieux'],
    offre: `Juriste droit des affaires H/F
Au sein de la direction juridique : rédaction de contrats commerciaux, secrétariat juridique (assemblées générales), suivi des contentieux.
Veille juridique. Master 2 en droit des affaires exigé, anglais juridique apprécié.` },
  { parcours: 'admin', motsCles: ['Accueil', 'Gestion d’agenda', 'Organisation de déplacements', 'Pack Office', 'Facturation'],
    offre: `Assistante administrative H/F
Accueil physique et téléphonique, gestion d'agenda, organisation de déplacements, rédaction de courriers et facturation.
Maîtrise du Pack Office indispensable. Discrétion et organisation.` },
  { parcours: 'hotellerie', motsCles: ['Hôtellerie', 'Réception / front office', 'Revenue management', 'PMS hôtelier (Opera, Mews…)'],
    offre: `Réceptionniste – hôtel 4 étoiles
Accueil des clients, check-in et check-out, gestion des réservations sur Opera PMS.
Notions de revenue management appréciées. Anglais courant exigé. Expérience en hôtellerie de luxe souhaitée.` },
  { parcours: 'formation', motsCles: ['Ingénierie pédagogique', 'Animation de formations', 'E-learning / digital learning', 'LMS (Moodle, 360Learning…)', 'Qualiopi'],
    offre: `Formateur / ingénieur pédagogique H/F
Vous concevez des parcours (ingénierie pédagogique), animez des formations en présentiel et en classe virtuelle, et créez des modules e-learning sur Moodle.
Connaissance de Qualiopi appréciée.` },
];

describe('lexique multisecteur', () => {
  for (const { parcours, offre, motsCles } of OFFRES) {
    it(`reconnaît une offre « ${parcours} » et ses mots-clés`, () => {
      const k = extraireMotsCles(offre).map(x => x.libelle);
      for (const l of motsCles) expect(k, l).toContain(l);
      expect(recommander(cvExemple(), offre).detectes[0]?.parcours.id).toBe(parcours);
    });
  }

  it('les groupes des secteurs ne reprennent aucun terme déjà présent ailleurs dans le dictionnaire', () => {
    const cle = (t: string) => mots(t).join(' ');
    const ailleurs = new Map<string, string>();
    for (const g of SYNONYMES.filter(g => !SYNONYMES_SECTEURS.includes(g))) for (const t of g.termes) ailleurs.set(cle(t), g.libelle);
    const vus = new Map<string, string>();
    for (const g of SYNONYMES_SECTEURS) for (const t of g.termes) {
      const k = cle(t);
      expect(k, `${g.libelle} : « ${t} »`).toBeTruthy();
      expect(ailleurs.get(k), `« ${t} » (${g.libelle}) déjà dans ${ailleurs.get(k)}`).toBeUndefined();
      expect([undefined, g.libelle], `« ${t} » en double`).toContain(vus.get(k));
      vus.set(k, g.libelle);
    }
    const titres = new Map<string, string>();
    for (const g of INTITULES_POSTES) for (const t of g.termes) {
      const k = cle(t);
      if (INTITULES_SECTEURS.includes(g)) expect([undefined, g.libelle], `intitulé « ${t} » en double (${titres.get(k)})`).toContain(titres.get(k));
      titres.set(k, g.libelle);
    }
  });

  it('pas de sigle de 2 lettres ni de mot anglais courant ambigu', () => {
    const interdits = new Set(['as', 'had', 'ide', 'bar', 'closing', 'formation', 'qualite', 'stock', 'transport', 'restauration', 'marque', 'commercial', 'sea', 'communication', 'architect']);
    for (const g of [...SYNONYMES_SECTEURS, ...INTITULES_SECTEURS]) for (const t of g.termes) {
      const k = mots(t).join(' ');
      expect(k.length > 2 || /\d|&/.test(k), `${g.libelle} : « ${t} »`).toBe(true);
      expect(interdits.has(k), `${g.libelle} : « ${t} »`).toBe(false);
    }
  });

  it('un titre de poste anglais vaut son équivalent français (secteurs)', () => {
    const cv = cvExemple();
    cv.donnees.infosPerso.titre = 'Sales representative B2B';
    expect(analyserCv(cv, OFFRES[0].offre, 'Commercial terrain B2B', true).criteres[0].score).toBe(15);
    cv.donnees.infosPerso.titre = 'Assistante de direction';
    expect(analyserCv(cv, OFFRES[7].offre, 'Executive assistant', true).criteres[0].score).toBe(15);
  });

  it('chaque parcours a des certifications, des leviers et un identifiant unique', () => {
    expect(new Set(PARCOURS.map(p => p.id)).size).toBe(PARCOURS.length);
    expect(PARCOURS.length).toBeGreaterThanOrEqual(19);
    for (const p of PARCOURS) {
      expect(p.certifications.length, p.id).toBeGreaterThan(0);
      expect(p.leviers.length, p.id).toBeGreaterThanOrEqual(3);
      expect(p.detection.length, p.id).toBeGreaterThanOrEqual(10);
    }
  });

  it('les CV finance et informatique ne sont pas pris pour un autre secteur', () => {
    expect(recommander(cvExemple()).detectes[0].parcours.id).toBe('finance');
    const cv: CV = cvExemple();
    cv.donnees.infosPerso.titre = 'Administrateur systèmes et réseaux';
    cv.donnees.accroche = 'Administration des serveurs Windows et Linux, mise en production, sauvegarde et restauration, supervision.';
    cv.donnees.experiences = [{ ...cv.donnees.experiences[0], poste: 'Administrateur systèmes', puces: [{ id: 'p', texte: 'Migré 40 serveurs vers VMware et durci les GPO Active Directory' }] }];
    const ids = recommander(cv).detectes.map(p => p.parcours.id);
    expect(ids).not.toContain('industrie');
    expect(ids).not.toContain('hotellerie');
  });

  it('« œ » est lu comme « oe » (gros œuvre, main-d’œuvre)', () => {
    expect(contient(normaliser('Conducteur de travaux gros œuvre'), 'gros oeuvre')).toBe(true);
    expect('Second Œuvre et gros oeuvre'.match(regexSurlignage('second oeuvre')!)?.[0]).toBe('Second Œuvre');
  });
});
