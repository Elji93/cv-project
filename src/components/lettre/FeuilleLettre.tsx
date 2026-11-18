// ============================================================================
//  La lettre de motivation sur une feuille A4 : même en-tête, même police
//  et même couleur que le CV relié.
// ============================================================================
import { forwardRef } from 'react';
import type { CV, LettreMotivation } from '../../types';
import { nomComplet } from '../../lib/cv';
import { lieuDate, paragraphes } from '../../lib/lettre';
import { EnteteCv, variablesFeuille } from '../feuille/EnteteCv';
import '../feuille/feuille.css';
import './lettre.css';

const lignes = (t: string) => t.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean);

export const FeuilleLettre = forwardRef<HTMLDivElement, { cv: CV; lettre: LettreMotivation }>(function FeuilleLettre({ cv, lettre: l }, ref) {
  const corps = paragraphes(l.corps);
  return (
    <div ref={ref} className={`cv-page lettre-page tpl-${cv.templateId}`} style={variablesFeuille(cv)} lang={cv.langue}>
      <EnteteCv cv={cv} sansPhoto sansNaissance />
      {lignes(l.destinataire).length > 0 && (
        <div className="lt-dest">{lignes(l.destinataire).map((x, i) => <div key={i}>{x}</div>)}</div>
      )}
      <p className="lt-date">{lieuDate(cv, l)}</p>
      {l.objet.trim() && <p className="lt-objet"><b>{cv.langue === 'en' ? 'Subject: ' : 'Objet : '}</b>{l.objet.trim()}</p>}
      <div className="lt-corps">
        {l.appel.trim() && <p>{l.appel.trim()}</p>}
        {corps.length ? corps.map((x, i) => <p key={i}>{x}</p>) : <p className="lt-vide">Le corps de la lettre apparaîtra ici.</p>}
        {paragraphes(l.politesse).map((x, i) => <p key={'p' + i}>{x}</p>)}
      </div>
      <p className="lt-signature">{nomComplet(cv)}</p>
    </div>
  );
});
