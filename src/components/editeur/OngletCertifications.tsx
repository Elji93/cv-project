// Onglet « Certifications »
import { Plus, Trash2 } from 'lucide-react';
import { useCvActif, useModifierCv } from '../../store/useAppStore';
import { uid } from '../../lib/cv';
import { Astuce, ChampTexte } from '../commun/Champs';
import { BoosterCandidature } from '../commun/BoosterCandidature';

export function OngletCertifications() {
  const cv = useCvActif();
  const modifier = useModifierCv();
  const liste = cv.donnees.certifications;
  return (
    <>
      <Astuce>CFA, AMF, CCNA, Security+, ITIL, TOEIC… avec l'année (ou « en cours »). Suggestions selon votre métier plus bas.</Astuce>
      {liste.map((x, i) => (
        <div key={x.id} className="grid grid-cols-[1.4fr_1fr_.6fr_auto] gap-2 items-end">
          <ChampTexte libelle="Intitulé" placeholder="CFA Level I" valeur={x.intitule} onValeur={v => modifier(c => { c.donnees.certifications[i].intitule = v; })} />
          <ChampTexte libelle="Organisme" valeur={x.organisme} onValeur={v => modifier(c => { c.donnees.certifications[i].organisme = v; })} />
          <ChampTexte libelle="Année" valeur={x.annee} onValeur={v => modifier(c => { c.donnees.certifications[i].annee = v; })} />
          <button className="icon-btn mb-3 text-red-600" aria-label="Supprimer la certification" onClick={() => modifier(c => { c.donnees.certifications.splice(i, 1); })}><Trash2 size={15} /></button>
        </div>
      ))}
      <button className="btn" onClick={() => modifier(c => { c.donnees.certifications.push({ id: uid(), intitule: '', organisme: '', annee: '' }); })}><Plus size={14} /> Ajouter une certification</button>
      <BoosterCandidature cv={cv} compact />
    </>
  );
}
