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

const normal = (t) => (t === null ? t : t.replace(/[  ]/g, ' '));

// Les lignes de la liste telles qu'affichées : [numéro, client, date, total TTC, statut].
function lignesDeLaListe(o) {
  return o.evaluer(`[...document.querySelectorAll('#liste-lignes tr')]
    .filter((tr) => tr.offsetParent !== null)
    .map((tr) => [...tr.cells].map((td) => td.innerText.trim()))`)
    .then((lignes) => lignes.map((l) => l.map(normal)));
}

const valeur = (o, selecteur) => o.evaluer(`document.querySelector(${JSON.stringify(selecteur)}).value`);

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
});

after(async () => {
  if (nav) await nav.fermer();
  if (serveur) serveur.kill();
  fs.rmSync(PROFIL, { recursive: true, force: true });
});

test('mémoire vide : la liste est la page d\'accueil, « Aucun devis », Réglages et Nouveau devis en haut', async () => {
  await onglet.aller(URL_PAGE);
  await onglet.attendreTexte('#liste .titre-ecran', 'Devis');
  assert.equal(await onglet.texte('#liste .barre #ouvrir-reglages'), 'Réglages');
  assert.equal(await onglet.texte('#liste .barre #nouveau-devis'), 'Nouveau devis');
  const vide = await onglet.texte('#liste-vide');
  assert.match(vide, /Aucun devis/);
  assert.match(vide, /Nouveau devis/);
  assert.equal(await onglet.visible('#liste-devis'), false);
});

test('Réglages n\'affiche encore qu\'un écran « bientôt », et on revient à la liste', async () => {
  await onglet.cliquer('#ouvrir-reglages');
  await onglet.attendreTexte('#reglages main', 'Bientôt');
  await onglet.cliquer('#reglages .retour');
  await onglet.attendreTexte('#liste-vide', 'Aucun devis');
});

test('nouveau devis, saisie, retour à la liste, rechargement : le devis est dans la liste', async () => {
  await onglet.cliquer('#nouveau-devis-vide');
  await onglet.attendreTexte('#devis-numero-barre', num(1));
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
