// Devis 3 minutes — la page : réglages, liste des devis, écran du devis avec aperçu A4, PDF par l'impression.
// Tout est gardé dans la mémoire de Chrome (localStorage), à chaque frappe.
(function () {
  'use strict';

  const TITRE_PAGE = document.title;
  // Valeurs habituelles de départ des réglages ; aussi celles d'un devis créé avant qu'elles existent.
  const TAUX_TVA = 20;
  const TAUX_POSSIBLES = [20, 10, 0];
  const ACOMPTE = '30';
  const VALIDITE = '30';

  const $ = (id) => document.getElementById(id);
  const ecrans = { liste: $('liste'), reglages: $('reglages'), devis: $('devis') };
  const listeLignes = $('lignes');
  const modeleLigne = $('modele-ligne');
  const feuille = $('feuille');

  let devis = null;
  // Vrai après un clic refusé sur « Sortir le PDF », jusqu'à ce que tout soit complété ou le devis quitté.
  let refusAffiche = false;

  function afficherEcran(nom) {
    Object.keys(ecrans).forEach((k) => { ecrans[k].hidden = k !== nom; });
  }

  // Pied de chaque page imprimée, dans la marge du bas : « DEV-2026-001 — page 1/2 ». Vide hors d'un devis.
  const piedDePage = document.head.appendChild(document.createElement('style'));
  function poserPiedDePage(numero) {
    piedDePage.textContent = numero
      ? '@page { @bottom-right { content: "' + String(numero).replace(/["\\\n]/g, '') +
        ' — page " counter(page) "/" counter(pages); } }'
      : '';
  }

  // ---- Mémoire de la page ----
  // Clés préfixées : les autres projets GitHub Pages du même compte partagent l'origine.

  const CLE_DEVIS = 'devis-3-minutes:devis';
  const CLE_COMPTEUR = 'devis-3-minutes:compteur';
  const CLE_REGLAGES = 'devis-3-minutes:reglages';
  // Numéros des devis supprimés : jamais redonnés, même si « Prochain numéro » est réglé plus bas.
  const CLE_SUPPRIMES = 'devis-3-minutes:supprimes';

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
  // Pour un même devis, la dernière saisie l'emporte. Un devis supprimé (dans un autre onglet) ne revient pas.
  function enregistrer() {
    const liste = tousLesDevis();
    const i = liste.findIndex((d) => d.numero === devis.numero);
    if (i === -1) return;
    liste[i] = devis;
    ecrire(CLE_DEVIS, liste);
  }

  function numerosSupprimes() {
    const s = lire(CLE_SUPPRIMES, []);
    return Array.isArray(s) ? s : [];
  }

  const deuxChiffres = (n) => String(n).padStart(2, '0');

  const formaterNumero = (annee, n) => 'DEV-' + annee + '-' + String(n).padStart(3, '0');

  // Numéro que recevra le prochain devis, sans le consommer. Le compteur repart à 001 avec une
  // nouvelle année et saute un numéro encore présent dans la liste ou déjà supprimé.
  function numeroSuivant(liste) {
    const annee = new Date().getFullYear();
    const c = lire(CLE_COMPTEUR, null);
    let n = c && c.annee === annee && c.prochain >= 1 ? c.prochain : 1;
    const pris = new Set(liste.map((d) => d.numero).concat(numerosSupprimes()));
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
    const base = { conditions: MODELE_CONDITIONS, acompte: ACOMPTE, validite: VALIDITE };
    COORDONNEES.forEach((k) => { base[k] = ''; });
    if (r && typeof r === 'object') {
      Object.keys(base).forEach((k) => { if (typeof r[k] === 'string') base[k] = r[k]; });
    }
    base.tva = r && TAUX_POSSIBLES.indexOf(r.tva) !== -1 ? r.tva : TAUX_TVA;
    return base;
  }

  // Acompte et validité habituels : gardés tels que tapés, entourés en rouge s'ils sont illisibles.
  const CONTROLES_REGLAGES = {
    acompte: (t) => Calc.lirePourcentage(t) !== null,
    validite: (t) => Calc.lireJours(t) !== null,
  };

  function marquerReglage(cle, el) {
    const refuse = !CONTROLES_REGLAGES[cle](el.value);
    el.classList.toggle('invalide', refuse);
    const aide = formReglages.querySelector('[data-aide="' + cle + '"]');
    aide.hidden = !refuse;
    aide.classList.toggle('erreur', refuse);
  }

  // Le premier réglage essentiel encore vide (nom, adresse, SIRET), ou null.
  function essentielManquant(reglages) {
    return ESSENTIELS.find((k) => !reglages[k].trim()) || null;
  }

  const formReglages = $('form-reglages');

  function afficherReglages() {
    const r = lireReglages();
    formReglages.querySelectorAll('[data-reglage]').forEach((el) => {
      el.value = r[el.dataset.reglage];
      if (CONTROLES_REGLAGES[el.dataset.reglage]) marquerReglage(el.dataset.reglage, el);
    });
    formReglages.querySelectorAll('#reglage-tva input').forEach((el) => { el.checked = Number(el.value) === r.tva; });
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
    if (CONTROLES_REGLAGES[cle]) marquerReglage(cle, e.target);
  });

  $('reglage-tva').addEventListener('change', (e) => {
    const r = lireReglages();
    r.tva = Number(e.target.value);
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
    // Un numéro encore présent dans la liste ou supprimé est sauté : on montre celui qui sera vraiment donné.
    if (enregistrerNumero) ecrire(CLE_COMPTEUR, { annee: new Date().getFullYear(), prochain: n });
    const liste = tousLesDevis();
    const s = numeroSuivant(liste);
    const demande = formaterNumero(s.annee, n);
    const raison = liste.some((d) => d.numero === demande) ? ' existe déjà' : ' a été supprimé';
    aide.textContent = 'Prochain devis : ' + formaterNumero(s.annee, s.n) +
      (s.n !== n ? ' (' + demande + raison + ').' : '.');
  }

  // ---- Écrans et adresse : #DEV-2026-001, #reglages, sinon la liste ----

  function router() {
    const cible = decodeURIComponent(location.hash.slice(1));
    poserPiedDePage('');
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

  // Liste modifiée dans un autre onglet : la liste affichée suit ; un devis ouvert qui y a été supprimé ramène à la liste.
  window.addEventListener('storage', (e) => {
    if (e.key !== CLE_DEVIS) return;
    if (!ecrans.liste.hidden) dessinerListe();
    else if (devis && !tousLesDevis().some((d) => d.numero === devis.numero)) location.hash = '';
  });

  // ---- Statuts ----
  // Changés à la main seulement, depuis la liste ou l'écran du devis ; jamais imprimés.

  const STATUTS = { brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté', refuse: 'Refusé' };
  const statutConnu = (s) => (Object.prototype.hasOwnProperty.call(STATUTS, s) ? s : 'brouillon');

  function remplirMenuStatut(menu, statut) {
    if (!menu.options.length) {
      Object.keys(STATUTS).forEach((k) => menu.add(new Option(STATUTS[k], k)));
    }
    menu.value = statutConnu(statut);
    menu.className = 'statut statut-' + menu.value;
  }

  function changerStatut(numero, statut) {
    const liste = tousLesDevis();
    const d = liste.find((x) => x.numero === numero);
    if (!d) return;
    d.statut = statutConnu(statut);
    ecrire(CLE_DEVIS, liste);
  }

  // ---- Liste ----

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
        ['col-actions', null],
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
      const menu = document.createElement('select');
      menu.setAttribute('aria-label', 'Statut de ' + d.numero);
      remplirMenuStatut(menu, d.statut);
      tr.querySelector('.col-statut').appendChild(menu);
      const supprimer = document.createElement('button');
      supprimer.type = 'button';
      supprimer.className = 'supprimer-devis';
      supprimer.textContent = 'Supprimer';
      supprimer.setAttribute('aria-label', 'Supprimer ' + d.numero);
      tr.querySelector('.col-actions').appendChild(supprimer);
      corps.appendChild(tr);
    });
    $('liste-vide').hidden = liste.length > 0;
    $('liste-devis').hidden = liste.length === 0;
  }

  // Un clic sur la ligne ouvre le devis, sauf sur le lien, le statut ou « Supprimer ».
  $('liste-lignes').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-numero]');
    if (!tr) return;
    if (e.target.closest('.supprimer-devis')) supprimerDevis(tr.dataset.numero);
    else if (!e.target.closest('a, select')) location.hash = tr.dataset.numero;
  });

  $('liste-lignes').addEventListener('change', (e) => {
    const tr = e.target.closest('tr[data-numero]');
    if (!tr || e.target.tagName !== 'SELECT') return;
    changerStatut(tr.dataset.numero, e.target.value);
    remplirMenuStatut(e.target, e.target.value);
  });

  // Suppression définitive après confirmation, quel que soit le statut ; le numéro n'est plus jamais donné.
  function supprimerDevis(numero) {
    const d = tousLesDevis().find((x) => x.numero === numero);
    if (!d) return;
    const nom = d.client && d.client.nom.trim();
    const question = 'Supprimer le devis ' + numero + (nom ? ' (' + nom + ')' : '') + ' ? Ce numéro ne sera plus jamais donné.';
    if (!window.confirm(question)) return;
    const supprimes = numerosSupprimes();
    if (supprimes.indexOf(numero) === -1) ecrire(CLE_SUPPRIMES, supprimes.concat(numero));
    ecrire(CLE_DEVIS, tousLesDevis().filter((x) => x.numero !== numero));
    dessinerListe();
  }

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
    // Copie des coordonnées, conditions et valeurs habituelles du jour : un changement de réglages ne touche pas ce devis.
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
      validite: reglages.validite,
      tva: reglages.tva,
      remise: '0',
      acompte: reglages.acompte,
      conditions: reglages.conditions,
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
    // Devis créé avant la tranche 05 : validité de départ, sans conditions.
    if (typeof devis.validite !== 'string') devis.validite = VALIDITE;
    if (typeof devis.conditions !== 'string') devis.conditions = '';
    document.querySelectorAll('#tva-choix input').forEach((el) => { el.checked = Number(el.value) === devis.tva; });
    $('remise').value = devis.remise;
    $('acompte').value = devis.acompte;
    $('devis-date').value = devis.date;
    $('devis-date').classList.remove('invalide');
    $('validite').value = devis.validite;
    $('conditions').value = devis.conditions;
    $('devis-numero-barre').textContent = devis.numero;
    remplirMenuStatut($('devis-statut'), devis.statut);
    poserPiedDePage(devis.numero);
    refusAffiche = false;
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

  // Statut depuis l'écran du devis : enregistré, sans toucher à l'aperçu.
  $('devis-statut').addEventListener('change', (e) => {
    devis.statut = statutConnu(e.target.value);
    remplirMenuStatut(e.target, devis.statut);
    enregistrer();
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

  const DATE_COMPLETE = /^\d{4}-\d{2}-\d{2}$/;

  // Date du devis : une date incomplète est entourée en rouge et n'est pas enregistrée ; la dernière complète reste.
  $('devis-date').addEventListener('input', (e) => {
    const iso = e.target.value;
    const valable = DATE_COMPLETE.test(iso);
    e.target.classList.toggle('invalide', !valable);
    if (!valable) { marquerManques(); return; }
    devis.date = iso;
    enregistrer();
    rafraichir();
  });

  // Validité et conditions : gardées telles que tapées.
  [['validite', 'validite'], ['conditions', 'conditions']].forEach(([id, cle]) => {
    $(id).addEventListener('input', (e) => {
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

    // Validité : « Valable jusqu'au » calculé depuis la date du devis ; durée illisible, case rouge et aucune date.
    const jours = Calc.lireJours(devis.validite);
    const jusquau = jours === null ? null : dateCourte(Calc.ajouterJours(devis.date, jours));
    $('validite').classList.toggle('invalide', jours === null);
    $('validite-apercu').classList.toggle('erreur', jours === null);
    $('validite-apercu').textContent = jours === null ? 'Un nombre de jours, de 1 à 365.' : 'Valable jusqu\'au ' + jusquau + '.';

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
          '<p class="f-date">Date : ' + dateCourte(devis.date) + '</p>' +
          (jusquau ? '<p class="f-date">Valable jusqu\'au ' + jusquau + '</p>' : '') +
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
      // Totaux, conditions et « Bon pour accord » restent ensemble sur la même page.
      '<div class="f-fin">' +
      '<table class="f-totaux">' + totaux.join('') + '</table>' +
      (franchise ? '<p class="f-mention-tva">TVA non applicable, art. 293 B du CGI</p>' : '') +
      // Conditions vides : ni titre ni cadre vide.
      (devis.conditions.trim()
        ? '<section class="f-conditions"><p class="f-etiquette">Conditions</p>' +
          '<p class="texte-multiligne">' + echapper(devis.conditions.trim()) + '</p></section>'
        : '') +
      '<section class="f-accord">' +
        '<p class="f-accord-titre">Bon pour accord</p>' +
        '<div class="f-accord-cases">' +
          '<div class="f-accord-case"><p class="f-etiquette">Date</p></div>' +
          '<div class="f-accord-case f-accord-signature"><p class="f-etiquette">Signature</p></div>' +
        '</div>' +
      '</section>' +
      '</div>';

    marquerManques();
  }

  // ---- Saisie contrôlée ----

  const vide = (texte) => !String(texte == null ? '' : texte).trim();

  // Ce qui empêche le PDF de sortir, dans l'ordre de la saisie : [{ texte, case }].
  function manquesDuDevis() {
    const manques = [];
    const manque = (texte, el) => manques.push({ texte: texte, el: el });
    if (vide(devis.client.nom)) manque('Nom du client', $('client-nom'));
    if (vide(devis.client.adresse)) manque('Adresse du client', $('client-adresse'));
    if (devis.lignes.length === 0) manque('Au moins une ligne de prestation', $('ajouter-ligne'));
    devis.lignes.forEach((l, i) => {
      const li = listeLignes.children[i];
      const champ = (c) => li.querySelector('[data-champ="' + c + '"]');
      const rang = 'Ligne ' + (i + 1) + ' : ';
      if (vide(l.titre)) manque(rang + 'titre', champ('titre'));
      [['quantite', 'quantité', Calc.lireQuantite], ['prix', 'prix', Calc.lirePrix]].forEach(([c, nom, lireValeur]) => {
        if (vide(l[c])) manque(rang + nom, champ(c));
        else if (lireValeur(l[c]) === null) manque(rang + nom + ' à corriger', champ(c));
      });
    });
    // Une case entourée en rouge ailleurs sur le devis bloque aussi le PDF.
    if (Calc.lirePourcentage(devis.remise) === null) manque('Remise à corriger', $('remise'));
    if (Calc.lirePourcentage(devis.acompte) === null) manque('Acompte à corriger', $('acompte'));
    if (!DATE_COMPLETE.test($('devis-date').value)) manque('Date du devis à corriger', $('devis-date'));
    if (Calc.lireJours(devis.validite) === null) manque('Validité à corriger', $('validite'));
    return manques;
  }

  let manquesCourants = [];

  // Quantité ou prix mal tapé : rouge tout de suite. Après un refus du PDF : liste des manques et cases vides en rouge,
  // tenues à jour à chaque frappe ; la liste disparaît quand tout est complet.
  function marquerManques() {
    listeLignes.querySelectorAll('.ligne').forEach((li, i) => {
      const l = devis.lignes[i];
      const quantiteRefusee = !vide(l.quantite) && Calc.lireQuantite(l.quantite) === null;
      const prixRefuse = !vide(l.prix) && Calc.lirePrix(l.prix) === null;
      li.querySelector('[data-champ="quantite"]').classList.toggle('invalide', quantiteRefusee);
      li.querySelector('[data-champ="prix"]').classList.toggle('invalide', prixRefuse);
      const aide = li.querySelector('.ligne-aide');
      aide.textContent = [
        quantiteRefusee ? 'Quantité : plus de 0, deux décimales au plus.' : '',
        prixRefuse ? 'Prix : 0 ou plus, deux décimales au plus.' : '',
      ].filter(Boolean).join(' ');
      aide.hidden = !aide.textContent;
    });

    const manques = manquesDuDevis();
    if (manques.length === 0) refusAffiche = false;
    manquesCourants = refusAffiche ? manques : [];
    document.querySelectorAll('#saisie .manquant').forEach((el) => el.classList.remove('manquant'));
    manquesCourants.forEach((m) => m.el.classList.add('manquant'));
    const liste = $('manques-liste');
    liste.textContent = '';
    manquesCourants.forEach((m, i) => {
      const li = document.createElement('li');
      const bouton = document.createElement('button');
      bouton.type = 'button';
      bouton.dataset.manque = i;
      bouton.textContent = m.texte;
      li.appendChild(bouton);
      liste.appendChild(li);
    });
    $('manques').hidden = !refusAffiche;
    return manques;
  }

  // Un clic sur un manque met le curseur dans la case.
  $('manques-liste').addEventListener('click', (e) => {
    const bouton = e.target.closest('button[data-manque]');
    const m = bouton && manquesCourants[Number(bouton.dataset.manque)];
    if (m) m.el.focus();
  });

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

  // Refusé tant qu'il manque quelque chose ; ne touche jamais au statut.
  $('sortir-pdf').addEventListener('click', () => {
    refusAffiche = true;
    if (marquerManques().length > 0) {
      $('saisie').scrollTop = 0;
      return;
    }
    // Chrome propose le titre de la page comme nom du fichier PDF.
    document.title = devis.numero + ' - ' + devis.client.nom.trim();
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
