'use strict';

/* Renders every screener page's inline script against a minimal DOM shim and
 * drives it through each result screen.
 *
 * This exists because `MLH_ABAWD_URL` survived in two pages as a reference to a
 * const that had been deleted, and nothing caught it. The unit tests only cover
 * snap-screening-logic.js, so a ReferenceError inside a page's own template
 * literal shipped silently and rendered a blank page: the initial render() call
 * throws, #stage is never written, and the visitor sees nothing at all.
 *
 * The shim is deliberately forgiving. getElementById hands back a stub for any
 * id so that gaps in the shim cannot masquerade as page bugs. What it is really
 * asserting is narrow but valuable: the script parses, every render path runs
 * without throwing, and each one produces markup. */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const COURT_FORMS = path.join(__dirname, '..', 'court-forms');
const MLH = path.join(__dirname, '..', 'masslegalhelp');
const LOGIC_FILE = 'snap-screening-logic.js';

/* The MassLegalHelp build is a separate deployable, so it carries its own copy
 * of the logic module and is driven through every screen here too. It is the one
 * that ships to the public, so leaving it uncovered would put the tested pages
 * and the shipping page in different places. */
const PAGES = [
  { label: 'court-forms/snap-abawd.html', dir: COURT_FORMS, file: 'snap-abawd.html' },
  { label: 'court-forms/snap-abawd-classic-v2.html', dir: COURT_FORMS, file: 'snap-abawd-classic-v2.html' },
  { label: 'court-forms/snap-screening-v2.html', dir: COURT_FORMS, file: 'snap-screening-v2.html' },
  { label: 'masslegalhelp/index.html', dir: MLH, file: 'index.html' }
];

/* Result screens to drive, as answer sets. Keyed so a failure names the screen. */
const SCREENS = {
  'intro': 'state.view="intro"; render();',
  'exempt: child under 14': 'state.answers={child14:"yes"}; state.view="results"; render();',
  'exempt: work income': 'state.answers={working:"income_weekly"}; state.view="results"; render();',
  'exempt: 30 hours': 'state.answers={working:"hours_30"}; state.view="results"; render();',
  'exempt: housing': 'state.answers={housing:"no",housingFollowup:NONE}; state.view="results"; render();',
  'exempt: other disability': 'state.answers={disability:["other"]}; state.view="results"; render();',
  'exempt: named disability': 'state.answers={disability:["ssi_ssdi"]}; state.view="results"; render();',
  'exempt: several reasons at once':
    'state.answers={child14:"yes",working:"income_weekly",housing:"no",housingFollowup:NONE,disability:["other"],pregnant:"yes"}; state.view="results"; render();',
  'good cause': 'state.answers={goodcause:"transport"}; state.view="results"; render();',
  'must meet the rules': 'state.answers={child14:"no",health:"no"}; state.view="results"; render();',
  'age info': 'state.answers={ageRange:"no"}; state.view="results"; render();',
  /* Every question page, so a template error on a later group cannot hide. */
  'all question pages':
    'state.view="question"; for(let i=0;i<GROUPS.length;i++){ state.step=i; render(); }',
  'good-cause question page': 'state.view="question"; state.gc=true; render();',
  /* Housing follow-up only appears once housing is answered "no". */
  'housing follow-up question':
    'state.answers={housing:"no"}; state.view="question"; state.step=1; render();'
};

/* Paths reached by buttons rather than by rendering a view. These are where an
 * undefined reference hides longest, because nobody clicks Download as Word on
 * every deploy. Called directly: they are top-level declarations in the page
 * script's scope, which the appended driver shares. */
const ACTIONS = {
  'advance through to results':
    'state.view="question"; state.step=0; for(let i=0;i<GROUPS.length+2;i++){ advance(); }',
  'back out to the intro':
    'state.view="results"; state.answers={child14:"yes"}; back(); back(); back(); back(); back(); back();',
  'skip to results': 'state.view="question"; skipToEnd();',
  'restart from results':
    'state.answers={child14:"yes"}; state.view="results"; render(); state.view="intro"; state.answers={}; renderWithMotion();',
  'delete answers': 'state.answers={child14:"yes"}; deleteAnswers();',
  'print the letter (exempt)':
    'state.answers={child14:"yes"}; state.view="results"; render(); printForm();',
  'print the letter (good cause)':
    'state.answers={goodcause:"transport"}; state.view="results"; render(); printForm();',
  'download as Word':
    'state.answers={child14:"yes"}; state.view="results"; render(); downloadDoc();',
  'email these results':
    'state.answers={child14:"yes"}; state.view="results"; render(); emailResults();',
  /* The copy-and-paste fallback for a machine with no mail app. Runs with no
   * navigator.clipboard in the shim, so this drives the select-instead path. */
  'copy the email text':
    'state.answers={child14:"yes"}; state.view="results"; render(); emailResults(); copyEmailText();',
  'clear the signature':
    'state.answers={child14:"yes"}; state.view="results"; render(); clearSignature();'
};

function makeEl(tag) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    _html: '',
    children: [],
    attrs: {},
    dataset: {},
    value: '',
    checked: false,
    clientWidth: 600, clientHeight: 150, offsetWidth: 600, offsetHeight: 150,
    style: { cssText: '', setProperty() {} },
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      contains(c) { return this._s.has(c); },
      toggle(c) { if (this._s.has(c)) this._s.delete(c); else this._s.add(c); }
    },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = String(v); },
    get textContent() { return this._html; },
    set textContent(v) { this._html = String(v); },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    removeAttribute(k) { delete this.attrs[k]; },
    hasAttribute(k) { return k in this.attrs; },
    appendChild(c) { this.children.push(c); return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); return c; },
    remove() {},
    insertBefore(c) { this.children.push(c); return c; },
    addEventListener() {}, removeEventListener() {},
    focus() {}, blur() {}, click() {},
    select() {}, setSelectionRange() {},
    querySelector() { return makeEl('div'); },
    querySelectorAll() { return []; },
    closest() { return null; },
    scrollIntoView() {},
    getBoundingClientRect() { return { top: 0, left: 0, right: 0, bottom: 0, width: 300, height: 40 }; },
    toDataURL() { return 'data:image/png;base64,'; },
    getContext() {
      return {
        clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {},
        fillRect() {}, drawImage() {}, scale() {}, save() {}, restore() {},
        set lineWidth(v) {}, set strokeStyle(v) {}, set lineCap(v) {},
        set lineJoin(v) {}, set fillStyle(v) {}
      };
    }
  };
  return el;
}

function buildContext() {
  const stage = makeEl('main');
  stage.attrs.id = 'stage';
  const byId = { stage };
  const store = {};
  const document = {
    documentElement: makeEl('html'),
    body: makeEl('body'),
    activeElement: null,
    visibilityState: 'visible',
    getElementById(id) {
      if (!(id in byId)) { byId[id] = makeEl('div'); byId[id].attrs.id = id; }
      return byId[id];
    },
    querySelector(sel) { return sel === '#stage' ? stage : makeEl('div'); },
    querySelectorAll() { return []; },
    createElement: makeEl,
    createTextNode(t) { const e = makeEl('span'); e.textContent = t; return e; },
    addEventListener() {}, removeEventListener() {}
  };
  const ctx = {
    console,
    document,
    navigator: { userAgent: 'node', onLine: true },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {} }),
    location: { href: 'https://example.test/court-forms/page.html', search: '', pathname: '/court-forms/page.html' },
    requestAnimationFrame: (fn) => { fn(); return 1; },
    cancelAnimationFrame() {},
    setTimeout: () => 0,
    clearTimeout() {},
    scrollTo() {}, print() {},
    addEventListener() {}, removeEventListener() {},
    atob: (s) => Buffer.from(s, 'base64').toString('binary'),
    btoa: (s) => Buffer.from(s, 'binary').toString('base64'),
    URL: Object.assign(
      function ShimURL(u, base) { return new URL(u, base); },
      URL,
      { createObjectURL: () => 'blob:shim', revokeObjectURL() {} }
    ),
    URLSearchParams,
    Blob: class { constructor(parts) { this.parts = parts; } },
    Image: class { constructor() { this.onload = null; } set src(v) {} },
    lucide: { createIcons() {} },
    devicePixelRatio: 1,
    innerWidth: 900, innerHeight: 800
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  return { ctx, stage };
}

function inlineScript(html, file) {
  const m = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i.exec(html);
  assert.ok(m, file + ' has no inline <script> block');
  return m[1];
}

/* Two deployables, two copies of the decision logic. A copy that drifts is the
 * worst failure available here: the preview a reviewer signs off on would stop
 * matching the page the public gets, and nothing else would notice. */
describe('the shipping build shares the reviewed logic module', () => {
  it('masslegalhelp and court-forms hold identical copies', () => {
    const a = fs.readFileSync(path.join(COURT_FORMS, LOGIC_FILE), 'utf8');
    const b = fs.readFileSync(path.join(MLH, LOGIC_FILE), 'utf8');
    assert.equal(
      b, a,
      'masslegalhelp/' + LOGIC_FILE + ' has drifted from court-forms/' + LOGIC_FILE +
      '. Copy the reviewed one over the other; do not edit them separately.'
    );
  });
});

/* The progress announcement broke once by being written the obvious way, so it
 * gets a guard. Reassigning the container's innerHTML on every render destroys
 * the live region before it can announce, and the failure is invisible unless
 * you are actually using a screen reader: the bar still animates.
 *
 * Source assertions, not behaviour, because the DOM shim in this file returns a
 * fresh stub from querySelector and so cannot observe element identity across
 * renders. Narrow, but it catches the specific regression.
 *
 * Only the two live builds are checked. snap-abawd.html and snap-screening-v2.html
 * are frozen previews that still have the original pattern and are not shipping. */
describe('the progress label announces section changes', () => {
  const LIVE_BUILDS = [
    { label: 'masslegalhelp/index.html', dir: MLH, file: 'index.html' },
    { label: 'court-forms/snap-abawd-classic-v2.html', dir: COURT_FORMS, file: 'snap-abawd-classic-v2.html' }
  ];
  for (const build of LIVE_BUILDS) {
    it(build.label, () => {
      const src = inlineScript(fs.readFileSync(path.join(build.dir, build.file), 'utf8'), build.label);
      const fn = /function renderProgress\(\)\{[\s\S]*?\n\}/.exec(src);
      assert.ok(fn, 'renderProgress not found in ' + build.label);
      const body = fn[0];

      assert.match(
        body, /role="status" aria-live="polite"/,
        build.label + ': the progress label needs a polite live region, or a screen ' +
        'reader user is never told the section changed.'
      );
      assert.match(
        body, /if\(!el\.firstChild\)\{/,
        build.label + ': the live region must be built once and then updated. Without ' +
        'the guard, every render recreates it and nothing is announced.'
      );
      assert.match(
        body, /\[data-progress-label\][\s\S]*textContent/,
        build.label + ': the label must be updated via textContent on the persistent ' +
        'node, not rebuilt as part of an innerHTML string.'
      );
      /* The tell of the old shape. Baking the label into the HTML string means
       * the text can only change by rebuilding the node it lives in, which is
       * the thing that silences the announcement. The guarded rebuild above
       * still assigns innerHTML once, so the assignment itself is not the
       * signal; the interpolated label is. */
      assert.doesNotMatch(
        body, /\$\{label\}/,
        build.label + ': the label is interpolated into the innerHTML string again, ' +
        'so it can only update by recreating the live region. Set textContent on the ' +
        'persistent node instead.'
      );
    });
  }
});

/* The author asked for the "every question is optional" line above the first
 * group only. It is a one-line change that a later edit to the group header
 * could undo without anyone noticing, so it gets an assertion. */
describe('the optional-questions note appears above group 1 only', () => {
  for (const build of [
    { label: 'masslegalhelp/index.html', dir: MLH, file: 'index.html' },
    { label: 'court-forms/snap-abawd-classic-v2.html', dir: COURT_FORMS, file: 'snap-abawd-classic-v2.html' }
  ]) {
    it(build.label, () => {
      const src = inlineScript(fs.readFileSync(path.join(build.dir, build.file), 'utf8'), build.label);
      const note = /Answer any that apply to you\. Every question is optional\./;
      assert.match(src, note, build.label + ': the note is gone entirely.');
      // The line has to sit behind a first-group condition, not render every time.
      const guarded = /state\.step === 0[\s\S]{0,400}?Answer any that apply to you/.test(src);
      assert.ok(
        guarded,
        build.label + ': the optional-questions note is not gated on state.step === 0, so ' +
        'it renders above every group again. The author asked for group 1 only.'
      );
    });
  }
});

/* Quick exit is a safety control, and the failure mode is silent: it navigates
 * away correctly while leaving the answers on the device. Only the shipping build
 * has it; the preview builds still use a Back button to the hub. */
describe('Quick exit clears the stored answers', () => {
  it('masslegalhelp/index.html', () => {
    const src = inlineScript(fs.readFileSync(path.join(MLH, 'index.html'), 'utf8'), 'masslegalhelp/index.html');
    const handler = /case 'quick-exit':[\s\S]*?break;/.exec(src);
    assert.ok(handler, 'no quick-exit handler found. The top-bar control is the only way out.');

    assert.match(
      handler[0], /removeItem\(STORAGE_KEY\)/,
      'Quick exit navigates away without clearing STORAGE_KEY, so a domestic violence ' +
      'or pregnancy answer stays on the device for the next person using it.'
    );
    assert.match(
      handler[0], /location\.replace/,
      'Quick exit must use location.replace, not href, or Back returns to the answers.'
    );
    // Clearing after navigation would not run.
    const clearAt = handler[0].indexOf('removeItem');
    const navAt = handler[0].indexOf('location.replace');
    assert.ok(
      clearAt < navAt,
      'Quick exit navigates before clearing storage, so the clear never happens.'
    );
  });
});

describe('screener pages render without throwing', () => {
  for (const page of PAGES) {
    const html = fs.readFileSync(path.join(page.dir, page.file), 'utf8');
    const src = inlineScript(html, page.label);
    const logic = fs.readFileSync(path.join(page.dir, LOGIC_FILE), 'utf8');

    it(page.label + ' parses as a script', () => {
      new vm.Script(src, { filename: page.label });
    });

    for (const [screen, driver] of Object.entries(SCREENS)) {
      it(page.label + ' renders ' + screen, () => {
        const { ctx, stage } = buildContext();
        vm.createContext(ctx);
        vm.runInContext(logic, ctx, { filename: LOGIC_FILE });
        // Appended so the driver shares the page script's lexical scope, which
        // is where `state` and `render` live in a classic (non-module) script.
        vm.runInContext(src + '\n;(function(){' + driver + '})();', ctx, { filename: page.label });
        assert.ok(
          stage.innerHTML.length > 200,
          screen + ' rendered only ' + stage.innerHTML.length + ' chars into #stage'
        );
      });
    }

    /* Button paths. These assert "did not throw" rather than checking output,
     * since print and download write elsewhere or hand off to the browser. */
    for (const [action, driver] of Object.entries(ACTIONS)) {
      it(page.label + ' survives ' + action, () => {
        const { ctx } = buildContext();
        vm.createContext(ctx);
        vm.runInContext(logic, ctx, { filename: LOGIC_FILE });
        vm.runInContext(src + '\n;(function(){' + driver + '})();', ctx, { filename: page.label });
      });
    }
  }
});

/* ------------------------------------------------------------------------- *
 * Path-independent guard for the exact bug that shipped: a `${SOME_CONST}`
 * left in a template literal after the const was deleted. The render tests
 * above only catch it on paths they drive, so this one reads the source and
 * checks every interpolated SCREAMING_CASE name is actually declared. That
 * naming convention is what the page-level link and copy constants use, which
 * keeps the check specific enough to avoid false positives on locals.
 * ------------------------------------------------------------------------- */
describe('page scripts declare every constant they interpolate', () => {
  for (const page of PAGES) {
    it(page.label, () => {
      const html = fs.readFileSync(path.join(page.dir, page.file), 'utf8');
      const src = inlineScript(html, page.label);

      // Root identifier of each ${...}, e.g. "LINKS" from "${LINKS.abawd}".
      const used = new Set();
      for (const m of src.matchAll(/\$\{\s*([A-Z][A-Z0-9_]{2,})\b/g)) used.add(m[1]);

      // Anything bound in this script, destructured from a module, or a builtin.
      const declared = new Set(['URL', 'URLSearchParams', 'JSON', 'Math', 'Number', 'String', 'Boolean', 'Array', 'Object', 'Date', 'NaN', 'Infinity']);
      for (const m of src.matchAll(/\b(?:const|let|var|function)\s+([A-Z][A-Z0-9_]{2,})\b/g)) declared.add(m[1]);
      // Destructuring blocks: const { A, B } = X;  and  const [A, B] = X;
      for (const m of src.matchAll(/\b(?:const|let|var)\s*[{[]([^}\]]*)[}\]]\s*=/g)) {
        for (const part of m[1].split(',')) {
          const name = part.split(':').pop().trim().replace(/^\.\.\./, '');
          if (/^[A-Z][A-Z0-9_]{2,}$/.test(name)) declared.add(name);
        }
      }

      const missing = [...used].filter(n => !declared.has(n));
      assert.deepEqual(
        missing, [],
        'interpolated but never declared in ' + page.label + ': ' + missing.join(', ') +
        '. A deleted const still referenced inside a template literal parses fine ' +
        'and throws at render time, blanking the page.'
      );
    });
  }
});
