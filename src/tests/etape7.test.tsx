// Tests de l'étape 7 : raccourcis clavier et cas de scoring FR / EN supplémentaires (RH, paie, SIRH)
import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { cvExemple } from '../data/cvExemple';
import { EVENEMENT_PDF, useRaccourcis } from '../components/commun/useRaccourcis';
import { analyserCv } from '../lib/ats/scoring';
import { extraireMotsCles } from '../lib/ats/extraction';
import type { CV } from '../types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function monter(actions: Parameters<typeof useRaccourcis>[0]) {
  function Test() { useRaccourcis(actions); return null; }
  const div = document.createElement('div');
  const racine = createRoot(div);
  act(() => racine.render(<Test />));
  return () => act(() => racine.unmount());
}
const touche = (key: string, o: KeyboardEventInit = {}) => {
  const e = new KeyboardEvent('keydown', { key, ctrlKey: true, cancelable: true, ...o });
  window.dispatchEvent(e);
  return e;
};

describe('raccourcis clavier', () => {
  it('Ctrl+S télécharge la sauvegarde JSON au lieu d’enregistrer la page', () => {
    const onSauvegarder = vi.fn(), onPdf = vi.fn();
    const demonter = monter({ onSauvegarder, onPdf });
    const e = touche('s');
    expect(e.defaultPrevented).toBe(true);
    expect(onSauvegarder).toHaveBeenCalledOnce();
    touche('S', { metaKey: true, ctrlKey: false }); // Cmd+S sur Mac
    expect(onSauvegarder).toHaveBeenCalledTimes(2);
    demonter();
  });

  it('Ctrl+P ouvre l’export PDF du CV, sauf si la page (lettre) le prend en charge', () => {
    const onSauvegarder = vi.fn(), onPdf = vi.fn();
    const demonter = monter({ onSauvegarder, onPdf });
    expect(touche('p').defaultPrevented).toBe(true);
    expect(onPdf).toHaveBeenCalledOnce();
    const lettre = vi.fn((e: Event) => e.preventDefault());
    window.addEventListener(EVENEMENT_PDF, lettre);
    touche('p');
    expect(lettre).toHaveBeenCalledOnce();
    expect(onPdf).toHaveBeenCalledOnce(); // pas de PDF du CV en plus
    window.removeEventListener(EVENEMENT_PDF, lettre);
    demonter();
  });

  it('les touches sans Ctrl ne déclenchent rien', () => {
    const onSauvegarder = vi.fn(), onPdf = vi.fn();
    const demonter = monter({ onSauvegarder, onPdf });
    touche('s', { ctrlKey: false });
    touche('p', { ctrlKey: false });
    expect(onSauvegarder).not.toHaveBeenCalled();
    expect(onPdf).not.toHaveBeenCalled();
    demonter();
  });
});

/** CV de gestionnaire de paie / SIRH, en français */
function cvPaie(): CV {
  const cv = cvExemple();
  cv.donnees.infosPerso.titre = 'Gestionnaire de paie';
  cv.donnees.accroche = 'Alternante en gestion de la paie et projet SIRH.';
  cv.donnees.competences = [
    { id: 'o', categorie: 'Outils', elements: ['SILAE', 'Excel (TCD, RECHERCHEV)', 'SIRH Workday'] },
    { id: 't', categorie: 'Techniques', elements: ['Paie', 'Déclaration sociale nominative (DSN)', 'Administration du personnel'] },
  ];
  // une seule expérience, sans mention d'outil, pour isoler l'effet des Compétences
  cv.donnees.experiences = [{ ...cv.donnees.experiences[0], poste: 'Gestionnaire de paie (alternance)', puces: [{ id: 'p', texte: 'Établi 300 bulletins de paie par mois' }] }];
  return cv;
}

const OFFRE_PAYROLL = `Payroll Officer – France
You will run the monthly payroll for 300 employees and prepare the DSN.
Requirements:
- Strong knowledge of French payroll is required
- HRIS experience (Workday)
- Advanced Excel skills (pivot tables)
Nice to have: SAP SuccessFactors is a plus.`;

describe('scoring : cas français / anglais supplémentaires', () => {
  it('offre en anglais (payroll, HRIS, pivot tables) validée par un CV en français (paie, SIRH, TCD)', () => {
    const r = analyserCv(cvPaie(), OFFRE_PAYROLL, '', true);
    expect(r.langueOffre).toBe('en');
    for (const l of ['Paie', 'SIRH', 'Excel', 'DSN']) expect(r.motsCles.find(k => k.libelle === l)?.ou, l).toBe('fort');
    expect(r.motsCles.find(k => k.libelle === 'Paie')?.viaSynonyme).toBe(true);
  });

  it('intitulé : « Gestionnaire de paie » reconnu comme synonyme de « Payroll Officer » (15 points)', () => {
    expect(analyserCv(cvPaie(), OFFRE_PAYROLL, '', true).criteres[0].score).toBe(15);
  });

  it('offre en français validée par un CV rédigé en anglais', () => {
    const cv = cvPaie();
    cv.langue = 'en';
    cv.donnees.infosPerso.titre = 'Payroll Officer';
    cv.donnees.accroche = 'Payroll and HRIS work-study student.';
    cv.donnees.competences = [{ id: 'x', categorie: 'Tools', elements: ['Payroll', 'HRIS', 'Excel'] }];
    const offre = 'Gestionnaire de paie\nVous assurez la paie de 300 salariés.\nProfil recherché :\n- Maîtrise de la paie exigée\n- Connaissance d’un SIRH\n- Excel avancé';
    const r = analyserCv(cv, offre, '', true);
    expect(r.langueOffre).toBe('fr');
    expect(r.motsCles.find(k => k.libelle === 'Paie')?.ou).toBe('fort');
    expect(r.motsCles.find(k => k.libelle === 'SIRH')?.ou).toBe('fort');
    expect(r.criteres[0].score).toBe(15);
  });

  it('un mot-clé « un plus » manquant coûte moins qu’un mot-clé exigé manquant', () => {
    const base = cvPaie();
    const sansSap = analyserCv(base, OFFRE_PAYROLL, '', true).total;
    const sansExcel = cvPaie();
    sansExcel.donnees.competences[0].elements = ['SILAE', 'SIRH Workday'];
    const r = analyserCv(sansExcel, OFFRE_PAYROLL, '', true);
    expect(r.motsCles.find(k => k.libelle === 'Excel')?.ou).toBe('absent');
    const avecSap = cvPaie();
    avecSap.donnees.competences[0].elements.push('SAP SuccessFactors');
    const gainSap = analyserCv(avecSap, OFFRE_PAYROLL, '', true).total - sansSap;
    const perteExcel = sansSap - r.total;
    expect(perteExcel).toBeGreaterThan(gainSap);
  });

  it('accents, majuscules et pluriels n’empêchent pas la correspondance', () => {
    const k = extraireMotsCles('Vous préparerez les DÉCLARATIONS SOCIALES NOMINATIVES et les clôtures mensuelles.');
    expect(k.some(x => x.libelle === 'DSN')).toBe(true);
  });
});
