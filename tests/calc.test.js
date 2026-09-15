// Calculs du devis : on donne ce que le consultant tape, on vérifie ce qui s'affiche.
const test = require('node:test');
const assert = require('node:assert/strict');
const Calc = require('../calc.js');

const esp = ' '; // espace insécable, affichée comme une espace
const euros = (texte) => texte.replace(/ /g, esp);

function afficher(lignes, tva) {
  const t = Calc.totaux(lignes, tva);
  return {
    lignes: t.lignes.map(Calc.formatEuros),
    ht: Calc.formatEuros(t.ht),
    tva: Calc.formatEuros(t.tva),
    ttc: Calc.formatEuros(t.ttc),
  };
}

test('2 × 450 donne 900,00 € sur la ligne', () => {
  const r = afficher([{ quantite: '2', prix: '450' }], 20);
  assert.equal(r.lignes[0], euros('900,00 €'));
});

test('HT, TVA 20 % et TTC d\'un devis de deux lignes', () => {
  const r = afficher([
    { quantite: '2', prix: '450' },
    { quantite: '2', prix: '450' },
  ], 20);
  assert.equal(r.ht, euros('1 800,00 €'));
  assert.equal(r.tva, euros('360,00 €'));
  assert.equal(r.ttc, euros('2 160,00 €'));
});

test('quantité décimale tapée avec une virgule', () => {
  const r = afficher([{ quantite: '0,5', prix: '450' }], 20);
  assert.equal(r.lignes[0], euros('225,00 €'));
});

test('demi-centime arrondi vers le haut, ligne puis TVA', () => {
  // 0,5 × 0,05 = 0,025 → 0,03 ; TVA 20 % de 0,03 = 0,006 → 0,01
  const r = afficher([{ quantite: '0,5', prix: '0,05' }], 20);
  assert.equal(r.lignes[0], euros('0,03 €'));
  assert.equal(r.tva, euros('0,01 €'));
  assert.equal(r.ttc, euros('0,04 €'));
});

test('HT = somme des totaux de ligne déjà arrondis', () => {
  // 3 lignes à 0,025 → 0,03 chacune → 0,09 (et non 0,075 → 0,08)
  const l = { quantite: '0,5', prix: '0,05' };
  const r = afficher([l, l, l], 20);
  assert.equal(r.ht, euros('0,09 €'));
});

test('ligne vide ou encore incomplète : 0,00 €', () => {
  const r = afficher([{ quantite: '', prix: '' }, { quantite: '3', prix: '' }], 20);
  assert.deepEqual(r.lignes, [euros('0,00 €'), euros('0,00 €')]);
  assert.equal(r.ttc, euros('0,00 €'));
});

test('format des montants : milliers séparés, deux décimales', () => {
  assert.equal(Calc.formatEuros(180000), euros('1 800,00 €'));
  assert.equal(Calc.formatEuros(123456789), euros('1 234 567,89 €'));
  assert.equal(Calc.formatEuros(5), euros('0,05 €'));
});

// ---- Remise, TVA et acompte (tranche 04) ----
// On donne ce que le consultant tape : lignes, TVA choisie, remise et acompte en pourcentage.

function afficherTout(lignes, tva, remise, acompte) {
  const t = Calc.totaux(lignes, tva, remise, acompte);
  const e = Calc.formatEuros;
  return {
    ht: e(t.ht), remise: e(t.remise), htApresRemise: e(t.htApresRemise),
    tva: e(t.tva), ttc: e(t.ttc), acompte: e(t.acompte), reste: e(t.reste),
  };
}

test('exemple de référence : 2 × 450 + 3 × 450, remise 10 %, TVA 20 %, acompte 30 %', () => {
  const r = afficherTout([{ quantite: '2', prix: '450' }, { quantite: '3', prix: '450' }], 20, '10', '30');
  assert.deepEqual(r, {
    ht: euros('2 250,00 €'), remise: euros('225,00 €'), htApresRemise: euros('2 025,00 €'),
    tva: euros('405,00 €'), ttc: euros('2 430,00 €'), acompte: euros('729,00 €'), reste: euros('1 701,00 €'),
  });
});

test('TVA 10 %', () => {
  const r = afficherTout([{ quantite: '2', prix: '450' }, { quantite: '3', prix: '450' }], 10, '10', '30');
  assert.equal(r.tva, euros('202,50 €'));
  assert.equal(r.ttc, euros('2 227,50 €'));
  assert.equal(r.acompte, euros('668,25 €'));
  assert.equal(r.reste, euros('1 559,25 €'));
});

test('TVA 0 % : total = HT après remise, acompte sur ce total', () => {
  const r = afficherTout([{ quantite: '2', prix: '450' }, { quantite: '3', prix: '450' }], 0, '10', '30');
  assert.equal(r.tva, euros('0,00 €'));
  assert.equal(r.ttc, euros('2 025,00 €'));
  assert.equal(r.acompte, euros('607,50 €'));
  assert.equal(r.reste, euros('1 417,50 €'));
});

test('sans remise ni acompte : HT après remise = HT, rien à verser à la commande', () => {
  const r = afficherTout([{ quantite: '2', prix: '450' }], 20, '0', '0');
  assert.equal(r.remise, euros('0,00 €'));
  assert.equal(r.htApresRemise, euros('900,00 €'));
  assert.equal(r.ttc, euros('1 080,00 €'));
  assert.equal(r.acompte, euros('0,00 €'));
  assert.equal(r.reste, euros('1 080,00 €'));
});

test('quantités décimales avec remise, TVA et acompte', () => {
  // 0,5 × 450 = 225 ; 1,25 × 380 = 475 ; HT 700 ; remise 5 % = 35 ; 665 ; TVA 20 % = 133 ; TTC 798 ; acompte 30 % = 239,40
  const r = afficherTout([{ quantite: '0,5', prix: '450' }, { quantite: '1,25', prix: '380' }], 20, '5', '30');
  assert.equal(r.ht, euros('700,00 €'));
  assert.equal(r.remise, euros('35,00 €'));
  assert.equal(r.htApresRemise, euros('665,00 €'));
  assert.equal(r.ttc, euros('798,00 €'));
  assert.equal(r.acompte, euros('239,40 €'));
  assert.equal(r.reste, euros('558,60 €'));
});

test('demi-centimes arrondis vers le haut : remise, TVA 10 %, acompte, chacun une fois', () => {
  // HT 0,05 ; remise 10 % = 0,005 → 0,01 ; HT après remise 0,04 ; TVA 10 % de 0,04 = 0,004 → 0,00
  let r = afficherTout([{ quantite: '1', prix: '0,05' }], 10, '10', '50');
  assert.equal(r.remise, euros('0,01 €'));
  assert.equal(r.htApresRemise, euros('0,04 €'));
  assert.equal(r.tva, euros('0,00 €'));
  assert.equal(r.ttc, euros('0,04 €'));
  assert.equal(r.acompte, euros('0,02 €'));
  // TTC 0,05 (TVA 0 %), acompte 50 % = 0,025 → 0,03, reste 0,02
  r = afficherTout([{ quantite: '1', prix: '0,05' }], 0, '0', '50');
  assert.equal(r.acompte, euros('0,03 €'));
  assert.equal(r.reste, euros('0,02 €'));
  // HT 0,15 ; TVA 10 % = 0,015 → 0,02
  r = afficherTout([{ quantite: '1', prix: '0,15' }], 10, '0', '0');
  assert.equal(r.tva, euros('0,02 €'));
  assert.equal(r.ttc, euros('0,17 €'));
});

test('remise et acompte en pourcentage décimal, bornés de 0 à 100', () => {
  const r = afficherTout([{ quantite: '1', prix: '1000' }], 20, '12,5', '100');
  assert.equal(r.remise, euros('125,00 €'));
  assert.equal(r.ttc, euros('1 050,00 €'));
  assert.equal(r.acompte, euros('1 050,00 €'));
  assert.equal(r.reste, euros('0,00 €'));
  assert.equal(afficherTout([{ quantite: '1', prix: '1000' }], 20, '100', '0').ttc, euros('0,00 €'));
  assert.equal(Calc.lirePourcentage('100'), 10000);
  assert.equal(Calc.lirePourcentage('12,5'), 1250);
  assert.equal(Calc.lirePourcentage(''), 0);
  for (const refuse of ['101', '-5', '10,125', 'abc']) assert.equal(Calc.lirePourcentage(refuse), null, refuse);
});
