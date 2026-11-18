// ============================================================================
//  Fenêtres de confirmation et de saisie intégrées à l'application.
//  (Les fenêtres natives confirm() / prompt() du navigateur sont bloquées dans
//   certains navigateurs intégrés : elles répondent « Annuler » sans s'afficher.)
//
//  Utilisation :  if (await confirmer({ message: 'Supprimer ce CV ?' })) { … }
//                 const nom = await saisirTexte({ titre: 'Renommer', valeur: cv.nom });
// ============================================================================
import { create } from 'zustand';

export interface Dialogue {
  type: 'confirmation' | 'saisie';
  titre: string;
  message?: string;
  /** Texte du bouton principal, ex. « Supprimer » */
  libelleOk: string;
  /** Bouton principal en rouge (action destructrice) */
  danger: boolean;
  /** Valeur de départ du champ (saisie) */
  valeur: string;
  repondre: (reponse: boolean | string | null) => void;
}

export const useDialogues = create<{ dialogue: Dialogue | null }>()(() => ({ dialogue: null }));

function ouvrir(d: Omit<Dialogue, 'repondre'>): Promise<boolean | string | null> {
  return new Promise(resolve => {
    useDialogues.setState({
      dialogue: {
        ...d,
        repondre: reponse => { useDialogues.setState({ dialogue: null }); resolve(reponse); },
      },
    });
  });
}

/** Demande une confirmation. Renvoie true si l'utilisatrice confirme. */
export async function confirmer(o: { titre?: string; message: string; libelleOk?: string; danger?: boolean }): Promise<boolean> {
  const r = await ouvrir({ type: 'confirmation', titre: o.titre ?? 'Confirmation', message: o.message, libelleOk: o.libelleOk ?? 'Confirmer', danger: o.danger ?? false, valeur: '' });
  return r === true;
}

/** Demande un texte. Renvoie le texte saisi, ou null si on annule. */
export async function saisirTexte(o: { titre: string; message?: string; valeur?: string; libelleOk?: string }): Promise<string | null> {
  const r = await ouvrir({ type: 'saisie', titre: o.titre, message: o.message, libelleOk: o.libelleOk ?? 'Valider', danger: false, valeur: o.valeur ?? '' });
  return typeof r === 'string' ? r : null;
}
