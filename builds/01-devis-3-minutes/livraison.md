# Livraison — Devis 3 minutes

## 15/09/2026

### En ligne

- **Adresse :** https://karnonson.github.io/devis-3-minutes/
- **Date :** 15/09/2026
- **Commit :** `9388e89` sur `main` (code identique à `c1f11e5`, la version contrôlée ; fichiers servis comparés un à un au commit)
- **Tranches :** 01 à 10, toutes auditées *fusionner*
- **Projet :** https://github.com/Karnonson/devis-3-minutes (public), GitHub Pages depuis `main`, à la racine. 0 € par mois.

### Mise en ligne

Depuis le dossier du projet, GitHub CLI connecté au compte Karnonson (jeton gardé par `gh` dans le trousseau du système, jamais dans le projet) :

1. `gh repo create Karnonson/devis-3-minutes --public --source . --remote origin --push`
2. `gh api -X POST repos/Karnonson/devis-3-minutes/pages -f 'source[branch]=main' -f 'source[path]=/'`
3. Attendre `gh api repos/Karnonson/devis-3-minutes/pages --jq .status` = `built`.

Une nouvelle version : `git push origin main`, puis attendre `built` de la même façon.

Alerte de coût : aucune, rien n'est payant et aucune carte n'est enregistrée (**Coût**). Copies : aucune à activer, la copie du code est le projet GitHub (**Données**).

### Vérifié en ligne

Le trajet et les PDF ont été rejoués sur la vraie adresse dans Chrome sans fenêtre, profil jetable supprimé ensuite (copies de `tests/trajet.js` et `tests/pdf.js` pointées sur l'adresse en ligne, hors du projet). Horloge de la page au mardi 6 octobre 2026, 20 h 30.

**Trajet**
- Préparé : première ouverture sur les réglages avec « Bienvenue dans Devis 3 minutes. » — vu (`captures/livraison-premiere-ouverture.png`).
- 1-2. Le favori ouvre la liste, du plus récent au plus ancien (DEV-2026-021, 020, 019 Karma SAS « Envoyé ») — vu.
- 3. « Dupliquer » sur DEV-2026-019 : DEV-2026-022 s'ouvre, daté du 06/10/2026, valable jusqu'au 05/11/2026, client vide, lignes, TVA 20 %, remise 10 % et acompte 30 % copiés, quatre lignes « à relire », coordonnées et conditions des réglages — vu (`captures/livraison-karma-signale.png`).
- 4. « Karma » signalé en rouge dans le détail de la ligne 1, avec la note ; client tapé, ligne cochée, détail réécrit (plus de rouge), quantité changée, ligne « Support » supprimée après confirmation ; TTC 3 402,00 €, acompte 1 020,60 €, reste à payer 2 381,40 € — vu (`captures/livraison-karma-reecrit.png`).
- 5. « Sortir le PDF » refusé : « Adresse du client » listé, case entourée en rouge, pas d'impression — vu (`captures/livraison-adresse-refusee.png`).
- 6. Second clic : « 1 ligne encore à relire — Ligne 3 : Suivi à un mois », impression ouverte avec le titre « DEV-2026-022 - Studio Lune » — vu (`captures/livraison-pdf-rappel.png`).
- 7. Statut « Envoyé » dans la liste, gardé après rechargement, DEV-2026-019 inchangé — vu (`captures/livraison-liste-envoye.png`).

**Fait quand vus de l'extérieur**
- PDF A4, sobre, identique à l'aperçu, exemple de référence TTC 2 430,00 € et reste à payer 1 701,00 €, « DEV-2026-001 — page 1/1 » (tranches 01, 04, 05, 07) — vu (`captures/livraison-pdf-court.png`).
- Devis de 2 et 3 pages : en-tête du tableau répété, aucune ligne coupée, totaux et « Bon pour accord » ensemble, « page 2/2 », rien ajouté par Chrome, contraste en gris (tranche 07) — vu, les 5 passages de `tests/pdf.js` passent en ligne (`captures/livraison-pdf-deux-pages-p2.png`).
- Nom de fichier proposé « <numéro> - <client> » (tranches 01, 06) — vu par le titre relevé à l'ouverture de l'impression ; les quatre PDF gardés portaient « DEV-2026-00x - Studio Lune ».
- La page ne charge que ses propres fichiers (`styles.css`, `app.js`, `calc.js`, police) depuis l'adresse, tous en 200, aucun appel ailleurs (**Pièces**) — vu.

**Dans le Chrome de la personne** (son profil habituel, vu et rapporté par elle)
- L'adresse ouvre les réglages avec « Bienvenue dans Devis 3 minutes. », champs vides : sa vraie liste part vide, sans devis d'essai (stories 1, 72) — vu par la personne.
- Favori posé ; coordonnées tapées ; « Prochain numéro » 26 donne « Prochain devis : DEV-2026-026. » (story 9) — vu par la personne.
- Chrome fermé et rouvert : le favori ouvre la liste « Aucun devis », réglages toujours là (story 7) — vu par la personne.
- Conservation demandée à Chrome (story 61) : `navigator.storage.persisted()` affiche `false` — Chrome n'a pas (encore) accordé le stockage persistant, comme en local. La page fonctionne ; la liste reste effaçable seulement par les cas listés dans **Données**.

Ce que la vérification a créé (profil Chrome jetable, devis d'essai, PDF d'essai) est supprimé. Rien n'a été envoyé par e-mail.

### Si ça casse

- **Revenir à la version précédente :** `git revert <commit fautif>` puis `git push origin main`, et attendre `built`. Aucune version n'était en ligne avant `9388e89` : pour tout retirer, `gh api -X DELETE repos/Karnonson/devis-3-minutes/pages` (l'adresse ne répond plus, les devis restent dans Chrome) ; pour supprimer le projet, github.com → projet → Settings → Delete this repository.
- **Récupérer les données**, comme le dit **Données** : la liste des devis n'a pas de copie (accepté en Q1) ; les devis envoyés restent en PDF dans les e-mails envoyés. Si les réglages sont perdus, les retaper et régler « Prochain numéro » d'après le dernier devis retrouvé dans les e-mails. Le code se retrouve depuis le projet GitHub (`git clone git@github.com:Karnonson/devis-3-minutes.git`) ou l'ordinateur.
- **Où regarder :** état de la publication avec `gh api repos/Karnonson/devis-3-minutes/pages --jq .status` et sur github.com/Karnonson/devis-3-minutes/actions (« pages-build-deployment ») ; dans Chrome, F12 → Console pour les erreurs de la page, F12 → Application → Local storage → `https://karnonson.github.io` pour les clés `devis-3-minutes:…`. Ne jamais renommer le compte Karnonson ni le projet : l'adresse changerait et la liste semblerait vide.

### Reste à faire

- Dans quelques semaines d'usage par le favori, refaire F12 → Console → `await navigator.storage.persisted()` pour voir si Chrome a accordé la conservation (`false` le 15/09/2026). *à la main*
- Rien de faux trouvé en ligne.
