// Pilote Chrome sans fenêtre depuis Node.js, sans bibliothèque : protocole des outils de développement
// de Chrome, parlé par le WebSocket intégré à Node. Clics souris et frappes clavier réels.
'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function attendre(condition, message, delai = 5000) {
  const fin = Date.now() + delai;
  for (;;) {
    const r = await condition();
    if (r) return r;
    if (Date.now() > fin) throw new Error('Délai dépassé : ' + (typeof message === 'function' ? message() : message));
    await pause(50);
  }
}

// Lance Chrome sur un profil (dossier) donné. Un dossier neuf = une mémoire vide.
async function lancerChrome(profil) {
  fs.mkdirSync(profil, { recursive: true });
  const fichierPort = path.join(profil, 'DevToolsActivePort');
  fs.rmSync(fichierPort, { force: true });
  const proc = spawn('google-chrome', [
    '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profil,
    '--no-first-run', '--no-default-browser-check', '--window-size=1400,1000', 'about:blank',
  ], { stdio: 'ignore' });
  const contenu = await attendre(() => {
    try { const t = fs.readFileSync(fichierPort, 'utf8'); return t.includes('\n') ? t : null; } catch { return null; }
  }, 'démarrage de Chrome', 20000);
  const [port, chemin] = contenu.trim().split('\n');
  const ws = new WebSocket('ws://127.0.0.1:' + port + chemin);
  await new Promise((ok, ko) => { ws.onopen = ok; ws.onerror = ko; });
  return new Navigateur(ws, proc);
}

class Navigateur {
  constructor(ws, proc) {
    this.ws = ws;
    this.proc = proc;
    this.suivant = 1;
    this.enAttente = new Map();
    this.ecouteurs = [];
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.enAttente.has(msg.id)) {
        const { ok, ko } = this.enAttente.get(msg.id);
        this.enAttente.delete(msg.id);
        if (msg.error) ko(new Error(msg.error.message)); else ok(msg.result);
      } else if (msg.method) {
        this.ecouteurs.forEach((e) => { if (e.methode === msg.method && e.session === msg.sessionId) e.fn(msg.params); });
      }
    };
  }

  envoyer(method, params = {}, sessionId) {
    const id = this.suivant++;
    const msg = { id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    return new Promise((ok, ko) => {
      this.enAttente.set(id, { ok, ko });
      this.ws.send(JSON.stringify(msg));
    });
  }

  ecouter(methode, session, fn) { this.ecouteurs.push({ methode, session, fn }); }

  // Onglet du profil ; avec prive = true, dans un contexte séparé comme une fenêtre de navigation privée.
  async onglet(prive = false) {
    const cible = { url: 'about:blank' };
    if (prive) cible.browserContextId = (await this.envoyer('Target.createBrowserContext')).browserContextId;
    const { targetId } = await this.envoyer('Target.createTarget', cible);
    const { sessionId } = await this.envoyer('Target.attachToTarget', { targetId, flatten: true });
    const o = new Onglet(this, sessionId, targetId);
    await o.envoyer('Page.enable');
    await o.envoyer('Runtime.enable');
    return o;
  }

  async fermer() {
    const fin = new Promise((r) => this.proc.once('exit', r));
    try { await this.envoyer('Browser.close'); } catch { /* déjà fermé */ }
    await Promise.race([fin, pause(10000)]);
    if (this.proc.exitCode === null) this.proc.kill('SIGKILL');
  }
}

class Onglet {
  constructor(nav, session, targetId) {
    this.nav = nav;
    this.session = session;
    this.targetId = targetId;
    this.dialogues = [];
    this.erreurs = [];
    this.reponseDialogue = true;
    nav.ecouter('Runtime.exceptionThrown', session, (p) => {
      this.erreurs.push(p.exceptionDetails.exception ? p.exceptionDetails.exception.description : p.exceptionDetails.text);
    });
    nav.ecouter('Page.javascriptDialogOpening', session, (p) => {
      this.dialogues.push(p.message);
      this.envoyer('Page.handleJavaScriptDialog', { accept: this.reponseDialogue });
    });
  }

  envoyer(method, params) { return this.nav.envoyer(method, params, this.session); }

  fermer() { return this.nav.envoyer('Target.closeTarget', { targetId: this.targetId }); }

  async charger(action) {
    const charge = new Promise((r) => {
      const e = { methode: 'Page.loadEventFired', session: this.session, fn: () => { this.nav.ecouteurs.splice(this.nav.ecouteurs.indexOf(e), 1); r(); } };
      this.nav.ecouteurs.push(e);
    });
    await action();
    await charge;
  }

  aller(url) { return this.charger(() => this.envoyer('Page.navigate', { url })); }
  recharger() { return this.charger(() => this.envoyer('Page.reload')); }

  async evaluer(expression) {
    const r = await this.envoyer('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text);
    return r.result.value;
  }

  // Texte visible d'un élément (null s'il n'existe pas ou est caché), espaces insécables en espaces.
  texte(selecteur) {
    return this.evaluer(`(() => { const el = document.querySelector(${JSON.stringify(selecteur)});
      return el && el.offsetParent !== null ? el.innerText.replace(/[\\u00a0\\u202f]/g, ' ') : null; })()`);
  }

  visible(selecteur) { return this.texte(selecteur).then((t) => t !== null); }

  attendreTexte(selecteur, attendu, delai) {
    let dernier;
    return attendre(async () => {
      dernier = await this.texte(selecteur);
      return dernier !== null && (attendu instanceof RegExp ? attendu.test(dernier) : dernier.includes(attendu));
    }, () => `« ${attendu} » dans ${selecteur} (vu : ${JSON.stringify(dernier)})`, delai);
  }

  // Clic souris réel au centre de l'élément visible.
  async cliquer(selecteur) {
    await this.nav.envoyer('Target.activateTarget', { targetId: this.targetId }); // passer sur l'onglet
    const rect = await attendre(() => this.evaluer(`(() => { const el = document.querySelector(${JSON.stringify(selecteur)});
      if (!el || el.offsetParent === null) return null;
      el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`), 'élément visible ' + selecteur);
    const base = { x: rect.x, y: rect.y, button: 'left', clickCount: 1 };
    await this.envoyer('Input.dispatchMouseEvent', { type: 'mouseMoved', x: rect.x, y: rect.y });
    await this.envoyer('Input.dispatchMouseEvent', { type: 'mousePressed', ...base });
    await this.envoyer('Input.dispatchMouseEvent', { type: 'mouseReleased', ...base });
  }

  // Clique dans une case, sélectionne tout (Ctrl+A) et tape le texte à la place (texte vide : la case est vidée).
  async taper(selecteur, texte) {
    await this.cliquer(selecteur);
    const ctrlA = { key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2, commands: ['selectAll'] };
    await this.envoyer('Input.dispatchKeyEvent', { type: 'keyDown', ...ctrlA });
    await this.envoyer('Input.dispatchKeyEvent', { type: 'keyUp', ...ctrlA });
    if (texte === '') { // vider la case : touche Retour arrière sur la sélection
      const retour = { key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 };
      await this.envoyer('Input.dispatchKeyEvent', { type: 'keyDown', ...retour });
      await this.envoyer('Input.dispatchKeyEvent', { type: 'keyUp', ...retour });
    }
    for (const c of texte) {
      if (c === '\n') {
        const entree = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' };
        await this.envoyer('Input.dispatchKeyEvent', { type: 'keyDown', ...entree });
        await this.envoyer('Input.dispatchKeyEvent', { type: 'keyUp', ...entree });
      } else {
        await this.envoyer('Input.insertText', { text: c });
      }
    }
  }

  // Choisit une option d'un menu déroulant comme une personne : clic pour l'ouvrir, flèches jusqu'au libellé, Entrée.
  async choisir(selecteur, libelle) {
    const { cible, courant } = await this.evaluer(`(() => { const s = document.querySelector(${JSON.stringify(selecteur)});
      return { cible: [...s.options].findIndex((o) => o.text === ${JSON.stringify(libelle)}), courant: s.selectedIndex }; })()`);
    if (cible === -1) throw new Error('Option « ' + libelle + ' » absente de ' + selecteur);
    const ecart = cible - courant;
    await this.cliquer(selecteur);
    await pause(150); // ouverture du menu
    const fleche = ecart > 0 ? { key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40 } : { key: 'ArrowUp', code: 'ArrowUp', windowsVirtualKeyCode: 38 };
    for (let i = 0; i < Math.abs(ecart); i++) {
      await this.envoyer('Input.dispatchKeyEvent', { type: 'keyDown', ...fleche });
      await this.envoyer('Input.dispatchKeyEvent', { type: 'keyUp', ...fleche });
    }
    const entree = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 };
    await this.envoyer('Input.dispatchKeyEvent', { type: 'keyDown', ...entree });
    await this.envoyer('Input.dispatchKeyEvent', { type: 'keyUp', ...entree });
    await attendre(() => this.evaluer(`(() => { const s = document.querySelector(${JSON.stringify(selecteur)});
      return !!s && s.options[s.selectedIndex].text === ${JSON.stringify(libelle)}; })()`), 'option « ' + libelle + ' » choisie dans ' + selecteur);
  }

  // Frappe touche par touche dans la case qui a le curseur (chiffres d'une date : 06102026).
  async touches(texte) {
    for (const c of texte) {
      const k = { key: c, text: c, code: /\d/.test(c) ? 'Digit' + c : undefined, windowsVirtualKeyCode: c.toUpperCase().charCodeAt(0) };
      await this.envoyer('Input.dispatchKeyEvent', { type: 'keyDown', ...k });
      await this.envoyer('Input.dispatchKeyEvent', { type: 'keyUp', ...k });
    }
  }

  async capture(fichier) {
    const { data } = await this.envoyer('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(path.dirname(fichier), { recursive: true });
    fs.writeFileSync(fichier, Buffer.from(data, 'base64'));
  }
}

module.exports = { lancerChrome, attendre, pause };
