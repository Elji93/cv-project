// ============================================================================
//  « Créer une version anglaise » : aller-retour avec ChatGPT / Claude.
//  Le CV d'origine n'est pas modifié : la traduction devient un nouveau CV.
// ============================================================================
import { useState } from 'react';
import { CheckCircle2, ClipboardCopy, Copy, Languages } from 'lucide-react';
import type { CV, LangueCV } from '../../types';
import { Modale } from '../commun/Modale';
import { useAppStore } from '../../store/useAppStore';
import { creerVersion, lireReponse, promptTraduction } from '../../lib/traduction';

export function ModaleTraduction({ cv, onFermer }: { cv: CV; onFermer: () => void }) {
  const [cible, setCible] = useState<LangueCV>(cv.langue === 'en' ? 'fr' : 'en');
  const [reponse, setReponse] = useState('');
  const [copie, setCopie] = useState<'' | 'ok' | 'echec'>('');
  const [erreur, setErreur] = useState('');
  const langue = cible === 'en' ? 'anglaise' : 'française';
  const prompt = promptTraduction(cv, cible);

  const copier = async () => {
    try { await navigator.clipboard.writeText(prompt); setCopie('ok'); }
    catch { setCopie('echec'); }
  };

  const creer = (avecTraduction: boolean) => {
    setErreur('');
    try {
      const r = creerVersion(cv, cible, avecTraduction ? lireReponse(reponse) : undefined);
      if (avecTraduction && r.remplaces === 0) throw new Error("Aucun texte traduit n'a été reconnu dans la réponse.");
      useAppStore.getState().ajouterCvs([r.cv]);
      onFermer();
    } catch (e) { setErreur((e as Error).message); }
  };

  return (
    <Modale titre={`Créer une version ${langue} du CV`} onFermer={onFermer} large>
      <p className="text-sm text-gray-600 mb-3">
        Le CV « {cv.nom} » n'est pas modifié : la version {langue} devient un <b>nouveau CV</b>, avec la même mise en page,
        les titres de sections et les dates dans la bonne langue. Le texte est traduit par l'IA de votre choix (ChatGPT, Claude…) :
        le site n'envoie rien lui-même.
      </p>
      <div className="flex gap-2 mb-4 text-sm">
        <span className="self-center text-gray-500">Traduire vers :</span>
        {(['en', 'fr'] as LangueCV[]).map(l => (
          <button key={l} className={`btn ${cible === l ? 'border-brand-2 text-brand-2' : ''}`} onClick={() => setCible(l)}>{l === 'en' ? 'Anglais' : 'Français'}</button>
        ))}
      </div>

      <ol className="space-y-4">
        <li>
          <h4 className="font-semibold text-sm mb-1">1. Copiez le prompt et collez-le dans ChatGPT ou Claude</h4>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary" onClick={copier}><Copy size={14} /> Copier le prompt de traduction</button>
            {copie === 'ok' && <span className="text-xs text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 size={14} /> Copié. Collez-le dans l'IA, puis revenez ici.</span>}
          </div>
          {copie === 'echec' && (
            <>
              <p className="text-xs text-amber-800 mt-2">Copie automatique impossible : sélectionnez le texte ci-dessous (Ctrl+A puis Ctrl+C).</p>
              <textarea readOnly className="input mt-1 h-32 font-mono text-[11px]" value={prompt} onFocus={e => e.target.select()} />
            </>
          )}
        </li>
        <li>
          <h4 className="font-semibold text-sm mb-1">2. Collez ici toute la réponse de l'IA</h4>
          <textarea className="input h-40 font-mono text-[11px]" value={reponse} onChange={e => setReponse(e.target.value)}
            placeholder={'```json\n{ "titre": "…", "accroche": "…", "experiences": [ … ] }\n```'} />
          {erreur && <p className="text-xs text-red-700 mt-1">{erreur}</p>}
        </li>
      </ol>

      <div className="flex flex-wrap justify-end gap-2 mt-4">
        <button className="btn" onClick={() => creer(false)} title="Copie avec les titres de sections, les dates et les noms de langues traduits ; le texte reste à traduire à la main">
          <ClipboardCopy size={14} /> Créer la copie sans traduire le texte
        </button>
        <button className="btn-primary" disabled={!reponse.trim()} onClick={() => creer(true)}><Languages size={14} /> Créer la version {langue}</button>
      </div>
      <p className="text-[11px] text-gray-500 mt-3">
        Relisez la traduction : vérifiez les intitulés de poste, les diplômes (ajoutez l'équivalent anglais entre parenthèses) et que le CV tient toujours sur une page.
      </p>
    </Modale>
  );
}
