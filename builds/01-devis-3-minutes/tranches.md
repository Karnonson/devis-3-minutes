# Tranches — Devis 3 minutes

Chaque tranche se construit et s'essaie sur l'ordinateur, page servie à `http://localhost:8000` et ouverte dans Chrome, comme le dit **En local** dans `architecture.md`. La mise en ligne n'est pas une tranche.

## 01 — Taper un devis et sortir son PDF

**À construire :** le consultant ouvre la page, clique « Nouveau devis », tape un client et ses lignes à gauche (en ajouter, les remettre dans l'ordre, en supprimer une), voit à droite l'aperçu A4 se remplir à chaque frappe avec le total de chaque ligne, le total HT, une TVA fixe à 20 % et le total TTC, puis clique « Sortir le PDF » : la fenêtre d'impression de Chrome s'ouvre avec le bon nom de fichier. Rien n'est encore gardé : un rechargement repart de zéro, et le numéro affiché est toujours le premier de l'année.
**Bloqué par :** rien, peut démarrer.
**Fait quand :**
- [x] L'écran et l'aperçu ont l'allure de **Apparence** dans `spec.md` : net, calme, pro ; fond blanc, texte bleu nuit, un seul accent vert sapin pour les boutons et le total TTC ; police sans empattement sobre ; aucune image ni logo ; esprit facture Stripe.
- [x] Un nouveau devis s'ouvre avec une ligne vide prête à remplir, sans cliquer d'abord. *(story 21)*
- [x] La saisie est à gauche, l'aperçu A4 à droite, et l'aperçu change à chaque frappe. *(story 23)*
- [x] Le bloc client se remplit avec nom, contact et adresse, le contact pouvant rester vide. *(story 24)*
- [x] Chaque ligne a un titre court, affiché en gras, et un détail facultatif sur quelques lignes, affiché plus petit dessous. *(story 25)*
- [x] En tapant 2 et 450, le total de la ligne affiche 900,00 € sans rien calculer. *(story 26)*
- [x] « Ajouter une ligne » permet de composer un devis de 6 lignes. *(story 29)*
- [x] Les flèches haut et bas déplacent une ligne, et l'aperçu suit l'ordre. *(story 30)*
- [x] Supprimer une ligne demande une confirmation ; refuser la confirmation garde la ligne. *(story 31)*
- [x] Tous les montants s'affichent au format « 1 800,00 € ». *(story 39)*
- [x] « Sortir le PDF » ouvre la fenêtre d'impression de Chrome, qui propose « DEV-2026-001 - Acme SARL.pdf », et on choisit soi-même le dossier. *(story 58)*
- [x] Le PDF enregistré est un A4 sobre et net, sans image ni logo, identique à l'aperçu. *(story 64)*
- [x] Sur l'aperçu et le PDF, les coordonnées du client sont sous l'en-tête, à droite. *(story 66)*
- [x] Le tableau a les colonnes Prestation, Qté, PU HT, Total HT, avec le titre en gras et le détail dessous. *(story 67)*

**Choisi :**
- Tant que la liste n'existe pas (tranche 02), l'accueil n'est qu'une barre avec « Nouveau devis » et une phrase « Cliquez sur « Nouveau devis » pour commencer. ».
- La confirmation avant de supprimer une ligne est la boîte de dialogue de Chrome (« Supprimer la ligne « <titre> » ? »), sans fenêtre dessinée dans la page.
- Deux marges de page CSS vides (`@top-right`, `@bottom-right`) empêchent Chrome d'imprimer sa date, son titre, son adresse et son numéro de page : vérifié dans la vraie fenêtre d'impression. La tranche 07 y mettra « <numéro> — page x/y ».
- Police Inter en deux graisses (normale et demi-grasse, woff2) copiée dans `fonts/` avec sa licence OFL ; la page pèse 368 Ko en tout.
- Les montants utilisent des espaces insécables (« 1 800,00 € » ne se coupe jamais) et des chiffres à chasse fixe.
- Une quantité ou un prix illisible compte pour 0,00 € dans les totaux, en attendant le contrôle de saisie de la tranche 06.
- Sans nom de client, le titre proposé à l'impression est le numéro seul (la tranche 06 refusera ce cas).
- Les exemples grisés dans les cases (« Atelier de cadrage »…) n'apparaissent que sur la première ligne.
- L'aperçu garde la taille A4 réelle et se réduit (zoom) si la colonne de droite est trop étroite ; il revient à 100 % pour l'impression.

**Pour lancer :** `python3 -m http.server 8000` depuis le dossier du projet, puis ouvrir `http://localhost:8000` dans Chrome. Tests de calcul : `node --test`.
**Fichiers :** `index.html`, `styles.css`, `app.js`, `calc.js`, `tests/calc.test.js`, `fonts/Inter-Regular.woff2`, `fonts/Inter-SemiBold.woff2`, `fonts/LICENSE.txt`, `builds/01-devis-3-minutes/captures/01-accueil.png`, `01-nouveau-devis.png`, `01-six-lignes.png`, `01-fenetre-impression.png`, `01-pdf.png`.
**Audit :** fusionner, `audits/01.md` — les 14 lignes Fait quand tiennent dans la page pilotée dans Chrome, `node --test` passe, rien hors de la tranche.

## 02 — La liste des devis, gardée d'un jour à l'autre

**À construire :** la page s'ouvre sur la liste des devis. « Nouveau devis » donne le numéro suivant, tout s'enregistre à chaque frappe, un bouton ramène à la liste, un clic sur une ligne rouvre le devis, et tout est encore là après avoir fermé et rouvert Chrome. Le bouton « Réglages » est présent mais n'affiche encore qu'un écran « bientôt ». Le contrôle automatique de la page (Décisions de test, point 2) démarre ici et s'allonge à chaque tranche suivante.
**Bloqué par :** 01.
**Fait quand :**
- [x] La liste est la page d'accueil, avec « Réglages » et « Nouveau devis » en haut. *(story 11)*
- [x] Chaque ligne de la liste montre numéro, client, date, total TTC et statut, le dernier créé en haut. *(story 12)*
- [x] Liste vide : « Aucun devis » et le bouton « Nouveau devis ». *(story 13)*
- [x] Un devis sans nom de client apparaît comme « (sans client) » dans la liste. *(story 14)*
- [x] Un clic sur une ligne de la liste rouvre le devis, modifiable. *(story 15)*
- [x] Trois clics sur « Nouveau devis » donnent DEV-2026-001, DEV-2026-002, DEV-2026-003. *(story 19)*
- [x] Avec l'horloge de l'ordinateur passée en 2027, le devis suivant reçoit DEV-2027-001. *(story 22)*
- [x] Sans bouton « Enregistrer », un devis tapé puis Chrome fermé et rouvert revient intact. *(story 42)*
- [x] Depuis l'écran du devis, un bouton ramène à la liste. *(story 44)*
- [x] Page ouverte dans deux onglets : c'est la dernière saisie qui reste, sans message. *(story 62)*
- [x] Le contrôle automatique de la page, lancé depuis Node.js dans Chrome sans fenêtre et parti d'une mémoire vide, rejoue : nouveau devis, saisie, retour à la liste, rechargement, et vérifie ce qui reste affiché.

**Choisi :**
- La mémoire tient en deux clés, `devis-3-minutes:devis` (la liste) et `devis-3-minutes:compteur` (année et prochain numéro). Chaque frappe relit la liste avant d'y réécrire le devis ouvert : un devis créé dans un autre onglet n'est jamais écrasé, et pour un même devis la dernière saisie l'emporte.
- Le numéro est pris au clic sur « Nouveau devis » ; le compteur repart à 001 dès que l'année de l'horloge diffère de celle du compteur, et saute un numéro déjà présent dans la liste (jamais deux devis au même numéro).
- L'écran ouvert est dans l'adresse (`#DEV-2026-001`, `#reglages`) : un rechargement rouvre le même écran et le bouton Précédent de Chrome ramène à la liste. Une adresse sans devis connu ouvre la liste.
- Le bouton de retour est un lien « ← Liste des devis » en haut à gauche de l'écran du devis ; l'écran « bientôt » des réglages a le même.
- La date de la liste s'affiche « 15/09/2026 » ; le statut est une pastille grise « Brouillon ».
- La liste vide montre « Aucun devis » avec un second bouton « Nouveau devis » au milieu, en plus de celui de la barre.
- Toute la ligne de la liste est cliquable ; le numéro est aussi un lien, pour le clavier.
- Le contrôle automatique de la page est `tests/page.js`, lancé à part (`node --test tests/page.js`, environ 15 s) pour que `node --test` reste les seuls tests de calcul. Il pilote Chrome par son protocole de débogage avec le WebSocket de Node (`tests/chrome.js`), clics et frappes réels, profil neuf à chaque passage, et lance lui-même `python3 -m http.server 8000` si rien ne répond sur ce port. Il rejoue aussi les trois numéros, « (sans client) », Chrome fermé puis relancé sur le même profil, deux onglets, et 2027.
- L'horloge « passée en 2027 » est celle de Chrome, avancée depuis l'extérieur par le contrôle (`Emulation.setVirtualTimePolicy`) plutôt que celle du système, qui demanderait les droits d'administration.

**Pour lancer :** `python3 -m http.server 8000` depuis le dossier du projet, puis ouvrir `http://localhost:8000` dans Chrome. Tests de calcul : `node --test`. Contrôle automatique de la page : `node --test tests/page.js`.
**Fichiers :** `index.html`, `styles.css`, `app.js`, `tests/page.js`, `tests/chrome.js`, `builds/01-devis-3-minutes/captures/02-liste-vide.png`, `02-liste.png`, `02-devis-rouvert.png`, `02-reglages.png`.
**Audit :** fusionner, `audits/02.md` — les 11 lignes Fait quand tiennent dans la page pilotée dans Chrome, `node --test` et `node --test tests/page.js` passent, rien hors de la tranche.

## 03 — Réglages et première ouverture

**À construire :** à la toute première ouverture, la page montre les réglages avec une phrase d'accueil. Le consultant y tape une fois ses coordonnées, son SIRET et le prochain numéro, relit le modèle de conditions, et ses coordonnées sont recopiées dans chaque nouveau devis au moment de sa création, puis affichées sur l'aperçu. « Nouveau devis » renvoie vers les réglages tant qu'il manque l'essentiel.
**Bloqué par :** 02.
**Fait quand :**
- [x] Mémoire de `localhost:8000` vidée, la page s'ouvre sur les réglages avec une phrase d'accueil, les champs obligatoires signalés et le modèle de conditions déjà rempli. *(story 1)*
- [x] Tant que le nom, l'adresse ou le SIRET manquent, « Nouveau devis » renvoie vers les réglages. *(story 2)*
- [x] Les réglages acceptent nom suivi de « EI », adresse, SIRET, e-mail, téléphone et n° de TVA intracommunautaire, et un nouveau devis les affiche sans rien retaper. *(story 4)*
- [x] Le modèle de conditions pré-rempli se lit et se modifie dans les réglages. *(story 6)*
- [x] Une modification des réglages est encore là après rechargement, sans bouton. *(story 7)*
- [x] Sans n° de TVA intracommunautaire, l'aperçu n'a aucune case ni libellé vide à sa place. *(story 8)*
- [x] « Prochain numéro » réglé à 23 : le devis suivant reçoit DEV-2026-023. *(story 9)*
- [x] Dans une fenêtre de navigation privée de Chrome, la page s'ouvre sur des réglages vides, sans message d'erreur. *(story 60)*
- [x] La page demande à Chrome, à chaque ouverture et sans rien afficher, de garder ses données ; que Chrome l'accorde (stockage « persistant » dans l'onglet Application) dépend de ses propres critères et se regarde à la livraison, sur le favori du consultant. *(story 61)*
- [x] Après avoir vidé les données du site, les réglages reviennent comme à la première ouverture et le « prochain numéro » s'y règle. *(story 63)*
- [x] Un confrère qui ouvre la page dans un autre profil Chrome arrive sur des réglages vides et ne voit aucune donnée du consultant. *(story 72)*
- [x] Le contrôle automatique de la page rejoue aussi la première ouverture, le renvoi vers les réglages et leur saisie.

**Rectifié :**
- Avant : « La page demande à Chrome de garder ses données sans rien afficher ; l'onglet Application des outils de développement de Chrome montre le stockage du site comme persistant. »
- Après : « La page demande à Chrome, à chaque ouverture et sans rien afficher, de garder ses données ; que Chrome l'accorde (stockage « persistant » dans l'onglet Application) dépend de ses propres critères et se regarde à la livraison, sur le favori du consultant. »
- Pourquoi : la demande part bien, mais Chrome décide seul de l'accorder (favori, fréquentation du site) et la refuse sur un profil neuf à `localhost:8000`, même avec un favori posé dans le profil. La story 61 de `spec.md` ne demande que la demande discrète : elle reste telle quelle.

**Choisi :**
- La page s'ouvre sur les réglages, avec la phrase d'accueil, chaque fois qu'on l'ouvre sans écran dans l'adresse et qu'il manque le nom, l'adresse ou le SIRET : première ouverture, données effacées, autre profil, navigation privée. La phrase d'accueil disparaît quand ces trois champs sont remplis, à la prochaine ouverture des réglages (pas pendant la frappe, pour que rien ne saute sous le curseur).
- « Nouveau devis » renvoie vers les réglages sans message de plus : la phrase d'accueil explique, et le curseur est posé dans le premier champ essentiel vide. Aucun numéro n'est consommé par un renvoi.
- Les champs essentiels portent « obligatoire » à côté du libellé, comme « facultatif » ailleurs. Aucun contrôle de forme sur le SIRET, l'e-mail ou le téléphone : ils sont gardés tels que tapés.
- Les réglages tiennent dans une troisième clé, `devis-3-minutes:reglages`. « Prochain numéro » est un nombre (23) écrit dans `devis-3-minutes:compteur` pour l'année en cours ; dessous, « Prochain devis : DEV-2026-023. » montre le numéro qui sera vraiment donné, et signale s'il existe déjà dans la liste. Une saisie qui n'est pas un entier à partir de 1 est entourée en rouge et n'est pas enregistrée.
- Chaque nouveau devis garde une copie des coordonnées du jour de sa création, affichée en haut à gauche de l'aperçu : nom en gras, adresse, e-mail, téléphone, puis SIRET et n° de TVA intracommunautaire plus petits ; un champ vide n'imprime rien, libellé compris. Un devis créé avant cette tranche n'a pas de copie et garde un en-tête gauche vide.
- Texte du modèle de conditions : acompte à la commande et solde à réception de facture sous 30 jours ; pénalités à trois fois le taux d'intérêt légal et indemnité de 40 € pour les clients professionnels ; « Devis gratuit » et rappel de « Valable jusqu'au ». Il se lit et se modifie dans les réglages ; sa reprise sur le devis, comme la TVA, l'acompte et la validité habituels, est la tranche 05.
- La demande de conservation (`navigator.storage.persist()`) part à chaque ouverture de la page, sans rien afficher.
- Dans le contrôle automatique : la navigation privée est un contexte de navigation séparé de Chrome sans fenêtre (celui qu'utilise la navigation privée), le confrère un second profil neuf, et « vider les données du site » l'effacement de toutes les données de `http://localhost:8000` par le protocole de débogage. La demande de conservation est vue par un témoin posé sur `navigator.storage.persist`, à la frontière entre la page et Chrome. `tests/chrome.js` sait maintenant ouvrir un onglet privé, relever les erreurs JavaScript de la page et vider une case.

**Pour lancer :** `python3 -m http.server 8000` depuis le dossier du projet, puis ouvrir `http://localhost:8000` dans Chrome. Tests de calcul : `node --test`. Contrôle automatique de la page : `node --test tests/page.js` (environ 20 s).
**Fichiers :** `index.html`, `styles.css`, `app.js`, `tests/page.js`, `tests/chrome.js`, `builds/01-devis-3-minutes/captures/03-premiere-ouverture.png`, `03-renvoi-reglages.png`, `03-reglages-remplis.png`, `03-devis-coordonnees.png`.
**Audit :** fusionner, `audits/03.md` — les 12 lignes Fait quand tiennent dans la page pilotée dans Chrome (la ligne sur la conservation rectifiée à ce que Chrome permet), `node --test` et `node --test tests/page.js` passent, rien hors de la tranche.

## 04 — Remise, TVA et acompte, justes au centime

**À construire :** sur l'écran du devis, le consultant choisit la TVA (20, 10 ou 0 %), tape une remise et un acompte en pourcentage, et voit l'aperçu recalculer au centime la remise, le HT après remise, la TVA, le TTC, l'acompte et le reste à payer. Les nouveaux devis partent à 20 % de TVA et 30 % d'acompte en attendant que la tranche 05 les prenne dans les réglages.
**Bloqué par :** 01.
**Fait quand :**
- [x] Un seul taux de TVA se choisit pour tout le devis, parmi 20 %, 10 % et 0 %. *(story 32)*
- [x] À 0 % : plus de ligne TVA, « Total » au lieu de « Total TTC », mention « TVA non applicable, art. 293 B du CGI » sous les totaux, acompte calculé sur ce total. *(story 33)*
- [x] La remise se tape en pourcentage de 0 à 100 et s'applique au HT avant la TVA. *(story 34)*
- [x] Avec une remise, l'aperçu montre le pourcentage, son montant et « Total HT après remise » ; à 0 %, ces lignes disparaissent. *(story 35)*
- [x] L'acompte se tape en pourcentage de 0 à 100 du TTC après remise. *(story 36)*
- [x] Sous les totaux : « Acompte à la commande (30 %) » avec son montant, puis « Reste à payer » ; à 0 %, les deux lignes disparaissent. *(story 37)*
- [x] 2 × 450 + 3 × 450, remise 10 %, TVA 20 %, acompte 30 % donnent un TTC de 2 430,00 € et un reste à payer de 1 701,00 €, à l'écran comme dans les tests de calcul lancés par `node --test`, qui couvrent aussi 10 %, 0 %, les quantités décimales et les demi-centimes. *(story 38)*
- [x] Les totaux sont alignés à droite sur l'aperçu et le PDF, acompte et reste à payer compris. *(story 68)*

**Choisi :**
- La TVA se choisit sur trois boutons côte à côte « 20 % | 10 % | 0 % » dans un bloc « TVA, remise et acompte » sous les prestations ; le taux choisi est en bleu nuit, pour laisser le vert sapin au seul bouton « Sortir le PDF ».
- Remise et acompte se tapent dans deux cases « Remise (%) » et « Acompte (%) », décimales à deux chiffres acceptées (« 12,5 »). Gardées telles que tapées, comme les quantités : hors de 0 à 100 ou illisible, la case est entourée en rouge avec « Un pourcentage de 0 à 100. » et compte pour 0 % ; une case vide compte pour 0 % sans rouge.
- Les lignes de remise et d'acompte disparaissent selon le pourcentage tapé (0 %), pas selon le montant : sur un devis encore sans prix, « Remise 10 % −0,00 € » reste visible.
- Sur l'aperçu : « Remise 10 % » avec son montant précédé d'un signe moins (« −225,00 € »), puis « Total HT après remise » ; « Acompte à la commande (30 %) » et « Reste à payer » (en demi-gras) sous le total, un peu détachés ; la mention « TVA non applicable, art. 293 B du CGI » en petit, alignée à droite, sous tout le bloc des totaux (voir `a-trancher.md`).
- Un devis créé avant cette tranche s'ouvre à 0 % de remise et 30 % d'acompte ; son total dans la liste ne change pas.
- Le total TTC de la liste tient compte de la remise.
- Une case refusée restait bordée de vert tant que le curseur y était (réglages compris) : elle est maintenant rouge même sous le curseur.
- Le contrôle automatique de la page rejoue l'exemple de référence, 10 %, 0 %, acompte et remise à 0 %, les bornes, le rechargement et la liste, et mesure l'alignement à droite des montants à l'écran et dans la mise en page d'impression de Chrome.

**Pour lancer :** `python3 -m http.server 8000` depuis le dossier du projet, puis ouvrir `http://localhost:8000` dans Chrome. Tests de calcul : `node --test`. Contrôle automatique de la page : `node --test tests/page.js` (environ 20 s).
**Fichiers :** `calc.js`, `app.js`, `index.html`, `styles.css`, `tests/calc.test.js`, `tests/page.js`, `builds/01-devis-3-minutes/a-trancher.md`, `builds/01-devis-3-minutes/captures/04-depart.png`, `04-remise-tva-acompte.png`, `04-tva-0.png`, `04-sans-remise-ni-acompte.png`, `04-remise-refusee.png`, `04-pdf.png`.
**Audit :** fusionner, `audits/04.md` — les 8 lignes Fait quand tiennent dans la page pilotée dans Chrome et dans le PDF, `node --test` et `node --test tests/page.js` passent, rien hors de la tranche.

## 05 — Dates, validité, conditions et « Bon pour accord »

**À construire :** le devis est complet de haut en bas. En haut à droite : « DEVIS », numéro, date et « Valable jusqu'au <date> » calculé ; en bas : les conditions reprises du modèle et ajustables pour ce devis, puis le cadre « Bon pour accord ». Chaque nouveau devis recopie aussi la TVA, l'acompte, la validité et les conditions des réglages du jour, et ne bouge plus quand les réglages changent.
**Bloqué par :** 03, 04.
**Fait quand :**
- [x] TVA, acompte et validité habituels se règlent (20 %, 30 %, 30 jours au départ), et un nouveau devis part avec ces valeurs. *(story 5)*
- [x] Un changement de réglages ne modifie aucun devis existant, brouillon compris ; seul le devis créé ensuite prend les nouvelles coordonnées et conditions. *(story 10)*
- [x] Un nouveau devis s'ouvre en brouillon, daté du jour, avec validité, TVA et acompte habituels, 0 % de remise, les conditions du modèle et les coordonnées du jour. *(story 20)*
- [x] Date du devis et durée de validité se modifient, et « Valable jusqu'au <date> » se recalcule. *(story 40)*
- [x] Les conditions se modifient pour ce seul devis ; le modèle des réglages reste inchangé. *(story 41)*
- [x] En haut de l'aperçu : coordonnées et SIRET à gauche ; « DEVIS », numéro, date et « Valable jusqu'au <date> » à droite. *(story 65)*
- [x] Après les totaux : les conditions, puis un cadre « Bon pour accord » avec date et signature. *(story 69)*

**Choisi :**
- Réglages : un bloc « Valeurs habituelles » entre les coordonnées et la numérotation, avec la TVA sur les trois mêmes boutons « 20 % | 10 % | 0 % », « Acompte (%) » et « Validité (jours) ». Acompte et validité sont gardés tels que tapés, entourés en rouge hors de 0 à 100 % ou de 1 à 365 jours entiers, et recopiés tels quels par le devis suivant.
- Un nouveau devis garde sa propre copie de la validité, de la TVA, de l'acompte et des conditions du jour, comme des coordonnées : les réglages ne sont lus qu'au clic sur « Nouveau devis ».
- Écran du devis : un bloc « Date, validité et conditions » en bas de la saisie, avec la date dans le sélecteur de date de Chrome, la durée en jours, « Valable jusqu'au <date>. » écrit dessous, et les conditions dans une grande case.
- Une date incomplète est entourée en rouge et n'est pas enregistrée : l'aperçu et la liste gardent la dernière date complète. Une durée refusée reste telle que tapée, en rouge avec « Un nombre de jours, de 1 à 365. », et l'aperçu n'affiche plus « Valable jusqu'au » tant qu'elle n'est pas corrigée.
- « Valable jusqu'au » est la date du devis plus la durée en jours de calendrier (15/09/2026 + 30 → 15/10/2026), calcul couvert par `node --test` (fin de mois, année bissextile, bornes).
- En haut à droite de l'aperçu : « DEVIS », le numéro, « Date : 15/09/2026 » et « Valable jusqu'au 15/10/2026 », au format de la liste.
- Après les totaux, et la mention art. 293 B à 0 % : « Conditions » en petit titre et leur texte en petit, puis le cadre « Bon pour accord » à droite, de la largeur du bloc client, avec deux cases vides « Date » et « Signature » (voir `a-trancher.md`). Le cadre ne se coupe pas entre deux pages. Des conditions vidées n'impriment ni titre ni texte.
- Un devis créé avant cette tranche s'ouvre avec 30 jours de validité et sans conditions ; rien n'est pris dans les réglages actuels.
- Le contrôle automatique de la page rejoue les valeurs de départ des réglages, le nouveau devis complet, la date et la durée modifiées puis refusées, une fin de mois, les conditions ajustées pour un seul devis, et un changement de réglages qui laisse deux devis existants identiques à l'écran ; il mesure aussi la disposition (coordonnées à gauche, « DEVIS » à droite, totaux, conditions puis cadre) à l'écran et en mise en page d'impression. La date se tape au clavier après un clic sur son libellé, dans l'ordre jour, mois, année du Chrome de cet ordinateur ; `tests/chrome.js` sait maintenant taper touche par touche.

**Pour lancer :** `python3 -m http.server 8000` depuis le dossier du projet, puis ouvrir `http://localhost:8000` dans Chrome. Tests de calcul : `node --test`. Contrôle automatique de la page : `node --test tests/page.js` (environ 25 s).
**Fichiers :** `index.html`, `styles.css`, `app.js`, `calc.js`, `tests/calc.test.js`, `tests/page.js`, `tests/chrome.js`, `builds/01-devis-3-minutes/a-trancher.md`, `builds/01-devis-3-minutes/captures/05-reglages-valeurs.png`, `05-nouveau-devis-haut.png`, `05-nouveau-devis-bas.png`, `05-date-validite-modifiees.png`, `05-conditions-ajustees.png`, `05-validite-refusee.png`, `05-pdf.png`.
**Audit :** fusionner, `audits/05.md` — les 7 lignes Fait quand tiennent à l'écran et dans un PDF de deux pages, les deux contrôles passent.

## 06 — Saisie contrôlée et PDF refusé s'il manque quelque chose

**À construire :** une quantité ou un prix mal tapé est entouré en rouge. Quand le consultant clique « Sortir le PDF » avec un devis incomplet, la page refuse, liste ce qui manque et entoure les cases en rouge ; il complète et le PDF sort. Sortir le PDF ne touche jamais au statut.
**Bloqué par :** 02.
**Fait quand :**
- [x] Une quantité de 0,5 est acceptée ; 0, un nombre négatif ou 0,125 ne le sont pas. *(story 27)*
- [x] Un prix négatif ou à trois décimales, ou une quantité refusée, est entouré en rouge et compte comme manquant. *(story 28)*
- [x] « Sortir le PDF » est refusé sans nom ou adresse du client, sans aucune ligne, ou avec une ligne sans titre, quantité ou prix. *(story 54)*
- [x] En cas de refus, la page liste les manques et entoure les cases concernées en rouge ; une fois complétées, le PDF sort. *(story 55)*
- [x] Une ligne à 0,00 € ne bloque pas le PDF. *(story 56)*
- [x] Après la sortie du PDF, le statut du devis est inchangé dans la liste. *(story 59)*
- [x] Le contrôle automatique de la page rejoue un PDF refusé, la liste des manques, puis le PDF accepté une fois complété.

**Choisi :**
- Une quantité (plus de 0, deux décimales au plus) ou un prix (0 ou plus, deux décimales au plus) mal tapé est entouré en rouge dès la frappe, avec sous la ligne « Quantité : plus de 0, deux décimales au plus. » ou « Prix : 0 ou plus, deux décimales au plus. » ; il reste tel que tapé et compte pour 0,00 € dans les totaux. Une case encore vide n'est pas rouge avant un clic sur « Sortir le PDF ».
- Au refus, un encadré « Le PDF n'est pas sorti. À compléter : » s'ouvre en haut de la saisie (qui remonte en haut), avec les manques dans l'ordre de la saisie : « Nom du client », « Adresse du client », « Au moins une ligne de prestation », « Ligne 2 : titre », « Ligne 2 : quantité », « Ligne 2 : prix à corriger »… Chaque manque est cliquable et met le curseur dans sa case. Sans aucune ligne, c'est le bouton « Ajouter une ligne » qui est bordé de rouge.
- Après un refus, la liste et le rouge suivent chaque frappe (une ligne ajoutée apparaît aussitôt avec ses cases vides en rouge) ; l'encadré disparaît dès que tout est complet, et on reclique sur « Sortir le PDF ». Quitter le devis efface l'encadré ; rien n'est enregistré.
- Une remise ou un acompte hors de 0 à 100, une validité hors de 1 à 365 jours ou une date incomplète bloquent aussi le PDF (« Remise à corriger »…) : toute case rouge du devis bloque (voir `a-trancher.md`).
- Le titre proposé à l'impression est toujours « <numéro> - <client> » : le cas « numéro seul » de la tranche 01 ne peut plus arriver.
- Ctrl+P ou le menu Imprimer de Chrome ne passent pas par ce contrôle : seul le bouton « Sortir le PDF » est vérifié.
- Le contrôle automatique voit l'impression par un témoin posé sur `window.print` (frontière entre la page et Chrome), qui relève le titre de la page à ce moment ; il rejoue aussi les quantités et prix refusés, la liste sans aucune ligne, une ligne ajoutée après le refus, un clic sur un manque et une remise refusée. Les calculs couvrent la lecture de la quantité et du prix (`node --test`). Essayés en plus à la main dans Chrome sans fenêtre : date effacée, validité 400 et acompte « abc » listés, puis PDF accepté.

**Pour lancer :** `python3 -m http.server 8000` depuis le dossier du projet, puis ouvrir `http://localhost:8000` dans Chrome. Tests de calcul : `node --test`. Contrôle automatique de la page : `node --test tests/page.js` (environ 25 s).
**Fichiers :** `index.html`, `styles.css`, `app.js`, `calc.js`, `tests/calc.test.js`, `tests/page.js`, `builds/01-devis-3-minutes/a-trancher.md`, `builds/01-devis-3-minutes/captures/06-saisie-refusee.png`, `06-pdf-refuse.png`, `06-manques-en-cours.png`, `06-pdf-accepte.png`.
**Audit :** fusionner, `audits/06.md` — les 7 lignes Fait quand tiennent dans la page pilotée de l'extérieur, cas en plus compris, et les deux contrôles passent.

## 07 — Un devis de plusieurs pages, lisible en noir et blanc

**À construire :** un devis assez long pour tenir sur deux pages sort proprement : en-tête du tableau répété, aucune ligne coupée, totaux restés avec le « Bon pour accord », « <numéro> — page x/y » sur chaque page, et un rendu qui reste lisible imprimé en noir et blanc. Le contrôle automatique du PDF (Décisions de test, point 3) le vérifie.
**Bloqué par :** 05.
**Fait quand :**
- [x] Sur un devis de deux pages : en-tête du tableau sur chaque page, aucune ligne coupée, totaux et « Bon pour accord » ensemble, « DEV-2026-0xx — page 1/2 » puis « page 2/2 », sans en-tête ni pied ajouté par Chrome. *(story 70)*
- [x] Imprimé ou prévisualisé en noir et blanc, le devis reste lisible, total compris. *(story 71)*
- [x] Le contrôle automatique du PDF, avec Chrome sans fenêtre, sort un devis court puis un devis de deux pages et vérifie l'A4, l'ordre Stripe, les montants et le découpage des pages ; le contrôle de la page vérifie que le titre « <numéro> - <client> » est bien en place à l'ouverture de l'impression.

**Choisi :**
- Le pied « DEV-2026-001 — page 1/2 » est écrit en bas à droite de chaque page, en petit gris (8 pt), dans la marge de page CSS `@bottom-right` que la tranche 01 laissait vide : la page y pose le numéro à l'ouverture du devis, Chrome compte les pages. Un devis d'une page porte « page 1/1 ». L'aperçu à l'écran, une seule feuille continue, ne montre ni pied ni coupure de page.
- Totaux, mention art. 293 B, conditions et « Bon pour accord » forment un seul bloc qui ne se coupe jamais : s'il ne tient pas sous la dernière ligne du tableau, il passe entier sur la page suivante, qui commence alors par les totaux, sans en-tête de tableau puisqu'elle ne porte aucune ligne. Emmener aussi la dernière ligne avec les totaux (`break-before: avoid`) a été essayé : Chrome coupe alors le bloc dans certains devis. Des conditions plus longues qu'une page coupent forcément le bloc.
- Le noir et blanc n'a rien demandé de plus : sans fond coloré, chaque texte de la feuille garde un contraste d'au moins 4,5:1 sur le blanc une fois passé en gris (le total TTC vert sapin 7,9:1), et le total reste en demi-gras, plus grand, sous un filet bleu nuit.
- Le contrôle automatique du PDF est `tests/pdf.js`, lancé à part (`node --test tests/pdf.js`, environ 45 s). Il remplit réglages et devis dans la page par clics et frappes, clique « Sortir le PDF », puis fait imprimer la page en PDF par Chrome sans fenêtre (`Page.printToPDF`, avec les en-têtes et pieds de page de Chrome demandés, comme la case cochée par défaut de la fenêtre d'impression). Il lit le PDF avec `pdftotext` (poppler-utils, déjà installé sur l'ordinateur, rien d'ajouté) : pages, textes et positions. Quatre devis : court (1 page, exemple de référence), 12 lignes (2 pages, tableau sur les deux), 7 lignes (totaux qui tomberaient en bas de la page 1), 20 lignes (fin passée entière en page 3) ; plus le contraste de chaque texte imprimé. `GARDER_PDF=<dossier>` garde les PDF pour les regarder.
- Le contrôle de la page relève le titre au moment où Chrome ouvre l'impression (événement `beforeprint`, témoin posé à la frontière) après avoir changé le nom du client : « DEV-2026-026 - Atelier Soleil ».
- Essayé en plus dans la vraie fenêtre d'impression de Chrome (avec fenêtre, profil neuf, devis de 12 lignes) : aperçu « page 1/2 » puis « page 2/2 », aucun en-tête ni pied de Chrome alors que « En-têtes et pieds de page » est coché, et en « Noir et blanc » la page 2 reste lisible, total compris (captures `07-fenetre-impression.png`, `07-noir-et-blanc.png`). Des conditions de 90 lignes sortent sur 3 pages sans texte perdu.

**Pour lancer :** `python3 -m http.server 8000` depuis le dossier du projet, puis ouvrir `http://localhost:8000` dans Chrome. Tests de calcul : `node --test`. Contrôle automatique de la page : `node --test tests/page.js` (environ 25 s). Contrôle automatique du PDF : `node --test tests/pdf.js` (environ 45 s, demande `pdftotext`).
**Fichiers :** `app.js`, `styles.css`, `tests/page.js`, `tests/pdf.js`, `builds/01-devis-3-minutes/captures/07-pdf-court.png`, `07-pdf-deux-pages.png`, `07-totaux-en-page-2.png`, `07-fin-en-page-3.png`, `07-fenetre-impression.png`, `07-noir-et-blanc.png`.
**Audit :** fusionner, `audits/07.md` — les 3 lignes Fait quand tiennent dans les PDF sortis (1, 2 et 3 pages, en gris compris), les trois contrôles passent.

## 08 — Statuts et suppression d'un devis

**À construire :** le consultant passe un devis de « Brouillon » à « Envoyé », « Accepté » ou « Refusé » depuis la liste ou l'écran du devis, supprime un devis après confirmation, et rouvre et modifie n'importe quel devis, quel que soit son statut.
**Bloqué par :** 02.
**Fait quand :**
- [x] Le statut (brouillon, envoyé, accepté, refusé) se change directement dans la liste, et reste après rechargement. *(story 16)*
- [x] « Supprimer » sur n'importe quel devis, quel que soit son statut, demande une confirmation puis le retire de la liste. *(story 17)*
- [x] Après suppression de DEV-2026-003, le devis suivant reçoit un numéro jamais donné, et le supprimé ne revient pas. *(story 18)*
- [x] Le statut se change aussi depuis l'écran du devis. *(story 43)*
- [x] Un devis « Envoyé » se rouvre et se modifie sans confirmation, et garde son numéro et son statut. *(story 45)*
- [x] Rien dans la liste ni sur le devis n'indique qu'un devis envoyé a été modifié. *(story 46)*
- [x] Le contrôle automatique de la page rejoue un changement de statut et une suppression, puis un rechargement.

**Choisi :**
- Le statut est un menu déroulant de Chrome en forme de pastille, le même dans la colonne « Statut » de la liste et dans la barre de l'écran du devis (« Statut » à côté du numéro). Changer le statut dans la liste n'ouvre pas le devis. Le statut n'est jamais imprimé : l'aperçu et le PDF ne changent pas.
- Pastilles sans vert sapin, gardé aux boutons et au TTC : « Brouillon » gris, « Envoyé » bleu pâle, « Accepté » bleu nuit plein, « Refusé » blanc bordé de gris (voir `a-trancher.md`).
- « Supprimer » est un lien discret en bout de chaque ligne de la liste, rouge au survol, et seulement là (voir `a-trancher.md`). La confirmation est la boîte de dialogue de Chrome : « Supprimer le devis DEV-2026-003 (Acme SARL) ? Ce numéro ne sera plus jamais donné. » ; la refuser garde le devis.
- Les numéros supprimés sont gardés dans une quatrième clé, `devis-3-minutes:supprimes`, et sautés comme ceux de la liste : même avec « Prochain numéro » réglé plus bas, un numéro supprimé n'est pas redonné, et les réglages l'écrivent (« Prochain devis : DEV-2026-005 (DEV-2026-003 a été supprimé). »). Après des données effacées, cette mémoire part avec le reste, comme le prévoit la story 63.
- Un devis supprimé dans un onglet ramène à la liste l'autre onglet où il était ouvert, et une frappe arrivée entre-temps ne le recrée pas ; son adresse (`#DEV-2026-003`) ouvre la liste.
- Le contrôle automatique rejoue les quatre statuts dans la liste puis depuis le devis, avec rechargement ; un devis « Envoyé » modifié sans boîte de dialogue, même pastille ensuite ; une confirmation refusée puis la suppression d'un devis de chaque statut, rechargement après chacune ; 001, 002, 003, 003 supprimé, 004, puis « Prochain numéro » réglé à 3 qui donne 005 ; et la suppression vue d'un second onglet. Le menu se choisit comme une personne : clic, flèches, Entrée (`tests/chrome.js` sait maintenant le faire). La boîte de confirmation de Chrome ne se capture pas sans fenêtre : son texte est relevé par le contrôle.

**Pour lancer :** `python3 -m http.server 8000` depuis le dossier du projet, puis ouvrir `http://localhost:8000` dans Chrome. Tests de calcul : `node --test`. Contrôle automatique de la page : `node --test tests/page.js` (environ 30 s). Contrôle automatique du PDF : `node --test tests/pdf.js` (environ 45 s, demande `pdftotext`).
**Fichiers :** `index.html`, `styles.css`, `app.js`, `tests/page.js`, `tests/chrome.js`, `builds/01-devis-3-minutes/a-trancher.md`, `builds/01-devis-3-minutes/captures/08-liste-statuts.png`, `08-devis-statut.png`, `08-apres-suppression.png`, `08-numero-supprime.png`.
**Audit :** fusionner, `audits/08.md` — les 7 lignes Fait quand tiennent dans la page pilotée (statuts, suppression, numéro jamais redonné, second onglet), les trois contrôles passent.

## 09 — Dupliquer un devis, lignes « à relire »

**À construire :** « Dupliquer » sur une ligne de la liste ouvre aussitôt une copie sous un nouveau numéro, client vidé, lignes teintées « à relire » ; au PDF, la page prévient des lignes encore à relire sans bloquer.
**Bloqué par :** 05, 06.
**Fait quand :**
- [ ] Tant que le nom, l'adresse ou le SIRET manquent dans les réglages, « Dupliquer » renvoie vers les réglages. *(story 3)*
- [ ] La copie reçoit un nouveau numéro, en brouillon, datée du jour, avec la validité par défaut des réglages. *(story 47)*
- [ ] La copie a un bloc client vide, garde lignes, prix, TVA, remise et acompte, et prend coordonnées et conditions des réglages actuels. *(story 48)*
- [ ] La copie s'ouvre directement après le clic. *(story 49)*
- [ ] Chaque ligne copiée est teintée « à relire » jusqu'à ce qu'on la modifie ou la coche d'un clic. *(story 50)*
- [ ] Le repère « à relire » est encore là après fermeture et réouverture de la page. *(story 51)*
- [ ] Au PDF, s'il reste des lignes à relire, la page le signale et le PDF sort quand même. *(story 57)*
- [ ] Le contrôle automatique de la page rejoue une duplication, une ligne cochée, une ligne modifiée et le rappel au PDF.

## 10 — Le nom de l'ancien client signalé, et la soirée du 6 octobre en entier

**À construire :** dans une copie, le nom de l'ancien client apparaît en rouge partout où il traîne, jusqu'à ce qu'il ait disparu. Avec cette dernière pièce, le trajet du mardi 6 octobre se déroule de bout en bout et se rejoue automatiquement.
**Bloqué par :** 08, 09.
**Fait quand :**
- [ ] Le nom de l'ancien client sans sa forme juridique (« Karma » pour « Karma SAS ») est signalé en rouge, quelle que soit la casse, dans le titre ou le détail des lignes de la copie, jusqu'à ce qu'il n'y figure plus. *(story 52)*
- [ ] Copie d'un devis sans nom de client : rien n'est signalé en rouge. *(story 53)*
- [ ] Le trajet du mardi 6 octobre (`architecture.md`, **Trajet**) se rejoue automatiquement dans Chrome sans fenêtre, en partant d'une première ouverture : duplication de DEV-2026-019 Karma SAS en DEV-2026-022, détail contenant « Karma » signalé puis réécrit, ligne supprimée, adresse oubliée refusée au PDF, titre « DEV-2026-022 - Studio Lune », statut « Envoyé » gardé après rechargement.

## Non placé

Aucune story.
