// Contrôle automatique de la page : ce que vit le consultant, dans Chrome sans fenêtre.
// Lancer : node --test tests/page.js
// Part d'un profil Chrome neuf (mémoire vide), clique et tape comme une personne, et ne lit que ce que
// l'écran affiche. Sert la page à http://localhost:8000 si rien n'y répond déjà.
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
const PROFIL = fs.mkdtempSync(path.join(os.tmpdir(), 'devis-3-minutes-controle-'));

const maintenant = new Date();
const ANNEE = maintenant.getFullYear();
const AUJOURDHUI = [maintenant.getDate(), maintenant.getMonth() + 1].map((n) => String(n).padStart(2, '0')).join('/') + '/' + ANNEE;
const num = (n) => `DEV-${ANNEE}-${String(n).padStart(3, '0')}`;

let serveur = null;
let nav = null;
let onglet = null;

const normal = (t) => (t === null ? t : t.replace(/[\u00a0\u202f]/g, ' '));

// Les lignes de la liste telles qu'affichées : [numéro, client, date, total TTC, statut] (statut : l'option affichée
// par son menu ; le bouton « Supprimer » à part).
function lignesDeLaListe(o) {
  return o.evaluer(`[...document.querySelectorAll('#liste-lignes tr')]
    .filter((tr) => tr.offsetParent !== null)
    .map((tr) => [...tr.cells].filter((td) => !td.querySelector('.supprimer-devis'))
      .map((td) => { const s = td.querySelector('select'); return s ? s.options[s.selectedIndex].text : td.innerText.trim(); }))`)
    .then((lignes) => lignes.map((l) => l.map(normal)));
}

const valeur = (o, selecteur) => o.evaluer(`document.querySelector(${JSON.stringify(selecteur)}).value`);
const reglage = (cle) => `#form-reglages [data-reglage="${cle}"]`;
const COORDONNEES = ['nom', 'adresse', 'siret', 'email', 'telephone', 'tvaIntra'];

// Ce que montre une première ouverture : réglages, phrase d'accueil, obligatoires signalés, champs vides,
// modèle de conditions déjà rempli, numérotation à 001, aucune boîte de dialogue ni erreur.
async function verifierPremiereOuverture(o) {
  await o.attendreTexte('#reglages .titre-ecran', 'Réglages');
  assert.equal(await o.visible('#liste'), false);
  assert.match(await o.texte('#accueil'), /Bienvenue/);
  const libelle = (cle) => o.evaluer(`document.querySelector('${reglage(cle)}').closest('label').querySelector('span').innerText`);
  for (const cle of ['nom', 'adresse', 'siret']) assert.match(await libelle(cle), /obligatoire/);
  for (const cle of ['email', 'telephone', 'tvaIntra']) assert.doesNotMatch(await libelle(cle), /obligatoire/);
  for (const cle of COORDONNEES) assert.equal(await valeur(o, reglage(cle)), '', cle + ' vide');
  const conditions = await valeur(o, reglage('conditions'));
  assert.match(conditions, /Acompte à la commande/);
  assert.match(conditions, /trois fois le taux d'intérêt légal/);
  assert.match(conditions, /40 €/);
  assert.match(conditions, /Devis gratuit/);
  // TVA, acompte et validité habituels : 20 %, 30 %, 30 jours au départ.
  assert.equal(await o.evaluer(`document.querySelector('#reglage-tva input:checked').value`), '20');
  assert.equal(await valeur(o, reglage('acompte')), '30');
  assert.equal(await valeur(o, reglage('validite')), '30');
  assert.equal(await valeur(o, '#prochain-numero'), '1');
  assert.equal(await o.texte('#prochain-apercu'), `Prochain devis : ${num(1)}.`);
  assert.deepEqual(o.dialogues, []);
  assert.deepEqual(o.erreurs, []);
}

async function pageRepond() {
  try { return (await fetch(URL_PAGE)).ok; } catch { return false; }
}

before(async () => {
  if (!(await pageRepond())) {
    serveur = spawn('python3', ['-m', 'http.server', '8000'], { cwd: RACINE, stdio: 'ignore' });
    await attendre(pageRepond, 'serveur local sur le port 8000', 10000);
  }
  nav = await lancerChrome(PROFIL);
  onglet = await nav.onglet();
  // Témoin posé à la frontière entre la page et Chrome : compte les demandes de conservation des données.
  await onglet.envoyer('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
    window.__demandesConservation = 0;
    const persist = navigator.storage.persist.bind(navigator.storage);
    navigator.storage.persist = () => { window.__demandesConservation++; return persist(); };
  })()` });
});

after(async () => {
  if (nav) await nav.fermer();
  if (serveur) serveur.kill();
  fs.rmSync(PROFIL, { recursive: true, force: true });
});

test('mémoire vide : la page s\'ouvre sur les réglages, avec une phrase d\'accueil', async () => {
  await onglet.aller(URL_PAGE);
  await verifierPremiereOuverture(onglet);
  // La page a demandé à Chrome de garder ses données, sans rien afficher.
  assert.ok(await onglet.evaluer('window.__demandesConservation') >= 1);
  assert.equal(await onglet.evaluer('document.querySelectorAll("#reglages button").length'), 0, 'aucun bouton Enregistrer');
});

test('tant que le nom, l\'adresse ou le SIRET manquent, « Nouveau devis » renvoie vers les réglages', async () => {
  const focus = () => onglet.evaluer('document.activeElement.dataset.reglage || null');

  await onglet.cliquer('#reglages .retour');
  await onglet.attendreTexte('#liste-vide', 'Aucun devis');
  assert.equal(await onglet.texte('#liste .barre #ouvrir-reglages'), 'Réglages');
  assert.equal(await onglet.texte('#liste .barre #nouveau-devis'), 'Nouveau devis');
  await onglet.cliquer('#nouveau-devis-vide');
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  assert.equal(await focus(), 'nom');

  await onglet.taper(reglage('nom'), 'Marie Martin EI');
  await onglet.cliquer('#reglages .retour');
  await onglet.cliquer('#nouveau-devis');
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  assert.equal(await focus(), 'adresse');

  await onglet.taper(reglage('adresse'), '8 rue du Port\n44000 Nantes');
  await onglet.cliquer('#reglages .retour');
  await onglet.cliquer('#nouveau-devis');
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  assert.equal(await focus(), 'siret');

  // SIRET rempli mais nom effacé : toujours renvoyé.
  await onglet.taper(reglage('siret'), '123 456 789 00012');
  await onglet.taper(reglage('nom'), '');
  await onglet.cliquer('#reglages .retour');
  await onglet.cliquer('#nouveau-devis');
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  assert.equal(await focus(), 'nom');
  await onglet.taper(reglage('nom'), 'Marie Martin EI');
  await onglet.taper(reglage('email'), 'marie@exemple.fr');
  await onglet.taper(reglage('telephone'), '06 12 34 56 78');

  // Aucun devis ni numéro consommé par les renvois.
  await onglet.cliquer('#reglages .retour');
  await onglet.attendreTexte('#liste-vide', 'Aucun devis');
  assert.deepEqual(onglet.dialogues, []);
});

test('réglages et modèle de conditions modifiés : encore là après rechargement, sans bouton', async () => {
  await onglet.cliquer('#ouvrir-reglages');
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  assert.equal(await onglet.visible('#accueil'), false);
  const conditions = await valeur(onglet, reglage('conditions'));
  await onglet.taper(reglage('conditions'), conditions + '\nIBAN communiqué sur la facture.');
  await onglet.recharger();
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  assert.equal(await valeur(onglet, reglage('nom')), 'Marie Martin EI');
  assert.equal(await valeur(onglet, reglage('adresse')), '8 rue du Port\n44000 Nantes');
  assert.equal(await valeur(onglet, reglage('siret')), '123 456 789 00012');
  assert.equal(await valeur(onglet, reglage('email')), 'marie@exemple.fr');
  assert.equal(await valeur(onglet, reglage('telephone')), '06 12 34 56 78');
  assert.equal(await valeur(onglet, reglage('tvaIntra')), '');
  assert.equal(await valeur(onglet, reglage('conditions')), conditions + '\nIBAN communiqué sur la facture.');
  await onglet.cliquer('#reglages .retour');
  await onglet.attendreTexte('#liste-vide', 'Aucun devis');
});

test('nouveau devis : les coordonnées s\'affichent sans rien retaper, sans case vide pour la TVA intracommunautaire', async () => {
  await onglet.cliquer('#nouveau-devis-vide');
  await onglet.attendreTexte('#devis-numero-barre', num(1));
  const emetteur = normal(await onglet.texte('#feuille .f-emetteur')).replace(/\n+/g, '\n');
  assert.equal(emetteur, 'Marie Martin EI\n8 rue du Port\n44000 Nantes\nmarie@exemple.fr\n06 12 34 56 78\nSIRET 123 456 789 00012');
  assert.doesNotMatch(await onglet.texte('#feuille'), /intracommunautaire/i);
  assert.equal(await onglet.evaluer(`[...document.querySelectorAll('#feuille .f-emetteur *')].filter((el) => !el.innerText.trim()).length`), 0);
});

test('saisie, retour à la liste, rechargement : le devis est dans la liste', async () => {
  await onglet.taper('#client-nom', 'Acme SARL');
  await onglet.taper('#client-adresse', '12 rue des Lilas\n69003 Lyon');
  await onglet.taper('#lignes .ligne:nth-child(1) [data-champ="titre"]', 'Atelier de cadrage');
  await onglet.taper('#lignes .ligne:nth-child(1) [data-champ="detail"]', 'Une demi-journée sur place.');
  await onglet.taper('#lignes .ligne:nth-child(1) [data-champ="quantite"]', '2');
  await onglet.taper('#lignes .ligne:nth-child(1) [data-champ="prix"]', '450');
  assert.match(normal(await onglet.texte('#feuille')), /900,00 €/);

  // Aucun bouton « Enregistrer » sur l'écran du devis.
  assert.equal(await onglet.evaluer(`[...document.querySelectorAll('#devis button, #devis a')].some((b) => /enregistrer/i.test(b.innerText))`), false);

  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', num(1));
  const attendu = [[num(1), 'Acme SARL', AUJOURDHUI, '1 080,00 €', 'Brouillon']];
  assert.deepEqual(await lignesDeLaListe(onglet), attendu);

  await onglet.recharger();
  await onglet.attendreTexte('#liste-lignes', num(1));
  assert.deepEqual(await lignesDeLaListe(onglet), attendu);
});

test('un clic sur une ligne rouvre le devis, modifiable', async () => {
  await onglet.cliquer('#liste-lignes tr:nth-child(1) .col-client');
  await onglet.attendreTexte('#devis-numero-barre', num(1));
  assert.equal(await valeur(onglet, '#client-nom'), 'Acme SARL');
  assert.equal(await valeur(onglet, '#lignes .ligne:nth-child(1) [data-champ="quantite"]'), '2');
  await onglet.taper('#lignes .ligne:nth-child(1) [data-champ="quantite"]', '3');
  assert.match(normal(await onglet.texte('#feuille')), /1 350,00 €/);
  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', '1 620,00');
});

test('trois clics sur « Nouveau devis » : 001, 002, 003, le dernier en haut, « (sans client) »', async () => {
  for (const n of [2, 3]) {
    await onglet.cliquer('#nouveau-devis');
    await onglet.attendreTexte('#devis-numero-barre', num(n));
    await onglet.cliquer('#retour-liste');
    await onglet.attendreTexte('#liste-lignes', num(n));
  }
  assert.deepEqual(await lignesDeLaListe(onglet), [
    [num(3), '(sans client)', AUJOURDHUI, '0,00 €', 'Brouillon'],
    [num(2), '(sans client)', AUJOURDHUI, '0,00 €', 'Brouillon'],
    [num(1), 'Acme SARL', AUJOURDHUI, '1 620,00 €', 'Brouillon'],
  ]);
});

test('Chrome fermé et rouvert : la liste et le devis tapé reviennent intacts', async () => {
  await nav.fermer();
  nav = await lancerChrome(PROFIL);
  onglet = await nav.onglet();
  await onglet.aller(URL_PAGE);
  await onglet.attendreTexte('#liste-lignes', num(1));
  assert.deepEqual((await lignesDeLaListe(onglet)).map((l) => l[0] + ' ' + l[1] + ' ' + l[3]), [
    `${num(3)} (sans client) 0,00 €`,
    `${num(2)} (sans client) 0,00 €`,
    `${num(1)} Acme SARL 1 620,00 €`,
  ]);
  await onglet.cliquer('#liste-lignes tr:nth-child(3)');
  await onglet.attendreTexte('#devis-numero-barre', num(1));
  assert.equal(await valeur(onglet, '#client-nom'), 'Acme SARL');
  assert.equal(await valeur(onglet, '#client-adresse'), '12 rue des Lilas\n69003 Lyon');
  assert.equal(await valeur(onglet, '#lignes .ligne:nth-child(1) [data-champ="titre"]'), 'Atelier de cadrage');
  assert.equal(await valeur(onglet, '#lignes .ligne:nth-child(1) [data-champ="detail"]'), 'Une demi-journée sur place.');
  const feuille = normal(await onglet.texte('#feuille'));
  assert.match(feuille, /12 rue des Lilas\n69003 Lyon/);
  assert.match(feuille, /1 350,00 €/);
});

test('deux onglets : la dernière saisie reste, sans message', async () => {
  const autre = await nav.onglet();
  await autre.aller(URL_PAGE + '#' + num(1));
  await autre.attendreTexte('#devis-numero-barre', num(1));

  await onglet.taper('#client-nom', 'Alpha Conseil');
  await autre.taper('#client-nom', 'Beta Studio');
  await onglet.recharger();
  await onglet.attendreTexte('#devis-numero-barre', num(1));
  assert.equal(await valeur(onglet, '#client-nom'), 'Beta Studio');

  // Un devis créé dans le second onglet n'est pas effacé par une frappe dans le premier.
  await autre.cliquer('#retour-liste');
  await autre.cliquer('#nouveau-devis');
  await autre.attendreTexte('#devis-numero-barre', num(4));
  await onglet.taper('#client-contact', 'Marie Martin');
  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', num(4));
  const lignes = await lignesDeLaListe(onglet);
  assert.deepEqual(lignes.map((l) => l[0] + ' ' + l[1]), [`${num(4)} (sans client)`, `${num(3)} (sans client)`, `${num(2)} (sans client)`, `${num(1)} Beta Studio`]);

  assert.deepEqual(onglet.dialogues, []);
  assert.deepEqual(autre.dialogues, []);
  await autre.fermer();
});

test('horloge de l\'ordinateur passée en 2027 : le devis suivant reçoit DEV-2027-001', async () => {
  const o = await nav.onglet();
  await o.envoyer('Emulation.setVirtualTimePolicy', { policy: 'advance', initialVirtualTime: Date.UTC(2027, 0, 4, 9) / 1000 });
  await o.aller(URL_PAGE);
  await o.attendreTexte('#liste-lignes', num(4));
  await o.cliquer('#nouveau-devis');
  await o.attendreTexte('#devis-numero-barre', 'DEV-2027-001');
  await o.cliquer('#retour-liste');
  await o.attendreTexte('#liste-lignes', 'DEV-2027-001');
  assert.equal((await lignesDeLaListe(o))[0][0], 'DEV-2027-001');
});

test('N° de TVA intracommunautaire rempli : le devis suivant l\'affiche, le précédent ne change pas', async () => {
  await onglet.cliquer('#ouvrir-reglages');
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  await onglet.taper(reglage('tvaIntra'), 'FR12 123456789');
  await onglet.cliquer('#reglages .retour');
  await onglet.cliquer('#nouveau-devis');
  await onglet.attendreTexte('#devis-numero-barre', /DEV-/);
  assert.match(normal(await onglet.texte('#feuille .f-emetteur')).replace(/\n+/g, '\n'), /SIRET 123 456 789 00012\nN° TVA intracommunautaire FR12 123456789$/);
  await onglet.cliquer('#retour-liste');
  await onglet.cliquer(`#liste-lignes a[href="#${num(1)}"]`);
  await onglet.attendreTexte('#devis-numero-barre', num(1));
  assert.doesNotMatch(await onglet.texte('#feuille'), /intracommunautaire/i);
});

test('navigation privée : réglages vides, sans message d\'erreur', async () => {
  const prive = await nav.onglet(true);
  await prive.aller(URL_PAGE);
  await verifierPremiereOuverture(prive);
  await prive.cliquer('#reglages .retour');
  await prive.attendreTexte('#liste-vide', 'Aucun devis');
  assert.doesNotMatch(await prive.evaluer('document.body.innerText'), /Marie Martin|Acme|Beta Studio/);
  assert.deepEqual(prive.erreurs, []);
  await prive.fermer();
});

test('un confrère dans un autre profil Chrome : réglages vides, aucune donnée du consultant', async () => {
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'devis-3-minutes-confrere-'));
  const autreNav = await lancerChrome(profil);
  try {
    const o = await autreNav.onglet();
    await o.aller(URL_PAGE);
    await verifierPremiereOuverture(o);
    await o.cliquer('#reglages .retour');
    await o.attendreTexte('#liste-vide', 'Aucun devis');
    assert.doesNotMatch(await o.evaluer('document.body.innerText'), /Marie Martin|123 456 789|Acme|Beta Studio|DEV-/);
  } finally {
    await autreNav.fermer();
    fs.rmSync(profil, { recursive: true, force: true });
  }
});

test('données du site effacées : réglages comme à la première ouverture, « prochain numéro » réglé à 23', async () => {
  await onglet.envoyer('Storage.clearDataForOrigin', { origin: 'http://localhost:8000', storageTypes: 'all' });
  onglet.dialogues.length = 0;
  onglet.erreurs.length = 0;
  await onglet.aller(URL_PAGE);
  await verifierPremiereOuverture(onglet);

  await onglet.taper('#prochain-numero', 'abc');
  assert.equal(await onglet.texte('#prochain-apercu'), 'Un nombre entier, à partir de 1.');
  await onglet.taper('#prochain-numero', '23');
  assert.equal(await onglet.texte('#prochain-apercu'), `Prochain devis : ${num(23)}.`);
  await onglet.taper(reglage('nom'), 'Marie Martin EI');
  await onglet.taper(reglage('adresse'), '8 rue du Port\n44000 Nantes');
  await onglet.taper(reglage('siret'), '123 456 789 00012');
  await onglet.recharger();
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  assert.equal(await valeur(onglet, '#prochain-numero'), '23');

  await onglet.cliquer('#reglages .retour');
  await onglet.attendreTexte('#liste-vide', 'Aucun devis');
  await onglet.cliquer('#nouveau-devis');
  await onglet.attendreTexte('#devis-numero-barre', num(23));
  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', num(23));
  await onglet.cliquer('#ouvrir-reglages');
  await onglet.attendreTexte('#prochain-apercu', num(24));
});

// ---- Remise, TVA et acompte (tranche 04) ----

// Les lignes des totaux telles qu'affichées sur l'aperçu : [libellé, montant].
function totauxAffiches(o) {
  return o.evaluer(`[...document.querySelectorAll('#feuille .f-totaux tr')]
    .filter((tr) => tr.offsetParent !== null)
    .map((tr) => [...tr.cells].map((c) => c.innerText.trim()))`)
    .then((lignes) => lignes.map((l) => l.map(normal)));
}

// Écart en pixels entre le bord droit de chaque montant (et de la mention) et le bord droit du tableau des prestations.
function ecartsADroite(o) {
  return o.evaluer(`(() => {
    const droite = document.querySelector('#feuille .f-tableau').getBoundingClientRect().right;
    return [...document.querySelectorAll('#feuille .f-totaux td, #feuille .f-mention-tva')]
      .filter((el) => el.offsetParent !== null)
      .map((el) => { const r = document.createRange(); r.selectNodeContents(el);
        return Math.round(droite - r.getBoundingClientRect().right); });
  })()`);
}

const ligneSaisie = (n, champ) => `#lignes .ligne:nth-child(${n}) [data-champ="${champ}"]`;

test('remise, TVA et acompte : l\'aperçu recalcule au centime, 2 × 450 + 3 × 450 donne 2 430,00 € et 1 701,00 €', async () => {
  await onglet.cliquer('#reglages .retour');
  await onglet.attendreTexte('#liste-lignes', num(23));
  await onglet.cliquer('#nouveau-devis');
  await onglet.attendreTexte('#devis-numero-barre', num(24));

  // Nouveau devis : TVA 20 % choisie, remise 0 %, acompte 30 %.
  assert.equal(await onglet.evaluer(`document.querySelector('#tva-choix input:checked').value`), '20');
  assert.equal(await onglet.evaluer(`document.querySelectorAll('#tva-choix input[type="radio"]').length`), 3);
  assert.equal(await valeur(onglet, '#remise'), '0');
  assert.equal(await valeur(onglet, '#acompte'), '30');

  await onglet.taper('#client-nom', 'Acme SARL');
  await onglet.taper(ligneSaisie(1, 'titre'), 'Atelier de cadrage');
  await onglet.taper(ligneSaisie(1, 'quantite'), '2');
  await onglet.taper(ligneSaisie(1, 'prix'), '450');
  await onglet.cliquer('#ajouter-ligne');
  await onglet.taper(ligneSaisie(2, 'titre'), 'Ateliers de conception');
  await onglet.taper(ligneSaisie(2, 'quantite'), '3');
  await onglet.taper(ligneSaisie(2, 'prix'), '450');

  // Sans remise : pas de ligne remise ni « Total HT après remise ».
  assert.deepEqual(await totauxAffiches(onglet), [
    ['Total HT', '2 250,00 €'],
    ['TVA 20 %', '450,00 €'],
    ['Total TTC', '2 700,00 €'],
    ['Acompte à la commande (30 %)', '810,00 €'],
    ['Reste à payer', '1 890,00 €'],
  ]);

  await onglet.taper('#remise', '10');
  const reference = [
    ['Total HT', '2 250,00 €'],
    ['Remise 10 %', '−225,00 €'],
    ['Total HT après remise', '2 025,00 €'],
    ['TVA 20 %', '405,00 €'],
    ['Total TTC', '2 430,00 €'],
    ['Acompte à la commande (30 %)', '729,00 €'],
    ['Reste à payer', '1 701,00 €'],
  ];
  assert.deepEqual(await totauxAffiches(onglet), reference);
  assert.equal(await onglet.visible('#feuille .f-mention-tva'), false);

  // Montants alignés à droite, à l'écran puis dans la mise en page d'impression.
  for (const e of await ecartsADroite(onglet)) assert.ok(Math.abs(e) <= 1, 'aligné à droite (écart ' + e + ' px)');
  await onglet.envoyer('Emulation.setEmulatedMedia', { media: 'print' });
  try {
    for (const e of await ecartsADroite(onglet)) assert.ok(Math.abs(e) <= 1, 'aligné à droite à l\'impression (écart ' + e + ' px)');
  } finally {
    await onglet.envoyer('Emulation.setEmulatedMedia', { media: '' });
  }

  // TVA 10 %.
  await onglet.cliquer('#tva-choix input[value="10"] + span');
  assert.deepEqual((await totauxAffiches(onglet)).slice(3), [
    ['TVA 10 %', '202,50 €'],
    ['Total TTC', '2 227,50 €'],
    ['Acompte à la commande (30 %)', '668,25 €'],
    ['Reste à payer', '1 559,25 €'],
  ]);

  // TVA 0 % : plus de ligne TVA, « Total », mention art. 293 B, acompte sur ce total.
  await onglet.cliquer('#tva-choix input[value="0"] + span');
  assert.deepEqual(await totauxAffiches(onglet), [
    ['Total HT', '2 250,00 €'],
    ['Remise 10 %', '−225,00 €'],
    ['Total HT après remise', '2 025,00 €'],
    ['Total', '2 025,00 €'],
    ['Acompte à la commande (30 %)', '607,50 €'],
    ['Reste à payer', '1 417,50 €'],
  ]);
  assert.equal(await onglet.texte('#feuille .f-mention-tva'), 'TVA non applicable, art. 293 B du CGI');
  assert.doesNotMatch(await onglet.texte('#feuille .f-totaux'), /TVA|TTC/);
  for (const e of await ecartsADroite(onglet)) assert.ok(Math.abs(e) <= 1, 'mention alignée à droite (écart ' + e + ' px)');

  // Acompte à 0 % : les deux lignes disparaissent ; remise à 0 % : ses lignes aussi.
  await onglet.cliquer('#tva-choix input[value="20"] + span');
  await onglet.taper('#acompte', '0');
  assert.deepEqual((await totauxAffiches(onglet)).map((l) => l[0]), ['Total HT', 'Remise 10 %', 'Total HT après remise', 'TVA 20 %', 'Total TTC']);
  await onglet.taper('#remise', '0');
  assert.deepEqual((await totauxAffiches(onglet)).map((l) => l[0]), ['Total HT', 'TVA 20 %', 'Total TTC']);

  // Bornes de 0 à 100 : 150 et -5 sont entourés en rouge ; 100 et 12,5 acceptés.
  const rouge = (sel) => onglet.evaluer(`getComputedStyle(document.querySelector('${sel}')).borderTopColor`).then((c) => c === 'rgb(180, 35, 24)');
  for (const refuse of ['150', '-5', 'abc']) {
    await onglet.taper('#remise', refuse);
    assert.equal(await rouge('#remise'), true, 'remise ' + refuse + ' en rouge');
    await onglet.taper('#acompte', refuse);
    assert.equal(await rouge('#acompte'), true, 'acompte ' + refuse + ' en rouge');
  }
  await onglet.taper('#remise', '12,5');
  await onglet.taper('#acompte', '100');
  assert.equal(await rouge('#remise'), false);
  assert.equal(await rouge('#acompte'), false);
  assert.deepEqual(await totauxAffiches(onglet), [
    ['Total HT', '2 250,00 €'],
    ['Remise 12,5 %', '−281,25 €'],
    ['Total HT après remise', '1 968,75 €'],
    ['TVA 20 %', '393,75 €'],
    ['Total TTC', '2 362,50 €'],
    ['Acompte à la commande (100 %)', '2 362,50 €'],
    ['Reste à payer', '0,00 €'],
  ]);

  // Retour à l'exemple de référence, gardé après rechargement et dans la liste.
  await onglet.cliquer('#tva-choix input[value="20"] + span');
  await onglet.taper('#remise', '10');
  await onglet.taper('#acompte', '30');
  await onglet.recharger();
  await onglet.attendreTexte('#devis-numero-barre', num(24));
  assert.equal(await onglet.evaluer(`document.querySelector('#tva-choix input:checked').value`), '20');
  assert.deepEqual(await totauxAffiches(onglet), reference);
  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', num(24));
  assert.deepEqual((await lignesDeLaListe(onglet))[0], [num(24), 'Acme SARL', AUJOURDHUI, '2 430,00 €', 'Brouillon']);
  assert.deepEqual(onglet.erreurs, []);
});

// ---- Dates, validité, conditions et « Bon pour accord » (tranche 05) ----

const deux = (n) => String(n).padStart(2, '0');
// Date du jour décalée de n jours : [« 15/10/2026 », « 2026-10-15 »].
function jourPlus(n) {
  const d = new Date(Date.UTC(ANNEE, maintenant.getMonth(), maintenant.getDate() + n));
  return [`${deux(d.getUTCDate())}/${deux(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`,
    `${d.getUTCFullYear()}-${deux(d.getUTCMonth() + 1)}-${deux(d.getUTCDate())}`];
}

// Tape une date comme au clavier : clic sur le libellé de la case, puis les chiffres jour, mois, année.
async function taperDate(o, jjmmaaaa) {
  await o.cliquer('#saisie label:has(#devis-date) > span');
  await o.touches(jjmmaaaa);
}

const rect = (o, selecteur) => o.evaluer(`(() => { const r = document.querySelector(${JSON.stringify(selecteur)}).getBoundingClientRect();
  return { haut: r.top, bas: r.bottom, gauche: r.left, droite: r.right }; })()`);

// Ordre de haut en bas de l'aperçu : totaux, conditions, « Bon pour accord » ; en-tête gauche et droite côte à côte.
async function verifierDisposition(o) {
  const feuille = await o.evaluer(`(() => { const f = document.querySelector('#feuille'); const s = getComputedStyle(f);
    const r = f.getBoundingClientRect(); return { gauche: r.left + parseFloat(s.paddingLeft) * (parseFloat(f.style.zoom) || 1),
      droite: r.right - parseFloat(s.paddingRight) * (parseFloat(f.style.zoom) || 1) }; })()`);
  const emetteur = await rect(o, '#feuille .f-emetteur');
  const documentDroite = await rect(o, '#feuille .f-document');
  const totaux = await rect(o, '#feuille .f-totaux');
  const conditions = await rect(o, '#feuille .f-conditions');
  const accord = await rect(o, '#feuille .f-accord');
  assert.ok(Math.abs(emetteur.gauche - feuille.gauche) <= 1, 'coordonnées à gauche');
  assert.ok(Math.abs(documentDroite.droite - feuille.droite) <= 1, '« DEVIS » à droite');
  assert.ok(Math.abs(emetteur.haut - documentDroite.haut) <= 1, 'en-tête sur la même hauteur');
  assert.ok(totaux.bas <= conditions.haut, 'conditions après les totaux');
  assert.ok(conditions.bas <= accord.haut, '« Bon pour accord » après les conditions');
}

let modele = null;

test('nouveau devis : brouillon daté du jour, avec validité, TVA, acompte, conditions et coordonnées des réglages', async () => {
  await onglet.cliquer('#ouvrir-reglages');
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  modele = await valeur(onglet, reglage('conditions'));
  assert.match(modele, /Acompte à la commande/);
  await onglet.cliquer('#reglages .retour');

  await onglet.cliquer('#nouveau-devis');
  await onglet.attendreTexte('#devis-numero-barre', num(25));
  assert.equal(await valeur(onglet, '#devis-date'), jourPlus(0)[1]);
  assert.equal(await valeur(onglet, '#validite'), '30');
  assert.equal(await onglet.texte('#validite-apercu'), `Valable jusqu'au ${jourPlus(30)[0]}.`);
  assert.equal(await onglet.evaluer(`document.querySelector('#tva-choix input:checked').value`), '20');
  assert.equal(await valeur(onglet, '#remise'), '0');
  assert.equal(await valeur(onglet, '#acompte'), '30');
  assert.equal(await valeur(onglet, '#conditions'), modele);

  // En haut : coordonnées et SIRET à gauche ; « DEVIS », numéro, date et validité à droite.
  assert.equal(normal(await onglet.texte('#feuille .f-emetteur')).replace(/\n+/g, '\n'), 'Marie Martin EI\n8 rue du Port\n44000 Nantes\nSIRET 123 456 789 00012');
  assert.equal(normal(await onglet.texte('#feuille .f-document')).replace(/\n+/g, '\n'),
    `DEVIS\n${num(25)}\nDate : ${AUJOURDHUI}\nValable jusqu'au ${jourPlus(30)[0]}`);

  // Après les totaux : les conditions du modèle, puis le cadre « Bon pour accord » avec date et signature.
  assert.equal(normal(await onglet.texte('#feuille .f-conditions .texte-multiligne')), modele);
  assert.match(normal(await onglet.texte('#feuille .f-accord')).replace(/\n+/g, '\n'), /^Bon pour accord\nDate\nSignature$/i);
  await verifierDisposition(onglet);
  await onglet.envoyer('Emulation.setEmulatedMedia', { media: 'print' });
  try { await verifierDisposition(onglet); } finally { await onglet.envoyer('Emulation.setEmulatedMedia', { media: '' }); }

  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', num(25));
  assert.deepEqual((await lignesDeLaListe(onglet))[0], [num(25), '(sans client)', AUJOURDHUI, '0,00 €', 'Brouillon']);
});

test('date du devis et durée de validité se modifient : « Valable jusqu\'au » se recalcule', async () => {
  const droite = async () => normal(await onglet.texte('#feuille .f-document')).replace(/\n+/g, '\n');
  await onglet.cliquer('#liste-lignes tr:nth-child(1) .col-client');
  await onglet.attendreTexte('#devis-numero-barre', num(25));

  await taperDate(onglet, '06102026');
  assert.equal(await valeur(onglet, '#devis-date'), '2026-10-06');
  assert.equal(await droite(), `DEVIS\n${num(25)}\nDate : 06/10/2026\nValable jusqu'au 05/11/2026`);

  await onglet.taper('#validite', '15');
  assert.equal(await droite(), `DEVIS\n${num(25)}\nDate : 06/10/2026\nValable jusqu'au 21/10/2026`);
  assert.equal(await onglet.texte('#validite-apercu'), 'Valable jusqu\'au 21/10/2026.');

  // Durée refusée : case rouge, plus de date de validité inventée.
  const rouge = (sel) => onglet.evaluer(`getComputedStyle(document.querySelector('${sel}')).borderTopColor`).then((c) => c === 'rgb(180, 35, 24)');
  for (const refuse of ['0', '366', 'abc', '1,5']) {
    await onglet.taper('#validite', refuse);
    assert.equal(await rouge('#validite'), true, 'validité ' + refuse + ' en rouge');
    assert.equal(await onglet.texte('#validite-apercu'), 'Un nombre de jours, de 1 à 365.');
    assert.doesNotMatch(await droite(), /Valable/);
  }

  // Fin de mois : 31/01/2027 + 30 jours = 02/03/2027.
  await onglet.taper('#validite', '30');
  assert.equal(await rouge('#validite'), false);
  await taperDate(onglet, '31012027');
  assert.equal(await droite(), `DEVIS\n${num(25)}\nDate : 31/01/2027\nValable jusqu'au 02/03/2027`);

  await taperDate(onglet, '06102026');
  await onglet.taper('#validite', '15');
  await onglet.recharger();
  await onglet.attendreTexte('#devis-numero-barre', num(25));
  assert.equal(await valeur(onglet, '#devis-date'), '2026-10-06');
  assert.equal(await valeur(onglet, '#validite'), '15');
  assert.equal(await droite(), `DEVIS\n${num(25)}\nDate : 06/10/2026\nValable jusqu'au 21/10/2026`);
  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', num(25));
  assert.equal((await lignesDeLaListe(onglet))[0][2], '06/10/2026');
});

test('conditions ajustées pour ce seul devis : le modèle des réglages ne change pas', async () => {
  await onglet.cliquer('#liste-lignes tr:nth-child(1) .col-client');
  await onglet.attendreTexte('#devis-numero-barre', num(25));
  const ajustees = modele.replace('payable sous 30 jours', 'payable sous 45 jours');
  assert.notEqual(ajustees, modele);
  await onglet.taper('#conditions', ajustees);
  assert.match(normal(await onglet.texte('#feuille .f-conditions')), /payable sous 45 jours/);
  await onglet.recharger();
  await onglet.attendreTexte('#devis-numero-barre', num(25));
  assert.equal(await valeur(onglet, '#conditions'), ajustees);
  assert.match(normal(await onglet.texte('#feuille .f-conditions')), /payable sous 45 jours/);

  await onglet.cliquer('#retour-liste');
  await onglet.cliquer('#ouvrir-reglages');
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  assert.equal(await valeur(onglet, reglage('conditions')), modele);
  await onglet.cliquer('#reglages .retour');
  await onglet.attendreTexte('#liste-lignes', num(25));
});

test('réglages changés : aucun devis existant ne bouge, le devis créé ensuite prend les nouvelles valeurs', async () => {
  const ouvrir = async (n) => {
    await onglet.cliquer(`#liste-lignes a[href="#${num(n)}"]`);
    await onglet.attendreTexte('#devis-numero-barre', num(n));
  };
  const etat = async () => ({
    feuille: await onglet.texte('#feuille'),
    date: await valeur(onglet, '#devis-date'),
    validite: await valeur(onglet, '#validite'),
    tva: await onglet.evaluer(`document.querySelector('#tva-choix input:checked').value`),
    acompte: await valeur(onglet, '#acompte'),
    conditions: await valeur(onglet, '#conditions'),
  });
  await ouvrir(25);
  const avant25 = await etat();
  await onglet.cliquer('#retour-liste');
  await ouvrir(24);
  const avant24 = await etat();
  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', num(25));
  const listeAvant = await lignesDeLaListe(onglet);

  await onglet.cliquer('#ouvrir-reglages');
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  await onglet.taper(reglage('nom'), 'Marie Martin Conseil EI');
  await onglet.taper(reglage('conditions'), 'Paiement à réception de facture.');
  await onglet.cliquer('#reglage-tva input[value="10"] + span');
  const rouge = (sel) => onglet.evaluer(`getComputedStyle(document.querySelector('${sel}')).borderTopColor`).then((c) => c === 'rgb(180, 35, 24)');
  await onglet.taper(reglage('acompte'), '150');
  assert.equal(await rouge(reglage('acompte')), true);
  await onglet.taper(reglage('acompte'), '40');
  assert.equal(await rouge(reglage('acompte')), false);
  await onglet.taper(reglage('validite'), '400');
  assert.equal(await rouge(reglage('validite')), true);
  await onglet.taper(reglage('validite'), '45');
  assert.equal(await rouge(reglage('validite')), false);
  await onglet.recharger();
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  assert.equal(await onglet.evaluer(`document.querySelector('#reglage-tva input:checked').value`), '10');
  assert.equal(await valeur(onglet, reglage('acompte')), '40');
  assert.equal(await valeur(onglet, reglage('validite')), '45');
  await onglet.cliquer('#reglages .retour');
  await onglet.attendreTexte('#liste-lignes', num(25));

  // Devis existants, brouillons compris : rien n'a bougé.
  assert.deepEqual(await lignesDeLaListe(onglet), listeAvant);
  await ouvrir(25);
  assert.deepEqual(await etat(), avant25);
  await onglet.cliquer('#retour-liste');
  await ouvrir(24);
  assert.deepEqual(await etat(), avant24);
  await onglet.cliquer('#retour-liste');

  // Le devis créé ensuite prend les réglages du jour.
  await onglet.cliquer('#nouveau-devis');
  await onglet.attendreTexte('#devis-numero-barre', num(26));
  assert.equal(await onglet.evaluer(`document.querySelector('#tva-choix input:checked').value`), '10');
  assert.equal(await valeur(onglet, '#acompte'), '40');
  assert.equal(await valeur(onglet, '#validite'), '45');
  assert.equal(await valeur(onglet, '#remise'), '0');
  assert.equal(await valeur(onglet, '#devis-date'), jourPlus(0)[1]);
  assert.equal(await valeur(onglet, '#conditions'), 'Paiement à réception de facture.');
  assert.match(normal(await onglet.texte('#feuille .f-emetteur')), /^Marie Martin Conseil EI\n/);
  assert.match(normal(await onglet.texte('#feuille .f-document')), new RegExp(`Valable jusqu'au ${jourPlus(45)[0]}`));
  assert.deepEqual((await totauxAffiches(onglet)).map((l) => l[0]), ['Total HT', 'TVA 10 %', 'Total TTC', 'Acompte à la commande (40 %)', 'Reste à payer']);
  assert.equal(normal(await onglet.texte('#feuille .f-conditions .texte-multiligne')), 'Paiement à réception de facture.');
  assert.deepEqual(onglet.erreurs, []);
});

// ---- Saisie contrôlée et PDF refusé s'il manque quelque chose (tranche 06) ----

const ROUGE = 'rgb(180, 35, 24)';
const estRouge = (o, sel) => o.evaluer(`getComputedStyle(document.querySelector(${JSON.stringify(sel)})).borderTopColor`).then((c) => c === ROUGE);
// Les manques listés par la page après un refus, tels qu'affichés (vide si la liste est cachée).
const manquesAffiches = (o) => o.evaluer(`(() => { const p = document.querySelector('#manques');
  return p.offsetParent === null ? [] : [...p.querySelectorAll('li')].map((li) => li.innerText.trim()); })()`);
// Impressions demandées à Chrome, relevées par le témoin posé sur window.print : titre de la page à ce moment.
const impressions = (o) => o.evaluer('window.__impressions || []');
// Ouvertures de l'impression par Chrome (événement beforeprint) : titre de la page à ce moment.
const ouvertures = (o) => o.evaluer('window.__ouvertures || []');

async function poserTemoinImpression(o) {
  await o.envoyer('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
    window.__impressions = [];
    window.__ouvertures = [];
    const imprimer = window.print.bind(window);
    window.print = () => { window.__impressions.push(document.title); return imprimer(); };
    window.addEventListener('beforeprint', () => window.__ouvertures.push(document.title));
  })()` });
}

test('quantité et prix mal tapés : entourés en rouge, 0,5 accepté, 0, négatif et 0,125 refusés', async () => {
  await poserTemoinImpression(onglet);
  await onglet.recharger();
  await onglet.attendreTexte('#devis-numero-barre', num(26));
  const q = ligneSaisie(1, 'quantite');
  const p = ligneSaisie(1, 'prix');
  const aide = () => onglet.texte('#lignes .ligne:nth-child(1) .ligne-aide');

  // Cases encore vides : pas de rouge avant d'avoir demandé le PDF.
  assert.equal(await estRouge(onglet, q), false);
  assert.equal(await estRouge(onglet, p), false);

  await onglet.taper(q, '0,5');
  assert.equal(await estRouge(onglet, q), false, '0,5 accepté');
  assert.equal(await aide(), null);
  for (const refuse of ['0', '-2', '0,125']) {
    await onglet.taper(q, refuse);
    assert.equal(await estRouge(onglet, q), true, 'quantité ' + refuse + ' en rouge');
    assert.equal(await aide(), 'Quantité : plus de 0, deux décimales au plus.');
  }
  await onglet.taper(q, '1');
  for (const refuse of ['-5', '450,125']) {
    await onglet.taper(p, refuse);
    assert.equal(await estRouge(onglet, p), true, 'prix ' + refuse + ' en rouge');
    assert.equal(await aide(), 'Prix : 0 ou plus, deux décimales au plus.');
  }
  for (const accepte of ['0', '450,50']) {
    await onglet.taper(p, accepte);
    assert.equal(await estRouge(onglet, p), false, 'prix ' + accepte + ' accepté');
  }
  assert.equal(await aide(), null);
  await onglet.taper(q, '');
  await onglet.taper(p, '');
  assert.deepEqual(onglet.erreurs, []);
});

test('« Sortir le PDF » refusé : la page liste les manques et entoure les cases en rouge ; complété, le PDF sort, statut inchangé', async () => {
  // Sans aucune ligne ni client : refusé.
  onglet.dialogues.length = 0;
  await onglet.cliquer('#lignes .ligne:nth-child(1) [data-action="supprimer"]');
  await attendre(() => onglet.evaluer('document.querySelectorAll("#lignes .ligne").length === 0'), 'ligne supprimée');
  await onglet.cliquer('#sortir-pdf');
  await onglet.attendreTexte('#manques', 'Le PDF n\'est pas sorti');
  assert.deepEqual(await manquesAffiches(onglet), ['Nom du client', 'Adresse du client', 'Au moins une ligne de prestation']);
  assert.deepEqual(await impressions(onglet), []);
  for (const sel of ['#client-nom', '#client-adresse', '#ajouter-ligne']) assert.equal(await estRouge(onglet, sel), true, sel + ' en rouge');
  assert.equal(await estRouge(onglet, '#client-contact'), false, 'contact facultatif');

  // Une ligne ajoutée : la liste suit, ses cases vides sont en rouge.
  await onglet.cliquer('#ajouter-ligne');
  assert.deepEqual(await manquesAffiches(onglet), ['Nom du client', 'Adresse du client', 'Ligne 1 : titre', 'Ligne 1 : quantité', 'Ligne 1 : prix']);
  for (const champ of ['titre', 'quantite', 'prix']) assert.equal(await estRouge(onglet, ligneSaisie(1, champ)), true, champ + ' en rouge');
  assert.equal(await estRouge(onglet, ligneSaisie(1, 'detail')), false, 'détail facultatif');
  assert.equal(await estRouge(onglet, '#ajouter-ligne'), false);

  // Quantité mal tapée et ligne offerte à 0,00 €.
  await onglet.taper(ligneSaisie(1, 'quantite'), '0,125');
  await onglet.cliquer('#ajouter-ligne');
  await onglet.taper(ligneSaisie(2, 'titre'), 'Suivi à un mois');
  await onglet.taper(ligneSaisie(2, 'quantite'), '1');
  await onglet.taper(ligneSaisie(2, 'prix'), '0');
  await onglet.taper('#remise', '150');
  await onglet.cliquer('#sortir-pdf');
  assert.deepEqual(await manquesAffiches(onglet), ['Nom du client', 'Adresse du client', 'Ligne 1 : titre', 'Ligne 1 : quantité à corriger', 'Ligne 1 : prix', 'Remise à corriger']);
  for (const champ of ['titre', 'quantite', 'prix']) assert.equal(await estRouge(onglet, ligneSaisie(2, champ)), false, 'ligne 2 ' + champ);
  assert.deepEqual(await impressions(onglet), []);

  // On complète : chaque case remplie perd son rouge et quitte la liste.
  await onglet.taper('#client-nom', 'Studio Lune');
  assert.equal(await estRouge(onglet, '#client-nom'), false);
  assert.equal((await manquesAffiches(onglet))[0], 'Adresse du client');
  // Un clic sur un manque met le curseur dans la case.
  await onglet.cliquer('#manques li:nth-child(1) button');
  assert.equal(await onglet.evaluer('document.activeElement.id'), 'client-adresse');
  await onglet.taper('#client-adresse', '3 place du Marché\n35000 Rennes');
  await onglet.taper(ligneSaisie(1, 'titre'), 'Atelier de cadrage');
  await onglet.taper(ligneSaisie(1, 'quantite'), '0,5');
  await onglet.taper(ligneSaisie(1, 'prix'), '900');
  assert.deepEqual(await manquesAffiches(onglet), ['Remise à corriger']);
  await onglet.taper('#remise', '0');
  assert.deepEqual(await manquesAffiches(onglet), []);
  for (const sel of ['#client-nom', '#client-adresse', ligneSaisie(1, 'titre'), ligneSaisie(1, 'quantite'), ligneSaisie(1, 'prix'), '#remise']) {
    assert.equal(await estRouge(onglet, sel), false, sel);
  }

  // Complet, une ligne à 0,00 € comprise : le PDF sort avec « <numéro> - <client> ».
  assert.deepEqual((await onglet.evaluer(`[...document.querySelectorAll('#feuille .f-tableau tbody tr:nth-child(2) td')].map((td) => td.innerText.trim())`)).map(normal),
    ['Suivi à un mois', '1', '0,00 €', '0,00 €']);
  await onglet.cliquer('#sortir-pdf');
  assert.deepEqual(await impressions(onglet), [`${num(26)} - Studio Lune`]);
  assert.deepEqual(await manquesAffiches(onglet), []);
  assert.deepEqual(onglet.dialogues, ['Supprimer la ligne 1 ?']);

  // Le statut n'a pas bougé, ni tout de suite, ni après rechargement.
  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', num(26));
  assert.deepEqual((await lignesDeLaListe(onglet))[0], [num(26), 'Studio Lune', AUJOURDHUI, '495,00 €', 'Brouillon']);
  await onglet.recharger();
  await onglet.attendreTexte('#liste-lignes', num(26));
  assert.deepEqual((await lignesDeLaListe(onglet))[0], [num(26), 'Studio Lune', AUJOURDHUI, '495,00 €', 'Brouillon']);
  assert.deepEqual(onglet.erreurs, []);
});

// ---- Un devis de plusieurs pages, lisible en noir et blanc (tranche 07) ----
// Le découpage des pages, le pied « <numéro> — page x/y » et le noir et blanc se vérifient dans le PDF : tests/pdf.js.

test('« Sortir le PDF » : à l\'ouverture de l\'impression, le titre de la page est « <numéro> - <client> » du moment', async () => {
  await onglet.cliquer(`#liste-lignes a[href="#${num(26)}"]`);
  await onglet.attendreTexte('#devis-numero-barre', num(26));
  await onglet.taper('#client-nom', 'Atelier Soleil');
  const avant = (await ouvertures(onglet)).length;
  await onglet.cliquer('#sortir-pdf');
  await attendre(async () => (await ouvertures(onglet)).length > avant, 'ouverture de l\'impression');
  assert.deepEqual((await ouvertures(onglet)).slice(avant), [`${num(26)} - Atelier Soleil`]);
  assert.equal(await onglet.visible('#manques'), false);
  assert.deepEqual(onglet.erreurs, []);
});

// ---- Statuts et suppression d'un devis (tranche 08) ----

const ligneListe = (n) => `#liste-lignes tr:has(a[href="#${num(n)}"])`;
const statutsDeLaListe = async (o) => (await lignesDeLaListe(o)).map((l) => l[0] + ' ' + l[4]);
const statutDuDevis = (o) => o.evaluer(`(() => { const s = document.querySelector('#devis-statut'); return s.options[s.selectedIndex].text; })()`);

test('statut changé directement dans la liste, sans ouvrir le devis : il reste après rechargement', async () => {
  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', num(26));
  const dialoguesAvant = onglet.dialogues.length;
  const avant = await lignesDeLaListe(onglet);
  assert.deepEqual(avant.map((l) => l[0]), [num(26), num(25), num(24), num(23)]);
  assert.deepEqual(await onglet.evaluer(`[...document.querySelector('${ligneListe(26)} select').options].map((o) => o.text)`),
    ['Brouillon', 'Envoyé', 'Accepté', 'Refusé']);

  await onglet.choisir(`${ligneListe(26)} select`, 'Envoyé');
  await onglet.choisir(`${ligneListe(25)} select`, 'Accepté');
  await onglet.choisir(`${ligneListe(24)} select`, 'Refusé');
  // Toujours sur la liste : changer le statut n'ouvre pas le devis.
  assert.equal(await onglet.visible('#liste-devis'), true);
  assert.equal(await onglet.visible('#devis'), false);

  const attendu = [`${num(26)} Envoyé`, `${num(25)} Accepté`, `${num(24)} Refusé`, `${num(23)} Brouillon`];
  assert.deepEqual(await statutsDeLaListe(onglet), attendu);
  // Le reste de chaque ligne n'a pas bougé.
  assert.deepEqual((await lignesDeLaListe(onglet)).map((l) => l.slice(0, 4)), avant.map((l) => l.slice(0, 4)));

  await onglet.recharger();
  await onglet.attendreTexte('#liste-lignes', num(26));
  assert.deepEqual(await statutsDeLaListe(onglet), attendu);
  assert.equal(onglet.dialogues.length, dialoguesAvant, 'aucune boîte de dialogue');
  assert.deepEqual(onglet.erreurs, []);
});

test('statut changé depuis l\'écran du devis : gardé après rechargement et repris par la liste, jamais imprimé', async () => {
  await onglet.cliquer(`${ligneListe(23)} a`);
  await onglet.attendreTexte('#devis-numero-barre', num(23));
  assert.equal(await statutDuDevis(onglet), 'Brouillon');

  await onglet.choisir('#devis-statut', 'Envoyé');
  assert.doesNotMatch(await onglet.texte('#feuille'), /Brouillon|Envoyé|Accepté|Refusé/);
  await onglet.recharger();
  await onglet.attendreTexte('#devis-numero-barre', num(23));
  assert.equal(await statutDuDevis(onglet), 'Envoyé');
  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', num(23));
  assert.deepEqual((await statutsDeLaListe(onglet))[3], `${num(23)} Envoyé`);

  // Et retour au brouillon, toujours depuis le devis.
  await onglet.cliquer(`${ligneListe(23)} .col-client`);
  await onglet.attendreTexte('#devis-numero-barre', num(23));
  await onglet.choisir('#devis-statut', 'Brouillon');
  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', num(23));
  assert.deepEqual(await statutsDeLaListe(onglet), [`${num(26)} Envoyé`, `${num(25)} Accepté`, `${num(24)} Refusé`, `${num(23)} Brouillon`]);
  assert.deepEqual(onglet.erreurs, []);
});

test('devis « Envoyé » rouvert et modifié sans confirmation : numéro et statut gardés, aucun repère de modification', async () => {
  onglet.dialogues.length = 0;
  const pastille = () => onglet.evaluer(`(() => { const s = getComputedStyle(document.querySelector('${ligneListe(26)} select'));
    return [s.backgroundColor, s.color, s.borderTopColor, s.fontWeight].join(' '); })()`);
  const pastilleAvant = await pastille();
  const ligneAvant = (await lignesDeLaListe(onglet))[0];
  assert.deepEqual(ligneAvant, [num(26), 'Atelier Soleil', AUJOURDHUI, '495,00 €', 'Envoyé']);

  await onglet.cliquer(`${ligneListe(26)} .col-client`);
  await onglet.attendreTexte('#devis-numero-barre', num(26));
  assert.equal(await statutDuDevis(onglet), 'Envoyé');
  assert.equal(await onglet.visible('#manques'), false);
  await onglet.taper('#client-nom', 'Studio Lune');
  await onglet.taper(ligneSaisie(1, 'quantite'), '1');
  assert.match(normal(await onglet.texte('#feuille .f-totaux')), /990,00 €/);
  assert.equal(await statutDuDevis(onglet), 'Envoyé');
  assert.equal(await onglet.texte('#devis-numero-barre'), num(26));
  assert.deepEqual(onglet.dialogues, [], 'aucune confirmation');

  await onglet.recharger();
  await onglet.attendreTexte('#devis-numero-barre', num(26));
  assert.equal(await valeur(onglet, '#client-nom'), 'Studio Lune');
  assert.equal(await statutDuDevis(onglet), 'Envoyé');
  assert.doesNotMatch(await onglet.evaluer('document.querySelector("#devis").innerText'), /modifi|version|v2|révis/i);

  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', 'Studio Lune');
  assert.deepEqual((await lignesDeLaListe(onglet))[0], [num(26), 'Studio Lune', AUJOURDHUI, '990,00 €', 'Envoyé']);
  // Rien dans la liste ne signale la modification : même pastille, aucune mention.
  assert.equal(await pastille(), pastilleAvant);
  assert.doesNotMatch(await onglet.evaluer('document.querySelector("#liste").innerText'), /modifi|version|v2|révis/i);
  assert.deepEqual(onglet.dialogues, []);
  assert.deepEqual(onglet.erreurs, []);
});

test('« Supprimer » : confirmation demandée ; refusée, le devis reste ; acceptée, il sort de la liste quel que soit son statut', async () => {
  onglet.dialogues.length = 0;
  onglet.reponseDialogue = false;
  try {
    await onglet.cliquer(`${ligneListe(26)} .supprimer-devis`);
    await attendre(() => onglet.dialogues.length === 1, 'confirmation');
  } finally {
    onglet.reponseDialogue = true;
  }
  assert.match(onglet.dialogues[0], new RegExp(`Supprimer le devis ${num(26)} \\(Studio Lune\\)`));
  assert.equal(await onglet.visible('#devis'), false, 'le devis ne s\'ouvre pas');
  assert.equal((await lignesDeLaListe(onglet)).length, 4);

  // Envoyé, accepté, refusé, brouillon : chacun se supprime.
  const restants = [26, 25, 24, 23];
  for (const n of [26, 25, 24, 23]) {
    await onglet.cliquer(`${ligneListe(n)} .supprimer-devis`);
    restants.shift();
    await attendre(async () => (await lignesDeLaListe(onglet)).length === restants.length, 'devis ' + num(n) + ' retiré');
    assert.deepEqual((await lignesDeLaListe(onglet)).map((l) => l[0]), restants.map(num));
    await onglet.recharger();
    await onglet.attendreTexte('#liste .titre-ecran', 'Devis');
    assert.deepEqual((await lignesDeLaListe(onglet)).map((l) => l[0]), restants.map(num), 'toujours retiré après rechargement');
  }
  assert.equal(onglet.dialogues.length, 5);
  assert.match(onglet.dialogues[4], new RegExp(`Supprimer le devis ${num(23)} \\?`));
  await onglet.attendreTexte('#liste-vide', 'Aucun devis');

  // L'adresse d'un devis supprimé, tapée dans un onglet, ouvre la liste.
  await onglet.aller('about:blank');
  await onglet.aller(URL_PAGE + '#' + num(26));
  await onglet.attendreTexte('#liste-vide', 'Aucun devis');
  assert.equal(await onglet.visible('#devis'), false);
  assert.deepEqual(onglet.erreurs, []);
});

test('après suppression de DEV-2026-003, le devis suivant reçoit un numéro jamais donné et le supprimé ne revient pas', async () => {
  // Compteur remis à 1 dans les réglages pour rejouer 001, 002, 003.
  await onglet.cliquer('#ouvrir-reglages');
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  await onglet.taper('#prochain-numero', '1');
  assert.equal(await onglet.texte('#prochain-apercu'), `Prochain devis : ${num(1)}.`);
  await onglet.cliquer('#reglages .retour');
  for (const n of [1, 2, 3]) {
    await onglet.cliquer('#nouveau-devis');
    await onglet.attendreTexte('#devis-numero-barre', num(n));
    await onglet.cliquer('#retour-liste');
    await onglet.attendreTexte('#liste-lignes', num(n));
  }
  await onglet.cliquer(`${ligneListe(3)} .supprimer-devis`);
  await attendre(async () => (await lignesDeLaListe(onglet)).length === 2, 'DEV-003 retiré');

  await onglet.cliquer('#nouveau-devis');
  await onglet.attendreTexte('#devis-numero-barre', num(4));
  await onglet.cliquer('#retour-liste');
  await onglet.recharger();
  await onglet.attendreTexte('#liste-lignes', num(4));
  assert.deepEqual((await lignesDeLaListe(onglet)).map((l) => l[0]), [num(4), num(2), num(1)]);

  // Même avec « Prochain numéro » réglé plus bas, un numéro supprimé n'est pas redonné.
  await onglet.cliquer('#ouvrir-reglages');
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  await onglet.taper('#prochain-numero', '3');
  assert.equal(await onglet.texte('#prochain-apercu'), `Prochain devis : ${num(5)} (${num(3)} a été supprimé).`);
  await onglet.taper('#prochain-numero', '24');
  assert.equal(await onglet.texte('#prochain-apercu'), `Prochain devis : ${num(27)} (${num(24)} a été supprimé).`);
  await onglet.taper('#prochain-numero', '2');
  assert.equal(await onglet.texte('#prochain-apercu'), `Prochain devis : ${num(5)} (${num(2)} existe déjà).`);
  await onglet.cliquer('#reglages .retour');
  await onglet.cliquer('#nouveau-devis');
  await onglet.attendreTexte('#devis-numero-barre', num(5));
  await onglet.cliquer('#retour-liste');
  await onglet.attendreTexte('#liste-lignes', num(5));
  assert.deepEqual((await lignesDeLaListe(onglet)).map((l) => l[0]), [num(5), num(4), num(2), num(1)]);
  assert.deepEqual(onglet.erreurs, []);
});

test('deux onglets : un devis supprimé dans l\'un ramène l\'autre à la liste et ne revient pas', async () => {
  const autre = await nav.onglet();
  try {
    await autre.aller(URL_PAGE + '#' + num(4));
    await autre.attendreTexte('#devis-numero-barre', num(4));
    await autre.taper('#client-nom', 'Brouillon à jeter');

    await onglet.recharger();
    await onglet.attendreTexte('#liste-lignes', 'Brouillon à jeter');
    await onglet.cliquer(`${ligneListe(4)} .supprimer-devis`);
    await attendre(async () => (await lignesDeLaListe(onglet)).length === 3, 'DEV-004 retiré');

    await autre.attendreTexte('#liste-lignes', num(5));
    assert.equal(await autre.visible('#devis'), false);
    await onglet.recharger();
    await onglet.attendreTexte('#liste-lignes', num(5));
    assert.deepEqual((await lignesDeLaListe(onglet)).map((l) => l[0]), [num(5), num(2), num(1)]);
    assert.deepEqual(autre.erreurs, []);
  } finally {
    await autre.fermer();
  }
});
