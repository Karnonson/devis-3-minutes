// Ce que le dépôt garantit hors de la page : le démarrage du conteneur ne retire jamais la page d'accueil,
// git refuse un fichier d'environnement, et la recherche de clés trouve une clé. Lancer : node --test tests/depot.test.js (environ 3 s)
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const RACINE = path.join(__dirname, '..');
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

test("aucun réglage du service n'arrête la page d'accueil", async () => {
  // Le script de démarrage du conteneur, joué sur un dossier à part au lieu du dossier de nginx.
  const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'devis-3-minutes-depot-'));
  try {
    fs.writeFileSync(path.join(dossier, 'index.html'), '<!doctype html><title>Devis</title>');
    fs.writeFileSync(path.join(dossier, 'settings.build'), 'build=none\naddress=none\n');
    const script = fs.readFileSync(path.join(RACINE, 'deploy', 'settings.sh'), 'utf8')
      .replaceAll('/usr/share/nginx/html', dossier);
    const joue = path.join(dossier, 'settings.sh');
    fs.writeFileSync(joue, script);
    const r = spawnSync('sh', [joue], {
      env: { PATH: process.env.PATH, TRIAL_BREAK_AFTER: '1', TRIAL_SETTING: 'essai', TRIAL_SECRET: 'abc' },
    });
    assert.equal(r.status, 0, String(r.stderr));
    await pause(2500); // plus que le délai donné à TRIAL_BREAK_AFTER
    assert.ok(fs.existsSync(path.join(dossier, 'index.html')), "la page d'accueil a été retirée");
    assert.equal(fs.readFileSync(path.join(dossier, 'settings'), 'utf8'),
      'build=none\naddress=none\nsetting=essai\nsecret=read, 3 characters\n');
  } finally {
    fs.rmSync(dossier, { recursive: true, force: true });
  }
});

test("git ignore .env et tout .env*, sauf .env.example", () => {
  const ignore = (nom) => spawnSync('git', ['-C', RACINE, 'check-ignore', '-q', '--no-index', nom]).status === 0;
  for (const nom of ['.env', '.env.local', '.env.production', 'sous-dossier/.env']) assert.ok(ignore(nom), nom);
  assert.ok(!ignore('.env.example'), '.env.example doit rester suivi');
  assert.ok(!ignore('index.html'), 'index.html doit rester suivi');
  assert.match(execFileSync('git', ['-C', RACINE, 'ls-files', '.gitignore'], { encoding: 'utf8' }), /\.gitignore/);
});

test("la recherche de clés refuse un commit qui en porte une, sans l'écrire, et laisse passer un commit propre", () => {
  // Un dépôt jetable ; la clé, inventée, n'est assemblée qu'ici, pour qu'aucun fichier suivi n'en ait la forme.
  const depot = fs.mkdtempSync(path.join(os.tmpdir(), 'devis-3-minutes-cles-'));
  const env = { PATH: process.env.PATH, HOME: depot, GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1' };
  const git = (...a) => execFileSync('git', ['-C', depot, '-c', 'user.name=Essai', '-c', 'user.email=essai@example.test',
    '-c', 'commit.gpgsign=false', ...a], { encoding: 'utf8', env }).trim();
  const cherche = (plage) => spawnSync('python3', [path.join(RACINE, '.github', 'secrets.py'), 'range', depot, plage],
    { encoding: 'utf8', env });
  try {
    git('init', '-q');
    fs.writeFileSync(path.join(depot, 'notes.txt'), 'début\n');
    git('add', '.'); git('commit', '-q', '-m', 'début');
    const debut = git('rev-parse', 'HEAD');
    fs.appendFileSync(path.join(depot, 'notes.txt'), 'une ligne sans clé\n');
    git('commit', '-q', '-am', 'propre');
    const propre = git('rev-parse', 'HEAD');

    const r0 = cherche(`${debut}..${propre}`);
    assert.equal(r0.status, 0, r0.stdout + r0.stderr);
    assert.equal(r0.stdout, '');

    const cle = 'AKIA' + 'EXAMPLE'.repeat(3).slice(0, 16);
    fs.writeFileSync(path.join(depot, 'config.txt'), `aws=${cle}\n`);
    git('add', '.'); git('commit', '-q', '-m', 'une clé');
    const fautif = git('rev-parse', 'HEAD');

    const r1 = cherche(`${propre}..${fautif}`);
    assert.equal(r1.status, 1, r1.stdout + r1.stderr);
    assert.ok(r1.stdout.includes(fautif.slice(0, 10)), `le commit n'est pas nommé : ${r1.stdout}`);
    assert.match(r1.stdout, /AWS key/);
    assert.ok(!(r1.stdout + r1.stderr).includes(cle), 'la valeur de la clé a été écrite');
  } finally {
    fs.rmSync(depot, { recursive: true, force: true });
  }
});
