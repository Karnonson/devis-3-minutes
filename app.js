// Devis 3 minutes — la page : réglages, liste des devis, écran du devis avec aperçu A4, PDF par l'impression.
// Tout est gardé dans la mémoire de Chrome (localStorage), à chaque frappe.
(function () {
  'use strict';

  const TITRE_PAGE = document.title;
  // Valeurs de départ d'un nouveau devis, en attendant qu'elles viennent des réglages (tranche 05).
  const TAUX_TVA = 20;
  const TAUX_POSSIBLES = [20, 10, 0];
  const ACOMPTE = '30';

  const $ = (id) => document.getElementById(id);
  const ecrans = { liste: $('liste'), reglages: $('reglages'), devis: $('devis') };
  const listeLignes = $('lignes');
  const modeleLigne = $('modele-ligne');
  const feuille = $('feuille');

  let devis = null;

  function afficherEcran(nom) {
    Object.keys(ecrans).forEach((k) => { ecrans[k].hidden = k !== nom; });
  }

  // ---- Mémoire de la page ----
  // Clés préfixées : les autres projets GitHub Pages du même compte partagent l'origine.

  const CLE_DEVIS = 'devis-3-minutes:devis';
  const CLE_COMPTEUR = 'devis-3-minutes:compteur';
  const CLE_REGLAGES = 'devis-3-minutes:reglages';

  // Demande discrète à Chrome de ne pas effacer ces données de lui-même ; rien ne s'affiche.
  try { navigator.storage.persist().catch(() => {}); } catch (e) { /* non disponible */ }

  function lire(cle, defaut) {
    try {
      const v = localStorage.getItem(cle);
      return v === null ? defaut : JSON.parse(v);
    } catch (e) {
      return defaut;
    }
  }

  function ecrire(cle, valeur) {
    try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch (e) { /* mémoire indisponible */ }
  }

  function tousLesDevis() {
    const liste = lire(CLE_DEVIS, []);
    return Array.isArray(liste) ? liste : [];
  }

  // Relit la liste avant d'écrire : un autre onglet a pu créer ou modifier un autre devis.
  // Pour un même devis, la dernière saisie l'emporte.
  function enregistrer() {
    const liste = tousLesDevis();
    const i = liste.findIndex((d) => d.numero === devis.numero);
    if (i === -1) liste.push(devis); else liste[i] = devis;
    ecrire(CLE_DEVIS, liste);
  }

  const deuxChiffres = (n) => String(n).padStart(2, '0');

  const formaterNumero = (annee, n) => 'DEV-' + annee + '-' + String(n).padStart(3, '0');

  // Numéro que recevra le prochain devis, sans le consommer. Le compteur repart à 001 avec une
  // nouvelle année et saute un numéro encore présent dans la liste.
  function numeroSuivant(liste) {
    const annee = new Date().getFullYear();
    const c = lire(CLE_COMPTEUR, null);
    let n = c && c.annee === annee && c.prochain >= 1 ? c.prochain : 1;
    const pris = new Set(liste.map((d) => d.numero));
    while (pris.has(formaterNumero(annee, n))) n++;
    return { annee: annee, n: n };
  }

  function prochainNumero(liste) {
    const s = numeroSuivant(liste);
    ecrire(CLE_COMPTEUR, { annee: s.annee, prochain: s.n + 1 });
    return formaterNumero(s.annee, s.n);
  }

  // ---- Réglages ----

  const MODELE_CONDITIONS = [
    'Acompte à la commande, solde à réception de la facture, payable sous 30 jours.',
    'Clients professionnels : tout retard de paiement entraîne des pénalités au taux de trois fois le taux d\'intérêt légal et une indemnité forfaitaire pour frais de recouvrement de 40 €.',
    'Devis gratuit. Offre valable jusqu\'à la date « Valable jusqu\'au » indiquée en haut du devis.',
  ].join('\n');

  const COORDONNEES = ['nom', 'adresse', 'siret', 'email', 'telephone', 'tvaIntra'];
  const ESSENTIELS = ['nom', 'adresse', 'siret'];

  function lireReglages() {
    const r = lire(CLE_REGLAGES, null);
    const base = { conditions: MODELE_CONDITIONS };
    COORDONNEES.forEach((k) => { base[k] = ''; });
    if (r && typeof r === 'object') {
      Object.keys(base).forEach((k) => { if (typeof r[k] === 'string') base[k] = r[k]; });
    }
    return base;
  }

  // Le premier réglage essentiel encore vide (nom, adresse, SIRET), ou null.
  function essentielManquant(reglages) {
    return ESSENTIELS.find((k) => !reglages[k].trim()) || null;
  }

  const formReglages = $('form-reglages');

  function afficherReglages() {
    const r = lireReglages();
    formReglages.querySelectorAll('[data-reglage]').forEach((el) => { el.value = r[el.dataset.reglage]; });
    const s = numeroSuivant(tousLesDevis());
    $('prochain-numero').value = String(s.n);
    montrerProchainNumero(false);
    const manque = essentielManquant(r);
    $('accueil').hidden = !manque;
    afficherEcran('reglages');
    if (manque) formReglages.querySelector('[data-reglage="' + manque + '"]').focus();
  }

  formReglages.addEventListener('input', (e) => {
    const cle = e.target.dataset.reglage;
    if (!cle) return;
    const r = lireReglages();
    r[cle] = e.target.value;
    ecrire(CLE_REGLAGES, r);
  });

  $('prochain-numero').addEventListener('input', () => montrerProchainNumero(true));

  function lireProchainNumero() {
    const t = $('prochain-numero').value.trim();
    return /^\d{1,6}$/.test(t) && Number(t) >= 1 ? Number(t) : null;
  }

  function montrerProchainNumero(enregistrerNumero) {
    const n = lireProchainNumero();
    const aide = $('prochain-apercu');
    const champ = $('prochain-numero');
    champ.classList.toggle('invalide', n === null);
    aide.classList.toggle('erreur', n === null);
    if (n === null) {
      aide.textContent = 'Un nombre entier, à partir de 1.';
      return;
    }
    // Un numéro encore présent dans la liste est sauté : on montre celui qui sera vraiment donné.
    if (enregistrerNumero) ecrire(CLE_COMPTEUR, { annee: new Date().getFullYear(), prochain: n });
    const s = numeroSuivant(tousLesDevis());
    aide.textContent = 'Prochain devis : ' + formaterNumero(s.annee, s.n) +
      (s.n !== n ? ' (' + formaterNumero(s.annee, n) + ' existe déjà).' : '.');
  }

  // ---- Écrans et adresse : #DEV-2026-001, #reglages, sinon la liste ----

  function router() {
    const cible = decodeURIComponent(location.hash.slice(1));
    if (cible === 'reglages') {
      devis = null;
      afficherReglages();
    } else if (cible && ouvrirDevis(cible)) {
      afficherEcran('devis');
      ajusterApercu();
    } else {
      devis = null;
      dessinerListe();
      afficherEcran('liste');
    }
  }
  window.addEventListener('hashchange', router);

  // Liste modifiée dans un autre onglet : la liste affichée suit.
  window.addEventListener('storage', (e) => {
    if (e.key === CLE_DEVIS && !ecrans.liste.hidden) dessinerListe();
  });

  // ---- Liste ----

  const STATUTS = { brouillon: 'Brouillon' };

  function dateCourte(iso) {
    const [a, m, j] = String(iso).split('-');
    return j + '/' + m + '/' + a;
  }

  function dessinerListe() {
    const liste = tousLesDevis().slice().reverse(); // le dernier créé en haut
    const corps = $('liste-lignes');
    corps.textContent = '';
    liste.forEach((d) => {
      const tr = document.createElement('tr');
      tr.dataset.numero = d.numero;
      const nom = d.client && d.client.nom.trim();
      const cellules = [
        ['col-numero', null],
        [nom ? 'col-client' : 'col-client sans-client', nom || '(sans client)'],
        ['col-date', dateCourte(d.date)],
        ['col-nombre', Calc.formatEuros(Calc.totaux(d.lignes || [], d.tva, d.remise).ttc)],
        ['col-statut', null],
      ];
      cellules.forEach(([classe, texte]) => {
        const td = document.createElement('td');
        td.className = classe;
        if (texte !== null) td.textContent = texte;
        tr.appendChild(td);
      });
      const lien = document.createElement('a');
      lien.href = '#' + d.numero;
      lien.textContent = d.numero;
      tr.querySelector('.col-numero').appendChild(lien);
      const statut = document.createElement('span');
      statut.className = 'statut statut-' + d.statut;
      statut.textContent = STATUTS[d.statut] || d.statut;
      tr.querySelector('.col-statut').appendChild(statut);
      corps.appendChild(tr);
    });
    $('liste-vide').hidden = liste.length > 0;
    $('liste-devis').hidden = liste.length === 0;
  }

  $('liste-lignes').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-numero]');
    if (tr && !e.target.closest('a')) location.hash = tr.dataset.numero;
  });

  // ---- Création et ouverture ----

  function ligneVide() {
    return { titre: '', detail: '', quantite: '', prix: '' };
  }

  function nouveauDevis() {
    const reglages = lireReglages();
    if (essentielManquant(reglages)) {
      if (location.hash === '#reglages') afficherReglages(); else location.hash = 'reglages';
      return;
    }
    const liste = tousLesDevis();
    const maintenant = new Date();
    // Copie des coordonnées du jour : un changement de réglages ne touche pas ce devis.
    const emetteur = {};
    COORDONNEES.forEach((k) => { emetteur[k] = reglages[k]; });
    const d = {
      numero: prochainNumero(liste),
      cree: maintenant.toISOString(),
      date: maintenant.getFullYear() + '-' + deuxChiffres(maintenant.getMonth() + 1) + '-' + deuxChiffres(maintenant.getDate()),
      statut: 'brouillon',
      client: { nom: '', contact: '', adresse: '' },
      emetteur: emetteur,
      lignes: [ligneVide()],
      tva: TAUX_TVA,
      remise: '0',
      acompte: ACOMPTE,
    };
    liste.push(d);
    ecrire(CLE_DEVIS, liste);
    location.hash = d.numero;
  }

  // Ouvre le devis tel qu'il est dans la mémoire ; false s'il n'existe pas.
  function ouvrirDevis(numero) {
    const trouve = tousLesDevis().find((d) => d.numero === numero);
    if (!trouve) return false;
    devis = trouve;
    $('client-nom').value = devis.client.nom;
    $('client-contact').value = devis.client.contact;
    $('client-adresse').value = devis.client.adresse;
    // Devis créé avant la tranche 04 : valeurs de départ.
    if (TAUX_POSSIBLES.indexOf(devis.tva) === -1) devis.tva = TAUX_TVA;
    if (typeof devis.remise !== 'string') devis.remise = '0';
    if (typeof devis.acompte !== 'string') devis.acompte = ACOMPTE;
    document.querySelectorAll('#tva-choix input').forEach((el) => { el.checked = Number(el.value) === devis.tva; });
    $('remise').value = devis.remise;
    $('acompte').value = devis.acompte;
    $('devis-numero-barre').textContent = devis.numero;
    afficherEcran('devis');
    dessinerLignes();
    $('client-nom').focus();
    return true;
  }

  // ---- Saisie ----

  function dessinerLignes(focusRang, focusAction) {
    listeLignes.textContent = '';
    devis.lignes.forEach((ligne, i) => {
      const li = modeleLigne.content.firstElementChild.cloneNode(true);
      li.dataset.rang = i;
      li.querySelector('.ligne-rang').textContent = 'Ligne ' + (i + 1);
      li.querySelectorAll('[data-champ]').forEach((el) => {
        if (el.tagName === 'OUTPUT') return;
        el.value = ligne[el.dataset.champ];
        // Les exemples ne s'affichent que sur la première ligne.
        if (i > 0 && (el.dataset.champ === 'titre' || el.dataset.champ === 'detail')) el.placeholder = '';
      });
      li.querySelector('[data-action="monter"]').disabled = i === 0;
      li.querySelector('[data-action="descendre"]').disabled = i === devis.lignes.length - 1;
      listeLignes.appendChild(li);
    });
    if (focusRang != null) {
      const li = listeLignes.children[focusRang];
      const cible = li && (focusAction ? li.querySelector('[data-action="' + focusAction + '"]:not(:disabled)') : null);
      (cible || (li && li.querySelector('[data-champ="titre"]')) || $('ajouter-ligne')).focus();
    }
    rafraichir();
  }

  listeLignes.addEventListener('input', (e) => {
    const champ = e.target.dataset.champ;
    const li = e.target.closest('.ligne');
    if (!champ || !li) return;
    devis.lignes[Number(li.dataset.rang)][champ] = e.target.value;
    enregistrer();
    rafraichir();
  });

  listeLignes.addEventListener('click', (e) => {
    const bouton = e.target.closest('button[data-action]');
    if (!bouton) return;
    const i = Number(bouton.closest('.ligne').dataset.rang);
    const action = bouton.dataset.action;
    if (action === 'monter' && i > 0) {
      echanger(i, i - 1);
      dessinerLignes(i - 1, 'monter');
    } else if (action === 'descendre' && i < devis.lignes.length - 1) {
      echanger(i, i + 1);
      dessinerLignes(i + 1, 'descendre');
    } else if (action === 'supprimer') {
      const titre = devis.lignes[i].titre.trim();
      const question = titre ? 'Supprimer la ligne « ' + titre + ' » ?' : 'Supprimer la ligne ' + (i + 1) + ' ?';
      if (!window.confirm(question)) return;
      devis.lignes.splice(i, 1);
      enregistrer();
      dessinerLignes(Math.min(i, devis.lignes.length - 1));
    }
  });

  function echanger(a, b) {
    const l = devis.lignes;
    const x = l[a]; l[a] = l[b]; l[b] = x;
    enregistrer();
  }

  $('ajouter-ligne').addEventListener('click', () => {
    devis.lignes.push(ligneVide());
    enregistrer();
    dessinerLignes(devis.lignes.length - 1);
  });

  [['client-nom', 'nom'], ['client-contact', 'contact'], ['client-adresse', 'adresse']].forEach(([id, cle]) => {
    $(id).addEventListener('input', (e) => {
      devis.client[cle] = e.target.value;
      enregistrer();
      rafraichir();
    });
  });

  $('tva-choix').addEventListener('change', (e) => {
    devis.tva = Number(e.target.value);
    enregistrer();
    rafraichir();
  });

  // Remise et acompte : gardés tels que tapés ; hors de 0 à 100, la case est rouge et compte pour 0 %.
  ['remise', 'acompte'].forEach((cle) => {
    $(cle).addEventListener('input', (e) => {
      devis[cle] = e.target.value;
      enregistrer();
      rafraichir();
    });
  });

  // ---- Aperçu ----

  function echapper(texte) {
    return String(texte).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function rafraichir() {
    const t = Calc.totaux(devis.lignes, devis.tva, devis.remise, devis.acompte);
    const euros = Calc.formatEuros;

    ['remise', 'acompte'].forEach((cle) => {
      const refuse = Calc.lirePourcentage(devis[cle]) === null;
      $(cle).classList.toggle('invalide', refuse);
      $(cle + '-aide').hidden = !refuse;
      $(cle + '-aide').classList.toggle('erreur', refuse);
    });

    // Totaux de ligne dans la saisie.
    listeLignes.querySelectorAll('.ligne').forEach((li, i) => {
      li.querySelector('output[data-champ="total"]').textContent = euros(t.lignes[i]);
    });

    const m = devis.emetteur || {};
    const rempli = (k) => typeof m[k] === 'string' && m[k].trim();
    // Seuls les champs remplis s'impriment : pas de libellé vide (TVA intracommunautaire facultative).
    const emetteur = [
      rempli('nom') ? '<p class="emetteur-nom">' + echapper(m.nom.trim()) + '</p>' : '',
      rempli('adresse') ? '<p class="texte-multiligne">' + echapper(m.adresse.trim()) + '</p>' : '',
      rempli('email') ? '<p>' + echapper(m.email.trim()) + '</p>' : '',
      rempli('telephone') ? '<p>' + echapper(m.telephone.trim()) + '</p>' : '',
    ].join('');
    const legal = [
      rempli('siret') ? '<p>SIRET ' + echapper(m.siret.trim()) + '</p>' : '',
      rempli('tvaIntra') ? '<p>N° TVA intracommunautaire ' + echapper(m.tvaIntra.trim()) + '</p>' : '',
    ].join('');

    const c = devis.client;
    const client = [
      c.nom.trim() ? '<p class="client-nom">' + echapper(c.nom) + '</p>' : '',
      c.contact.trim() ? '<p>' + echapper(c.contact) + '</p>' : '',
      c.adresse.trim() ? '<p class="texte-multiligne">' + echapper(c.adresse.trim()) + '</p>' : '',
    ].join('');

    const lignes = devis.lignes.map((l, i) => (
      '<tr>' +
        '<td class="col-prestation">' +
          '<div class="prestation-titre">' + echapper(l.titre) + '</div>' +
          (l.detail.trim() ? '<div class="prestation-detail texte-multiligne">' + echapper(l.detail.trim()) + '</div>' : '') +
        '</td>' +
        '<td class="col-nombre">' + echapper(l.quantite.trim().replace('.', ',')) + '</td>' +
        '<td class="col-nombre">' + (Calc.lireCentiemes(l.prix) === null ? echapper(l.prix) : euros(Calc.lireCentiemes(l.prix))) + '</td>' +
        '<td class="col-nombre">' + euros(t.lignes[i]) + '</td>' +
      '</tr>'
    )).join('');

    // Remise, TVA ou acompte à 0 % : leurs lignes disparaissent. TVA à 0 % : « Total » et mention art. 293 B.
    const pct = (texte) => Calc.formatPourcentage(Calc.lirePourcentage(texte) || 0) + '&nbsp;%';
    const franchise = devis.tva === 0;
    const ligneTotal = (classe, libelle, montant) =>
      '<tr' + (classe ? ' class="' + classe + '"' : '') + '><th>' + libelle + '</th><td>' + montant + '</td></tr>';
    const totaux = [ligneTotal('', 'Total HT', euros(t.ht))];
    if ((Calc.lirePourcentage(devis.remise) || 0) > 0) {
      totaux.push(ligneTotal('f-remise', 'Remise ' + pct(devis.remise), '−' + euros(t.remise)));
      totaux.push(ligneTotal('', 'Total HT après remise', euros(t.htApresRemise)));
    }
    if (!franchise) totaux.push(ligneTotal('', 'TVA ' + devis.tva + '&nbsp;%', euros(t.tva)));
    totaux.push(ligneTotal('f-ttc', franchise ? 'Total' : 'Total TTC', euros(t.ttc)));
    if ((Calc.lirePourcentage(devis.acompte) || 0) > 0) {
      totaux.push(ligneTotal('f-acompte', 'Acompte à la commande (' + pct(devis.acompte) + ')', euros(t.acompte)));
      totaux.push(ligneTotal('f-reste', 'Reste à payer', euros(t.reste)));
    }

    feuille.innerHTML =
      '<header class="f-entete">' +
        '<div class="f-emetteur">' + emetteur + (legal ? '<div class="emetteur-legal">' + legal + '</div>' : '') + '</div>' +
        '<div class="f-document">' +
          '<h1>DEVIS</h1>' +
          '<p class="f-numero">' + echapper(devis.numero) + '</p>' +
        '</div>' +
      '</header>' +
      '<section class="f-client">' +
        '<p class="f-etiquette">Client</p>' + client +
      '</section>' +
      '<table class="f-tableau">' +
        '<thead><tr>' +
          '<th class="col-prestation">Prestation</th>' +
          '<th class="col-nombre">Qté</th>' +
          '<th class="col-nombre">PU HT</th>' +
          '<th class="col-nombre">Total HT</th>' +
        '</tr></thead>' +
        '<tbody>' + lignes + '</tbody>' +
      '</table>' +
      '<table class="f-totaux">' + totaux.join('') + '</table>' +
      (franchise ? '<p class="f-mention-tva">TVA non applicable, art. 293 B du CGI</p>' : '');
  }

  // L'aperçu garde les proportions A4 et se réduit si la place manque.
  const zoneApercu = $('apercu-zone');
  function ajusterApercu() {
    if (ecrans.devis.hidden) return;
    feuille.style.zoom = '';
    const dispo = zoneApercu.clientWidth - 48;
    const largeur = feuille.offsetWidth;
    if (largeur > dispo && dispo > 0) feuille.style.zoom = String(dispo / largeur);
  }
  new ResizeObserver(ajusterApercu).observe(zoneApercu);

  // ---- PDF ----

  $('sortir-pdf').addEventListener('click', () => {
    const nom = devis.client.nom.trim();
    // Chrome propose le titre de la page comme nom du fichier PDF.
    document.title = nom ? devis.numero + ' - ' + nom : devis.numero;
    window.print();
  });

  window.addEventListener('afterprint', () => { document.title = TITRE_PAGE; });
  window.addEventListener('beforeprint', () => { feuille.style.zoom = ''; });
  window.addEventListener('afterprint', ajusterApercu);

  $('nouveau-devis').addEventListener('click', nouveauDevis);
  $('nouveau-devis-vide').addEventListener('click', nouveauDevis);

  // Ouverture sans écran demandé et sans l'essentiel des réglages (première ouverture, données
  // effacées, autre profil) : la page s'ouvre sur les réglages.
  if (!location.hash.slice(1) && essentielManquant(lireReglages())) history.replaceState(null, '', '#reglages');
  router();
})();
