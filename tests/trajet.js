// Le trajet du mardi 6 octobre 2026 (architecture.md, « Trajet »), rejoué de bout en bout dans Chrome sans fenêtre.
// Lancer : node --test tests/trajet.js (environ 20 s)
// Part d'une première ouverture (profil Chrome neuf), horloge de la page réglée au mardi 6 octobre 2026 au soir.
// Clique et tape comme une personne, et ne lit que ce que l'écran affiche. Sert la page à http://localhost:8000
// si rien n'y répond déjà.
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { lancerChrome, attendre } = require('./chrome.js');

const URL_PAGE = 'http://localhost:8000/';
const RACINE = path.join(__dirname, '..');
const PROFIL = fs.mkdtempSync(path.join(os.tmpdir(), 'devis-3-minutes-trajet-'));
const SOIR_DU_6_OCTOBRE = new Date(2026, 9, 6, 20, 30); // heure de l'ordinateur
const CAPTURES = process.env.CAPTURES || null; // dossier où garder les captures d'écran du trajet

let serveur = null;
let nav = null;
let o = null;

const normal = (t) => (t === null ? t : t.replace(/[  ]/g, ' '));
const valeur = (selecteur) => o.evaluer(`document.querySelector(${JSON.stringify(selecteur)}).value`);
const reglage = (cle) => `#form-reglages [data-reglage="${cle}"]`;
const ligneSaisie = (n, champ) => `#lignes .ligne:nth-child(${n}) [data-champ="${champ}"]`;
const ligneListe = (numero) => `#liste-lignes tr:has(a[href="#${numero}"])`;

// Lignes de la liste telles qu'affichées : [numéro, client, date, total TTC, statut].
const lignesDeLaListe = () => o.evaluer(`[...document.querySelectorAll('#liste-lignes tr')]
  .filter((tr) => tr.offsetParent !== null)
  .map((tr) => [...tr.cells].filter((td) => !td.classList.contains('col-actions'))
    .map((td) => { const s = td.querySelector('select'); return s ? s.options[s.selectedIndex].text : td.innerText.trim(); }))`)
  .then((lignes) => lignes.map((l) => l.map(normal)));
const totaux = () => o.evaluer(`[...document.querySelectorAll('#feuille .f-totaux tr')].map((tr) => [...tr.cells].map((c) => c.innerText.trim()))`)
  .then((lignes) => lignes.map((l) => l.map(normal)));
const manques = () => o.evaluer(`(() => { const p = document.querySelector('#manques');
  return p.offsetParent === null ? [] : [...p.querySelectorAll('li')].map((li) => li.innerText.trim()); })()`);
const rappel = () => o.evaluer(`(() => { const p = document.querySelector('#rappel');
  return p.offsetParent === null ? null : [p.querySelector('.rappel-titre').innerText.trim(), ...[...p.querySelectorAll('li')].map((li) => li.innerText.trim())]; })()`);
const aRelire = () => o.evaluer(`[...document.querySelectorAll('#lignes .ligne')]
  .map((li) => { const m = li.querySelector('.relire-marque'); return !!m && m.offsetParent !== null; })`);
const estRouge = (sel) => o.evaluer(`getComputedStyle(document.querySelector(${JSON.stringify(sel)})).borderTopColor`).then((c) => c === 'rgb(180, 35, 24)');
// Pour chaque ligne de la saisie : passages affichés en rouge sur la case du titre et sur celle du détail, et la note rouge.
const signalements = () => o.evaluer(`[...document.querySelectorAll('#lignes .ligne')].map((li) => {
  const rouge = (el) => { const s = getComputedStyle(el);
    return [s.color, s.backgroundColor, s.boxShadow, s.borderBottomColor].some((v) => /180, 35, 24/.test(v)); };
  const passages = (champ) => {
    const c = li.querySelector('[data-champ="' + champ + '"]'); const r = c.getBoundingClientRect();
    return [...li.querySelectorAll('*')].filter((el) => el !== c && !el.children.length && el.offsetParent !== null
      && el.textContent.trim() && rouge(el) && !el.closest('.ligne-aide, .ligne-ancien-client'))
      .filter((el) => { const m = el.getBoundingClientRect(); return m.left >= r.left && m.right <= r.right && m.top >= r.top && m.bottom <= r.bottom; })
      .map((el) => el.textContent);
  };
  const note = li.querySelector('.ligne-ancien-client');
  return { titre: passages('titre'), detail: passages('detail'), note: note && note.offsetParent !== null && rouge(note) ? note.innerText.trim() : null };
})`);
const capture = (nom) => (CAPTURES ? o.capture(path.join(CAPTURES, nom + '.png')) : null);

async function pageRepond() {
  try { return (await fetch(URL_PAGE)).ok; } catch { return false; }
}

before(async () => {
  if (!(await pageRepond())) {
    serveur = spawn('python3', ['-m', 'http.server', '8000'], { cwd: RACINE, stdio: 'ignore' });
    await attendre(pageRepond, 'serveur local sur le port 8000', 10000);
  }
  nav = await lancerChrome(PROFIL);
  o = await nav.onglet();
  // Posés à la frontière entre la page et Chrome : l'horloge de l'ordinateur, qui repart du mardi 6 octobre 2026 à 20 h 30
  // à chaque chargement, et un témoin qui relève le titre de la page à chaque impression demandée.
  await o.envoyer('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
    const DateVraie = Date;
    const decalage = ${SOIR_DU_6_OCTOBRE.getTime()} - DateVraie.now();
    class DateDuTrajet extends DateVraie {
      constructor(...args) { if (args.length) super(...args); else super(DateVraie.now() + decalage); }
      static now() { return DateVraie.now() + decalage; }
    }
    globalThis.Date = DateDuTrajet;
    window.__impressions = [];
    const imprimer = window.print.bind(window);
    window.print = () => { window.__impressions.push(document.title); return imprimer(); };
  })()` });
});

after(async () => {
  if (nav) await nav.fermer();
  if (serveur) serveur.kill();
  fs.rmSync(PROFIL, { recursive: true, force: true });
});

const impressions = () => o.evaluer('window.__impressions');

test('préparé plus tôt : première ouverture, réglages, DEV-2026-019 envoyé à Karma SAS, puis 020 et 021', async () => {
  await o.aller(URL_PAGE);
  await o.attendreTexte('#reglages .titre-ecran', 'Réglages');
  assert.match(await o.texte('#accueil'), /Bienvenue/);
  await o.taper(reglage('nom'), 'Marie Martin EI');
  await o.taper(reglage('adresse'), '8 rue du Port\n44000 Nantes');
  await o.taper(reglage('siret'), '123 456 789 00012');
  await o.taper(reglage('email'), 'marie@exemple.fr');
  // La suite de ses devis Word : le prochain est le 19.
  await o.taper('#prochain-numero', '19');
  assert.equal(await o.texte('#prochain-apercu'), 'Prochain devis : DEV-2026-019.');
  await o.cliquer('#reglages .retour');
  await o.attendreTexte('#liste-vide', 'Aucun devis');

  await o.cliquer('#nouveau-devis-vide');
  await o.attendreTexte('#devis-numero-barre', 'DEV-2026-019');
  await o.taper('#client-nom', 'Karma SAS');
  await o.taper('#client-adresse', '1 rue Oberkampf\n75011 Paris');
  const lignes = [
    ['Atelier de cadrage', 'Une journée avec l\'équipe produit de Karma.', '2', '450'],
    ['Ateliers de conception', 'Trois ateliers, maquettes comprises.', '3', '450'],
    ['Suivi à un mois', '', '0,5', '900'],
    ['Support', 'Deux heures par mois.', '1', '300'],
  ];
  for (const [i, l] of lignes.entries()) {
    if (i > 0) await o.cliquer('#ajouter-ligne');
    for (const [j, champ] of ['titre', 'detail', 'quantite', 'prix'].entries()) if (l[j]) await o.taper(ligneSaisie(i + 1, champ), l[j]);
  }
  await o.taper('#remise', '10');
  await o.choisir('#devis-statut', 'Envoyé');
  await o.cliquer('#retour-liste');

  for (const [numero, client] of [['DEV-2026-020', 'Atelier Soleil'], ['DEV-2026-021', 'Nova Conseil']]) {
    await o.cliquer('#nouveau-devis');
    await o.attendreTexte('#devis-numero-barre', numero);
    await o.taper('#client-nom', client);
    await o.cliquer('#retour-liste');
    await o.attendreTexte('#liste-lignes', client);
  }
  assert.deepEqual(o.erreurs, []);
});

test('mardi 6 octobre 2026 au soir : dupliquer DEV-2026-019 puis sortir le PDF de DEV-2026-022', async () => {
  o.dialogues.length = 0;

  // 1-2. Le favori : la page lit la mémoire et affiche la liste, du plus récent au plus ancien.
  await o.aller(URL_PAGE);
  await o.attendreTexte('#liste-lignes', 'Karma SAS');
  assert.deepEqual((await lignesDeLaListe()).map((l) => l[0] + ' ' + l[1] + ' ' + l[4]),
    ['DEV-2026-021 Nova Conseil Brouillon', 'DEV-2026-020 Atelier Soleil Brouillon', 'DEV-2026-019 Karma SAS Envoyé']);
  const origine = (await lignesDeLaListe())[2];

  // 3. « Dupliquer » sur DEV-2026-019 : DEV-2026-022 s'ouvre, daté du jour, validité par défaut, client vide,
  //    lignes, TVA, remise et acompte copiés, lignes à relire, coordonnées et conditions des réglages.
  await o.cliquer(`${ligneListe('DEV-2026-019')} .dupliquer-devis`);
  await o.attendreTexte('#devis-numero-barre', 'DEV-2026-022');
  assert.equal(normal(await o.texte('#feuille .f-document')).replace(/\n+/g, '\n'),
    'DEVIS\nDEV-2026-022\nDate : 06/10/2026\nValable jusqu\'au 05/11/2026');
  for (const sel of ['#client-nom', '#client-contact', '#client-adresse']) assert.equal(await valeur(sel), '', sel + ' vide');
  assert.deepEqual(await o.evaluer(`[...document.querySelectorAll('#lignes [data-champ="titre"]')].map((c) => c.value)`),
    ['Atelier de cadrage', 'Ateliers de conception', 'Suivi à un mois', 'Support']);
  assert.equal(await o.evaluer(`document.querySelector('#tva-choix input:checked').value`), '20');
  assert.equal(await valeur('#remise'), '10');
  assert.equal(await valeur('#acompte'), '30');
  assert.match(normal(await o.texte('#feuille .f-emetteur')), /^Marie Martin EI\n/);
  assert.match(await valeur('#conditions'), /Acompte à la commande/);
  assert.equal(await o.evaluer('document.querySelector("#devis-statut").selectedOptions[0].text'), 'Brouillon');
  assert.deepEqual(await aRelire(), [true, true, true, true]);

  // Le détail qui contient « Karma » est signalé en rouge.
  const RIEN = { titre: [], detail: [], note: null };
  const signale = { titre: [], detail: ['Karma'], note: 'Contient « Karma », le nom du client du devis copié.' };
  assert.deepEqual(await signalements(), [signale, RIEN, RIEN, RIEN]);
  await capture('10-karma-signale');

  // 4. Il tape le client (sans l'adresse), coche une ligne, réécrit le détail signalé, change une quantité
  //    et supprime une ligne après confirmation. L'aperçu suit à chaque frappe.
  await o.taper('#client-nom', 'Studio Lune');
  assert.match(await o.texte('#feuille .f-client'), /Studio Lune/);
  await o.cliquer('#lignes .ligne:nth-child(2) .relire-coche');
  await attendre(async () => (await aRelire())[1] === false, 'ligne 2 cochée');
  await o.taper(ligneSaisie(1, 'detail'), 'Une journée avec l\'équipe de Studio Lune.');
  assert.deepEqual(await signalements(), [RIEN, RIEN, RIEN, RIEN]);
  await capture('10-karma-reecrit');
  await o.taper(ligneSaisie(1, 'quantite'), '3');
  await o.cliquer('#lignes .ligne:nth-child(4) [data-action="supprimer"]');
  await attendre(() => o.evaluer('document.querySelectorAll("#lignes .ligne").length === 3'), 'ligne supprimée');
  assert.deepEqual(o.dialogues, ['Supprimer la ligne « Support » ?']);
  assert.deepEqual(await aRelire(), [false, false, true]);
  // 3 × 450 + 3 × 450 + 0,5 × 900 = 3 150,00 ; remise 10 % ; TVA 20 % ; acompte 30 %.
  assert.deepEqual(await totaux(), [
    ['Total HT', '3 150,00 €'],
    ['Remise 10 %', '−315,00 €'],
    ['Total HT après remise', '2 835,00 €'],
    ['TVA 20 %', '567,00 €'],
    ['Total TTC', '3 402,00 €'],
    ['Acompte à la commande (30 %)', '1 020,60 €'],
    ['Reste à payer', '2 381,40 €'],
  ]);

  // 5. « Exporter en PDF » : l'adresse du client manque, refus, manque listé, case entourée en rouge.
  await o.cliquer('#exporter-pdf');
  await o.attendreTexte('#manques', 'Le PDF n\'est pas sorti');
  assert.deepEqual(await manques(), ['Adresse du client']);
  assert.equal(await estRouge('#client-adresse'), true);
  assert.deepEqual(await impressions(), []);
  await capture('10-adresse-refusee');
  await o.taper('#client-adresse', '3 place du Marché\n35000 Rennes');
  assert.equal(await estRouge('#client-adresse'), false);

  // 6. De nouveau : la ligne encore à relire est signalée sans bloquer, titre « DEV-2026-022 - Studio Lune ».
  await o.cliquer('#exporter-pdf');
  await attendre(async () => (await impressions()).length === 1, 'fenêtre d\'impression ouverte');
  assert.deepEqual(await impressions(), ['DEV-2026-022 - Studio Lune']);
  assert.deepEqual(await rappel(), ['1 ligne encore à relire', 'Ligne 3 : Suivi à un mois']);
  assert.deepEqual(await manques(), []);
  await capture('10-pdf-rappel');

  // 7. De retour dans la liste, il passe le statut à « Envoyé » : gardé après rechargement.
  await o.cliquer('#retour-liste');
  await o.attendreTexte('#liste-lignes', 'Studio Lune');
  assert.deepEqual((await lignesDeLaListe())[0], ['DEV-2026-022', 'Studio Lune', '06/10/2026', '3 402,00 €', 'Brouillon']);
  await o.choisir(`${ligneListe('DEV-2026-022')} select`, 'Envoyé');
  await o.recharger();
  await o.attendreTexte('#liste-lignes', 'Studio Lune');
  const liste = await lignesDeLaListe();
  assert.deepEqual(liste[0], ['DEV-2026-022', 'Studio Lune', '06/10/2026', '3 402,00 €', 'Envoyé']);
  assert.deepEqual(liste[3], origine, 'DEV-2026-019 n\'a pas bougé');
  await capture('10-liste-envoye');
  assert.equal(o.dialogues.length, 1);
  assert.deepEqual(o.erreurs, []);
});
