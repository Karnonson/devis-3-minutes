// Devis 3 minutes — tranche 01 : taper un devis et sortir son PDF.
// Rien n'est encore gardé : un rechargement repart de zéro.
(function () {
  'use strict';

  const TITRE_PAGE = document.title;
  const TAUX_TVA = 20;

  const $ = (id) => document.getElementById(id);
  const ecrans = { accueil: $('accueil'), devis: $('devis') };
  const listeLignes = $('lignes');
  const modeleLigne = $('modele-ligne');
  const feuille = $('feuille');

  let devis = null;

  function afficherEcran(nom) {
    Object.keys(ecrans).forEach((k) => { ecrans[k].hidden = k !== nom; });
  }

  function ligneVide() {
    return { titre: '', detail: '', quantite: '', prix: '' };
  }

  function nouveauDevis() {
    const annee = new Date().getFullYear();
    devis = {
      numero: 'DEV-' + annee + '-001',
      client: { nom: '', contact: '', adresse: '' },
      lignes: [ligneVide()],
      tva: TAUX_TVA,
    };
    $('client-nom').value = '';
    $('client-contact').value = '';
    $('client-adresse').value = '';
    $('devis-numero-barre').textContent = devis.numero;
    dessinerLignes();
    afficherEcran('devis');
    ajusterApercu();
    $('client-nom').focus();
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
      dessinerLignes(Math.min(i, devis.lignes.length - 1));
    }
  });

  function echanger(a, b) {
    const l = devis.lignes;
    const x = l[a]; l[a] = l[b]; l[b] = x;
  }

  $('ajouter-ligne').addEventListener('click', () => {
    devis.lignes.push(ligneVide());
    dessinerLignes(devis.lignes.length - 1);
  });

  [['client-nom', 'nom'], ['client-contact', 'contact'], ['client-adresse', 'adresse']].forEach(([id, cle]) => {
    $(id).addEventListener('input', (e) => {
      devis.client[cle] = e.target.value;
      rafraichir();
    });
  });

  // ---- Aperçu ----

  function echapper(texte) {
    return String(texte).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function rafraichir() {
    const t = Calc.totaux(devis.lignes, devis.tva);
    const euros = Calc.formatEuros;

    // Totaux de ligne dans la saisie.
    listeLignes.querySelectorAll('.ligne').forEach((li, i) => {
      li.querySelector('output[data-champ="total"]').textContent = euros(t.lignes[i]);
    });

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

    feuille.innerHTML =
      '<header class="f-entete">' +
        '<div class="f-emetteur"></div>' +
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
      '<table class="f-totaux">' +
        '<tr><th>Total HT</th><td>' + euros(t.ht) + '</td></tr>' +
        '<tr><th>TVA ' + devis.tva + '&nbsp;%</th><td>' + euros(t.tva) + '</td></tr>' +
        '<tr class="f-ttc"><th>Total TTC</th><td>' + euros(t.ttc) + '</td></tr>' +
      '</table>';
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
  afficherEcran('accueil');
})();
