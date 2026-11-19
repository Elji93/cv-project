// Ajouts au dictionnaire ATS (FinOps, Green IT, blockchain, DPO, IA générative, no-code)
// et intitulés de postes associés : présents, sans doublon, et sans faux positif
import { describe, it, expect } from 'vitest';
import { SYNONYMES, INTITULES_POSTES } from '../data/synonymes';
import { extraireMotsCles } from '../lib/ats/extraction';
import { analyserCv } from '../lib/ats/scoring';
import { mots } from '../lib/ats/normalisation';
import { cvExemple } from '../data/cvExemple';

const NOUVEAUX = ['FinOps', 'Numérique responsable / Green IT', 'Blockchain / Web3', 'Protection des données (DPO)',
  'Prompt engineering / IA générative', 'No-code / low-code'];
const NOUVEAUX_TITRES = ['Tech Lead / Lead Developer', 'Product Manager', 'Coach agile', 'CTO / directeur technique', 'DPO', 'Prompt engineer', 'FinOps'];
const cle = (t: string) => mots(t).join(' ');

describe('dictionnaire : FinOps, Green IT, blockchain, DPO, IA générative, no-code', () => {
  it('reconnaît ces notions dans une offre, en français et en anglais', () => {
    const offre = `Cloud engineer FinOps
Vous pilotez l'optimisation des coûts cloud et une démarche de numérique responsable (éco-conception logicielle).
Vous automatisez des flux avec Power Automate et Zapier, et mettez en place du RAG (retrieval augmented generation) avec du prompt engineering.
Connaissance des smart contracts et du rôle du DPO appréciée.`;
    const libelles = extraireMotsCles(offre).map(k => k.libelle);
    for (const l of NOUVEAUX) expect(libelles, l).toContain(l);
  });

  it('pas de faux positif dans une offre finance en anglais (« make », « pm », « crypto »…)', () => {
    const offre = `Financial Analyst – London. You will make recommendations to the CFO, prepare the monthly reporting and build financial models in Excel.
The review takes place at 5 pm. PO approval and RAG status reporting are part of the role. Crypto experience is not required.`;
    const libelles = extraireMotsCles(offre).map(k => k.libelle);
    for (const l of [...NOUVEAUX, 'Product Manager']) expect(libelles, l).not.toContain(l);
  });

  it('aucun sigle de 2 lettres ni terme déjà présent dans un autre groupe', () => {
    const groupes = SYNONYMES.filter(g => NOUVEAUX.includes(g.libelle));
    expect(groupes).toHaveLength(NOUVEAUX.length);
    const ailleurs = new Map(SYNONYMES.filter(g => !NOUVEAUX.includes(g.libelle)).flatMap(g => g.termes.map(t => [cle(t), g.libelle] as const)));
    for (const g of groupes) for (const t of g.termes) {
      expect(cle(t).length, `« ${t} »`).toBeGreaterThan(2);
      expect(ailleurs.get(cle(t)), `« ${t} » (${g.libelle})`).toBeUndefined();
    }
  });

  it('intitulés : chaque terme n’appartient qu’à une famille, et « Lead developer » vaut « Tech lead »', () => {
    const titres = INTITULES_POSTES.filter(g => NOUVEAUX_TITRES.includes(g.libelle));
    expect(titres).toHaveLength(NOUVEAUX_TITRES.length);
    const autres = new Map(INTITULES_POSTES.filter(g => !titres.includes(g)).flatMap(g => g.termes.map(t => [cle(t), g.libelle] as const)));
    for (const g of titres) for (const t of g.termes) expect(autres.get(cle(t)), `« ${t} » (${g.libelle})`).toBeUndefined();
    const cv = cvExemple();
    cv.donnees.infosPerso.titre = 'Lead developer React';
    expect(analyserCv(cv, 'Tech Lead H/F – nous recherchons un tech lead pour encadrer une équipe de développeurs React et TypeScript.', 'Tech Lead', true).criteres[0].score).toBe(15);
  });
});
