'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = function (file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
};

test('homepage game cards point to real game pages and expose searchable categories', function () {
  const html = read('index.html');
  const routes = Array.from(html.matchAll(/href=["']\.\/(games\/[^"']+)["']/g), function (match) {
    return match[1];
  });
  assert.deepEqual(routes.sort(), [
    'games/ludo.html',
    'games/memory-match.html',
    'games/snake.html',
    'games/tic-tac-toe.html'
  ]);
  routes.forEach(function (route) {
    assert.equal(fs.existsSync(path.join(root, route)), true, route + ' must exist');
  });
  ['puzzle', 'classic', 'arcade'].forEach(function (category) {
    assert.match(html, new RegExp('data-filter="' + category + '"'));
  });
  assert.match(html, /id="gameSearch"/);
  assert.match(html, /id="menuBtn"[^>]*aria-expanded="false"/);
  assert.match(read('assets/site.js'), /setMenuOpen/);
});

test('service worker precaches all game dependencies and the privacy route', function () {
  const sw = read('sw.js');
  const match = sw.match(/const CORE=\[([^\]]+)\];/);
  assert.ok(match, 'CORE precache list must exist');
  const cached = Array.from(match[1].matchAll(/'([^']+)'/g), function (item) {
    return item[1];
  });
  [
    './',
    './index.html',
    './privacy.html',
    './manifest.webmanifest',
    './assets/site.css',
    './assets/site.js',
    './assets/ludo.css',
    './assets/ludo-engine.js',
    './assets/ludo.js',
    './games/tic-tac-toe.html',
    './games/snake.html',
    './games/memory-match.html',
    './games/ludo.html'
  ].forEach(function (required) {
    assert.ok(cached.includes(required), required + ' must be cached');
    assert.equal(fs.existsSync(path.join(root, required.replace(/^\.\//, ''))), true, required + ' must exist');
  });
  assert.match(sw, /desiplay-shell-v4/);
});

test('PWA manifest is valid and scoped to the project root', function () {
  const manifest = JSON.parse(read('manifest.webmanifest'));
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length > 0);
});

test('Ludo page loads its rules engine before the UI and all six lane cells are rendered', function () {
  const html = read('games/ludo.html');
  assert.ok(html.indexOf('../assets/ludo-engine.js') < html.indexOf('../assets/ludo.js'));
  assert.match(html, /\.\.\/assets\/ludo\.css/);
  const ui = read('assets/ludo.js');
  assert.match(ui, /progress >= 52 && progress <= 57/);
  assert.match(ui, /progress === 58/);
  assert.match(ui, /progress === 58;\s*}\)\.length/);
});

test('game pages include mobile viewport metadata and the Memory Match restart timer is cancellable', function () {
  ['games/tic-tac-toe.html', 'games/snake.html', 'games/memory-match.html', 'games/ludo.html'].forEach(function (file) {
    assert.match(read(file), /name="viewport"/, file + ' must define a viewport');
  });
  const memory = read('games/memory-match.html');
  assert.match(memory, /clearTimeout\(mismatchTimer\)/);
  assert.match(memory, /mismatchTimer=setTimeout/);
});

test('score storage failures do not prevent Snake and Tic Tac Toe from starting', function () {
  assert.match(read('games/snake.html'), /function readBest\(\).*catch/s);
  assert.match(read('games/snake.html'), /function saveBest\(value\).*catch/s);
  assert.match(read('games/tic-tac-toe.html'), /function readScore\(\).*catch/s);
  assert.match(read('games/tic-tac-toe.html'), /function save\(\).*catch/s);
});
