#!/usr/bin/env node
/**
 * Generates SCREENER-WALKTHROUGH.md: the screener written out the way someone
 * meets it, in plain English, plus a worked demonstration of how the guided
 * version turns multiple-choice answers into the letter that goes to DTA.
 *
 *   "$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" scripts/copy-walkthrough.js
 *
 * This is not a replacement for SCREENER-COPY.md, and both are generated from
 * the same code so they cannot disagree. They are for two different jobs:
 *
 *   SCREENER-COPY.md      every string with the `code.name` that finds it in the
 *                         source. Those ids are how an edit lands on the right
 *                         string, so they have to stay, and they make the
 *                         document hard to read straight through.
 *
 *   SCREENER-WALKTHROUGH  no ids, no code, nothing to skip past. Reads like the
 *                         tool works: screen after screen, then a set of worked
 *                         examples showing the letter being assembled a sentence
 *                         at a time from what the person clicked.
 *
 * Edit copy in SCREENER-COPY.md, where the ids say where it goes. Read this one
 * to see what the tool actually does with it.
 *
 * Every example below is composed by calling the real functions, never by
 * quoting them into this file. If a sentence changes in the logic module, it
 * changes here on the next run, and CI fails if that run has not happened.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'masslegalhelp', 'snap-abawd', 'index.html');
const VARIANT = 'classic2';

/* ---- --docs: a version that survives being pasted into Google Docs ----
 *
 * Google Docs converts headings, bold, italic, bullet lists, links, tables, and
 * fenced code blocks when markdown is pasted in. It has never converted
 * blockquotes: the `>` characters arrive as literal text at the start of every
 * quoted line, which in this document is most of the page, since quoting is how
 * the screener's own wording is shown.
 *
 * So in this mode the quoted wording becomes ordinary paragraphs. Nothing is
 * lost, because the italic-or-not rule is what actually carries the meaning
 * here: italic is commentary, everything else is the tool's words. The legend
 * changes to match.
 *
 * Written to _local/, which is gitignored, because it is an export for pasting
 * rather than a document to review in the repository. Only the markdown version
 * is committed, so there is one file to keep current and CI has one thing to
 * check. */
const DOCS_MODE = process.argv.includes('--docs');
const OUT = DOCS_MODE
  ? path.join(ROOT, '_local', 'SCREENER-WALKTHROUGH-for-google-docs.md')
  : path.join(ROOT, 'SCREENER-WALKTHROUGH.md');

const S = require(path.join(ROOT, 'masslegalhelp', 'snap-screening-logic.js'));
const A = S.create(VARIANT);
const C = S.RESULT_COPY;

/* The good-cause sentence names the months someone missed hours. Composing it
 * against the clock would rewrite this document on the first of every month and
 * fail the CI job that regenerates and diffs it, so every example is composed
 * against a fixed date. The tool itself uses the real one. */
const TODAY = new Date(2026, 7, 1);
const TODAY_LABEL = 'August 1, 2026';

/* ---- A few strings live in the page markup rather than the logic module ----
 * Same approach copy-doc.js takes, and the same rule: a pattern that stops
 * matching is a hard error. A walkthrough missing the first screen is worse
 * than no walkthrough, because nothing about it looks wrong. */
const INLINE = [
  { id: 'h1', re: /<h1 class="h1">([^<]+)<\/h1>/ },
  { id: 'introSummary', re: /<p [^>]*>(Some adults on SNAP who are[\s\S]*?)<\/p>/ },
  { id: 'introNotice', re: /<p [^>]*>(You only have to meet these rules[\s\S]*?)<\/p>/ },
  { id: 'learnMoreIntro', re: /<p [^>]*>(Learn more about the ABAWD Work Rules[\s\S]*?)<\/p>/ },
  { id: 'timeEstimate', re: /<p [^>]*>(This short online form asks[\s\S]*?)<\/p>/ },
  // Stops at the first tag, so the decorative aria-hidden arrow stays out of the copy.
  { id: 'startButton', re: />(Click here to check[^<]*)</ },
  { id: 'dtaNote', re: /<p [^>]*>(The Department of Transitional Assistance[\s\S]*?)<\/p>/ },
  { id: 'answerAny', re: /<p [^>]*>(Answer any that apply to you\.[\s\S]*?)<\/p>/ },
  { id: 'nameLabel', re: />(Your name)</ },
  { id: 'sigLabel', re: />(Signature)</ },
  { id: 'sigAlt', re: /<p id="sig-alt"[^>]*>([^<]+)<\/p>/ }
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
  console.error('copy-walkthrough: these patterns no longer match ' + path.basename(HTML) + ':');
  missing.forEach(id => console.error('  ' + id));
  console.error('Fix the patterns in scripts/copy-walkthrough.js rather than shipping a document with gaps.');
  process.exit(1);
}
inline.privacyIntro = `<strong>${C.privacyIntroLead}</strong> ${C.privacyIntroBody}`;
/* The intro paragraph is the one extracted string that still holds a template
 * expression: the page builds it from static markup plus introExemptExplain.
 * Expanded here rather than pasted in as a literal, which is what this file did
 * until 2026-08-06, and how it came to be the one generator of four still
 * printing "Many adults are exempt from the work rules" after the phrase was cut.
 * See the longer note in copy-doc.js. */
for (const id of Object.keys(inline)) {
  inline[id] = inline[id].replace('${esc(RESULT_COPY.introExemptExplain)}', C.introExemptExplain);
}

/* ---- Text helpers ---- */

const UNESCAPE = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

/**
 * HTML to readable text. Links become markdown `[text](url)` so preview renders
 * them behind the words instead of printing the raw address inline.
 *
 * Emphasis is carried over rather than stripped. Where the screener bolds words
 * on screen it is doing something deliberate, and a reviewer approving the
 * sentence "You may be exempt and do not need to meet the ABAWD work rules"
 * should be able to see which half of it is shouting. Bold becomes `**`, italic
 * becomes `*`, which is what markdown renders them as.
 */
function plain(s, opts) {
  const keepLinks = !(opts && opts.dropLinks);
  return String(s)
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\$\{LINKS\.([A-Za-z0-9_]+)\}/g, (m, k) => S.LINKS[k] || m)
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g, keepLinks ? '[$2]($1)' : '$2')
    .replace(/<br\s*\/?>\s*<br\s*\/?>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<li>/g, '\n  - ')
    .replace(/<(strong|b)>([\s\S]*?)<\/\1>/g, (m, t, inner) => (inner.trim() ? '**' + inner.trim() + '**' : ''))
    .replace(/<(em|i)>([\s\S]*?)<\/\1>/g, (m, t, inner) => (inner.trim() ? '*' + inner.trim() + '*' : ''))
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z#0-9]+;/gi, m => (m in UNESCAPE ? UNESCAPE[m] : m))
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/** Wraps a string the page renders wholly in bold. */
const bold = (s) => '**' + plain(s) + '**';

const lines = [];
const w = (s) => lines.push(s === undefined ? '' : s);
const blank = () => lines.push('');

/** How every actual piece of the screener's wording is shown. */
function quote(text) {
  if (DOCS_MODE) {
    // Plain paragraphs: Google Docs would paste the "> " through as text.
    plain(text).split('\n').forEach(l => { if (l.trim()) w(l); });
    return;
  }
  plain(text).split('\n').forEach(l => w(l.trim() === '' ? '>' : '> ' + l));
}

/* ---- Narration ----
 *
 * Everything this document says in its own voice goes through here and comes out
 * italic. Nothing the screener says ever does.
 *
 * The reason is that a reader is being asked to approve wording, and the two
 * kinds of sentence sit inches apart on the page. Without a visible difference
 * between "the tool says this" and "here is what is going on", a line written to
 * walk someone through the flow reads as one more string to edit.
 *
 * Emitted as a single line however many arguments it is given, because italics
 * spanning a hard line break are not reliable across markdown renderers. Source
 * lines get long; nothing renders differently for it.
 *
 * Wrapped in underscores rather than asterisks. Several of these paragraphs open
 * with a bold phrase, and `*` + `**bold**` gives `***bold**`, which markdown
 * reads as an unclosed run and renders as literal asterisks. Underscores cannot
 * collide with the bold markers inside. */
function say(...parts) {
  const text = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (!text) return;
  /* A bare underscore in the narration would close the italics early. None of it
   * has one today; this is here so that adding one fails loudly rather than
   * producing a paragraph that renders half-italic. */
  if (/_/.test(text.replace(/`[^`]*`/g, ''))) {
    console.error('copy-walkthrough: narration contains an underscore outside backticks,');
    console.error('which would end the italics early: ' + text.slice(0, 90));
    process.exit(1);
  }
  w('_' + text + '_');
  blank();
}

function h2(t) { blank(); w('## ' + t); blank(); }
function h3(t) { blank(); w('### ' + t); blank(); }
function h4(t) { blank(); w('#### ' + t); blank(); }

/** The choices under a question, as a person sees them. */
function renderChoices(q, picked) {
  const isPicked = (id) => Array.isArray(picked) ? picked.indexOf(id) !== -1 : picked === id;
  if (q.type === 'yn') {
    w('- ' + plain(q.yesLabel || 'Yes') + (picked === 'yes' ? '   **← picked**' : ''));
    w('- ' + plain(q.noLabel || 'No') + (picked === 'no' ? '   **← picked**' : ''));
    return;
  }
  (q.options || []).forEach(o => {
    w('- ' + plain(o.label) + (isPicked(o.id) ? '   **← picked**' : ''));
  });
  if (q.noneLabel) w('- ' + plain(q.noneLabel) + (picked === S.NONE ? '   **← picked**' : ''));
}

/** A question with its explainer and its choices. */
function renderQuestion(q, picked) {
  w('**' + plain(q.text) + '**');
  blank();
  const help = q.helpHtml || q.help;
  if (help) { w(plain(help)); blank(); }
  if (q.listItems) { q.listItems.forEach(li => w('- ' + plain(li))); blank(); }
  renderChoices(q, picked);
  if (q.note) { blank(); w(plain(q.note)); }
  blank();
}

/* ---- The finished letter, as text ----
 * buildStatementHTML returns the real letter markup, the same string the print
 * and Word paths use. Converting that is the only way this document can show a
 * letter the tool would actually produce rather than a description of one.
 *
 * Done by turning closing block tags into line breaks and then stripping,
 * rather than by matching each block element. The closing part of the letter
 * nests divs (the signature area wraps a paragraph, the signature itself, and
 * two lines), and a lazy per-element match reads the outer div as ending at the
 * first inner </div>, which folded "Sincerely," into the paragraph above it and
 * put the signature after the printed name. */
const BULLET = ' ';

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
    // A drawn signature is an image; an unsigned letter prints a ruled line to
    // sign by hand, which is the route someone who cannot use the pad relies on.
    .replace(/<img [^>]*alt="Signature"[^>]*>/g, '\n[the signature they drew]\n')
    /* Matched on the 56px signature block, not on its colour. This read `border-bottom:1px solid
       #111` until 2026-08-07, when the letter's write-on lines moved to one weight, and the rule
       simply stopped matching: the signature line vanished from all six worked examples and
       nothing failed. Only the diff showed it. */
    .replace(/<div[^>]*height:56px[^>]*><\/div>/g, '\n__________________________\n')
    /* The ruled spans behind Printed name and Date signed, when those are left blank. */
    .replace(/<span[^>]*border-bottom[^>]*>&nbsp;<\/span>/g, '__________________________')
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

/** The letter someone gets, shown as a fenced block. */
function renderLetter(opts) {
  w('```');
  letterToText(S.buildStatementHTML(opts)).split('\n').forEach(l => w(l));
  w('```');
  blank();
}

/* ================================================================== */

w('# The SNAP work rules screener, start to finish');
blank();
say('Every word the tool says, in the order someone meets it, and then a set of worked',
  'examples showing exactly how the letter to DTA gets written.');

w('## How to read this');
blank();
say('One rule covers most of it: **anything in italics is explanation and is not part of the',
  'tool.** Everything else is wording the screener really shows, and is what you would be',
  'editing.');
if (DOCS_MODE) {
  say('This copy is set up for pasting into Google Docs, so the screener\'s wording is plain',
    'upright text rather than sitting in quote boxes. Italic still means explanation.');
}
w('| What you see | What it means |');
w('| --- | --- |');
w('| _Italic text_ | Explanation, written to walk you through. Not shown to anyone using the tool. |');
w(DOCS_MODE
  ? '| Upright text | Wording the tool shows, word for word. |'
  : '| > Text in a quote box | Wording the tool shows, word for word. |');
w(DOCS_MODE
  ? '| **Bold** | The tool shows those words in bold on the screen. |'
  : '| **Bold inside a quote** | The tool shows those words in bold on the screen. |');
w('| **A bold line, then a list** | A question, and the answers someone can choose between. |');
w('| **← picked** | In a worked example, the answer that person chose. |');
w('| A block in a fixed-width font | A finished letter, laid out the way DTA would receive it. |');
w('| `__________` in a letter | A line to sign by hand, when the person did not sign on screen. |');
w('| Version A | The tool as it works today: the person writes their own statement. |');
w('| Version B | The proposed version: the tool writes the statement from their answers. |');
blank();
say('Links are clickable behind the link text in markdown preview. Every outbound URL',
  'is also listed at the end of the document for checking.');

say('**This document is for reading.** There is a second one, `SCREENER-COPY.md`, which lists',
  'the same wording with a short code beside each piece. Those codes are how an edit gets back',
  'to the right place in the software, so that is the one to write changes into. This one has',
  'no codes in it and is meant to be read straight through.');
say('Both are generated from the tool itself, so neither can quietly fall out of step with',
  'what the screener actually says.');
say('A note on what this tool is not. It does not send anything to DTA, it does not change',
  'anyone\'s SNAP case, and it cannot confirm an exemption. It tells someone what their',
  'answers suggest and gives them a letter they can sign and send. Nothing anyone types',
  'leaves their own device.');

/* ---- The start ---- */

h2('Before anything else: the start page');

quote(inline.h1);
blank();
quote(inline.introSummary);
blank();
quote(inline.introNotice);
blank();
quote(inline.learnMoreIntro);
blank();
quote(inline.timeEstimate);
blank();
quote(inline.startButton);
blank();
quote(inline.privacyIntro);
blank();
quote(inline.dtaNote);

/* ---- The questions ---- */

h2('The questions');

quote(inline.answerAny);
blank();
say('Nothing is required, and clicking an answer a second time clears it. The questions come',
  'in four sections.');

const GROUPS = A.GROUPS;
GROUPS.forEach((g, i) => {
  h3('Section ' + (i + 1) + ' of 4: ' + g.title);
  g.ids.forEach(id => {
    const q = A.qById(id);
    if (!q) return;
    if (q.showIf) {
      const parent = A.qById(q.showIf.id);
      say('Only shown when the answer to "' + plain(parent.text) + '" is '
        + q.showIf.val.toUpperCase() + '.');
    }
    renderQuestion(q);
  });
});

h3('One more question, for some people');

say('Anyone who comes out exempt never sees this. It is only asked of someone the screening',
  'has not found an exemption for, because it is about missing hours rather than about not',
  'having to meet the rules in the first place.');
renderQuestion(A.GOODCAUSE);

/* ---- The four endings ---- */

h2('What someone is told at the end');

/* Five, not three. The age result arrived on 2026-08-06 and the housing review on 2026-08-07,
 * and neither was written up here: this document was still describing a tool with three endings.
 * A reader working through it would have met two screens in testing that the walkthrough does
 * not contain, which is the failure the whole document exists to prevent. */
say('There are five outcomes, and the wording of each is below. The first two are checked before',
  'the others, so they replace the rest rather than appearing alongside them.');

h3('1. You are exempt because of your age');

say('Reached by answering **No** to the age question, which ends the screening straight away.',
  'There is no letter on this screen: DTA already holds the date of birth, so there is nothing',
  'to tell them and nothing to sign.');
quote(C.ageExemptHeading);
blank();
quote(C.ageExemptBody);
blank();
say('And, for the case where DTA sent a notice anyway (the emphasis on *still* is the author\'s):');
quote(C.ageExemptNoticeLead + ' *' + C.ageExemptNoticeEmphasis + '* ' + C.ageExemptNoticeEnd
  + ' ' + S.LINKS.advocacyEmail + '.');
blank();

h3('2. You may be exempt');
// exemptHeadingHtml, not exemptHeading: the plain string loses the emphasis, and
// which half of this sentence is bold is a decision the author made.
quote(S.exemptHeadingHtml());
blank();
say('Followed by a checklist of the reasons that applied. Every reason the tool can name:');
/* Derived from the question and option definitions, not a hand-written list of answer sets. That
 * list had drifted twice over. It passed `{ stateagency: 'yes' }`, which is the archived yes/no
 * shape and produces nothing on the shipping build, so none of the five state agencies appeared
 * in this catalogue and neither did their proof note, which reads from the same set. And it named
 * one disability benefit out of seven. A benefit or agency added to the tool now reaches this
 * document without anyone remembering to come back here. */
const REASON_CASES = [];
A.QUESTIONS.forEach(q => { if (q.exemptOn) REASON_CASES.push({ [q.id]: q.exemptOn }); });
S.DISABILITY_OPTION_DEFS.filter(o => o.exempt).forEach(o => REASON_CASES.push({ disability: [o.id] }));
S.STATE_AGENCY_OPTION_DEFS.forEach(o => REASON_CASES.push({ stateagency: [o.id] }));
S.WORK_OPTION_DEFS.forEach(o => REASON_CASES.push({ working: o.id }));
REASON_CASES.push({ housing: 'no', housingFollowup: S.NONE });
const ALL_REASONS = new Set();
REASON_CASES.forEach(a => A.exemptReasons(a).forEach(r => ALL_REASONS.add(r)));
[...ALL_REASONS].forEach(r => w('- ' + r));
blank();
say('Some of them add a line about what to send DTA:');
/* Read through exemptProofNotes over every reason the tool can name, rather than listed here.
 * The hand-written list had three of the four keys and omitted exemptProofStateAgency, which is
 * the note someone getting services from MassAbility or DMH sees. It also skips the empty
 * housing note by itself, the same way the results card does. */
S.exemptProofNotes([...ALL_REASONS]).forEach(t => { quote(t); blank(); });
say('One reason carries a pointer to a different programme, indented under it on the screen:');
Object.keys(S.REASON_RESULT_NOTES).forEach(id => {
  const n = S.REASON_RESULT_NOTES[id];
  say('Under **' + plain(S.REASON_TEXT_BY_ID[id]) + '**:');
  quote(n.text + ' [' + n.linkLabel + '](' + n.href + ').');
  blank();
});
say('That line is on this screen only. It is not in the letter, because it is a suggestion to the',
  'person rather than anything DTA needs to read.');

h3('3. DTA needs to review your information');

say('Reached when the only thing the screening found is that the person has no regular place to',
  'sleep at night. The author\'s rule, 2026-08-07: no regular place to sleep is not an exemption',
  'the tool can conclude on its own, so this screen asks DTA to decide rather than telling the',
  'person they are exempt. Answer it alongside any other reason and the normal exempt screen',
  'above shows instead, with the housing reason listed among the others.');
say('There are two headings, and which one shows depends on whether the person ticked any of the',
  'housing follow-up answers. Nothing ticked:');
quote(C.housingReviewHeading);
blank();
say('One or more ticked, because those answers give DTA something to weigh:');
quote(C.housingReviewHeadingWithFactors);
blank();
say('Then the reason, with anything ticked indented under it, and one optional box:');
[...new Set(A.statementPrompts({ housing: 'no', housingFollowup: ['diploma'] }))].forEach(p => w('- ' + p));
blank();

h3('4. You may have a good reason for missing hours');
quote(C.goodCauseHeading);
blank();
quote(C.goodCauseIntro);
blank();
quote(C.goodCauseLead);
blank();
say('All three categories are listed, not only the one the person picked, because someone may',
  'recognise their situation in a different one:');
A.GOODCAUSE_CATEGORIES.forEach(cat => {
  w('**' + plain(cat.title) + '**');
  cat.detail.forEach(d => w(plain(d)));
  blank();
});

h3('5. You may need to meet the work rules');
quote(C.notExemptHeading);
blank();
quote(C.notExemptIntro);
blank();
say('Then the two ways to meet the rules. Both option headings are bold on the screen:');
quote(bold(C.workOption1));
blank();
// Was two raw '>' lines, which quote() never saw and which therefore survived
// into the Google Docs export as literal text. They are a sub-list on the page
// anyway, so this is what the screen actually shows.
w('- ' + plain(C.workOption1Unpaid));
w('- [' + plain(C.workOption1Training) + '](' + S.LINKS.dtaTraining + ')');
blank();
say('or');
quote(bold(C.workOption2));
blank();
say('and a reminder that a good reason for missing hours still counts. This one is a heading',
  'on the page, so it is bold there too:');
quote(bold(C.goodCauseInNotExemptBold));
blank();
quote(C.goodCauseInNotExemptBody);

/* ================================================================== */
/* The letter                                                          */
/* ================================================================== */

h2('The letter to DTA, and the two ways of writing it');

say('The first two outcomes, exempt and good reason, both end with a letter the person can',
  'print, download, or email, then sign and send to DTA. Everything about that letter is the',
  'same in both versions except the middle: the part in the person\'s own voice explaining',
  'their situation.');
say('**There are two versions of that middle part, and choosing between them is the open',
  'question this document exists to help with.**');
w('| | Version A: the person writes it | Version B: the tool writes it |');
w('| --- | --- | --- |');
w('| What they see | One empty box per exemption, with a prompt above it | Two or three multiple-choice questions, then the finished sentences |');
w('| What they type | A few sentences, in their own words | Nothing |');
w('| Extra questions | None | 2 to 5, on one screen before the results |');
w('| Also needed | Name, ID, signature | Name, ID, signature |');
w('| Shipping today | Yes | No, under review |');
blank();
say('Version A is the tool as it stands. Version B is the proposal. Both are on the review',
  'site now so they can be compared on the thing that actually matters: whether DTA would',
  'accept a statement written by the tool.');

h3('Version A: the person writes it');

say('The results screen says:');
quote(C.formTitleExempt);
blank();
quote(C.formLeadExempt);
blank();
quote(inline.privacyIntro);
blank();
say('Then a heading, and under it one empty box for each thing that needs explaining:');
quote(C.formExplainHeading);
blank();
say('Which boxes appear depends on why the person came out exempt. All of the prompts:');
const PROMPT_CASES = [
  {}, { health: 'yes' }, { caretaker: 'yes' }, { child6: 'yes' },
  { working: 'income_weekly' }, { disability: ['other'] },
  { housing: 'no', housingFollowup: S.NONE }, { goodcause: 'transport' }
];
const seenPrompts = new Set();
PROMPT_CASES.forEach(a => A.statementPrompts(a).forEach(p => seenPrompts.add(p)));
[...seenPrompts].forEach(p => w('- ' + p));
blank();
say('The last one on that list is worth pausing on. Someone exempt for a reason that needs no',
  'explaining, such as being pregnant, still gets a box, and the only prompt the tool has',
  'for them is "Explain your reasons in your own words" over an empty space.');

h3('Version B: the tool writes it');

say('Instead of a box, one extra screen before the results:');
quote(C.detailsStepHeading);
blank();
quote(C.detailsStepLead);
blank();
quote(C.detailsStepPrivacy);
blank();
say('Only the questions about that person\'s own exemption are asked, so most people see two',
  'or three. Someone exempt for a reason that speaks for itself is asked nothing at all and',
  'goes straight to the results with a finished letter.');
say('Then the results screen shows what was written, so nobody signs something they have not',
  'read:');
quote(C.composedFormLeadExempt);
blank();
quote(inline.privacyIntro);
blank();
quote(C.composedStatementHeading);
blank();
say('...the sentences, and then a way back:');
quote(C.composedChangeLabel);
blank();
say('**Two rules the tool follows when it writes.** Nothing is invented: a skipped question',
  'drops its sentence rather than filling it in with something likely. And every question',
  'has one way to decline, which produces a shorter true sentence rather than a blank.');

/* ---- Worked examples ---- */

h2('How the letter gets written, step by step');

say('Six people, each shown all the way through: what they clicked, what each click added to',
  'the letter, and the letter they end up with. Every sentence below was produced by running',
  'the real tool, not written by hand.');
w('Dates are fixed at ' + TODAY_LABEL + ' so this document does not change on its own.');

/* What the person answered, derived from the answers rather than typed out.
 *
 * Each example used to carry a screeningSaid array quoting the question and the answer label.
 * They were hand-copied, and they drifted: the transport line read "Yes, my ride broke down"
 * with a comma while the option in the code carried an em dash, so this document misquoted the
 * tool until the code happened to change to match on 2026-08-06. Everything else in this file is
 * read from the module; there was no reason for these to be the exception.
 *
 * No separator between the question and the answer. Question text already ends in "?" or ":",
 * which does the job, and the em dash that used to sit there is against the house style anyway.
 */
function screeningSaid(answers) {
  return Object.keys(answers).map(id => {
    const q = A.qById(id);
    if (!q) return null;
    const v = answers[id];
    let said;
    if (v === S.NONE) said = q.noneLabel;
    else if (Array.isArray(v)) {
      said = v.map(x => ((q.options || []).find(o => o.id === x) || {}).label).filter(Boolean).join(', ');
    } else if (q.type === 'yn') {
      said = v === 'yes' ? (q.yesLabel || 'Yes') : (q.noLabel || 'No');
    } else {
      said = ((q.options || []).find(o => o.id === v) || {}).label;
    }
    return said ? plain(q.text) + ' **' + plain(said) + '**' : null;
  }).filter(Boolean);
}

const EXAMPLES = [
  {
    name: 'Someone with a health condition',
    note: 'The most common exemption, and the one with the most to explain.',
    screening: { health: 'yes' },
    picks: { d_health_kind: 'physical', d_health_length: 'long', d_health_care: 'regularly' },
    person: 'Jordan Rivera'
  },
  {
    name: 'Someone caring for a parent',
    note: 'Shows how the sentence names who is cared for without asking anything identifying.',
    screening: { caretaker: 'yes' },
    picks: { d_care_who: 'adult', d_care_often: 'daily', d_care_alone: 'alone' },
    person: 'Alex Chen'
  },
  {
    name: 'Someone working part time',
    note: 'The proof question matters here: DTA wants documents, and the letter should only promise the ones the person actually has.',
    screening: { working: 'income_weekly' },
    picks: { d_work_hours: 'h20_29', d_work_jobs: 'one', d_work_proof: ['paystubs', 'employer_letter'] },
    person: 'Sam Okafor'
  },
  {
    name: 'Someone with no regular place to sleep',
    note: 'Several answers at once, composed as separate sentences rather than a list.',
    screening: { housing: 'no', housingFollowup: S.NONE },
    picks: { d_housing_where: 'shelter', d_housing_barriers: ['no_address', 'no_transport'] },
    person: 'Riley Santos'
  },
  {
    name: 'Someone who missed hours because their car broke down',
    note: 'The only case where the tool names dates. Note that the questions say "last month", never a month name, so this wording does not change over time.',
    screening: { goodcause: 'transport' },
    picks: { d_gc_what: 'car_broke', d_gc_when: ['this_month', 'last_month'], d_gc_now: 'still' },
    person: 'Dana Whitfield'
  },
  {
    name: 'Someone who is pregnant',
    note: 'Nothing needs explaining, so nothing is asked. This is the clearest difference between the two versions: in Version A this person gets an empty box under "Explain your reasons in your own words".',
    screening: { pregnant: 'yes' },
    picks: {},
    person: 'Casey Brooks'
  }
];

/* The little bold run-in headings inside an example are this document's own
 * words, not the tool's, so by the rule stated in the legend they are italic
 * too. Bold as well, because they are what someone scanning uses to find their
 * place. */
const label = (t) => say('**' + t + '**');

EXAMPLES.forEach((ex, n) => {
  h3('Example ' + (n + 1) + ': ' + ex.name);
  say(ex.note);

  label('What they answered in the screening');
  screeningSaid(ex.screening).forEach(line => w('- ' + line));
  blank();

  const rt = A.resultType(ex.screening);
  const rs = A.exemptReasons(ex.screening);
  label('Which gives');
  if (rt === 'exempt') {
    say('The exempt result, listing:');
    rs.forEach(r => w('- ' + r));
  } else if (rt === 'goodcause') {
    say('The good-reason result:');
    w('- ' + A.goodCauseText(ex.screening));
  }
  blank();

  const guided = A.guidedQuestions(ex.screening);
  if (!guided.length) {
    label('What Version B asks next');
    say('Nothing. There is nothing here that needs explaining to DTA, so the letter is already',
      'finished and this person goes straight to it.');
  } else {
    label('What Version B asks next, and what each answer writes');
    say('The letter is built up one answer at a time. After each question, what is shown is the',
      'whole statement so far, not only the part that answer added, so you can watch it grow.');

    const running = { ...ex.screening };
    guided.forEach(q => {
      const picked = ex.picks[q.id];
      w('**' + plain(q.text) + '**');
      blank();
      renderChoices(q, picked);
      blank();
      if (picked === undefined) {
        say('Not answered, so nothing is added.');
        return;
      }
      running[q.id] = picked;
      const soFar = A.composeStatement(running, TODAY).map(e => e.text).join(' ');
      say('The letter now reads:');
      quote(soFar);
      blank();
    });
  }

  const explain = A.composeStatement({ ...ex.screening, ...ex.picks }, TODAY);
  label('The letter they get');
  renderLetter({
    name: ex.person,
    agency: '',
    explain,
    rt,
    rs,
    gcText: A.goodCauseText(ex.screening),
    composed: true,
    today: TODAY_LABEL
  });

  const boxes = A.statementPrompts(ex.screening).length;
  say('In Version A, the same person sees ' + (boxes === 1 ? 'one empty box' : boxes + ' empty boxes')
    + ' instead, under:');
  A.statementPrompts(ex.screening).forEach(p => w('- ' + p));
  blank();
});

/* ---- The honest weak spot ---- */

h2('Where the multiple-choice version is worse');

say('One case is worth deciding on deliberately rather than discovering later.');
say('When someone says they get a disability benefit that was not on the screening list, the',
  'write-in version asks them to name it, and can take any answer. A multiple-choice list',
  'cannot hold every disability payment there is, so it offers the common ones and then has',
  'to fall back. Naming one:');
quote(A.composeStatement({ disability: ['other'], d_disability_other: 'masshealth' }, TODAY)[0].text);
blank();
say('and not naming one:');
quote(A.composeStatement({ disability: ['other'], d_disability_other: S.NONE }, TODAY)[0].text);
blank();
say('The second is weaker than what a written answer could have said. The choices offered',
  'before it gets there:');
const disabilityQ = A.guidedQuestions({ disability: ['other'] })[0];
renderChoices(disabilityQ);
blank();
say('If DTA would rather have the name in every case, this is the one place to keep a box.');

/* ---- Skipping ---- */

h2('What happens when someone skips the questions');

say('Every question in the tool is optional, including these, so the letter has to hold up',
  'when they are left alone. It does this by dropping sentences, never by guessing.');
say('Someone who answers the health question in the screening and then skips all three',
  'follow-ups still gets a true letter:');
quote(A.composeStatement({ health: 'yes' }, TODAY).map(e => e.text).join(' '));
blank();
say('Answering only the first of the three:');
quote(A.composeStatement({ health: 'yes', d_health_kind: 'physical' }, TODAY).map(e => e.text).join(' '));
blank();
say('And all three:');
quote(A.composeStatement({ health: 'yes', d_health_kind: 'physical', d_health_length: 'long', d_health_care: 'regularly' }, TODAY).map(e => e.text).join(' '));
blank();
say('The same holds for choosing "I would rather not say", which is offered on the questions',
  'where someone might not want to answer. It produces the shorter sentence, not a gap.');

/* ---- Every sentence, for reference ---- */

h2('Every sentence the tool can write');

say('The full set, for anyone who wants to read the wording without walking through an example',
  'to reach it. Each is shown with every question answered, which is its longest form.');

const ALL_BLOCKS = [
  { label: 'A health reason', answers: { health: 'yes', d_health_kind: 'both', d_health_length: 'long', d_health_care: 'regularly' } },
  { label: 'Caring for someone', answers: { caretaker: 'yes', d_care_who: 'more', d_care_often: 'most_days', d_care_alone: 'shared' } },
  { label: 'Caring for a child under 6', answers: { child6: 'yes', d_child6_live: 'yes', d_child6_often: 'daily' } },
  { label: 'Working', answers: { working: 'income_weekly', d_work_hours: 'h30plus', d_work_jobs: 'more', d_work_proof: ['paystubs', 'employer_letter', 'schedule'] } },
  { label: 'Working, but needs help getting proof', answers: { working: 'hours_30', d_work_hours: 'varies', d_work_proof: ['need_help'] } },
  { label: 'Another disability benefit', answers: { disability: ['other'], d_disability_other: 'private' } },
  { label: 'No regular place to sleep', answers: { housing: 'no', housingFollowup: S.NONE, d_housing_where: 'outside', d_housing_barriers: ['no_address', 'no_storage', 'no_transport', 'health', 'moving', 'unsafe'] } },
  { label: 'A good reason: transportation', answers: { goodcause: 'transport', d_gc_what: 'transit', d_gc_when: ['last_month'], d_gc_now: 'over' } },
  { label: 'A good reason: an emergency', answers: { goodcause: 'emergency', d_gc_what: 'caregiving', d_gc_when: ['this_month'], d_gc_now: 'still' } },
  { label: 'A good reason: a job situation', answers: { goodcause: 'employment', d_gc_what: 'discrimination', d_gc_when: ['longer'], d_gc_now: 'still' } }
];

ALL_BLOCKS.forEach(b => {
  w('**' + b.label + '**');
  blank();
  quote(A.composeStatement(b.answers, TODAY).map(e => e.text).join(' '));
  blank();
});

/* ---- What still has to be filled in ---- */

h2('What the person still has to do themselves');

say('Neither version can write these, and neither tries to.');
quote(inline.nameLabel);
blank();
/* On the printed letter only since 2026-08-06: the on-screen field went, and the letter
   carries a blank with a hint about where to find the number. */
quote(S.STATEMENT_AGENCY_LABEL);
blank();
say(S.STATEMENT_AGENCY_HINT);
blank();
quote(inline.sigLabel);
blank();
quote(inline.sigAlt);
blank();
say('The signature is drawn with a finger or a mouse, which means someone using a keyboard, a',
  'switch, or a screen reader cannot sign in the browser. When the box is left empty the',
  'printed letter has a ruled line to sign by hand instead, which is what the last sentence',
  'above is telling them.');

/* ---- Numbers ---- */

h2('The numbers behind the work question');

say('Not wording, but they decide who comes out exempt and they appear in the questions. Last',
  S.THRESHOLD_SOURCE,
  '2026, so the article is newer than the tool.');
w('| What | Value |');
w('| --- | --- |');
w('| Weekly earnings that make someone exempt | $' + S.WORK_INCOME_THRESHOLD + ' |');
w('| Massachusetts minimum wage used | $' + S.MA_MIN_WAGE + ' an hour |');
w('| Hours a week at minimum wage that make someone exempt | ' + S.WORK_HOURS_AT_MIN_WAGE + ' |');
w('| Hours a week that count as meeting the rules | ' + S.WORK_HOURS_COMPLIANCE + ' |');
blank();

h2('Where the tool sends people');

say('Every outbound link, worth checking that each still goes somewhere useful.');
Object.entries(S.LINKS).forEach(([, url]) => {
  w('- ' + url);
});
blank();

w('---');
blank();
say('Generated from the screener itself by `scripts/copy-walkthrough.js`. Re-running it after a',
  'change updates this document, and the build fails if that has not happened, so nothing',
  'here can quietly describe a version of the tool that no longer exists.');

fs.writeFileSync(OUT, lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n', 'utf8');
console.log('Wrote ' + path.relative(ROOT, OUT).split(path.sep).join('/'));
console.log('  ' + EXAMPLES.length + ' worked examples, ' + ALL_BLOCKS.length + ' sentences');

/* Both outputs from the one command.
 *
 * The --docs variant is written to _local/, which is untracked, so neither `git status` nor the
 * CI job that regenerates every generated file and diffs it can see that one fall behind. It is
 * the only generated document in this repository with nothing watching it, and on 2026-08-07 it
 * turned out to be four days and 219 lines stale: no housing review, no EAEDC note, missing two
 * of the five endings and every state agency reason. Somebody could have pasted that into a
 * Google Doc and reviewed a tool that no longer exists.
 *
 * DOCS_MODE changes the content in several places, not just the filename, so the document has to
 * be built twice. A second pass in a child process is the smallest way to do that without
 * restructuring the whole script into a function. `--docs` on its own still works for anyone who
 * wants only that file, and the child cannot recurse because it is the one running with the flag. */
if (!DOCS_MODE) {
  require('child_process').execFileSync(process.execPath, [__filename, '--docs'], { stdio: 'inherit' });
}
