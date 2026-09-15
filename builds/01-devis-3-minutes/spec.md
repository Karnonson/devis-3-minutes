# Spec — Devis 3 minutes

## Problème

Un consultant indépendant prépare seul ses devis, souvent le soir, en recopiant un ancien devis Word d'un autre client et en recalculant tout à la calculatrice. Rien n'est relié : une ligne oubliée ou un total faux part chez le prospect et abîme sa crédibilité, alors qu'il en démarche davantage. Chaque devis prend environ 45 minutes, et le volume double dès octobre 2026.

## Solution

Le consultant ouvre une page par un favori de son navigateur. Il arrive sur la liste de ses devis : numéro, client, date, total et statut. Il crée un nouveau devis, ou duplique un ancien. Dans ce cas, le client est vidé et les lignes copiées sont marquées « à relire ». Il tape le client et ses lignes à gauche et voit à droite le devis A4 tel qu'il partira, recalculé au centime à chaque frappe : remise, TVA, acompte et reste à payer. Quand un élément indispensable manque, la page refuse de sortir le PDF et montre quoi compléter. Sinon, elle ouvre la fenêtre d'impression avec le bon nom de fichier. Il enregistre le PDF, l'envoie par e-mail, puis passe le statut à « Envoyé ». Ses coordonnées, son SIRET et ses conditions se saisissent une seule fois dans les réglages. Tout reste sur son ordinateur et s'enregistre sans bouton.

## Apparence

- **En trois mots** : net, calme, pro.
- **Couleurs** : fond blanc, texte bleu nuit, un seul accent vert sapin pour les boutons et le total TTC.
- **Typographie** : une police sans empattement lisible, sobre, sans fantaisie.
- **Images** : aucune image, aucune illustration, pas de logo.
- **Référence** : les factures Stripe (stripe.com) ou Qonto. Le PDF suit le même style et reste lisible imprimé en noir et blanc.

## User stories

### Le consultant — première ouverture et réglages

1. En tant que consultant, je veux qu'à la toute première ouverture la page m'affiche les réglages avec une phrase d'accueil, les champs obligatoires signalés et le modèle de conditions déjà rempli, afin de savoir quoi faire sans explication.
2. En tant que consultant, je veux que « Nouveau devis » me renvoie vers les réglages tant que mon nom, mon adresse ou mon SIRET manquent, afin qu'aucun devis sans SIRET ne puisse partir.
3. En tant que consultant, je veux que « Dupliquer » me renvoie aussi vers les réglages dans ce cas, afin que la copie, qui prend les réglages actuels, ne parte pas sans SIRET. *(Supposé)*
4. En tant que consultant, je veux saisir une seule fois mon nom suivi de « EI », mon adresse, mon SIRET, mon e-mail, mon téléphone et, s'il existe, mon numéro de TVA intracommunautaire, afin de ne jamais les retaper sur un devis.
5. En tant que consultant, je veux régler mon taux de TVA habituel (20 % au départ), mon acompte habituel (30 % au départ) et ma durée de validité par défaut (30 jours au départ), afin que chaque nouveau devis parte avec les bonnes valeurs.
6. En tant que consultant, je veux relire et adapter une fois le modèle de conditions pré-rempli, afin d'avoir des conditions complètes sans devoir les rédiger.
7. En tant que consultant, je veux modifier mes réglages à tout moment, enregistrés sans bouton, afin de les tenir à jour moi-même sans toucher à la page.
8. En tant que consultant, je veux que mon numéro de TVA intracommunautaire ne soit imprimé que s'il est rempli, afin de ne pas laisser de case vide sur le devis.
9. En tant que consultant, je veux modifier le « prochain numéro » à la main, afin de reprendre la suite de mes devis Word ou de recaler le compteur après une perte.
10. En tant que consultant, je veux qu'un changement de réglages ne touche aucun devis existant, brouillons compris, et que seuls les nouveaux devis et les duplications prennent les réglages actuels, afin qu'aucun devis déjà relu ne change à mon insu.

### Le consultant — la liste

11. En tant que consultant, je veux que la liste des devis soit la page d'accueil, avec « Réglages » et « Nouveau devis » en haut, afin de commencer tout de suite.
12. En tant que consultant, je veux voir pour chaque devis son numéro, son client, sa date, son total TTC et son statut, le dernier créé en haut, afin de retrouver un devis en faisant défiler. *(Supposé : ordre de création plutôt que date du devis)*
13. En tant que consultant, je veux voir « Aucun devis » et le bouton « Nouveau devis » quand la liste est vide, afin de savoir quoi faire.
14. En tant que consultant, je veux voir « (sans client) » dans la liste pour un devis dont le nom du client est vide, afin de ne pas avoir de ligne illisible. *(Supposé)*
15. En tant que consultant, je veux rouvrir un devis d'un clic sur sa ligne, afin de le modifier.
16. En tant que consultant, je veux changer le statut (brouillon, envoyé, accepté, refusé) directement dans la liste, à la main et sans date enregistrée, afin de suivre mes devis sans suivi commercial.
17. En tant que consultant, je veux supprimer n'importe quel devis, quel que soit son statut, après une confirmation, afin de faire le ménage sans risquer l'accident.
18. En tant que consultant, je veux qu'une suppression soit définitive et que le numéro supprimé ne soit jamais redonné, afin qu'aucun numéro envoyé ne serve deux fois.

### Le consultant — créer et remplir un devis

19. En tant que consultant, je veux qu'un clic sur « Nouveau devis » attribue tout de suite le numéro suivant au format DEV-année-compteur sur trois chiffres (DEV-2026-001), afin d'avoir le format que mes clients connaissent.
20. En tant que consultant, je veux qu'un nouveau devis s'ouvre en brouillon, avec la date du jour, la validité, la TVA et l'acompte habituels, 0 % de remise, les conditions du modèle et une copie de mes coordonnées du jour, afin de n'avoir que le client et les lignes à taper.
21. En tant que consultant, je veux qu'un nouveau devis parte avec une ligne vide prête à remplir, afin de taper sans cliquer d'abord. *(Supposé)*
22. En tant que consultant, je veux que le premier devis d'une nouvelle année reçoive le numéro <année>-001, par exemple DEV-2027-001, afin que le compteur reparte avec l'année.
23. En tant que consultant, je veux la saisie à gauche et, à droite, l'aperçu A4 du devis, identique au PDF et mis à jour à chaque frappe, afin de voir exactement ce qui partira tout en tapant dans des cases claires.
24. En tant que consultant, je veux taper le nom, le contact et l'adresse du client à chaque devis, le contact étant facultatif, afin de remplir le bloc client en deux lignes. *(Supposé : contact facultatif)*
25. En tant que consultant, je veux écrire pour chaque ligne un titre court, affiché en gras, et un détail facultatif de quelques lignes, affiché plus petit, afin d'expliquer au client ce qu'il achète.
26. En tant que consultant, je veux saisir une quantité et un prix unitaire HT par ligne et voir le total de la ligne se calculer seul, afin de ne plus rien calculer à la main.
27. En tant que consultant, je veux une quantité décimale (par exemple 0,5), supérieure à 0 et à deux décimales au plus, afin de facturer une demi-journée.
28. En tant que consultant, je veux qu'un prix soit de 0 ou plus, à deux décimales au plus, et qu'une quantité ou un prix hors de ces règles soit entouré en rouge et compte comme manquant, afin qu'une faute de frappe ne passe pas. *(Supposé)*
29. En tant que consultant, je veux ajouter une ligne, afin de composer un devis de 2 à 6 lignes.
30. En tant que consultant, je veux déplacer une ligne vers le haut ou le bas avec des flèches, afin de mettre les prestations dans l'ordre de lecture.
31. En tant que consultant, je veux supprimer une ligne après une confirmation, afin de ne pas en perdre une par erreur.
32. En tant que consultant, je veux choisir un seul taux de TVA pour tout le devis parmi 20 %, 10 % et 0 %, afin de couvrir mon cas et celui des confrères en franchise.
33. En tant que consultant, je veux qu'à 0 % de TVA les lignes TVA disparaissent, que « Total TTC » devienne « Total », que la mention « TVA non applicable, art. 293 B du CGI » s'affiche sous les totaux et que l'acompte porte sur ce total, afin d'avoir un devis en franchise correct.
34. En tant que consultant, je veux saisir une remise globale en pourcentage, de 0 à 100, appliquée au total HT avant la TVA, afin d'annoncer mes remises comme je le fais toujours. *(Supposé : bornes 0 à 100)*
35. En tant que consultant, je veux que le devis affiche le pourcentage de remise, son montant et le « Total HT après remise », et que ces lignes disparaissent à 0 %, afin que le client comprenne la remise et qu'un devis sans remise reste sobre.
36. En tant que consultant, je veux saisir l'acompte en pourcentage, de 0 à 100, du total TTC après remise, afin que le client lise directement ce qu'il doit virer. *(Supposé : bornes 0 à 100)*
37. En tant que consultant, je veux voir sous les totaux « Acompte à la commande (30 %) » avec son montant, puis « Reste à payer », et que ces deux lignes disparaissent à 0 %, afin de reprendre ce que font mes devis Word. *(Supposé : « Reste à payer » disparaît aussi à 0 %)*
38. En tant que consultant, je veux que chaque total de ligne soit arrondi au centime, que le total HT soit la somme de ces totaux de ligne, que la remise, le HT après remise, la TVA, le TTC et l'acompte soient chacun calculés une fois et arrondis au centime (demi-centime vers le haut), le tout en centimes entiers, afin d'avoir un devis juste au centime.
39. En tant que consultant, je veux que les montants s'affichent au format français, « 1 800,00 € », afin que le devis se lise naturellement.
40. En tant que consultant, je veux modifier la date du devis et sa durée de validité, et voir « Valable jusqu'au <date> » se calculer, afin de raccourcir ou d'allonger la validité d'une offre à date.
41. En tant que consultant, je veux ajuster les conditions pour ce seul devis sans modifier le modèle, afin de couvrir une exception comme un délai de paiement différent.
42. En tant que consultant, je veux que tout s'enregistre automatiquement à chaque frappe, sans bouton, et retrouver mon devis intact après avoir fermé et rouvert la page, afin de ne jamais perdre une saisie.
43. En tant que consultant, je veux changer le statut depuis l'écran du devis aussi, afin de ne pas repasser par la liste.
44. En tant que consultant, je veux un bouton qui me ramène à la liste depuis l'écran du devis, afin de naviguer sans me perdre. *(Supposé)*
45. En tant que consultant, je veux rouvrir et modifier librement n'importe quel devis, quel que soit son statut et sans confirmation, en gardant son numéro et son statut, afin de corriger et renvoyer un devis déjà envoyé en prévenant moi-même le client.
46. En tant que consultant, je veux qu'aucun repère n'indique qu'un devis envoyé a été modifié, afin de garder une liste sobre. *(Supposé)*

### Le consultant — dupliquer

47. En tant que consultant, je veux qu'un clic sur « Dupliquer » crée une copie avec un nouveau numéro, en brouillon, datée du jour et avec la validité par défaut des réglages, afin de partir d'un devis proche sans reprendre l'ancien numéro. *(Supposé : validité par défaut plutôt que celle du devis d'origine)*
48. En tant que consultant, je veux que la copie vide le bloc client et garde les lignes, les prix, la TVA, la remise et l'acompte, avec mes coordonnées et les conditions des réglages actuels, afin qu'aucun reste de l'ancien client ne parte par oubli.
49. En tant que consultant, je veux que la copie s'ouvre directement, afin de taper le client tout de suite. *(Supposé)*
50. En tant que consultant, je veux que chaque ligne copiée soit teintée « à relire » jusqu'à ce que je la modifie ou la coche d'un clic, afin de ne pas envoyer une ligne rédigée pour un autre client.
51. En tant que consultant, je veux que le repère « à relire » reste quand je ferme la page, afin de reprendre la relecture le lendemain. *(Supposé)*
52. En tant que consultant, je veux que le nom de l'ancien client, sans sa forme juridique (« Karma » pour « Karma SAS »), soit signalé en rouge partout où il apparaît, sans tenir compte des majuscules, dans le titre ou le détail des lignes de la copie, jusqu'à ce qu'il n'y figure plus, afin de repérer ce qui vient de l'autre devis. *(Supposé : fin du signalement)*
53. En tant que consultant, je veux que rien ne soit recherché si le devis d'origine n'avait pas de nom de client, afin de ne pas voir tout le devis signalé à tort. *(Supposé)*

### Le consultant — sortir le PDF

54. En tant que consultant, je veux que « Sortir le PDF » soit refusé tant que le nom ou l'adresse du client manque, qu'il n'y a aucune ligne ou qu'une ligne n'a pas de titre, de quantité ou de prix, afin qu'aucun devis incomplet ne parte.
55. En tant que consultant, je veux qu'en cas de refus la page liste les manques et entoure les cases concernées en rouge, afin de corriger en quelques secondes.
56. En tant que consultant, je veux qu'un prix à 0 € soit accepté, afin d'offrir une ligne.
57. En tant que consultant, je veux que la page me signale les lignes encore « à relire » au moment du PDF, sans bloquer, afin d'être prévenu sans être freiné les soirs où je sais que c'est bon.
58. En tant que consultant, je veux que la fenêtre d'impression de Chrome s'ouvre avec le nom de fichier « <numéro> - <client>.pdf », par exemple « DEV-2026-014 - Acme SARL.pdf », et choisir moi-même le dossier, afin de retrouver le fichier dans mes dossiers et ma messagerie.
59. En tant que consultant, je veux que sortir le PDF ne change jamais le statut, afin de rester seul maître des statuts.

### Le consultant — la mémoire

60. En tant que consultant, je veux que sur un autre ordinateur ou un autre profil Chrome la page s'ouvre vide, comme à la toute première ouverture, sans message d'erreur, afin de comprendre que mes devis sont restés sur mon ordinateur.
61. En tant que consultant, je veux que la page demande discrètement à Chrome de ne pas effacer ses données de lui-même, afin de limiter les pertes.
62. En tant que consultant, je veux, avec la page ouverte dans deux onglets, que le dernier enregistrement l'emporte sans avertissement, afin de garder une page simple. *(Supposé)*
63. En tant que consultant, je veux, si mes données ont été effacées, retrouver les réglages comme à la première ouverture et pouvoir y régler le « prochain numéro », afin de ne pas redonner un numéro déjà envoyé.

### Le prospect

64. En tant que prospect, je veux recevoir un devis A4 sobre et net, sans image ni logo, afin de prendre le consultant au sérieux.
65. En tant que prospect, je veux lire en haut à gauche les coordonnées et le SIRET du consultant, et en haut à droite « DEVIS », le numéro, la date et « Valable jusqu'au <date> », afin de savoir qui me fait l'offre et jusqu'à quand.
66. En tant que prospect, je veux lire mes propres coordonnées sous l'en-tête, à droite, afin de vérifier que le devis m'est bien adressé.
67. En tant que prospect, je veux lire un tableau Prestation, Qté, PU HT, Total HT, avec le titre de chaque prestation en gras et son détail dessous, afin de comprendre ce que j'achète avant de voir le prix.
68. En tant que prospect, je veux lire les totaux alignés à droite, dont le montant exact de l'acompte à la commande et le reste à payer, afin de savoir ce que je dois virer sans rien calculer.
69. En tant que prospect, je veux lire les conditions puis un cadre « Bon pour accord » avec date et signature, afin de savoir comment accepter.
70. En tant que prospect, je veux, sur un devis de plusieurs pages, retrouver l'en-tête du tableau sur chaque page, aucune ligne coupée, les totaux avec le « Bon pour accord » et « <numéro> — page x/y » sur chaque page, afin de lire un document complet et ordonné.
71. En tant que prospect, je veux un devis lisible imprimé en noir et blanc, afin de pouvoir l'imprimer au bureau.

### Un confrère

72. En tant que confrère qui ouvre le lien, je veux arriver sur des réglages vides, saisir mes propres informations et ne jamais voir les données du consultant, afin d'utiliser la même page pour mes devis.

## Décisions de réalisation

Les pièces, où elles tournent et comment elles se parlent sont dans `architecture.md` : page statique ouverte dans Chrome, hébergement GitHub Pages, mémoire de la page dans Chrome, PDF par la fenêtre d'impression, projet de code public, messagerie hors de la page. Rien ici ne les redéfinit.

- Aucune sauvegarde, aucun export et aucune restauration de la liste : les PDF dans les e-mails servent d'archive (Q1).
- Un seul taux de TVA par devis, parmi 20 %, 10 % et 0 %, et jamais de taux par ligne (Q2).
- La page est construite pour le consultant seul. Aucune de ses informations n'est écrite dans la page : tout passe par les réglages (Q3).
- Remise en pourcentage seulement, sur le HT avant TVA (Q4).
- Acompte en pourcentage du TTC après remise (Q5).
- Pas de colonne unité (Q6).
- Numéro au format DEV-année-compteur sur trois chiffres, avec un « prochain numéro » modifiable dans les réglages (Q7).
- Le numéro est attribué au clic sur « Nouveau devis » ou « Dupliquer » : un brouillon supprimé consomme son numéro. *(Supposé)*
- Un nouveau devis de l'année suivante repart à 001. *(Supposé)*
- Modification libre quel que soit le statut : numéro et statut conservés, pas de version (Q8).
- La duplication vide le client, marque les lignes « à relire », signale le nom de l'ancien client et ne bloque pas le PDF (Q9).
- Date du jour à la création et à la duplication, validité par défaut réglable et ajustable par devis, « Valable jusqu'au » calculé (Q10).
- Statut changé à la main seulement, sans date ni alerte (Q11). Il se change depuis la liste et depuis l'écran du devis. *(Supposé)*
- Suppression d'un devis après confirmation, définitive, sans jamais redonner le numéro (Q12).
- Conditions : un modèle pré-rempli dans les réglages, repris par chaque nouveau devis et ajustable par devis (Q13). Son contenu de départ, à relire : acompte à la commande et solde à réception de facture sous 30 jours ; pour les clients professionnels, pénalités de retard à trois fois le taux d'intérêt légal et indemnité forfaitaire de 40 € ; « Devis gratuit » ; validité rappelée par « Valable jusqu'au ». *(Supposé)*
- Réglages : nom suivi de « EI », adresse, SIRET, e-mail, téléphone, n° de TVA intracommunautaire facultatif, TVA habituelle 20 %, acompte habituel 30 %, validité 30 jours, prochain numéro, modèle de conditions. Pas de champ assurance ni IBAN : les deux peuvent s'écrire dans les conditions. *(Supposé)*
- Bloc client tapé à chaque devis, sans suggestion ni carnet (Q14).
- Écran du devis : saisie à gauche, aperçu A4 à droite, identique au PDF, mis à jour à chaque frappe (Q15).
- Allure Stripe : blanc, bleu nuit, vert sapin, sans empattement, sans image (Q16). La police est incluse dans le projet, voir `architecture.md`.
- Ligne : titre court en gras et détail facultatif plus petit (Q17).
- Ordre et découpage des pages du PDF façon Stripe, avec « <numéro> — page x/y » (Q18).
- Liste en page d'accueil, sans recherche ni regroupement par statut (Q19).
- Première ouverture sur les réglages. « Nouveau devis » est bloqué tant que le nom, l'adresse ou le SIRET manquent (Q20).
- PDF refusé en cas de manque, prix à 0 € accepté (Q21).
- Enregistrement automatique à chaque frappe, confirmation avant de supprimer une ligne, pas de bouton « Annuler » (Q22).
- Nom du fichier PDF : « <numéro> - <client>.pdf » (Q23).
- Chaque devis garde les coordonnées et les conditions du jour de sa création (Q24).
- La fiche de contrôle papier en 5 points se tient hors de la page, jusqu'à la mise en service. Elle figure dans « À faire à la main » de `architecture.md` (Q25).
- Le PDF passe par la fenêtre d'impression de Chrome (Q27), dans Chrome sur l'ordinateur du consultant (Q28).
- La page est en ligne sur GitHub Pages, et les devis restent dans Chrome (Q29). Rien n'est retrouvé sur un autre ordinateur (Q30).
- Tout le projet est public, sans aucun devis, SIRET ni coordonnée dedans (Q31).
- Il faut internet pour ouvrir la page, pas de mode hors ligne. Une nouvelle version apparaît au rechargement (Q32).
- Le projet s'appelle `devis-3-minutes`, et l'adresse finissant par `/devis-3-minutes` ne change plus jamais (nom et adresse du projet).
- La soirée du mardi 6 octobre 2026 et le trajet de `architecture.md` sont le parcours de référence (journée racontée et trajet).
- Quantité supérieure à 0, à deux décimales au plus. *(Supposé)*
- Calculs en centimes entiers, arrondis ligne par ligne puis une fois par total, demi-centime vers le haut. *(Supposé)*
- Remise ou acompte à 0 % : ses lignes disparaissent de l'aperçu et du PDF. *(Supposé)*
- TVA à 0 % : « Total », mention art. 293 B, acompte sur ce total. *(Supposé)*
- Montants au format « 1 800,00 € ». *(Supposé)*
- Deux onglets : le dernier enregistrement l'emporte. *(Supposé)*

## Décisions de test

**La règle : on teste ce que la page fait, jamais comment elle le fait.** Chaque test donne une entrée et vérifie ce qu'on voit en sortie. Il ne regarde ni le code, ni la manière dont les données sont rangées.

Les trois points de contrôle, validés par le consultant, tournent tous sur l'ordinateur comme le décrit « En local » dans `architecture.md` :

1. **Les calculs, juste au centime.** On donne des lignes (quantité × prix), un taux de TVA de 20, 10 ou 0 %, une remise et un acompte en pourcentage. On vérifie le total de chaque ligne, le HT, la remise, le HT après remise, la TVA, le TTC (ou « Total » à 0 %), l'acompte et le reste à payer, au centime. Exemple de référence : 2 × 450 + 3 × 450, remise 10 %, TVA 20 %, acompte 30 % donnent un TTC de 2 430,00 € et un reste à payer de 1 701,00 €. Les cas à 10 % et 0 %, les quantités décimales et les demi-centimes sont aussi couverts. Lancé par `node --test`.
2. **La page, ce que vit le consultant.** On ouvre `http://localhost:8000` dans Chrome et on déroule : première ouverture, réglages, nouveau devis, duplication, lignes « à relire », nom de l'ancien client, PDF refusé, statut, suppression et rechargement. On vérifie ce que l'écran affiche et ce qui reste après rechargement, en rejouant au minimum le trajet du mardi 6 octobre. *(Supposé : rejoué automatiquement dans Chrome sans fenêtre, piloté depuis Node.js sans bibliothèque à installer, et vidé avant chaque passage pour repartir d'une première ouverture.)*
3. **Le PDF, ce que reçoit le prospect.** On donne un devis rempli, court puis assez long pour tenir sur deux pages. On vérifie un A4 dans l'ordre Stripe avec les bons montants, l'en-tête du tableau répété, aucune ligne coupée, les totaux avec le « Bon pour accord », « <numéro> — page x/y » sur chaque page, et le nom proposé « <numéro> - <client>.pdf ». Lancé avec Chrome sans fenêtre (impression en PDF).

Le temps de cinq minutes ne se teste pas dans la page. Il se mesure au chronomètre du téléphone, de « Nouveau devis » ou « Dupliquer » jusqu'au PDF, sur les trois devis du test de mi-octobre 2026 (Q26).

## Hors périmètre

### Abandonné (decisions.md)

| Ce qui est coupé | Pourquoi |
|---|---|
| Sauvegarde ou export de la liste dans un fichier, et restauration (Q1) | Les PDF envoyés servent d'archive. **À reprendre plus tard** (« Pas encore ») : il aimerait un bouton « sauvegarder une copie ». |
| Numéro « v2 » automatique quand un devis envoyé est modifié, ancienne version gardée (Q8) | Il préfère la simplicité en première version et prévient lui-même le client. **À reprendre plus tard** (« Pas encore »), à sa demande. |
| TVA par ligne (Q2) | Un seul taux par devis lui suffit. |
| Accueil guidé et aide pour les confrères, confrères comme utilisateurs de la première version (Q3) | Les confrères passent après. La première ouverture sur les réglages (Q20) suffit. |
| Informations du consultant écrites en dur dans la page (Q3) | Ses informations changent, et il veut les modifier lui-même. |
| Remise en montant (Q4) | Il raisonne en pourcentage, et un seul mode est plus sûr le soir. |
| Acompte en % du HT ou en montant libre (Q5) | Le client doit lire le montant qu'il vire, et un montant tapé dépendrait de la vigilance. |
| Colonne unité, libre ou dans une liste (Q6) | Tableau plus sobre et saisie plus rapide. |
| Blocage du PDF tant que des lignes copiées ne sont pas relues (Q9) | Un obstacle le soir pousse à cocher sans lire. |
| Dates d'envoi et d'acceptation, alerte « validité dépassée », statut « Envoyé » proposé après le PDF (Q11) | Ces dates sont dans ses e-mails, et il ne veut pas de suivi commercial. |
| Suggestion des clients déjà connus, carnet de clients, choix « même client » à la duplication (Q14) | Peu de clients récurrents. |
| Écran « écrire dans le devis » et formulaire sans aperçu (Q15) | Il veut voir ce qui partira tout en tapant dans des cases claires. |
| Recherche dans la liste, liste groupée par statut (Q19) | La liste reste petite, et le classement par statut ressemble à du suivi commercial. La recherche reviendra si elle manque. |
| Bouton « Annuler » après suppression (Q22) | La confirmation suffit, pour une première version légère. |
| Coordonnées des brouillons mises à jour quand les réglages changent (Q24) | Il veut une règle unique et aucun devis qui change sans qu'il le sache. |
| Mesure du temps de préparation dans la page (Q26) | Le chronomètre du téléphone suffit pour trois mesures. |
| PDF téléchargé directement, sans fenêtre d'impression (Q27) | Rendu moins net, page plus lourde. |
| Projet GitHub privé payant (Q31) | Rien de sensible dans le projet, et « rien à payer ». |
| Ouverture de la page sans internet (Q32) | Il faut internet pour envoyer le devis de toute façon. Plus de travail et de bugs. |

### Pas encore (idee.md)

| Hors première version | Ce qui le ferait revenir |
|---|---|
| Logo sur le devis | Le consultant en veut un. |
| Bouton « sauvegarder une copie » de la liste dans un fichier, et restauration (Q1) | Il le demande : l'idée lui plaît, mais pas en première version. |
| Numéro « v2 » automatique quand un devis envoyé est modifié, ancienne version gardée (Q8) | Il le demande, quand la simplicité de la première version ne suffit plus. |
| Accès aux devis depuis un autre ordinateur ou un téléphone, synchronisation (Q30) | Il travaille régulièrement sur plus d'un appareil. Cela demanderait sans doute plus qu'une page statique. |
| Sauvegarde hors de l'ordinateur (serveur, cloud) | Une perte de données survient, ou le risque de la supposition 1 devient inacceptable. |
| Facture tirée d'un devis accepté, comptabilité, suivi des paiements d'acompte | Le consultant change d'avis sur la facturation. Il a résilié un outil précisément pour ça. |
| Signature électronique, acceptation en ligne par le prospect | Des prospects exigent une signature au lieu de « ok pour moi » par e-mail. |
| Envoi de l'e-mail directement depuis la page | Joindre le PDF à la main devient le goulot. Cela demanderait un service d'envoi. |
| Catalogue de prestations et de textes pré-rédigés | La duplication ne suffit plus à gagner le temps de rédaction, et les textes se stabilisent d'un client à l'autre. |
| Plusieurs utilisateurs (associé, sous-traitant) | Quelqu'un d'autre se met à préparer des devis. |
| Relances et suivi commercial au-delà du statut | Le volume dépasse ce qu'une liste avec statuts permet de suivre. |

## Ouvert

Tout ce qui suit est **Supposé** : complété sans question explicite, à interroger à l'étape suivante.

**Venu de decisions.md**
- *Supposé (accepté)* — Quantités décimales : supérieures à 0, deux décimales au plus.
- *Supposé (accepté)* — Arrondi au centime ligne par ligne, puis une fois par total, demi-centime vers le haut, en centimes entiers.
- *Supposé (accepté)* — Remise ou acompte à 0 % : ligne masquée. Sans remise, « Total HT après remise » est masqué aussi.
- *Supposé (accepté)* — Ordre des lignes changé avec des flèches haut et bas.
- *Supposé (accepté)* — Numéro <année>-001 pour le premier devis d'une nouvelle année.
- *Supposé* — La copie prend la validité par défaut des réglages, pas celle du devis d'origine.
- *Supposé* — Numéro attribué à la création ou à la duplication : un brouillon supprimé consomme son numéro.
- *Supposé* — Contenu des réglages : « EI », TVA intracommunautaire facultative, valeurs de départ 20 %, 30 % et 30 jours, pas d'assurance ni d'IBAN.
- *Supposé* — Contenu du modèle de conditions pré-rempli.
- *Supposé* — TVA à 0 % : « Total », mention art. 293 B sous les totaux, acompte sur ce total.
- *Supposé (tranché au découpage)* — Nom de l'ancien client cherché sans sa forme juridique (« Karma » pour « Karma SAS ») et sans tenir compte des majuscules, dans le titre et le détail des lignes seulement : les conditions de la copie viennent des réglages. Le repère « à relire » est enregistré.
- *Supposé* — Statut modifiable depuis la liste et depuis l'écran du devis.
- *Supposé* — Montants au format « 1 800,00 € ».
- *Supposé* — Deux onglets : le dernier enregistrement l'emporte, sans avertissement.
- *Supposé* — Aucun repère sur un devis envoyé puis modifié.

**Venu de architecture.md** (voir ce fichier, non repris ici) : page sans framework ni bibliothèque, police incluse ; page à la racine du projet ; clés de mémoire préfixées et demande de conservation à Chrome ; nom de fichier et pied « page x/y » tirés de Chrome, à vérifier pendant la construction ; poids de moins de 1 Mo ; serveur local, tests Node.js et rendu PDF sans fenêtre en local.

**Ajouté par cette spec** (accepté à la relecture des user stories, sauf mention contraire)
- *Supposé* — Liste triée par ordre de création, le dernier créé en haut, plutôt que par date du devis (story 12).
- *Supposé* — « (sans client) » dans la liste quand le nom du client est vide (story 14).
- *Supposé* — Un nouveau devis part avec une ligne vide (story 21).
- *Supposé* — Contact du client facultatif ; seuls le nom et l'adresse sont exigés au PDF (story 24).
- *Supposé* — Prix de 0 ou plus, deux décimales au plus ; quantité ou prix invalide entouré en rouge et compté comme manquant (story 28).
- *Supposé* — Remise et acompte bornés de 0 à 100 % (stories 34 et 36).
- *Supposé* — « Reste à payer » masqué aussi quand l'acompte est à 0 % (story 37).
- *Supposé* — Bouton de retour à la liste depuis l'écran du devis (story 44).
- *Supposé* — La copie s'ouvre directement après « Dupliquer » (story 49).
- *Supposé* — Le signalement du nom de l'ancien client s'arrête dès que le nom n'apparaît plus (story 52).
- *Supposé* — Aucune recherche de nom si le devis d'origine n'avait pas de client (story 53).
- *Supposé (accepté au découpage)* — « Dupliquer » renvoie aussi vers les réglages tant que le nom, l'adresse ou le SIRET manquent (story 3).
- *Supposé* — Le point de contrôle « La page » est rejoué automatiquement dans Chrome sans fenêtre, piloté depuis Node.js sans bibliothèque à installer (Décisions de test).
