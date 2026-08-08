#!/usr/bin/env node
/**
 * Publishes masslegalhelp/ as the root of a separate deploy repository, the one
 * the MassLegalHelp vendor gets access to.
 *
 *   node scripts/publish-mlh.js --check     guards only, changes nothing
 *   node scripts/publish-mlh.js             guards, then split the branch
 *
 * Why a git subtree split rather than copying files: the split branch has this
 * folder at its root and keeps its real history, so the folder stays the single
 * source of truth and there is no second copy to drift. Publishing again is the
 * same command.
 *
 * This never pushes. It prints the push command and stops, because pushing sends
 * code to a remote someone else can read and that should be a person's decision,
 * not a script's side effect.
 *
 * Why a separate repo at all: the vendor is an outside developer team. The MLRI
 * repository holds other prototypes and the password-gate configuration, and
 * handing over the whole thing to get one static tool deployed is more access
 * than the job needs.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PREFIX = 'masslegalhelp';
const DIR = path.join(ROOT, PREFIX);
const LOGIC = 'snap-screening-logic.js';
const TOOL_INDEX = 'index.html';
const SHIP_HTML = 'snap-abawd/index.html';

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const branch = (args.find(a => a.startsWith('--branch=')) || '--branch=mlh-deploy').split('=')[1];

const problems = [];
const notes = [];
const reviewOnlyPaths = [];

function git(...a) {
  return execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
}

/* Walk the folder once; several guards need the same file list. */
function walk(dir, base) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    const rel = base ? base + '/' + entry.name : entry.name;
    if (entry.isDirectory()) out.push(...walk(abs, rel));
    else out.push({ rel, abs });
  }
  return out;
}

if (!fs.existsSync(DIR)) {
  console.error(PREFIX + '/ does not exist.');
  process.exit(1);
}
const files = walk(DIR, '');
const textFiles = files.filter(f => /\.(html|js|css|md)$/.test(f.rel));

/* ---- Guard: nothing but web assets in the deploy root ----
 *
 * masslegalhelp/ is split out and published, so anything sitting in it becomes a public URL.
 * On 2026-08-07 two MLRI advocacy guide PDFs were dropped into masslegalhelp/reference/ as
 * working material and the deploy went from 8 files and 263KB to 10 and 1227KB. Every existing
 * guard passed: they look for broken paths and missing entry points, not for files that have no
 * business being here at all. Nothing was published, but only because nobody ran the split.
 *
 * An allowlist rather than a blocklist. The question worth asking is "is this a web asset the
 * screener needs", and a list of what belongs answers it for file types nobody has thought of
 * yet. Reference material, notes, drafts and exports live outside masslegalhelp/; reference/ at
 * the repository root is where those two PDFs went. */
const DEPLOY_EXTENSIONS = ['html', 'js', 'css', 'svg', 'woff2', 'md'];
for (const f of files) {
  const ext = (f.rel.split('.').pop() || '').toLowerCase();
  if (DEPLOY_EXTENSIONS.indexOf(ext) === -1) {
    problems.push(
      f.rel + ' is not a web asset and would be published at a public URL. '
      + PREFIX + '/ only carries ' + DEPLOY_EXTENSIONS.join(', ') + '. '
      + 'Reference material and working files belong outside it, such as reference/ at the repository root.'
    );
  }
}

/* ---- Guard: the tool entry points exist ---- */
if (!files.some(f => f.rel === TOOL_INDEX)) {
  problems.push('No ' + TOOL_INDEX + ' in ' + PREFIX + '/. The public tools index lives at /.');
}
if (!files.some(f => f.rel === SHIP_HTML)) {
  problems.push('No ' + SHIP_HTML + ' in ' + PREFIX + '/. The SNAP screener lives at /snap-abawd/.');
}

/* ---- Guard: the logic module is present ----
 * This used to compare this copy against court-forms/snap-screening-logic.js,
 * because there were two builds and a reviewer could approve one while the public
 * got the other. court-forms/ was archived on 2026-07-30, so there is now one copy
 * and drift is impossible rather than merely detected. The archived pages keep
 * their own frozen snapshot, which is meant to diverge and is not checked. */
const here = path.join(DIR, LOGIC);
if (!fs.existsSync(here)) {
  problems.push(LOGIC + ' is missing. The page cannot decide anything without it.');
}

/* Strip HTML and CSS comments before scanning for references.
 *
 * A commented-out rule is not a reference. This build deliberately carries two of
 * them: a Domine @font-face and a wordmark <img>, both parked until their asset
 * files exist, both commented rather than deleted so enabling them is uncommenting
 * rather than rewriting. Scanning raw text reported those as broken links and would
 * have blocked publishing over code that does not run.
 *
 * Third time this distinction has come up in one day. check-pages.js learned it for
 * CSS class names, and the localStorage guard in render-smoke.test.js learned it for
 * a comment explaining what the code avoids. The rule generalises: prose about a
 * thing, or a disabled copy of it, is not a use of it. */
const live = src => src
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '');

/* Every URL an HTML file points at, from src, href and srcset.
 *
 * srcset was not scanned until 2026-08-07, when a <picture> arrived in the top bar to swap the
 * wordmark for a tagline-less one on phones. Both guards below read src and href only, so a
 * srcset pointing at a file that does not exist, or at a parent path outside the deploy root,
 * would have passed every check and 404'd in production. That is precisely the failure this
 * script exists to catch, so the hole was worth closing before using the attribute.
 *
 * srcset is a comma-separated list and each entry may carry a descriptor, "logo.svg 2x". The
 * URL is the first whitespace-delimited token of each entry. */
function urlsIn(src) {
  const out = [];
  for (const m of src.matchAll(/\b(src|srcset|href)="([^"]+)"/g)) {
    if (m[1] === 'srcset') {
      for (const entry of m[2].split(',')) {
        const url = entry.trim().split(/\s+/)[0];
        if (url) out.push(url);
      }
    } else {
      out.push(m[2]);
    }
  }
  return out;
}

/* ---- Guard: nothing reaches outside the folder ----
 * At the deploy root there is no parent, so a ../ reference or a rooted path is
 * a 404 in production that works fine in the preview site. This is the failure
 * most likely to survive review. */
for (const f of textFiles) {
  const src = live(fs.readFileSync(f.abs, 'utf8'));
  for (const url of urlsIn(src)) {
    if (url.startsWith('../')) {
      const target = path.normalize(path.join(path.dirname(f.abs), url.split(/[?#]/)[0]));
      if (!(target === DIR || target.startsWith(DIR + path.sep))) {
        problems.push(f.rel + ' references a parent path outside ' + PREFIX + '/: ' + url);
      }
    }
    else if (url.startsWith('/')) problems.push(f.rel + ' references a rooted path: ' + url + '. Use a relative path so the tool works at any subpath.');
  }
  for (const m of src.matchAll(/\]\((\.\.\/[^)]+)\)/g)) {
    problems.push(f.rel + ' has a markdown link to a parent path: ' + m[1]);
  }

  /* Parent paths in JS strings, which the attribute scan above cannot see.
   *
   * This hole was found on 2026-07-30 while adding a review-only link back to
   * /screener/. The attribute scan catches href="../screener/" and misses
   * const HOME = '../screener/' entirely, so the easy way to add that link would
   * have been to hide the path in a const and let the guard sail past it. Closing
   * the hole is better than using it.
   *
   * One documented exception, marked `review-only` on the same line. It exists
   * because a link that renders only on a review host cannot 404 in production,
   * which is the failure this guard is for. The marker has to be visible in the
   * source, and the gate that makes it true is asserted separately below.
   *
   * The test applied is the one the attribute scan above already uses: resolve
   * the path, and refuse it only if it lands outside the folder. Until the email
   * endpoint arrived this scan refused every ../ outright, which is stricter than
   * the failure it exists for. fetch('../api/email') from snap-abawd/ resolves to
   * <root>/api/email, correct at any deploy subpath; the rooted '/api/email'
   * is the one that breaks, and line 116 catches that.
   *
   * It read '../../api/email' until 2026-08-08, which was right while the screener
   * sat at tools/snap-abawd/ and wrong the moment the tools/ wrapper came off. The
   * rename sweep that day rewrote the directory name in this sentence and left the
   * ../ count beside it, so the comment described a path that resolves above the
   * deploy root. The guard would have refused it, correctly, while this text told
   * somebody to write it. Resolving rather than
   * banning also avoids the workaround this comment warns against, since a
   * computed endpoint URL would pass a literal-only scan and read as evasion.
   *
   * Unlike the html/css pass below, an inside-folder path found here is not
   * checked against disk. It cannot be: a Pages Function route answers at
   * <root>/api/email with no file of that name. So this guard is narrower than
   * the attribute one by necessity, and a typo'd fetch path is on review. */
  for (const line of src.split('\n')) {
    if (!/['"`]\.\.\//.test(line)) continue;
    if (/(?:src|href)=["']\.\.\//.test(line)) continue;
    if (/review-only/.test(line)) {
      reviewOnlyPaths.push(f.rel);
      continue;
    }
    for (const m of line.matchAll(/['"`](\.\.\/[^'"`]*)['"`]/g)) {
      const target = path.normalize(path.join(path.dirname(f.abs), m[1].split(/[?#]/)[0]));
      if (target === DIR || target.startsWith(DIR + path.sep)) continue;
      problems.push(f.rel + ' holds a parent path in a string that leaves ' + PREFIX + '/: '
        + line.trim().slice(0, 70)
        + '. It would 404 at the deploy root. Gate it on samplesAllowed() and mark the'
        + ' line review-only, or drop it.');
    }
  }
}

/* A review-only exception is only honest if something actually restricts it. */
if (reviewOnlyPaths.length && !/function samplesAllowed/.test(
  fs.readFileSync(path.join(DIR, SHIP_HTML), 'utf8'))) {
  problems.push('a review-only parent path is present but samplesAllowed() is not, so'
    + ' nothing stops it rendering in production: ' + [...new Set(reviewOnlyPaths)].join(', '));
}

/* ---- Guard: local references resolve on disk ---- */
for (const f of textFiles.filter(f => f.rel.endsWith('.html') || f.rel.endsWith('.css'))) {
  const src = live(fs.readFileSync(f.abs, 'utf8'));
  const refs = [
    ...urlsIn(src),
    ...[...src.matchAll(/url\(([^)]+)\)/g)].map(m => m[1].replace(/['"]/g, ''))
  ];
  for (const url of refs) {
    /* Absolute URI schemes are somebody else's to resolve. `tel:` joined this list
       when the no-script fallback added the DTA Assistance Line: the guard read
       `tel:8773822363` as a relative path and refused to publish a working phone
       link. The guard is looking for parent-relative and rooted paths that 404 at
       the deploy root, and a URI scheme is neither. */
    if (/^(https?:|mailto:|tel:|sms:|data:|#|\$\{)/.test(url)) continue;
    const target = path.join(path.dirname(f.abs), url.split(/[?#]/)[0]);
    if (!fs.existsSync(target)) problems.push(f.rel + ' references a file that is not here: ' + url);
  }
}

/* ---- Guard: preview-only machinery is absent ----
 * Each of these is something the preview build carries deliberately and the
 * public build must not. See masslegalhelp/README.md for the reasoning. */
const BANNED = [
  { re: /sw-register\.js|serviceWorker/, what: 'a service worker registration' },
  { re: /SITE_PASSWORD|WWW-Authenticate/, what: 'password-gate code' }
];
for (const f of textFiles) {
  const src = fs.readFileSync(f.abs, 'utf8');
  for (const b of BANNED) {
    // The README describes what was removed, so prose mentions are expected.
    if (f.rel.endsWith('.md')) continue;
    if (b.re.test(src)) problems.push(f.rel + ' still contains ' + b.what + '. It must not ship.');
  }
}
/* A functions/ directory was refused outright until the email endpoint needed
 * one. The hazard was never the directory: it was the repo root's
 * functions/_middleware.js, an HTTP Basic gate for the preview site that
 * Cloudflare Pages picks up automatically and runs on every request, so a copy
 * landing here would put the public tool behind a password. So the ban narrowed
 * to the file that carries the hazard rather than the directory that happens to
 * hold it. What makes narrowing safe rather than a hole is that the gate is
 * already caught independently by the SITE_PASSWORD/WWW-Authenticate scan above:
 * two guards would have to miss it, not one. */
const fnDir = path.join(DIR, 'functions');
if (fs.existsSync(fnDir)) {
  const stack = [fnDir];
  while (stack.length) {
    const dir = stack.pop();
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(abs);
      else if (/^_middleware\.(js|ts)$/.test(ent.name)) {
        problems.push(path.relative(DIR, abs).split(path.sep).join('/')
          + ' is Pages middleware. Cloudflare Pages runs it on every request to the deploy'
          + ' root, which is the route by which the preview password gate would reach the'
          + ' public tool. Put endpoint code in its own route file instead.');
      }
    }
  }
}

/* ---- Guard: sample mode, if present, is gated to review hosts ----
 * This used to ban ?sample= from the shipping build outright. The team reviews
 * every result screen before launch, and reaching the good-cause screen honestly
 * means answering through four groups, so the mode earns its place. What it must
 * not do is work in front of the public, where a shared URL would show a reader a
 * result that is not theirs. So the ban became a requirement that it be gated. */
const shipHtml = fs.readFileSync(path.join(DIR, SHIP_HTML), 'utf8');
if (/function applySampleFromURL/.test(shipHtml)) {
  if (!/function samplesAllowed/.test(shipHtml)) {
    problems.push(SHIP_HTML + ' has ?sample= mode with no samplesAllowed() host gate, so the demo would be live in production.');
  }
  const fn = /function applySampleFromURL\(\)\{[\s\S]*?\n\}/.exec(shipHtml);
  if (fn && !/^\s*if\(!samplesAllowed\(\)\) return false;/m.test(fn[0])) {
    problems.push('applySampleFromURL does not bail out on samplesAllowed() as its first act, so the host gate can be bypassed.');
  }
  const hosts = /const SAMPLE_HOSTS = \[([^\]]*)\]/.exec(shipHtml);
  if (hosts && /masslegalhelp/.test(hosts[1])) {
    problems.push('SAMPLE_HOSTS includes a masslegalhelp host. That puts the demo mode in front of real users.');
  }
}

/* ---- Notes, not failures ---- */
const bytes = files.reduce((n, f) => n + fs.statSync(f.abs).size, 0);
notes.push(files.length + ' files, ' + Math.round(bytes / 1024) + 'KB');
/* A note naming the Quick exit destination was here, and it was the last unanswered item this
 * script reported before a publish. MLRI replaced that control with a Learn More link on
 * 2026-08-07, so there is no neutral-site question left to confirm. */

/* ---- Report ---- */
console.log('Publishing ' + PREFIX + '/ as a deploy repository root.\n');
for (const n of notes) console.log('  note: ' + n);
console.log('');

if (problems.length) {
  console.error('Refusing to publish. ' + problems.length + ' problem(s):\n');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log('All guards passed.\n');

if (checkOnly) {
  console.log('--check given, stopping before the split.');
  process.exit(0);
}

/* ---- The split needs committed history ---- */
const dirty = git('status', '--porcelain', '--', PREFIX);
if (dirty) {
  console.error('Commit your changes in ' + PREFIX + '/ first. A subtree split reads committed');
  console.error('history, so anything uncommitted would be left out of the published branch:\n');
  console.error(dirty);
  process.exit(1);
}

/* The probe's own stderr is swallowed. `rev-parse --verify` on a branch that does not exist yet
 * prints "fatal: Needed a single revision" before the catch below handles it, so the very first
 * publish, and every publish after the branch is cleaned up, printed a line reading `fatal:` in
 * the middle of an otherwise successful run. On launch day that reads as a failed deploy. */
try {
  execFileSync('git', ['rev-parse', '--verify', branch], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  git('branch', '-D', branch);
} catch (e) { /* no old branch */ }
git('subtree', 'split', '--prefix=' + PREFIX, '-b', branch);

console.log('Split into local branch: ' + branch);
console.log('Its root is the contents of ' + PREFIX + '/, with history.\n');
console.log('Nothing has been pushed. To publish, create the deploy repo, then:\n');
console.log('  git remote add mlh-deploy <url of the new repo>   # first time only');
console.log('  git push mlh-deploy ' + branch + ':main\n');
console.log('To publish again later, re-run this script and repeat the push.');
