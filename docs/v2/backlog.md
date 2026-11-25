# Nestimate V2 — Backlog MVP

> Méthode : **MoSCoW**. Un **Must** est indispensable pour atteindre O1 (multi-appareils) ou O2 (isolation) sans perte de données ni fuite. Tout le reste est au mieux Should. Voir `vision.md` pour les objectifs et le périmètre.
> Le drapeau **[RGPD]** signale une story qui collecte ou expose une donnée nouvelle.

## Vue d'ensemble

| ID | Story | MoSCoW | Justification |
|---|---|---|---|
| V2-01 | Utiliser l'app sans compte | Must | Non-régression V1 et « simuler d'abord ». C'est aussi le repli si le serveur est indisponible |
| V2-02 | Créer un compte et se connecter (email + mot de passe) **[RGPD]** | Must | Prérequis de tout le reste |
| V2-02b | Mot de passe oublié | Must | Sans ça, un oubli = données perdues |
| V2-03 | Sauvegarde automatique dans le compte **[RGPD]** | Must | Cœur de O1 |
| V2-04 | Première connexion : reprendre mes données locales | Must | O4 : les utilisateurs actuels ont déjà des données |
| V2-05 | Ordinateur partagé : ne jamais récupérer les données d'un autre compte | Must | O2 : risque de fuite de données financières |
| V2-06 | Retrouver mes données sur un autre appareil | Must | Cœur de O1 |
| V2-07 | Conflit entre deux appareils | Must | Sans cette story, perte silencieuse de saisie (risque n°1) |
| V2-08 | Se déconnecter | Must | Ordinateur partagé, O2 |
| V2-09 | Supprimer mon compte | Must | Droit à l'effacement, minimum RGPD |
| V2-10 | Savoir ce qui est stocké et où **[RGPD]** | Must | Obligation d'information. Coût faible (une page statique) |
| V2-11 | Isolation stricte entre comptes (enabler) | Must | O2. Non négociable avec des données financières |
| V2-12 | Voir l'état de la synchronisation | Should | Confiance et diagnostic (pause du projet gratuit, réseau). Sans elle, l'app fonctionne quand même |
| V2-13 | Exporter mes données (JSON) | Should | Droit à la portabilité, et sauvegarde personnelle. Coût faible car les blobs existent déjà |
| V2-15 | Purge automatique des comptes inactifs | Could | Une purge manuelle suffit à quelques dizaines de comptes. La durée reste à décider |
| — | Partage d'un projet entre comptes | Won't | Exclu par le cadrage |
| — | Fusion automatique des conflits | Won't | Coûteux. Le choix explicite (V2-07) suffit |
| — | Lien magique, OAuth Google/Apple, historique des versions, analytics | Won't | Hors besoin, ou contraire à la minimisation des données |
| — | Synchro du thème et du mode expert | Won't | Préférences propres à l'appareil |

**Découpe livrable minimale** : V2-01, 02, 03, 06, 08, 11, puis 04, 05, 07, 09, 10. Aucune ouverture aux connaissances avant que les 11 Must soient faits : V2-05, 07 et 09 protègent leurs données.

---

## Must

### V2-01 Utiliser l'app sans compte
En tant que **primo-accédant qui découvre l'app**, je veux simuler sans créer de compte, afin de juger de l'intérêt de l'outil avant de donner mon email.
- **Given** je ne suis pas connecté **When** j'utilise toutes les pages (budget, revente, crédits, biens, RvB) **Then** tout fonctionne comme en V1, avec stockage en `localStorage` seulement.
- **Given** je ne suis pas connecté **When** je saisis des données **Then** aucune requête réseau n'envoie mes données au serveur.
- **Given** j'ai saisi au moins un profil, un crédit ou un bien **When** je suis en mode anonyme **Then** une invitation discrète (non bloquante) propose de « sauvegarder pour retrouver mes données sur mes autres appareils ».
- **Given** le serveur est indisponible (pause, réseau) **When** j'ouvre l'app **Then** je peux simuler en local.

### V2-02 Créer un compte et se connecter (email + mot de passe) [RGPD : email]
En tant qu'**utilisateur qui veut retrouver ses données ailleurs**, je veux un compte protégé par mon email et un mot de passe, afin d'accéder à mes données depuis n'importe quel appareil.
- **Given** je saisis un email valide et un mot de passe conforme (12 caractères minimum) **When** je crée mon compte **Then** le compte est créé et je suis connecté.
- **Given** l'email est déjà utilisé **When** je crée un compte **Then** un message me propose de me connecter ou de réinitialiser mon mot de passe.
- **Given** email ou mot de passe incorrect **When** je me connecte **Then** un message générique s'affiche (sans révéler lequel des deux est faux).
- **Given** trop de tentatives échouées **When** je réessaie **Then** la connexion est temporairement bloquée (limitation fournie par le service d'auth).
- Le formulaire affiche un lien vers la page d'information (V2-10) **avant** la création du compte.

### V2-02b Mot de passe oublié
En tant qu'**utilisateur qui a oublié son mot de passe**, je veux le réinitialiser, afin de ne pas perdre mes données.
- **Given** je saisis mon email **When** je demande une réinitialisation **Then** je reçois un email avec un lien, et l'écran affiche le même message que l'email existe ou non.
- **Given** je clique le lien valide **When** je saisis un nouveau mot de passe **Then** il remplace l'ancien et je suis connecté.
- **Given** le lien a expiré **When** je l'ouvre **Then** un message propose d'en redemander un.
- Nécessite un **envoi d'emails fonctionnel** (SMTP personnalisé, voir vision.md).

### V2-03 Sauvegarde automatique dans le compte [RGPD : copie serveur des données financières]
En tant qu'**utilisateur connecté**, je veux que mes modifications soient enregistrées dans mon compte sans action de ma part, afin de ne rien perdre.
- **Given** je suis connecté **When** je modifie un profil, un crédit ou un bien **Then** les 3 jeux de données (`nestimate_profiles`, `nestimate_credits`, `nestimate_biens`) sont envoyés au serveur en quelques secondes (regroupement des saisies rapides).
- **Given** l'envoi échoue **When** le réseau revient ou que je rouvre l'app **Then** l'envoi est retenté. Mes données locales ne sont jamais effacées à cause d'un échec.
- Les données sont envoyées **telles quelles** (JSON V1), sans transformation.

### V2-04 Première connexion : reprendre mes données locales
En tant qu'**utilisateur V1 qui a déjà tout saisi sur cet appareil**, je veux que mes données rejoignent mon compte, afin de ne pas tout retaper.
- **Given** j'ai des données anonymes sur cet appareil et mon compte est vide **When** je me connecte **Then** un écran résume ce qui est trouvé (« 2 profils, 3 crédits, 1 bien ») et propose « Enregistrer dans mon compte » ou « Ne pas importer ».
- **Given** j'ai des données anonymes et mon compte contient déjà des données **When** je me connecte **Then** je choisis entre « Garder les données du compte » (les données locales sont remplacées) et « Remplacer le compte par les données de cet appareil ». Aucune option n'est présélectionnée et il n'y a pas de fusion.
- **Given** il n'y a aucune donnée locale **When** je me connecte **Then** les données du compte sont chargées sans question.
- **Given** des données à l'ancien format `nestimate_v2` **When** l'import a lieu **Then** il s'effectue après la migration V1 existante, sans perte de champ.
- **Cas limite** : profils de foyers différents dans la même liste (point #10). Ils sont importés tels quels ; les crédits et les biens restent communs au compte.

### V2-05 Ordinateur partagé : ne jamais récupérer les données d'un autre compte
En tant qu'**utilisateur sur l'ordinateur d'un proche**, je veux que mes données ne se mélangent jamais avec celles d'une autre personne, afin de protéger mes informations financières et les siennes.
- **Given** les données locales appartiennent au compte A (marqueur local) **When** je me connecte avec le compte B **Then** elles ne sont **pas** proposées à l'import : elles sont effacées et remplacées par celles de B.
- **Given** les données locales sont anonymes (saisies par quelqu'un d'autre sans compte) **When** je me connecte **Then** l'écran de V2-04 s'affiche avec le résumé, pour que je reconnaisse ou non ces données. Rien n'est importé sans mon clic.
- **Given** la session de A a expiré et ses données sont encore en local **When** quelqu'un ouvre l'app **Then** les données de A ne s'affichent pas. L'app propose « Se reconnecter » ou « Continuer sans compte », ce qui efface les données locales de A.

### V2-06 Retrouver mes données sur un autre appareil
En tant que **propriétaire avec plusieurs crédits saisis en mode avancé**, je veux retrouver profils, crédits et biens sur mon téléphone, afin de ne pas ressaisir ce qui m'a pris du temps.
- **Given** j'ai des données dans mon compte **When** je me connecte sur un nouvel appareil vide **Then** profils (avec montages), crédits et biens s'affichent, et les calculs donnent les mêmes résultats que sur l'appareil d'origine.
- **Given** je suis connecté sur deux appareils **When** je modifie sur A puis j'ouvre l'app (ou je reviens sur l'onglet) sur B, sans modification locale en attente sur B **Then** B affiche la version de A sans question.
- **Cas limite** : un crédit ancien sans `lignes`, un bien avec `currentValue = null`. Ils s'affichent sans erreur (mêmes garde-fous qu'en V1).

### V2-07 Conflit entre deux appareils
En tant qu'**utilisateur qui a modifié ses données sur deux appareils**, je veux choisir la version à garder, afin de ne jamais perdre une saisie sans le savoir.
- **Given** B a des modifications non envoyées, alors que le compte a été modifié depuis A depuis la dernière synchro de B **When** B tente d'envoyer **Then** rien n'est écrasé. Une fenêtre indique « Vos données ont été modifiées sur un autre appareil le <date heure> ». Je choisis entre « Utiliser la version du compte » et « Garder celle de cet appareil ».
- **Given** je choisis une version **When** je confirme **Then** l'autre est remplacée, et la fenêtre précise ce qui sera perdu.
- **Given** B est hors ligne et modifie ses données **When** il revient en ligne **Then** la même règle s'applique.
- Règle : la détection porte sur **l'ensemble des 3 jeux de données** (une seule version), pas sur chaque champ.

### V2-08 Se déconnecter
En tant qu'**utilisateur sur un ordinateur partagé**, je veux me déconnecter, afin que la personne suivante ne voie pas mes revenus ni mes crédits.
- **Given** je suis connecté et tout est synchronisé **When** je me déconnecte **Then** les données locales de mon compte sont effacées et l'app revient à un état vide (anonyme).
- **Given** des modifications ne sont pas encore envoyées **When** je me déconnecte **Then** l'app tente l'envoi. En cas d'échec, elle m'avertit (« des modifications seront perdues ») et me demande confirmation.
- **Given** je me reconnecte ensuite **When** la connexion aboutit **Then** je retrouve mes données (V2-06).

### V2-09 Supprimer mon compte
En tant qu'**utilisateur qui a fini son projet**, je veux supprimer mon compte et toutes mes données, afin qu'il ne reste rien de mes informations financières.
- **Given** je suis connecté **When** je demande la suppression **Then** une confirmation explicite m'indique ce qui sera supprimé (email, profils, crédits, biens), de façon irréversible.
- **Given** je confirme **When** la suppression aboutit **Then** le compte et toutes ses données sont supprimés du serveur, les données locales de cet appareil sont effacées, et un message confirme la suppression.
- **Given** j'étais aussi connecté sur un autre appareil **When** je l'ouvre ensuite **Then** la session est invalide et les données locales de ce compte sont effacées (V2-05).
- **Given** la suppression échoue **When** l'erreur survient **Then** rien n'est effacé en local et un message m'invite à réessayer.
- Note : la suppression du compte d'authentification exige un traitement côté serveur (droits élevés).

### V2-10 Savoir ce qui est stocké et où [RGPD]
En tant que **connaissance invitée par le porteur**, je veux savoir ce qui est conservé sur moi, afin de décider en confiance de créer un compte.
- **Given** je suis sur le formulaire de connexion ou en pied de page **When** j'ouvre « Vos données » **Then** la page indique : les données collectées (email, données de simulation, y compris celles d'un co-emprunteur), la finalité (synchro entre vos appareils), l'hébergement (UE, nom des sous-traitants), la durée de conservation, la façon de supprimer et d'exporter, et un contact.
- **Given** je n'ai pas de compte **When** je lis la page **Then** elle précise qu'en mode anonyme rien ne quitte mon appareil.
- Contenu **à valider par un juriste** avant l'ouverture aux connaissances.

### V2-11 Isolation stricte entre comptes (enabler technique)
En tant que **porteur du projet**, je veux la garantie qu'aucun compte ne peut lire les données d'un autre, afin d'honorer la promesse « chacun son compte, aucun partage ».
- **Given** les comptes A et B existent **When** A requête les données de B (même en forgeant la requête avec la clé publique) **Then** il obtient un refus ou un résultat vide.
- **Given** une requête sans session **When** elle vise les données utilisateur **Then** elle est refusée.
- Ce test est rejoué avant chaque déploiement qui touche le stockage.

---

## Should

### V2-12 Voir l'état de la synchronisation
En tant qu'**utilisateur connecté**, je veux savoir si mes données sont à jour dans mon compte, afin de savoir si je peux passer sur un autre appareil.
- **Given** je suis connecté **When** la synchro réussit, est en cours ou échoue **Then** l'indicateur (proche de l'actuel `saveInd`) affiche « Synchronisé », « Synchronisation… » ou « Non synchronisé, nouvel essai automatique ».

### V2-13 Exporter mes données
En tant que **propriétaire averti**, je veux télécharger mes données, afin d'en garder une copie ou de les vérifier.
- **Given** je suis connecté (ou anonyme) **When** je clique « Exporter » **Then** un fichier JSON contenant profils, crédits et biens est téléchargé.

---

## Dette V1 : points ouverts #8 à #12

Le porteur les traite en parallèle. Ils **ne bloquent pas** le MVP V2. Ils sont listés ici pour qu'aucun ne soit oublié.

| # | Sujet | Décision backlog | Lien V2 |
|---|---|---|---|
| 8 | Revente à perte non signalée dans le badge | Should, traité par le porteur | Aucun |
| 9 | Double comptage des loyers | Could, traité par le porteur | Les données importées (V2-04) peuvent contenir ce doublon : aucune correction automatique à l'import |
| 10 | Crédits globaux, non rattachés au profil | **Décidé pour le MVP** : profil = scénario du même foyer, crédits et biens communs au compte | Avec un compte par personne, le cas « foyers différents dans la même app » devient marginal |
| 11 | Revente non persistée | Should, traité par le porteur | Si la revente est persistée dans le profil, elle sera synchronisée automatiquement (blob). À livrer **avant** V2-03 pour éviter un 2e changement de format |
| 12 | Changements de comportement (`currentCredits` ignoré, `rentPct = 90` conservé) | Info, rien à faire | Import tel quel (V2-04), sans migration silencieuse des valeurs |
