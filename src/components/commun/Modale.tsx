// Fenêtre modale simple (clic à l'extérieur ou Échap pour fermer)
import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modale({ titre, onFermer, children, large }: { titre: string; onFermer: () => void; children: ReactNode; large?: boolean }) {
  useEffect(() => {
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer(); };
    window.addEventListener('keydown', echap);
    return () => window.removeEventListener('keydown', echap);
  }, [onFermer]);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onMouseDown={e => { if (e.target === e.currentTarget) onFermer(); }}>
      <div className={`bg-white rounded-xl shadow-xl w-full ${large ? 'max-w-5xl' : 'max-w-xl'} max-h-[92vh] overflow-auto p-5`} role="dialog" aria-modal="true" aria-label={titre}>
        <div className="flex items-center mb-4">
          <h3 className="font-semibold text-lg flex-1">{titre}</h3>
          <button className="icon-btn" aria-label="Fermer" onClick={onFermer}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
