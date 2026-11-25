# Identité visuelle Nestimate : « Le nid »

> Auteur : agent ux-ui. Date : 2026-11-25. Statut : **proposition** à valider par le porteur. Les choix de ton et de typographie méritent un test rapide (5 minutes avec 3 à 5 personnes : « à quoi ça vous fait penser ? », « vous lui confieriez vos revenus ? »).
> Fichiers : `design-system.css` (tokens et composants), `maquettes/composants.html` (rendu clair et sombre), `fonts/` (polices auto-hébergées).

## 1. Positionnement et ton

**Nestimate = nest + estimate.** Le nom contient déjà l'idée : un nid, c'est-à-dire un endroit à soi, construit pas à pas, et une estimation honnête.

**Positionnement** : *l'ami qui s'y connaît en crédit immobilier*. Ni une banque (froide, prudente, qui vend), ni une fintech (flashy, qui promet). Quelqu'un qui pose les chiffres sur la table, explique sans jargon et dit franchement quand ça ne passe pas.

**Ton éditorial**

| On fait | On évite |
|---|---|
| Phrases courtes, chiffres d'abord : « Vous paieriez 1 528 € par mois. » | « Votre capacité de remboursement mensuelle s'établit à… » |
| Le mot courant d'abord, le terme technique ensuite : « Part de vos revenus pour le crédit (taux d'endettement) » | « Taux d'endettement HCSF » sans explication |
| Dire franchement : « Une banque refusera très probablement ce prêt. » | Adoucir : « Votre dossier mérite d'être optimisé » |
| Toujours une suite : « Ce que vous pouvez faire » | Un verdict sans issue |
| Le vouvoiement, chaleureux et sobre | Les points d'exclamation, « Félicitations ! », les emojis |
| « Résultats indicatifs : seule une banque peut accorder un prêt. » (une fois, en pied de page) | Des avertissements juridiques sur chaque écran |

## 2. Principes visuels

1. **Un chiffre clé par écran**, en grand. Le reste est au service de ce chiffre.
2. **La couleur ne porte jamais seule une information** : un statut a toujours un mot, une icône de forme propre et, pour le dossier, une jauge à 4 crans.
3. **Les montants sont neutres.** Un coût n'est ni vert ni rouge. Seuls les statuts sont colorés.
4. **Chaleur dans la matière, sobriété dans la forme** : fond lin, titres à empattements doux, mais une mise en page aérée et rigoureuse.
5. **Mobile d'abord** : tout est dessiné à 390 px, puis élargi.

## 3. Palette

Trois couleurs de marque : **Sapin** (confiance, stabilité, sans le bleu bancaire), **Tuile** (le toit, la chaleur, l'accent ponctuel) et **Lin** (le fond, papier chaud plutôt que blanc clinique). La Tuile ne sert **jamais** à un statut, pour ne pas être confondue avec une alerte.

Ratios de contraste calculés selon la formule WCAG 2.1 (luminance relative). Seuils AA : 4,5:1 pour le texte, 3:1 pour les composants d'interface et le texte de grande taille.

### Thème clair (défaut)

| Token | Valeur | Usage | Contraste vérifié |
|---|---|---|---|
| `--c-bg` | `#F7F3EC` Lin | Fond de page | — |
| `--c-surface` | `#FFFDF9` | Cartes, champs | — |
| `--c-surface-2` | `#F0EADF` | Zones en retrait | — |
| `--c-text` | `#1D2420` Encre | Texte | 15,59 sur surface · 14,32 sur fond |
| `--c-text-muted` | `#575E59` | Texte secondaire | 6,56 sur surface · 5,57 sur surface-2 · 5,60 sur primary-soft |
| `--c-border` | `#DCD3C4` | Séparateurs décoratifs seulement | (non porteur d'information) |
| `--c-border-strong` | `#857B6C` | Contour des champs et des choix | 4,10 sur surface (≥ 3:1) |
| `--c-primary` | `#1D5C51` Sapin | Boutons principaux, liens, focus | 7,65 sur surface · 7,03 sur fond · 6,53 sur primary-soft |
| `--c-on-primary` | `#FFFFFF` | Texte sur bouton principal | 7,77 |
| `--c-primary-soft` | `#E2EEE9` | Fonds d'icône, survol | — |
| `--c-accent` | `#A9472A` Tuile | Logo, mise en avant ponctuelle | 5,71 sur surface · 4,76 sur accent-soft |
| `--c-success` / `-soft` | `#2C6A35` / `#E3F0E1` | Dossier solide, réussite | 5,53 |
| `--c-info` / `-soft` | `#255A88` / `#E2ECF6` | Dossier finançable, information | 6,06 |
| `--c-warning` / `-soft` | `#7F5300` / `#FAEDCF` | Dossier limite, attention | 5,76 |
| `--c-fragile` / `-soft` | `#9A3F12` / `#FBE5D6` | Dossier fragile | 5,59 |
| `--c-danger` / `-soft` | `#A3241C` / `#FBE3E0` | Refus probable, erreur | 6,07 · blanc sur danger : 7,43 |
| `--c-focus` | = primary | Anneau de focus 3 px | 7,03 sur fond |

### Thème sombre

| Token | Valeur | Contraste vérifié |
|---|---|---|
| `--c-bg` / `--c-surface` / `--c-surface-2` | `#111614` / `#18201C` / `#212A25` | — |
| `--c-text` | `#ECEFEA` | 14,34 sur surface · 15,76 sur fond |
| `--c-text-muted` | `#A7B0AA` | 7,47 sur surface · 6,63 sur surface-2 |
| `--c-border-strong` | `#7F8A83` | 4,65 sur surface |
| `--c-primary` | `#80C8B5` (texte du bouton : `#0D211C`) | 8,59 sur surface · bouton 8,67 |
| `--c-accent` | `#EE9470` | 7,21 sur surface |
| `--c-success` | `#8BCF8F` sur `#1C3320` | 7,40 |
| `--c-info` | `#8FBCE8` sur `#1B2C3D` | 7,14 |
| `--c-warning` | `#E8BC5C` sur `#3A2D10` | 7,54 |
| `--c-fragile` | `#F2A06E` sur `#3D2414` | 6,87 |
| `--c-danger` | `#F59186` sur `#3F1D1A` | 6,62 (V1 : 1,84) |

Le thème sombre s'active par `prefers-color-scheme: dark` (sauf si `data-theme="light"`) ou par `data-theme="dark"` sur `<html>`. Le choix manuel reste une préférence de l'appareil (non synchronisée, conformément au backlog).

## 4. Typographie

Deux familles, **auto-hébergées** (licence SIL Open Font License, fichiers dans `fonts/`) : aucun appel à Google ou à un autre CDN, donc pas d'adresse IP transmise à un tiers et un rendu stable.

| Rôle | Famille | Pourquoi |
|---|---|---|
| Titres, nom de projet, logotype | **Fraunces** (variable, graisse 600, axe optique) | Empattements doux et ronds : chaleur, côté « carnet de maison », différencie nettement de l'esthétique bancaire ou fintech. Réservée aux titres : jamais pour les chiffres ni le texte courant. |
| Texte, interface, chiffres | **Figtree** (variable 300 à 900) | Sans empattement simple et amicale, très lisible sur petit écran, **chiffres tabulaires** (`tnum`) pour aligner les montants, zéro non barré. |

Écarté après essai : Atkinson Hyperlegible Next, conçue pour la basse vision. Son zéro barré (« 3Ø5 ØØØ € ») surprend sur des montants en euros. À reconsidérer si un test montre des confusions 1/l/I avec Figtree.

**Échelle** (rem, base 16 px) : 0,8125 (13 px, plancher absolu) · 0,875 · **1** (texte, champs) · 1,125 · 1,375 · 1,75 (titre de page) · 2,5 (chiffre clé, Figtree 800).
Interlignage 1,55 pour le texte et 1,2 pour les titres. Graisses : 400 et 700, plus 800 réservé au chiffre clé et aux verdicts. Pas de texte en capitales (sauf sigles).
Typographie française : espace fine insécable dans les milliers (« 305 000 € ») et insécable avant €, %, :, ?, ! (appliqué dans les maquettes).

## 5. Espacements, rayons, ombres

- **Espacements**, base 4 px : 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (`--sp-1` à `--sp-8`). Marges de page de 16 px sur mobile et 24 px au-delà de 720 px.
- **Rayons** : 6 px (tags), 10 px (champs, boutons, alertes), 16 px (cartes), pilule (puce de compte). Quatre valeurs contre douze en V1.
- **Ombres** : trois niveaux, teintées chaud (`rgba(60,45,20,…)`) : `--sh-1` pour les cartes au repos, `--sh-2` au survol, `--sh-3` pour les menus et les dialogues.
- **Cible tactile** : 44 px minimum (`--tap`) pour tout élément cliquable.
- **Largeur** : contenu limité à 1 040 px, texte long à 68 caractères.

## 6. Iconographie

- Icônes **SVG inline au trait**, grille de 24, trait de 1,75, extrémités arrondies, en `currentColor`. Le style est proche de Lucide (licence ISC) ; les tracés intégrés aux maquettes sont dessinés à la main et peuvent être remplacés par Lucide tel quel.
- **Aucun emoji** dans l'interface.
- Une icône = un sens, dans toute l'app : maison (accueil), personne (revenus), portefeuille (financement), maison et loupe (tester un bien), deux colonnes (comparer), cible (mensualité cible), balance (louer ou acheter), colonnes de banque (crédits), immeuble (biens), document (bilan).
- Icônes de statut **de formes différentes** : bouclier coché (solide), cercle coché (finançable), cercle « ! » (limite), triangle « ! » (fragile), octogone « × » (refus).
- Les icônes décoratives ont `aria-hidden="true"`. Les boutons qui n'ont qu'une icône ont un `aria-label`.

## 7. Logo et monogramme

Un toit (le chevron) au-dessus d'un nid (l'arc) qui abrite un œuf couleur tuile. Lisible à 16 px, sans texte.

```html
<svg viewBox="0 0 40 40" width="40" height="40" role="img" aria-label="Nestimate">
  <rect width="40" height="40" rx="11" fill="#1D5C51"/>
  <path d="M9.5 20.5 20 11l10.5 9.5" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12.5 25c1.9 3.2 4.6 4.8 7.5 4.8s5.6-1.6 7.5-4.8" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round"/>
  <circle cx="20" cy="22.2" r="3.4" fill="#F2A07C"/>
</svg>
```

Logotype : « Nestimate » en Fraunces 600. Le monogramme garde ses couleurs dans les deux thèmes ; en sombre, le fond passe à `#2C7A6B` pour se détacher du fond (3,57:1, élément graphique). Contrastes internes : blanc sur sapin 7,77:1, œuf sur sapin 3,74:1. À décliner en icône PWA (`icons/`) et en favicon le moment venu.

## 8. Composants clés

Tous sont dans `design-system.css` et rendus dans `maquettes/composants.html`. Chacun reprend un composant V1 plutôt que d'en inventer un.

| Composant | Classe | Remplace en V1 | Règles |
|---|---|---|---|
| Bouton | `.btn` + `-primary`, `-secondary`, `-ghost`, `-danger`, `-danger-outline`, `.btn-icon` | `.btn.primary/secondary/ghost`, `.btn-danger` | Hauteur 44 px. Un seul bouton principal par écran. L'état désactivé garde 5,57:1 et sa raison est écrite à côté. |
| Champ | `.field`, `.label`, `.hint`, `.input`, `.affix` + `.affix-unit`, `.field-error` | `input`, `.hint`, `.field-err` | Label toujours visible au-dessus. Unité affichée (€, %, ans). Erreur = texte + icône + `aria-invalid` + `aria-describedby`. |
| Mot de passe | `.pw-wrap`, `.pw-toggle`, `.pw-rules` | — (nouveau, V2) | Bouton « Afficher » plutôt qu'un champ de confirmation. Règle visible avant la saisie. |
| Choix | `.choice` (radio ou case dans une carte), `.segmented` | `.toggle-check`, `.chip`, `.hav-toggle` | Aucune présélection quand le choix est destructeur (V2-04). |
| Carte | `.card`, `.card-quiet` | `.card`, `.result` | Un seul niveau d'ombre au repos. |
| Carte du hub | `.hub-card` | `.home-card` | Lien entier cliquable, icône SVG, valeur écrite en phrase courte. Pas de carte grisée : une carte non pertinente n'est pas affichée. |
| Chiffre clé | `.hero-figure` | `.sum-card`, `.result.hl-green` | Un seul par écran. |
| Badge dossier | `.verdict[data-level]`, `.verdict-chip` | `.dossier-badge.badge-*` | 5 niveaux : Solide, Finançable, Limite, Fragile, Refus probable. Lisible sans couleur grâce à un mot, une icône de forme unique, une jauge de 4 crans (4 à 0 pleins) et une phrase. `role="status"`. Le niveau refus a un bloc « Ce que vous pouvez faire ». |
| Jauge | `.gauge` | `.eval-bar`, légendes ■ | Repère de seuil visible et phrase chiffrée. Plus de légende de couleurs. |
| Alerte | `.alert-info/success/warning/danger/neutral` | `.status`, `.explain-box`, `.warn-hint` | Bordure gauche, icône, titre et texte. `role="alert"` pour les erreurs bloquantes, `role="status"` sinon. |
| Invitation | `.invite` | — (V2-01) | Bordure pointillée, non bloquante, placée après le résultat. |
| Toast | `.toast` | `#saveInd` | Message passager annoncé (`role="status"`). |
| Bloc repliable | `details.disclosure` | `.fees-detail`, `.sale-block`, `.amort-toggle`, `.hc-expand` | Un seul motif, natif `<details>`, accessible au clavier sans JS. |
| Terme expliqué | `details.explain` | bouton `?` + popup | L'explication se déplie sur place, sans fenêtre. |
| Dialogue | `.dialog` dans `.dialog-backdrop` | `.popup-overlay` | `role="dialog"` ou `alertdialog`, focus initial sur l'action sûre. |
| En-tête | `.app-header`, `.sync[data-state]`, `.account`, `.menu` | `.topbar`, `#saveInd`, `.profile-btn` | Mobile : logo, état de synchro (icône), compte (initiales), thème, sans débordement à 390 px. |
| Synchro | `.sync[data-state="ok/pending/error/local"]` | `#saveInd` | Icône de forme différente par état, libellé visible sur grand écran et nom accessible partout. |
| Navigation | `.back-link`, hub | `.back-home-btn` | Le hub reste la navigation principale (décision V1). Pas de barre d'onglets ajoutée. |

## 9. Alternative écartée (pour mémoire)

**« Carnet »** : fond blanc pur, bleu nuit `#1F3A5F` et jaune moutarde, typographie unique Figtree. Plus neutre et plus « outil », mais plus proche de l'univers bancaire que le porteur veut quitter.
