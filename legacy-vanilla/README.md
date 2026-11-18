# CV Studio

Créateur de CV finance **une page A4, compatibles ATS**, 100 % statique (GitHub Pages), sans compte ni serveur.

## Fonctionnalités

**Éditeur (`index.html`)**
- Plusieurs CV (créer, dupliquer pour adapter à une offre, renommer, supprimer) — sauvegarde automatique dans le navigateur.
- 3 façons de saisir :
  - **Carrousel de sections** (Infos perso, Profil, Expériences, Études, Activités, Compétences, Certifications, Langues, Intérêts) ;
  - **Édition directe sur la feuille** (cliquez sur le texte ; Entrée = nouvelle puce, Retour arrière sur puce vide = suppression) ;
  - **Import rapide** : collez un CV entier en texte (sections détectées automatiquement) ou un fichier JSON.
- Photo (recadrage carré automatique, ronde / arrondie / carrée, affichable ou non).
- Mise en forme : 4 modèles (Finance classique, Compact, Moderne, Élégant), couleur d'accent, police, taille, interligne, espacement, marges, ordre / titres / visibilité des sections.
- Indicateur « tient sur 1 page » + bouton **Ajuster sur 1 page**.
- Export **PDF** (impression navigateur → texte réel, lisible par les ATS) et **Word .docx** (document natif une colonne). Sauvegarde/restauration **JSON**.

**Comparateur (`match.html`)**
- Source : CV de CV Studio, fichier PDF / Word, ou texte collé.
- Score /100 : compétences métier finance (lexique FR/EN ~100 notions et synonymes), autres mots-clés fréquents de l'offre, intitulé de poste, savoir-être, formation, format ATS (sections standard, chiffres, verbes d'action, longueur, 1 page…).
- Mots-clés trouvés / manquants, vérifications ATS et conseils priorisés.
- Ajout en un clic des compétences manquantes au CV (ou à une copie adaptée à l'offre).

## Pourquoi c'est compatible ATS
Une seule colonne, aucun tableau ni zone de texte, titres de section standards, polices classiques, texte sélectionnable dans le PDF, ordre de lecture naturel, dates alignées par tabulation dans le .docx.

## Lancer en local
```bash
python3 -m http.server 8765
```
puis ouvrir http://localhost:8765

## Publier sur GitHub Pages
1. Créez un dépôt GitHub et poussez ces fichiers à la racine.
2. *Settings → Pages → Build and deployment* : Source « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Le site est disponible sur `https://<utilisateur>.github.io/<depot>/`.

## Structure
```
index.html        éditeur
match.html        comparateur CV / offre
css/app.css       interface
css/cv.css        feuille CV (modèles)
js/store.js       données & stockage local
js/render.js      rendu de la feuille
js/parser.js      import texte / JSON
js/export.js      export PDF / Word / JSON
js/editor.js      logique de l'éditeur
js/match.js       moteur de score et conseils
```
Bibliothèques (CDN) : docx 8.5.0 (export Word), pdf.js 3.11.174 et mammoth 1.6.0 (lecture des fichiers dans le comparateur).
