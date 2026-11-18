// Petite case « Sur le CV » pour une ligne (langue, certification) : décochée = gardée en réserve
export function CaseSurCv({ valeur, onChange }: { valeur: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="mb-3 flex flex-col items-center text-[10px] leading-tight text-gray-500 cursor-pointer" title={valeur ? 'Sur le CV (décocher pour garder en réserve)' : 'En réserve : cocher pour l’afficher sur le CV'}>
      <input type="checkbox" className="mb-1" checked={valeur} onChange={e => onChange(e.target.checked)} aria-label="Afficher sur le CV" />
      {valeur ? 'CV' : 'Réserve'}
    </label>
  );
}
