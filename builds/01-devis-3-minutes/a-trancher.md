# À trancher — Devis 3 minutes

## 04 — Place de la mention « TVA non applicable »

**Question :** sur un devis à 0 % de TVA, où voulez-vous lire « TVA non applicable, art. 293 B du CGI » par rapport à l'acompte et au reste à payer ?
**Choix :**
- Sous tout le bloc des totaux, après « Reste à payer », en petit et aligné à droite.
- Juste sous « Total », avant « Acompte à la commande » et « Reste à payer ».
- En bas du devis, avec les conditions.
**En attendant :** la mention est sous tout le bloc des totaux, après « Reste à payer » (capture `captures/04-tva-0.png`). La déplacer sous « Total » ou vers les conditions ne touche qu'une ligne de l'aperçu et une ligne du contrôle automatique.
**Réponse :**

## 05 — Contenu du cadre « Bon pour accord »

**Question :** que doit contenir le cadre « Bon pour accord » que le prospect remplit pour accepter le devis ?
**Choix :**
- Le titre « Bon pour accord » et deux cases vides, « Date » et « Signature ».
- Les mêmes, avec une ligne d'aide « Date, signature et mention manuscrite « Bon pour accord » ».
- Les mêmes, avec en plus une case « Nom et qualité du signataire ».
**En attendant :** le cadre a le titre et deux cases vides « Date » et « Signature », à droite sous les conditions (captures `captures/05-nouveau-devis-bas.png` et `captures/05-pdf.png`). Ajouter une ligne d'aide ou une case ne touche que le cadre de l'aperçu et une ligne du contrôle automatique.
**Réponse :**

## 06 — Cases rouges hors client et lignes au moment du PDF

**Question :** quand la remise, l'acompte, la validité ou la date du devis sont entourés en rouge (mal tapés), voulez-vous que « Sortir le PDF » refuse aussi, ou que le PDF sorte tel que l'aperçu le montre ?
**Choix :**
- Refuser : toute case rouge du devis bloque le PDF et apparaît dans la liste des manques (« Remise à corriger »…).
- Laisser sortir : seuls le client, les lignes, les quantités et les prix bloquent ; une remise ou un acompte refusé compte pour 0 %, une validité refusée n'imprime pas « Valable jusqu'au », une date incomplète garde la dernière date complète.
**En attendant :** le PDF est refusé et la liste dit quoi corriger. Laisser sortir revient à retirer quatre lignes de la liste des manques dans `app.js` et un passage du contrôle automatique.
**Réponse :**

## 08 — Où se trouve « Supprimer » un devis

**Question :** d'où voulez-vous pouvoir supprimer un devis ?
**Choix :**
- Depuis la liste seulement : un lien discret « Supprimer » en bout de chaque ligne.
- Depuis l'écran du devis seulement, dans la barre du haut, à côté du statut.
- Des deux endroits.
**En attendant :** « Supprimer » est en bout de chaque ligne de la liste, avec la confirmation de Chrome (capture `captures/08-liste-statuts.png`). L'ajouter sur l'écran du devis est un bouton de plus dans la barre, qui reprend la même suppression, et un passage du contrôle automatique.
**Réponse :**

## 08 — Couleurs des statuts

**Question :** comment voulez-vous distinguer d'un coup d'œil les quatre statuts dans la liste ?
**Choix :**
- Sans vert, dans les tons bleu nuit : « Brouillon » gris, « Envoyé » bleu pâle, « Accepté » bleu nuit plein, « Refusé » blanc bordé de gris.
- Façon Stripe : « Accepté » en vert sapin pâle et « Refusé » en rouge pâle, les deux autres comme ci-dessus.
- Toutes les pastilles grises, seul le mot change.
**En attendant :** les pastilles restent dans les tons bleu nuit, pour garder le vert sapin aux boutons et au total TTC comme le dit **Apparence** (capture `captures/08-liste-statuts.png`). Changer les couleurs ne touche que quatre lignes de `styles.css`.
**Réponse :**

## 09 — Allure des lignes « à relire »

**Question :** comment voulez-vous voir, dans la saisie, les lignes copiées qui restent à relire ?
**Choix :**
- Fond ambre pâle, filet ambre à gauche, pastille « À relire » et case « Relue » sur la ligne.
- Même chose en bleu pâle, dans les tons bleu nuit de la page.
- Fond blanc, seulement la pastille « À relire » et la case « Relue ».
**En attendant :** fond ambre pâle, distinct du rouge des erreurs et du vert sapin des boutons (capture `captures/09-copie-a-relire.png`). Changer la teinte ne touche que quelques lignes de `styles.css`.
**Réponse :**

## 09 — Le rappel des lignes à relire au moment du PDF

**Question :** quand vous sortez le PDF avec des lignes encore à relire, comment voulez-vous être prévenu ?
**Choix :**
- Un encadré en haut de la saisie qui liste les lignes, et la fenêtre d'impression s'ouvre aussitôt par-dessus.
- Une boîte de Chrome « 2 lignes encore à relire » à fermer d'un clic avant que la fenêtre d'impression s'ouvre.
- Un court message à côté du bouton « Sortir le PDF », sans la liste des lignes.
**En attendant :** l'encadré en haut de la saisie, qui ne demande aucun clic de plus (capture `captures/09-pdf-rappel.png`). Passer à une boîte de Chrome est une ligne dans `app.js` et un passage du contrôle automatique, mais ajoute un clic chaque soir.
**Réponse :**
