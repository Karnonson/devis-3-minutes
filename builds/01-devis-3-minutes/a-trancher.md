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
