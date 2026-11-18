// Affiche la fenêtre de confirmation ou de saisie en cours (voir store/dialogues.ts)
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useDialogues } from '../../store/dialogues';

export function Dialogues() {
  const d = useDialogues(e => e.dialogue);
  const [texte, setTexte] = useState('');
  const ok = useRef<HTMLButtonElement>(null);
  const champ = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!d) return;
    setTexte(d.valeur);
    // Focus : le champ pour une saisie, le bouton principal pour une confirmation
    setTimeout(() => (d.type === 'saisie' ? champ.current?.select() : ok.current?.focus()), 0);
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); d.repondre(d.type === 'saisie' ? null : false); } };
    window.addEventListener('keydown', echap, true);
    return () => window.removeEventListener('keydown', echap, true);
  }, [d]);

  if (!d) return null;
  const annuler = () => d.repondre(d.type === 'saisie' ? null : false);
  const valider = () => d.repondre(d.type === 'saisie' ? texte : true);

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 grid place-items-center p-4" onMouseDown={e => { if (e.target === e.currentTarget) annuler(); }}>
      <form className="bg-white rounded-xl shadow-xl w-full max-w-md p-5" role="alertdialog" aria-modal="true" aria-label={d.titre}
        onSubmit={e => { e.preventDefault(); valider(); }}>
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
          {d.danger && <AlertTriangle size={18} className="text-red-600" />}{d.titre}
        </h3>
        {d.message && <p className="text-sm text-gray-600 whitespace-pre-line mb-3">{d.message}</p>}
        {d.type === 'saisie' && <input ref={champ} className="input mb-3" value={texte} onChange={e => setTexte(e.target.value)} />}
        <div className="flex justify-end gap-2 mt-2">
          <button type="button" className="btn" onClick={annuler}>Annuler</button>
          <button ref={ok} type="submit" disabled={d.type === 'saisie' && !texte.trim()}
            className={d.danger ? 'btn-primary bg-red-600 hover:bg-red-700' : 'btn-primary'}>{d.libelleOk}</button>
        </div>
      </form>
    </div>
  );
}
