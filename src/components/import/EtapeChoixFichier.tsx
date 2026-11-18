// Étape 1 de l'import : déposer un fichier (PDF, Word, Canva) ou coller le texte
import { useState } from 'react';
import { ClipboardPaste, FileUp, Loader2, ShieldCheck } from 'lucide-react';

interface Props {
  chargement: boolean;
  erreur: string;
  onFichier: (f: File) => void;
  onTexte: (t: string) => void;
}

export function EtapeChoixFichier({ chargement, erreur, onFichier, onTexte }: Props) {
  const [survol, setSurvol] = useState(false);
  const [texte, setTexte] = useState('');
  return (
    <>
      <label
        onDragOver={e => { e.preventDefault(); setSurvol(true); }}
        onDragLeave={() => setSurvol(false)}
        onDrop={e => { e.preventDefault(); setSurvol(false); const f = e.dataTransfer.files[0]; if (f) onFichier(f); }}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition ${survol ? 'border-brand-2 bg-sky-50' : 'border-gray-300 hover:border-gray-400'}`}>
        {chargement ? <Loader2 className="animate-spin text-brand-2" size={30} /> : <FileUp className="text-brand-2" size={30} />}
        <b>{chargement ? 'Lecture du fichier…' : 'Déposez votre CV ici ou cliquez pour le choisir'}</b>
        <span className="text-xs text-gray-500">PDF (y compris exporté depuis Canva), Word .docx ou texte .txt</span>
        <input type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" hidden
          disabled={chargement} onChange={e => { const f = e.target.files?.[0]; if (f) onFichier(f); e.target.value = ''; }} />
      </label>
      {erreur && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mt-3">{erreur}</p>}

      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 inline-flex items-center gap-1.5"><ClipboardPaste size={15} /> Ou coller le texte du CV</summary>
        <textarea className="input mt-2 min-h-[160px] font-mono text-xs" value={texte} onChange={e => setTexte(e.target.value)}
          placeholder={'Prénom NOM\nIntitulé du poste\nemail | téléphone | ville\n\nEXPÉRIENCES\n…'} />
        <button className="btn-primary mt-2" disabled={texte.trim().length < 20} onClick={() => onTexte(texte)}>Analyser le texte</button>
      </details>

      <p className="flex gap-1.5 text-xs text-gray-500 mt-4">
        <ShieldCheck size={15} className="shrink-0 text-emerald-600" />
        Le fichier est lu directement dans votre navigateur : il n'est envoyé nulle part.
      </p>
    </>
  );
}
