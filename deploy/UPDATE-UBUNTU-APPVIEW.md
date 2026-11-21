# Mise à jour Ubuntu — WebView et préparation AppView

Branche à récupérer : `codex/android-appview-webview`, basée sur la dernière
version de Claude `4664bed`. Ne pas récupérer `main` pour cette intervention.
Aucune migration ajoutée. Garder les fichiers `.env.local`, clés et configuration
Nginx existants. Exécuter avec le compte qui gère normalement Git, npm et PM2.
Le chemin ci-dessous est celui documenté dans la configuration Nginx du dépôt.

```bash
cd /var/www/cashpay-all/jo-ai
(
  set -e
  test -z "$(git status --porcelain)" || {
    echo 'Modifications locales présentes : les sauvegarder/committer avant la mise à jour.'
    exit 1
  }
  git fetch origin
  git switch codex/android-appview-webview
  git pull --ff-only origin codex/android-appview-webview
  npm ci --ignore-scripts
  npm run typecheck
  npm test
  npm run build
  pm2 startOrRestart deploy/ecosystem.config.cjs --update-env
  curl --fail --retry 5 --retry-connrefused --retry-delay 2 http://127.0.0.1:8095/healthz
  pm2 save
)
```

Ce bloc installe la version du studio et de l’accueil ; il n’installe ni Android
SDK, ni Redis, ni un nouveau serveur WebRTC. L’accueil HTML est lu directement
par Nginx : aucun changement de configuration/rechargement Nginx n’est requis.
Le build est effectué avant le redémarrage PM2. Un déploiement sans interruption
exige des répertoires de release distincts, non configurés par ce bloc.

**Worker de publication web :** le correctif des routes SPA et exports HTML se
trouve dans `server/runtime/`. S’il tourne sur une autre machine/un autre checkout,
y récupérer cette même branche et redémarrer son service avec son gestionnaire
habituel. Ne pas redémarrer tous les services PM2. Les anciens sites React doivent
être recompilés/publiés pour enregistrer leur mode SPA. L’aperçu HTML du studio
bénéficie directement du correctif livré avec Next.js.

## Diagnostic de votre VPS, sans modification

L’absence de KVM observée lors du développement concernait l’environnement Codex,
pas votre VPS. Ubuntu peut installer les outils, mais l’hyperviseur du fournisseur
doit également exposer la virtualisation imbriquée et `/dev/kvm` au VPS.

```bash
cd /var/www/cashpay-all/jo-ai
uname -m
ls -l /dev/kvm
node server/android-official/preflight.cjs
```

`ready: false` indique les prérequis manquants ; ce n’est pas une preuve que le VPS
ne pourra jamais les fournir. Quand le SDK est installé, renseigner
`ANDROID_SDK_ROOT` avec son emplacement réel. Le contrôle `emulator -accel-check`
est effectué par le précontrôle. Ne pas supprimer l’ancien worker Android avant
validation de son remplaçant.

## Google : téléchargement, licences et clés

- Android SDK Command-line Tools et Android Emulator : télécharger depuis
  https://developer.android.com/studio#command-tools . Pas de clé API Google
  nécessaire pour télécharger les outils et démarrer un AVD local.
- Accepter les licences applicables via `sdkmanager --licenses` après les avoir
  lues : https://developer.android.com/studio/terms . La licence SDK prévoit un
  usage de développement sans redevance, mais n’accorde pas une liberté générale
  de redistribution/sous-licence. L’exploitation d’un service multi-utilisateur
  doit être examinée au regard de ces conditions ; ne pas publier les images SDK
  ou promettre une autorisation commerciale générale sur la seule base du téléchargement.
- L’image `google_apis` n’est pas une image Play Store. Les API propres aux apps
  (Maps, OAuth, Firebase…) et la publication Google Play ont leurs propres
  configurations/conditions, distinctes de l’émulateur.
- Après SDK et KVM configurés, `bash server/android-official/prepare-avd.sh`
  installe l’émulateur officiel et l’image API 34 puis crée un AVD Pixel 7 sans
  écraser un AVD existant. Ce script ne branche pas le streaming.
- Référence accélération :
  https://developer.android.com/studio/run/emulator-acceleration .

## Réutilisation de votre WebRTC

Il faut identifier : logiciel/version, URL de signalisation HTTPS/WSS, API de
création de session, méthode d’authentification, serveurs STUN/TURN et ports UDP/TCP.
Ne pas envoyer les secrets par chat ; les configurer côté serveur. Un port TURN
(coturn, par exemple) assure le relais réseau ; il ne capture pas l’écran Android
et ne remplace pas la passerelle de streaming/contrôle de l’émulateur. Si le service
fournit déjà ces fonctions, adapter le connecteur à son protocole existant.

## Fonctions conservées et état réel

- Dictée OpenAI -> transcription éditable -> envoi volontaire au chat.
- Pièces jointes images/PDF/textes, réponses de l’assistant et propositions de fichiers.
- Invitations de collaborateurs, import/pull/push GitHub et création de dépôt.
- Accueil : section Android AppView et explication des échanges/collaboration.
  Ce n’est pas un nouveau tableau de bord administrateur.
- AppView Pixel 7/WebRTC, compilation APK, file de jobs et runtime Node/DB complet
  restent à implémenter et à tester ; cette mise à jour ne les active pas.
