// ============================================================================
//  Import d'un CV existant (PDF, Canva, Word, texte) en 2 étapes :
//  1. lecture du fichier   2. vérification, puis création du CV au format Finance
// ============================================================================
import { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { lirePdf, type ContenuImporte, type LigneImportee } from '../../lib/import/lirePdf';
import { lireDocx, lignesDepuisTexte } from '../../lib/import/lireDocx';
import { decouperCv, type ResultatImport } from '../../lib/import/decouperSections';
import { ajouterTexte, classerLignes, cvDepuisImport, remplacerContenu, type ChampInfo, type Destination } from '../../lib/import/classer';
import { Modale } from '../commun/Modale';
import { confirmer } from '../../store/dialogues';
import { EtapeChoixFichier } from './EtapeChoixFichier';
import { EtapeVerification } from './EtapeVerification';

export function ModaleImport({ onFermer }: { onFermer: () => void }) {
  const ajouterCvs = useAppStore(e => e.ajouterCvs);
  const modifierCv = useAppStore(e => e.modifierCv);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [lignes, setLignes] = useState<LigneImportee[] | null>(null);
  const [resultat, setResultat] = useState<ResultatImport | null>(null);
  const [destination, setDestination] = useState<'nouveau' | 'remplacer'>('nouveau');
  const [source, setSource] = useState('');

  const analyser = ({ lignes: l, photo }: ContenuImporte) => {
    const r = decouperCv(l);
    r.donnees.infosPerso.photo = photo; // photo trouvée dans le fichier (ou null)
    setLignes(l);
    setResultat(r);
  };

  const lireFichier = async (f: File) => {
    setChargement(true);
    setErreur('');
    setSource(f.name.replace(/\.[a-z]+$/i, ''));
    try {
      const nom = f.name.toLowerCase();
      if (nom.endsWith('.pdf')) analyser(await lirePdf(f));
      else if (nom.endsWith('.docx')) analyser(await lireDocx(f));
      else if (nom.endsWith('.txt')) analyser({ lignes: lignesDepuisTexte(await f.text()), photo: null });
      else throw new Error('Format non pris en charge : choisissez un PDF, un .docx ou un .txt. (Les anciens .doc doivent être réenregistrés en .docx.)');
    } catch (e) {
      console.error(e);
      setErreur((e as Error).message || 'Lecture impossible.');
    } finally {
      setChargement(false);
    }
  };

  /** Classement fait à l'écran de vérification : appliqué tout de suite au résultat */
  const classer = (fragmentId: string, lignesChoisies: number[], section: Destination | null) => {
    setResultat(r => {
      if (!r) return r;
      const donnees = structuredClone(r.donnees);
      const aClasser = classerLignes(donnees, r.aClasser, fragmentId, lignesChoisies, section);
      return { ...r, donnees, aClasser };
    });
  };

  /** Ligne du texte extrait attribuée à un champ des infos perso */
  const attribuer = (texte: string, champ: ChampInfo) => {
    setResultat(r => {
      if (!r) return r;
      const donnees = structuredClone(r.donnees);
      ajouterTexte(donnees, texte, `infos.${champ}`);
      return { ...r, donnees };
    });
  };

  const valider = async () => {
    if (!resultat) return;
    if (destination === 'nouveau') {
      ajouterCvs([cvDepuisImport(resultat, `CV importé — ${source || new Date().toLocaleDateString('fr-FR')}`)]);
    } else {
      if (!await confirmer({ titre: 'Remplacer le contenu du CV ouvert ?', message: 'Le contenu sera remplacé par le CV importé (Ctrl+Z pour annuler).', libelleOk: 'Remplacer', danger: true })) return;
      modifierCv(cv => remplacerContenu(cv, resultat));
    }
    onFermer();
  };

  return (
    <Modale titre="Importer un CV (PDF, Canva, Word)" onFermer={onFermer} large={!!resultat}>
      {!resultat || !lignes ? (
        <EtapeChoixFichier chargement={chargement} erreur={erreur} onFichier={lireFichier} onTexte={t => { setSource('texte collé'); analyser({ lignes: lignesDepuisTexte(t), photo: null }); }} />
      ) : (
        <>
          <EtapeVerification lignes={lignes} resultat={resultat} onClasser={classer} onAttribuer={attribuer}
            onInfo={(k, v) => setResultat(r => r && { ...r, donnees: { ...r.donnees, infosPerso: { ...r.donnees.infosPerso, [k]: v } } })}
            onPhoto={photo => setResultat(r => r && { ...r, donnees: { ...r.donnees, infosPerso: { ...r.donnees.infosPerso, photo } } })} />
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-gray-200">
            <button className="btn" onClick={() => { setResultat(null); setLignes(null); }}><ArrowLeft size={14} /> Autre fichier</button>
            <div className="flex-1" />
            <label className="flex items-center gap-1.5 text-sm"><input type="radio" checked={destination === 'nouveau'} onChange={() => setDestination('nouveau')} /> Nouveau CV (modèle Finance)</label>
            <label className="flex items-center gap-1.5 text-sm"><input type="radio" checked={destination === 'remplacer'} onChange={() => setDestination('remplacer')} /> Remplacer le contenu du CV ouvert</label>
            <button className="btn-primary" onClick={valider}><Check size={15} /> Valider l'import</button>
          </div>
        </>
      )}
    </Modale>
  );
}
