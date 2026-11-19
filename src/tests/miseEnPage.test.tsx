// Mise en page : la copie invisible du CV (mesure « tient sur une page ») ne doit jamais
// agrandir la page. Sous Firefox, l'ancienne copie (position absolue, à gauche de l'écran)
// rendait toute la page défilable et laissait une grande zone vide en bas.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { MesureCachee } from '../components/commun/MesureCachee';

describe('copie invisible du CV', () => {
  it('est enfermée dans une boîte fixe, de taille nulle, qui coupe ce qui dépasse', () => {
    const html = renderToStaticMarkup(<MesureCachee><div className="cv-page">CV</div></MesureCachee>);
    for (const regle of ['position:fixed', 'width:0', 'height:0', 'overflow:hidden', 'visibility:hidden'])
      expect(html.replace(/\s/g, ''), regle).toContain(regle);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('CV');
  });

  it('plus aucune copie cachée « hors écran » qui pourrait agrandir la page', () => {
    for (const f of ['src/App.tsx', 'src/components/analyseur/Analyseur.tsx', 'src/components/analyseur/FeuilleSurlignee.tsx']) {
      const source = readFileSync(f, 'utf8');
      expect(source, f).not.toMatch(/left:\s*-10000/);
      expect(source, f).toContain('<MesureCachee>');
    }
  });
});
