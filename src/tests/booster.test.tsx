// Carte « Booster votre candidature » : choix des métiers dans une liste déroulante, plusieurs à la fois
import { describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { cvExemple } from '../data/cvExemple';
import { BoosterCandidature, parcoursAffiches } from '../components/commun/BoosterCandidature';
import { recommander } from '../lib/ats/recommandations';
import { analyserCv } from '../lib/ats/scoring';
import { ajouterMotsCles, groupeCles, motAjoute, retirerMotCle } from '../lib/ats/ajoutsCv';
import { ListeMotsCles } from '../components/analyseur/ListeMotsCles';
import { useAppStore } from '../store/useAppStore';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const OFFRE_HOTEL = `Réceptionniste – hôtel 4 étoiles
Accueil des clients, check-in et check-out, gestion des réservations sur Opera PMS.
Revenue management apprécié. Expérience en hôtellerie souhaitée.`;

function monter(offre: string) {
  const div = document.createElement('div');
  document.body.appendChild(div);
  const racine = createRoot(div);
  act(() => racine.render(<BoosterCandidature cv={cvExemple()} offre={offre} />));
  return { div, demonter: () => { act(() => racine.unmount()); div.remove(); } };
}
const clic = (el: Element | null | undefined) => act(() => { (el as HTMLElement).click(); });
const caseDe = (div: HTMLElement, libelle: string) =>
  [...div.querySelectorAll('[role=listbox] label')].find(l => l.textContent?.startsWith(libelle))?.querySelector('input');

describe('Booster : choix des métiers', () => {
  it('plus d’onglets : une liste déroulante fermée par défaut, avec les métiers détectés', () => {
    const { div, demonter } = monter(OFFRE_HOTEL);
    expect(div.querySelectorAll('[role=tab]')).toHaveLength(0);
    expect(div.querySelector('[role=listbox]')).toBeNull();
    const bouton = div.querySelector('button[aria-haspopup]')!;
    expect(bouton.textContent).toContain('Hôtellerie, restauration & tourisme');
    clic(bouton);
    expect(div.querySelectorAll('[role=listbox] input[type=checkbox]').length).toBeGreaterThanOrEqual(20);
    demonter();
  });

  it('plusieurs métiers à la fois : une rubrique par métier, certifications communes affichées une seule fois', () => {
    const { div, demonter } = monter(OFFRE_HOTEL);
    clic(div.querySelector('button[aria-haspopup]'));
    clic(caseDe(div, 'BTP & architecture'));
    expect(div.querySelector('button[aria-haspopup]')!.textContent).toContain('BTP & architecture');
    const titres = [...div.querySelectorAll('h4')].map(h => h.textContent);
    expect(titres).toContain('Hôtellerie, restauration & tourisme');
    expect(titres).toContain('BTP & architecture');
    // SST est recommandé dans les deux métiers mais n'apparaît qu'une fois
    const sst = [...div.querySelectorAll('li .font-semibold.text-sm')].filter(x => x.textContent?.startsWith('Sauveteur Secouriste'));
    expect(sst).toHaveLength(1);
    // Décocher tout revient aux métiers détectés
    for (const l of ['Hôtellerie, restauration & tourisme', 'BTP & architecture', 'Finance, audit & contrôle de gestion']) {
      const c = caseDe(div, l);
      if (c?.checked) clic(c);
    }
    expect(div.querySelector('button[aria-haspopup]')!.textContent).toContain('Hôtellerie');
    demonter();
  });

  it('sans métier reconnu : « Pour tous les profils »', () => {
    const r = recommander(cvExemple(), 'Poste polyvalent, bonne humeur.');
    r.detectes.length = 0;
    expect(parcoursAffiches(r, null).map(p => p.parcours.id)).toEqual(['transversal']);
    expect(parcoursAffiches(r, ['btp', 'juridique']).map(p => p.parcours.id)).toEqual(['btp', 'juridique']);
  });
});

describe('retirer du CV ce qu’on a ajouté', () => {
  const OFFRE = `Analyste financier H/F
Missions : reporting mensuel, analyse des écarts. Maîtrise de Power BI et d'Anaplan exigée.
Profil : rigueur, esprit d'analyse, anglais courant. Connaissance de Snowflake appréciée.`;

  it('un mot-clé ajouté peut être retiré : il redevient manquant', () => {
    const cv = cvExemple();
    const avant = analyserCv(cv, OFFRE, '', true);
    const k = avant.motsCles.find(x => x.libelle === 'Anaplan')!;
    expect(k.ou).toBe('absent');
    ajouterMotsCles(cv, [k.termeOffre]);
    expect(groupeCles(cv)?.elements).toContain('Anaplan');
    expect(motAjoute(cv, k.termes)).toBe(true);
    const apres = analyserCv(cv, OFFRE, '', true);
    expect(apres.motsCles.find(x => x.libelle === 'Anaplan')!.ou).not.toBe('absent');
    retirerMotCle(cv, k.termes);
    expect(groupeCles(cv)).toBeUndefined(); // groupe vide supprimé
    expect(analyserCv(cv, OFFRE, '', true).motsCles.find(x => x.libelle === 'Anaplan')!.ou).toBe('absent');
  });

  it('retirer ne touche qu’au groupe « Compétences clés », pas aux compétences saisies ailleurs', () => {
    const cv = cvExemple();
    const autres = JSON.stringify(cv.donnees.competences);
    ajouterMotsCles(cv, ['Anaplan', 'Snowflake', 'Excel']);
    retirerMotCle(cv, ['excel', 'microsoft excel']);
    expect(groupeCles(cv)?.elements).toEqual(['Anaplan', 'Snowflake']);
    expect(motAjoute(cv, ['excel'])).toBe(false);
    retirerMotCle(cv, ['anaplan']); retirerMotCle(cv, ['snowflake']);
    expect(JSON.stringify(cv.donnees.competences)).toBe(autres);
  });

  it('liste des mots-clés : un mot ajouté reste coché, le décocher appelle le retrait', () => {
    const cv = cvExemple();
    ajouterMotsCles(cv, ['Anaplan']);
    const r = analyserCv(cv, OFFRE, '', true);
    const retires: string[] = [];
    const div = document.createElement('div');
    const racine = createRoot(div);
    act(() => racine.render(<ListeMotsCles motsCles={r.motsCles} coches={[]} onCocher={() => {}}
      estAjoute={k => motAjoute(cv, k.termes)} onRetirer={k => retires.push(k.libelle)} />));
    const caseAnaplan = div.querySelector<HTMLInputElement>('input[aria-label="Retirer Anaplan du CV"]')!;
    expect(caseAnaplan.checked).toBe(true);
    clic(caseAnaplan);
    expect(retires).toEqual(['Anaplan']);
    // Les mots trouvés sans avoir été ajoutés n'ont pas de case
    expect(div.querySelectorAll('input[aria-label^="Retirer"]')).toHaveLength(1);
    act(() => racine.unmount());
  });

  it('Booster : une certification ajoutée avec « + En cours » a un bouton « Retirer »', () => {
    const cv = cvExemple();
    useAppStore.setState(e => ({ ...e, cvs: [cv], cvActifId: cv.id }));
    const div = document.createElement('div');
    const racine = createRoot(div);
    const rendre = () => act(() => racine.render(<BoosterCandidature cv={useAppStore.getState().cvs.find(x => x.id === cv.id)!} offre={OFFRE_HOTEL} />));
    rendre();
    const haccp = () => [...div.querySelectorAll('li')].find(li => li.textContent?.includes('Formation hygiène alimentaire (HACCP)'))!;
    clic([...haccp().querySelectorAll('button')].find(b => b.textContent?.includes('En cours')));
    rendre();
    expect(haccp().textContent).toContain('Sur votre CV');
    clic([...haccp().querySelectorAll('button')].find(b => b.textContent === 'Retirer'));
    rendre();
    expect(useAppStore.getState().cvs.find(x => x.id === cv.id)!.donnees.certifications.some(c => c.intitule.includes('HACCP'))).toBe(false);
    expect(haccp().textContent).toContain('En cours');
    act(() => racine.unmount());
  });
});
