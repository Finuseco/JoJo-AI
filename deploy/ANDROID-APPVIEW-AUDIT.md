# JoJo AI AppView — audit et état du travail, 21 novembre 2026

## Révision de référence

Dépôt `Finuseco/JoJo-AI`. Base : branche `codex/production-studio-foundation`,
commit `4664bed` de Claude (21 novembre 2026). `main` est plus ancien et ne doit
pas servir de base à cette intervention. Branche locale : `codex/android-appview-webview`.
Aucune modification de production ni migration appliquée. La publication GitHub de cette branche a été demandée après cet audit ; voir le guide UPDATE-UBUNTU-APPVIEW.md.

## Résultats de l’examen

- Next.js 14, React 18, TypeScript ; page d’accueil HTML statique servie par Nginx.
- Authentification et contrôle de propriété : `requireProject`, `sameOrigin`.
- PostgreSQL : projets, fichiers avec encodage/mode, collaborateurs, secrets chiffrés,
  historique de génération et liens GitHub. Le schéma ne comporte pas de file Android.
- Monaco et éditeur tactile existent ; propositions IA avec validation humaine.
- GitHub : OAuth, import, comparaison à trois versions pour pull, création de dépôt,
  push sans force et consultation des dix derniers commits. Pas d’outil autonome
  de restauration ou de création de branche exposé à l’assistant. Aucun test OAuth
  réel effectué dans cet environnement.
- Runtime npm : worker Docker séparé, historique sur disque, limites CPU/RAM/durée,
  installation et build, publication de fichiers statiques. Pas de runtime Node/SSR,
  de proxy d’API applicative ni d’injection des secrets DB par projet.
- PostgreSQL dédié peut être provisionné ; cela ne connecte pas automatiquement
  une application publiée. Le navigateur ne doit jamais recevoir son URL de connexion.
- Android existant : worker `budtmo/docker-android`, profil Samsung, transport noVNC,
  sessions en mémoire, installation ADB d’un APK importé. Ce n’est pas le service
  Pixel 7 + WebRTC demandé. Ne pas le déclarer conforme à cette nouvelle exigence.
- Le modèle React Native utilisait Vite/React DOM : corrigé par un modèle natif
  Android provenant de `@react-native-community/template@0.76.9`, licence MIT
  conservée. Version de compatibilité explicitement figée, pas une affirmation
  qu’il s’agit de la dernière version de React Native. Sources Android, wrapper
  Gradle et ressources binaires conservés ; pas de clé Debug partagée. Aucun APK
  compilé ou validé à ce stade. Dépendances natives/SDK/NDK à vérifier au premier build.

## Corrections préparées

1. Aperçu HTML : les liens vers les autres pages disponibles restent dans l’iframe
   isolée ; résolution de `page.html`, `/page` et `/page/index.html`. Les fichiers
   publiquement accessibles restent limités au graphe des ressources référencées.
2. Hébergement statique : répertoires `index.html`, exports `.html`, repli SPA
   pour les builds React DOM hors Next, uniquement pour une navigation HTML sans
   extension. Les routes `/api`, ressources absentes et traversées de chemin ne
   reçoivent pas artificiellement une page HTML 200.
   Les sites React déjà publiés devront être recompilés/publiés pour enregistrer
   leur indicateur SPA. Cela ne répare pas un backend absent.
3. React Native séparé du web ; encodage et mode des fichiers initiaux enregistrés.
   Bundle JS inclus dans le Debug APK prévu pour fonctionner sans Metro.
4. Instructions de l’assistant clarifiées : aucun remplacement Android par du web,
   aucune promesse d’exécution ou de connexion DB non réalisée.
5. Section d’accueil FR/EN AppView, explicitement en préparation. Illustration
   tirée du lien Google fourni dans le cahier des charges, légendée Pixel 6/API 33
   pour ne pas la faire passer pour la cible Pixel 7/API 34. Les deux nouvelles
   maquettes reçues dans le chat ne sont pas disponibles comme fichiers locaux
   ou références téléchargeables ; elles restent à intégrer comme visuels, jamais
   comme écran d’un émulateur en fonctionnement.
6. Précontrôle non destructif et script de préparation d’AVD officiel ajoutés
   dans `server/android-official/`. L’ancien worker demeure intact en attendant
   une relève opérationnelle ; les scripts ajoutés ne constituent pas un service WebRTC.

## Choix d’architecture

Conserver Next.js comme contrôleur. Employer un hôte Linux x86_64 dédié pour
l’émulation, KVM réellement accessible et réseau privé ; autre pool de workers
pour les builds. Dimensionnement initial à mesurer : hôte émulateur 8 vCPU,
16–32 Gio RAM, SSD, deux sessions maximum au départ. Ce sont des recommandations,
pas des ressources déjà provisionnées. Aucun abonnement ni serveur acheté.

Cible imposée : Android Emulator officiel Google, profil `pixel_7`, image
`system-images;android-34;google_apis;x86_64`. Cette image n’annonce pas Play Store.
ADB et contrôle de l’émulateur restent privés. Une passerelle WebRTC dédiée doit
fournir signalisation authentifiée, tickets courts, TURN et canal de contrôle
lié à une session/propriétaire. Évaluer et verrouiller une révision du projet
Google `android-emulator-container-scripts` avant intégration : ses scripts
expérimentaux ne constituent pas un service de production prêt à brancher.

Builds : BullMQ/Redis, jobs persistants PostgreSQL, snapshots immuables des
sources, workers sans secrets du studio, sandbox renforcée/VM par frontière
utilisateur et réseau de dépendances filtré. Debug keystore dédié au projet,
conservé chiffré ; signature de publication distincte. Vérifier code de sortie,
APK avec `apksigner verify`, métadonnées avec `apkanalyzer`, taille et SHA-256.
S3 privé ; téléchargement authentifié limité au propriétaire du build. Installer
par ADB dans la bonne session, vérifier package/activité puis lancer. Aucun état
« prêt » avant résultat constaté.

Les API existantes `/api/projects/:id/android` et `/runtime` doivent être
réutilisées ou adaptées via un service partagé avant d’ajouter les alias v1,
sans deux implémentations concurrentes de l’authentification.

## Suite nécessaire, non réalisée

1. Rendre accessible un serveur de test KVM et définir le réseau privé, TLS/TURN,
   Redis, stockage d’artefacts et base de test. Le choix technique est autorisé ;
   aucun accès à ces services n’est actuellement fourni/configuré.
2. Compiler un projet natif et le modèle React Native sur les workers isolés.
   Conserver les logs, APK, hashes, signature et versions exactes des outils.
3. Développer migrations dédiées (après examen du schéma de production), file,
   annulation/reprise, APIs tenant-scoped, stockage et logs SSE, adaptateurs natif/RN.
4. Implémenter sessions durables, streaming WebRTC, contrôles tactiles/clavier,
   commandes Android, expiration, nettoyage et quotas ; connecter AppView à Monaco.
5. Fournir un runtime web dynamique isolé pour Next/Node : proxy intégral des
   chemins/méthodes/cookies/WebSockets sur un domaine propre au projet ; secrets
   DB injectés côté serveur uniquement. Tester POST, authentification, routes
   profondes et transaction DB. Ne pas supprimer la CSP pour contourner le problème.
6. Compléter GitHub (branches/restauration avec sauvegarde préalable et conflit)
   et outils autorisés de l’assistant ; préserver le contrôle utilisateur et
   l’absence de push forcé.
7. Tests d’acceptation du mandat : compilation native et RN, erreur de compilation,
   APK téléchargeable/installable, interactions réelles, deux utilisateurs isolés,
   arrêt et libération des ressources, reprise après panne. iOS : worker macOS futur.

## Vérification et limites

Précontrôle de cette session : Linux x86_64, 3 CPU, environ 10 Gio RAM,
`/dev/kvm` absent, SDK non configuré ; `ready: false`. Docker installé mais son
socket est inaccessible à l’utilisateur de cette session. Aucun démarrage Android,
APK, flux WebRTC ou test de base de données ne peut être annoncé comme validé.

Tests des routes statiques et modèles, suite de contrats et TypeScript exécutés.
Les tests unitaires ne prouvent pas les parcours de production ou la compilation
APK. L’ensemble du mandat reste inachevé tant que les étapes ci-dessus ne sont
pas implémentées et vérifiées sur l’infrastructure dédiée.

### Résultats de vérification de cette branche

- `npm run typecheck` : réussi.
- `npm test` : cinq fichiers de tests de contrats réussis, dont routage statique
  et modèle React Native ; ne pas confondre ces fichiers avec cinq parcours réels.
- `npm run lint` : réussi avec avertissements préexistants sur images/hooks.
- `npm run build` : compilation Next.js réussie ; la modification finale du retour
  à la racine a ensuite été vérifiée par TypeScript, contrats et navigateur en dev.
- Chromium/Playwright : accueil HTML → `/account/` → accueil, dans l’iframe
  sandboxée, réussi avec une réponse API de test. Script : `tests/preview-browser.py`
  (Playwright Python installé, Chromium et serveur dev requis). Ce test ne valide
  pas PostgreSQL, un déploiement utilisateur ou ses APIs réelles.
- Accueil : image chargée, passage FR/EN et absence de débordement à 390 px vérifiés
  dans Chromium ; captures examinées en desktop et mobile.
- `bash -n server/android-official/prepare-avd.sh`, analyse syntaxique Node et
  `git diff --check` : réussis. Le script SDK/AVD n’a pas été exécuté.
