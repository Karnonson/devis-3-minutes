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

## 02 — La liste des devis, gardée d'un jour à l'autre

**À construire :** la page s'ouvre sur la liste des devis. « Nouveau devis » donne le numéro suivant, tout s'enregistre à chaque frappe, un bouton ramène à la liste, un clic sur une ligne rouvre le devis, et tout est encore là après avoir fermé et rouvert Chrome. Le bouton « Réglages » est présent mais n'affiche encore qu'un écran « bientôt ». Le contrôle automatique de la page (Décisions de test, point 2) démarre ici et s'allonge à chaque tranche suivante.
**Bloqué par :** 01.
**Fait quand :**
- [ ] La liste est la page d'accueil, avec « Réglages » et « Nouveau devis » en haut. *(story 11)*
- [ ] Chaque ligne de la liste montre numéro, client, date, total TTC et statut, le dernier créé en haut. *(story 12)*
- [ ] Liste vide : « Aucun devis » et le bouton « Nouveau devis ». *(story 13)*
- [ ] Un devis sans nom de client apparaît comme « (sans client) » dans la liste. *(story 14)*
- [ ] Un clic sur une ligne de la liste rouvre le devis, modifiable. *(story 15)*
- [ ] Trois clics sur « Nouveau devis » donnent DEV-2026-001, DEV-2026-002, DEV-2026-003. *(story 19)*
- [ ] Avec l'horloge de l'ordinateur passée en 2027, le devis suivant reçoit DEV-2027-001. *(story 22)*
- [ ] Sans bouton « Enregistrer », un devis tapé puis Chrome fermé et rouvert revient intact. *(story 42)*
- [ ] Depuis l'écran du devis, un bouton ramène à la liste. *(story 44)*
- [ ] Page ouverte dans deux onglets : c'est la dernière saisie qui reste, sans message. *(story 62)*
- [ ] Le contrôle automatique de la page, lancé depuis Node.js dans Chrome sans fenêtre et parti d'une mémoire vide, rejoue : nouveau devis, saisie, retour à la liste, rechargement, et vérifie ce qui reste affiché.

## 03 — Réglages et première ouverture

**À construire :** à la toute première ouverture, la page montre les réglages avec une phrase d'accueil. Le consultant y tape une fois ses coordonnées, son SIRET et le prochain numéro, relit le modèle de conditions, et ses coordonnées sont recopiées dans chaque nouveau devis au moment de sa création, puis affichées sur l'aperçu. « Nouveau devis » renvoie vers les réglages tant qu'il manque l'essentiel.
**Bloqué par :** 02.
**Fait quand :**
- [ ] Mémoire de `localhost:8000` vidée, la page s'ouvre sur les réglages avec une phrase d'accueil, les champs obligatoires signalés et le modèle de conditions déjà rempli. *(story 1)*
- [ ] Tant que le nom, l'adresse ou le SIRET manquent, « Nouveau devis » renvoie vers les réglages. *(story 2)*
- [ ] Les réglages acceptent nom suivi de « EI », adresse, SIRET, e-mail, téléphone et n° de TVA intracommunautaire, et un nouveau devis les affiche sans rien retaper. *(story 4)*
- [ ] Le modèle de conditions pré-rempli se lit et se modifie dans les réglages. *(story 6)*
- [ ] Une modification des réglages est encore là après rechargement, sans bouton. *(story 7)*
- [ ] Sans n° de TVA intracommunautaire, l'aperçu n'a aucune case ni libellé vide à sa place. *(story 8)*
- [ ] « Prochain numéro » réglé à 23 : le devis suivant reçoit DEV-2026-023. *(story 9)*
- [ ] Dans une fenêtre de navigation privée de Chrome, la page s'ouvre sur des réglages vides, sans message d'erreur. *(story 60)*
- [ ] La page demande à Chrome de garder ses données sans rien afficher ; l'onglet Application des outils de développement de Chrome montre le stockage du site comme persistant. *(story 61)*
- [ ] Après avoir vidé les données du site, les réglages reviennent comme à la première ouverture et le « prochain numéro » s'y règle. *(story 63)*
- [ ] Un confrère qui ouvre la page dans un autre profil Chrome arrive sur des réglages vides et ne voit aucune donnée du consultant. *(story 72)*
- [ ] Le contrôle automatique de la page rejoue aussi la première ouverture, le renvoi vers les réglages et leur saisie.

## 04 — Remise, TVA et acompte, justes au centime

**À construire :** sur l'écran du devis, le consultant choisit la TVA (20, 10 ou 0 %), tape une remise et un acompte en pourcentage, et voit l'aperçu recalculer au centime la remise, le HT après remise, la TVA, le TTC, l'acompte et le reste à payer. Les nouveaux devis partent à 20 % de TVA et 30 % d'acompte en attendant que la tranche 05 les prenne dans les réglages.
**Bloqué par :** 01.
**Fait quand :**
- [ ] Un seul taux de TVA se choisit pour tout le devis, parmi 20 %, 10 % et 0 %. *(story 32)*
- [ ] À 0 % : plus de ligne TVA, « Total » au lieu de « Total TTC », mention « TVA non applicable, art. 293 B du CGI » sous les totaux, acompte calculé sur ce total. *(story 33)*
- [ ] La remise se tape en pourcentage de 0 à 100 et s'applique au HT avant la TVA. *(story 34)*
- [ ] Avec une remise, l'aperçu montre le pourcentage, son montant et « Total HT après remise » ; à 0 %, ces lignes disparaissent. *(story 35)*
- [ ] L'acompte se tape en pourcentage de 0 à 100 du TTC après remise. *(story 36)*
- [ ] Sous les totaux : « Acompte à la commande (30 %) » avec son montant, puis « Reste à payer » ; à 0 %, les deux lignes disparaissent. *(story 37)*
- [ ] 2 × 450 + 3 × 450, remise 10 %, TVA 20 %, acompte 30 % donnent un TTC de 2 430,00 € et un reste à payer de 1 701,00 €, à l'écran comme dans les tests de calcul lancés par `node --test`, qui couvrent aussi 10 %, 0 %, les quantités décimales et les demi-centimes. *(story 38)*
- [ ] Les totaux sont alignés à droite sur l'aperçu et le PDF, acompte et reste à payer compris. *(story 68)*

## 05 — Dates, validité, conditions et « Bon pour accord »

**À construire :** le devis est complet de haut en bas. En haut à droite : « DEVIS », numéro, date et « Valable jusqu'au <date> » calculé ; en bas : les conditions reprises du modèle et ajustables pour ce devis, puis le cadre « Bon pour accord ». Chaque nouveau devis recopie aussi la TVA, l'acompte, la validité et les conditions des réglages du jour, et ne bouge plus quand les réglages changent.
**Bloqué par :** 03, 04.
**Fait quand :**
- [ ] TVA, acompte et validité habituels se règlent (20 %, 30 %, 30 jours au départ), et un nouveau devis part avec ces valeurs. *(story 5)*
- [ ] Un changement de réglages ne modifie aucun devis existant, brouillon compris ; seul le devis créé ensuite prend les nouvelles coordonnées et conditions. *(story 10)*
- [ ] Un nouveau devis s'ouvre en brouillon, daté du jour, avec validité, TVA et acompte habituels, 0 % de remise, les conditions du modèle et les coordonnées du jour. *(story 20)*
- [ ] Date du devis et durée de validité se modifient, et « Valable jusqu'au <date> » se recalcule. *(story 40)*
- [ ] Les conditions se modifient pour ce seul devis ; le modèle des réglages reste inchangé. *(story 41)*
- [ ] En haut de l'aperçu : coordonnées et SIRET à gauche ; « DEVIS », numéro, date et « Valable jusqu'au <date> » à droite. *(story 65)*
- [ ] Après les totaux : les conditions, puis un cadre « Bon pour accord » avec date et signature. *(story 69)*

## 06 — Saisie contrôlée et PDF refusé s'il manque quelque chose

**À construire :** une quantité ou un prix mal tapé est entouré en rouge. Quand le consultant clique « Sortir le PDF » avec un devis incomplet, la page refuse, liste ce qui manque et entoure les cases en rouge ; il complète et le PDF sort. Sortir le PDF ne touche jamais au statut.
**Bloqué par :** 02.
**Fait quand :**
- [ ] Une quantité de 0,5 est acceptée ; 0, un nombre négatif ou 0,125 ne le sont pas. *(story 27)*
- [ ] Un prix négatif ou à trois décimales, ou une quantité refusée, est entouré en rouge et compte comme manquant. *(story 28)*
- [ ] « Sortir le PDF » est refusé sans nom ou adresse du client, sans aucune ligne, ou avec une ligne sans titre, quantité ou prix. *(story 54)*
- [ ] En cas de refus, la page liste les manques et entoure les cases concernées en rouge ; une fois complétées, le PDF sort. *(story 55)*
- [ ] Une ligne à 0,00 € ne bloque pas le PDF. *(story 56)*
- [ ] Après la sortie du PDF, le statut du devis est inchangé dans la liste. *(story 59)*
- [ ] Le contrôle automatique de la page rejoue un PDF refusé, la liste des manques, puis le PDF accepté une fois complété.

## 07 — Un devis de plusieurs pages, lisible en noir et blanc

**À construire :** un devis assez long pour tenir sur deux pages sort proprement : en-tête du tableau répété, aucune ligne coupée, totaux restés avec le « Bon pour accord », « <numéro> — page x/y » sur chaque page, et un rendu qui reste lisible imprimé en noir et blanc. Le contrôle automatique du PDF (Décisions de test, point 3) le vérifie.
**Bloqué par :** 05.
**Fait quand :**
- [ ] Sur un devis de deux pages : en-tête du tableau sur chaque page, aucune ligne coupée, totaux et « Bon pour accord » ensemble, « DEV-2026-0xx — page 1/2 » puis « page 2/2 », sans en-tête ni pied ajouté par Chrome. *(story 70)*
- [ ] Imprimé ou prévisualisé en noir et blanc, le devis reste lisible, total compris. *(story 71)*
- [ ] Le contrôle automatique du PDF, avec Chrome sans fenêtre, sort un devis court puis un devis de deux pages et vérifie l'A4, l'ordre Stripe, les montants et le découpage des pages ; le contrôle de la page vérifie que le titre « <numéro> - <client> » est bien en place à l'ouverture de l'impression.

## 08 — Statuts et suppression d'un devis

**À construire :** le consultant passe un devis de « Brouillon » à « Envoyé », « Accepté » ou « Refusé » depuis la liste ou l'écran du devis, supprime un devis après confirmation, et rouvre et modifie n'importe quel devis, quel que soit son statut.
**Bloqué par :** 02.
**Fait quand :**
- [ ] Le statut (brouillon, envoyé, accepté, refusé) se change directement dans la liste, et reste après rechargement. *(story 16)*
- [ ] « Supprimer » sur n'importe quel devis, quel que soit son statut, demande une confirmation puis le retire de la liste. *(story 17)*
- [ ] Après suppression de DEV-2026-003, le devis suivant reçoit un numéro jamais donné, et le supprimé ne revient pas. *(story 18)*
- [ ] Le statut se change aussi depuis l'écran du devis. *(story 43)*
- [ ] Un devis « Envoyé » se rouvre et se modifie sans confirmation, et garde son numéro et son statut. *(story 45)*
- [ ] Rien dans la liste ni sur le devis n'indique qu'un devis envoyé a été modifié. *(story 46)*
- [ ] Le contrôle automatique de la page rejoue un changement de statut et une suppression, puis un rechargement.

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
