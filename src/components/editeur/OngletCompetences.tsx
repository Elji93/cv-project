// Onglet « Compétences & langues »
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { NiveauCECRL } from '../../types';
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { uid } from '../../lib/cv';
import { NIVEAUX_CECRL } from '../../data/constantes';
import { Astuce, Champ, ChampTexte } from '../commun/Champs';
import { ChampListe } from './ChampListe';
import { OutilsBloc, deplacer } from './OutilsBloc';
import { ReserveEntrees } from './ReserveEntrees';
import { CaseSurCv } from './CaseSurCv';

export function OngletCompetences() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  const { competences, langues } = cv.donnees;
  // Groupe ouvert ou replié (par défaut : ouvert s'il est sur le CV, replié s'il est en réserve)
  const [ouverture, setOuverture] = useState<Record<string, boolean>>({});
  const estOuvert = (x: { id: string; masquee?: boolean }) => ouverture[x.id] ?? !x.masquee;
  const afficherGroupe = (id: string, v: boolean) => {
    modifier(c => { const g = c.donnees.competences.find(y => y.id === id); if (g) g.masquee = !v; });
    setOuverture(o => ({ ...o, [id]: v }));
  };

  return (
    <>
      <h4 className="subhead">Compétences</h4>
      <Astuce>Regroupez par catégorie (Techniques, Normes, Outils / logiciels…) et reprenez les termes exacts de l'offre.</Astuce>
      <ReserveEntrees quoi="groupes de compétences" onBasculer={afficherGroupe}
        onTout={v => modifier(c => { c.donnees.competences.forEach(x => { x.masquee = !v; }); })}
        entrees={competences.map(g => ({ id: g.id, masquee: g.masquee, libelle: g.categorie || 'Groupe', detail: g.elements.slice(0, 4).join(', ') + (g.elements.length > 4 ? '…' : '') }))} />
      {competences.map((g, i) => (
        <div key={g.id} className={`card-entry ${g.masquee ? 'opacity-75 border-dashed' : ''}`}>
          <OutilsBloc titre={g.categorie || 'Groupe'} premier={i === 0} dernier={i === competences.length - 1}
            onMonter={() => modifier(c => deplacer(c.donnees.competences, i, -1))}
            onDescendre={() => modifier(c => deplacer(c.donnees.competences, i, 1))}
            onSupprimer={() => modifier(c => { c.donnees.competences.splice(i, 1); })}
            surCv={!g.masquee} onSurCv={v => afficherGroupe(g.id, v)}
            replie={!estOuvert(g)} onDeplier={() => setOuverture(o => ({ ...o, [g.id]: !estOuvert(g) }))} />
          {estOuvert(g) && <>
          <ChampTexte libelle="Catégorie" placeholder="Techniques / Outils…" valeur={g.categorie}
            onValeur={v => modifier(c => { c.donnees.competences[i].categorie = v; })} />
          <ChampListe libelle="Compétences (séparées par des virgules)" indication="IFRS, consolidation, Excel (TCD, VBA)…"
            elements={g.elements} onElements={l => modifier(c => { c.donnees.competences[i].elements = l; })} />
          </>}
        </div>
      ))}
      <button className="btn mb-6" onClick={() => modifier(c => { c.donnees.competences.push({ id: uid(), categorie: '', elements: [] }); })}><Plus size={14} /> Ajouter un groupe</button>

      <h4 className="subhead">Savoir-être / traits de personnalité</h4>
      <ChampListe libelle="Qualités (séparées par des virgules)" indication="Rigueur, esprit d'équipe, curiosité, résistance au stress…"
        aide="Choisissez 3 à 5 qualités demandées dans l'offre, et illustrez-les dans vos expériences."
        elements={cv.donnees.qualites} onElements={l => modifier(c => { c.donnees.qualites = l; })} />

      <h4 className="subhead mt-4">Langues{langues.length > 1 && <span className="normal-case font-normal tracking-normal"> — sur le CV : {langues.filter(l => !l.masquee).length} / {langues.length}</span>}</h4>
      {langues.map((l, i) => (
        <div key={l.id} className={`grid grid-cols-[auto_1fr_1.2fr_1fr_auto] gap-2 items-end ${l.masquee ? 'opacity-60' : ''}`}>
          <CaseSurCv valeur={!l.masquee} onChange={v => modifier(c => { c.donnees.langues[i].masquee = !v; })} />
          <ChampTexte libelle="Langue" placeholder="Anglais" valeur={l.langue} onValeur={v => modifier(c => { c.donnees.langues[i].langue = v; })} />
          <Champ libelle="Niveau (CECRL)">
            <select className="input" value={l.niveau} onChange={e => modifier(c => { c.donnees.langues[i].niveau = e.target.value as NiveauCECRL; })}>
              {NIVEAUX_CECRL.map(n => <option key={n.id} value={n.id}>{n.fr}</option>)}
            </select>
          </Champ>
          <ChampTexte libelle="Précision" placeholder="TOEIC 945" valeur={l.precision} onValeur={v => modifier(c => { c.donnees.langues[i].precision = v; })} />
          <button className="icon-btn mb-3 text-red-600" aria-label="Supprimer la langue" onClick={() => modifier(c => { c.donnees.langues.splice(i, 1); })}><Trash2 size={15} /></button>
        </div>
      ))}
      <button className="btn" onClick={() => modifier(c => { c.donnees.langues.push({ id: uid(), langue: '', niveau: 'B2', precision: '' }); })}><Plus size={14} /> Ajouter une langue</button>
    </>
  );
}
