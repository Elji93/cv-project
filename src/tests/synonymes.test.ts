import { describe, it, expect } from 'vitest';
import { SYNONYMES, INTITULES_POSTES } from '../data/synonymes';

describe('Synonymes ATS', () => {
  it('contient des groupes de synonymes valides', () => {
    expect(SYNONYMES.length).toBeGreaterThan(0);
    for (const groupe of SYNONYMES) {
      expect(groupe.libelle).toBeTruthy();
      expect(groupe.termes.length).toBeGreaterThan(0);
    }
  });

  it('contient des intitulés de postes valides', () => {
    expect(INTITULES_POSTES.length).toBeGreaterThan(0);
  });
});
