#!/usr/bin/env node
/**
 * Generates a Google Docs export of screener copy only: no code ids, no editorial
 * notes, no walkthrough narration, no worked examples. Section headers match the
 * flow someone meets in the tool.
 *
 *   "$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" scripts/copy-screener-only.js
 *
 * Written to _local/, which is gitignored, because it is for pasting into Google
 * Docs rather than reviewing in the repository.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'masslegalhelp', 'tool', 'snap', 'index.html');
const OUT = path.join(ROOT, '_local', 'SCREENER-COPY-for-google-docs.md');
const VARIANT = 'classic2';

const S = require(path.join(ROOT, 'masslegalhelp', 'snap-screening-logic.js'));
const A = S.create(VARIANT);
const C = S.RESULT_COPY;

const GUIDED_DOC_DATE = new Date(2026, 7, 1);

const INLINE = [
  { id: 'page.h1', re: /<h1 class="h1">([^<]+)<\/h1>/ },
  { id: 'page.introSummary', re: /<p [^>]*>(Some adults on SNAP[\s\S]*?)<\/p>/ },
  { id: 'page.introNotice', re: /<p [^>]*>(You only have to meet these rules[\s\S]*?)<\/p>/ },
  { id: 'page.introLostSnap', re: /<p [^>]*>(If you lost your SNAP because of the work rules[\s\S]*?)<\/p>/ },
  { id: 'page.moreSummary', re: /<summary [^>]*>(More on the SNAP ABAWD work rules)<\/summary>/ },
  { id: 'page.moreDetails1', re: /<p style="margin:0 0 10px">(Everyone has a different life situation[\s\S]*?)<\/p>/ },
  { id: 'page.moreDetails2', re: /<p style="margin:0">(To learn more about the ABAWD work rules[\s\S]*?)<\/p>/ },
  { id: 'page.timeEstimate', re: /<p [^>]*>(This short screening asks[\s\S]*?)<\/p>/ },
  { id: 'page.privacyIntro', re: /<p [^>]*>(<strong>Your information is private\.?<\/strong>[\s\S]*?)<\/p>/ },
  { id: 'page.startHeading', re: /<h2 class="h2"[^>]*>(Check if the SNAP work rules apply to you\.)<\/h2>/ },
  { id: 'page.startButton', re: />(Fill out the form[^<]*)<\/button>/ },
  { id: 'page.answerAny', re: /<p [^>]*>(Answer any that apply to you\. Every question is optional\.)<\/p>/ },
  { id: 'page.learnMoreIntro', re: />(Learn more about the SNAP ABAWD work rules)</ },
  { id: 'page.skippedWarning', re: />(If you skipped questions[^<]+)</ },
  { id: 'page.sigAlt', re: /<p id="sig-alt"[^>]*>([^<]+)<\/p>/ },
  { id: 'btn.skipToResults', re: />(Skip to results)</ },
  { id: 'btn.startOver', re: />([^<]{0,4}Start over)</ },
  { id: 'btn.deleteAnswers', re: />(Delete my answers)</ },
  { id: 'statement.docTitle', re: /<title>(SNAP Work Rules Statement)<\/title>/ },
  { id: 'statement.nameLabel', re: />(Your name)</ },
  { id: 'statement.agencyLabel', re: />(Client \/ Agency ID \(if you have one\))</ },
  { id: 'statement.sigLabel', re: />(Signature)</ },
  { id: 'statement.sigHint', re: /id="sig-hint"[^>]*>([^<]+)</ },
  { id: 'hint.signatures.title', re: /hintTip\('sig', '([^']+)'/ },
  { id: 'hint.signatures.body', re: /hintTip\('sig', '[^']+', '((?:[^'\\]|\\.)+)'/ }
];

const html = fs.readFileSync(HTML, 'utf8');
const inline = {};
const missing = [];
for (const item of INLINE) {
  const m = html.match(item.re);
  if (!m) { missing.push(item.id); continue; }
  inline[item.id] = m[1];
}
if (missing.length) {
  console.error('copy-screener-only: these patterns no longer match ' + path.basename(HTML) + ':');
  missing.forEach(id => console.error('  ' + id));
  process.exit(1);
}

const UNESCAPE = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

function plain(s) {
  return String(s)
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\$\{LINKS\.([A-Za-z0-9_]+)\}/g, (m, k) => S.LINKS[k] || m)
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    .replace(/<br\s*\/?>\s*<br\s*\/?>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, (m, t, inner) => (inner.trim() ? '**' + inner.trim() + '**' : ''))
    .replace(/<(em|i)>([\s\S]*?)<\/\1>/g, (m, t, inner) => (inner.trim() ? '*' + inner.trim() + '*' : ''))
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, m => (m in UNESCAPE ? UNESCAPE[m] : m))
    .replace(/[ \t]+/g, ' ')
    .trim();
}

const bold = (s) => '**' + plain(s) + '**';

const lines = [];
const w = (s) => lines.push(s === undefined ? '' : s);
const blank = () => lines.push('');

function emit(text) {
  plain(text).split('\n').forEach(l => { if (l.trim()) w(l); });
  blank();
}

function h2(t) { blank(); w('## ' + t); blank(); }
function h3(t) { blank(); w('### ' + t); blank(); }
function h4(t) { blank(); w('#### ' + t); blank(); }

function emitQuestion(q) {
  w('**' + plain(q.text) + '**');
  blank();
  const help = q.helpHtml || q.help;
  if (help) { emit(help); }
  if (q.listItems) { q.listItems.forEach(li => w('- ' + plain(li))); blank(); }
  if (q.type === 'yn') {
    w('- ' + plain(q.yesLabel || 'Yes'));
    w('- ' + plain(q.noLabel || 'No'));
  } else {
    (q.options || []).forEach(o => w('- ' + plain(o.label)));
    if (q.noneLabel) w('- ' + plain(q.noneLabel));
  }
  if (q.note) { blank(); w(plain(q.note)); }
  blank();
}

function emitCopy(key) {
  const val = key.indexOf('.') !== -1 ? inline[key] : C[key];
  if (val === undefined) return;
  if (typeof val === 'string' && val.indexOf('<') !== -1) emit(val);
  else if (typeof val === 'string') w(val);
  else emit(String(val));
  blank();
}

function emitResultsHead() {
  emitCopy('resultsHeadTitle');
  emitCopy('resultsHeadLead');
}

function emitLearnMore() {
  emitCopy('learnMoreLabel');
}

function emitLostSnap() {
  w(C.lostSnapIntro + ' [' + S.LINKS.advocacyEmail + '](mailto:' + S.LINKS.advocacyEmail + ').');
  blank();
}

function emitDtaContacts(upload) {
  if (upload) {
    w(C.meetingDtaStatement + ' [DTAConnect](' + S.LINKS.dtaConnect + ')');
  } else {
    w('Upload on [DTAConnect](' + S.LINKS.dtaConnect + ')');
  }
  w('- Mail: DTA Document Processing Center, P.O. Box 4406, Taunton, MA 02780-0420');
  w('- Fax: (617) 887-8765');
  w('- Call the DTA Assistance line at [(877) 382-2363](tel:8773822363)');
  w('  - [Click here](' + S.LINKS.reachDtaWorker + ') to see how to get help if you can\'t reach DTA by phone');
  w('- Go to a [local DTA office](' + S.LINKS.dtaOffices + ') to speak with a SNAP worker');
  blank();
}

function emitFormFields() {
  emitCopy('statement.nameLabel');
  emitCopy('statement.agencyLabel');
  emitCopy('statement.sigLabel');
  emitCopy('hint.signatures.title');
  emitCopy('hint.signatures.body');
  emitCopy('statement.sigHint');
  emitCopy('page.sigAlt');
}

function emitPrintEmailButtons() {
  [
    'printFormLabel', 'downloadWordLabel', 'emailSelfLabel', 'savingTipsTitle', 'savingTipsBody',
    'emailSelfSubject', 'emailFallbackHeading', 'emailFallbackBody', 'emailCopyLabel',
    'emailCopiedLabel', 'emailSelectedLabel', 'emailTruncatedNote'
  ].forEach(k => emitCopy(k));
}

function emitResultNavButtons() {
  emitCopy('btn.startOver');
  emitCopy('btn.deleteAnswers');
}

const TODAY_LABEL = 'August 1, 2026';
const BULLET = '\0';

/** Turn buildStatementHTML output into plain text for the copy doc. */
function letterToText(letterHtml) {
  const out = [];
  const head = /<table[\s\S]*?<\/table>/.exec(letterHtml);
  if (head) {
    for (const row of head[0].match(/<tr>[\s\S]*?<\/tr>/g) || []) {
      const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => plain(m[1]));
      if (cells.length === 2) out.push((cells[0] + ':').padEnd(20) + cells[1]);
    }
    out.push('');
  }

  const body = (head ? letterHtml.slice(head.index + head[0].length) : letterHtml)
    .replace(/<img [^>]*alt="Signature"[^>]*>/g, '\n[signature]\n')
    .replace(/<div[^>]*border-bottom:1px solid #111[^>]*><\/div>/g, '\n__________________________\n')
    .replace(/<li[^>]*>/g, '\n' + BULLET)
    .replace(/<\/p>/g, '\n\n')
    .replace(/<\/(div|ul|li|h[1-6])>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, m => (m in UNESCAPE ? UNESCAPE[m] : m));

  body.split('\n').forEach(raw => {
    const bullet = raw.indexOf(BULLET) !== -1;
    const text = raw.split(BULLET).join('').replace(/\s+/g, ' ').trim();
    if (!text) { out.push(''); return; }
    out.push(bullet ? '  - ' + text : text);
  });

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function writeInExplain(answers, texts) {
  const prompts = A.statementPrompts(answers);
  return prompts.map((prompt, i) => ({
    prompt,
    text: (texts && texts[i]) || ''
  }));
}

function emitWriteInLetter(title, answers, opts) {
  h3(title);
  const rt = opts.rt || A.resultType(answers);
  emitLetter({
    name: opts.name || 'Jordan Rivera',
    agency: opts.agency || '',
    explain: writeInExplain(answers, opts.explainText),
    rt,
    rs: A.exemptReasons(answers),
    gcText: A.goodCauseText(answers),
    composed: false,
    today: TODAY_LABEL
  });
}

function emitLetter(opts) {
  letterToText(S.buildStatementHTML(opts)).split('\n').forEach(l => w(l));
  blank();
}

const WRITE_IN_LETTER_CASES = [
  {
    title: 'Exempt: pregnant',
    answers: { pregnant: 'yes' },
    explainText: ['I am pregnant and unable to work 30 hours a week right now.']
  },
  {
    title: 'Exempt: health reason',
    answers: { health: 'yes' },
    explainText: ['I have a physical health condition that limits how many hours I can work each week.']
  },
  {
    title: 'Exempt: earning enough income',
    answers: { working: 'income_weekly' },
    explainText: ['I work about 25 hours a week and earn over $217.50 before taxes. I can send pay stubs.']
  },
  {
    title: 'Exempt: 30+ hours at less than minimum wage',
    answers: { working: 'hours_30' },
    explainText: ['I work 32 hours a week at $10 an hour. I can send proof of my hours and pay.']
  },
  {
    title: 'Exempt: another disability benefit',
    answers: { disability: ['other'] },
    explainText: ['I receive MassHealth as a disability-related benefit.']
  },
  {
    title: 'Exempt: no regular place to sleep',
    answers: { housing: 'no', housingFollowup: S.NONE },
    explainText: ['I stay at a shelter most nights and do not have a stable address for job applications.']
  },
  {
    title: 'Good cause: transportation',
    answers: { goodcause: 'transport' },
    rt: 'goodcause',
    explainText: ['My car broke down in July and I had no other way to get to work.']
  }
];

const ALL_REASONS = new Set();
[
  { child14: 'yes' }, { health: 'yes' }, { child6: 'yes' }, { caretaker: 'yes' },
  { pregnant: 'yes' }, { dv: 'yes' }, { tribe: 'yes' }, { tafdc: 'yes' },
  { disability: ['ssi_ssdi'] }, { disability: ['other'] }, { substanceUse: 'yes' },
  { unemployment: 'yes' }, { stateagency: 'yes' }, { school: 'yes' },
  { working: 'income_weekly' }, { working: 'hours_30' },
  { housing: 'no', housingFollowup: S.NONE }
].forEach(a => A.exemptReasons(a).forEach(r => ALL_REASONS.add(r)));

const PROMPT_CASES = [
  {}, { child14: 'yes' }, { pregnant: 'yes' },
  { housing: 'no', housingFollowup: ['diploma'] },
  { working: 'income_weekly' }, { working: 'hours_30' },
  { disability: ['other'] }, { goodcause: 'transport' }, { goodcause: S.NONE }
];
const ALL_PROMPTS = new Set();
PROMPT_CASES.forEach(a => A.statementPrompts(a).forEach(p => ALL_PROMPTS.add(p)));

const GUIDED_CASES = [
  { title: 'A health reason', answers: { health: 'yes', d_health_kind: 'physical', d_health_length: 'long', d_health_care: 'regularly' } },
  { title: 'Caring for someone who cannot care for themselves', answers: { caretaker: 'yes', d_care_who: 'adult', d_care_often: 'daily', d_care_alone: 'alone' } },
  { title: 'Caring for a child under 6', answers: { child6: 'yes', d_child6_live: 'yes', d_child6_often: 'daily' } },
  { title: 'Working', answers: { working: 'income_weekly', d_work_hours: 'h20_29', d_work_jobs: 'one', d_work_proof: ['paystubs', 'employer_letter'] } },
  { title: 'Working, but cannot get proof', answers: { working: 'hours_30', d_work_hours: 'varies', d_work_proof: ['need_help'] } },
  { title: 'Another disability benefit', answers: { disability: ['other'], d_disability_other: 'masshealth' } },
  { title: 'Another disability benefit, not on the list', answers: { disability: ['other'], d_disability_other: 'unlisted' } },
  { title: 'No regular place to sleep', answers: { housing: 'no', housingFollowup: S.NONE, d_housing_where: 'shelter', d_housing_barriers: ['no_address', 'no_transport'] } },
  { title: 'A good reason for missing hours', answers: { goodcause: 'transport', d_gc_what: 'car_broke', d_gc_when: ['this_month', 'last_month'], d_gc_now: 'still' } }
];

function emitFormWriteIn(rt) {
  if (rt === 'exempt') emitCopy('formTitleExempt');
  emitCopy(rt === 'exempt' ? 'formLeadExempt' : 'formLeadGoodCause');
  emitCopy('whyInfoLabel');
  emitCopy(rt === 'exempt' ? 'whyInfoExempt' : 'whyInfoGoodCause');
  emitCopy('privacyNote');
  emitCopy('printLead');
  emitCopy('formExplainHeading');
  [...ALL_PROMPTS].forEach(p => w('- ' + p));
  blank();
  emitFormFields();
  emitPrintEmailButtons();
}

function emitFormGuided(rt) {
  if (rt === 'exempt') emitCopy('formTitleExempt');
  emitCopy(rt === 'exempt' ? 'composedFormLeadExempt' : 'composedFormLeadGoodCause');
  emitCopy('whyInfoLabel');
  emitCopy(rt === 'exempt' ? 'composedWhyInfoExempt' : 'composedWhyInfoGoodCause');
  emitCopy('privacyNote');
  emitCopy('printLead');
  emitCopy('composedStatementHeading');
  emitCopy('composedChangeLabel');
  emitFormFields();
  emitPrintEmailButtons();
}

function emitExemptCard() {
  emit(S.exemptHeadingHtml());
  if (C.exemptReasonsIntro) emitCopy('exemptReasonsIntro');
  [...ALL_REASONS].forEach(r => w('- ' + r));
  blank();
  ['exemptProofWork', 'exemptProofHousing', 'exemptProofDisability'].forEach(k => emitCopy(k));
  emitLearnMore();
}

function emitGoodCauseCard() {
  emitCopy('goodCauseHeading');
  emitCopy('goodCauseIntro');
  emitCopy('goodCauseLead');
  A.GOODCAUSE_CATEGORIES.forEach(cat => {
    w('**' + plain(cat.title) + '**');
    cat.detail.forEach(d => w('- ' + plain(d)));
    if (cat.moreExamplesUrl) w('- [More examples](' + cat.moreExamplesUrl + ')');
    blank();
  });
  emitLearnMore();
}

function emitNotExemptCard() {
  emitCopy('notExemptHeading');
  emitCopy('notExemptIntro');
  emitCopy('notExemptStartOver');
  w(C.notExemptReapplyLead + ' [' + C.notExemptReapplyLink + '](' + S.LINKS.reapply + ') ' + C.notExemptReapplyEnd);
  blank();
  w('- [' + C.notExemptSnapBack + '](' + S.LINKS.getSnapBack + ')');
  w('- ' + C.notExemptEmail + ' [' + S.LINKS.advocacyEmail + '](mailto:' + S.LINKS.advocacyEmail + ') ' + C.notExemptEmailSuffix);
  blank();
  emitCopy('workRulesHeading');
  w('1. **' + C.workOption1 + '**');
  w('- ' + C.workOption1Unpaid);
  w('- [' + C.workOption1Training + '](' + S.LINKS.dtaTraining + ')');
  w('');
  w('OR');
  w('');
  w('2. **' + C.workOption2 + '**');
  blank();
  emitCopy('meetingDtaHeading');
  emitCopy('meetingDtaPaid');
  emitDtaContacts(true);
  emitCopy('goodCauseInNotExemptBold');
  emitCopy('goodCauseInNotExemptIntro');
  w(C.goodCauseInNotExemptBody + ' [' + C.goodCauseInNotExemptLink + '](' + S.LINKS.goodCause + ').');
  blank();
  emitLearnMore();
}

function emitExemptResultScreen(guided) {
  h2('Result screen: you may be exempt' + (guided ? ' (guided version)' : ' (write-in version)'));
  h3('Page header');
  emitResultsHead();
  h3('Result card');
  emitExemptCard();
  h3('Statement form');
  if (guided) emitFormGuided('exempt');
  else emitFormWriteIn('exempt');
  h3('Other ways to tell DTA');
  emitCopy('otherWaysHeading');
  w('Fill out and send in [DTA\u2019s exemption form](' + S.LINKS.exemptionForm + ') or explain the information to DTA in a written, signed statement (handwritten note is fine):');
  blank();
  emitDtaContacts(false);
  h3('Footer');
  emitLostSnap();
  h3('Buttons at bottom');
  emitResultNavButtons();
}

function emitGoodCauseResultScreen(guided) {
  h2('Result screen: you may have a good reason for missing hours' + (guided ? ' (guided version)' : ' (write-in version)'));
  h3('Page header');
  emitResultsHead();
  h3('Result card');
  emitGoodCauseCard();
  h3('Statement form');
  if (guided) emitFormGuided('goodcause');
  else emitFormWriteIn('goodcause');
  h3('Other ways to tell DTA');
  emitCopy('otherWaysHeading');
  emitCopy('otherWaysGoodCauseLead');
  emitDtaContacts(false);
  h3('Footer');
  emitLostSnap();
  h3('Buttons at bottom');
  emitResultNavButtons();
}

function emitNotExemptResultScreen() {
  h2('Result screen: you may need to meet the work rules');
  h3('Page header');
  emitResultsHead();
  h3('Result card');
  emitNotExemptCard();
  h3('Buttons at bottom');
  emitResultNavButtons();
}

/* ---- Document ---- */

w('# SNAP ABAWD screener: all copy');
blank();
w('Every word the screener shows, in the order someone meets it. Generated from the tool.');
blank();

h2('Start page');

[
  'page.h1', 'page.introSummary', 'page.introNotice', 'page.introLostSnap',
  'page.moreSummary', 'page.moreDetails1', 'page.moreDetails2',
  'page.timeEstimate', 'page.privacyIntro', 'page.startHeading', 'page.startButton'
].forEach(id => emitCopy(id));
emitCopy('page.learnMoreIntro');

h2('The questions');

emitCopy('page.answerAny');

A.GROUPS.forEach((g, i) => {
  h3('Section ' + (i + 1) + ' of 4: ' + g.title);
  g.ids.forEach(id => {
    const q = A.Q_BY_ID[id];
    if (q) emitQuestion(q);
  });
});

h2('Good cause question');

emitQuestion(A.GOODCAUSE);

h2('Moving through the questions');

['btnNext', 'btnSeeResults', 'btnGuidedDetailsNext', 'btnSeeLetter'].forEach(k => emitCopy(k));
['btn.skipToResults', 'btn.startOver', 'btn.deleteAnswers', 'page.skippedWarning'].forEach(id => emitCopy(id));

emitExemptResultScreen(false);
emitGoodCauseResultScreen(false);
emitNotExemptResultScreen();

h2('Guided mode: details step (before results)');

['detailsStepHeading', 'detailsStepLead', 'detailsStepPrivacy'].forEach(k => emitCopy(k));

h3('Guided questions and composed sentences');

for (const c of GUIDED_CASES) {
  h4(c.title);
  const qs = A.guidedQuestions(c.answers);
  qs.forEach(q => {
    w('**' + plain(q.text) + '**');
    blank();
    if (q.help) { emit(q.help); }
    if (q.type === 'yn') {
      w('- Yes');
      w('- No');
    } else {
      (q.options || []).forEach(o => w('- ' + plain(o.label)));
      if (q.noneLabel) w('- ' + plain(q.noneLabel));
    }
    blank();
  });
  const composed = A.composeStatement(c.answers, GUIDED_DOC_DATE);
  composed.forEach(e => emit(e.text));
}

emitExemptResultScreen(true);
emitGoodCauseResultScreen(true);

h2('Printable statements (write-in version)');

emitCopy('statement.docTitle');

WRITE_IN_LETTER_CASES.forEach(c => emitWriteInLetter(c.title, c.answers, c));

fs.writeFileSync(OUT, lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n', 'utf8');
console.log('Wrote ' + path.relative(ROOT, OUT).split(path.sep).join('/'));
