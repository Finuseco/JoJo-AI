# Identité visuelle des projets

L’icône de technologie apparaît immédiatement, puis le logo validé remplace
cette icône sur les cartes du tableau de bord. Aucun logo n’est généré à l’insu
de l’utilisateur lors de la création du projet.

Au premier échange, le studio propose « Créer ou importer mon logo d’abord ».
Le formulaire de génération est prérempli à partir du nom et du cahier des charges.
L’appel utilise le service de génération OpenAI existant et son système de crédits :
une proposition réelle, visible dans Modifications, puis validation utilisateur.
Le formulaire peut aussi proposer l’intégration du logo dans les fichiers applicatifs.

Import : PNG/JPEG/WebP depuis l’appareil, converti en PNG (1024 px maximum) par
le navigateur ; PNG issu des fichiers du projet, notamment après import GitHub/ZIP ;
ou PNG téléchargé depuis un lien HTTPS public. Les liens GitHub /blob/ publics sont
convertis en liens raw. Drive/iCloud doivent fournir un téléchargement public direct ;
les pages de partage et connexions privées ne sont pas parcourues automatiquement.
Pour ces cas, télécharger l’image puis l’importer depuis l’appareil. Aucun connecteur
Drive/iCloud, accès au compte ou recherche Google Images n’est prétendu installé.
La génération actuelle suit la description textuelle ; elle n’est pas un mode
image-vers-image de reproduction d’une image de référence.

Tous les imports sont proposés dans Modifications ; ils ne remplacent pas le logo
actuel sans validation et bénéficient du contrôle de conflit existant. Pas de crédit
IA consommé par l’import. PNG vérifié, dimensions/taille bornées, contenu réencodé,
réseau public uniquement avec contrôle DNS à chaque connexion/redirection. Authentification
et accès au projet requis pour lire/importer. Le logo n’est pas exposé publiquement
par la route de carte. Les éventuelles ressources publiées par le projet suivent
son mécanisme d’hébergement habituel.

Chemin canonique : public/images/jojo-logo.png. L’icône Android générée au chemin
app/src/main/res/drawable/jojo_logo.png ainsi que logo.png, public/logo.png et
assets/logo.png sont aussi reconnus si le chemin canonique n’existe pas.
Pour un autre nom, sélectionner le PNG dans « J’ai déjà mon logo ».
Pas de nouvelle dépendance ni migration. La génération réelle nécessite toujours
OPENAI_IMAGE_MODEL et une configuration OpenAI valides. Pas d’appel payant de
production effectué pendant cette livraison.
