# Livraison visuelle et hébergement — 22 novembre 2026

Logos locaux Devicon (MIT) dans le sélecteur, les cartes, les fichiers et les onglets.
React Native et Blog/actualité sont maintenant proposés. PostgreSQL est identifié ;
MySQL reste marqué non activé. Aucun nouveau provisionneur SQL n’est prétendu actif.
Le cahier des charges est conservé et affiché dans l’assistant dès la création.

Le blog contient les sources, articles JSON éditables, recherche, catégories,
pages d’articles et une vraie commande npm run build sans dépendance externe.
Les brouillons sont exclus de dist et les textes échappés. Aucun article fictif.
Il s’agit d’un blog statique géré dans le studio, pas d’un CMS serveur déjà installé.

Le panneau Hébergement/Domaines utilise la publication et la vérification A/TXT
existantes. La taille publiée et le nombre de fichiers sont mesurés par le worker.
Les anciennes publications peuvent ne pas disposer de ces mesures avant republication.
Quotas techniques actuels par artefact : 30 Mio, 1500 fichiers, 5 Mio par fichier.
Pas de quota mensuel de trafic ni de nouvelle offre Premium prétendument opérationnels.

Tarif approuvé : 3,90 USD/mois ou 30 USD/an pour un site. Le catalogue est affiché
comme offre en préparation. Aucun prélèvement ni abonnement activé. La facturation
récurrente nécessite encore un contrat de mandat compte flotte, consentement de
l’abonné, états persistants, factures, renouvellements idempotents, vérification
serveur des paiements, annulation et contrôle des quotas côté API/worker.
Les crédits IA et leurs achats ponctuels ne constituent pas un mandat d’hébergement.

Aucune API de registrar n’est nécessaire pour le pointage manuel. L’utilisateur
ajoute A/TXT chez son fournisseur ; le worker vérifie le pointage et le proxy TLS
existant assure HTTPS. L’automatisation future dépendra du fournisseur DNS.

Même branche codex/android-appview-webview. Pas de migration ni de nouvelle
dépendance pour JoJo AI. Le worker runtime séparé doit aussi être mis à jour pour
les mesures de stockage. TypeScript, tests des contrats (dont compilation réelle
du modèle blog, brouillons et échappement) et compilation Next.js réussis localement.
