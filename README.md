# CV Studio

Application web pour créer des **CV d'une page A4, compatibles ATS**, pour tous les secteurs : finance (audit, M&A, contrôle de gestion…), RH / paie / SIRH, informatique (cybersécurité, réseaux et systèmes, cloud, développement, data), commerce et relation client, marketing et communication, achats et supply chain, industrie, qualité et HSE, BTP, santé et social, juridique, assistanat, hôtellerie-restauration et tourisme, enseignement et formation.
Elle comprend aussi un **analyseur de score ATS** (critères de l'APEC), un éditeur de **lettre de motivation** et un **suivi des candidatures**.

100 % dans le navigateur (React + Vite + TypeScript + Tailwind CSS), hébergeable gratuitement sur **GitHub Pages**. Aucune donnée n'est envoyée sur internet : tout reste dans le `localStorage` du navigateur.

---

## Fonctionnalités

### Éditeur de CV
- **Plusieurs CV** : créer (vierge, copie du CV ouvert, exemple), dupliquer, renommer, supprimer (un ou plusieurs à la fois).
- **CV exemple** Finance / Audit prérempli pour tester tout de suite.
- **Deux façons de modifier, toujours synchronisées** :
  - directement **sur la feuille A4** : Entrée crée une puce, Retour arrière sur une puce vide la supprime ;
  - avec la **saisie guidée** par onglets : Infos & photo · Titre & accroche · Expériences · Formation · Compétences, langues & savoir-être · Certifications · Intérêts.
- **Aperçu A4 exact** (210 × 297 mm) : zoom, repère de fin de page, alerte de dépassement et bouton **Tout faire tenir sur 1 page**. Ce bouton réduit les espacements, puis l'interligne, puis les marges, puis la police, sans jamais descendre sous 9,5 pt.
- **3 modèles**, tous sur une seule colonne et lisibles par les ATS :
  - *Finance / M&A / Conseil* : ultra-sobre, petite photo facultative de 20 mm ;
  - *Moderne / Structuré* : photo de 28 mm ;
  - *RH / Paie / SIRH* : outils et logiciels mis en avant.
- **Mise en forme** :
  - 5 couleurs sobres, plus une couleur libre ;
  - 6 polices : Calibri, Arial, Georgia, Garamond, Inter, Roboto ;
  - taille, interligne, espacement et marges ;
  - titres en majuscules ;
  - intitulés de sections en français ou en anglais ;
  - ordre des sections par **glisser-déposer** ;
  - sections masquables et renommables.
- **Version anglaise (ou française) du CV** : Mise en forme › « Créer une version anglaise ». Le site prépare un prompt (contenu du CV en JSON) à coller dans ChatGPT ou Claude ; la réponse recollée devient un nouveau CV traduit (titres de sections et dates compris), le CV d'origine restant intact. Sans IA, une copie avec titres, dates et noms de langues traduits.
- **Photo** facultative : recadrage par glisser, zoom, forme carrée ou ronde.
- **Réserve** (expériences, formations, groupes de compétences, langues, certifications) : tout reste en mémoire, un bouton œil « Sur le CV / Masqué » choisit ce qui apparaît (feuille, PDF, Word, score ATS).
- **Coordonnées masquables** (email, téléphone, ville, LinkedIn, site / GitHub, date de naissance) : bouton œil à côté de chaque champ dans « Infos & photo ». L'information reste enregistrée mais n'apparaît ni sur le CV, ni dans le PDF, le Word ou la lettre ; l'analyseur la considère absente et le signale sans insister. Une section entière se masque dans « Mise en forme › Ordre des sections ».
- **Mention RQTH facultative** (« Infos & photo ») : ne pas l'indiquer (par défaut), dans l'en-tête avec les coordonnées, en bas du CV, ou seulement dans la lettre de motivation (phrase proposée dans le brouillon, bouton « Ajouter la phrase RQTH » pour une lettre déjà écrite). Sur le CV, la mention est « RQTH » seule, sans précision ; sur une version anglaise du CV, « Recognised disability (RQTH) », et la phrase de la lettre est en anglais. À l'import, une mention RQTH n'est jamais placée d'office : elle va dans « À classer », d'où « Envoyer vers… › Mention RQTH » active l'option. L'analyseur signale les éléments en réserve qui correspondent à l'offre, et la carte « Booster » propose de remettre sur le CV une certification gardée en réserve.
- **Annuler / rétablir** (50 actions).
- **Import d'un CV existant** (PDF, y compris Canva, Word .docx, LibreOffice .odt ; Google Docs : télécharger en .docx) :
  - le texte est réparti dans les sections ;
  - les colonnes latérales sont reconnues ;
  - la photo est extraite.
  - Un écran de vérification permet ensuite de corriger le résultat, et ce qui n'a pas pu être classé reste disponible dans « À classer ».
  - **Tableau à remplir** : dans la fenêtre d'import, « Tableau vide (avec exemples) » ou « Tableau rempli avec le CV ouvert » télécharge un classeur .xlsx (un onglet par rubrique : infos et profil, expériences, formations, compétences, langues avec liste déroulante des niveaux, certifications). Il se remplit dans Excel, LibreOffice Calc ou Google Sheets, puis se réimporte (.xlsx ou .ods) : chaque case va directement au bon endroit. Les lignes grises « Exemple » sont ignorées ; plusieurs missions s'écrivent sur plusieurs lignes de la cellule ou sur les lignes suivantes ; les dates converties par le tableur sont relues ; ce qui n'est pas compris va dans « À classer ». Le classeur est écrit et lu sans bibliothèque supplémentaire (un .xlsx est un zip de fichiers XML, lu avec JSZip).
  - Chaque texte (ou ligne du texte extrait) peut être envoyé vers une **sous-rubrique précise** : un champ des infos perso (nom, ville, date de naissance…), les missions, le poste ou les dates d'une expérience existante, l'école d'une formation, un groupe de compétences, ou une nouvelle entrée détectée automatiquement.

### Exports
- **PDF** : la fenêtre d'impression du navigateur produit un PDF vectoriel, au texte sélectionnable. Une aide rappelle les bons réglages : *Enregistrer au format PDF*, A4, marges « Aucune », graphiques d'arrière-plan cochés.
- **Word (.docx)** : document Word natif, sur une colonne.
  - Styles Titre / Titre 1 / Titre 2, vraies puces, dates alignées par tabulation, photo.
  - Les dimensions sont celles de l'aperçu, en points et en millimètres : un CV qui tient sur une page à l'écran tient aussi sur une page dans Word.
- **Nom de fichier automatique** : `CV_Prenom_Nom_Poste`, ou `Lettre_Prenom_Nom_Entreprise` pour une lettre.

### Analyseur & Score ATS (critères APEC)
Collez l'offre : le CV est noté sur 100 et le score se met à jour en direct.

| Critère | Points | Ce qui est vérifié |
|---|---|---|
| Adéquation du titre | 20 | Intitulé exact (20), synonyme français / anglais (15), correspondance partielle (10 à 15), absent (0) |
| Mots-clés & compétences | 40 | Termes de l'offre présents dans le CV, en français, en anglais ou en acronyme. Les mots-clés **exigés** comptent double, ceux qui sont « un plus » comptent moins. Ils pèsent davantage dans l'accroche et les Compétences. |
| Expériences & impact | 25 | Mots-clés prouvés dans les expériences, verbe d'action en début de puce (français et anglais), résultats chiffrés (€, k€, M€, %, délais, volumes) |
| Conformité ATS | 15 | Pas d'émoji ni de symbole décoratif, intitulés de sections standards, coordonnées complètes, une seule page, une seule colonne |

- **Normalisation** : accents, majuscules et pluriels sont ignorés. Les termes techniques restent intacts (M&A, P&L, C++, S/4HANA).
- **Dictionnaire bilingue** : environ 470 notions (dont une centaine de certifications) couvrant tous les secteurs ci-dessus, et près de 80 familles d'intitulés de postes (formes masculine, féminine et anglaise). Une offre en anglais (« financial modeling ») valide donc un CV en français (« modélisation financière »).
- **Langue de l'offre** détectée automatiquement.
- **Exigé ou apprécié** : déduit de la phrase (« required », « maîtrise de », « un plus », « nice to have »…) et des intertitres de l'offre (« Profil recherché », « Requirements », « Atouts »…).
- **Restitution** :
  - jauge et détail par critère ;
  - mots-clés trouvés (et via quel synonyme), présents seulement dans les expériences, ou manquants ;
  - surlignage sur la feuille A4 ;
  - conseils classés par priorité.
- **Actions** :
  - ajout des mots-clés manquants au CV ou à une copie adaptée à l'offre ;
  - **Copier le prompt d'audit IA** (CV + offre + grille APEC + score) pour ChatGPT ou Claude ;
  - enregistrement de la candidature dans le suivi.
- **Mes équivalences** : ajoutez vos propres synonymes depuis l'analyseur (par exemple « Kelio = logiciel de gestion des temps »). Ils sont sauvegardés avec vos données.

### Booster votre candidature (certifications et leviers)
Une carte dans l'analyseur et dans l'onglet Certifications de l'éditeur :
- **Métier détecté** dans l'offre, ou dans le CV sans offre. Une liste déroulante permet d’en cocher **plusieurs à la fois** (une rubrique par métier, les certifications communes comme le SST n’apparaissant qu’une fois) parmi : cybersécurité, réseaux & systèmes, support, cloud & DevOps, développement, data & BI, gestion de projet, finance & audit, RH / paie / SIRH, commerce, marketing & communication, achats & supply chain, industrie & qualité, BTP, santé & social, juridique, assistanat, hôtellerie & tourisme, enseignement & formation, plus un onglet « pour tous les profils » (TOEIC, TOSA, Pix, Voltaire).
- **Certifications recommandées** : organisme, niveau (débutant, intermédiaire, expérimenté), mention « gratuit » (SecNumacadémie, NetAcad, MOOC CNIL…), et repères « Sur votre CV » ou « Citée dans l'offre ».
- **Bouton + En cours** : ajoute la certification au CV avec la mention « En cours ».
- **Profil junior** (moins de 3 ans d'expérience) : les certifications pour profils expérimentés (CISSP, OSCP, PMP…) sont repliées.
- **Autres leviers par métier** : home lab, CTF, portfolio GitHub, chiffres à mettre en avant, veille…
- **Lien avec le score ATS** : les certifications sont aussi des mots-clés. Une certification exigée par l'offre et absente du CV déclenche un conseil prioritaire.
- **Pour enrichir** : complétez [`src/data/certifications.ts`](src/data/certifications.ts) (finance, RH, informatique) ou [`src/data/parcoursSecteurs.ts`](src/data/parcoursSecteurs.ts) (autres secteurs), où chaque certification a un nom, un organisme, un niveau, une note et ses façons de l'écrire (`termes`).

### Lettre de motivation
- Reprend l'en-tête (nom, titre, coordonnées), la police, la couleur et le modèle du CV relié.
- Mise en page française :
  - destinataire en haut à droite ;
  - lieu et date automatiques (« Paris, le 18 novembre 2026 ») ;
  - objet ;
  - formules d'appel et de politesse.
  - Tout passe en anglais si le CV est en anglais.
- **Préremplir un brouillon** : un plan vous / moi / nous, rempli avec le CV. Les passages entre [crochets] sont signalés tant qu'ils ne sont pas remplacés.
- Vérifications avant l'envoi : entreprise citée, longueur de 200 à 350 mots, une page.
- Export PDF et Word.

### Suivi des candidatures
- **Colonnes** : entreprise, lien de l'offre, poste, date d'envoi, version du CV, lettre, score ATS, statut (envoyée, relancée, entretien, refus, offre) et notes.
- **Tri et filtres** : tri par colonne, filtres par statut, recherche libre.
- **Vue d'ensemble** : compteurs par statut, taux de réponse, alerte « à relancer » après 10 jours sans réponse.

### Ordinateur, tablette et téléphone
- **Grand écran** : la saisie et l'aperçu A4 sont côte à côte.
- **Tablette en portrait et téléphone** : un bouton **Modifier / Aperçu A4** bascule de l'un à l'autre, et la feuille s'adapte à la largeur de l'écran.
- **Téléphone** : la navigation passe dans une barre d'onglets en bas de l'écran. Le glisser-déposer et le recadrage de la photo fonctionnent au doigt.

### Raccourcis clavier
| Raccourci | Action |
|---|---|
| **Ctrl+S** (Cmd+S sur Mac) | Télécharge la sauvegarde JSON complète (CV, lettres, candidatures, équivalences) |
| **Ctrl+P** (Cmd+P) | Export PDF du CV, ou de la lettre sur la page Lettre de motivation |
| **Ctrl+Z** | Annuler |
| **Ctrl+Y** ou **Ctrl+Maj+Z** | Rétablir |

---

## Enrichir le dictionnaire de synonymes

Le dictionnaire est dans [`src/data/synonymes.ts`](src/data/synonymes.ts) (finance, RH, informatique) et [`src/data/secteurs.ts`](src/data/secteurs.ts) (autres secteurs, savoir-être et outils communs). Chaque groupe réunit toutes les façons d'écrire **la même notion**, en français, en anglais et en acronyme :

```ts
{ libelle: 'Paie', categorie: 'Domaine', termes: ['paie', 'payroll'] },
```

- **Ajouter un synonyme** : ajoutez-le dans `termes` du groupe existant, par exemple `'gestion de la paie'`.
- **Ajouter une notion** : ajoutez un groupe. `libelle` est le nom affiché. `categorie` vaut `'Domaine'`, `'Technique'`, `'Outil'`, `'Certification'`, `'Langue'` ou `'Savoir-être'` : la catégorie `'Outil'` déclenche le conseil « indiquez votre niveau ».
- **Ajouter un intitulé de poste** (critère « titre », 20 points) : complétez `INTITULES_POSTES` (en bas de `synonymes.ts`) ou `INTITULES_SECTEURS` (dans `secteurs.ts`). Mettez-y les formes masculine, féminine et anglaise.
- **Règles d'écriture** :
  - inutile d'écrire les accents, les majuscules ou les pluriels, ils sont ignorés ;
  - les termes de plusieurs mots sont cherchés dans l'ordre (« audit interne ») ;
  - évitez les termes trop courts ou ambigus (un acronyme de 2 lettres peut apparaître par hasard).
- **Mots à double sens** : évitez-les aussi. Par exemple « exchange » (marchés financiers), « sauvegarde » (« plan de sauvegarde de l'emploi »), « procédures », « https » (présent dans les liens du CV) : écrivez plutôt l'expression complète (« microsoft exchange », « sauvegarde des données »). De même, « formation », « qualité », « stock », « transport », « restauration » ou « closing » ne sont jamais utilisés seuls.
- **Signe collé** : un terme avec un signe s'écrit sans espace (« security+ », « c++ »). Sinon, il se réduit au mot seul.
- **Vérifier** : lancez `npm test` (un test refuse les termes en double entre deux groupes et les sigles de 2 lettres dans `secteurs.ts`), puis testez une offre dans l'analyseur.

Sans toucher au code, chacun peut aussi ajouter ses équivalences dans l'analyseur (**Mes équivalences**).

---

## Développement
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests vitest
npm run typecheck  # vérification TypeScript
npm run build      # build de production dans dist/
npm run preview    # sert le build localement
```

## Déploiement sur GitHub Pages
1. Poussez le projet sur la branche `main` d'un dépôt GitHub.
2. Dans *Settings → Pages → Build and deployment → Source*, choisissez **GitHub Actions**.
3. Le workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) construit le site avec `VITE_BASE=/<nom-du-dépôt>/`. Il le publie sur `https://<utilisateur>.github.io/<nom-du-dépôt>/` à chaque push.

Sans le workflow, `npm run build` produit un dossier `dist/` avec des chemins relatifs (`base: './'`), utilisable dans n'importe quel sous-dossier. Les adresses en `#/…` (HashRouter) évitent les erreurs 404 de GitHub Pages.

## Structure
```
src/
  types/            structures de données : CV, style, lettre, candidature, sauvegarde
  store/            état global zustand, annuler / rétablir, sauvegarde auto, migrations,
                    fenêtres de dialogue, zone d'impression
  data/             CV exemple, constantes, intitulés de sections FR/EN,
                    synonymes.ts + secteurs.ts (dictionnaire ATS),
                    certifications.ts + parcoursSecteurs.ts (recommandations),
                    mots vides, verbes d'action
  lib/              logique sans React
    ats/            normalisation, extraction des mots-clés, scoring APEC, conseils, prompt IA,
                    recommandations de certifications
    import/         lecture PDF (pdf.js), Word (mammoth) et LibreOffice .odt, découpage en sections, classement
    tableur/        tableau à remplir : écriture .xlsx, lecture .xlsx / .ods, correspondance avec le CV
    export/         PDF, Word (CV et lettre), JSON, noms de fichiers
    lettre.ts       lettre de motivation et suivi des candidatures
  components/       commun · feuille (A4) · editeur · style · gestionCV · import ·
                    analyseur · lettre · export
  pages/            PageEditeur, PageAnalyseur, PageLettre, PageCandidatures
                    (#/, #/analyseur, #/lettre/:id, #/candidatures)
  tests/            tests vitest, un fichier par étape + import
```

## Tests
```bash
npm test
```
- **Scoring ATS** (`etape5`, `etape7`) :
  - normalisation ;
  - équivalences français / anglais (financial modeling = modélisation financière, payroll = paie, HRIS = SIRH, pivot tables = TCD) ;
  - priorités exigé / apprécié ;
  - barème 20 / 40 / 25 / 15 ;
  - conseils et prompt IA.
- **Import** (`import`) : CV Canva sur une ou deux colonnes, dates, formations, photo.
- **Tableau et LibreOffice** (`tableur`) : classeur valide, aller-retour CV → tableau → CV, lignes « Exemple » ignorées, dates Excel / LibreOffice, missions sur plusieurs lignes, fichiers .xlsx (textes partagés) et .ods, document .odt (zones de texte, listes, tableaux).
- **Informatique** (`informatique`) :
  - offre réseau en anglais validée par un CV en français ;
  - SOC / SIEM / EDR ;
  - absence de faux positifs dans les offres finance et RH ;
  - détection du métier et recommandations de certifications.
- **Autres secteurs** (`secteurs`) :
  - une offre type par secteur (commerce, marketing, supply chain, qualité, BTP, santé, juridique, assistanat, hôtellerie, formation) : métier détecté et mots-clés reconnus ;
  - intitulés équivalents (« Sales representative » = « Commercial terrain ») ;
  - carte « Booster » (`booster`) : liste déroulante à choix multiples, sans doublon de certification ;
  - aucun terme en double ni ambigu, CV finance et informatique non reclassés, « œ » lu comme « oe ».
- **Le reste** : données et migrations (`etape1`), modèles (`etape2`), export Word (`etape4`), lettre et suivi (`etape6`), raccourcis clavier (`etape7`).

## Données
- **Enregistrement** : tout est enregistré dans le `localStorage` (clé `cvstudio.v3`), 500 ms après la dernière modification et à la fermeture de la page.
- **Migration** : les données des versions précédentes (`cvstudio.v2.*`) sont migrées automatiquement.
- **Sauvegarde complète** : **Ctrl+S**, ou « Mes CV › Sauvegarder mes données », télécharge un fichier JSON. « Restaurer » le réimporte à l'identique.
- **Précaution** : vider les données du site dans le navigateur efface tout. Gardez une sauvegarde JSON récente.
