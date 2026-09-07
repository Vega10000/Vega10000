/* Loads the browser modules under Node by making `window` and the global
   object the same object, which is what a browser actually does. */
const fs = require('fs'), path = require('path'), vm = require('vm');

const FILES = [
  'data/skills', 'data/coach', 'data/videos', 'data/science', 'data/shop',
  'data/rooms', 'data/districts',
  'engine/audio', 'engine/fx', 'engine/stage', 'engine/character',
  'systems/profile', 'systems/missions',
  'games/rhythm', 'games/minigames'
];

function load(extra) {
  const store = {};
  const sandbox = {
    console, Math, Date, JSON, Object, Array, String, Number, Boolean,
    isFinite, isNaN, parseInt, parseFloat, setTimeout, clearTimeout,
    setInterval, clearInterval, Float32Array, Error, RegExp,
    performance: { now: () => Date.now() },
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    devicePixelRatio: 1,
    localStorage: {
      getItem: k => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: k => { delete store[k]; }
    }
  };
  Object.assign(sandbox, extra || {});
  sandbox.window = sandbox;
  sandbox.global = sandbox;
  vm.createContext(sandbox);
  for (const f of FILES) {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', f + '.js'), 'utf8');
    vm.runInContext(src, sandbox, { filename: 'js/' + f + '.js' });
  }
  return sandbox;
}
module.exports = { load, FILES };
