# Code

## 5fc4dd9...82cb67e

Diff lu : `git diff 5fc4dd9...HEAD` sans `builds/*/*.md`, `builds/*/audits/**`, `builds/*/captures/**` (tranches 01 à 10 : `app.js`, `calc.js`, `index.html`, `styles.css`, `tests/`). Avis, pas des fautes.

**1. `rafraichir` fait trop de choses** — `app.js` 571-687. Elle met en rouge remise, acompte et validité (`$(cle).classList.toggle('invalide', refuse)`, `$('validite').classList.toggle(...)`), écrit le total de chaque ligne dans la saisie, fabrique toute la feuille A4 en une chaîne `feuille.innerHTML = '<header class="f-entete">' + …`, puis appelle `marquerManques()`, `marquerRelire()` et `marquerAncienClient()`. Chaque tranche y a ajouté un bout, et toute la feuille est refaite à chaque touche. Correction : sortir la feuille dans une fonction `feuilleHtml(devis)` qui ne touche pas à la saisie, et laisser à part ce qui marque les cases.

**2. Les mêmes contrôles écrits deux fois** — quantité et prix refusés dans `marquerManques` (`!vide(l.quantite) && Calc.lireQuantite(l.quantite) === null`, 725-726) et dans `manquesDuDevis` (`else if (lireValeur(l[c]) === null)`, 707) ; remise, acompte et validité dans `rafraichir` (576, 583) et encore dans `manquesDuDevis` (711-714). La date, elle, se vérifie sur la case (`$('devis-date').value`), pas sur le devis. Une règle changée d'un côté seulement donnerait une case rouge sans manque, ou l'inverse. Correction : une seule fonction `refusDuDevis(devis)` qui liste les champs refusés, lue à la fois pour le rouge et pour la liste des manques.

**3. Les valeurs par défaut d'un devis sont à trois endroits** — `ouvrirDevis` les remet en place (`if (TAUX_POSSIBLES.indexOf(devis.tva) === -1) devis.tva = TAUX_TVA;`, 400-405), `nouveauDevis` les refait pour une copie (373-375), mais `dessinerListe` prend le devis brut (`Calc.totaux(d.lignes || [], d.tva, d.remise).ttc`, 272). Vérifié : un devis enregistré sans `tva` affiche son TTC à 0 % dans la liste et à 20 % à l'écran. Correction : une seule fonction `completerDevis(d)` appelée dans `tousLesDevis()`, pour que tout le code lise des devis déjà complets.

Aussi remarqué, moins coûteux : le lancement du serveur et de Chrome (`pageRepond`, `before`) est recopié dans `tests/page.js`, `tests/pdf.js` et `tests/trajet.js`.
