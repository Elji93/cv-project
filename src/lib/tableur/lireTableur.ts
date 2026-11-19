// ============================================================================
//  Lecture d'un classeur rempli : Excel (.xlsx, aussi Google Sheets › Télécharger)
//  ou LibreOffice Calc (.ods). On ne garde que le texte de chaque cellule.
// ============================================================================
import JSZip from 'jszip';
import { attribut, texteOdf } from '../import/lireOdt';

export interface FeuilleLue {
  nom: string;
  /** Lignes de cellules (texte ; une date ou un nombre gardent leur valeur brute) */
  lignes: string[][];
}

const enfants = (el: Element, nom: string) => Array.from(el.children).filter(e => e.localName === nom);
const tous = (el: Element | Document, nom: string) => Array.from(el.getElementsByTagNameNS('*', nom));
const lireXml = (s: string) => new DOMParser().parseFromString(s, 'application/xml');

/** « AB12 » -> 27 (index de colonne à partir de 0) */
export function indexColonne(ref: string): number {
  const lettres = ref.match(/^[A-Z]+/i)?.[0].toUpperCase() ?? 'A';
  return [...lettres].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
}

/** Retire les lignes et colonnes vides de la fin */
function nettoyer(lignes: string[][]): string[][] {
  const out = lignes.map(l => { const c = l.map(x => x ?? ''); while (c.length && !c[c.length - 1].trim()) c.pop(); return c; });
  while (out.length && !out[out.length - 1].length) out.pop();
  return out;
}

// ---------------------------------------------------------------------------
//  Excel .xlsx
// ---------------------------------------------------------------------------
async function lireXlsx(zip: JSZip): Promise<FeuilleLue[]> {
  const lire = async (chemin: string) => { const f = zip.file(chemin); return f ? lireXml(await f.async('string')) : null; };
  const classeur = await lire('xl/workbook.xml');
  if (!classeur) throw new Error('Classeur Excel illisible.');
  const liens = await lire('xl/_rels/workbook.xml.rels');
  const cibles = new Map<string, string>();
  for (const r of liens ? tous(liens, 'Relationship') : []) {
    const cible = r.getAttribute('Target') ?? '';
    cibles.set(r.getAttribute('Id') ?? '', cible.startsWith('/') ? cible.slice(1) : `xl/${cible}`);
  }
  // Textes partagés : les cellules de texte y renvoient par leur numéro
  const partages = (await lire('xl/sharedStrings.xml'));
  const textes = partages ? tous(partages, 'si').map(si => tous(si, 't').filter(t => t.parentElement?.localName !== 'rPh').map(t => t.textContent ?? '').join('')) : [];

  const feuilles: FeuilleLue[] = [];
  for (const s of tous(classeur, 'sheet')) {
    const chemin = cibles.get(attribut(s, 'id') ?? '');
    const doc = chemin ? await lire(chemin) : null;
    if (!doc) continue;
    const lignes: string[][] = [];
    let numeroLigne = 0;
    for (const row of tous(doc, 'row')) {
      numeroLigne = Number(row.getAttribute('r')) || numeroLigne + 1;
      const cellules: string[] = [];
      let col = 0;
      for (const c of enfants(row, 'c')) {
        const ref = c.getAttribute('r');
        col = ref ? indexColonne(ref) : col;
        const type = c.getAttribute('t');
        const v = enfants(c, 'v')[0]?.textContent ?? '';
        let texte = '';
        if (type === 's') texte = textes[Number(v)] ?? '';
        else if (type === 'inlineStr') texte = tous(c, 't').map(t => t.textContent ?? '').join('');
        else texte = v; // nombre, date ISO (t="d"), formule (t="str"), booléen
        while (cellules.length < col) cellules.push('');
        cellules[col] = texte;
        col++;
      }
      lignes[numeroLigne - 1] = cellules;
    }
    feuilles.push({ nom: s.getAttribute('name') ?? '', lignes: nettoyer(Array.from(lignes, l => l ?? [])) });
  }
  return feuilles;
}

// ---------------------------------------------------------------------------
//  LibreOffice .ods
// ---------------------------------------------------------------------------
/** Au-delà, une répétition ne sert qu'à remplir le reste de la feuille avec du vide */
const REPETITION_MAX = 200;

async function lireOds(zip: JSZip): Promise<FeuilleLue[]> {
  const contenu = zip.file('content.xml');
  if (!contenu) throw new Error('Classeur LibreOffice illisible.');
  const doc = lireXml(await contenu.async('string'));
  return tous(doc, 'table').filter(t => t.parentElement?.localName === 'spreadsheet').map(table => {
    const lignes: string[][] = [];
    for (const row of tous(table, 'table-row')) {
      const cellules: string[] = [];
      for (const c of Array.from(row.children).filter(e => e.localName === 'table-cell' || e.localName === 'covered-table-cell')) {
        const type = attribut(c, 'value-type');
        const texte = type === 'date' ? attribut(c, 'date-value') ?? ''
          : type === 'float' ? attribut(c, 'value') ?? ''
            : enfants(c, 'p').map(p => texteOdf(p)).join('\n');
        const fois = Math.min(Number(attribut(c, 'number-columns-repeated')) || 1, REPETITION_MAX);
        for (let i = 0; i < fois; i++) cellules.push(texte);
      }
      const fois = Math.min(Number(attribut(row, 'number-rows-repeated')) || 1, REPETITION_MAX);
      for (let i = 0; i < fois; i++) lignes.push(cellules);
    }
    return { nom: attribut(table, 'name') ?? '', lignes: nettoyer(lignes) };
  });
}

/** Lit un classeur .xlsx ou .ods */
export async function lireTableur(donnees: ArrayBuffer | Uint8Array): Promise<FeuilleLue[]> {
  const zip = await JSZip.loadAsync(donnees);
  if (zip.file('xl/workbook.xml')) return lireXlsx(zip);
  if (zip.file('content.xml')) return lireOds(zip);
  throw new Error('Ce fichier n’est pas un classeur Excel (.xlsx) ni LibreOffice (.ods).');
}
