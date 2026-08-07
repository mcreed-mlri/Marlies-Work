#!/usr/bin/env node
'use strict';

/* Fast structural checks on the shipped pages. Runs in CI and is worth running
 * by hand before a deploy: `node scripts/check-pages.js`
 *
 * These are the failure modes that have actually bitten this project:
 *
 *   1. An inline <script> that does not parse. The whole page then renders
 *      nothing, and because these are static files there is no build step that
 *      would have told anyone.
 *   2. Mojibake or a lost character from an editor or a bulk find-and-replace
 *      writing the wrong encoding. The pages carry arrows, checkmarks, and
 *      curly punctuation, so a bad round-trip is silent but visible to users.
 *   3. A stylesheet class used in markup but never defined, which falls back to
 *      browser defaults and quietly drops off the type scale.
 *
 * Deliberately not a linter. It has no dependencies and no config, so it cannot
 * drift out of date or block a deploy over style. */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PAGE_GLOBS = [
  'masslegalhelp',
  'masslegalhelp/tools',
  'masslegalhelp/tools/snap',
  'screener',
  '.'
];

function htmlFilesIn(dir) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(dir, f));
}

const files = [...new Set(PAGE_GLOBS.flatMap(htmlFilesIn))].sort();

let failures = 0;
let fileFailed = false;
const fail = (file, msg) => { failures++; fileFailed = true; console.error('FAIL  ' + file + ': ' + msg); };

for (const rel of files) {
  fileFailed = false;
  const abs = path.join(ROOT, rel);
  const buf = fs.readFileSync(abs);
  const text = buf.toString('utf8');

  /* 1. Encoding: a strict UTF-8 round-trip must reproduce the exact bytes. */
  if (!Buffer.from(text, 'utf8').equals(buf)) {
    fail(rel, 'not valid UTF-8. A tool wrote it in another encoding.');
  }
  if (text.includes('�')) {
    fail(rel, 'contains U+FFFD replacement characters, so a character was lost.');
  }
  const mojibake = text.match(/â€[-¿]|â†|Ã¢|Â©|Â /g);
  if (mojibake) {
    fail(rel, 'looks like mojibake (' + [...new Set(mojibake)].join(' ') + '). '
      + 'UTF-8 bytes were probably read as Latin-1 and written back.');
  }

  /* 2. Every inline <script> must parse. */
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, block = 0;
  while ((m = re.exec(text)) !== null) {
    block++;
    const startLine = text.slice(0, m.index).split('\n').length;
    try {
      new vm.Script(m[1], { filename: rel });
    } catch (e) {
      fail(rel, 'inline script block ' + block + ' (from line ' + startLine + ') '
        + 'does not parse: ' + e.message);
    }
  }

  /* 3. Class names used in markup should exist in the page's own stylesheet.
   * Only checks the page's <style> blocks, so a class from an external sheet is
   * reported. Kept to the hand-rolled `h*`/`btn-*`/`opt-*` families this
   * project uses rather than every class, to stay quiet and useful. */
  const styles = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(s => s[1]).join('\n');
  if (styles) {
    /* Strip CSS comments before harvesting selectors. The same rule the `used`
     * side already follows: prose about a class is not a definition of it. A
     * comment reading "`.mono` was used with no rule behind it" was enough to
     * register `.mono` as defined and hide exactly the bug it described, and a
     * commented-out rule is genuinely not defined either. */
    const rules = styles.replace(/\/\*[\s\S]*?\*\//g, '');
    const defined = new Set();
    for (const d of rules.matchAll(/\.([a-zA-Z][\w-]*)/g)) defined.add(d[1]);
    /* The screener families, then the shell families used by index.html and
     * screener/index.html. The shell half was missing, so of the ~17 classes on
     * screener/index.html only `lead` was ever checked, and `.mono` shipped with
     * no rule behind it while this script reported ok. Those pages carry a comment
     * saying their tokens are duplicated rather than shared precisely to keep this
     * check alive; that was only true for one class. */
    /* flow, build, pick and wrote joined the list with the letter-writing
     * diagram on screener/how-it-works.html. A family absent from here is not
     * checked at all, which is the failure this comment already describes, so
     * adding the rules without adding the prefix would have left the new half
     * of that page as unverified as `.mono` once was. */
    const interesting = /^(h\d|h-|btn-|opt-|card-|result-|q-|hint-|form-|facts-|fact-|topbar|brand|sr-only|no-print|fade|card-in|lead|icon-|mono|kicker|wrap|back|section|list|entry|badge|body|titlerow|tag|go|docs|panel|row|tool|foot|actions|theme-toggle|flow|build|pick|wrote|decision-|exempt-|outcome|matrix|toc|note)/;
    const used = new Set();
    /* Scan markup only. A class name mentioned inside a <style> block or an HTML
     * comment is prose about the CSS, not a use of it. */
    const markup = text
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    for (const u of markup.matchAll(/class="([^"${]*)"/g)) {
      for (const c of u[1].trim().split(/\s+/)) if (c && interesting.test(c)) used.add(c);
    }
    const missing = [...used].filter(c => !defined.has(c));
    if (missing.length) {
      fail(rel, 'uses undefined CSS class(es): ' + missing.join(', ')
        + '. These silently fall back to browser defaults.');
    }
  }

  if (!fileFailed) console.log('ok    ' + rel);
}

/* 4. The service worker must not precache HTML or JS. Those are network-first on
 * purpose so a deploy reaches users without a hard refresh; precaching them
 * would pin visitors to a stale build. */
const swPath = path.join(ROOT, 'sw.js');
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath, 'utf8');
  const precache = /const PRECACHE\s*=\s*\[([\s\S]*?)\]/.exec(sw);
  if (precache && /\.(?:html?|js|css)['"]/.test(precache[1])) {
    fail('sw.js', 'PRECACHE lists an HTML, JS, or CSS file. Those must stay '
      + 'network-first or users get pinned to a stale build.');
  } else {
    console.log('ok    sw.js');
  }
}

if (failures) {
  console.error('\n' + failures + ' problem(s) found.');
  process.exit(1);
}
console.log('\nAll page checks passed (' + files.length + ' html file(s)).');
