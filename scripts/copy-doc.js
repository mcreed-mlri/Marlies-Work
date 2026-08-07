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
const HTML = path.join(ROOT, 'masslegalhelp', 'tool', 'snap', 'index.html');
const OUT = path.join(ROOT, 'SCREENER-COPY.md');
const VARIANT = 'classic2';

const S = require(path.join(ROOT, 'masslegalhelp', 'snap-screening-logic.js'));
const A = S.create(VARIANT);
const C = S.RESULT_COPY;

/* ---- Questions still open for the author. Keyed by copy id so each one
 * prints next to the text it is about, instead of in a list at the end. ---- */
const OPEN = {
  'page.answerAny': 'Applied: this now shows above group 1 only, per your note that it "only needs to be said once in section 1." It used to repeat above all four groups.',
  'page.sigAlt': 'Added 2026-07-30, and not yours, so overwrite it freely. The signature pad only works with a finger or a mouse, so someone using a keyboard, a switch, or a screen reader cannot sign in the browser at all. The printed statement already leaves a ruled line when the pad is empty, so that route worked; nothing on the page said so. This sentence says it. If you would rather fold it into the line above, that is one sentence instead of two and we will make the swap.',
  goodCauseIntro: 'Is "work, school, or volunteer hours" replacing the old sentence, or inserting into it? In other words, does it end at "volunteer hours." or continue "...volunteer hours before or after your start date."?',
  'goodcause.text': 'Your six examples of unreasonable employment are in, added to the "What does this mean?" prompt this question already had rather than as a second one beside it. They could not hang off the phrase itself: the options are buttons, and a disclosure inside one would be a button inside a button.\n\nThe serious half of this is closed, by your own edit. The worry was that the examples widen the option a long way, to a commute over two hours, pay under minimum wage, a strike, a health and safety risk, and religious observance, while the letter sent DTA a fixed sentence naming only discrimination. Someone picking the option because of a long commute would have signed an accusation about a named employer. Your edit took that sentence out of the letter entirely, so the letter now carries only what the person writes themselves and there is nothing left to mis-describe. The category name is still used in the summary someone emails to themselves, which is them writing to them.\n\nWhat is left is smaller and is the results screen, which lists four of the six: discrimination, a health and safety risk, pay under minimum wage, and a strike. The commute and religious observance are in the question\'s help text but not in that list. Worth adding for consistency, and it is your wording, so it is not done.',
  goodCauseInNotExemptIntro: 'This is a second copy of the good cause sentence, shown on the "may need to meet the work rules" screen. Your note did not mention it. Should it change the same way?',
  formTitleExempt: 'If the good cause heading goes, should this matching one go too?',
  formLeadExempt: 'Resolved 2026-08-06 by your own rewrite: it now says the tool creates a written statement, then what to do with it. A new line beside it, formSendAlternatives, says the form is not the only route, so someone who would rather write by hand learns that before working through the blanks.',
  exemptReasonsIntro: 'Already applied: emptied, because the heading above now ends with "because of these reasons:" and this said it a second time.',
  exemptProofHousing: 'Already applied: emptied at your request, with the disability note that read the same way. Both said to give DTA details so DTA could review the exemption, which the letter already asks for in its housing paragraph. Kept as an empty string rather than deleted so the archived builds still resolve the key.',
  'q.disability': 'One thing from the May 2026 Advocacy Guide, Q61. It lists the qualifying benefits exactly as we have them, with one difference: Paid Family Medical Leave appears as "Paid Family Medical Leave (in most cases)". Ours has no qualifier. We have left it exempting, because dropping it would be wrong and a person cannot be asked to judge whether their own PFML is one of the cases that counts, and because the result already says "may be exempt" while the letter only states the fact that they are on it. But you may want the "in most cases" said out loud somewhere, and that is your call with a lawyer rather than ours.',
  reasonNoteEaedc: 'Added at Pat\'s suggestion, with the condition attached: it shows on the results screen and not on the printable statement.\n\nOne thing to confirm, and it is the only reason this is not simply done. The comment did not name which exemption it hangs off, and two were highlighted in the document: "I have a health reason that makes it hard to work 30 or more hours a week" and "I get another disability benefit or payment DTA should review". It is on the health reason, because that reason describes EAEDC\'s own test, being unable to work because of a disability, and because someone who ticks the other one is already getting a disability payment. If Pat meant the other one, or both, say so and it moves: it is keyed by reason, so it is a one-line change.',
  'q.tribe': 'Applied, along with a change to the reason it records. Because the question now asks about a parent or grandparent, most people answering Yes are not themselves enrolled, and the reason prints as a bullet in the letter they sign and send to DTA. It used to read "Alaska Native or member of a Tribe", which had them attest to membership they may not have. It now reads "Alaska Native or Tribe member, including through a parent or grandparent", which you approved on 2026-08-06.',
};

/* ---- Strings inline in the page markup. Each must match exactly once. ---- */
const INLINE = [
  { id: 'page.h1', re: /<h1 class="h1">([^<]+)<\/h1>/ },
  { id: 'page.introSummary', re: /<p [^>]*>(Some adults on SNAP who are[\s\S]*?)<\/p>/ },
  { id: 'page.introNotice', re: /<p [^>]*>(You only have to meet these rules[\s\S]*?)<\/p>/ },
  /* page.introLostSnap, page.moreSummary, page.moreDetails1 and page.moreDetails2
     were the "More on the SNAP ABAWD work rules" disclosure. The 2026-08-06 edits
     cut the whole panel and replaced it with page.learnMoreIntro, one line pointing
     at the MassLegalHelp article. Nothing on the page carries that wording now. */
  { id: 'page.learnMoreIntro', re: /<p [^>]*>(Learn more about the ABAWD Work Rules[\s\S]*?)<\/p>/ },
  { id: 'page.timeEstimate', re: /<p [^>]*>(This short online form asks[\s\S]*?)<\/p>/ },
  /* page.startHeading was an h2 above the button, "Check if the SNAP work rules
     apply to you." The same edits folded it into the button label, so there is one
     string here where there were two. */
  /* Stops at the first tag rather than at </button>, so the decorative arrow after the
     label is left out. The author is reviewing words here; the arrow is aria-hidden and
     is not one. */
  { id: 'page.startButton', re: />(Click here to check[^<]*)</ },
  { id: 'page.dtaNote', re: /<p [^>]*>(The Department of Transitional Assistance[\s\S]*?)<\/p>/ },
  /* Captures to the first </p> rather than to a fixed ending, because this sentence now
     carries bold on "Every question is optional." and briefly had a second paragraph
     beside it, page.scopeReminder, which the author asked back out the same day. */
  { id: 'page.answerAny', re: /<p [^>]*>(Answer any that apply to you\.[\s\S]*?)<\/p>/ },
  { id: 'page.sigAlt', re: /<p id="sig-alt"[^>]*>([^<]+)<\/p>/ },
  /* The footer text. Approved 2026-08-07 and already live, so unlike most entries here this one
     is not asking a question; it is here so a later edit to it reaches the author the same way
     every other string does, with an id to quote back. The identical copy on the tools landing
     page is held in step by a test rather than by this document. */
  { id: 'page.footerAbout', re: /<div class="footer-about-inner">\s*<p>([\s\S]*?)<\/p>/ },
  { id: 'footer.termsLink', re: /<a href="https:\/\/www\.masslegalhelp\.org\/terms-use"[^>]*>([^<]+)</ },
  { id: 'footer.privacyLink', re: /<a href="https:\/\/www\.masslegalhelp\.org\/privacy-policy"[^>]*>([^<]+)</ },
  // Buttons and navigation (skip/startOver/delete still inline in the page)
  { id: 'btn.skipToResults', re: />(Skip to results)</ },
  { id: 'btn.startOver', re: />([^<]{0,4}Start over)</ },
  { id: 'btn.deleteAnswers', re: />(Delete my answers)</ },
  // Warnings and inline notes
  { id: 'page.skippedWarning', re: />(If you skipped questions[^<]+)</ },
  // The printable statement
  { id: 'statement.docTitle', re: /<title>(SNAP Work Rules Statement)<\/title>/ },
  { id: 'statement.nameLabel', re: />(Your name)</ },
  { id: 'statement.sigLabel', re: />(Signature)</ },
  { id: 'statement.sigHint', re: /id="sig-hint"[^>]*>([^<]+)</ },
  { id: 'hint.signatures.title', re: /hintTip\('sig', '([^']+)'/ },
  { id: 'hint.signatures.body', re: /hintTip\('sig', '[^']+', '((?:[^'\\]|\\.)+)'/ },
  // Chrome and footer. These are not the author's; see the flagged section.
  { id: 'chrome.tabTitle', re: /<title>(SNAP Work Rules Screening[^<]*)<\/title>/ },
  /* chrome.wordmark and chrome.tagline were here, reading .topbar-title and
     .topbar-sub. Both stopped matching when the header text was replaced by
     MassLegalHelp's logo file: the words are inside mlh-logo.svg now, so they are
     artwork rather than page copy and there is nothing here to edit. What is left
     for a reader is the link's accessible name, which is what a screen reader
     announces in place of the image, so that is extracted instead.

     The .topbar-title and .topbar-sub CSS rules outlived their markup here for
     months, because check-pages.js looks for the opposite case, a class in the
     markup with no rule behind it. Deleted 2026-08-07. */
  { id: 'chrome.brandLabel', re: /class="topbar-brand"[^>]*aria-label="([^"]+)"/ },
  { id: 'chrome.quickExit', re: /data-action="quick-exit"[^>]*>([^<]+)</ }
  /* footer.disclaimer was here. The footer paragraph came out on 2026-07-30 pending
     a legal footer nobody has drafted yet, so there is no string left to extract.
     The wording is preserved in the footer comment in index.html rather than here,
     because this file only reports what the tool currently says. */
];

/* Copy that came from the developer rather than the author. Flagged separately
 * because the project rule is that author copy outranks editorial instinct, and
 * these were written to fill a gap, not handed over for review. */
const DEVELOPER_WRITTEN = new Set([
  'chrome.tabTitle', 'chrome.brandLabel', 'chrome.quickExit',
  'page.sigAlt'
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
/* The opening paragraph is the one extracted string with a template expression
 * left in it, because the page builds that sentence from static markup plus
 * RESULT_COPY.introExemptExplain. Expanded here so the paragraph can be read out
 * of the page whole.
 *
 * It used to be pasted into this file as a literal, and into three other
 * generators besides. That is how the 2026-08-06 edit landed in three of the four
 * and not in copy-walkthrough.js: the generated-files CI job regenerates and
 * diffs, so a stale literal produces a document that is wrong and stable, which
 * is the one failure that job cannot see. */
for (const id of Object.keys(inline)) {
  inline[id] = inline[id].replace('${esc(RESULT_COPY.introExemptExplain)}', C.introExemptExplain);
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
    /* Block elements, added 2026-08-06 with the good-cause examples. Without these the
       stripper below ran them together, and the six examples of unreasonable employment
       reached the author as one unreadable paragraph with no breaks and no bullets. Bold
       is applied before the tags go, so a bold sub-heading survives as a heading. */
    .replace(/<p [^>]*style="[^"]*font-weight:700[^"]*"[^>]*>([\s\S]*?)<\/p>/g, '\n\n**$1**\n')
    .replace(/<\/(p|ul|ol)>/g, '\n')
    .replace(/<(p|ul|ol)\b[^>]*>/g, '\n')
    .replace(/<li[^>]*>/g, '- ')
    .replace(/<\/li>/g, '\n')
    .replace(/<\/?strong>/g, '**')
    .replace(/<[^>]+>/g, '')
    // Three or more newlines is always an artefact of the conversion above, never intent.
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
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

/* Every paragraph carries the marker, and the blank lines between them carry a bare `>`, or
 * Markdown ends the quote at the first one. Only the opening paragraph was prefixed until
 * 2026-08-07, so a question with a second paragraph had that paragraph read as the document's own
 * narration. `goodcause.text` was three paragraphs long and two of them looked like our prose
 * rather than something waiting on an answer. */
function openNote(id) {
  if (!OPEN[id]) return;
  const paras = OPEN[id].split('\n\n');
  w('> **Question for you:** ' + paras[0]);
  paras.slice(1).forEach(p => { w('>'); w('> ' + p); });
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
S.THRESHOLD_SOURCE.split('. ').forEach(sentence => w(sentence.trim() + (sentence.endsWith('.') ? '' : '.')));
blank();
w('Generated by `scripts/copy-doc.js`, reading the build that ships to MassLegalHelp');
w('(`masslegalhelp/tool/snap/index.html`) and the shared decision logic. If a string is on the page,');
w('it should be in here; if you spot something missing, that is a bug in the generator and');
w('worth telling me about.');

/* ---- Start page ---- */

section('1. Start page');

['page.h1', 'page.introSummary'].forEach(id => item(id, inline[id]));

w('The first "ABAWD" in that paragraph is defined on hover or tap, the same dotted-underline');
w('hint the word "exempt" carries on the results screen. The second string is what a screen');
w('reader announces for the control, since "ABAWD" on its own does not say it can be opened.');
blank();
['abawdTermExplain', 'abawdTermHintLabel'].forEach(k => item(k, C[k]));

['page.introNotice', 'page.learnMoreIntro', 'page.timeEstimate']
  .forEach(id => item(id, inline[id]));

w('**There is no Terms of Use text on this page today.** Other versions of the tool have a');
w('checkbox someone must tick before starting; this one does not. If the published version');
w('needs one, its wording has to come from you, and it has to match whichever site hosts');
w('the tool.');
blank();
item('page.startButton', inline['page.startButton']);

w('The privacy callout and a closing note sit under the button:');
blank();
item('page.privacyIntro', `<strong>${C.privacyIntroLead}</strong> ${C.privacyIntroBody}`);
item('page.dtaNote', inline['page.dtaNote']);

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
    if (q.listItems) {
      w('Listed on the question:');
      blank();
      q.listItems.forEach(li => w('- ' + toMarkdown(li)));
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
/* helpHtml first: classic2 carries the examples of unreasonable employment as a list, and
   reading `help` alone printed the general sentence and silently dropped six bullets the
   author had just asked for. */
const gcHelp = GC.helpHtml || GC.help;
if (gcHelp) { w('Help text, shown when someone opens "What does this mean?":'); blank(); toMarkdown(gcHelp).split('\n').forEach(l => w('> ' + l)); blank(); }
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
[
  ['btn.next', 'btnNext'],
  ['btn.seeResults', 'btnSeeResults'],
  ['btn.guidedDetailsNext', 'btnGuidedDetailsNext'],
  ['btn.seeLetter', 'btnSeeLetter']
].forEach(([id, k]) => item(id, C[k]));
['btn.skipToResults', 'btn.startOver', 'btn.deleteAnswers']
  .forEach(id => item(id, inline[id]));
w('And one warning on the results, if someone left questions blank:');
blank();
item('page.skippedWarning', inline['page.skippedWarning']);

/* ---- Results, shared ---- */

section('Results: shared wording');

w('Four results are possible. This block appears on more than one of them.');
blank();
['resultsHeadTitle', 'resultsHeadLead', 'learnMoreLabel', 'privacyIntroLead', 'privacyIntroBody', 'privacyNote', 'introExemptExplain', 'exemptTermHintLabel', 'printLead',
  'lostSnapIntro'].forEach(k => item(k, C[k]));

/* ---- Result screens ---- */

section('5. Result: exempt because of your age');

w('Reached by answering **No** to "Are you 18 through 64 years old?" in section 1. That');
w('answer ends the screening immediately, so none of the later questions are asked and');
w('this screen replaces the other three results. It offers no letter: DTA already holds');
w('the date of birth, so there is nothing to tell them and nothing to sign.');
blank();
w('The first sentence is the green heading and the rest is the panel below it, which is');
w('how the other result screens are built. The emphasis on *still* is yours.');
blank();
['ageExemptHeading', 'ageExemptBody', 'ageExemptNoticeLead', 'ageExemptNoticeEmphasis', 'ageExemptNoticeEnd']
  .forEach(k => item(k, C[k]));

section('6. Result: you may be exempt');
['exemptHeading', 'exemptReasonsIntro'].forEach(k => item(k, C[k]));
w('Under the heading, the screener lists the reasons the answers point to. Each reason');
w('phrase comes from the question that produced it. Then, when relevant, one of these:');
blank();
['exemptProofWork', 'exemptProofHousing', 'exemptProofDisability', 'exemptProofStateAgency']
  .forEach(k => item(k, C[k]));

w('Pat\'s EAEDC suggestion is in. It shows as an indented sub-bullet under one reason, and');
w('only on this screen: it is not on the printable statement, per her note. It reads:');
blank();
['reasonNoteEaedc', 'reasonNoteEaedcLink'].forEach(k => item(k, C[k]));
w('The link goes to ' + S.LINKS.eaedc);
blank();
Object.keys(S.REASON_RESULT_NOTES).forEach(id => {
  w('Currently attached to the reason **' + S.REASON_TEXT_BY_ID[id] + '**');
});
blank();

section('7. Result: you may have a good reason for missing hours');
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

section('8. Result: you may need to meet the work rules');
['notExemptHeading', 'notExemptIntro', 'workRulesHeading', 'workOption1', 'workOption1Unpaid',
  'workOption1Training', 'workOption1IncomeReminder', 'workOption2', 'meetingDtaHeading', 'meetingDtaPaid',
  'meetingDtaStatement', 'goodCauseInNotExemptBold', 'goodCauseInNotExemptIntro',
  'goodCauseInNotExemptBody', 'goodCauseInNotExemptLink', 'notExemptStartOver',
  'notExemptReapplyLead', 'notExemptReapplyLink', 'notExemptReapplyEnd', 'notExemptSnapBack',
  'notExemptEmail', 'notExemptEmailSuffix'].forEach(k => item(k, C[k]));

/* ---- The statement ---- */

section('9. The printable "Tell DTA" statement');

w('Shown on the exempt and good cause results. Someone fills in the blanks, signs it, and');
w('mails, faxes, or uploads it to DTA.');
blank();
w('**The whole letter is in this document now.** Until 2026-08-07 most of its sentences were');
w('written inline in the code with no key to read them by, so this document could not show them');
w('and you were approving a letter you could only see by printing one. That is how "as part of');
w('my exemption screening" survived a pass that took the word screener out of everywhere else.');
w('Every fixed sentence the letter can print is below.');
blank();
w('None of these mentions the screener, which was the point of that rewrite. The letter is');
w('from the person to their caseworker, so a reference to a tool they filled in elsewhere');
w('reads as software talking. "I also told the screening the following" and "a disability');
w('benefit that is not listed above" both went for that reason, the second because "above"');
w('pointed at a list of options that does not appear anywhere in the letter.');
blank();
w('It opens the same way whichever result someone reached:');
blank();
item('statement.salutation', S.STATEMENT_SALUTATION);

w('Then one of these three, depending on the result:');
blank();
item('statement.exemptOpening', S.STATEMENT_EXEMPT_OPENING, { note: 'the exempt result' });
item('statement.goodCauseOpening', S.STATEMENT_GOODCAUSE_OPENING, { note: 'the good cause result' });
item('statement.otherOpening', S.STATEMENT_OTHER_OPENING, { note: 'any other result' });

w('On the exempt letter, some reasons add a paragraph of their own, because each says something');
w('the bulleted list cannot:');
blank();
['statementHousingLead', 'statementHousingPicksLead', 'statementDisabilityOtherLead']
  .forEach(k => item(k, C[k]));
item('statement.workIncomeLead', S.STATEMENT_WORK_INCOME_LEAD);
item('statement.workHours30Lead', S.STATEMENT_WORK_HOURS_30_LEAD);

w('Every letter ends this way:');
blank();
item('statement.closingRequest', S.STATEMENT_CLOSING_REQUEST, { note: 'on all four results' });
item('statement.signOff', S.STATEMENT_SIGN_OFF);
item('statement.printedNameLabel', S.STATEMENT_PRINTED_NAME_LABEL, { note: 'with a ruled line when no name was typed' });
item('statement.dateSignedLabel', S.STATEMENT_DATE_SIGNED_LABEL);

item('statement.docTitle', inline['statement.docTitle'], { note: 'the printed page title' });
['formTitleExempt', 'formLeadExempt', 'formLeadGoodCause', 'formSendAlternatives',
  'formExplainHeading', 'formExplainHeadingGoodCause'].forEach(k => item(k, C[k]));

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
w('The Client / DTA Agency ID line is on the printed letter only. The author removed the');
w('on-screen field on 2026-08-06: most people do not know the number from memory, so asking');
w('for it in the form meant either skipping it or breaking off to find a DTA notice. On paper');
w('it is a blank to fill in with the notice to hand.');
blank();
item('statement.agencyLabel', S.STATEMENT_AGENCY_LABEL);
item('statement.agencyHint', S.STATEMENT_AGENCY_HINT, { note: 'printed under the blank line' });

['statement.nameLabel', 'statement.sigLabel', 'statement.sigHint']
  .forEach(id => item(id, inline[id]));
item('page.sigAlt', inline['page.sigAlt'], { note: 'under the signature pad' });
w('An explainer opens next to the signature box:');
blank();
['hint.signatures.title', 'hint.signatures.body'].forEach(id => item(id, inline[id]));
['whyInfoLabel', 'whyInfoExempt', 'whyInfoGoodCause'].forEach(k => item(k, C[k]));

/* ---- Guided mode ----
 *
 * This section matters more than its length suggests. Everything in it is
 * wording the tool puts in someone's mouth, above their signature, on a
 * document that goes to a state agency. In the write-in version those sentences
 * are the person's own and never pass through here. So every composed sentence
 * is printed in full below rather than described, for the same reason
 * docassemble-snap-abawd/tests/test_good_cause_text.py gives for checking the
 * good-cause wording exactly: a paraphrase is a defect. */

section('The guided version of the statement (archived)');

w('**Archived.** The shipping screener is write-in only. This section documents the');
w('guided ending kept for records at `archive/snap-guided/index.html`. Same questions,');
w('same result, but instead of blank boxes the tool asks two or three multiple-choice');
w('questions about whichever exemption applied and writes the statement from the answers.');
w('The person still types their name and signs.');
blank();
w('It is not linked from the shipping or review landing pages. **Every sentence in this');
w('section is wording the tool would put above someone\'s signature on a letter to DTA,');
w('so it needs your eye more than anything else in this document.**');
blank();

sub('The screen that asks for the details');
['detailsStepHeading', 'detailsStepLead', 'detailsStepPrivacy'].forEach(k => item(k, C[k]));

sub('The results screen, in guided mode');
['composedStatementHeading', 'composedFormLeadExempt', 'composedFormLeadGoodCause',
  'composedChangeLabel', 'composedWhyInfoExempt', 'composedWhyInfoGoodCause']
  .forEach(k => item(k, C[k]));

/* A fixed reference date, not today's.
 *
 * The good-cause sentence names the months someone missed, so composing it
 * against the clock would change this document on the first of every month and
 * fail the CI job that regenerates and diffs it. The question labels are
 * relative ("Last month") and never move; only the composed sentence resolves a
 * month name, and here it resolves against a date that does not. */
const GUIDED_DOC_DATE = new Date(2026, 7, 1); // 1 August 2026

/* One worked case per block: the answers that reach it, and picks for every
 * question so the longest form of each sentence is on the page. */
const GUIDED_CASES = [
  {
    title: 'A health reason',
    answers: {
      health: 'yes',
      d_health_kind: 'physical', d_health_length: 'long', d_health_care: 'regularly'
    }
  },
  {
    title: 'Caring for someone who cannot care for themselves',
    answers: {
      caretaker: 'yes',
      d_care_who: 'adult', d_care_often: 'daily', d_care_alone: 'alone'
    }
  },
  {
    title: 'Caring for a child under 6',
    answers: { child6: 'yes', d_child6_live: 'yes', d_child6_often: 'daily' }
  },
  {
    title: 'Working',
    answers: {
      working: 'income_weekly',
      d_work_hours: 'h20_29', d_work_jobs: 'one', d_work_proof: ['paystubs', 'employer_letter']
    }
  },
  {
    title: 'Working, but cannot get proof',
    answers: { working: 'hours_30', d_work_hours: 'varies', d_work_proof: ['need_help'] }
  },
  {
    title: 'Another disability benefit',
    answers: { disability: ['other'], d_disability_other: 'masshealth' }
  },
  {
    title: 'Another disability benefit, not on the list',
    answers: { disability: ['other'], d_disability_other: 'unlisted' }
  },
  {
    title: 'No regular place to sleep',
    answers: {
      housing: 'no', housingFollowup: S.NONE,
      d_housing_where: 'shelter', d_housing_barriers: ['no_address', 'no_transport']
    }
  },
  {
    title: 'A good reason for missing hours',
    answers: {
      goodcause: 'transport',
      d_gc_what: 'car_broke', d_gc_when: ['this_month', 'last_month'], d_gc_now: 'still'
    }
  }
];

sub('The questions, and the sentence each one writes');

w('For each situation below: the questions the person is asked, then the exact sentence');
w('the tool writes into the letter when they pick the answers shown. Change either.');
blank();

for (const c of GUIDED_CASES) {
  w('#### ' + c.title);
  blank();
  const qs = A.guidedQuestions(c.answers);
  qs.forEach(q => {
    w('**' + toMarkdown(q.text) + '**');
    if (q.help) w('  ' + toMarkdown(q.help));
    blank();
    if (q.type === 'yn') {
      w('- Yes');
      w('- No');
    } else {
      (q.options || []).forEach(o => {
        const chosen = Array.isArray(c.answers[q.id])
          ? c.answers[q.id].indexOf(o.id) !== -1
          : c.answers[q.id] === o.id;
        w('- ' + toMarkdown(o.label) + (chosen ? '  ← picked below' : ''));
      });
      if (q.noneLabel) w('- ' + toMarkdown(q.noneLabel));
    }
    blank();
  });
  w('Writes:');
  blank();
  const composed = A.composeStatement(c.answers, GUIDED_DOC_DATE);
  if (!composed.length) w('*(nothing)*');
  composed.forEach(e => quote(e.text));
  blank();
}

w('#### When there is nothing to ask');
blank();
w('Someone exempt only for reasons that speak for themselves (pregnant, TAFDC, a Tribe,');
w('school, unemployment, a safety situation, substance use treatment, or a named disability');
w('benefit) is asked nothing extra and the letter carries its list of reasons alone. In the');
w('write-in version those people get one empty box under `statementPromptsFor` fallback,');
w('"Explain your reasons in your own words", which is the least answerable prompt in the tool.');
blank();
w('Worked example, someone who is pregnant and nothing else:');
blank();
w('- Questions asked: ' + A.guidedQuestions({ pregnant: 'yes' }).length);
w('- Sentences written: ' + A.composeStatement({ pregnant: 'yes' }, GUIDED_DOC_DATE).length);
blank();

w('#### When someone skips a question');
blank();
w('Nothing is guessed. A skipped question drops its part of the sentence rather than');
w('filling it in with something likely, so a half-answered case still produces a true');
w('sentence, just a shorter one. Answering only the first health question:');
blank();
quote(A.composeStatement({ health: 'yes', d_health_kind: 'physical' }, GUIDED_DOC_DATE)
  .map(e => e.text).join(' '));
blank();
w('And answering none of them:');
blank();
quote(A.composeStatement({ health: 'yes' }, GUIDED_DOC_DATE).map(e => e.text).join(' '));
blank();

section('Printing, saving, and email');
['printFormLabel', 'downloadWordLabel', 'savingTipsTitle', 'savingTipsBody', 'emailSelfLabel',
  'emailSelfSubject', 'emailModalTitle', 'emailModalLead', 'emailModalLabel',
  'emailModalSendLabel', 'emailModalSendingLabel', 'emailModalMailAppLabel', 'emailModalCloseLabel',
  'emailSentHeading', 'emailSentBody', 'emailErrorBody', 'emailInvalidAddressBody',
  'emailBodyResultExempt', 'emailBodyResultGoodCause', 'emailBodyResultNotExempt',
  'emailBodyReasonsHeading', 'emailBodyNextSteps',
  'emailFallbackHeading', 'emailFallbackBody', 'emailCopyLabel',
  'emailCopiedLabel', 'emailSelectedLabel', 'emailTruncatedNote'].forEach(k => item(k, C[k]));

section('11. Other ways to reach DTA');
['otherWaysHeading', 'otherWaysExemptLead', 'otherWaysGoodCauseLead']
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
w('exempt. ' + S.THRESHOLD_SOURCE);
blank();
w('| What | Value |');
w('|---|---|');
w('| Weekly earnings that make someone exempt | $' + S.WORK_INCOME_THRESHOLD.toFixed(2) + ' before taxes |');
w('| Massachusetts minimum wage | $' + S.MA_MIN_WAGE + ' an hour |');
w('| Hours a week at minimum wage that make someone exempt | ' + S.WORK_HOURS_AT_MIN_WAGE + ' |');
w('| Hours a week that count while earning under minimum wage | ' + S.WORK_HOURS_COMPLIANCE + ' |');
blank();

/* ---- Copy the developer wrote, called out rather than blended in ---- */

section('Copy the developer wrote, which needs your approval');

w('Everything above came from you or from the earlier MLRI draft. The strings in this');
w('section did not. They were written to fill gaps while building the MassLegalHelp version,');
w('and they are on the page right now, so they need your review the same as anything else.');
w('The footer disclaimer used to head this list. It is yours now, approved 2026-08-07, so it');
w('has moved out of this section and into the footer section below.');
blank();
['chrome.tabTitle', 'chrome.brandLabel', 'chrome.quickExit',
  'page.sigAlt'].forEach(id => item(id, inline[id]));

sub('The footer');

w('The gold rule, the navy band, the wordmark, and your text. It used to carry three links out,');
w('to the ABAWD article, Legal Topics, and Contact Us; those went on 2026-07-30, because someone');
w('mid-screening is not browsing. "Interactive tools" went on 2026-08-07: it was the label on');
w('the block that held the old one-liner, and once your text moved to its own row underneath it');
w('was a heading with nothing under it.');
blank();
item('page.footerAbout', inline['page.footerAbout']);
w('The same text is on the tools landing page, word for word. A test holds the two in step, so');
w('an edit to one cannot leave the other showing wording nobody approved.');
blank();
w('**Worth a second look, and the reason this is flagged rather than closed.** The sentence that');
w('came out on 2026-07-30 carried three facts: that the tool is not legal advice, that it sends');
w('nothing to DTA, and that using it does not change a SNAP case. Yours carries none of the');
w('three. It says who wrote the tool, who runs SNAP, and that these rules are not the MassHealth');
w('ones, which are all useful and none of which are those. That may well be deliberate, and if');
w('the host site\'s terms are meant to cover it then nothing needs doing. It is here because it');
w('would be worse to leave it unsaid.');
blank();
w('The MassHealth sentence is a good catch that nobody here had thought of. Two sets of work');
w('requirements are live at once and people do conflate them.');
blank();
w('Under the text sits MassLegalHelp\'s darker sub-strip, carrying the two links you sent on');
w('2026-08-07. Both open in a new tab, so reading the terms halfway through a screening does not');
w('navigate away from a half-finished form:');
blank();
['footer.termsLink', 'footer.privacyLink'].forEach(id => item(id, inline[id]));
w('Their own strip carries two more things that are not here. Social icons, which you did not');
w('ask for. And `©2026 Massachusetts Legal Assistance Corporation`, which came off on 2026-07-30');
w('along with the "Funded by the Massachusetts Legal Assistance Corporation" credit: both were');
w('copied from MassLegalHelp\'s footer, where they describe their site, and on this page the');
w('copyright asserts MLAC owns something MLRI wrote. Say the word if you want either back.');
blank();
w('**Still open:** this version has no Terms of Use checkbox, which earlier versions did. Linking');
w('the terms is not the same as asking someone to accept them, so that is still a decision.');
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
