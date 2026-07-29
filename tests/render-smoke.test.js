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
const PAGES = ['snap-abawd.html', 'snap-abawd-classic-v2.html', 'snap-screening-v2.html'];

/* Result screens to drive, as answer sets. Keyed so a failure names the screen. */
const SCREENS = {
  'intro': 'state.view="intro"; render();',
  'exempt: child under 14': 'state.answers={child14:"yes"}; state.view="results"; render();',
  'exempt: work income': 'state.answers={working:"income_weekly"}; state.view="results"; render();',
  'exempt: 30 hours': 'state.answers={working:"hours_30"}; state.view="results"; render();',
  'exempt: housing': 'state.answers={housing:"no",housingFollowup:NONE}; state.view="results"; render();',
  'exempt: other disability': 'state.answers={disability:["other"]}; state.view="results"; render();',
  'exempt: named disability': 'state.answers={disability:["ssi_ssdi"]}; state.view="results"; render();',
  'good cause': 'state.answers={goodcause:"transport"}; state.view="results"; render();',
  'must meet the rules': 'state.answers={child14:"no",health:"no"}; state.view="results"; render();',
  'age info': 'state.answers={ageRange:"no"}; state.view="results"; render();',
  'first question page': 'state.view="question"; state.step=0; render();'
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
    insertBefore(c) { this.children.push(c); return c; },
    addEventListener() {}, removeEventListener() {},
    focus() {}, blur() {}, click() {},
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
    URL, URLSearchParams,
    Blob: class { constructor() {} },
    Image: class { constructor() { this.onload = null; } set src(v) {} },
    lucide: { createIcons() {} },
    devicePixelRatio: 1,
    innerWidth: 900, innerHeight: 800
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  return { ctx, stage };
}

const LOGIC_SRC = fs.readFileSync(path.join(COURT_FORMS, 'snap-screening-logic.js'), 'utf8');

function inlineScript(html, file) {
  const m = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/i.exec(html);
  assert.ok(m, file + ' has no inline <script> block');
  return m[1];
}

describe('screener pages render without throwing', () => {
  for (const page of PAGES) {
    const html = fs.readFileSync(path.join(COURT_FORMS, page), 'utf8');
    const src = inlineScript(html, page);

    it(page + ' parses as a script', () => {
      new vm.Script(src, { filename: page });
    });

    for (const [screen, driver] of Object.entries(SCREENS)) {
      it(page + ' renders ' + screen, () => {
        const { ctx, stage } = buildContext();
        vm.createContext(ctx);
        vm.runInContext(LOGIC_SRC, ctx, { filename: 'snap-screening-logic.js' });
        // Appended so the driver shares the page script's lexical scope, which
        // is where `state` and `render` live in a classic (non-module) script.
        vm.runInContext(src + '\n;(function(){' + driver + '})();', ctx, { filename: page });
        assert.ok(
          stage.innerHTML.length > 200,
          screen + ' rendered only ' + stage.innerHTML.length + ' chars into #stage'
        );
      });
    }
  }
});
