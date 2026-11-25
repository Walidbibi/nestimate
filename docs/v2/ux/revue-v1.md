# Revue UX/UI de la V1

> Auteur : agent ux-ui. Date : 2026-11-25. Statut : constats d'audit, **non validés par des utilisateurs**. Les personas (`persona-primo`, `persona-proprietaire`) n'ont pas encore relu ce document.

## Méthode

- V1 lancée en local (`python3 -m http.server 3000`), parcourue avec Playwright à **1280 px** et **390 px** (deviceScaleFactor 1), en thème clair et sombre.
- Jeu de données réaliste injecté dans le `localStorage` : couple (2 650 € + 2 300 € nets sur 13 mois), 1 enfant, apport 25 000 €, taux 3,35 %, 25 ans, bien testé à 285 000 € + 10 000 € de travaux, 1 crédit auto (210 €/mois), 1 studio locatif, 2 profils. Puis un profil défavorable (seul, 2 100 €, bien à 260 000 €) pour voir un refus.
- Contrôles automatiques : débordement horizontal, champs sans label, boutons sans nom accessible, attributs ARIA, styles de focus. Ratios de contraste calculés sur les couleurs de `css/styles.css` et `js/ui.js`.
- **Limite de l'environnement** : la police Satoshi (CDN Fontshare) et l'API BCE sont bloquées par le proxy du bac à sable. Les captures montrent donc la police de repli système et les taux statiques. C'est aussi un constat (voir P20).

Captures : `docs/v2/ux/captures/v1/` (14 fichiers, numérotés dans le tableau ci-dessous).

## Pourquoi la V1 « ressemble à un brouillon »

Le porteur a raison, et ce n'est pas une question de couleurs : la palette actuelle (crème et sarcelle) est plutôt agréable et ses contrastes en thème clair sont bons. L'impression de brouillon vient de cinq choses :

1. **Tout a le même poids.** L'accueil aligne 9 cartes identiques (capture 01). La page Budget empile trois grands montants de même taille (05). Le bilan aligne une quinzaine de blocs avant de conclure (10). L'œil ne sait pas où se poser, donc l'utilisateur ne sait pas ce qui compte.
2. **Les composants ne se ressemblent pas.** Quatre façons de replier un bloc, trois verdicts différents pour la même question (06), des couleurs de statut qui changent de sens d'une page à l'autre. On sent une accumulation de fonctionnalités, pas un produit dessiné.
3. **Pas d'identité.** Un pictogramme de maison générique, une police qui dépend d'un CDN tiers, et surtout **des emojis comme icônes** (👤💰📋🎯🏠📊⚖️🏘️🏦, plus ✅❌📈🏷ℹ️ dans les pages). Leur rendu change selon le téléphone et leur ton « gadget » contredit le sérieux d'une décision à 300 000 €.
4. **Le texte est brut.** Formules affichées telles quelles (« Coût = capital × (taux1×quotité1 + taux2×quotité2) / 12 »), sigles non expliqués (HAV, HAC, HCSF, CC), faute visible (« en faveur de l'location »), renvois à des onglets et des étapes qui n'existent plus.
5. **Le mobile est cassé à la marge.** L'en-tête déborde de 14 px sur toutes les pages, la barre flottante couvre le contenu, le comparateur tronque les prix. Rien de spectaculaire, mais tout cela donne l'impression d'un outil inachevé.

## Problèmes par gravité

Gravité : **Bloquant** = empêche de comprendre ou d'utiliser un résultat ; **Majeur** = gêne forte ou risque d'erreur de décision ; **Mineur** = friction ; **Cosmétique** = finition.

### Bloquant

| # | Écran / élément | Problème constaté | Impact utilisateur | Proposition |
|---|---|---|---|---|
| P07 | Tester un bien (page 4), thème sombre, badge `badge-refuse` (capture 08) | Couleurs du badge codées en dur (`#8b1a0a` sur fond sombre) : **contraste 1,84:1**. « Dossier refusé » est quasi illisible. `badge-fragile` : 3,16:1. | Le résultat le plus important, et le plus défavorable, est illisible pour qui utilise le thème sombre. Contraire au principe « résultats honnêtes ». | Badges branchés sur des tokens par thème. Nouvelle palette : refus 6,6:1 en sombre (voir `identite.md`). Maquette : `maquettes/vitrine-resultat-budget.html`, état 3. |

### Majeur

| # | Écran / élément | Problème constaté | Impact utilisateur | Proposition |
|---|---|---|---|---|
| P01 | Accueil (01, 02) | 9 cartes de même poids, sans point d'entrée. Ordre peu logique : « Mon bilan final » avant « Tester un bien ». Les cartes annoncent des chiffres sans contexte : « 305 327 € » sur le bilan, « — » sur Louer ou acheter. | Le primo-accédant ne sait pas par où commencer. Le propriétaire ne voit pas son budget d'un coup d'œil. | Un chiffre clé et le verdict en tête, puis les cartes groupées par intention (Ma situation, Trouver le bien, Ce que je possède, Pour la banque). Maquette `vitrine-accueil.html`. |
| P02 | Accueil vide (03) | 4 cartes « verrouillées » à `opacity: .55` : texte secondaire à **2,23:1**, titre à 3,67:1. Elles restent des `<button>` actifs, sans `aria-disabled`. | Illisible pour une partie des utilisateurs. Premier contact avec l'app = une liste d'interdits orange « Complétez votre profil financier ». | À la première visite : un bloc « Combien pouvez-vous emprunter ? » avec un bouton « Commencer » et les étapes. Ne pas afficher de cartes grisées. |
| P03 | Bilan (page 6, capture 10) | La conclusion (« Le bien paraît soutenable ») arrive tout en bas, après la répétition intégrale de la page 3. | Il faut faire défiler 2 000 px sur mobile pour lire la réponse. | Conclusion et verdict en tête, puis le détail dans des blocs repliables. |
| P04 | Tester un bien (06, 07) | **Trois verdicts concurrents** : la jauge d'endettement dit « dossier solide » (vert), le reste à vivre dit « Correct » (jaune), le badge dit « Dossier finançable » (sarcelle). | Lequel croire ? Le mot « solide » est aussi un niveau de badge, ce qui crée une contradiction apparente. | Un seul verdict, le badge dossier. Les jauges donnent des faits chiffrés (« 33,8 %, plafond 35 %, marge 60 €/mois ») sans qualificatif. |
| P05 | Tester un bien, Budget, Bilan | Couleurs de statut incohérentes : « Coût total du crédit 436 151 € » en **vert** et intérêts en orange ; reste à vivre orange en page 4 mais vert dans le bilan pour la même valeur ; taux du marché 25 ans en vert alors que c'est le plus cher. | Le vert signale « bien ». Un coût de 436 000 € en vert induit en erreur. | Les montants restent neutres. La couleur est réservée aux statuts, toujours doublée d'une icône et d'un mot. |
| P06 | Jauges d'endettement et de reste à vivre (06, 07) | Les légendes (« ■ <35 % Confortable ») ont des carrés **gris** : la correspondance de couleur n'existe pas. Le statut n'est porté que par la couleur de la barre. | Légende inutile pour tous, information portée par la seule couleur (RGAA 3.1, WCAG 1.4.1). | Jauge avec repère de seuil visible et phrase chiffrée (composant `.gauge`). |
| P08 | Tester un bien, badge refusé | « Taux d'endettement trop élevé ou reste à vivre négatif. Accord bancaire très improbable. » Puis rien. | Le refus tombe sans piste d'action : découragement ou abandon. | Bloc « Ce que vous pouvez faire » avec des pistes calculées : prix cible, apport nécessaire, effet d'un second revenu, durée déjà au maximum. Maquette `vitrine-resultat-budget.html`, état 2. |
| P09 | Louer ou acheter (11) | « **-63 459 € en faveur de l'location** » : faute, et signe négatif contradictoire avec « en faveur de ». Patrimoine net négatif pour les deux scénarios (-100 986 € et -37 528 €), sans explication. Les deux scénarios ont le même emoji maison. | Crédibilité entamée sur l'écran le plus « conseil » de l'app. Un patrimoine négatif inexpliqué inquiète. | « La location gagne de 63 459 € sur 10 ans », sans signe. Expliquer ce que recouvre le « patrimoine net ». Icônes distinctes pour les deux scénarios. |
| P10 | En-tête, toutes les pages à 390 px (02) | **Débordement horizontal de 14 px** : le bouton thème est coupé, la page glisse latéralement. Le sous-titre tient sur 3 lignes et « ✓ Sauvegarde » sur 2. | Sensation d'app cassée dès l'ouverture sur téléphone. | En-tête mobile : logo, état de synchro (icône), compte, thème. Pas de sous-titre. Vérifié sans débordement dans toutes les maquettes. |
| P11 | Barre flottante `#floatBar` (06, 07, 12, 13) | Elle masque le contenu (2 lignes, environ 90 px à 390 px). Elle apparaît aussi sur Mes crédits, Mes biens et l'accueil après navigation, mais pas au premier chargement. | Des champs et des boutons (« + Nouveau crédit ») passent dessous. Information hors contexte. | La limiter à Tester un bien et Comparer, sur une seule ligne, avec une réserve en bas de page. Ou la supprimer au profit du chiffre clé en tête de page. |
| P12 | Comparer (09) | À 390 px, les prix sont tronqués dans les champs (« 28500 » pour 285 000) et le tableau défile horizontalement sans indice : la colonne B est coupée. | Risque d'erreur de saisie et comparaison illisible sur téléphone, là où l'on visite des biens. | Mobile : une carte par bien, avec verdict et mensualité, et un tableau seulement à partir de 720 px. |
| P13 | Tous les champs de montant (04, 07) | Nombres nus sans unité ni séparateur : « 25000 », « 285000 », « 3.35 » (point décimal anglais). | Erreur d'un zéro facile, surtout pour un novice. Le point décimal surprend en français. | Champ avec unité visible (€, %, ans), séparateur de milliers, virgule décimale, `inputmode="decimal"`. Composant `.affix`. |
| P14 | Financement, Tester un bien, Budget (04, 06) | Jargon brut : boutons « HAV — Honoraires vendeur » et « HAC », « Plafond HCSF 35 % », « Quotité », « Taux nominal », « Enveloppe », « Plancher », « (CC) », formule mathématique de l'assurance affichée. | Le primo-accédant décroche ou saisit au hasard. | Libellés en langage courant et terme technique en second (voir `glossaire.md`). Formules dans « Détail du calcul » replié. |
| P16 | En-tête « Notre projet ▾ » et carte « Mon profil financier » (14) | « Profil » désigne deux choses : le scénario (sélecteur en haut, page « Mon profil financier » listant les profils) et la page Revenus + Charges. La V2 ajoute un troisième sens, « mon compte ». | Confusion garantie à l'arrivée des comptes : « supprimer mon profil » ou « supprimer mon compte » ? | Renommer les profils en **« projets »** ou **« scénarios »** (à trancher par test), et la carte en « Revenus et charges ». « Compte » reste réservé à l'authentification. |
| P18 | Feuille de style et HTML | Système éclaté : **30 tailles de police distinctes**, 12 rayons, 47 couleurs hexadécimales en dur (dont 12 dans le JS), **157 attributs `style=""`** dans `index.html`, 4 motifs de bloc repliable (`details.fees-detail`, `.sale-toggle`, `.amort-toggle`, `.hc-expand`). | Incohérence visible (P04, P05, P07), et chaque correctif en crée un autre. | Tokens et composants uniques (`design-system.css`), migration progressive écran par écran. |
| P22 | Boutons d'icône et champs | **Environ 20 boutons sans nom accessible** (« ? » d'aide ×10, ×, ✏, 🗑, ◐ thème). 5 champs sans label (curseur d'apport `simApport`, noms des biens comparés, nom de profil en modale). | Lecteur d'écran : « bouton, bouton, bouton ». RGAA 11.1 et 7.1. | `aria-label` explicite sur chaque bouton d'icône (« Supprimer le crédit auto »), `<label>` sur chaque champ. |
| P23 | Modales, résultats, focus | Aucun attribut ARIA dans tout `index.html` (0 `aria-*`, 0 `role="dialog"`). Pas de `:focus-visible` sur les boutons et les cartes. Les résultats recalculés et l'indicateur « Sauvegarde » ne sont pas annoncés (`aria-live` absent). | Navigation au clavier hasardeuse, modales non annoncées, mise à jour du verdict invisible pour un lecteur d'écran. | `role="dialog"`, focus piégé et restitué, `:focus-visible` à 3 px, `role="status"` sur le verdict et la synchro. |
| P25 | Thème sombre, plusieurs écrans | En plus de P07 : badge « solide » `#437a22` à 3,31:1, texte blanc sur bouton principal `#4f98a3` à **3,31:1**, couleurs en dur dans `ui.js` (reste à vivre). | Lisibilité dégradée sur tout le thème sombre. | Tokens par thème, tous à 4,5:1 minimum (voir `identite.md` §3). |
| P26 | Reste à vivre « Correct » (06) | Texte `#b8860b` sur fond clair : **3,12:1**, sous le seuil AA. | Le message de statut est difficile à lire. | Token `--c-warning` à 5,8:1 sur son fond. |
| P27 | Accueil, carte « Mes biens immobiliers » (01) | Au chargement, la carte affiche « **Aucun bien enregistré** » alors qu'un bien existe. Elle se corrige après une navigation (14). Cause : `biens.js` est chargé après `main.js`, qui appelle `refreshHome()` avant `loadBiens()`. | L'utilisateur croit avoir perdu ses données. En V2, après une synchro, ce faux vide serait encore plus inquiétant. | Correctif simple (rafraîchir l'accueil après `initBiens()`), à confier au porteur. Je ne l'ai pas modifié. |

### Mineur

| # | Écran / élément | Problème constaté | Impact | Proposition |
|---|---|---|---|---|
| P15 | Louer ou acheter, Comparer | Textes obsolètes : « Utilise automatiquement votre profil de l'onglet Budget » (les onglets n'existent plus), « Laisser à 0 pour utiliser l'étape 5 ». | Perte de confiance, et l'utilisateur cherche un onglet introuvable. | Relecture éditoriale complète, qui peut se faire avec le glossaire. |
| P17 | Accueil et toutes les pages | Emojis utilisés comme icônes, rendu variable selon l'OS, lus à voix haute par les lecteurs d'écran (« sac d'argent »). | Ton gadget, incohérence entre appareils. | Icônes SVG au trait, une seule famille (voir `identite.md` §6). |
| P19 | Barre flottante, curseur d'apport, badges | Micro-tailles : 0,62 à 0,65 rem (≈ 10 px), labels en capitales espacées, graisse 800 partout. | Difficile à lire sur téléphone, et tout semble crier. | Plancher à 13 px, capitales réservées aux sigles, deux graisses de texte seulement (400, 700) plus 800 pour le chiffre clé. |
| P20 | `<head>` | Police Satoshi chargée depuis `api.fontshare.com` et pdf.js depuis cdnjs : si le CDN est bloqué, police de repli (constaté ici). Chaque visite envoie l'adresse IP à un tiers. | Rendu instable, et point RGPD à signaler au PO (transfert de l'IP à un tiers). | Polices auto-hébergées (fait dans les maquettes : `docs/v2/ux/fonts/`). |
| P21 | Bouton thème `◐` | Glyphe rendu comme un point, sans nom ni état. | Fonction introuvable. | Bouton d'icône avec `aria-label` et `aria-pressed`. |
| P24 | Structure | Pas de `<main>`, `h1` = « Nestimate » sur toutes les pages. | Navigation par titres moins efficace. | `<main>`, et `h1` = titre de la page affichée. |
| P28 | Accueil, menu des profils (14) | Le menu des profils et la carte « Mon profil financier » dépliable dupliquent la gestion des profils, avec deux boutons de suppression différents (🗑 rouge sur la carte, × dans le menu). | Risque de suppression involontaire. | Un seul endroit pour gérer les projets. |

### Cosmétique

| # | Écran / élément | Problème constaté | Proposition |
|---|---|---|---|
| P29 | Cartes de l'accueil | Hauteurs inégales (la première est plus haute à cause du bloc dépliable). Flèches → de deux dessins différents. | Grille de cartes de hauteur minimale commune, un seul chevron. |
| P30 | Budget max (05), TAEG | Les pastilles « Taux nominal / Assurance / Frais » passent sur deux lignes à 390 px, la troisième seule. | Liste clé / valeur sur mobile. |
| P31 | Mes biens (13) | La carte « Valeur d'achat totale » est en vert sans raison sémantique. | Couleurs neutres. |

### Hors UX, à vérifier par le porteur

- **TAEG affiché « Assurance 0,60 % »** avec deux emprunteurs à 0,30 % et une quotité de 50 % chacun (06). Le TAEG de 4,01 % ressemble à la somme 3,35 + 0,60 + 0,05. À vérifier dans `calcTAEG()` : je ne l'ai pas audité.

## Les 5 problèmes à régler en premier

1. **Un seul verdict, honnête, lisible sans couleur et suivi de pistes** (P07, P04, P08, P06, P26). C'est le cœur de la promesse : dire à quelqu'un s'il peut acheter. Aujourd'hui, le refus est illisible en sombre, contredit par d'autres indicateurs et sans suite.
2. **Réparer le mobile** (P10, P11, P12, P13) : en-tête qui déborde, barre flottante qui masque, comparateur tronqué, montants sans unité. Le téléphone est l'appareil des visites.
3. **Donner une hiérarchie** (P01, P02, P03) : le chiffre clé et le verdict d'abord, un point d'entrée clair pour la première visite, la conclusion du bilan en tête.
4. **Parler comme l'utilisateur** (P14, P16, P09, P15) : libellés courants, sigles expliqués, fautes et renvois morts corrigés, et le mot « profil » désambiguïsé **avant** l'arrivée de « compte » en V2.
5. **Poser le système visuel et l'accessibilité de base** (P18, P25, P17, P22, P23) : tokens par thème, composants uniques, icônes SVG, noms accessibles, `aria-live` et `role="dialog"`. C'est ce qui fera passer l'app de « brouillon » à « produit », et ce qui empêchera les problèmes 1 à 4 de revenir.

## Ce qui fonctionne déjà (à garder)

- Le **hub** de cartes : bonne base, à hiérarchiser.
- La pédagogie des charges (page 1) : « Charges dans le taux d'endettement » et « Reste à vivre uniquement », avec leurs étiquettes. C'est clair et juste.
- Les **valeurs pré-remplies** réalistes (notaire 7,5 %, assurance 0,36 %…).
- Les chiffres tabulaires, la sauvegarde automatique et le calcul en direct.
- Une palette claire déjà chaleureuse, avec de bons contrastes en thème clair (texte secondaire à 5,34:1).
