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

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const branch = (args.find(a => a.startsWith('--branch=')) || '--branch=mlh-deploy').split('=')[1];

const problems = [];
const notes = [];

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

/* ---- Guard: the entry point exists ---- */
if (!files.some(f => f.rel === 'index.html')) {
  problems.push('No index.html at the root of ' + PREFIX + '/. The deploy repo root is the site root.');
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

/* ---- Guard: nothing reaches outside the folder ----
 * At the deploy root there is no parent, so a ../ reference or a rooted path is
 * a 404 in production that works fine in the preview site. This is the failure
 * most likely to survive review. */
for (const f of textFiles) {
  const src = fs.readFileSync(f.abs, 'utf8');
  for (const m of src.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const url = m[1];
    if (url.startsWith('../')) problems.push(f.rel + ' references a parent path: ' + url);
    else if (url.startsWith('/')) problems.push(f.rel + ' references a rooted path: ' + url + '. Use a relative path so the tool works at any subpath.');
  }
  for (const m of src.matchAll(/\]\((\.\.\/[^)]+)\)/g)) {
    problems.push(f.rel + ' has a markdown link to a parent path: ' + m[1]);
  }
}

/* ---- Guard: local references resolve on disk ---- */
for (const f of textFiles.filter(f => f.rel.endsWith('.html') || f.rel.endsWith('.css'))) {
  const src = fs.readFileSync(f.abs, 'utf8');
  const refs = [
    ...[...src.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]),
    ...[...src.matchAll(/url\(([^)]+)\)/g)].map(m => m[1].replace(/['"]/g, ''))
  ];
  for (const url of refs) {
    if (/^(https?:|mailto:|data:|#|\$\{)/.test(url)) continue;
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
if (fs.existsSync(path.join(DIR, 'functions'))) {
  problems.push(PREFIX + '/functions/ exists. Cloudflare Pages would pick it up and could gate the public site.');
}

/* ---- Guard: sample mode, if present, is gated to review hosts ----
 * This used to ban ?sample= from the shipping build outright. The team reviews
 * every result screen before launch, and reaching the good-cause screen honestly
 * means answering through four groups, so the mode earns its place. What it must
 * not do is work in front of the public, where a shared URL would show a reader a
 * result that is not theirs. So the ban became a requirement that it be gated. */
const shipHtml = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');
if (/function applySampleFromURL/.test(shipHtml)) {
  if (!/function samplesAllowed/.test(shipHtml)) {
    problems.push('index.html has ?sample= mode with no samplesAllowed() host gate, so the demo would be live in production.');
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
const quickExit = /PRODUCTION_QUICK_EXIT_URL\s*=\s*'([^']+)'/.exec(fs.readFileSync(here, 'utf8'));
if (quickExit) notes.push('Quick exit currently goes to ' + quickExit[1] + '. Confirm that is intended.');

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

try { git('rev-parse', '--verify', branch); git('branch', '-D', branch); } catch (e) { /* no old branch */ }
git('subtree', 'split', '--prefix=' + PREFIX, '-b', branch);

console.log('Split into local branch: ' + branch);
console.log('Its root is the contents of ' + PREFIX + '/, with history.\n');
console.log('Nothing has been pushed. To publish, create the deploy repo, then:\n');
console.log('  git remote add mlh-deploy <url of the new repo>   # first time only');
console.log('  git push mlh-deploy ' + branch + ':main\n');
console.log('To publish again later, re-run this script and repeat the push.');
