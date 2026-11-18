// ============================================================================
//  Panneau de saisie guidée : un onglet par catégorie, navigation en carrousel
// ============================================================================
import { useRef, useState, type ReactNode } from 'react';
import { Award, Briefcase, ChevronLeft, ChevronRight, GraduationCap, Heart, Languages, Sparkles, User } from 'lucide-react';
import { OngletInfosPerso } from './OngletInfosPerso';
import { OngletAccroche } from './OngletAccroche';
import { OngletExperiences } from './OngletExperiences';
import { OngletFormations } from './OngletFormations';
import { OngletCompetences } from './OngletCompetences';
import { OngletCertifications } from './OngletCertifications';
import { OngletInterets } from './OngletInterets';
import { ZoneAClasser } from './ZoneAClasser';

const ONGLETS: { id: string; libelle: string; icone: ReactNode; section: string; contenu: () => ReactNode }[] = [
  { id: 'infos', libelle: 'Infos & photo', icone: <User size={14} />, section: 'entete', contenu: () => <OngletInfosPerso /> },
  { id: 'accroche', libelle: 'Titre & accroche', icone: <Sparkles size={14} />, section: 'accroche', contenu: () => <OngletAccroche /> },
  { id: 'experiences', libelle: 'Expériences', icone: <Briefcase size={14} />, section: 'experiences', contenu: () => <OngletExperiences /> },
  { id: 'formations', libelle: 'Formation', icone: <GraduationCap size={14} />, section: 'formations', contenu: () => <OngletFormations /> },
  { id: 'competences', libelle: 'Compétences, savoir-être & langues', icone: <Languages size={14} />, section: 'competences', contenu: () => <OngletCompetences /> },
  { id: 'certifications', libelle: 'Certifications', icone: <Award size={14} />, section: 'certifications', contenu: () => <OngletCertifications /> },
  { id: 'interets', libelle: "Centres d'intérêt", icone: <Heart size={14} />, section: 'centresInteret', contenu: () => <OngletInterets /> },
];

export function PanneauSaisie() {
  const [indice, setIndice] = useState(0);
  const piste = useRef<HTMLDivElement>(null);
  const onglet = ONGLETS[indice];

  const aller = (i: number) => {
    const n = (i + ONGLETS.length) % ONGLETS.length;
    setIndice(n);
    // On fait défiler le carrousel et la feuille jusqu'à la section concernée
    requestAnimationFrame(() => piste.current?.children[n]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }));
    document.querySelector(`#apercu .cv-page [data-section="${ONGLETS[n].section}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-center gap-1 px-2 py-2 border-b border-gray-200 bg-gray-50">
        <button className="icon-btn" aria-label="Onglet précédent" onClick={() => aller(indice - 1)}><ChevronLeft size={18} /></button>
        <div ref={piste} className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1 scroll-smooth" role="tablist">
          {ONGLETS.map((o, i) => (
            <button key={o.id} role="tab" aria-selected={i === indice} onClick={() => aller(i)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition ${i === indice ? 'bg-brand-2 border-brand-2 text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
              {o.icone}{o.libelle}
            </button>
          ))}
        </div>
        <button className="icon-btn" aria-label="Onglet suivant" onClick={() => aller(indice + 1)}><ChevronRight size={18} /></button>
      </div>

      <ZoneAClasser />

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-semibold text-[15px]">{onglet.libelle}</h3>
          <span className="text-xs text-gray-400">{indice + 1}/{ONGLETS.length}</span>
        </div>
        {onglet.contenu()}
        {/* Sur petit écran, les libellés longs sont tronqués au lieu de déborder */}
        <div className="flex justify-between gap-2 mt-6">
          <button className="btn min-w-0" disabled={indice === 0} onClick={() => aller(indice - 1)}>
            <ChevronLeft size={14} className="shrink-0" /> <span className="truncate">{indice > 0 ? ONGLETS[indice - 1].libelle : ''}</span>
          </button>
          <button className="btn-primary min-w-0" disabled={indice === ONGLETS.length - 1} onClick={() => aller(indice + 1)}>
            <span className="truncate">{indice < ONGLETS.length - 1 ? ONGLETS[indice + 1].libelle : 'Terminé'}</span> <ChevronRight size={14} className="shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
