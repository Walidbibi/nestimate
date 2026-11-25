# Nestimate V2 — Vision

> Statut : brouillon PO, 2026-11-25. Le cadrage (objectifs, périmètre non commercial, absence de partage) est validé par le porteur. La stack technique reste une **hypothèse** à trancher par le porteur.

## 1. Problème

La V1 stocke tout dans le `localStorage` du navigateur :

| Clé | Contenu |
|---|---|
| `nestimate_profiles` | `{ current, list: { <nom>: { champs PFIELDS, hasCo, useBroker, _montages } } }` |
| `nestimate_credits` | crédits en cours (simplifiés ou avancés), partagés par tous les profils |
| `nestimate_biens` | biens possédés (`id, name, price, currentValue, creditId`) |
| `nestimate_v2` | ancien format mono-profil, migré au chargement vers `nestimate_profiles` |

Le thème n'est pas persisté, et `expertMode` n'est pas encore implémenté.

Ce stockage pose trois problèmes à l'utilisateur :
- **Il retape tout sur chaque appareil.** Un projet immobilier se prépare sur plusieurs semaines, sur le téléphone, l'ordinateur perso et parfois celui du bureau. Saisir un crédit en mode avancé prend plusieurs minutes.
- **Il perd tout** s'il vide son navigateur, utilise la navigation privée ou change d'appareil.
- **Pas d'isolation sur un ordinateur partagé** : la personne suivante voit les revenus et les crédits du précédent.

## 2. Utilisateurs

Il s'agit des connaissances du porteur, chacune pour **son propre** projet. Le volume visé est de quelques dizaines de comptes.

- **Primo-accédant**, seul ou à plusieurs : il revient souvent ajuster sa simulation, depuis son téléphone puis son ordinateur.
- **Propriétaire averti** : il a beaucoup de données coûteuses à ressaisir (crédits avancés, biens, revente). C'est lui qui perd le plus quand les données sont perdues.

**Achat à plusieurs : décision MVP.** Un projet appartient à **un seul compte**. Le co-emprunteur est saisi par le titulaire du compte, comme en V1. Le partage entre comptes est exclu (voir OUT). Conséquence à assumer : le co-emprunteur n'a pas de compte sur le projet et ne voit les données que sur l'appareil du titulaire. C'est une donnée personnelle d'un tiers saisie par le titulaire (voir RGPD).

## 3. Objectifs mesurables

| # | Objectif | Mesure | Cible |
|---|---|---|---|
| O1 | Multi-appareils | Un utilisateur retrouve profils, crédits et biens sur un 2e appareil sans ressaisie | 100 % des testeurs, vérifié en test manuel avec 3 à 5 connaissances |
| O2 | Isolation | Un compte ne peut lire ni écrire les données d'un autre | 0 accès croisé (test RLS automatisé ou manuel à chaque déploiement) |
| O3 | Pas de régression V1 | L'app reste utilisable sans compte | Le parcours anonyme fonctionne identiquement à la V1 |
| O4 | Zéro perte à la migration | Les données localStorage existantes sont reprises à la 1re connexion | 0 perte signalée par les testeurs |
| O5 | Coût | Frais d'hébergement mensuels | ~0 € |

Pas d'analytics dans le MVP : les mesures viennent de tests manuels et de retours directs. C'est cohérent avec la minimisation des données.

## 4. Périmètre MVP V2

### IN
- Compte classique : email + mot de passe, avec « mot de passe oublié »
- Usage sans compte conservé (`localStorage`), comme en V1 : « simuler d'abord, sauvegarder ensuite »
- Première connexion : reprise des données locales existantes dans le compte
- Synchronisation des 3 jeux de données (profils, crédits, biens) entre appareils
- Résolution simple des conflits : détection et choix explicite de l'utilisateur, sans fusion automatique
- Déconnexion avec effacement des données locales (ordinateur partagé)
- Suppression de compte, qui supprime toutes les données serveur
- Information RGPD minimale : quelles données, où, combien de temps, comment supprimer
- Hébergement des données dans l'UE

### OUT (avec raison)
| Exclu | Raison |
|---|---|
| Partage d'un projet entre comptes (co-emprunteurs) | Exclu par le cadrage. Ce serait structurant : modèle de données, droits, visibilité des revenus de chacun |
| Fusion automatique champ par champ | Coût élevé, risque de résultats incohérents. Le choix explicite suffit au volume visé |
| Lien magique, OAuth Google/Apple | Choix porteur : compte classique email + mot de passe |
| Paiement, mise en relation banque/courtier | Pas de commercialisation. La mise en relation relèverait du statut IOBSP (ORIAS) |
| Historique / versions des simulations | Non demandé |
| Analytics, suivi d'usage | Minimisation RGPD, coût |
| Synchro du thème / mode expert | Préférences propres à l'appareil, sans valeur de synchro |
| Mode hors-ligne avancé (file d'attente de modifications) | Le mode anonyme couvre le hors-ligne. Au retour en ligne, la synchro applique la règle de conflit |

## 5. Hypothèse technique (décision au porteur)

Piste proposée par le porteur : **Supabase**.
- Auth email + mot de passe, Postgres hébergé dans une région UE (Francfort ou Paris, à choisir à la création du projet)
- Client JS chargé par CDN, ce qui conserve l'app sans build
- Stockage initial : **les 3 blobs JSON par utilisateur** (une ligne par utilisateur, ou une ligne par clé), protégés par Row Level Security (`user_id = auth.uid()`), avec un `updated_at` ou un numéro de version pour détecter les conflits

Contraintes exprimées par le PO, que toute stack doit respecter : hébergement UE, coût ~0 €, aucun build, isolation stricte par utilisateur, suppression complète possible.

Points à connaître si Supabase est retenu :
- **L'email par défaut de Supabase ne délivre qu'aux membres de l'équipe du projet** et il est fortement limité en débit. Il faut un **SMTP personnalisé** pour envoyer les emails de réinitialisation de mot de passe (et de confirmation d'adresse si activée) aux connaissances. Ce SMTP est un sous-traitant de plus à déclarer ; un fournisseur européen est préférable. Source : [Supabase — Auth SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [changelog #29370](https://supabase.com/changelog/29370-supabase-auth-changes-to-default-email-provider)
- **Les projets du plan gratuit sont mis en pause après environ 7 jours de faible activité**, puis restaurables manuellement. Pour quelques dizaines d'utilisateurs occasionnels, c'est probable. Pendant une pause, l'app doit rester utilisable en local. Source : [Supabase — Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- Supabase est une société américaine : même avec des données stockées dans l'UE, la question du transfert hors UE et du DPA est **à vérifier par un juriste**

## 6. Hypothèses

- H1 : les connaissances utilisent bien plusieurs appareils. Si c'est faux, O1 n'apporte rien : le vérifier auprès de 3 à 5 personnes avant de développer.
- H2 : les emails de réinitialisation arrivent bien (risque : spam).
- H3 : les conflits sont rares (un seul utilisateur, rarement sur deux appareils en même temps). C'est ce qui justifie un choix manuel plutôt qu'une fusion.
- H4 : un profil = un scénario du même foyer, et pas un foyer différent. Ce choix tranche le point ouvert #10 : crédits et biens restent communs au compte.

## 7. Risques

| Risque | Impact | Mitigation MVP |
|---|---|---|
| **Conflit multi-appareils** : modifications sur A et B, puis écrasement | Perte silencieuse de saisie | MVP : dernière sauvegarde gagne + rechargement au démarrage (V2-07). Risque accepté, réévalué si pertes constatées |
| **Migration localStorage** : formats hétérogènes (`nestimate_v2` ancien, crédits sans `lignes`, `rentPct = 90`) | Import qui plante ou données altérées | Import du JSON tel quel, après la migration V1 existante (`load()`). Aucune transformation à l'import. Test sur des jeux de données V1 réels |
| **Ordinateur partagé** : données d'un autre (compte ou anonyme) importées dans mon compte | Fuite de données d'un tiers dans mon compte | Effacement local à la déconnexion. Import des données anonymes sur confirmation (V2-04, V2-05) |
| **Données financières sensibles** (revenus, crédits, patrimoine, foyer) | Fuite = préjudice fort | RLS obligatoire, test d'isolation, minimisation (email + blobs uniquement) |
| **RGPD** même sans commercialisation | Non-conformité | Information, suppression, hébergement UE, durée de conservation. Base légale et statut du porteur à valider par un juriste |
| Pause du projet gratuit, quota email | Connexion impossible | Mode local toujours fonctionnel, message clair en cas d'échec de synchro (V2-09) |
| Dérive de périmètre (partage, PTZ, hub…) | MVP jamais livré | Ce document fixe le OUT. Toute nouvelle demande passe par le backlog |

## 8. RGPD minimal (à valider par un juriste)

- **Données collectées en plus de la V1** : l'adresse email (nouvelle) et la copie serveur des données de simulation : revenus, charges, crédits, biens, composition du foyer, données du co-emprunteur.
- **Base légale** : vraisemblablement l'exécution du service demandé par l'utilisateur. **À vérifier.**
- **Hébergement** : base de données en région UE. Sous-traitants à lister : hébergeur, fournisseur SMTP.
- **Durée de conservation** : jusqu'à la suppression du compte. Une **purge des comptes inactifs** est à décider (proposition : 24 mois sans connexion, avec un email d'avertissement avant ; elle peut être manuelle au volume visé).
- **Droits** : suppression du compte en libre-service (Must) ; export JSON (Should, aussi utile comme sauvegarde) ; information sur une page dédiée.
- **Co-emprunteur** : ses revenus sont saisis par le titulaire. La page d'information doit le mentionner.
