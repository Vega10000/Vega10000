/* Builds the Claude Artifact version of the page from index.html.

   index.html is a complete standalone document on purpose — the whole point
   is that it runs from a double-clicked file. An Artifact is different: the
   host wraps the page you publish in its own <!doctype>/<head>/<body>, so a
   second full document nested inside that would be malformed.

   So this strips the document wrapper and keeps everything inside it. The
   <title>, <style> and <script> tags stay exactly where they were; css/ and
   js/ are published alongside and still resolve as relative paths.

   Dropped deliberately:
   - the viewport meta: the host supplies one, and ours carried
     user-scalable=no, which fights the game's own "Larger text" setting.
   - the preconnect to i.ytimg.com: the Artifact CSP blocks external images,
     so it would only cost a DNS lookup for nothing.

   Run:  node build-artifact.js   ->   build/artifact/index.html
*/
'use strict';

const fs = require('fs');
const path = require('path');

const root = __dirname;
const out = path.join(root, 'build', 'artifact');

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const drop = [
  /<!DOCTYPE html>\s*/i,
  /<html[^>]*>\s*/i,
  /<\/html>\s*/i,
  /<head>\s*/i,
  /<\/head>\s*/i,
  /<body>\s*/i,
  /<\/body>\s*/i,
  /<meta charset="utf-8">\s*/i,
  /<meta name="viewport"[^>]*>\s*/i,
  /<link rel="preconnect"[^>]*>\s*/i
];
drop.forEach(re => { html = html.replace(re, ''); });

/* \b matters: <header> must not read as <head>. */
if (/<\s*\/?\s*(?:html|head|body)\b|<!DOCTYPE/i.test(html)) {
  throw new Error('document wrapper survived the strip — check index.html');
}
if (!/<title>/i.test(html)) {
  throw new Error('no <title> left in the artifact page');
}

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html.trim() + '\n');

/* Report the file list the publish needs, so the two never drift apart. */
const assets = [];
const walk = d => fs.readdirSync(path.join(root, d), { withFileTypes: true })
  .forEach(e => e.isDirectory() ? walk(path.join(d, e.name))
                                : assets.push(path.join(d, e.name).split(path.sep).join('/')));
['css', 'js'].forEach(walk);

/* Every src/href the page asks for must be in that list. */
const refs = [...html.matchAll(/(?:src|href)="((?:css|js)\/[^"]+)"/g)].map(m => m[1]);
const missing = refs.filter(r => !assets.includes(r));
if (missing.length) throw new Error('referenced but not found: ' + missing.join(', '));

console.log(JSON.stringify({
  page: 'build/artifact/index.html',
  bytes: fs.statSync(path.join(out, 'index.html')).size,
  referenced: refs.length,
  assets
}, null, 2));
