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
