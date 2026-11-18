// Tests du lexique informatique / cybersécurité / réseaux et des recommandations de certifications
import { describe, expect, it } from 'vitest';
import { cvExemple } from '../data/cvExemple';
import { analyserCv } from '../lib/ats/scoring';
import { extraireMotsCles } from '../lib/ats/extraction';
import { moisExperience, recommander } from '../lib/ats/recommandations';
import { PARCOURS, TRANSVERSAL } from '../data/certifications';
import { SYNONYMES } from '../data/synonymes';
import type { CV } from '../types';

const OFFRE_RESEAU = `Network Administrator – Lyon
You will manage the LAN/WAN infrastructure of 3 sites (Cisco switches, VLAN, routing) and the Active Directory.
Requirements:
- Strong knowledge of TCP/IP, DNS and DHCP is required
- Experience with Fortinet firewalls and VMware virtualization
- CCNA certification required
Nice to have: PowerShell scripting, Zabbix monitoring.`;

/** CV d'administratrice systèmes et réseaux, en français */
function cvReseau(): CV {
  const cv = cvExemple();
  cv.donnees.infosPerso.titre = 'Administratrice systèmes et réseaux';
  cv.donnees.accroche = 'Alternante en administration des réseaux et des systèmes sur un parc de 400 postes.';
  cv.donnees.competences = [
    { id: 'r', categorie: 'Réseaux', elements: ['Commutation', 'VLAN', 'Routage OSPF', 'Adressage IP', 'Services réseau DNS / DHCP'] },
    { id: 's', categorie: 'Systèmes', elements: ['Windows Server', 'Annuaire Active Directory et GPO', 'Virtualisation VMware'] },
    { id: 'o', categorie: 'Outils', elements: ['Pare-feu FortiGate', 'GLPI'] },
  ];
  cv.donnees.certifications = [];
  cv.donnees.experiences = [{ ...cv.donnees.experiences[0], poste: 'Administratrice systèmes et réseaux (alternance)', puces: [{ id: 'p', texte: 'Configuré 25 VLAN sur 3 sites' }] }];
  return cv;
}

describe('lexique informatique', () => {
  it('reconnaît les notions réseaux d’une offre en anglais, y compris la certification', () => {
    const k = extraireMotsCles(OFFRE_RESEAU);
    for (const l of ['TCP/IP', 'LAN / WAN', 'VLAN / commutation', 'Routage', 'Active Directory', 'Services réseau (DNS, DHCP)', 'Virtualisation', 'Cisco CCNA'])
      expect(k.find(x => x.libelle === l), l).toBeTruthy();
    expect(k.find(x => x.libelle === 'Cisco CCNA')?.priorite).toBe('obligatoire');
    expect(k.find(x => x.libelle === 'Scripting / automatisation')?.priorite).toBe('souhaite');
  });

  it('un CV en français (commutation, routage, pare-feu) valide l’offre en anglais (switches, routing, firewalls)', () => {
    const r = analyserCv(cvReseau(), OFFRE_RESEAU, '', true);
    for (const l of ['VLAN / commutation', 'Routage', 'Active Directory', 'Virtualisation', 'Sécurité réseau'])
      expect(r.motsCles.find(x => x.libelle === l)?.ou, l).not.toBe('absent');
    expect(r.motsCles.find(x => x.libelle === 'Routage')?.viaSynonyme).toBe(true);
  });

  it('« Administratrice systèmes et réseaux » = « Network Administrator » (titre : 15 points)', () => {
    expect(analyserCv(cvReseau(), OFFRE_RESEAU, '', true).criteres[0].score).toBe(15);
  });

  it('conseil dédié quand une certification citée dans l’offre manque', () => {
    const r = analyserCv(cvReseau(), OFFRE_RESEAU, '', true);
    const c = r.conseils.find(x => x.texte.startsWith('Certification citée dans l\'offre'));
    expect(c?.texte).toContain('CCNA');
    expect(c?.priorite).toBe('haute');
  });

  it('cybersécurité : SOC, SIEM, EDR et réponse à incident reconnus en français et en anglais', () => {
    const offre = 'Analyste SOC – vous surveillez les alertes du SIEM (Splunk), qualifiez les incidents et pilotez la réponse à incident. Connaissance d’un EDR et de la norme ISO 27001.';
    const k = extraireMotsCles(offre).map(x => x.libelle);
    for (const l of ['Sécurité opérationnelle (SOC)', 'SIEM (Splunk, Sentinel, QRadar…)', 'Réponse à incident', 'EDR / XDR', 'ISO 27001']) expect(k, l).toContain(l);
    const cv = cvExemple();
    cv.donnees.competences = [{ id: 'c', categorie: 'Cyber', elements: ['Security Operations Center', 'Incident response', 'CrowdStrike'] }];
    const r = analyserCv(cv, offre, '', true);
    expect(r.motsCles.find(x => x.libelle === 'Réponse à incident')?.ou).toBe('fort');
    expect(r.motsCles.find(x => x.libelle === 'EDR / XDR')?.ou).toBe('fort');
  });

  it('pas de faux positifs informatiques dans des offres finance ou RH', () => {
    const finance = extraireMotsCles('Analyste M&A. Vous suivrez les opérations sur la bourse (stock exchange) et les procédures de clôture, sous la supervision du manager. Notions de restauration collective appréciées.').map(x => x.libelle);
    for (const l of ['Messagerie / collaboration', 'Documentation technique', 'Supervision / monitoring', 'Sauvegarde', 'Jira / Confluence']) expect(finance, l).not.toContain(l);
    const rh = extraireMotsCles('Gestionnaire RH : accompagnement du plan de sauvegarde de l’emploi, stockage des archives du personnel.').map(x => x.libelle);
    expect(rh).not.toContain('Sauvegarde');
    expect(rh).not.toContain('Stockage (SAN / NAS)');
  });

  it('un lien https dans les coordonnées ne compte pas comme une compétence réseau', () => {
    const cv = cvExemple();
    cv.donnees.infosPerso.linkedin = 'https://www.linkedin.com/in/test';
    const r = analyserCv(cv, 'Technicien réseau : maîtrise des protocoles HTTP et HTTPS exigée, DNS et DHCP.', '', true);
    expect(r.motsCles.find(x => x.libelle === 'Services réseau (DNS, DHCP)')?.ou).toBe('absent');
  });
});

describe('recommandations de certifications', () => {
  it('détecte le métier dans l’offre et met en tête la certification demandée', () => {
    const r = recommander(cvReseau(), OFFRE_RESEAU);
    expect(r.detectes[0].parcours.id).toBe('reseaux');
    expect(r.detectes[0].certifications[0].id).toBe('ccna');
    expect(r.manquantesOffre.map(c => c.id)).toContain('ccna');
  });

  it('sans offre, le métier est lu dans le CV ; une certification déjà présente est signalée', () => {
    const cv = cvReseau();
    cv.donnees.certifications = [{ id: 'x', intitule: 'Cisco CCNA', organisme: 'Cisco', annee: '2025' }];
    const r = recommander(cv);
    expect(r.detectes.map(p => p.parcours.id)).toContain('reseaux');
    expect(r.detectes.find(p => p.parcours.id === 'reseaux')!.certifications.find(c => c.id === 'ccna')?.surCv).toBe(true);
    expect(r.manquantesOffre).toHaveLength(0);
  });

  it('un CV finance donne le parcours finance, un CV paie le parcours RH', () => {
    expect(recommander(cvExemple()).detectes[0].parcours.id).toBe('finance');
    const cv = cvExemple();
    cv.donnees.infosPerso.titre = 'Gestionnaire de paie';
    cv.donnees.accroche = 'Paie, DSN et administration du personnel sur Silae.';
    expect(recommander(cv, 'Gestionnaire de paie H/F : paie de 300 salariés, DSN, Silae, convention collective.').detectes[0].parcours.id).toBe('rh');
  });

  it('profil junior : moins de 3 ans d’expérience', () => {
    const cv = cvReseau();
    cv.donnees.experiences = [{ ...cv.donnees.experiences[0], periode: { debut: '2025-09', fin: '', enCours: true } }];
    expect(moisExperience(cv, new Date(2026, 10, 18))).toBe(15);
    expect(recommander(cv).profilJunior).toBe(true);
  });

  it('chaque certification a un identifiant unique et devient un mot-clé ATS', () => {
    const toutes = [...PARCOURS, TRANSVERSAL].flatMap(p => p.certifications);
    const ids = new Map(toutes.map(c => [c.id, c]));
    expect([...ids.values()].every(c => toutes.filter(x => x.id === c.id).every(x => x === c))).toBe(true);
    for (const c of ['OffSec Certified Professional (OSCP)', 'Cisco CCNA', 'CompTIA Security+', 'AWS Certified Cloud Practitioner'])
      expect(SYNONYMES.some(g => g.libelle === c && g.categorie === 'Certification'), c).toBe(true);
  });
});
