/* Loads the game's browser modules under Node by making `window` and the
   global object the same thing, which is what a browser actually does. */
const fs = require('fs'), path = require('path'), vm = require('vm');

const FILES = ['skills', 'coach', 'videos', 'accolades', 'audio',
               'fx', 'stage', 'character', 'levels', 'game'];

function load(extra) {
  const sandbox = {
    console, Math, Date, JSON, Object, Array, String, Number, Boolean,
    isFinite, parseInt, parseFloat, setTimeout, clearTimeout,
    setInterval, clearInterval, Float32Array, Error,
    performance: { now: () => Date.now() },
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    devicePixelRatio: 1,
    localStorage: (() => { const m = {}; return {
      getItem: k => (k in m ? m[k] : null),
      setItem: (k, v) => { m[k] = String(v); },
      removeItem: k => { delete m[k]; }
    }; })()
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
