// Import par tableau : télécharger un classeur à remplir (Excel, LibreOffice, Google Sheets), puis le réimporter
import { useState } from 'react';
import { saveAs } from 'file-saver';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useCvActif } from '../../store/useAppStore';
import { infosVisibles, nomComplet } from '../../lib/cv';

const TYPE_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function BlocTableau() {
  const cv = useCvActif();
  const [encours, setEncours] = useState<'vide' | 'cv' | null>(null);

  const telecharger = async (avecCv: boolean) => {
    setEncours(avecCv ? 'cv' : 'vide');
    try {
      const { tableauCv } = await import('../../lib/tableur/modeleCv');
      // Sans les coordonnées masquées : le tableau ne contient que ce qui est sur le CV
      const octets = await tableauCv(avecCv && cv ? { ...cv.donnees, infosPerso: infosVisibles(cv) } : null);
      const qui = cv ? nomComplet(cv).replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') : '';
      saveAs(new Blob([octets as BlobPart], { type: TYPE_XLSX }), avecCv && qui ? `cv-studio-tableau-${qui}.xlsx` : 'cv-studio-tableau-a-remplir.xlsx');
    } finally {
      setEncours(null);
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-800"><FileSpreadsheet size={16} className="text-emerald-700" /> Ou remplir un tableau</p>
      <p className="text-xs text-gray-600 mt-1 leading-snug">
        Téléchargez le tableau, remplissez-le dans Excel, LibreOffice Calc ou Google Sheets (un onglet par rubrique),
        enregistrez-le, puis déposez-le dans le cadre ci-dessus. Chaque case va directement au bon endroit du CV.
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        <button type="button" className="btn-sm" disabled={!!encours} onClick={() => telecharger(false)}>
          {encours === 'vide' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Tableau vide (avec exemples)
        </button>
        {cv && (
          <button type="button" className="btn-sm" disabled={!!encours} onClick={() => telecharger(true)} title="Le tableau est prérempli avec le CV ouvert (sans les éléments masqués), pour le compléter ou le corriger">
            {encours === 'cv' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Tableau rempli avec le CV ouvert
          </button>
        )}
      </div>
      <p className="text-[11px] text-gray-500 mt-1.5">Google Sheets : Fichier › Importer pour l’ouvrir, puis Fichier › Télécharger › Microsoft Excel (.xlsx) une fois rempli.</p>
    </div>
  );
}
