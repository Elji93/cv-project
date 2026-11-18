// Page « Éditeur » : panneau de gauche (saisie / mise en forme) + aperçu A4
import { useState } from 'react';
import { Palette, PenLine } from 'lucide-react';
import { GestionCV } from '../components/gestionCV/GestionCV';
import { PanneauSaisie } from '../components/editeur/PanneauSaisie';
import { PanneauStyle } from '../components/style/PanneauStyle';
import { ApercuA4 } from '../components/feuille/ApercuA4';
import { BasculeVue, classesVue, type Vue } from '../components/commun/BasculeVue';

export function PageEditeur() {
  const [panneau, setPanneau] = useState<'saisie' | 'style'>('saisie');
  const [vue, setVue] = useState<Vue>('saisie');
  const c = classesVue(vue);
  return (
    <main className="flex-1 min-h-0 flex flex-col lg:flex-row">
      <BasculeVue vue={vue} onVue={setVue} />
      <aside className={`${c.saisie} lg:w-[400px] xl:w-[440px] flex-1 lg:flex-none bg-white lg:border-r border-gray-200 flex-col min-h-0`}>
        <GestionCV />
        <div className="flex border-b border-gray-200">
          {([['saisie', 'Saisie guidée', <PenLine size={14} key="i" />], ['style', 'Mise en forme', <Palette size={14} key="i" />]] as const).map(([v, libelle, icone]) => (
            <button key={v} onClick={() => setPanneau(v)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold border-b-2 ${panneau === v ? 'text-brand-2 border-brand-2' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
              {icone}{libelle}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0">{panneau === 'saisie' ? <PanneauSaisie /> : <PanneauStyle />}</div>
      </aside>
      <div className={`${c.apercu} flex-1 min-w-0 min-h-0`}><ApercuA4 /></div>
    </main>
  );
}
