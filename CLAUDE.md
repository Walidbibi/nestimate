# Nestimate

Simulateur immobilier français — app statique (zéro build, zéro npm).
Lancer : `python3 -m http.server 3000` depuis la racine.

---

## Audit — Gestion des crédits (branche `feature/credit`)

### Bugs (priorité haute)

**1. ~~Crash `c.lignes` undefined en mode simplifié~~** ✅ résolu
- `c.lignes.length > 1` → `(c.lignes || []).length > 1` dans `renderCreditList()`
- Risque si vieux localStorage sans migration correcte

**2. ~~Suppression crédit via `confirm()` natif~~** ✅ résolu
- Modal `deleteCreditModal` créée, même pattern que `deleteProfileModal`

**3. ~~Format date de fin incorrect en mode simplifié~~** ✅ résolu
- `c.simpleEndDate.split('-').reverse().join('/')` dans `renderCreditList()`

### Problème critique d'architecture

**4. ~~Les crédits n'alimentent pas le calcul budget~~** ✅ résolu
- `creditsMonthly()` (calc.js) : somme des `totM` de `_credits`, hors crédits soldés et hors crédit du bien revendu (`getSoldCreditId()`, main.js)
- `debtCharges()` : `creditsMonthly()` si au moins un crédit existe, sinon fallback sur le champ manuel `currentCredits`
- Page Charges : le champ manuel est masqué et remplacé par le total calculé (`refreshCreditsField()`, ui.js)
- `creditsRentIncome()` (calc.js) : `loyerPercu` des crédits locatifs ajoutés aux revenus × `rentPct` (méthode HCSF classique). Le loyer d'un crédit soldé reste compté, celui du bien revendu non. `rentIncome` = loyers des biens SANS crédit uniquement (hint en page 0)
- `rentPct` par défaut : 70 (pratique bancaire courante), et non plus 90

**7. ~~Revente à perte masquée~~** ✅ résolu
- `getSaleApport()` ne clampe plus `saleNet` à 0 : un produit net négatif est déduit de l'apport personnel, l'apport total peut être négatif
- Warning `#saleNegativeWarning` chiffré ; curseur apport (page 4) accepte un min négatif

### Points ouverts (identifiés après les fixes #4 et #7)

**8. Revente à perte = dossier probablement refusé, mais pas signalé** *(à faire)*
- Si `getSaleApport() < 0`, le budget est réduit mais le badge dossier ne bascule pas
- Réalité bancaire : le CRD doit être soldé à la vente (mainlevée) → la banque refusera vraisemblablement le nouveau prêt
- Piste : forcer `badge-refuse` (ou `badge-fragile` + message explicite) quand l'apport total est négatif

**9. Double comptage possible des loyers (données existantes)** *(à faire)*
- Un utilisateur qui avait recopié ses loyers dans `rentIncome` ET saisi `loyerPercu` sur ses crédits locatifs est compté deux fois
- Aujourd'hui seul le hint `#rentFromCredits` (page 0) le prévient
- Piste : détecter `rentIncome ≈ creditsRentIncome()` et afficher un warning — risque de faux positif

**10. Crédits globaux, non rattachés au profil** *(à décider)*
- `_credits` (clé `nestimate_credits`) est partagé par tous les profils, alors que les champs du profil sont par profil
- OK si les profils = scénarios d'un même foyer ; faux si profils = foyers différents

**11. Revente non persistée** *(à faire)*
- `_saleOpen` / `saleBienId` ne sont pas sauvegardés : après reload, le bien revendu, son crédit et son loyer reviennent dans le calcul
- Cohérent avec l'apport (qui revient aussi au champ manuel), mais fragile

**12. Changement de comportement pour les anciennes données** *(info)*
- Dès qu'un crédit existe dans "Mes Crédits", le champ manuel `currentCredits` est ignoré (source unique)
- Les profils existants gardent `rentPct = 90` (seul le défaut a changé à 70)
- Curseur apport (page 4) : pas de 1000 € → la position arrondit l'apport (préexistant, texte exact)

### UX manquante

**5. ~~Métriques incohérentes en mode simplifié~~** ✅ résolu
- Barre de progression masquée en mode simple
- "Déjà remboursé" et "Coût total" remplacés par "Taux nominal" + "Intérêts restants"
- CRD se recalcule automatiquement chaque mois depuis `simpleRefDate` (date de saisie)
- `simpleRefDate` auto-set au save, conservé si CRD inchangé à la modification

**6. ~~Pas de warning avant switch mode Simplifié ↔ Avancé~~** ✅ résolu
- Modal de confirmation avec "Annuler" / "Changer et effacer"
- Si formulaire vide → switch sans friction
- Assurance mensuelle partagée entre les deux modes (intentionnel)

---

## V2 — Agents projet (`.claude/agents/`)

Le site actuel est un **POC**. La V2 ajoute des comptes utilisateurs et la persistance des données en base (stack à choisir).

**Pourquoi la V2 (décision porteur, 25/11/2026)** :
1. **Multi-appareils** : retrouver ses données (profils, crédits, biens) sur tous ses appareils sans tout retaper
2. **Ouvert à l'entourage** : des connaissances utilisent l'app pour LEUR propre projet, chacun avec son compte et ses données. **Pas de partage de données entre utilisateurs** (ni simulation partagée, ni projet commun)
3. **Pas de commercialisation** à date → coût d'hébergement ~0, pas de paiement, pas de mise en relation banque/courtier

Hors périmètre tant que ces objectifs ne changent pas : monétisation, analytics poussés, back-office.

| Agent | Rôle |
|---|---|
| `po` | Product Owner : cadrage, user stories, priorisation, RGPD et réglementaire. Specs dans `docs/v2/` |
| `ux-ui` | Parcours, wireframes, audit (Playwright), glossaire, accessibilité. Livrables dans `docs/v2/ux/` |
| `persona-primo` | Primo-accédant novice, sans jargon. Seul, couple, concubins ou amis |
| `persona-proprietaire` | Déjà propriétaire, averti. Seul, couple, famille recomposée ou SCI |

Les personas sont des **simulations** : elles génèrent des hypothèses, pas une validation utilisateur.

---

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

**1. ~~`rentPct` valeur par défaut incohérente~~** ✅ résolu — `DEFAULT_VALUES.rentPct = 70` (corrigé de 90 → 70)

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
rentPct: 70          // taux retenu standard banques (parfois 80)
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

### Condition d'affichage

Le bloc n'apparaît que si `_biens.length > 0`. Invisible sinon.

### Principe (V1)

Bloc collapsible **"🏠 J'ai un bien à revendre"** sur la page 2 (Financement), juste après le champ `apport`.

**Sélection du bien** : dropdown avec les biens enregistrés (nom saisi manuellement). Un seul bien sélectionnable.

**Champs (lecture seule sauf frais agence) :**
- **Prix de vente estimé** ← valeur actuelle estimée du bien sélectionné — lecture seule
- **Capital restant dû** ← capital restant du crédit lié au bien — lecture seule
  - Si aucun crédit lié : capital = 0 + warning ⚠ "Aucun crédit lié à ce bien — vérifiez que vous n'en avez pas oublié un"
- **Frais d'agence revente (%)** — défaut 4%, éditable, appliqué sur le prix de vente
- **Apport personnel** — le champ `apport` existant, conservé et additionné

**Calcul live (lecture seule) :**
```
Apport net revente  = Prix vente − Capital restant dû − (Prix vente × frais agence %)
Apport total        = Apport net revente + Apport personnel
```
`Apport total` remplace `num('apport')` dans `calcBudget` / `calcProject` tant que le bloc est actif.

**Si apport net revente < 0** : warning rouge visible, valeur négative impactée sur le bilan final.

**Désactivation** : retour au champ `apport` normal (= 0), sélection perdue.

### Étapes d'implémentation

**Étape 1 — Structure des données** ✅
- `_biens[i]` : `{ id, name, price, currentValue, creditId }` — `currentValue` peut être `null` → fallback sur `price` + message "veuillez renseigner la valeur actuelle"
- Liaison bien↔crédit : `_credits.find(c => c.id === bien.creditId)` → `computeCredit(credit).crd`

**Étape 2 — Ajouter `saleAgRate` dans `PFIELDS` et `DEFAULT_VALUES`** ✅
- `saleAgRate: 4` dans `DEFAULT_VALUES`
- Ajouté dans `PFIELDS` (champ de saisie DOM)

**Étape 3 — Créer le bloc HTML collapsible** ✅
- Bloc `#saleBlock` sur page-2 après le champ `apport`, CSS `.sale-block` / `.sale-toggle` / `.sale-readonly` / `.sale-result`

**Étape 4 — Logique d'affichage conditionnel** ✅
- `refreshSaleBlock()` : visible si `_biens.length > 0`, appelé dans `refresh()`
- `toggleSaleBlock()` : ouvre/ferme, populate le select

**Étape 5 — Lecture auto des données bien/crédit** ✅
- `_refreshSaleData()` : lit `bien.currentValue` (fallback `price`), CRD via `computeCredit(credit).crd`
- Warning si aucun crédit lié

**Étape 6 — Calcul `apportTotal` en lecture seule** ✅
- `saleNet = salePrice − crd − agFees`, `apportTotal = max(saleNet,0) + num('apport')`
- Affiché dans `#saleNetDisplay` / `#saleTotalDisplay`

**Étape 7 — Injecter dans `calcBudget` et `calcProject`** ✅
- `getSaleApport()` retourne l'apport total quand le bloc est actif
- `calcBudget()` : priorité `_simApport` > `getSaleApport()` > `num('apport')`
- Ligne "Apport total (revente + personnel)" dans le bilan (page 6), visible seulement si actif
- Curseur simulation apport (page 4) initialisé sur l'apport effectif

**Étape 8 — Warning apport négatif + bilan final** ✅
- `#saleNegativeWarning` affiché si `saleNet < 0`
- `#resSaleApportLine` dans le bilan affiche `b.apport` quand revente active

### Champ à ne pas confondre
- Ajouter un boolean état JS `useSaleProceeds` + `selectedSaleBienIdx` (non persistés dans le profil)
- Modifier `calcBudget()` et `calcProject()` : si `useSaleProceeds` actif, utiliser `apportTotal` calculé
- Lire `prix vente` depuis `_biens[selectedSaleBienIdx].valeurActuelle` (ou champ équivalent)
- Lire `capital restant dû` depuis le crédit lié (`_credits` filtré par `bienIdx`)

### Ce qu'on ne fait pas (V1)

- Pas de calcul de plus-value immobilière
- Pas de sélection multi-biens (V2)
- Pas de "cash à conserver" — l'utilisateur qui veut garder du cash ajuste son apport personnel (V2)

### Améliorations futures (V2)

- **Cash à conserver** : champ "Réserve de trésorerie (€)" = produit net − cash conservé = montant injecté
- **Multi-biens** : sélectionner plusieurs biens à revendre, cumul des apports nets
