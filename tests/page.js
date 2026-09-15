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

// Les lignes de la liste telles qu'affichées : [numéro, client, date, total TTC, statut].
function lignesDeLaListe(o) {
  return o.evaluer(`[...document.querySelectorAll('#liste-lignes tr')]
    .filter((tr) => tr.offsetParent !== null)
    .map((tr) => [...tr.cells].map((td) => td.innerText.trim()))`)
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
