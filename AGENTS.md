# AGENTS.md — Règles pour les agents IA autonomes

Ce fichier s'adresse à **tout agent IA** (aider, Claude, Copilot, etc.) qui modifie ce dépôt sans supervision humaine directe.
Lis-le en entier avant d'éditer le moindre fichier. En cas de doute, **ne modifie rien**.

## 1. Ce qu'est le projet

**CV Studio** : application web de création de CV A4 compatibles ATS, avec analyseur de score ATS (critères APEC), lettre de motivation et suivi des candidatures.

- React 18 + Vite + TypeScript + Tailwind CSS, icônes `lucide-react`, état global `zustand` (`src/store/`).
- Hébergée en statique sur **GitHub Pages**, déployée automatiquement à chaque fusion sur `main`.
- Toutes les données de l'utilisatrice restent dans le `localStorage` de son navigateur.

## 2. Règles absolues (non négociables)

1. **100 % statique, compatible GitHub Pages.**
   - Aucun back-end, aucun serveur, aucune fonction serverless, aucune base de données distante.
   - Aucun appel réseau vers une API tierce depuis le front-end.
   - **Aucune clé API, aucun jeton, aucun secret** dans le code, les fichiers de config ou les commentaires.
2. **Une seule amélioration ciblée par exécution.** Un bug corrigé, OU une amélioration d'interface, OU une petite fonctionnalité. Pas de refonte, pas de renommage massif, pas de reformatage de fichiers que tu ne modifies pas pour ta tâche.
3. **`npm run build` doit passer sans erreur** avant que tu considères ta tâche terminée. `npm test` aussi.
4. **Ne jamais casser les données existantes.** Les CV sont sauvegardés dans le `localStorage`. Si tu modifies un type de `src/types/`, ajoute la migration correspondante dans `src/store/migrations.ts` pour que les anciennes données restent lisibles.
5. **Fichiers interdits** (toute modification sera annulée automatiquement) :
   - `.github/` (workflows, Dependabot), `AGENTS.md`
   - `package.json`, `package-lock.json` : **n'ajoute aucune dépendance**. Les mises à jour de paquets sont gérées par Dependabot.
   - `vite.config.ts` (le `base` path de GitHub Pages en dépend)
6. **Pas de suppression de fonctionnalité** existante, même si elle te semble inutile.

## 3. Conventions du code

- **Langue** : noms de variables, de fonctions, de composants et commentaires **en français**, comme le reste du projet (`PageEditeur`, `cvVierge`, `motsVides`…). Textes de l'interface en français.
- **Composants courts**, une responsabilité par fichier, rangés dans le dossier `src/components/<domaine>/` correspondant.
- **Styles** : classes Tailwind. Le CSS de la feuille A4 est dans `src/components/feuille/feuille.css` : ne change pas les dimensions A4 (210 × 297 mm).
- **Compatibilité ATS** des CV produits : une seule colonne, pas de tableau dans le CV, pas d'émoji, texte sélectionnable dans le PDF.
- **Données de référence** (synonymes FR/EN, verbes d'action, mots vides) : `src/data/`. Les enrichir est une bonne amélioration.
- **Règles du dictionnaire ATS** (`src/data/synonymes.ts`, `src/data/secteurs.ts`). Chaque terme est cherché comme un mot entier dans les offres et les CV : un terme ambigu crée de faux mots-clés.
  - **Pas de terme de 2 lettres** (« pm », « po », « ia », « it », « si »…) : ils apparaissent par hasard (« 5 pm », « PO approval »).
  - **Pas de mot courant à double sens**, ni français ni anglais : « make », « bubble », « crypto », « closing », « formation », « qualité », « stock », « transport », « restauration », « exchange »… Écris l'expression complète (« make.com », « gestion des stocks », « sauvegarde des données »).
  - **Pas de doublon** : avant d'ajouter un terme, cherche-le dans les deux fichiers (`grep -rin "terme" src/data/`). Un même terme ne doit appartenir qu'à un seul groupe.
  - **Les métiers vont dans les intitulés** (`INTITULES_POSTES` ou `INTITULES_SECTEURS`), avec les formes masculine, féminine et anglaise, jamais dans les compétences (`SYNONYMES`).
  - **Test** : les tests de `src/tests/secteurs.test.ts` refusent déjà les doublons et les sigles courts dans `secteurs.ts` ; ajoute un test qui vérifie qu'une offre **sans rapport** ne déclenche pas tes nouveaux mots-clés.
- **Tests** : `vitest`, dans `src/tests/`. Toute correction de bug ou nouvelle fonction de `src/lib/` doit être accompagnée d'un test.
- TypeScript strict : pas de `any`, pas de `@ts-ignore`.

## 4. Idées d'améliorations bienvenues

- Corriger un bug visible ou un cas limite (import PDF, dépassement de page, export Word).
- Enrichir `src/data/synonymes.ts` (termes finance, RH / paie / SIRH, informatique, en français et en anglais).
- Améliorer l'accessibilité (libellés `aria-*`, contraste, navigation au clavier).
- Améliorer les conseils de l'analyseur ATS (`src/lib/ats/recommandations.ts`).
- Ajouter des tests sur une partie peu couverte.

## 5. Avant de terminer

1. Relis ton diff : il ne doit concerner que ta tâche.
2. Vérifie que `npm run build` et `npm test` passent.
3. Résume en 3 à 5 phrases, en français : ce que tu as changé, pourquoi, et comment le vérifier dans l'interface.
