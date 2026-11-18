// Saisie d'une période : début, fin, case « en cours ». Accepte « 09/2024 », « Sept. 2024 » ou « 2024 ».
import { useEffect, useState } from 'react';
import type { MoisAnnee, Periode } from '../../types';
import { dateVersSaisie, lireDate } from '../../lib/dates';

function ChampDate({ libelle, valeur, onValeur, desactive }: { libelle: string; valeur: MoisAnnee; onValeur: (d: MoisAnnee) => void; desactive?: boolean }) {
  // Texte tapé, relu quand on quitte le champ
  const [texte, setTexte] = useState(dateVersSaisie(valeur));
  const [erreur, setErreur] = useState(false);
  useEffect(() => { setTexte(dateVersSaisie(valeur)); setErreur(false); }, [valeur]);
  return (
    <label className="flex flex-col gap-1 mb-3 min-w-0">
      <span className="text-xs font-semibold text-gray-500">{libelle}</span>
      <input
        className={`input ${erreur ? 'border-red-400 ring-2 ring-red-100' : ''}`}
        placeholder="MM/AAAA" value={desactive ? '' : texte} disabled={desactive}
        onChange={e => setTexte(e.target.value)}
        onBlur={() => {
          const d = lireDate(texte);
          if (d === null) setErreur(true);
          else { setErreur(false); onValeur(d); }
        }}
      />
      {erreur && <span className="text-[11px] text-red-600">Format attendu : 09/2024 ou 2024</span>}
    </label>
  );
}

export function ChampPeriode({ periode, onChange }: { periode: Periode; onChange: (modif: (p: Periode) => void) => void }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
      <ChampDate libelle="Début" valeur={periode.debut} onValeur={d => onChange(p => { p.debut = d; })} />
      <ChampDate libelle="Fin" valeur={periode.fin} desactive={periode.enCours} onValeur={d => onChange(p => { p.fin = d; })} />
      <label className="flex items-center gap-1.5 text-xs text-gray-600 mt-7 whitespace-nowrap">
        <input type="checkbox" checked={periode.enCours} onChange={e => onChange(p => { p.enCours = e.target.checked; if (p.enCours) p.fin = ''; })} />
        En cours
      </label>
    </div>
  );
}
