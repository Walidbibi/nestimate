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

**1. ~~`rentPct` valeur par défaut incohérente~~** ✅ résolu — `DEFAULT_VALUES.rentPct = 90`

**2. ~~Frais de garantie calculés sur le mauvais capital~~** ✅ résolu — résolution algébrique dans `calcProject` et `calcRvb` (`guarantee = financed * gr`)

**3. ~~Seuil reste à vivre incohérent entre page 4 et page 6~~** ✅ résolu — `ravFloor()` utilisé partout dans `refreshResults()`

**4. ~~`brokerPct` absent de `DEFAULT_VALUES`~~** ✅ résolu — `brokerPct: 1` ajouté dans `DEFAULT_VALUES`

**5. ~~TAEG non recalculé pour le bien testé~~** ✅ résolu — `calcTAEGProject()` affiché en page 4 (`taegVal3`)

### Problèmes UX majeurs

**6. ~~Tous les champs financiers démarrent à zéro~~** ✅ résolu — valeurs typiques pré-remplies (`notaryRate: 8`, `guaranteeRate: 1`, `insuranceRate: 0.36`, `quotite1: 100`)

**7. ~~Co-emprunteur activé mais `nbAdults` reste à 1~~** ✅ résolu — `setCo(true)` auto-incrémente `nbAdults` à 2

**8. ~~Le bouton "Recommencer" sans confirmation~~** ✅ résolu — bouton supprimé

**9. ~~Mode RvB inutilisable avec valeurs par défaut~~** ✅ résolu — `appRate: 1.5`, `savRate: 3`, `rentInfl: 2`, `sellAgRate: 4` dans `DEFAULT_VALUES`

**10. ~~Atterrissage sur page 4 si données existantes~~** ✅ résolu — `goTo(4)` supprimé, l'app atterrit sur la home

### Incohérences de contenu

| Endroit | Affiché | Réel |
|---|---|---|
| ~~Page 0, hint `rentPct`~~ | ~~"90% par défaut"~~ | ~~DEFAULT = 0~~ ✅ résolu |
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

---

## Feature à implémenter — Mode débutant / expert

### Contexte

L'app souffre d'un écart entre son audience cible (particuliers lambda, primo-accédants) et la complexité de son interface (TAEG, quotité, garantie bancaire, HCSF...). Solution : un seul toggle "Mode expert" dans le header, pas deux interfaces séparées (trop coûteux à maintenir).

### Principe

Un boolean `expertMode` (sauvegardé en localStorage) qui contrôle l'affichage. **Un seul codebase, un seul localStorage.**

**Mode débutant (défaut) :**
- Les champs techniques sont préremplis avec des valeurs réalistes et regroupés dans un bloc collapsible "Paramètres avancés"
- Labels en langage courant ("Vos mensualités de crédit auto/conso" au lieu de "Crédits en cours")
- Tooltips plus présents et pédagogiques
- Bouton "Utiliser des valeurs typiques" dans le mode RvB qui prérempli tous les champs

**Mode expert (toggle dans le header) :**
- Les blocs "Paramètres avancés" s'ouvrent tous par défaut
- Labels techniques conservés (quotité, TAEG, HCSF...)
- Accès direct à tous les champs sans friction

### Valeurs préremplies en mode débutant

À injecter dans `DEFAULT_VALUES` (`utils.js`) :
```js
notaryRate: 7.5      // ancien — l'utilisateur peut changer si neuf
guaranteeRate: 1     // cautionnement type Crédit Logement
insuranceRate: 0.36  // taux moyen marché
quotite1: 100        // emprunteur seul = 100%
brokerPct: 1         // si courtier activé
rentPct: 90          // taux retenu standard banques
// RvB
appRate: 1.5
savRate: 3
rentInfl: 2
sellAgRate: 4
```

### Implémentation

- Ajouter un toggle `expertMode` dans le header (à côté du bouton thème)
- Ajouter la classe CSS `expert-mode` sur `<body>` quand actif
- Les blocs avancés ont la classe `advanced-block` : `display:none` par défaut, `display:block` en `.expert-mode`
- Les labels alternatifs utilisent `data-label-simple` / `data-label-expert` et sont swappés par JS
- Sauvegarder `expertMode` dans localStorage (clé séparée, pas dans le profil)

### Ce qu'on ne fait pas

- Pas deux pages ou deux flows séparés
- Pas de choix de niveau au premier lancement (trop de friction)
- Pas de masquage des résultats — seuls les champs de saisie avancés sont cachés

---

## Feature à implémenter — Simulation de revente

### Contexte

L'app cible des particuliers lambda, pas uniquement des primo-accédants. Un cas très fréquent : revendre son bien actuel pour financer un nouvel achat. Cette feature doit rester invisible pour ceux qui n'en ont pas besoin.

### Principe

Bloc collapsible **"🏠 J'ai un bien à revendre"** à insérer sur la page 2 (Financement), juste après le champ `apport`.

Quand ouvert, 3 champs :
- **Prix de vente estimé** (`salePrice`)
- **Capital restant dû** (`saleCapLeft`) — 0 si crédit remboursé
- **Frais d'agence à la revente (%)** (`saleAgRate`) — défaut : 4%

Calcul affiché en temps réel :
```
apport net revente = prix vente − capital restant dû − (prix vente × frais agence)
```

Ce montant **remplace automatiquement** la valeur du champ `apport` dans tous les calculs (`calcBudget`, `calcProject`, etc.) tant que le bloc est activé.

### Implémentation

- Ajouter `salePrice`, `saleCapLeft`, `saleAgRate` dans `PFIELDS` et `DEFAULT_VALUES` (`saleAgRate: 4`)
- Ajouter un boolean `useSaleProceeds` (checkbox/toggle) pour activer/désactiver le bloc
- Modifier `calcBudget()` : si `useSaleProceeds` actif, calculer `saleNet` et l'utiliser comme apport à la place de `num('apport')`
- Afficher `saleNet` calculé sous les 3 champs pour que l'utilisateur voie immédiatement son apport net

### Ce qu'on ne fait pas

- Pas de calcul de plus-value immobilière (trop complexe, cas trop variables)
- Pas de nouvelle page — juste un bloc collapsible
- L'utilisateur sans bien à revendre ne voit rien de différent
