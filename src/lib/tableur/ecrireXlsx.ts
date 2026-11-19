// ============================================================================
//  Écriture d'un petit classeur Excel (.xlsx) sans bibliothèque dédiée :
//  un .xlsx est un zip de fichiers XML. Il s'ouvre dans Excel, LibreOffice Calc
//  et Google Sheets. Toutes les cellules sont au format « Texte » pour que
//  « 09/2024 » ne soit pas transformé en date.
// ============================================================================
import JSZip from 'jszip';

/** Styles disponibles (index dans styles.xml) */
export const STYLE = { normal: 0, entete: 1, exemple: 2, saisie: 3, titre: 4, aide: 5 } as const;
export type StyleCellule = keyof typeof STYLE;

export interface Cellule { texte: string; style?: StyleCellule }

export interface FeuilleXlsx {
  /** Nom de l'onglet (31 caractères max, sans [ ] : * ? / \) */
  nom: string;
  /** Largeur de chaque colonne (en caractères) */
  largeurs: number[];
  lignes: (Cellule | string)[][];
  /** Fige la première ligne (en-têtes) */
  figerEntete?: boolean;
  /** Listes déroulantes : colonne (0 = A) et choix proposés */
  listes?: { colonne: number; choix: string[]; premiereLigne: number; derniereLigne: number }[];
}

const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

/** Échappe le texte pour le XML et retire les caractères interdits */
export const xml = (s: string) => s
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 0 -> A, 25 -> Z, 26 -> AA */
export function lettreColonne(i: number): string {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

const nomOnglet = (n: string) => n.replace(/[[\]:*?/\\]/g, ' ').slice(0, 31);

function feuilleXml(f: FeuilleXlsx, active: boolean): string {
  const cols = f.largeurs.map((l, i) => `<col min="${i + 1}" max="${i + 1}" width="${l}" style="${STYLE.saisie}" customWidth="1"/>`).join('');
  const lignes = f.lignes.map((ligne, r) => {
    const cellules = ligne.map((c, i) => {
      const { texte, style = 'saisie' } = typeof c === 'string' ? { texte: c } : c;
      const ref = `${lettreColonne(i)}${r + 1}`;
      if (!texte) return `<c r="${ref}" s="${STYLE[style]}"/>`;
      return `<c r="${ref}" s="${STYLE[style]}" t="inlineStr"><is><t xml:space="preserve">${xml(texte)}</t></is></c>`;
    }).join('');
    return `<row r="${r + 1}">${cellules}</row>`;
  }).join('');
  const volet = f.figerEntete ? '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' : '';
  const listes = f.listes?.length
    ? `<dataValidations count="${f.listes.length}">${f.listes.map(l => {
      const col = lettreColonne(l.colonne);
      return `<dataValidation type="list" allowBlank="1" showErrorMessage="0" sqref="${col}${l.premiereLigne}:${col}${l.derniereLigne}"><formula1>"${xml(l.choix.join(','))}"</formula1></dataValidation>`;
    }).join('')}</dataValidations>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="${NS}" xmlns:r="${NS_R}"><sheetViews><sheetView workbookViewId="0"${active ? ' tabSelected="1"' : ''}>${volet}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${cols}</cols><sheetData>${lignes}</sheetData>${listes}<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/></worksheet>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="${NS}">
<fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><i/><sz val="11"/><color rgb="FF8A8A8A"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FF1F3A5F"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1F3A5F"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="6">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="49" fontId="1" fillId="2" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="49" fontId="2" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/** Construit le fichier .xlsx (octets) */
export async function ecrireXlsx(feuilles: FeuilleXlsx[], ongletActif = 0): Promise<Uint8Array> {
  const zip = new JSZip();
  const n = feuilles.length;
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${feuilles.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${NS_R}/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  zip.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="${NS}" xmlns:r="${NS_R}"><bookViews><workbookView activeTab="${ongletActif}"/></bookViews><sheets>${feuilles.map((f, i) => `<sheet name="${xml(nomOnglet(f.nom))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`);
  zip.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${feuilles.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${NS_R}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${n + 1}" Type="${NS_R}/styles" Target="styles.xml"/></Relationships>`);
  zip.file('xl/styles.xml', STYLES_XML);
  feuilles.forEach((f, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, feuilleXml(f, i === ongletActif)));
  return zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
}
