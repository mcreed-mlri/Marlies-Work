#!/usr/bin/env node
/**
 * Generates SCREENER-COPY.md: every user-facing string in the shipping screener,
 * in the order someone answering the questions meets it.
 *
 * Generated rather than hand-written so the review document cannot drift from
 * the code. Run it again after applying edits and the diff shows exactly what
 * changed.
 *
 *   "$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" scripts/copy-doc.js
 *
 * Copy lives in two places. Most of it is in snap-screening-logic.js and is read
 * straight from the module. A handful of strings are inline in the page markup
 * and have no key, so they are pulled out of the HTML by pattern. A pattern that
 * stops matching is a hard error, not a silent omission.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
/* Read from the build that ships, not the preview. They share the same copy
 * except for the chrome and the footer, and the footer only exists here. */
const HTML = path.join(ROOT, 'masslegalhelp', 'index.html');
const OUT = path.join(ROOT, 'SCREENER-COPY.md');
const VARIANT = 'classic2';

const S = require(path.join(ROOT, 'court-forms', 'snap-screening-logic.js'));
const A = S.create(VARIANT);
const C = S.RESULT_COPY;

/* ---- Questions still open for the author. Keyed by copy id so each one
 * prints next to the text it is about, instead of in a list at the end. ---- */
const OPEN = {
  'page.answerAny': 'Applied: this now shows above group 1 only, per your note that it "only needs to be said once in section 1." It used to repeat above all four groups.',
  'page.privacyIntro': 'Your edit replaced this sentence. Separately, the note "Remove before you start question" is ambiguous: remove this paragraph from the start page, or something else?',
  'page.sigNote': 'Your note read "remove dta needs your actual signature line on all the results pages." That reads two opposite ways: delete this sentence, or add a signature line. Which?',
  privacyNote: 'Applying your edit literally leaves the clause twice: "MLRI will not save any personal information you type on this form. save the information you type on this form." Confirm it should end after the first sentence.',
  goodCauseIntro: 'Is "work, school, or volunteer hours" replacing the old sentence, or inserting into it? In other words, does it end at "volunteer hours." or continue "...volunteer hours before or after your start date."?',
  goodCauseInNotExemptIntro: 'This is a second copy of the good cause sentence, shown on the "may need to meet the work rules" screen. Your note did not mention it. Should it change the same way?',
  formTitleGoodCause: 'This looked struck through in your doc, with its meaning folded into the sentence below it. Delete the heading entirely?',
  formTitleExempt: 'If the good cause heading goes, should this matching one go too?',
  formLeadExempt: 'Your doc says "fill out this form" where this says "fill in the blanks below." Change it?',
  whyInfoGoodCause: 'The wording in your doc reads "Telling DTA about your why you missed hours." The exempt version is "Telling DTA about your exemption," so the extra "your" looks like a typo. Confirm and we will drop it.',
  ageInfoBody: 'This says "not between 18 and 64." The MLRI ABAWD article on MassLegalHelp, reviewed February 2026, says "between 18 and 65 years old." Which is right?',
  exemptReasonsIntro: 'Already applied: emptied, because the heading above now ends with "because of these reasons:" and this said it a second time.',
};

/* ---- Strings inline in the page markup. Each must match exactly once. ---- */
const INLINE = [
  { id: 'page.h1', re: /<h1 class="h1">([^<]+)<\/h1>/ },
  { id: 'page.introSummary', re: /<p [^>]*>(Some adults on SNAP[\s\S]*?)<\/p>/ },
  { id: 'page.introNotice', re: /<p [^>]*>(You only have to meet these rules[\s\S]*?)<\/p>/ },
  { id: 'page.introLostSnap', re: /<p [^>]*>(If you lost your SNAP because of the work rules[\s\S]*?)<\/p>/ },
  { id: 'page.moreSummary', re: /<summary [^>]*>(More on the SNAP ABAWD work rules)<\/summary>/ },
  { id: 'page.moreDetails1', re: /<p style="margin:0 0 10px">(Everyone has a different life situation[\s\S]*?)<\/p>/ },
  { id: 'page.moreDetails2', re: /<p style="margin:0">(To learn more about the ABAWD work rules[\s\S]*?)<\/p>/ },
  { id: 'page.timeEstimate', re: /<p [^>]*>(This short screening asks[\s\S]*?)<\/p>/ },
  { id: 'page.privacyIntro', re: /<p [^>]*>(<strong>Your information is private<\/strong>[\s\S]*?)<\/p>/ },
  { id: 'page.beforeYouStart', re: /<legend[^>]*>(Before you start)<\/legend>/ },
  { id: 'page.ageQuestion', re: /<p id="age-q"[^>]*>([^<]+)<\/p>/ },
  { id: 'page.startHeading', re: /<h2 class="h2"[^>]*>(Check if the SNAP work rules apply to you\.)<\/h2>/ },
  { id: 'page.startButton', re: />(Fill out the form[^<]*)<\/button>/ },
  { id: 'page.answerAny', re: /<p [^>]*>(Answer any that apply to you\. Every question is optional\.)<\/p>/ },
  { id: 'page.sigNote', re: /<p id="sig-note"[^>]*>(\([^<]+\))<\/p>/ },
  // Buttons and navigation
  { id: 'btn.next', re: /nextLabel = [^?]+\? '[^']+' : '([^']+)'/ },
  { id: 'btn.seeResults', re: /nextLabel = [^?]+\? '([^']+)'/ },
  { id: 'btn.skipToResults', re: />(Skip to results)</ },
  { id: 'btn.startOver', re: />([^<]{0,4}Start over)</ },
  { id: 'btn.deleteAnswers', re: />(Delete my answers)</ },
  // Warnings and inline notes
  { id: 'page.skippedWarning', re: />(If you skipped questions[^<]+)</ },
  { id: 'page.learnMoreIntro', re: />(Learn more about the SNAP ABAWD work rules)</ },
  // The printable statement
  { id: 'statement.docTitle', re: /<title>(SNAP Work Rules Statement)<\/title>/ },
  { id: 'statement.nameLabel', re: />(Your name)</ },
  { id: 'statement.agencyLabel', re: />(Client \/ Agency ID \(if you have one\))</ },
  { id: 'statement.sigLabel', re: />(Signature)</ },
  { id: 'statement.sigHint', re: /id="sig-hint"[^>]*>([^<]+)</ },
  { id: 'hint.signatures.title', re: /hintTip\('sig', '([^']+)'/ },
  { id: 'hint.signatures.body', re: /hintTip\('sig', '[^']+', '((?:[^'\\]|\\.)+)'/ },
  // Chrome and footer. These are not the author's; see the flagged section.
  { id: 'chrome.tabTitle', re: /<title>(SNAP Work Rules Screening[^<]*)<\/title>/ },
  { id: 'chrome.wordmark', re: /class="topbar-title">([^<]+)</ },
  { id: 'chrome.tagline', re: /class="topbar-sub">([^<]+)</ },
  { id: 'chrome.quickExit', re: /data-action="quick-exit"[^>]*>([^<]+)</ },
  { id: 'footer.disclaimer', re: /<p style="font-size:13\.5px[^>]*>\s*([\s\S]*?)\s*<\/p>/ },
  { id: 'footer.byline', re: />\s*(Written by the Massachusetts Law Reform Institute\.)\s*</ }
];

/* Copy that came from the developer rather than the author. Flagged separately
 * because the project rule is that author copy outranks editorial instinct, and
 * these were written to fill a gap, not handed over for review. */
const DEVELOPER_WRITTEN = new Set([
  'chrome.tabTitle', 'chrome.wordmark', 'chrome.tagline', 'chrome.quickExit',
  'footer.disclaimer', 'footer.byline'
]);

const html = fs.readFileSync(HTML, 'utf8');
const inline = {};
const missing = [];
for (const item of INLINE) {
  const m = html.match(item.re);
  if (!m) { missing.push(item.id); continue; }
  inline[item.id] = m[1];
}
if (missing.length) {
  console.error('copy-doc: these inline patterns no longer match ' + path.basename(HTML) + ':');
  missing.forEach(id => console.error('  ' + id));
  console.error('Fix the patterns in scripts/copy-doc.js rather than shipping a document with gaps.');
  process.exit(1);
}

/* ---- Rendering helpers ---- */

// Turn the help strings' HTML into readable markdown. Links become [text](url)
// so a reviewer can see where each one points.
function toMarkdown(s) {
  return String(s)
    // Collapse the newlines and indentation that come from how the HTML source
    // is wrapped. Must run before the <br> handling below, which is what carries
    // the breaks the reader is actually meant to see.
    .replace(/\s*\n\s*/g, ' ')
    // The page markup writes links as ${LINKS.key}. Resolve them so a reviewer
    // sees the real destination instead of the placeholder.
    .replace(/\$\{LINKS\.([A-Za-z0-9_]+)\}/g, (m, k) => S.LINKS[k] || m)
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
    .replace(/<br\s*\/?>\s*<br\s*\/?>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/?strong>/g, '**')
    .replace(/<[^>]+>/g, '')
    .trim();
}

const lines = [];
const w = s => lines.push(s);
const blank = () => lines.push('');

/* Emit text as a blockquote. A blank line inside one has to carry the ">" too,
 * or markdown ends the quote; and an indented continuation would render as a
 * code block, which is what this used to do. */
function quote(text) {
  toMarkdown(text).split('\n').forEach(l => w(l.trim() === '' ? '>' : '> ' + l));
}

function openNote(id) {
  if (!OPEN[id]) return;
  w('> **Question for you:** ' + OPEN[id]);
  blank();
}

// One piece of copy: its id, the text, and any open question about it.
function item(id, text, opts) {
  const o = opts || {};
  const body = toMarkdown(text);
  const flag = DEVELOPER_WRITTEN.has(id) ? '  **[written by the developer, not you]**' : '';
  w('**`' + id + '`**' + (o.note ? '  (' + o.note + ')' : '') + flag);
  blank();
  if (body === '') {
    w('*(currently empty)*');
  } else {
    quote(text);
  }
  blank();
  openNote(id);
}

/* Auto-numbered. Sections get inserted and reordered as more copy turns up, and
 * hand-maintained numbers went stale immediately. Any number a caller passes is
 * stripped and replaced. */
let sectionNo = 0;
function section(title) {
  sectionNo += 1;
  blank();
  w('## ' + sectionNo + '. ' + title.replace(/^\d+\.\s*/, ''));
  blank();
}
function sub(title) { w('### ' + title); blank(); }

/* ---- Header ---- */

w('# SNAP ABAWD screener: all copy');
blank();
w('Every word the screener shows, in the order someone answering the questions meets');
w('it. Generated from the code, so it is what the tool actually says today, not a');
w('description of it.');
blank();
w('**How to edit this.** Change the text under any heading. Leave the `code.name` in');
w('backticks alone: that is how each piece of text is found in the code, and it is the');
w('only thing keeping your edit from landing in the wrong place. Add a comment anywhere');
w('you want to; nothing here has to stay tidy.');
blank();
w('Places where an earlier edit was unclear are marked **Question for you**. Those are');
w('the ones holding up the rest of the work.');
blank();
w('Legal accuracy is not settled here. The income and hour thresholds below were last');
w('checked in November 2025, and the MLRI ABAWD article on MassLegalHelp was reviewed in');
w('February 2026, so the article is newer than the tool. Someone has to reconcile the two.');
blank();
w('Generated by `scripts/copy-doc.js`, reading the build that ships to MassLegalHelp');
w('(`masslegalhelp/index.html`) and the shared decision logic. If a string is on the page,');
w('it should be in here; if you spot something missing, that is a bug in the generator and');
w('worth telling me about.');

/* ---- Start page ---- */

section('1. Start page');

['page.h1', 'page.introSummary', 'page.introNotice', 'page.introLostSnap']
  .forEach(id => item(id, inline[id]));

w('A collapsed "More on the SNAP ABAWD work rules" panel sits here:');
blank();
['page.moreSummary', 'page.moreDetails1', 'page.moreDetails2']
  .forEach(id => item(id, inline[id]));

['page.timeEstimate', 'page.privacyIntro', 'page.beforeYouStart', 'page.ageQuestion']
  .forEach(id => item(id, inline[id]));

w('The age question offers Yes and No. Answering it enables the button below.');
blank();
w('**There is no Terms of Use text on this page today.** Other versions of the tool have a');
w('checkbox someone must tick before starting; this one does not. If the published version');
w('needs one, its wording has to come from you, and it has to match whichever site hosts');
w('the tool.');
blank();
['page.startHeading', 'page.startButton'].forEach(id => item(id, inline[id]));

w('A link sits at the bottom of the start page, under the button:');
blank();
item('page.learnMoreIntro', inline['page.learnMoreIntro']);

/* ---- Questions ---- */

section('2. The questions');

w('Sixteen questions in four groups. Every question is optional. Two of them appear only');
w('in certain cases: the housing follow-up shows if someone answers No to the housing');
w('question, and the good cause question in section 3 is skipped when the answers already');
w('point to an exemption.');
blank();
item('page.answerAny', inline['page.answerAny'], { note: 'above group 1 only' });

A.GROUPS.forEach((g, gi) => {
  sub('Group ' + (gi + 1) + ': ' + g.title);
  g.ids.forEach(id => {
    const q = A.Q_BY_ID[id];
    if (!q) return;
    const kind = q.type === 'yn' ? 'Yes / No'
      : q.type === 'multi' ? 'Check all that apply'
      : q.type === 'single' ? 'Pick one'
      : q.type;
    let note = kind;
    if (q.showIf) note += '; shown only if `' + q.showIf.id + '` is "' + q.showIf.val + '"';
    if (q.exemptOn) note += '; "' + q.exemptOn + '" points to an exemption';
    item('q.' + q.id, q.text, { note });

    if (q.yesLabel) { w('Yes button reads: ' + q.yesLabel); blank(); }
    const help = q.helpHtml || q.help;
    if (help) {
      w('Help text, shown when someone opens the explainer:');
      blank();
      quote(help);
      blank();
    }
    if (q.options) {
      w('Options:');
      blank();
      q.options.forEach(o => w('- ' + toMarkdown(o.label)));
      if (q.noneLabel) w('- ' + q.noneLabel + '  *(the none-of-these option)*');
      blank();
    }
  });
});

/* ---- Good cause ---- */

section('3. The good cause question');

const GC = A.GOODCAUSE;
item('goodcause.text', GC.text, { note: 'asked last, and skipped when an exemption already applies' });
if (GC.help) { w('Help text:'); blank(); toMarkdown(GC.help).split('\n').forEach(l => w('> ' + l)); blank(); }
w('Options:');
blank();
GC.options.forEach(o => w('- **`goodcause.' + o.id + '`**  ' + toMarkdown(o.label)));
if (GC.noneLabel) w('- ' + GC.noneLabel + '  *(the none-of-these option)*');
blank();
w('Each answer also has a longer phrase used on the results screen and in the printable');
w('statement:');
blank();
Object.entries(A.GC_TEXT).forEach(([k, v]) => {
  w('- **`gcText.' + k + '`**  ' + toMarkdown(v));
});
blank();

/* ---- Moving through the questions ---- */

section('Moving through the questions');

w('Short strings, but people read them at the moment they decide what to do next.');
blank();
['btn.next', 'btn.seeResults', 'btn.skipToResults', 'btn.startOver', 'btn.deleteAnswers']
  .forEach(id => item(id, inline[id]));
w('And one warning on the results, if someone left questions blank:');
blank();
item('page.skippedWarning', inline['page.skippedWarning']);

/* ---- Results, shared ---- */

section('Results: shared wording');

w('Four results are possible. This block appears on more than one of them.');
blank();
['resultsHeadTitle', 'resultsHeadLead', 'learnMoreLabel', 'privacyNote', 'printLead',
  'lostSnapIntro'].forEach(k => item(k, C[k]));

/* ---- Result screens ---- */

section('5. Result: you may be exempt');
['exemptHeading', 'exemptReasonsIntro'].forEach(k => item(k, C[k]));
w('Under the heading, the screener lists the reasons the answers point to. Each reason');
w('phrase comes from the question that produced it. Then, when relevant, one of these:');
blank();
['exemptProofWork', 'exemptProofHousing', 'exemptProofDisability'].forEach(k => item(k, C[k]));

section('6. Result: you may have a good reason for missing hours');
['goodCauseHeading', 'goodCauseIntro', 'goodCauseLead'].forEach(k => item(k, C[k]));
w('The categories listed on this screen:');
blank();
A.GOODCAUSE_CATEGORIES.forEach(cat => {
  w('- **' + cat.title + '**  ' + cat.detail.map(toMarkdown).join(' '));
  w('  More examples link: ' + (cat.moreExamplesUrl
    ? cat.moreExamplesUrl
    : '**none set.** The link is missing for this category and currently has nowhere to go.'));
});
blank();

section('7. Result: you may need to meet the work rules');
['notExemptHeading', 'notExemptIntro', 'workRulesHeading', 'workOption1', 'workOption1Unpaid',
  'workOption1Training', 'workOption2', 'meetingDtaHeading', 'meetingDtaPaid',
  'meetingDtaStatement', 'goodCauseInNotExemptBold', 'goodCauseInNotExemptIntro',
  'goodCauseInNotExemptBody', 'goodCauseInNotExemptLink', 'notExemptStartOver',
  'notExemptReapplyLead', 'notExemptReapplyLink', 'notExemptReapplyEnd', 'notExemptSnapBack',
  'notExemptEmail', 'notExemptEmailSuffix'].forEach(k => item(k, C[k]));

section('8. Result: these rules may not apply to your age group');
['ageInfoHeading', 'ageInfoBody'].forEach(k => item(k, C[k]));

/* ---- The statement ---- */

section('9. The printable "Tell DTA" statement');

w('Shown on the exempt and good cause results. Someone fills in the blanks, signs it, and');
w('mails, faxes, or uploads it to DTA.');
blank();
item('statement.docTitle', inline['statement.docTitle'], { note: 'the printed page title' });
['formTitleExempt', 'formTitleGoodCause', 'formLeadExempt', 'formLeadGoodCause',
  'formExplainHeading'].forEach(k => item(k, C[k]));

/* The prompt above the writing box changes with the answers, so listing only one
 * would hide most of this copy from review. */
w('The prompt above the box someone writes in depends on why they came out exempt.');
w('All of them:');
blank();
const PROMPT_CASES = [
  {}, { child14: 'yes' }, { pregnant: 'yes' },
  { housing: 'no', housingFollowup: ['diploma'] },
  { working: 'income_weekly' }, { working: 'hours_30' },
  { disability: ['other'] }, { goodcause: 'transport' }, { goodcause: S.NONE }
];
const prompts = new Set();
PROMPT_CASES.forEach(a => A.statementPrompts(a).forEach(p => prompts.add(p)));
[...prompts].forEach(p => w('- ' + p));
blank();

w('The fields someone fills in:');
blank();
['statement.nameLabel', 'statement.agencyLabel', 'statement.sigLabel', 'statement.sigHint']
  .forEach(id => item(id, inline[id]));
item('page.sigNote', inline['page.sigNote'], { note: 'under the signature pad' });
w('An explainer opens next to the signature box:');
blank();
['hint.signatures.title', 'hint.signatures.body'].forEach(id => item(id, inline[id]));
['whyInfoLabel', 'whyInfoExempt', 'whyInfoGoodCause'].forEach(k => item(k, C[k]));

section('Printing, saving, and email');
['printFormLabel', 'downloadWordLabel', 'savingTipsTitle', 'savingTipsBody', 'emailSelfLabel',
  'emailSelfSubject', 'emailFallbackHeading', 'emailFallbackBody', 'emailCopyLabel',
  'emailCopiedLabel', 'emailSelectedLabel', 'emailTruncatedNote'].forEach(k => item(k, C[k]));

section('11. Other ways to reach DTA');
['otherWaysHeading', 'otherWaysExemptLead', 'otherWaysGoodCauseLead', 'waysToReachDta']
  .forEach(k => item(k, C[k]));
w('The contact details shown, which are real and worth checking:');
blank();
w('- DTA Assistance Line: ' + S.DTA_SUBMISSION.phone);
w('- DTA Connect: ' + S.DTA_SUBMISSION.connectUrl);
w('- Mail: ' + S.DTA_SUBMISSION.mail);
w('- Fax: ' + S.DTA_SUBMISSION.fax);
blank();

/* ---- Thresholds ---- */

section('Numbers the screening depends on');

w('Not copy, but they appear in the wording of the work question and decide who comes out');
w('exempt. Last checked November 2025.');
blank();
w('| What | Value |');
w('|---|---|');
w('| Weekly earnings that make someone exempt | $' + S.WORK_INCOME_THRESHOLD + ' before taxes |');
w('| Massachusetts minimum wage | $' + S.MA_MIN_WAGE + ' an hour |');
w('| Hours a week at minimum wage that make someone exempt | ' + S.WORK_HOURS_AT_MIN_WAGE + ' |');
w('| Hours a week that count while earning under minimum wage | ' + S.WORK_HOURS_COMPLIANCE + ' |');
blank();

/* ---- Copy the developer wrote, called out rather than blended in ---- */

section('Copy the developer wrote, which needs your approval');

w('Everything above came from you or from the earlier MLRI draft. The strings in this');
w('section did not. They were written to fill gaps while building the MassLegalHelp version,');
w('and they are on the page right now, so they need your review the same as anything else.');
w('The disclaimer is the one to look at hardest: it makes a claim about what this tool is');
w('and is not, which is not a developer\'s call to make.');
blank();
['chrome.tabTitle', 'chrome.wordmark', 'chrome.tagline', 'chrome.quickExit',
  'footer.disclaimer', 'footer.byline'].forEach(id => item(id, inline[id]));

w('The footer also links out to three places. Wording is ours, destinations are real pages');
w('on MassLegalHelp:');
blank();
w('- "About the ABAWD work rules" goes to the ABAWD article');
w('- "Legal Topics" goes to the Legal Topics index');
w('- "Contact Us" goes to the contact page');
blank();
w('**Not in the footer yet:** Terms of Use and Privacy Policy. Those links are missing');
w('because their URLs were not available, and a Terms link that goes nowhere on a public');
w('benefits page is worse than no link. Separately, this version has no Terms of Use');
w('checkbox at all, which earlier versions did.');
blank();

/* ---- Leftovers, so nothing can go missing ---- */

const shown = new Set();
lines.forEach(l => {
  const m = l.match(/^\*\*`([A-Za-z0-9_.]+)`\*\*/);
  if (m) shown.add(m[1]);
});
const leftover = Object.keys(C).filter(k => !shown.has(k));
if (leftover.length) {
  section('13. Everything else');
  w('These are shown to people too, but did not fit the sections above. Listed so the');
  w('document stays complete.');
  blank();
  leftover.forEach(k => item(k, C[k]));
}

/* ---- Links ---- */

section('Every link the screener sends people to');
w('| Name | Where it goes |');
w('|---|---|');
Object.entries(S.LINKS).forEach(([k, v]) => w('| `' + k + '` | ' + v + ' |'));
blank();

fs.writeFileSync(OUT, lines.join('\n').replace(/\n{3,}/g, '\n\n') + '\n', 'utf8');

const copyCount = shown.size;
console.log('Wrote ' + path.relative(ROOT, OUT));
console.log('  ' + copyCount + ' pieces of copy, ' + Object.keys(OPEN).length + ' open questions');
if (leftover.length) console.log('  ' + leftover.length + ' in the catch-all section');
