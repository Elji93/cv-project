// ============================================================================
//  État global de l'application (zustand)
//  - toutes les données (CV, candidatures, lettres, synonymes perso)
//  - les actions pour les modifier
//  - annuler / rétablir et sauvegarde automatique
// ============================================================================
import { create } from 'zustand';
import type { Candidature, CV, DonneesApp, LettreMotivation } from '../types';
import { VERSION_SCHEMA } from '../types';
import { cvExemple } from '../data/cvExemple';
import { copierCv, cvVierge, maintenant, uid } from '../lib/cv';
import * as H from './historique';
import { chargerDonnees, CLE_STOCKAGE, creerSauvegardeDifferee, ecrireDonnees } from './persistance';

export type DepartNouveauCv = 'vierge' | 'copie' | 'exemple';

interface EtatApp extends DonneesApp, H.Historique {
  erreurSauvegarde: string | null;

  /** Modifie un CV (le CV actif par défaut). La fonction reçoit une copie modifiable. */
  modifierCv: (modif: (cv: CV) => void, id?: string) => void;
  selectionnerCv: (id: string) => void;
  creerCv: (depart: DepartNouveauCv, nom?: string) => string;
  dupliquerCv: (id: string, nom?: string) => string;
  renommerCv: (id: string, nom: string) => void;
  supprimerCv: (id: string) => void;
  /** Équivalence personnelle pour l'analyseur, ex. ['SIRH', 'HRIS', 'Workday'] */
  ajouterSynonyme: (termes: string[]) => void;
  supprimerSynonyme: (id: string) => void;
  /** Supprime plusieurs CV en une seule action (annulable d'un seul Ctrl+Z) */
  supprimerCvs: (ids: string[]) => void;
  /** Lettres de motivation */
  ajouterLettre: (l: LettreMotivation) => void;
  modifierLettre: (id: string, modif: (l: LettreMotivation) => void) => void;
  supprimerLettres: (ids: string[]) => void;
  /** Suivi des candidatures */
  ajouterCandidature: (c: Candidature) => void;
  modifierCandidature: (id: string, modif: (c: Candidature) => void) => void;
  supprimerCandidatures: (ids: string[]) => void;
  /** Ajoute des CV importés (ils deviennent actifs) */
  ajouterCvs: (cvs: CV[]) => void;
  /** Remplace toutes les données (restauration d'une sauvegarde JSON) */
  restaurer: (d: DonneesApp) => void;
  annuler: () => void;
  retablir: () => void;
}

/** Les données « pures », sans les actions ni l'historique */
export const extraireDonnees = (e: DonneesApp): DonneesApp => ({
  versionSchema: VERSION_SCHEMA,
  cvs: e.cvs,
  cvActifId: e.cvActifId,
  candidatures: e.candidatures,
  lettres: e.lettres,
  synonymesPerso: e.synonymesPerso,
});

const instantane = (e: DonneesApp): H.Instantane => ({
  cvs: e.cvs, cvActifId: e.cvActifId, candidatures: e.candidatures, lettres: e.lettres, synonymesPerso: e.synonymesPerso,
});

export const useAppStore = create<EtatApp>()((set, get) => {
  /**
   * Applique un changement de données en l'inscrivant dans l'historique.
   * cle : les changements rapprochés avec la même clé (ex. frappe dans un CV) sont regroupés.
   */
  const changer = (nouveau: Partial<DonneesApp>, cle = '') => {
    const etat = get();
    const h = H.nouvelleEntree(cle) ? H.memoriser(etat, instantane(etat)) : { passe: etat.passe, futur: [] };
    set({ ...nouveau, ...h });
  };

  return {
    ...chargerDonnees(),
    passe: [],
    futur: [],
    erreurSauvegarde: null,

    modifierCv(modif, id) {
      const cible = id ?? get().cvActifId;
      const cvs = get().cvs.map(cv => {
        if (cv.id !== cible) return cv;
        const copie = structuredClone(cv);
        modif(copie);
        copie.dateModification = maintenant();
        return copie;
      });
      changer({ cvs }, 'cv:' + cible);
    },

    selectionnerCv(id) {
      if (get().cvs.some(c => c.id === id)) set({ cvActifId: id });
    },

    creerCv(depart, nom) {
      if (depart === 'copie') return get().dupliquerCv(get().cvActifId, nom);
      const cv = depart === 'exemple' ? cvExemple() : cvVierge();
      if (nom) cv.nom = nom;
      changer({ cvs: [cv, ...get().cvs], cvActifId: cv.id });
      return cv.id;
    },

    dupliquerCv(id, nom) {
      const src = get().cvs.find(c => c.id === id);
      if (!src) return get().cvActifId;
      const copie = copierCv(src, nom || `${src.nom} (copie)`);
      changer({ cvs: [copie, ...get().cvs], cvActifId: copie.id });
      return copie.id;
    },

    renommerCv(id, nom) {
      changer({ cvs: get().cvs.map(c => (c.id === id ? { ...c, nom, dateModification: maintenant() } : c)) });
    },

    supprimerCv(id) {
      get().supprimerCvs([id]);
    },

    supprimerCvs(ids) {
      if (!ids.length) return;
      let cvs = get().cvs.filter(c => !ids.includes(c.id));
      if (!cvs.length) cvs = [cvVierge()];
      const actif = cvs.some(c => c.id === get().cvActifId) ? get().cvActifId : cvs[0].id;
      changer({ cvs, cvActifId: actif });
    },

    ajouterCvs(nouveaux) {
      if (!nouveaux.length) return;
      const existants = new Set(get().cvs.map(c => c.id));
      // Un CV déjà présent (même identifiant) est ajouté comme copie pour ne rien écraser
      const prets = nouveaux.map(c => (existants.has(c.id) ? copierCv(c, `${c.nom} (importé)`) : c));
      changer({ cvs: [...prets, ...get().cvs], cvActifId: prets[0].id });
    },

    ajouterSynonyme(termes) {
      const propres = [...new Set(termes.map(t => t.trim()).filter(Boolean))];
      if (propres.length < 2) return;
      changer({ synonymesPerso: [...get().synonymesPerso, { id: uid(), termes: propres }] });
    },

    supprimerSynonyme(id) {
      changer({ synonymesPerso: get().synonymesPerso.filter(e => e.id !== id) });
    },

    ajouterLettre(l) {
      changer({ lettres: [l, ...get().lettres] });
    },

    modifierLettre(id, modif) {
      const lettres = get().lettres.map(l => {
        if (l.id !== id) return l;
        const copie = structuredClone(l);
        modif(copie);
        copie.dateModification = maintenant();
        return copie;
      });
      changer({ lettres }, 'lettre:' + id);
    },

    supprimerLettres(ids) {
      if (!ids.length) return;
      changer({
        lettres: get().lettres.filter(l => !ids.includes(l.id)),
        // les candidatures gardent leur ligne, sans lien vers la lettre supprimée
        candidatures: get().candidatures.map(c => (c.lettreId && ids.includes(c.lettreId) ? { ...c, lettreId: null } : c)),
      });
    },

    ajouterCandidature(c) {
      changer({ candidatures: [c, ...get().candidatures] });
    },

    modifierCandidature(id, modif) {
      const candidatures = get().candidatures.map(c => {
        if (c.id !== id) return c;
        const copie = structuredClone(c);
        modif(copie);
        return copie;
      });
      changer({ candidatures }, 'candidature:' + id);
    },

    supprimerCandidatures(ids) {
      if (!ids.length) return;
      changer({ candidatures: get().candidatures.filter(c => !ids.includes(c.id)) });
    },

    restaurer(d) {
      changer(extraireDonnees(d));
    },

    annuler() {
      const r = H.annuler(get(), instantane(get()));
      if (!r) return;
      H.couperRegroupement();
      set({ ...r.etat, ...r.h });
    },

    retablir() {
      const r = H.retablir(get(), instantane(get()));
      if (!r) return;
      H.couperRegroupement();
      set({ ...r.etat, ...r.h });
    },
  };
});

// ---------------------------------------------------------------------------
//  Sauvegarde automatique (500 ms après la dernière modification)
// ---------------------------------------------------------------------------
const sauvegarde = creerSauvegardeDifferee(() => {
  const erreur = ecrireDonnees(extraireDonnees(useAppStore.getState()));
  if (erreur !== useAppStore.getState().erreurSauvegarde) useAppStore.setState({ erreurSauvegarde: erreur });
});

useAppStore.subscribe((etat, avant) => {
  const aChange = etat.cvs !== avant.cvs || etat.cvActifId !== avant.cvActifId || etat.candidatures !== avant.candidatures
    || etat.lettres !== avant.lettres || etat.synonymesPerso !== avant.synonymesPerso;
  if (aChange) sauvegarde.planifier();
});

// Premier lancement ou données migrées : on écrit tout de suite au nouveau format
try { if (!globalThis.localStorage?.getItem(CLE_STOCKAGE)) sauvegarde.planifier(); } catch { /* stockage indisponible */ }

if (typeof window !== 'undefined') {
  // Recharger ou fermer la page : on écrit tout de suite ce qui est en attente
  window.addEventListener('pagehide', sauvegarde.vider);
  window.addEventListener('beforeunload', sauvegarde.vider);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sauvegarde.vider(); });
}

// ---------------------------------------------------------------------------
//  Raccourcis pratiques pour les composants
// ---------------------------------------------------------------------------

/** Le CV actuellement ouvert */
export const useCvActif = () => useAppStore(e => e.cvs.find(c => c.id === e.cvActifId) ?? e.cvs[0]);

/** Modifier le CV actif : modifier(cv => { cv.donnees.accroche = '…' }) */
export const useModifierCv = () => useAppStore(e => e.modifierCv);
