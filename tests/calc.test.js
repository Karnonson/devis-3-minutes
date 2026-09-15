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
