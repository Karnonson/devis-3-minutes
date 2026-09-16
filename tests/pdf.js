// Contrôle automatique du PDF : ce que reçoit le prospect.
// Lancer : node --test tests/pdf.js (environ 45 s). GARDER_PDF=<dossier> y garde les PDF sortis.
// Part d'un profil Chrome neuf, remplit les réglages et des devis dans la page comme une personne, clique
// « Exporter en PDF », puis fait imprimer la page en PDF par Chrome sans fenêtre (Page.printToPDF, en-têtes et
// pieds de page de Chrome demandés comme dans la fenêtre d'impression). Le PDF est lu par `pdftotext`
// (poppler-utils, déjà présent sur l'ordinateur) : textes, pages et positions, rien d'autre.
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { lancerChrome, attendre } = require('./chrome.js');

const URL_PAGE = 'http://localhost:8000/';
const RACINE = path.join(__dirname, '..');
const PROFIL = fs.mkdtempSync(path.join(os.tmpdir(), 'devis-3-minutes-pdf-'));
const ANNEE = new Date().getFullYear();
const num = (n) => `DEV-${ANNEE}-${String(n).padStart(3, '0')}`;
const MM = 72 / 25.4; // points PDF par millimètre
const A4 = { largeur: 210 * MM, hauteur: 297 * MM };

let serveur = null;
let nav = null;
let onglet = null;

// « 243000 » centimes → « 2 430,00 € » (espaces ordinaires : le PDF lu est normalisé de même).
function euros(centimes) {
  const e = String(Math.floor(centimes / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return e + ',' + String(centimes % 100).padStart(2, '0') + ' €';
}
const pourcent = (base, taux) => Math.floor((base * taux * 2 + 100) / 200); // arrondi au centime, demi vers le haut

// Lit un PDF : [{ largeur, hauteur, rangees: [{ texte, haut, bas, gauche, droite }] }], rangées de haut en bas.
// Une rangée réunit les lignes de texte posées à la même hauteur (libellé et montant, colonnes du tableau).
// Avec GARDER_PDF=<dossier>, chaque PDF sorti y est gardé pour être regardé.
function lirePdf(donnees, nom) {
  const fichier = path.join(process.env.GARDER_PDF || PROFIL, nom + '.pdf');
  fs.writeFileSync(fichier, donnees);
  const tsv = execFileSync('pdftotext', ['-tsv', fichier, '-'], { encoding: 'utf8' });
  const pages = [];
  let ligne = null;
  for (const l of tsv.split('\n').slice(1)) {
    const c = l.split('\t');
    if (c.length < 12) continue;
    const [niveau, gauche, haut, largeur, hauteur, texte] = [Number(c[0]), Number(c[6]), Number(c[7]), Number(c[8]), Number(c[9]), c.slice(11).join('\t')];
    if (niveau === 1) pages.push({ largeur, hauteur, lignes: [] });
    else if (niveau === 4) { ligne = { mots: [], haut, bas: haut + hauteur, gauche, droite: gauche + largeur }; pages[pages.length - 1].lignes.push(ligne); }
    else if (niveau === 5) ligne.mots.push(texte);
  }
  return pages.map((p) => {
    const lignes = p.lignes.map((l) => ({ ...l, texte: l.mots.join(' ').replace(/[\u00a0\u202f]/g, ' ').replace(/ +/g, ' ') }))
      .sort((a, b) => a.haut - b.haut || a.gauche - b.gauche);
    const rangees = [];
    for (const l of lignes) {
      const r = rangees.find((x) => Math.abs(x.haut - l.haut) < 3);
      if (r) { r.lignes.push(l); r.bas = Math.max(r.bas, l.bas); r.gauche = Math.min(r.gauche, l.gauche); r.droite = Math.max(r.droite, l.droite); }
      else rangees.push({ lignes: [l], haut: l.haut, bas: l.bas, gauche: l.gauche, droite: l.droite });
    }
    rangees.forEach((r) => { r.texte = r.lignes.sort((a, b) => a.gauche - b.gauche).map((l) => l.texte).join(' '); });
    return { largeur: p.largeur, hauteur: p.hauteur, lignes, rangees };
  });
}

// La rangée d'une page dont le texte correspond (chaîne exacte ou expression), sinon undefined.
const rangee = (page, motif) => page.rangees.find((r) => (motif instanceof RegExp ? motif.test(r.texte) : r.texte === motif));
// La ligne de texte seule (sans ce qui est posé à côté) qui correspond, sinon undefined.
const ligneSeule = (page, motif) => page.lignes.find((l) => (motif instanceof RegExp ? motif.test(l.texte) : l.texte === motif));
// Numéro (à partir de 0) de la page qui contient la rangée, ou -1.
const pageDe = (pages, motif) => pages.findIndex((p) => rangee(p, motif));

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
  // Témoin à la frontière entre la page et Chrome : titre de la page quand l'impression est demandée.
  await onglet.envoyer('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
    window.__impressions = [];
    const imprimer = window.print.bind(window);
    window.print = () => { window.__impressions.push(document.title); return imprimer(); };
  })()` });
  await onglet.aller(URL_PAGE);
  await onglet.attendreTexte('#reglages .titre-ecran', 'Réglages');
  const reglage = (cle) => `#form-reglages [data-reglage="${cle}"]`;
  await onglet.taper(reglage('nom'), 'Marie Martin EI');
  await onglet.taper(reglage('adresse'), '8 rue du Port\n44000 Nantes');
  await onglet.taper(reglage('siret'), '123 456 789 00012');
  await onglet.cliquer('#reglages .retour');
  await onglet.attendreTexte('#liste-vide', 'Aucun devis');
});

after(async () => {
  if (nav) await nav.fermer();
  if (serveur) serveur.kill();
  fs.rmSync(PROFIL, { recursive: true, force: true });
});

// Crée un devis dans la page : client Studio Lune et les lignes données [{ titre, detail, quantite, prix }].
async function remplirDevis(numero, lignes, remise) {
  if (await onglet.visible('#retour-liste')) await onglet.cliquer('#retour-liste');
  await onglet.cliquer('#nouveau-devis');
  await onglet.attendreTexte('#devis-numero-barre', numero);
  await onglet.taper('#client-nom', 'Studio Lune');
  await onglet.taper('#client-adresse', '3 place du Marché\n35000 Rennes');
  for (let i = 0; i < lignes.length; i++) {
    if (i > 0) await onglet.cliquer('#ajouter-ligne');
    const champ = (c) => `#lignes .ligne:nth-child(${i + 1}) [data-champ="${c}"]`;
    for (const c of ['titre', 'detail', 'quantite', 'prix']) if (lignes[i][c]) await onglet.taper(champ(c), lignes[i][c]);
  }
  if (remise) await onglet.taper('#remise', remise);
}

// Clic sur « Exporter en PDF » (accepté, titre en place), puis impression en PDF par Chrome.
async function sortirPdf(titre) {
  const avant = (await onglet.evaluer('window.__impressions')).length;
  await onglet.cliquer('#exporter-pdf');
  assert.equal(await onglet.visible('#manques'), false, 'PDF accepté par la page');
  assert.deepEqual((await onglet.evaluer('window.__impressions')).slice(avant), [titre]);
  const { data } = await onglet.envoyer('Page.printToPDF', { preferCSSPageSize: true, displayHeaderFooter: true });
  return lirePdf(Buffer.from(data, 'base64'), titre);
}

// Ce qui vaut pour tout PDF sorti : A4, pied « <numéro> — page x/y » sous tout le reste et dans la marge,
// rien ajouté par Chrome, en-tête du tableau en haut de chaque page où le tableau se poursuit, aucune ligne
// coupée, totaux, conditions et « Bon pour accord » sur la même page.
function verifierPages(pages, numero, lignes) {
  pages.forEach((p, i) => {
    const n = i + 1;
    assert.ok(Math.abs(p.largeur - A4.largeur) < 2 && Math.abs(p.hauteur - A4.hauteur) < 2, `page ${n} en A4 (${p.largeur} × ${p.hauteur} pt)`);
    const pied = p.rangees[p.rangees.length - 1];
    assert.equal(pied.texte, `${numero} — page ${n}/${pages.length}`, `pied de la page ${n}`);
    assert.ok(pied.haut > p.hauteur - 16 * MM, `pied de la page ${n} dans la marge du bas`);
    assert.ok(p.rangees.slice(0, -1).every((r) => r.bas <= pied.haut), `pied de la page ${n} sous tout le reste`);
    assert.equal(p.rangees.filter((r) => /page \d+\/\d+/.test(r.texte)).length, 1, `un seul pied sur la page ${n}`);
    for (const r of p.rangees) assert.doesNotMatch(r.texte, /localhost|http|Devis 3 minutes|\d{1,2}:\d{2}/, `rien ajouté par Chrome page ${n}`);

    // Toute page qui porte des lignes de prestation commence le tableau par son en-tête.
    const prestations = p.rangees.filter((r) => lignes.some((l) => r.texte.startsWith(l.titre + ' ')));
    if (prestations.length) {
      const entete = rangee(p, 'PRESTATION QTÉ PU HT TOTAL HT');
      assert.ok(entete, `en-tête du tableau sur la page ${n}`);
      assert.ok(prestations.every((r) => r.haut > entete.bas), `en-tête au-dessus des lignes, page ${n}`);
    }
  });

  // Aucune ligne coupée : titre, montants et chaque ligne du détail d'une prestation sur la même page, une seule fois.
  for (const l of lignes) {
    const quantite = l.quantite.replace('.', ',');
    const prix = euros(Math.round(Number(l.prix.replace(',', '.')) * 100));
    const total = euros(Math.round(Number(l.quantite.replace(',', '.')) * Number(l.prix.replace(',', '.')) * 100));
    const titre = `${l.titre} ${quantite} ${prix} ${total}`;
    const ou = pages.map((p) => p.rangees.filter((r) => r.texte === titre).length);
    assert.equal(ou.reduce((a, b) => a + b, 0), 1, `« ${titre} » une seule fois (vu : ${JSON.stringify(ou)})`);
    const page = ou.indexOf(1);
    for (const morceau of (l.detail || '').split('\n').filter(Boolean)) {
      assert.equal(pageDe(pages, morceau), page, `détail « ${morceau} » sur la page de « ${l.titre} »`);
    }
  }

  const fin = pageDe(pages, /^Total (TTC )?\d/);
  assert.equal(fin, pages.length - 1, 'totaux sur la dernière page');
  for (const motif of ['Reste à payer', 'CONDITIONS', 'Bon pour accord', 'DATE SIGNATURE']) {
    assert.equal(pageDe(pages, motif === 'Reste à payer' ? /^Reste à payer / : motif), fin, `« ${motif} » avec les totaux`);
  }
}

// Ordre Stripe de haut en bas : coordonnées à gauche et « DEVIS » à droite, client à droite, tableau,
// totaux à droite, conditions, « Bon pour accord » à droite.
function verifierOrdre(pages, numero) {
  const premiere = pages[0];
  const derniere = pages[pages.length - 1];
  const milieu = premiere.largeur / 2;
  const emetteur = rangee(premiere, /^Marie Martin EI\b/);
  const ligneDe = (r, motif) => r.lignes.find((l) => motif.test(l.texte));
  assert.ok(emetteur, 'coordonnées en haut');
  assert.ok(ligneDe(emetteur, /^Marie Martin EI$/).droite < milieu, 'coordonnées à gauche');
  const devis = ligneDe(emetteur, /^DEVIS$/);
  assert.ok(devis && devis.gauche > milieu, '« DEVIS » à droite, à la hauteur des coordonnées');
  assert.equal(premiere.rangees.indexOf(emetteur), 0, 'rien au-dessus de l\'en-tête');
  const numeroRangee = ligneSeule(premiere, numero);
  const siret = ligneSeule(premiere, 'SIRET 123 456 789 00012');
  const validite = ligneSeule(premiere, /^Valable jusqu'au \d\d\/\d\d\/\d{4}$/);
  const client = ligneSeule(premiere, 'CLIENT');
  const clientNom = ligneSeule(premiere, 'Studio Lune');
  const entete = rangee(premiere, 'PRESTATION QTÉ PU HT TOTAL HT');
  const totalHt = rangee(derniere, /^Total HT \d/);
  const reste = rangee(derniere, /^Reste à payer /);
  const conditions = rangee(derniere, 'CONDITIONS');
  const accord = rangee(derniere, 'Bon pour accord');
  for (const [nom, r] of Object.entries({ numeroRangee, siret, validite, client, clientNom, entete, totalHt, reste, conditions, accord })) assert.ok(r, nom + ' présent');
  assert.ok(numeroRangee.gauche > milieu && validite.gauche > milieu, 'numéro et validité à droite');
  assert.ok(client.gauche > milieu && clientNom.gauche > milieu, 'client à droite');
  assert.ok(siret.bas <= client.haut && validite.bas <= client.haut, 'client sous l\'en-tête');
  assert.ok(clientNom.bas <= entete.haut, 'tableau sous le client');
  assert.ok(totalHt.gauche > milieu, 'totaux à droite');
  assert.ok(reste.bas <= conditions.haut && conditions.bas <= accord.haut, 'totaux, puis conditions, puis « Bon pour accord »');
  assert.ok(accord.gauche > milieu, '« Bon pour accord » à droite');
}

// Totaux attendus d'un devis à 20 % de TVA et 30 % d'acompte, remise en pourcentage entier.
function totauxAttendus(lignes, remise = 0) {
  const ht = lignes.reduce((s, l) => s + Math.round(Number(l.quantite.replace(',', '.')) * Number(l.prix.replace(',', '.')) * 100), 0);
  const montantRemise = pourcent(ht, remise);
  const apres = ht - montantRemise;
  const tva = pourcent(apres, 20);
  const ttc = apres + tva;
  const acompte = pourcent(ttc, 30);
  return [
    `Total HT ${euros(ht)}`,
    ...(remise ? [`Remise ${remise} % −${euros(montantRemise)}`, `Total HT après remise ${euros(apres)}`] : []),
    `TVA 20 % ${euros(tva)}`,
    `Total TTC ${euros(ttc)}`,
    `Acompte à la commande (30 %) ${euros(acompte)}`,
    `Reste à payer ${euros(ttc - acompte)}`,
  ];
}

function totauxLus(page) {
  const debut = page.rangees.findIndex((r) => /^Total HT \d/.test(r.texte));
  const fin = page.rangees.findIndex((r) => /^Reste à payer /.test(r.texte));
  return page.rangees.slice(debut, fin + 1).map((r) => r.texte);
}

// Lignes de prestation numérotées, avec un détail de deux lignes et des prix tous différents.
const prestations = (n) => Array.from({ length: n }, (_, i) => {
  const k = String(i + 1).padStart(2, '0');
  return { titre: `Prestation ${k}`, detail: `Détail de la prestation ${k}, première ligne\nFin du détail ${k}`, quantite: '1', prix: String(100 + i) };
});

test('devis court : une page A4, dans l\'ordre Stripe, montants justes, « <numéro> — page 1/1 »', async () => {
  const lignes = [
    { titre: 'Atelier de cadrage', detail: 'Une demi-journée sur place', quantite: '2', prix: '450' },
    { titre: 'Ateliers de conception', detail: '', quantite: '3', prix: '450' },
  ];
  await remplirDevis(num(1), lignes, '10');
  const pages = await sortirPdf(`${num(1)} - Studio Lune`);
  assert.equal(pages.length, 1);
  verifierPages(pages, num(1), lignes);
  verifierOrdre(pages, num(1));
  assert.deepEqual(totauxLus(pages[0]), [
    'Total HT 2 250,00 €',
    'Remise 10 % −225,00 €',
    'Total HT après remise 2 025,00 €',
    'TVA 20 % 405,00 €',
    'Total TTC 2 430,00 €',
    'Acompte à la commande (30 %) 729,00 €',
    'Reste à payer 1 701,00 €',
  ]);
  assert.deepEqual(totauxLus(pages[0]), totauxAttendus(lignes, 10));
});

test('devis de deux pages : en-tête répété, aucune ligne coupée, totaux avec le « Bon pour accord », page 1/2 puis 2/2', async () => {
  const lignes = prestations(12);
  await remplirDevis(num(2), lignes);
  const pages = await sortirPdf(`${num(2)} - Studio Lune`);
  assert.equal(pages.length, 2, 'deux pages');
  assert.ok(pageDe(pages, /^Prestation 12 /) === 1 && pageDe(pages, /^Prestation 01 /) === 0, 'le tableau se poursuit sur la page 2');
  verifierPages(pages, num(2), lignes);
  verifierOrdre(pages, num(2));
  assert.deepEqual(totauxLus(pages[1]), totauxAttendus(lignes));
});

test('devis dont les totaux tomberaient en bas de la page 1 : ils passent en page 2 avec les conditions et le « Bon pour accord »', async () => {
  const lignes = prestations(7);
  await remplirDevis(num(3), lignes);
  const pages = await sortirPdf(`${num(3)} - Studio Lune`);
  assert.equal(pages.length, 2, 'deux pages');
  // Toutes les lignes restent en page 1 ; la fin du devis passe entière en page 2, qui commence par les totaux.
  assert.equal(pageDe(pages, /^Prestation 07 /), 0, 'dernière ligne en page 1');
  assert.match(pages[1].rangees[0].texte, /^Total HT \d/, 'page 2 commence par les totaux');
  verifierPages(pages, num(3), lignes);
  verifierOrdre(pages, num(3));
  assert.deepEqual(totauxLus(pages[1]), totauxAttendus(lignes));
});

test('devis plus long : la fin ne tient pas sous le tableau de la page 2, elle passe entière en page 3', async () => {
  const lignes = prestations(20);
  await remplirDevis(num(4), lignes);
  const pages = await sortirPdf(`${num(4)} - Studio Lune`);
  assert.equal(pages.length, 3, 'trois pages');
  assert.ok(pageDe(pages, /^Prestation 20 /) === 1, 'le tableau se termine en page 2');
  verifierPages(pages, num(4), lignes);
  verifierOrdre(pages, num(4));
  assert.deepEqual(totauxLus(pages[2]), totauxAttendus(lignes));
});

test('en noir et blanc : chaque texte du devis imprimé garde un contraste suffisant sur le blanc, total compris', async () => {
  await onglet.envoyer('Emulation.setEmulatedMedia', { media: 'print' });
  try {
    const textes = await onglet.evaluer(`(() => {
      // Couleur → luminance relative (WCAG) ; en niveaux de gris, un texte garde cette luminance.
      const lum = (c) => { const [r, g, b] = c.match(/\\d+(\\.\\d+)?/g).slice(0, 3).map(Number).map((v) => { v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
      const vus = [];
      const marche = document.createTreeWalker(document.querySelector('#feuille'), NodeFilter.SHOW_TEXT);
      while (marche.nextNode()) {
        const el = marche.currentNode.parentElement;
        if (!marche.currentNode.textContent.trim() || el.offsetParent === null) continue;
        const s = getComputedStyle(el);
        let fond = el; while (fond && getComputedStyle(fond).backgroundColor === 'rgba(0, 0, 0, 0)') fond = fond.parentElement;
        vus.push({ texte: marche.currentNode.textContent.trim().slice(0, 30), contraste: 1.05 / (lum(s.color) + 0.05),
          fond: fond ? getComputedStyle(fond).backgroundColor : 'rgb(255, 255, 255)' });
      }
      return vus;
    })()`);
    assert.ok(textes.some((t) => t.texte.startsWith('Total TTC')), 'le total est parmi les textes vérifiés');
    for (const t of textes) {
      assert.ok(t.contraste >= 4.5, `« ${t.texte} » : contraste ${t.contraste.toFixed(1)} sur le blanc`);
      assert.equal(t.fond, 'rgb(255, 255, 255)', `« ${t.texte} » sur fond blanc`);
    }
  } finally {
    await onglet.envoyer('Emulation.setEmulatedMedia', { media: '' });
  }
});
