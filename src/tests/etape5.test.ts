// Tests de l'étape 5 : analyseur ATS (normalisation, dictionnaire FR ↔ EN, priorités, score, conseils)
import { describe, expect, it } from 'vitest';
import { cvExemple } from '../data/cvExemple';
import { contient, detecterLangue, mots, normaliser, regexSurlignage } from '../lib/ats/normalisation';
import { extraireMotsCles, phrasesAvecPriorite } from '../lib/ats/extraction';
import { analyserCv } from '../lib/ats/scoring';
import { promptAudit } from '../lib/ats/promptIA';
import type { CV } from '../types';

const OFFRE_EN = `M&A Analyst – Internship 6 months – Paris
You will support the team on sell-side mandates.
Responsibilities:
- Build financial modeling and valuation analyses (DCF, LBO, trading comparables)
- Prepare pitch books and information memorandums
Requirements:
- Master in Finance from a business school
- Excellent knowledge of Excel and PowerPoint is required
- Fluent English
Nice to have: Bloomberg or Capital IQ is a plus.`;

/** CV en français sur le même profil */
function cvFrancais(): CV {
  const cv = cvExemple();
  cv.donnees.infosPerso.titre = 'Analyste fusions-acquisitions';
  cv.donnees.accroche = "Diplômée d'un Master Finance, deux stages en fusions-acquisitions.";
  cv.donnees.competences = [
    { id: 'a', categorie: 'Techniques', elements: ['Modélisation financière', 'Évaluation d’entreprise', 'Actualisation des flux de trésorerie', 'Rachat à effet de levier', 'Comparables boursiers'] },
    { id: 'b', categorie: 'Outils', elements: ['Tableur Excel', 'PowerPoint'] },
  ];
  return cv;
}

describe('normalisation', () => {
  it('ignore accents, majuscules et pluriels', () => {
    expect(mots('Modélisations Financières')).toEqual(mots('modelisation financiere'));
    expect(contient(normaliser('Comptes fiscaux consolidés'), 'compte fiscal consolide')).toBe(true);
  });
  it('garde les termes techniques M&A, C++, S/4HANA, P&L', () => {
    expect(mots('M&A, C++ et SAP S/4HANA : P&L')).toEqual(['m&a', 'c++', 'et', 'sap', 's/4hana', 'p&l']);
    expect(mots('budget/forecast')).toEqual(['budget', 'forecast']);
  });
  it('détecte la langue de l’offre', () => {
    expect(detecterLangue(OFFRE_EN)).toBe('en');
    expect(detecterLangue("Vous participerez à la réalisation des modèles financiers et des dossiers de présentation.")).toBe('fr');
  });
  it('surligne un terme quelle que soit son écriture', () => {
    const re = regexSurlignage('modelisation financiere')!;
    expect('Expert en Modélisations financières.'.match(re)?.[0]).toBe('Modélisations financières');
  });
});

describe('extraction des mots-clés', () => {
  const k = extraireMotsCles(OFFRE_EN);
  const trouve = (libelle: string) => k.find(x => x.libelle === libelle);

  it('reconnaît les termes du dictionnaire, y compris les acronymes', () => {
    for (const l of ['Modélisation financière', 'Valorisation', 'DCF', 'LBO', 'Excel', 'PowerPoint']) expect(trouve(l), l).toBeTruthy();
  });
  it('distingue exigé et « un plus »', () => {
    expect(trouve('Excel')?.priorite).toBe('obligatoire');
    expect(trouve('Bloomberg')?.priorite).toBe('souhaite');
    expect(trouve('Capital IQ')?.priorite).toBe('souhaite');
  });
  it('repère les intertitres « Requirements » et « Nice to have »', () => {
    const p = phrasesAvecPriorite('Profil recherché\nMaîtrise d’Excel\nAtouts\nConnaissance de Python');
    expect(p.find(x => x.texte.includes('Excel'))?.priorite).toBe('obligatoire');
    expect(p.find(x => x.texte.includes('Python'))?.priorite).toBe('souhaite');
  });
  it('trouve des expressions de 2 à 4 mots propres à l’offre', () => {
    const offre = 'Gestion de la paie multi-sites.\nVous assurez la gestion de la paie et le suivi des absences.\nPaie multi-sites.';
    expect(extraireMotsCles(offre).some(x => x.categorie === 'Offre' && x.libelle.split(' ').length >= 2)).toBe(true);
  });
  it('prend en compte les équivalences personnelles', () => {
    const avec = extraireMotsCles('Vous utiliserez Kelio au quotidien.', [{ id: 'x', termes: ['Kelio', 'logiciel de gestion des temps'] }]);
    expect(avec.find(x => x.libelle === 'Kelio')).toBeTruthy();
  });
});

describe('score ATS (critères APEC)', () => {
  it('une offre en anglais valide un CV en français (financial modeling = modélisation financière)', () => {
    const r = analyserCv(cvFrancais(), OFFRE_EN, '', true);
    const mod = r.motsCles.find(x => x.libelle === 'Modélisation financière')!;
    expect(mod.ou).toBe('fort');
    expect(mod.viaSynonyme).toBe(true);
    expect(mod.termeCv.toLowerCase()).toContain('modelisation');
    for (const l of ['DCF', 'LBO', 'Valorisation']) expect(r.motsCles.find(x => x.libelle === l)?.ou, l).not.toBe('absent');
  });

  it('titre : synonyme FR / EN = 15, intitulé exact = 20, absent = 0', () => {
    const cv = cvFrancais();
    expect(analyserCv(cv, OFFRE_EN, '', true).criteres[0].score).toBe(15);
    cv.donnees.infosPerso.titre = 'M&A Analyst';
    expect(analyserCv(cv, OFFRE_EN, '', true).criteres[0].score).toBe(20);
    cv.donnees.infosPerso.titre = 'Chargée de recrutement';
    expect(analyserCv(cv, OFFRE_EN, '', true).criteres[0].score).toBe(0);
  });

  it('ajouter un mot-clé manquant fait monter le score', () => {
    const cv = cvFrancais();
    const avant = analyserCv(cv, OFFRE_EN, '', true);
    expect(avant.motsCles.find(x => x.libelle === 'Bloomberg')?.ou).toBe('absent');
    cv.donnees.competences[1].elements.push('Bloomberg');
    const apres = analyserCv(cv, OFFRE_EN, '', true);
    expect(apres.total).toBeGreaterThan(avant.total);
  });

  it('les mots-clés exigés pèsent double', () => {
    const offre = 'Analyste financier\nVos missions : reporting et consolidation.\nProfil :\n- Maîtrise d’Excel exigée\n- SAP serait un plus\n- Power BI apprécié';
    const cv = cvFrancais();
    cv.donnees.competences = [{ id: 'c', categorie: 'Outils', elements: ['Excel'] }];
    const r = analyserCv(cv, offre, '', true);
    const excel = r.motsCles.find(x => x.libelle === 'Excel')!;
    const sap = r.motsCles.find(x => x.libelle === 'SAP')!;
    expect(excel.priorite).toBe('obligatoire');
    expect(excel.poids).toBeGreaterThan(sap.poids * 2);
  });

  it('la grille fait bien 20 + 40 + 25 + 15 et reste entre 0 et 100', () => {
    const r = analyserCv(cvExemple(), OFFRE_EN, '', true);
    expect(r.criteres.map(c => c.max)).toEqual([20, 40, 25, 15]);
    expect(r.total).toBe(r.criteres.reduce((s, c) => s + c.score, 0));
    expect(r.total).toBeGreaterThanOrEqual(0);
    expect(r.total).toBeLessThanOrEqual(100);
  });

  it('conformité : caractères spéciaux, coordonnées manquantes et 2 pages font perdre des points', () => {
    const cv = cvExemple();
    const bien = analyserCv(cv, OFFRE_EN, '', true).criteres[3].score;
    cv.donnees.accroche += ' ✅ 🚀';
    cv.donnees.infosPerso.linkedin = '';
    const r = analyserCv(cv, OFFRE_EN, '', false);
    expect(r.criteres[3].score).toBeLessThan(bien - 6);
    expect(r.conseils.some(c => c.texte.includes('caractères spéciaux'))).toBe(true);
    expect(r.conseils.some(c => c.texte.includes('dépasse une page'))).toBe(true);
  });

  it('impact : puces chiffrées et verbes d’action (français et anglais)', () => {
    const cv = cvExemple();
    cv.donnees.experiences = [{ ...cv.donnees.experiences[0], puces: [
      { id: '1', texte: 'Built a three-statement model for a €40m deal' },
      { id: '2', texte: 'Piloté 3 clôtures mensuelles en 5 jours' },
    ] }];
    const bon = analyserCv(cv, OFFRE_EN, '', true).criteres[2];
    cv.donnees.experiences[0].puces = [{ id: '1', texte: 'Travail sur les modèles' }, { id: '2', texte: 'Missions diverses' }];
    const faible = analyserCv(cv, OFFRE_EN, '', true).criteres[2];
    expect(bon.score).toBeGreaterThan(faible.score);
    expect(bon.verifications[1].ok && bon.verifications[2].ok).toBe(true);
  });
});

describe('conseils et prompt IA', () => {
  it('offre en anglais + CV en français : propose d’ajouter les termes anglais entre parenthèses', () => {
    const r = analyserCv(cvFrancais(), OFFRE_EN, '', true);
    expect(r.langueOffre).toBe('en');
    expect(r.conseils.some(c => c.texte.includes("L'offre est en anglais : ajoutez les termes anglais entre parenthèses"))).toBe(true);
  });
  it('conseille l’intitulé exact', () => {
    const r = analyserCv(cvFrancais(), OFFRE_EN, '', true);
    expect(r.conseils.some(c => c.texte.includes('Ajoutez l\'intitulé exact « M&A Analyst »'))).toBe(true);
  });
  it('le prompt contient le CV, l’offre, la grille et le score', () => {
    const cv = cvFrancais();
    const r = analyserCv(cv, OFFRE_EN, '', true);
    const p = promptAudit(cv, OFFRE_EN, r);
    expect(p).toContain(`Score obtenu : ${r.total}/100`);
    expect(p).toContain('Build financial modeling');
    expect(p).toContain('Analyste fusions-acquisitions');
    expect(p).toContain('APEC');
  });
});
