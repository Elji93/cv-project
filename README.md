# CV Studio

Application web pour créer des **CV d'une page A4, compatibles ATS**, pour la finance (audit, M&A, contrôle de gestion…), les métiers RH / paie / SIRH et l'informatique (cybersécurité, réseaux et systèmes, cloud, développement, data).
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
- **Photo** facultative : recadrage par glisser, zoom, forme carrée ou ronde.
- **Annuler / rétablir** (50 actions).
- **Import d'un CV existant** (PDF, y compris Canva, ou Word .docx) :
  - le texte est réparti dans les sections ;
  - les colonnes latérales sont reconnues ;
  - la photo est extraite.
  - Un écran de vérification permet ensuite de corriger le résultat, et ce qui n'a pas pu être classé reste disponible dans « À classer ».

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
- **Dictionnaire bilingue** : environ 230 notions (finance, RH / paie / SIRH, informatique, cybersécurité, réseaux, cloud, data) et 35 intitulés de postes. Une offre en anglais (« financial modeling ») valide donc un CV en français (« modélisation financière »).
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
- **Métier détecté** dans l'offre, ou dans le CV sans offre. Vous pouvez aussi en choisir un autre parmi : cybersécurité, réseaux & systèmes, support, cloud & DevOps, développement, data & BI, gestion de projet, finance & audit, RH / paie / SIRH, plus un onglet « pour tous les profils » (TOEIC, TOSA, Pix, Voltaire).
- **Certifications recommandées** : organisme, niveau (débutant, intermédiaire, expérimenté), mention « gratuit » (SecNumacadémie, NetAcad, MOOC CNIL…), et repères « Sur votre CV » ou « Citée dans l'offre ».
- **Bouton + En cours** : ajoute la certification au CV avec la mention « En cours ».
- **Profil junior** (moins de 3 ans d'expérience) : les certifications pour profils expérimentés (CISSP, OSCP, PMP…) sont repliées.
- **Autres leviers par métier** : home lab, CTF, portfolio GitHub, chiffres à mettre en avant, veille…
- **Lien avec le score ATS** : les certifications sont aussi des mots-clés. Une certification exigée par l'offre et absente du CV déclenche un conseil prioritaire.
- **Pour enrichir** : complétez [`src/data/certifications.ts`](src/data/certifications.ts), où chaque certification a un nom, un organisme, un niveau, une note et ses façons de l'écrire (`termes`).

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

Le dictionnaire est dans [`src/data/synonymes.ts`](src/data/synonymes.ts). Chaque groupe réunit toutes les façons d'écrire **la même notion**, en français, en anglais et en acronyme :

```ts
{ libelle: 'Paie', categorie: 'Domaine', termes: ['paie', 'payroll'] },
```

- **Ajouter un synonyme** : ajoutez-le dans `termes` du groupe existant, par exemple `'gestion de la paie'`.
- **Ajouter une notion** : ajoutez un groupe. `libelle` est le nom affiché. `categorie` vaut `'Domaine'`, `'Technique'`, `'Outil'`, `'Certification'`, `'Langue'` ou `'Savoir-être'` : la catégorie `'Outil'` déclenche le conseil « indiquez votre niveau ».
- **Ajouter un intitulé de poste** (critère « titre », 20 points) : complétez `INTITULES_POSTES`, en bas du même fichier. Mettez-y les formes masculine, féminine et anglaise.
- **Règles d'écriture** :
  - inutile d'écrire les accents, les majuscules ou les pluriels, ils sont ignorés ;
  - les termes de plusieurs mots sont cherchés dans l'ordre (« audit interne ») ;
  - évitez les termes trop courts ou ambigus (un acronyme de 2 lettres peut apparaître par hasard).
- **Mots à double sens** : évitez-les aussi. Par exemple « exchange » (marchés financiers), « sauvegarde » (« plan de sauvegarde de l'emploi »), « procédures », « https » (présent dans les liens du CV) : écrivez plutôt l'expression complète (« microsoft exchange », « sauvegarde des données »).
- **Signe collé** : un terme avec un signe s'écrit sans espace (« security+ », « c++ »). Sinon, il se réduit au mot seul.
- **Vérifier** : lancez `npm test`, puis testez une offre dans l'analyseur.

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
                    synonymes.ts (dictionnaire ATS), certifications.ts (recommandations),
                    mots vides, verbes d'action
  lib/              logique sans React
    ats/            normalisation, extraction des mots-clés, scoring APEC, conseils, prompt IA,
                    recommandations de certifications
    import/         lecture PDF (pdf.js) et Word (mammoth), découpage en sections, classement
    export/         PDF, Word (CV et lettre), JSON, noms de fichiers
    lettre.ts       lettre de motivation et suivi des candidatures
  components/       commun · feuille (A4) · editeur · style · gestionCV · import ·
                    analyseur · lettre · export
  pages/            PageEditeur, PageAnalyseur, PageLettre, PageCandidatures
                    (#/, #/analyseur, #/lettre/:id, #/candidatures)
  tests/            tests vitest, un fichier par étape + import
legacy-vanilla/     première version HTML/JS sans framework (archive)
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
- **Informatique** (`informatique`) :
  - offre réseau en anglais validée par un CV en français ;
  - SOC / SIEM / EDR ;
  - absence de faux positifs dans les offres finance et RH ;
  - détection du métier et recommandations de certifications.
- **Le reste** : données et migrations (`etape1`), modèles (`etape2`), export Word (`etape4`), lettre et suivi (`etape6`), raccourcis clavier (`etape7`).

## Données
- **Enregistrement** : tout est enregistré dans le `localStorage` (clé `cvstudio.v3`), 500 ms après la dernière modification et à la fermeture de la page.
- **Migration** : les données des versions précédentes (`cvstudio.v2.*`) sont migrées automatiquement.
- **Sauvegarde complète** : **Ctrl+S**, ou « Mes CV › Sauvegarder mes données », télécharge un fichier JSON. « Restaurer » le réimporte à l'identique.
- **Précaution** : vider les données du site dans le navigateur efface tout. Gardez une sauvegarde JSON récente.
