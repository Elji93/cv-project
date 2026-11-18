// ============================================================================
//  Aide avant l'export PDF : le PDF est produit par la fenêtre d'impression
//  du navigateur (texte vectoriel, sélectionnable, lisible par les ATS).
// ============================================================================
import { AlertTriangle, CheckCircle2, Printer } from 'lucide-react';
import { Modale } from '../commun/Modale';

const REGLAGES: [string, string][] = [
  ['Destination', '« Enregistrer au format PDF » (ou « Microsoft Print to PDF »)'],
  ['Format / Taille du papier', 'A4'],
  ['Marges', 'Aucune'],
  ['Échelle', '100 % (par défaut)'],
  ['Graphiques d’arrière-plan', 'coché, pour garder les couleurs'],
  ['En-têtes et pieds de page', 'décoché'],
];

interface Props {
  /** Nom de fichier proposé (sans .pdf) */
  nom: string;
  tient: boolean;
  /** Ce qui est exporté : le CV ou la lettre de motivation */
  quoi?: 'cv' | 'lettre';
  onImprimer: () => void;
  onFermer: () => void;
}

export function ModaleExportPdf({ nom, tient, quoi = 'cv', onImprimer, onFermer }: Props) {
  const imprimer = () => {
    onFermer();
    // on laisse la modale se fermer avant d'ouvrir l'impression
    window.setTimeout(onImprimer, 100);
  };
  const sujet = quoi === 'cv' ? 'Votre CV' : 'Votre lettre';
  return (
    <Modale titre="Exporter en PDF" onFermer={onFermer}>
      {tient ? (
        <p className="flex items-center gap-2 text-sm text-emerald-700 mb-3"><CheckCircle2 size={16} /> {sujet} tient sur une page A4.</p>
      ) : (
        <p className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          {quoi === 'cv'
            ? 'Votre CV dépasse une page : la fin sera coupée. Utilisez « Tout faire tenir sur 1 page » dans l’aperçu avant d’exporter.'
            : 'Votre lettre dépasse une page : la fin sera coupée. Raccourcissez-la (200 à 350 mots suffisent).'}
        </p>
      )}
      <p className="text-sm text-gray-700 mb-2">La fenêtre d'impression va s'ouvrir. Réglez-la ainsi :</p>
      <table className="w-full text-sm mb-3">
        <tbody>
          {REGLAGES.map(([k, v]) => (
            <tr key={k} className="border-b border-gray-100 last:border-0">
              <td className="py-1.5 pr-3 text-gray-500 whitespace-nowrap align-top">{k}</td>
              <td className="py-1.5 font-medium">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-gray-500 mb-1">Nom proposé : <b className="font-mono">{nom}.pdf</b></p>
      <p className="text-xs text-gray-500">Le PDF contient du vrai texte (sélectionnable et lisible par les ATS), pas une image. Si la fenêtre d'impression ne s'ouvre pas, ouvrez l'application dans Chrome, Edge ou Firefox.</p>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn" onClick={onFermer}>Annuler</button>
        <button className="btn-primary" onClick={imprimer} autoFocus><Printer size={15} /> Ouvrir la fenêtre d'impression</button>
      </div>
    </Modale>
  );
}
