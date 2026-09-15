# Devis 3 minutes

## Le problème

**Qui.** Un consultant indépendant (SEO, ateliers, accompagnement, création de contenus) qui travaille seul. Personne d'autre ne prépare ni ne touche ses devis. Ses prospects reçoivent le résultat.

**À quelle fréquence.** 3 à 4 devis par mois aujourd'hui. Une nouvelle offre d'ateliers est lancée en octobre 2026 : le volume double pendant trois mois, jusqu'à 6 devis par mois.

**Ce qu'il fait aujourd'hui.** Il ouvre un ancien devis Word d'un autre client et le modifie. Il recalcule à la main (calculatrice), puis tape chaque montant dans le tableau Word. Rien n'est relié : les lignes, le HT, la remise, la TVA, l'acompte et le TTC sont des nombres tapés séparément. Il exporte en PDF et l'envoie en pièce jointe. Le prospect répond « ok pour moi » par e-mail, sans signature. Il le fait souvent le soir, fatigué.

Un devis compte 2 à 6 lignes (quantité × prix unitaire, un forfait = quantité 1), une TVA, un acompte à la commande et parfois une remise globale. Les types de prestations reviennent (audit, atelier, accompagnement mensuel, création de contenus), mais le texte de chaque ligne est rédigé pour le client.

Environ 45 minutes par devis :
- ~15 min à nettoyer l'ancien devis et à vérifier qu'il ne reste rien de l'autre client ;
- ~15 min à recalculer et contrôler ;
- ~10 min à rédiger les lignes ;
- ~5 min de mise en page et d'export PDF.

**La dernière fois (mardi 8 septembre 2026).** Un prospect demande un devis pour un audit SEO et deux ateliers. Le consultant reprend le devis d'un autre client et oublie de changer une ligne. Le total TTC ne correspond plus aux lignes. Le prospect le lui fait remarquer, et le consultant a l'air peu sérieux. C'est la deuxième fois cette année qu'il renvoie un devis corrigé.

**Ce qu'il a déjà essayé, et pourquoi ça s'est arrêté.**
- Un modèle Word : les erreurs de calcul restent.
- Un Google Sheets avec formules : une formule casse dès qu'on ajoute une ligne, et le rendu n'est pas présentable.
- Un outil de facturation en ligne à 15 €/mois : trop cher pour quatre devis. Résilié parce qu'il poussait vers la facturation et la comptabilité, dont il ne voulait pas.
- Aucun outil gratuit trouvé qui ne demande ni compte ni carte bancaire.

**Pourquoi ça compte.** Un total faux abîme sa crédibilité face à un prospect, au moment où il en démarche davantage. L'erreur passe avant le temps, mais le temps compte aussi : avec le volume qui double, 45 minutes par devis, c'est jusqu'à 4 h 30 par mois et deux fois plus d'occasions de se tromper.

**Pourquoi maintenant.** L'offre d'ateliers démarre en octobre, et l'épisode de mardi a servi de déclic. L'outil doit être utilisable avant début octobre 2026.

**À quoi on reconnaît que c'est résolu.**
- Un devis propre, juste au centime, avec la TVA et l'acompte, prêt à envoyer en PDF. Visée : trois minutes une fois qu'il sait quoi écrire. Seuil à respecter : cinq minutes (voir le test ci-dessous).
- Un devis qu'il peut retrouver plus tard : une liste de ses devis (numéro, client, date, total, statut brouillon / envoyé / accepté / refusé), avec la possibilité d'en rouvrir un pour le modifier et d'en dupliquer un sous un nouveau numéro.
- **Test d'ici mi-octobre 2026** (« dans un mois », dit le 14 septembre) : trois devis envoyés sans aucune reprise, chacun préparé en moins de cinq minutes une fois le contenu en tête.

**« Présentable » veut dire :** sobre et net, dans le style d'une facture Stripe ou Qonto. Ses coordonnées et son SIRET en haut, le client, le tableau des lignes, les totaux, ses conditions et une ligne « Bon pour accord ». Pas de logo pour l'instant.

**Règle imposée pour la première version :** un site statique, soit une seule page web en HTML, CSS et JavaScript dans un dossier. Pas de serveur, pas de base de données, pas de connexion, rien à payer. Les devis restent dans son navigateur, sur son ordinateur.

## En une phrase

Aider un consultant indépendant qui prépare seul ses devis, souvent le soir, à envoyer un devis juste au centime (lignes, remise, TVA, acompte) et présentable en moins de cinq minutes une fois qu'il sait quoi écrire, puis à le retrouver, le modifier ou le dupliquer, malgré des lignes rédigées sur mesure, un volume qui double dès octobre 2026, et la règle d'une seule page web sans serveur ni abonnement, prête avant début octobre.

Direction retenue, dans les mots du consultant : une page web où il saisit ses lignes, qui calcule tout et lui sort un PDF propre, enregistré dans son navigateur. En attendant qu'elle soit prête, il applique une fiche de contrôle papier.

## Pourquoi celle-ci

**Ce qu'elle bat.** L'éditeur de devis complet sur une page (direction 6) est la seule direction qui remplit à la fois les trois exigences :
- des lignes rédigées à la main ;
- des totaux qui ne dépendent pas de la vigilance du soir ;
- retrouver, modifier, dupliquer et suivre les devis.

Les directions « modèle Word relié » et « vérificateur » laissent le calcul ou la double saisie à la charge du consultant : c'est l'échec du modèle Word qui recommence. Le « générateur sans mémoire » règle le calcul et la mise en page, mais pas la liste, la réouverture ni la duplication. Or c'est la duplication qui rend réaliste un devis en moins de cinq minutes.

Elle évite aussi les trois raisons d'abandon passées : ajouter une ligne ne doit rien casser (Sheets), le rendu est présentable (Sheets), et il n'y a ni abonnement ni facturation ou compta (outil en ligne).

**Pourquoi la fiche de contrôle en plus.** Elle ne coûte rien et protège les devis envoyés d'ici la mise en service. Elle couvre aussi un cas que le calcul automatique ne règle pas : une ligne restée d'un ancien client après duplication, cohérente avec le total mais fausse pour le nouveau client.

**Les suppositions derrière ce choix.** Si l'une tombe, le choix est à revoir.
1. **Des devis gardés dans un seul navigateur, c'est acceptable.** Si les données du navigateur sont effacées, si l'ordinateur change ou si le disque lâche, la liste, les brouillons et les statuts disparaissent. Les PDF envoyés restent dans les e-mails.
2. **Plusieurs jours de construction tiennent avant début octobre 2026.** Si ce n'est pas le cas, le plan de repli est de livrer d'abord le générateur sans mémoire (direction 5), puis d'ajouter la liste, la réouverture et la duplication.
3. **Un PDF propre au niveau « facture Stripe ou Qonto » s'obtient depuis une page statique.** Non vérifié à ce stade.

**Ce qui rendrait le projet inutile.** Deux devis corrigés depuis le début de 2026, c'est peu. Si seul le total faux comptait, la fiche de contrôle et une relecture le lendemain matin suffiraient probablement, sans rien construire. Le projet se justifie par l'exigence de moins de cinq minutes par devis, alors que le volume double. Aucune solution papier ne l'atteint.

## Écartées

| Direction | Pourquoi pas |
|---|---|
| 1. Grille de prix fixes, devis réduit à un e-mail | Les prestations changent à chaque client : il faut des lignes rédigées. Remise et acompte resteraient calculés à la main. |
| 2. Modèle Word vierge avec champs calculés et zones surlignées | Les champs Word doivent être actualisés à la main, ce qu'on oublie le soir. Ajouter une ligne peut casser les formules. Pas de liste ni de statuts. Répète l'échec du modèle Word. |
| 3. Règle papier seule : fiche de contrôle et envoi le lendemain matin | Rallonge le temps au lieu de le réduire, repose sur la vigilance et retarde chaque envoi d'une nuit alors que le volume double. **Gardée en attendant** la mise en service de l'outil. |
| 4. Vérificateur d'une page à côté du Word | Double saisie. Les 45 minutes restent. Ne détecte ni la ligne oubliée ni la mise en page cassée. |
| 5. Générateur d'une page sans mémoire (le PDF sert d'archive) | Pas de liste, pas de statuts, pas de réouverture ni de duplication, pourtant demandées explicitement. Reste le **plan de repli** si la direction 6 ne tient pas avant octobre. |
| 7. Logiciel de devis gratuit existant | Recherché par le consultant : tous demandent un compte ou une carte. Pousse vers la facturation et la compta, format imposé, données chez un tiers. |

## Pas encore

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

## Encore ouvert

Ces questions sont posées, pas tranchées.

**Allure et ressenti**
- À quoi ressemble l'écran de saisie d'un devis, et comment s'y sent-on le soir, fatigué : dense ou aéré, tout sur un écran ou par étapes ?
- À quoi ressemble la liste des devis, et comment passe-t-on de la liste à un devis puis au PDF ?
- Voit-on le devis tel qu'il sera imprimé pendant la saisie, ou seulement au moment du PDF ?
- Mise en page exacte du PDF : ordre des blocs, typographie, place des conditions et du « Bon pour accord », comportement sur plusieurs pages.

**Calculs**
- La TVA : un seul taux toujours identique ou un taux modifiable, par devis ou par ligne ? Et le cas d'un devis sans TVA ?
- La remise globale : en pourcentage, en montant, ou au choix ? Appliquée sur le HT avant TVA ?
- L'acompte : en pourcentage ou en montant ? Calculé sur le HT ou le TTC ? Et comment apparaît-il sur le devis ?
- La règle d'arrondi au centime : ligne par ligne ou sur le total ?
- Le champ « unité » (jour, atelier, mois) : faut-il l'ajouter à côté de la quantité ?

**Numérotation, modification, duplication**
- Format du numéro de devis (année, compteur…) et point de départ par rapport aux numéros existants.
- Modifier un devis déjà envoyé ou accepté : autorisé tel quel, ou crée-t-il une nouvelle version (v2) ? Que devient le numéro ?
- Après une duplication, comment éviter qu'une ligne de l'ancien client parte telle quelle, sans ajouter de temps ?
- La date du devis se met-elle à jour lors d'une duplication ? Y a-t-il une date de validité ?
- Changement de statut : manuel seulement ? Garde-t-on la date d'envoi ou d'acceptation ?
- Peut-on supprimer un devis ?

**Données et informations fixes**
- Où et comment saisit-on une seule fois ses coordonnées, son SIRET et ses conditions, et comment les modifie-t-on ?
- Quelles mentions doivent figurer sur un devis de consultant indépendant en France (numéro de TVA, durée de validité, conditions de paiement…) ?
- Comment les informations du client sont-elles saisies : à chaque devis, ou retrouvées depuis un devis précédent ?
- Comment les devis sont-ils enregistrés dans le navigateur, et comment se protège-t-on d'une perte (export, sauvegarde dans un fichier…) ?
- Comment la page est-elle ouverte (fichier double-cliqué ou autre), et cela change-t-il l'enregistrement dans le navigateur ?
- Quel(s) navigateur(s) le consultant utilise-t-il ?

**PDF**
- Comment le PDF est-il produit (impression du navigateur ou fichier généré), et le résultat atteint-il le niveau « facture Stripe ou Qonto » ?
- Comment le fichier PDF est-il nommé ?

**Fiche de contrôle provisoire**
- Que contient exactement la fiche de contrôle papier, et sous quelle forme (imprimée, note) ?

## Jusqu'où on est allé

Pitch seulement : ni maquette ni spike. Les directions 5 et 6 diffèrent par leur ampleur, pas par la faisabilité ni par le ressenti d'un écran. Une maquette n'aurait donc rien tranché.

Ce que l'entretien a établi :
- le problème : le total faux passe avant le temps ;
- la cause : rien n'est relié entre les lignes et le total ;
- la répartition des 45 minutes ;
- les raisons d'abandon des trois essais passés ;
- le critère de réussite à un mois ;
- le sens de « présentable » ;
- le délai de début octobre 2026 ;
- le choix de la direction 6, avec une fiche de contrôle en attendant.

Rien n'a été vérifié techniquement : la qualité du PDF et le risque de perte des données du navigateur restent des suppositions (voir « Pourquoi celle-ci »).
