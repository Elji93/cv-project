// Jauge du score global + détail de chaque critère (barres de progression)
import { CheckCircle2, XCircle } from 'lucide-react';
import type { ResultatAts } from '../../lib/ats/scoring';

const couleur = (ratio: number) => (ratio >= 0.75 ? '#059669' : ratio >= 0.5 ? '#d97706' : '#dc2626');

export function CarteScore({ r }: { r: ResultatAts }) {
  const c = couleur(r.total / 100);
  const verdict = r.total >= 80 ? 'Excellent — prêt à postuler' : r.total >= 65 ? 'Bon — quelques optimisations' : r.total >= 50 ? "Moyen — à adapter à l'offre" : 'Faible — CV à retravailler';
  const C = 2 * Math.PI * 80;
  return (
    <div className="card">
      <div className="relative w-[180px] h-[180px] mx-auto">
        <svg width="180" height="180" viewBox="0 0 190 190" className="-rotate-90">
          <circle cx="95" cy="95" r="80" fill="none" stroke="#eef1f5" strokeWidth="15" />
          <circle cx="95" cy="95" r="80" fill="none" stroke={c} strokeWidth="15" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - r.total / 100)} style={{ transition: 'stroke-dashoffset .6s, stroke .6s' }} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div><b className="text-5xl leading-none block tabular-nums" style={{ color: c }}>{r.total}</b><span className="text-gray-500 text-sm">/ 100</span></div>
        </div>
      </div>
      <p className="text-center font-semibold mt-1 mb-4" style={{ color: c }}>{verdict}</p>
      {r.criteres.map(cr => {
        const ratio = cr.score / cr.max;
        return (
          <details key={cr.id} className="mb-2.5" open={ratio < 0.75}>
            <summary className="cursor-pointer list-none">
              <div className="flex justify-between text-[13px] mb-1"><span>{cr.libelle}</span><span className="tabular-nums font-semibold">{cr.score}/{cr.max}</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <i className="block h-full rounded-full transition-all duration-500" style={{ width: `${ratio * 100}%`, background: couleur(ratio) }} />
              </div>
            </summary>
            <ul className="mt-2 space-y-1 text-xs">
              {cr.verifications.map((v, i) => (
                <li key={i} className="flex gap-1.5">{v.ok ? <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-px" /> : <XCircle size={13} className="text-red-600 shrink-0 mt-px" />}{v.libelle}</li>
              ))}
            </ul>
          </details>
        );
      })}
      <p className="text-[11px] text-gray-400 mt-3">Grille inspirée des recommandations APEC. Chaque ATS (Workday, Taleo, SuccessFactors…) a ses propres réglages : le score est une estimation.</p>
    </div>
  );
}
