# Architecture — Devis 3 minutes

Une page web publiée gratuitement sur GitHub Pages et ouverte dans le Chrome du consultant, sur son ordinateur. La liste des devis et les réglages ne quittent jamais ce Chrome ; seuls les PDF en sortent, par la fenêtre d'impression. Tout ce qui est marqué **Supposé** a été complété sans être demandé au consultant.

## Pièces

1. **La page** : les écrans (liste, devis avec aperçu, réglages), les calculs, les vérifications avant le PDF et la mise en page A4. Elle tourne dans Chrome, sur l'ordinateur du consultant. Rien n'est calculé ailleurs.
   *Technique :* page statique HTML, CSS et JavaScript, sans serveur ni appel réseau. **Supposé :** sans framework ni bibliothèque externe, avec la police sans empattement (par exemple Inter, licence libre) incluse dans le projet plutôt que chargée depuis Google Fonts, pour que le PDF sorte toujours pareil et que rien ne parte chez un tiers.

2. **L'hébergement** : il envoie la page à Chrome quand le consultant clique sur son favori, et à un confrère qui ouvre le lien. Il ne reçoit jamais de devis, de réglages ni de coordonnées. Il tourne chez GitHub.
   *Technique :* GitHub Pages, adresse `https://<compte>.github.io/devis-3-minutes/`, publiée depuis la branche `main` du projet `devis-3-minutes`. **Supposé :** la page se trouve à la racine du projet.

3. **La mémoire de la page** : elle garde la liste des devis, les réglages et le compteur de numéros. Elle se trouve sur le disque de l'ordinateur, dans le profil Chrome du consultant, et elle est attachée à l'adresse de la page.
   *Technique :* `localStorage` de Chrome pour l'origine `https://<compte>.github.io`. **Supposé :** toutes les clés sont préfixées par `devis-3-minutes`, parce que les autres projets GitHub Pages du même compte partagent cette origine. La page demande aussi à Chrome, sans rien afficher, de ne pas effacer ces données de lui-même (`navigator.storage.persist()`). Cette demande ne protège pas contre un effacement manuel.

4. **La fabrique du PDF** : elle transforme l'aperçu en fichier PDF que le consultant range dans le dossier de son choix. Elle tourne dans Chrome.
   *Technique :* fenêtre d'impression de Chrome (`window.print()`, « Enregistrer au format PDF ») et styles d'impression (`@media print`, `@page { size: A4 }`, en-tête du tableau répété, `break-inside: avoid`). Le nom de fichier proposé vient du titre de la page (`document.title` = « <numéro> - <client> »), placé juste avant l'impression. **Supposé, à vérifier pendant la construction :** Chrome utilise bien ce titre comme nom de fichier, et le pied « <numéro> — page x/y » peut s'écrire dans les marges de page CSS (`@page` margin boxes, Chrome 131 et plus) sans que Chrome ajoute ses propres en-têtes et pieds de page.

5. **Le projet de code** : il garde le code de la page et les notes de projet (idee.md, decisions.md, architecture.md…). Une copie est sur l'ordinateur du consultant, une autre chez GitHub. Tout y est public (Q31).
   *Technique :* dépôt Git local, poussé vers le dépôt public GitHub `devis-3-minutes` du compte du consultant.

6. **La messagerie du consultant** envoie le PDF et garde les devis envoyés, qui servent d'archive. Elle ne fait pas partie de la page.

## Trajet

La soirée du mardi 6 octobre 2026 : dupliquer un devis puis sortir le PDF.

1. Le consultant clique sur son favori dans Chrome. **L'hébergement** (GitHub Pages) envoie la page à Chrome, et rien d'autre ne transite.
2. **La page** lit la liste et les réglages dans **la mémoire de la page** (`localStorage`) et affiche la liste, du plus récent au plus ancien.
3. Il clique **Dupliquer** sur DEV-2026-019 (Karma SAS). **La page** crée DEV-2026-022 :
   - date du jour et validité par défaut ;
   - bloc client vide ;
   - lignes, TVA, remise et acompte copiés, lignes teintées « à relire » ;
   - coordonnées et conditions reprises des réglages actuels.

   Elle l'enregistre dans **la mémoire de la page**, puis de nouveau à chaque frappe.
4. Il tape le client, coche une ligne, réécrit le détail signalé en rouge parce qu'il contient « Karma », change une quantité et supprime une ligne après confirmation. **La page** recalcule en centimes et met l'aperçu A4 à jour à chaque frappe.
5. Il clique **Exporter en PDF**. **La page** voit que l'adresse du client manque : elle refuse, liste le manque et entoure la case en rouge. Il la remplit.
6. Il clique de nouveau. **La page** signale les lignes encore à relire, s'il en reste, sans bloquer. Elle met le titre « DEV-2026-022 - Studio Lune » et ouvre **la fabrique du PDF** (fenêtre d'impression de Chrome). Il enregistre le fichier dans son dossier Devis.
7. Il joint le PDF dans **sa messagerie** et l'envoie. De retour dans la liste, il passe le statut à « Envoyé ». **La page** l'enregistre dans **la mémoire de la page**.

## Données

| Ce qui est gardé | Où | Si c'est perdu |
|---|---|---|
| La liste des devis. Chaque devis garde : numéro, date, validité, statut, client, lignes, taux de TVA, remise, acompte, conditions, copie des coordonnées du jour de sa création, repères « à relire » et, pour une copie, le nom de l'ancien client à signaler. | Mémoire de la page : Chrome, profil du consultant, disque de son ordinateur, attachée à l'adresse `https://<compte>.github.io`. | La liste, les brouillons et les statuts disparaissent, sans restauration possible (accepté en Q1). Les devis envoyés restent sous forme de PDF dans ses e-mails. |
| Les réglages : coordonnées, SIRET, taux, acompte et validité habituels, modèle de conditions, prochain numéro. | Même endroit. | La page rouvre les réglages comme à la première fois. Il ressaisit ses informations et règle « prochain numéro » d'après le dernier devis retrouvé dans ses e-mails, pour ne pas redonner un numéro déjà envoyé. |
| Les PDF | Le dossier qu'il choisit sur son ordinateur, et les e-mails envoyés. | Hors de la page. La messagerie reste l'archive. |
| Le code et les notes de projet | Son ordinateur et le dépôt public GitHub. | Chaque copie permet de retrouver l'autre. Si les deux sont perdues, la page ne s'ouvre plus en ligne, mais ses devis restent dans Chrome. |
| Les devis d'essai tapés pendant la construction | Chrome, à l'adresse locale `http://localhost:8000`, séparée de l'adresse en ligne. | Sans importance : ils ne passent jamais dans la vraie liste. |

Ce qui efface la vraie liste :
- « Effacer les données de navigation » avec « Cookies et données des sites » coché ;
- un réglage Chrome qui efface les données des sites à la fermeture ;
- un autre profil Chrome ou un autre ordinateur, où la liste est vide ;
- un changement d'adresse : renommer le compte GitHub ou le projet `devis-3-minutes`, ou passer à un nom de domaine. L'adresse ne changera pas.

## Comptes et secrets

- **Compte GitHub** : il appartient au consultant. Plan gratuit, sans carte bancaire. Il le crée au moment de la mise en ligne. Le nom du compte fait partie de l'adresse et ne doit plus jamais changer.
- **Projet GitHub `devis-3-minutes`** : public, dans ce compte.
- **Secret — jeton de connexion GitHub CLI** : il autorise son ordinateur à publier le projet sur son compte. Créé par `gh auth login` (GitHub CLI, déjà installé), il est gardé par GitHub CLI sur son ordinateur (trousseau du système ou fichier de configuration de `gh`). Il n'est jamais écrit dans le projet.
- **Aucun autre secret.** La page n'utilise ni clé ni service payant. Le SIRET et les coordonnées ne sont pas des secrets. Ils restent dans la mémoire de la page et ne sont jamais dans le projet public.

## Coût

- **0 € par mois**, sans carte bancaire. GitHub Pages est gratuit pour un projet public.
- **Limites du plan gratuit** : site publié de 1 Go au plus, environ 100 Go de trafic par mois (limite souple). **Supposé :** la page pèse moins de 1 Mo, police comprise, soit plusieurs milliers d'ouvertures par jour sous la limite.
- **Alerte avant de payer : aucune n'est nécessaire.** Aucune pièce n'est payante et aucune carte n'est enregistrée : le dépassement d'une limite ne peut pas être facturé. GitHub préviendrait par e-mail. La seule façon de payer serait un choix volontaire, par exemple passer le projet en privé avec GitHub Pro à 4 $ par mois, écarté en Q31.

## En local

Pendant la construction, tout se lance et s'essaie sur l'ordinateur, sans compte GitHub ni publication.

- **La page** : **Supposé :** servie par un petit serveur local lancé depuis le dossier du projet (`python3 -m http.server 8000`, Python 3.12 déjà installé), puis ouverte dans Chrome à `http://localhost:8000`. Ce serveur tient la place de GitHub Pages. En dépannage, le fichier peut aussi s'ouvrir directement dans Chrome : l'enregistrement dans la mémoire de Chrome fonctionne ainsi (vérifié sur Chrome 151), avec une mémoire encore séparée de celle de `localhost:8000` et de l'adresse en ligne.
- **Les calculs** : **Supposé :** vérifiés par des tests automatiques lancés avec Node.js (v24, déjà installé, `node --test`), sur des exemples chiffrés comme celui de la journée : 2 × 450 + 3 × 450, remise 10 %, TVA 20 %, acompte 30 %, soit TTC 2 430,00 et reste à payer 1 701,00. Les cas 0 % et 10 % sont aussi testés.
- **La mémoire de la page** : c'est celle de Chrome pour `localhost:8000`, séparée de l'adresse en ligne. On la vide pour rejouer une première ouverture.
- **La fabrique du PDF** : même fenêtre d'impression de Chrome qu'en ligne. **Supposé :** le rendu A4 et le passage sur deux pages se vérifient aussi automatiquement avec Chrome sans fenêtre (`google-chrome --headless --print-to-pdf`, Chrome 151 installé).
- **L'hébergement** : il ne peut pas tourner en local. Le serveur local le remplace, et l'adresse réelle n'est essayée qu'à la livraison.

## À faire à la main

- [x] Imprimer la fiche de contrôle en 5 points (decisions.md, Q25), la poser à côté du clavier et la cocher pour chaque devis Word envoyé jusqu'à la mise en service. *avant la construction* *confirmé par la personne*
- [x] Noter le numéro du dernier devis Word envoyé, pour régler « prochain numéro ». *avant la livraison* *confirmé par la personne*
- [x] Rassembler ses coordonnées exactes : nom, adresse, SIRET, e-mail, téléphone et numéro de TVA intracommunautaire s'il en a un. *avant la livraison* *confirmé par la personne*
- [x] Créer le compte GitHub sur github.com (plan Free, sans carte), confirmer l'adresse e-mail et choisir un nom de compte définitif, qui fera partie de l'adresse de la page. *avant la livraison* — vérifié : compte Karnonson, confirmé définitif par la personne
- [x] Connecter l'ordinateur à ce compte : taper `! gh auth login` dans Claude Code, puis choisir GitHub.com, HTTPS et la connexion par le navigateur. *avant la livraison* — vérifié : GitHub CLI connecté à Karnonson
- [x] Dans Chrome, vérifier que les données des sites ne sont pas effacées à la fermeture : Paramètres → Confidentialité et sécurité → Paramètres des sites → Paramètres de contenu supplémentaires → Données des sites sur l'appareil → « Autoriser les sites à enregistrer des données sur votre appareil ». Vérifier aussi qu'aucune extension de nettoyage n'efface les données des sites. *avant la livraison* *confirmé par la personne*
- [x] Choisir le profil Chrome où il fera toujours ses devis, celui qui recevra le favori. *avant la livraison* *confirmé par la personne*

## Écarté

| Installation | Pourquoi pas |
|---|---|
| Dossier sur l'ordinateur, page ouverte par un favori vers le fichier | Aucun compte et fonctionne sans internet. Mais pas de lien à donner aux confrères, qui devraient recevoir le dossier, et sous Firefox la liste se perd si le fichier est déplacé (Q29). |
| Cloudflare Pages | Gratuit, sans carte, projet privé possible. Le consultant préfère GitHub Pages, qu'on lui a conseillé, et le projet public ne le gêne pas (Q29, Q31). |
| Dossier sur l'ordinateur plus copie en ligne pour les confrères | Un compte en plus et une publication à refaire à chaque version, pour rien de plus que la page en ligne seule (Q29). |
| Projet privé sur GitHub Pro | 4 $ par mois avec une carte, contre la règle « rien à payer » et sans rien de sensible à cacher (Q31). |
| Page utilisable hors ligne (service worker) | Travail et bugs en plus. Il faut internet pour envoyer le devis de toute façon (Q32). |
| PDF fabriqué par une bibliothèque (html2pdf, jsPDF, pdfmake) | Texte en image flou ou mise en page rigide, et page plus lourde. La fenêtre d'impression donne le rendu le plus net (Q27). |
| Serveur, base de données ou synchronisation entre ordinateurs | Contraire à la règle d'idee.md (ni serveur ni abonnement). Un seul ordinateur sert aux devis (Q30). |
