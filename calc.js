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

  // Quantité tapée → centièmes, plus de 0 et deux décimales au plus (« 0,5 » → 50) ; sinon null.
  function lireQuantite(texte) {
    const q = lireCentiemes(texte);
    return q !== null && q > 0 ? q : null;
  }

  // Prix unitaire HT tapé → centimes, 0 ou plus et deux décimales au plus ; sinon null.
  function lirePrix(texte) {
    return lireCentiemes(texte);
  }

  // Total d'une ligne en centimes : quantité (centièmes) × prix (centimes) / 100.
  // Une quantité ou un prix refusé compte pour 0,00 €.
  function totalLigne(ligne) {
    const q = lireQuantite(ligne.quantite);
    const p = lirePrix(ligne.prix);
    if (q === null || p === null) return 0;
    return diviserArrondi(q * p, 100);
  }

  // Pourcentage tapé (« 10 », « 12,5 ») → centièmes de pour cent, de 0 à 10000 ; vide → 0 ; sinon null.
  function lirePourcentage(texte) {
    if (String(texte == null ? '' : texte).trim() === '') return 0;
    const p = lireCentiemes(texte);
    return p !== null && p <= 10000 ? p : null;
  }

  // Remise sur le HT, TVA sur le HT après remise, acompte sur le TTC : chacun calculé une fois,
  // arrondi au centime, demi-centime vers le haut. Un pourcentage illisible compte pour 0 %.
  function totaux(lignes, tauxTva, remisePct, acomptePct) {
    const parLigne = lignes.map(totalLigne);
    const ht = parLigne.reduce((a, b) => a + b, 0);
    const remise = diviserArrondi(ht * (lirePourcentage(remisePct) || 0), 10000);
    const htApresRemise = ht - remise;
    const tva = diviserArrondi(htApresRemise * (Number(tauxTva) || 0), 100);
    const ttc = htApresRemise + tva;
    const acompte = diviserArrondi(ttc * (lirePourcentage(acomptePct) || 0), 10000);
    return {
      lignes: parLigne, ht: ht, remise: remise, htApresRemise: htApresRemise,
      tva: tva, ttc: ttc, acompte: acompte, reste: ttc - acompte,
    };
  }

  // 1250 (centièmes) → « 12,5 » ; 1000 → « 10 ».
  function formatPourcentage(centiemes) {
    const entiers = Math.floor(centiemes / 100);
    const reste = centiemes % 100;
    return reste ? entiers + ',' + String(reste).padStart(2, '0').replace(/0$/, '') : String(entiers);
  }

  // 180000 → « 1 800,00 € » (espaces insécables).
  function formatEuros(centimes) {
    const signe = centimes < 0 ? '-' : '';
    const abs = Math.abs(centimes);
    const entiers = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const cents = String(abs % 100).padStart(2, '0');
    return signe + entiers + ',' + cents + ' €';
  }

  // Durée de validité tapée (« 30 ») → nombre de jours entier de 1 à 365 ; sinon null.
  function lireJours(texte) {
    const t = String(texte == null ? '' : texte).trim();
    return /^\d{1,3}$/.test(t) && Number(t) >= 1 && Number(t) <= 365 ? Number(t) : null;
  }

  // « 2026-09-15 » + 30 jours → « 2026-10-15 » (calendrier, sans heure ni fuseau).
  function ajouterJours(iso, jours) {
    const [a, m, j] = String(iso).split('-').map(Number);
    const d = new Date(Date.UTC(a, m - 1, j + jours));
    const deux = (n) => String(n).padStart(2, '0');
    return d.getUTCFullYear() + '-' + deux(d.getUTCMonth() + 1) + '-' + deux(d.getUTCDate());
  }

  const api = {
    lireCentiemes: lireCentiemes, lireQuantite: lireQuantite, lirePrix: lirePrix,
    lirePourcentage: lirePourcentage, totalLigne: totalLigne,
    totaux: totaux, formatEuros: formatEuros, formatPourcentage: formatPourcentage,
    lireJours: lireJours, ajouterJours: ajouterJours,
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else racine.Calc = api;
})(this);
