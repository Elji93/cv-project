// Mots-clés de l'offre : trouvés (vert), manquants exigés / importants (rouge), appréciés (orange)
import type { MotCleResultat } from '../../lib/ats/scoring';

function Pastille({ k, coche, onCocher, ajoute, onRetirer }: { k: MotCleResultat; coche: boolean; onCocher?: () => void; ajoute?: boolean; onRetirer?: () => void }) {
  // Mot-clé ajouté depuis l'analyseur (groupe « Compétences clés ») : décocher le retire du CV
  if (k.ou !== 'absent' && ajoute && onRetirer) {
    return (
      <label className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs cursor-pointer bg-emerald-50 border-emerald-300 text-emerald-800"
        title="Ajouté par vous dans « Compétences clés » : décochez pour le retirer du CV">
        <input type="checkbox" checked onChange={onRetirer} aria-label={`Retirer ${k.termeOffre} du CV`} />
        {k.termeOffre}
        <span className="text-[10px] font-semibold text-emerald-700/80">ajouté</span>
      </label>
    );
  }
  if (k.ou !== 'absent') {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${k.ou === 'fort' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-50/50 border-emerald-200 border-dashed text-emerald-800'}`}
        title={k.ou === 'fort' ? 'Trouvé dans le titre, l’accroche ou les compétences' : 'Trouvé seulement dans les expériences ou la formation'}>
        ✓ {k.termeOffre}
        {k.viaSynonyme && <span className="text-emerald-700/80">— trouvé via « {k.termeCv} »</span>}
      </span>
    );
  }
  const souhaite = k.priorite === 'souhaite';
  return (
    <label className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs cursor-pointer ${souhaite ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
      {onCocher && <input type="checkbox" checked={coche} onChange={onCocher} aria-label={`Ajouter ${k.termeOffre} au CV`} />}
      {k.termeOffre}
      {k.priorite === 'obligatoire' && <span className="rounded bg-red-600 text-white text-[10px] font-semibold px-1">exigé</span>}
      {souhaite && <span className="text-[10px] font-semibold">apprécié</span>}
    </label>
  );
}

export function ListeMotsCles({ motsCles, coches, onCocher, estAjoute, onRetirer }: {
  motsCles: MotCleResultat[]; coches: string[]; onCocher: (terme: string) => void;
  /** Mots-clés ajoutés depuis l'analyseur (décochables) */
  estAjoute?: (k: MotCleResultat) => boolean; onRetirer?: (k: MotCleResultat) => void;
}) {
  const groupes: [string, (k: MotCleResultat) => boolean][] = [
    ['Exigés par l’offre', k => k.priorite === 'obligatoire' && k.categorie !== 'Offre'],
    ['Compétences, outils et domaines', k => k.priorite === 'normal' && !['Offre', 'Savoir-être'].includes(k.categorie)],
    ['Appréciés (« un plus »)', k => k.priorite === 'souhaite' && k.categorie !== 'Offre'],
    ['Savoir-être', k => k.categorie === 'Savoir-être' && k.priorite !== 'obligatoire'],
    ['Expressions fréquentes de l’offre', k => k.categorie === 'Offre'],
  ];
  if (!motsCles.length) return <p className="text-sm text-gray-500">Peu de mots-clés détectés : collez le texte complet de l'offre (missions, profil, compétences).</p>;
  return (
    <>
      {groupes.map(([titre, filtre]) => {
        const liste = motsCles.filter(filtre);
        if (!liste.length) return null;
        return (
          <div key={titre} className="mb-3">
            <h4 className="text-xs font-semibold text-gray-500 mb-1.5">{titre} <span className="font-normal">({liste.filter(k => k.ou !== 'absent').length}/{liste.length})</span></h4>
            <div className="flex flex-wrap gap-1.5">
              {liste.map(k => <Pastille key={k.libelle + k.termeOffre} k={k} coche={coches.includes(k.termeOffre)} onCocher={() => onCocher(k.termeOffre)}
                ajoute={estAjoute?.(k)} onRetirer={onRetirer && (() => onRetirer(k))} />)}
            </div>
          </div>
        );
      })}
    </>
  );
}
