# Nestimate

Simulateur immobilier français — app statique (zéro build, zéro npm).
Lancer : `python3 -m http.server 3000` depuis la racine.

## Structure des fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Structure HTML uniquement, 7 pages (page-0 à page-6) |
| `css/styles.css` | Tout le CSS, variables CSS pour les thèmes |
| `js/utils.js` | Helpers DOM (G/num/pct/euro), état global, PFIELDS, TIPS |
| `js/calc.js` | Calculs purs (calcBudget, calcProject, calcRvb, calcTAEG, calcAmortData) |
| `js/amort.js` | Tableaux d'amortissement et graphes SVG |
| `js/ui.js` | Mise à jour DOM, navigation, validation, refreshXxx() |
| `js/main.js` | Event listeners, localStorage (save/load), thème, taux BCE, init |

Scripts chargés dans l'ordre : utils → calc → amort → ui → main.
Tout est global (pas de modules ES).

## État global (utils.js)

- `hasCo` — co-emprunteur actif
- `currentMode` — 'budget' | 'rvb'
- `currentPage` — index 0-6
- `_simApport` — override apport via le curseur (null = utiliser le champ)

## Pages (mode Budget)

| Index | ID HTML | Contenu |
|---|---|---|
| 0 | page-0 | Revenus |
| 1 | page-1 | Charges |
| 2 | page-2 | Financement |
| 3 | page-3 | Budget maximum + amortissement |
| 4 | page-4 | Tester un bien |
| 5 | page-5 | Comparer des biens (A/B/C) |
| 6 | page-6 | Bilan final |

Phase nav : phase 0 = pages 0-3, phase 1 = pages 4-6.

## Fonctions clés

```js
calcBudget()           // → { borrow, lm, insM, propMax, env, disp, ... }
calcProject(price, years, overrides={})  // overrides: { works, agencyFees }
calcRvb()              // → { netBuy, netRent, delta, ... } | null
calcTAEG()             // → { taeg, rateNom, insAnnual, feesAnnual } | null
calcAmortData()        // → amortissement sur le capital empruntable
calcAmortDataProject() // → amortissement sur le capital financé réel (utilise calcProject)
```

## Patterns importants

- `calcProject` accepte `overrides = {}` pour passer `works`/`agencyFees` sans toucher le DOM (utilisé par la comparaison).
- `refreshBudget()` met à jour pages 3 ET 4 simultanément.
- `refresh()` appelle refreshBudget + refreshAmortStats2 + refreshTAEG + refreshResults + refreshComparison (si page 5) + refreshFloatBar + save.
- Les tableaux d'amortissement et le tableau de comparaison sont entièrement rendus en JS via `innerHTML`.

## localStorage

Clé : `nestimate_v2`. Tous les champs listés dans `PFIELDS` (utils.js).

## Badges dossier

5 classes CSS : `badge-solide`, `badge-fincable`, `badge-limite`, `badge-fragile`, `badge-refuse`.
Logique dans `getDossierBadge(dr, rav)` (ui.js).

## Taux BCE

Fetch de l'API ECB dans `fetchRates()` (main.js), fallback statique si échec.
Les taux affichés (rate15/rate20/rate25) sont indicatifs, ne modifient pas le calcul.

## Feature à implémenter — Navigation par cartes (hub)

Objectif : remplacer la nav linéaire (Phase 1 / Phase 2) par une **page d'accueil hub** avec une carte par fonctionnalité. L'utilisateur choisit directement où aller.

### Cartes prévues (2 colonnes)

| Carte | Destination | Résumé affiché |
|---|---|---|
| 👤 Mon profil financier | pages 0-1 (Revenus + Charges) | Revenus nets totaux |
| 💰 Mon financement | pages 2-3 (Financement + Budget max) | Budget max calculé |
| 🏠 Tester un bien | page 4 | Prix + taux endettement |
| 📊 Comparer des biens | page 5 | Nombre de biens saisis |
| 📋 Mon bilan final | page 6 | — |
| ⚖️ Louer ou acheter ? | mode RvB | — |

### Comportement
- La home est le landing par défaut (plus de redirection goTo(4) au chargement)
- Chaque section a un bouton "← Accueil" pour revenir au hub
- Les onglets mode (Budget / RvB) disparaissent — "Louer ou acheter ?" devient une carte
- Fin de section (ex: page 1 Suivant, page 3 Suivant) → retour à la home
- Les cartes affichent les métriques clés en live (`refreshHome()`)

### Piège à éviter
La tentative précédente a cassé l'app car `setMode()` référençait `tabBudget`/`tabRvb` supprimés.
Bien tester sur localhost avant tout déploiement. Créer une branche git dédiée.

---

## Audit UX — Bugs et améliorations identifiés

Analyse réalisée en simulant le parcours d'un primo-accédant (CDI, conjoint, 20k€ apport, cible 280k€ en IDF).

### Bugs réels (priorité haute)

**1. `rentPct` valeur par défaut incohérente**
- `DEFAULT_VALUES.rentPct = 0` (`utils.js`) mais le hint affiche "90% par défaut"
- Un utilisateur avec revenus locatifs qui ne touche pas ce champ a un taux retenu de 0% — ses revenus sont ignorés en silence
- **Fix :** mettre `rentPct: 90` dans `DEFAULT_VALUES`

**2. Frais de garantie calculés sur le mauvais capital dans `calcProject`**
- `calc.js:83` : `const guarantee = b.borrow * pct('guaranteeRate')` utilise `b.borrow` (budget max) au lieu de `financed` (capital réellement emprunté pour ce bien)
- Surestimation des frais quand le bien est moins cher que le budget max
- **Fix :** remplacer par `const guarantee = financed * pct('guaranteeRate')` (mais `financed` n'est pas encore calculé à ce stade — réorganiser le calcul)

**3. Seuil reste à vivre incohérent entre page 4 et page 6**
- Page 4 (`ui.js:451`) : `d.remaining >= ravFloor()` (plancher dynamique foyer)
- Page 6 (`ui.js:553`) : `d.remaining >= 1000` (hardcodé)
- Pour 2 adultes + 1 enfant (plancher = 2000€), le même bien peut être "soutenable" page 6 et "fragile" page 4
- **Fix :** remplacer `1000` par `ravFloor()` dans `refreshResults()` (ui.js)

**4. `brokerPct` absent de `DEFAULT_VALUES`**
- Présent dans `PFIELDS` mais pas dans `DEFAULT_VALUES` (`utils.js:29-38`)
- `resetAll()` le force à `1` (`ui.js:83`) mais au chargement initial il vaut `0`
- Courtier coché avec 0% déclenche quand même le minimum de 1500€ silencieusement
- **Fix :** ajouter `brokerPct: 1` dans `DEFAULT_VALUES`

**5. TAEG non recalculé pour le bien testé**
- Le TAEG affiché pages 3 et 6 est calculé sur `b.borrow` (budget max), jamais sur le capital réel du bien testé
- **Fix :** calculer et afficher un TAEG spécifique au bien testé sur la page 4, basé sur `financed`

### Problèmes UX majeurs

**6. Tous les champs financiers démarrent à zéro**
- `notaryRate = 0`, `guaranteeRate = 0`, `insuranceRate = 0`, `quotite1 = 0`
- Le "Prix maximum du bien visable" affiché en page 3 est irréaliste (= apport + emprunt brut sans aucune déduction)
- Un primo-accédant croit pouvoir s'offrir bien plus que la réalité
- **Fix :** pré-remplir avec valeurs typiques : `notaryRate: 7.5`, `guaranteeRate: 1`, `insuranceRate: 0.36`, `quotite1: 100`

**7. Co-emprunteur activé mais `nbAdults` reste à 1**
- Activer "Ajouter un co-emprunteur" (page 0) ne met pas à jour `nbAdults` (page 1)
- Le plancher de reste à vivre est calculé pour 1 adulte (800€) au lieu de 2 (1600€)
- **Fix :** dans `setCo(true)`, si `nbAdults === 1`, passer à `2` automatiquement

**8. Le bouton "Recommencer" sans confirmation**
- `resetAll()` s'exécute immédiatement au clic (`ui.js:79`), perte totale irréversible
- **Fix :** ajouter une modale de confirmation avant `resetAll()`

**9. Mode RvB inutilisable avec valeurs par défaut**
- `appRate = 0`, `savRate = 0`, `rentRef = 0`, `rentInfl = 0`, `sellAgRate = 0`
- Résultat biaisé : favorise toujours l'achat (épargne à 0%, pas de loyer de référence)
- **Fix :** pré-remplir `appRate: 1.5`, `savRate: 3`, `rentInfl: 2`, `sellAgRate: 4`

**10. Atterrissage sur page 4 si données existantes**
- `main.js:344` : `if (_hasData) goTo(4)` — déstabilisant, aucun rappel du profil chargé
- **Fix :** atterrir sur la home hub (quand implémentée) ou sur la page 3 avec un toast "Profil chargé"

### Incohérences de contenu

| Endroit | Affiché | Réel |
|---|---|---|
| Page 0, hint `rentPct` | "90% par défaut" | DEFAULT = 0 |
| Page 5, message état initial | "depuis votre étape 5" | L'utilisateur est à "étape 6/6" |
| Comparaison (page 5) | Frais agence ignorés | `calcProject(..., { agencyFees: 0 })` toujours |
| RvB — champ `rvbPrice` | "Laisser à 0 pour utiliser l'étape 5" | Reprend `propPrice` (page 4), pas "étape 5" |

### Améliorations souhaitables (priorité basse)

- **PTZ** : ajouter un champ "Capital PTZ" déduit du montant à emprunter — fonctionnalité clé pour les primo-accédants
- **Résumé profil en pages 4-6** : encart collapsible rappelant revenus nets + apport + taux, pour ne pas perdre le contexte
- **Frais notaire par bien dans la comparaison** : un switch neuf/ancien par bien (2.5% vs 7.5%) plutôt qu'un taux global
- **Calculateur inversé repositionné** : actuellement au-dessus des résultats en page 3 — à déplacer après les métriques principales
- **Export / partage** : URL avec paramètres encodés pour partager une simulation
- **Barre flottante** : affiche les valeurs de `propPrice` à la volée mais pas cohérentes avec le curseur apport simulé (`_simApport`)
