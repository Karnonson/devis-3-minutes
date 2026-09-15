// Calculs du devis, en centimes entiers. Utilisé par la page et par `node --test`.
(function (racine) {
  'use strict';

  // « 2 », « 0,5 », « 1 800,00 » ou « 450.5 » → centièmes entiers ; sinon null.
  function lireCentiemes(texte) {
    const t = String(texte == null ? '' : texte).replace(/[\s  ]/g, '').replace(',', '.');
    const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(t);
    if (!m) return null;
    return Number(m[1]) * 100 + Number((m[2] || '').padEnd(2, '0'));
  }

  // n / d arrondi au plus proche, demi vers le haut (n ≥ 0).
  function diviserArrondi(n, d) {
    return Math.floor((2 * n + d) / (2 * d));
  }

  // Total d'une ligne en centimes : quantité (centièmes) × prix (centimes) / 100.
  function totalLigne(ligne) {
    const q = lireCentiemes(ligne.quantite);
    const p = lireCentiemes(ligne.prix);
    if (q === null || p === null) return 0;
    return diviserArrondi(q * p, 100);
  }

  function totaux(lignes, tauxTva) {
    const parLigne = lignes.map(totalLigne);
    const ht = parLigne.reduce((a, b) => a + b, 0);
    const tva = diviserArrondi(ht * tauxTva, 100);
    return { lignes: parLigne, ht: ht, tva: tva, ttc: ht + tva };
  }

  // 180000 → « 1 800,00 € » (espaces insécables).
  function formatEuros(centimes) {
    const signe = centimes < 0 ? '-' : '';
    const abs = Math.abs(centimes);
    const entiers = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const cents = String(abs % 100).padStart(2, '0');
    return signe + entiers + ',' + cents + ' €';
  }

  const api = { lireCentiemes: lireCentiemes, totalLigne: totalLigne, totaux: totaux, formatEuros: formatEuros };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else racine.Calc = api;
})(this);
