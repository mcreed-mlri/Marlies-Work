#!/usr/bin/env node
/**
 * Generates TESTING.md: everything to check before this goes in front of the
 * public, as a checklist someone can work through.
 *
 *   "$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" scripts/testing-doc.js
 *
 * The exhaustive parts are generated rather than typed: every exemption, every
 * guided question, every sentence the tool can write. A hand-written test plan
 * goes stale the first time someone adds a question, and a checklist that is
 * quietly missing a case is worse than no checklist, because working through it
 * feels like coverage.
 *
 * The judgement parts, accessibility, real devices, whether the wording is
 * legally right, cannot be generated and are written out below. Those are the
 * ones that actually need a person.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'TESTING.md');
const VARIANT = 'classic2';

const S = require(path.join(ROOT, 'masslegalhelp', 'snap-screening-logic.js'));
const A = S.create(VARIANT);
const C = S.RESULT_COPY;

/* MLRI's footer paragraph, read out of the page rather than retyped here. It is approved copy,
 * and a checklist that quotes it from a second copy is a checklist that can tell a tester the
 * page is wrong when it is the document that has fallen behind. */
const SHIP_HTML = fs.readFileSync(path.join(ROOT, 'masslegalhelp', 'tools', 'snap', 'index.html'), 'utf8');
const FOOTER_TEXT = (() => {
  const m = /<div class="footer-about-inner">\s*<p>([\s\S]*?)<\/p>/.exec(SHIP_HTML);
  if (!m) throw new Error('testing-doc: no footer paragraph in the shipping page.');
  return m[1].replace(/\s+/g, ' ').trim();
})();

/* Fixed, for the same reason the walkthrough uses one: the good-cause sentence
 * names months, and against the clock this document would change every month
 * and fail the CI job that regenerates and diffs it. */
const TODAY = new Date(2026, 7, 1);

const lines = [];
const w = (s) => lines.push(s === undefined ? '' : s);
const blank = () => lines.push('');
const h1 = (t) => { w('# ' + t); blank(); };
const h2 = (t) => { blank(); w('## ' + t); blank(); };
const h3 = (t) => { blank(); w('### ' + t); blank(); };
/** A checklist item. Everything a tester has to actually do is one of these. */
const check = (t) => w('- [ ] ' + t);

const strip = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

/** The composed statement for a set of answers, as one string. */
const composed = (answers) => A.composeStatement(answers, TODAY).map(e => e.text).join(' ');

/* ------------------------------------------------------------------ */

h1('Testing the SNAP work rules screener');

w('Everything to check before this is in front of the public, in the order it makes sense to');
w('check it. Work top to bottom on a first pass; after that, the section you need is usually');
w('the one matching what changed.');
blank();
w('**This tool exists to get people their SNAP back.** Someone who is exempt and does not know');
w('it, or who gets a letter DTA rejects, is a household that stays cut off. That is the standard');
w('to test against: not "does the page work" but "would this actually get someone reinstated".');
blank();
w('A box that will not tick is worth more than a whole page that will. Write down what you did,');
w('what you expected, and what happened, and it can be fixed.');
blank();

/* Added 2026-08-07, for the launch-day pass. Section 5 is 47 checks, a fifth of this document,
 * against a build that was archived on 2026-07-30 and will never be public. Working through it
 * top to bottom therefore spends a fifth of the attention on something that cannot affect a
 * single person using the tool, and the shipping sections are where that attention is needed.
 * Named rather than deleted: the guided build is kept for records and its checks go with it. */
w('**If you are testing before a launch, skip section {{ARCHIVED_NO}}.** It covers the archived');
w('guided build, which is kept for records and is not what anyone will see, and it is');
w('{{ARCHIVED_CHECKS}} of the {{TOTAL_CHECKS}} checks here. Everything else is the shipping tool.');
w('Section {{CORE_NO}} is the heart of it: every exemption, one at a time.');

h2('Before you start');

w('There is no build step and no `npm` on the authoring machine. Serve the folder and open it:');
blank();
w('```');
w('python -m http.server 4173 --bind 127.0.0.1');
w('```');
blank();
w('Then open the screener and, if you need the archived guided build, its copy:');
blank();
w('| Build | URL |');
w('| --- | --- |');
w('| Write-in (shipping) | `http://127.0.0.1:4173/masslegalhelp/tools/snap/` |');
w('| Guided (archived) | `http://127.0.0.1:4173/archive/snap-guided/` |');
w('| The tools landing page | `http://127.0.0.1:4173/masslegalhelp/tools/` |');
w('| The explainer | `http://127.0.0.1:4173/screener/how-it-works.html` |');
blank();
w('`?sample=` only works on a review host (localhost, 127.0.0.1, a `.pages.dev`');
w('preview, or a `file://` URL). It is inert on masslegalhelp.org, which is deliberate and is');
w('itself something to test.');
blank();
check('Have a real phone to hand, not just a narrow browser window. The signature pad, the print dialog, and the mail app all behave differently on a real device.');
check('Have a printer or a "Save as PDF" option available.');
check('If you can, borrow a screen reader for the accessibility section: VoiceOver on a Mac or iPhone, Narrator on Windows, TalkBack on Android.');

h2('1. The five-minute smoke test');

w('If any of these fail, stop and report it. Nothing further is worth testing.');
blank();
check('The start page loads and shows the heading, the intro text, and the start button.');
check('The dotted-underlined **ABAWD** in the first paragraph opens a box defining the acronym: on hover with a mouse, on tap on a phone.');
check('The start button darkens on hover and sinks by the height of its own bottom edge when held down, then springs back. Check it by keyboard too: hold Space with the button focused.');
check('Clicking **Click here to check if the ABAWD work rules apply to you** opens the first question section.');
check('Answering nothing at all and clicking through to the end gives the "may need to meet the work rules" result.');
check('Answering **Yes** to "Are you pregnant?" and skipping to results gives the exempt result.');
check('The exempt result offers a letter, and "Print or save this form" opens a print dialog.');
check('**Quick exit** in the top bar leaves the site immediately, and pressing Back does not return to the answers.');

h2('2. Every exemption, one at a time');

w('Each row is its own run: start over, answer only that question, then use "Skip to results".');
w('Every one of these should give the **exempt** result and name that reason in the letter.');
blank();
w('This is the heart of it. An exemption that stops working is a person told they must meet the');
w('work rules when they do not have to.');
blank();

/* ---- Single-answer exemptions, generated from the question definitions ---- */
const ynExemptions = A.QUESTIONS
  .filter(q => q.type === 'yn' && q.exemptOn && q.reason)
  .map(q => ({ label: strip(q.text), answer: q.exemptOn === 'yes' ? 'Yes' : 'No', answers: { [q.id]: q.exemptOn }, reason: q.reason }));

w('| Answer this question | With | The letter should list |');
w('| --- | --- | --- |');
ynExemptions.forEach(e => {
  w('| ' + e.label + ' | **' + e.answer + '** | ' + e.reason + ' |');
});
blank();
ynExemptions.forEach(e => check('`' + e.reason + '` — ' + e.label));

h3('Disability benefits');

w('The disability question takes more than one answer. Each of these on its own should give the');
w('exempt result.');
blank();
S.DISABILITY_OPTION_DEFS.forEach(o => {
  const answers = { disability: [o.id] };
  const reasons = A.exemptReasons(answers);
  check('"' + strip(o.label) + '" alone → exempt, listing: ' + reasons.join('; '));
});
check('"' + strip(A.qById('disability').noneLabel) + '" alone → **not** exempt on its own.');
check('A named benefit **and** "Other" together → the letter lists both ' + `\`${S.DISABILITY_OPTION_DEFS.find(o => !o.other && o.exempt).label}\`` + ' style reasons, not just one.');
blank();
w('**Each ticked benefit is its own reason**, from 2026-08-06. They used to collapse into one');
w('"I get disability benefits" line, which left a caseworker unable to tell EAEDC from');
w('workers compensation. Tick two and check both places:');
blank();
check('On the results page each appears as its own ticked reason, flat, not indented under a parent line.');
check('In the printed letter each is its own bullet.');
check('The order follows the order of the options on the question, not the order you ticked them.');
check('**"Other" reads differently from the rest.** It is the one asking DTA to review something, so it should say "' + strip(S.DISABILITY_OTHER_REASON) + '" rather than naming a benefit.');

h3('State agencies');

w('This was a yes/no with the agency names printed underneath until 2026-08-06. It is now the');
w('list itself, so the tool knows which agency, and the separate Yes/No pair is gone. Because');
w('it is no longer a yes/no it is absent from the table above, which is why it has its own');
w('section: the checklist would otherwise never have you test it at all.');
blank();
S.STATE_AGENCY_OPTION_DEFS.forEach(o => {
  check('"' + strip(o.label) + '" alone → exempt, listing: ' + A.exemptReasons({ stateagency: [o.id] }).join('; '));
});
check('"' + strip(A.qById('stateagency').noneLabel) + '" → **not** exempt.');
check('Nothing ticked at all → **not** exempt.');
blank();
check('The first option reads "' + strip(S.STATE_AGENCY_OPTION_DEFS[0].label) + '". The former name matters: someone whose paperwork still says Mass Rehab has to recognise it here.');
check('There is **no** separate Yes/No pair under the list. The list is the answer.');
check('Ticking two agencies gives **two** reasons on the results page and two bullets in the letter, each naming its agency, in the order the options are listed rather than the order you ticked them.');

h3('Working');

w('Three ways of working count. ' + S.THRESHOLD_SOURCE);
blank();
S.WORK_OPTION_DEFS.forEach(o => {
  const answers = { working: o.id };
  check('"' + strip(o.labelDraft || o.label) + '" → exempt, listing: ' + A.exemptReasons(answers).join('; '));
});
check('"' + strip(A.qById('working').noneLabel) + '" → **not** exempt.');
blank();
w('| Threshold | Value in the tool |');
w('| --- | --- |');
w('| Weekly earnings that make someone exempt | $' + S.WORK_INCOME_THRESHOLD.toFixed(2) + ' before taxes |');
w('| Massachusetts minimum wage used | $' + S.MA_MIN_WAGE + ' an hour |');
w('| Hours a week at that wage that make someone exempt | ' + S.WORK_HOURS_AT_MIN_WAGE + ' |');
/* Was labelled "Hours that count as meeting the rules", which was wrong and wrong in the
   one way this tool cannot afford. 30 hours is an *exemption* threshold: work that much and
   the rules do not apply to you. Meeting the rules is 20 hours a week, 80 a month, which is
   what RESULT_COPY.workOption1 tells people on screen. A tester checking this table against
   the screen would have found 30 against 20 and had no way to know which was right.
   copy-doc.js and decision-spec.js both had it right; this was the outlier. */
w('| Hours a week that exempt while earning under minimum wage | ' + S.WORK_HOURS_COMPLIANCE + ' |');
w('| Hours a week that count as **meeting** the rules | 20 (80 a month), per the wording below |');
blank();
w('Those are two different numbers doing two different jobs, and the difference is the whole');
w('tool: 30 hours a week means the work rules do not apply to you, 20 hours a week means they');
w('do apply and you are satisfying them. Anyone reviewing these should confirm both.');
blank();
w('| What the screen says about meeting the rules |');
w('| --- |');
w('| ' + strip(C.workOption1) + ' |');

h3('No regular place to sleep');

w('This one is not a straight yes. Answering **No** to "Do you have a regular place to sleep at');
w('night?" opens a follow-up, and the combination decides it. The full truth table is checked');
w('automatically; these are the cases worth doing by hand because they are the ones that would');
w('be wrong in a way nobody notices.');
blank();

const housingCases = [
  { pick: 'None of the above', answers: { housing: 'no', housingFollowup: S.NONE } },
  { pick: 'Nothing at all (the follow-up left untouched)', answers: { housing: 'no' } },
  { pick: 'Hospitalised in the last 6 months', answers: { housing: 'no', housingFollowup: ['hospitalized'] } },
  { pick: 'Sees a provider for an ongoing illness', answers: { housing: 'no', housingFollowup: ['ongoing_care'] } },
  { pick: 'Diploma only', answers: { housing: 'no', housingFollowup: ['diploma'] } },
  { pick: 'Diploma AND a steady job', answers: { housing: 'no', housingFollowup: ['diploma', 'steady_job'] } },
  { pick: 'Diploma AND full-time student', answers: { housing: 'no', housingFollowup: ['diploma', 'full_time_student'] } },
  { pick: 'Diploma, steady job, AND hospitalised', answers: { housing: 'no', housingFollowup: ['diploma', 'steady_job', 'hospitalized'] } }
];
w('| After answering "No", pick | Expected result |');
w('| --- | --- |');
housingCases.forEach(c => {
  const exempt = A.exemptReasons(c.answers).indexOf(S.HOUSING_EXEMPT_REASON) !== -1;
  w('| ' + c.pick + ' | ' + (exempt ? '**Exempt**' : 'Not exempt on housing') + ' |');
});
blank();
housingCases.forEach(c => check(c.pick));
blank();
check('Answering **Yes** to "Do you have a regular place to sleep at night?" hides the follow-up entirely.');
check('Answering **No**, picking something, then changing to **Yes** clears the follow-up rather than keeping a hidden answer.');
blank();

w('**The ticked answers are echoed back.** The author asked on 2026-08-06 for whatever someone');
w('ticks in the follow-up to appear on the results page and in the letter, so DTA sees what');
w('they actually said and not just the summary line. Read these as a person would: the list');
w('can include things that look like arguments against the exemption, and that is deliberate,');
w('because DTA is being asked to review the whole picture.');
blank();
check('Answer **No**, tick two or three options, and go to results. They appear as indented sub-bullets under "' + strip(S.HOUSING_EXEMPT_REASON) + '", not as separate exemptions with their own ticks.');
check('They read in the order the options are listed on the question, whatever order you ticked them in.');
check('The green tick appears on the housing reason only, not on each sub-bullet.');
check('Print or save the letter. The same answers appear, introduced by "' + strip(C.statementHousingPicksLead) + '", **above** your own typed explanation. Your words should be the last thing in that section.');
check('Tick **' + strip(A.qById('housingFollowup').noneLabel) + '** instead. Still exempt, and no sub-bullets and no list in the letter, because there is nothing to list.');
check('With a screen reader, the sub-bullets are announced as a list belonging to the reason above them, not as five more exemptions.');
blank();
w('One case to look at and judge rather than tick. Picking **diploma and a steady job** and');
w('nothing else is not exempt on housing, so there is no housing reason on the results page');
w('for the ticked answers to sit under, and they are not shown anywhere. If that reads as the');
w('tool losing what someone told it, say so: the author asked for these to be echoed back and');
w('this is the one path where they are not.');

h2('3. The age question and its result');

w('Added 2026-08-06 as the first question in section 1. It is the only answer that ends the');
w('screening where it stands, and the only result that offers no letter, so none of the');
w('checks above cover it. It is also absent from the exemption table in section 2 on purpose:');
w('answering No is not an exemption reason, it changes the result outright.');
blank();
w('The question is optional, like every other one. It is deliberately not required.');
blank();
check('Answer **No** and click **Next** on section 1. You should land straight on the age result without seeing sections 2, 3, or 4.');
check('Answer **No** and use **Skip to results** instead. Same screen.');
check('The result heading reads: ' + strip(C.ageExemptHeading));
check('The panel explains that DTA already has the date of birth on file and that no further action is needed.');
check('The word **still** is in italics in the sentence about DTA sending a notice anyway. That emphasis is the author\'s and is the point of the sentence.');
check('The email address in that sentence opens a mail app addressed to ' + strip(S.LINKS.advocacyEmail) + '.');
check('There is **no** statement form, no name or signature field, and no "Print or save this form" button on this screen. DTA already holds the date of birth, so there is nothing to sign.');
check('**Age beats everything.** Answer Yes to pregnant and No to the age question in the same section. Expect the age result, not the exempt result, and no list of reasons.');
check('Answer **Yes** to the age question and continue. Section 2 appears and the screening behaves exactly as before.');
check('Leave the age question blank and continue. Nothing changes: the result is whatever the other answers give.');
check('From the age result, **← Back** returns to section 1 with the answer still selected.');
check('Clicking the selected **No** a second time clears it, and **Next** then goes to section 2 as normal.');

h2('4. The order the decision is made in');

w('These are precedence rules. Each one is a case where two things are true at once and only one');
w('answer is right.');
blank();
check('**The age result beats every other outcome.** It is checked before the exemption list, so someone outside 18 through 64 gets the age result no matter what else they answered.');
check('**An exemption beats good cause.** Answer Yes to pregnant and also pick a good-cause reason. Expect exempt, and the good-cause question should never have been shown.');
check('**Good cause only when nothing else applies.** With no exemption, the good-cause question appears as the last question.');
check('Picking "' + strip(A.GOODCAUSE.noneLabel) + '" on the good-cause question gives the "may need to meet the work rules" result, not good cause.');
check('Every question is optional: clicking a selected answer a second time clears it, and the result changes back.');
check('"Skip to results" from any point gives the same result as answering nothing further.');

h2('5. The guided version (archived)');

w('The shipping screener is write-in only. The guided ending lives at');
w('`archive/snap-guided/` for records. Everything in sections 1–3 applies to both builds,');
w('because the decision is identical: the guided questions add detail to the letter and');
w('change nothing about who is exempt. **That is itself worth testing on the archive copy.**');
blank();
check('Run the same answers through both URLs. The result screen, the reasons listed, and the outcome must be identical.');
check('Answer every guided question, then go back and change your screening answers. The result must still match what the write-in build gives for those answers.');
blank();

w('The guided version asks ' + (function () {
  const seen = new Set();
  [{ health: 'yes' }, { caretaker: 'yes' }, { child6: 'yes' }, { working: 'income_weekly' },
    { disability: ['other'] }, { housing: 'no', housingFollowup: S.NONE }, { goodcause: 'transport' }]
    .forEach(a => A.guidedQuestions(a).forEach(q => seen.add(q.id)));
  return seen.size;
})() + ' extra questions in total, but nobody sees more than a handful: only the ones about');
w('their own exemptions are asked.');

h3('Which reasons trigger extra questions');

const blockCases = [
  { label: 'A health reason', answers: { health: 'yes' } },
  { label: 'Caring for someone who cannot care for themselves', answers: { caretaker: 'yes' } },
  { label: 'Caring for a child under 6', answers: { child6: 'yes' } },
  { label: 'Working (any of the three)', answers: { working: 'income_weekly' } },
  { label: 'Another disability benefit ("Other")', answers: { disability: ['other'] } },
  { label: 'No regular place to sleep', answers: { housing: 'no', housingFollowup: S.NONE } },
  { label: 'A good reason for missing hours', answers: { goodcause: 'transport' } }
];
w('| Reason | Questions asked |');
w('| --- | --- |');
blockCases.forEach(c => {
  w('| ' + c.label + ' | ' + A.guidedQuestions(c.answers).length + ' |');
});
blank();
w('And the ones that need no explaining, where the guided version should ask **nothing** and go');
w('straight to a finished letter:');
blank();
[
  { label: 'Pregnant', answers: { pregnant: 'yes' } },
  { label: 'Lives with a child under 14', answers: { child14: 'yes' } },
  { label: 'Gets or applying for TAFDC', answers: { tafdc: 'yes' } },
  { label: 'Alaska Native or a member of a Tribe', answers: { tribe: 'yes' } },
  { label: 'In school half-time or more', answers: { school: 'yes' } },
  { label: 'Gets or applying for unemployment', answers: { unemployment: 'yes' } },
  { label: 'A safety or domestic violence situation', answers: { dv: 'yes' } },
  { label: 'In a substance use treatment programme', answers: { substanceUse: 'yes' } },
  { label: 'Gets services from a state agency', answers: { stateagency: 'yes' } },
  { label: 'A named disability benefit (SSI/SSDI and the like)', answers: { disability: ['ssi_ssdi'] } }
].forEach(c => {
  const n = A.guidedQuestions(c.answers).length;
  check(c.label + ' → no extra questions' + (n === 0 ? '' : '  ⚠ CURRENTLY ASKS ' + n + ', THIS IS A BUG'));
});

h3('Every guided question and its answers');

w('Work through these on the details screen. Each should be answerable, skippable, and clearable.');
blank();

const seenQ = new Set();
blockCases.forEach(c => {
  A.guidedQuestions(c.answers).forEach(q => {
    if (seenQ.has(q.id)) return;
    seenQ.add(q.id);
    w('**' + strip(q.text) + '**');
    blank();
    if (q.type === 'yn') {
      w('- Yes');
      w('- No');
    } else {
      (q.options || []).forEach(o => w('- ' + strip(o.label)));
      if (q.noneLabel) w('- ' + strip(q.noneLabel) + '  *(the one way to decline)*');
    }
    blank();
  });
});
check('Every option above can be selected, and clicking it again clears it.');
check('No question offers two different ways of saying "I do not know". There should be exactly one, and it should be last.');
check('Skipping a question leaves its sentence out of the letter rather than filling in a guess.');

h3('Every sentence the tool can write');

w('These are the words that end up above someone\'s signature on a letter to a state agency.');
w('**Read each one as if you were the DTA worker receiving it.**');
blank();

const sentenceCases = [
  { label: 'Health, all three answered', answers: { health: 'yes', d_health_kind: 'both', d_health_length: 'long', d_health_care: 'regularly' } },
  { label: 'Health, nothing answered', answers: { health: 'yes' } },
  { label: 'Health, declined to say which kind', answers: { health: 'yes', d_health_kind: S.NONE, d_health_care: 'no' } },
  { label: 'Caretaking, all answered', answers: { caretaker: 'yes', d_care_who: 'adult', d_care_often: 'daily', d_care_alone: 'alone' } },
  { label: 'Caretaking, nothing answered', answers: { caretaker: 'yes' } },
  { label: 'Child under 6, all answered', answers: { child6: 'yes', d_child6_live: 'yes', d_child6_often: 'most_days' } },
  { label: 'Child under 6, does not live with them', answers: { child6: 'yes', d_child6_live: 'no' } },
  { label: 'Working, with proof', answers: { working: 'income_weekly', d_work_hours: 'h20_29', d_work_jobs: 'one', d_work_proof: ['paystubs', 'employer_letter'] } },
  { label: 'Working, needs help getting proof', answers: { working: 'hours_30', d_work_hours: 'varies', d_work_proof: ['need_help'] } },
  { label: 'Working, some proof and some help needed', answers: { working: 'income_weekly', d_work_proof: ['paystubs', 'need_help'] } },
  { label: 'Another disability benefit, named', answers: { disability: ['other'], d_disability_other: 'masshealth' } },
  { label: 'Another disability benefit, not on the list', answers: { disability: ['other'], d_disability_other: S.NONE } },
  { label: 'A named benefit as well', answers: { disability: ['ssi_ssdi', 'other'], d_disability_other: 'private' } },
  { label: 'No regular place to sleep, several barriers', answers: { housing: 'no', housingFollowup: S.NONE, d_housing_where: 'outside', d_housing_barriers: ['no_address', 'no_transport', 'unsafe'] } },
  { label: 'No regular place to sleep, nothing else answered', answers: { housing: 'no', housingFollowup: S.NONE } },
  { label: 'Good cause, transportation', answers: { goodcause: 'transport', d_gc_what: 'car_broke', d_gc_when: ['this_month', 'last_month'], d_gc_now: 'still' } },
  { label: 'Good cause, an emergency, now over', answers: { goodcause: 'emergency', d_gc_what: 'death', d_gc_when: ['last_month'], d_gc_now: 'over' } },
  { label: 'Good cause, a job situation, over three months', answers: { goodcause: 'employment', d_gc_what: 'discrimination', d_gc_when: ['longer'], d_gc_now: 'still' } },
  { label: 'Good cause, nothing answered', answers: { goodcause: 'transport' } }
];
sentenceCases.forEach(c => {
  const text = composed(c.answers);
  w('- [ ] **' + c.label + '**');
  w('      ' + (text || '*(writes nothing, which is correct here)*'));
});
blank();
check('Every sentence above is true of the person who would have picked those answers, and says nothing they did not say.');
check('None of them reads as though a computer wrote it in a way DTA would question.');
check('Dates in the good-cause sentences name the right months, counting back from today.');

h3('The letter must not repeat itself');

w('The letter can state a reason in three places: the bulleted list, a fixed paragraph, and the');
w('person\'s own explanation. In the guided version the explanation is a real sentence, so the');
w('other two have to give way.');
blank();
check('A reason with a paragraph beneath it does **not** also appear as a bullet.');
check('A reason with no paragraph **does** still appear as a bullet. Try pregnant plus a health reason: one bullet, one paragraph.');
check('The housing letter says "I do not have a regular place to sleep" exactly once.');
check('The good-cause letter does not repeat its own opening sentence.');
check('The working letter states the exemption once and does not promise proof twice.');
check('In Version A, the full bullet list and all the fixed paragraphs are still there. None of the above applies to it.');

h3('Reading it back');

check('The composed statement is shown on screen before the signature, in full.');
check('"' + strip(C.composedChangeLabel) + '" goes back to the questions with the previous answers still selected.');
check('Changing an answer and returning updates the letter.');
check('There is no empty text box anywhere in the guided version.');

h2('6. The letter itself');

w('Test this on both versions. The letter is the whole point: everything else is a way of');
w('getting to it.');
blank();
check('**Print or save this form** opens the print dialog and the preview shows the letter, not the web page.');
check('The letter has today\'s date, the DTA address block, and the person\'s name.');
/* These two contradicted the spec until 2026-08-07. They said the letter carries "their client ID
 * if they gave one" and that leaving it blank "omits that row", which was true before the author
 * removed the on-screen field on 2026-08-06 and asked for the printed letter to always carry a
 * blank for it. A checklist that asserts the opposite of the intended behaviour is worse than a
 * missing one: a tester following it files a bug against a screen that is correct. The section
 * further down, "The Client / DTA Agency ID line", has had the right checks the whole time. */
check('The Client / DTA Agency ID row is on the letter **every time**, with an empty line to write on. There is no way to fill it in on screen, so it is never pre-filled.');
check('Each row of the header block has **one** rule under it, not two. The rows waiting to be written on, From and the Agency ID, are a touch darker than the rows that already have a value.');
check('The signature line and the Printed name line are two clearly separate rules of the same weight, not one thick smudge.');
check('**Download as Word** produces a file that opens in Word, and the signature is in it as a picture.');
check('**Email myself a copy** opens a panel where you can enter an email address.');
check('The panel says sending from this page is not set up yet, and **Send** stays disabled.');
check('**Open in my email app instead** opens the mail app with the summary already filled in.');
check('On a machine with no mail app, the fallback panel appears with the text to copy, and "Copy the text" works.');
check('A very long set of answers still produces a usable email; the summary is trimmed with a note saying so rather than silently cut.');

h3('What to send DTA');

w('The exempt result tells someone what proof to send, one line per kind of exemption. These are');
w('the author’s wording, added 2026-08-06. One note appears however many boxes were');
w('ticked: someone who selects three agencies should be told to send a letter once.');
blank();
check('The notes sit together in a pale blue panel headed "' + strip(C.exemptProofHeading) + '", not as loose paragraphs. It is blue rather than amber or red: amber is what the "may need to meet the work rules" result wears, and red would read as something being wrong with the exemption.');
check('Earning enough, or 30+ hours below minimum wage: ' + strip(C.exemptProofWork));
check('Any disability benefit, including Other: ' + strip(C.exemptProofDisability));
check('Any state agency: ' + strip(C.exemptProofStateAgency));
/* No proof line for housing since 2026-08-06, so this is a check that nothing appears. */
check('No regular place to sleep: **no** proof line. The letter already asks DTA to review the housing situation in its own paragraph, so the results card does not repeat it.');
blank();
check('Tick **three** disability benefits. The proof line appears **once**, not three times.');
check('Tick **three** state agencies. Same: one line.');
check('Exempt only for pregnancy, or only for living with a child under 14: **no** proof line at all, because those speak for themselves.');
check('Exempt for a disability benefit **and** work income: two proof lines, one for each.');

h3('The EAEDC pointer');

w('Pat\'s suggestion, added 2026-08-07. One exemption carries a line pointing at a different');
w('programme, and the condition attached to it is that it stays off the printable letter. Nothing');
w('about the screen looks wrong if it leaks into the letter, so that half has to be looked for.');
blank();
Object.keys(S.REASON_RESULT_NOTES).forEach(id => {
  const n = S.REASON_RESULT_NOTES[id];
  check('Answer so the result lists **' + strip(S.REASON_TEXT_BY_ID[id]) + '**. Indented under it: "'
    + strip(n.text) + ' ' + strip(n.linkLabel) + '."');
  check('The link opens ' + n.href);
  check('**Print or save this form.** The letter lists the reason and does **not** mention EAEDC anywhere.');
  check('**Email myself a copy.** The summary does **not** mention EAEDC either.');
});
check('Exempt for pregnancy instead: no EAEDC line anywhere on the results screen.');

h3('The Client / DTA Agency ID line');

w('The author removed the typed field on 2026-08-06 and asked for the printed letter to carry a');
w('blank for it instead. So this is the one thing on the letter that exists nowhere on screen,');
w('which makes it the easiest to lose without noticing.');
blank();
check('There is **no** Client / Agency ID box to type into anywhere in the form. Only **Your name**.');
check('Print or save the letter. It has a ruled blank labelled "' + strip(S.STATEMENT_AGENCY_LABEL) + '", whether or not anything else was filled in.');
check('Under that blank it reads: ' + strip(S.STATEMENT_AGENCY_HINT));
check('Download the Word version and email it to yourself. The blank is in both.');
check('The emailed **summary** carries no ID and no blank for one. It is a text reminder, not the letter.');
check('The blank is wide enough to hand-write eight or nine digits on a printed page.');

h3('The signature');

check('Signing with a finger on a phone works and the mark appears.');
check('Signing with a mouse works.');
check('**Clear** empties the pad.');
check('A drawn signature appears in the printed letter as a real image, not a font.');
check('Leaving the pad empty prints a ruled line to sign by hand. This is the only route for someone who cannot use a pointer, so it must work.');
check('Rotating the phone does not wipe a signature already drawn.');

/* Added 2026-08-07. The header and footer were rebuilt over one day: the gutter, the stacked
 * mobile masthead, the tagline-less wordmark, MLRI's footer text, the legal strip, the
 * copyright, the way back to the site. None of it had a single check, and chrome is the part a
 * tester skims past because it looks like furniture. Two of the bugs found in that day were in
 * it, and both were invisible on a desktop. */
h2('7. The header and the footer');

w('These are on every screen, which is why they get looked at least. Check them once here rather');
w('than hoping they turn up in another section.');
blank();
h3('The header');

check('The wordmark goes to masslegalhelp.org. It is the way back to the site for anyone who does not scroll to the footer.');
check('**On a phone,** the masthead stacks: wordmark centred on its own row, **Quick exit** centred underneath. That is what MassLegalHelp do on theirs.');
check('**On a phone,** the wordmark reads **Mass Legal Help** only. "Massachusetts Legal Information" is dropped below 560px, as on their site.');
/* The specific regression. It was drawn over the wordmark on a review host and nobody had a
   check that would have caught it, because it only shows at some widths and never on a laptop. */
check('Narrow the browser slowly from wide to about 320px. The buttons **never** touch or overlap the wordmark at any width in between. This broke once and only showed on a phone.');
check('The wordmark is noticeably smaller on a phone than on a desktop, and never wider than the screen.');

h3('The footer');

check('The screener\'s footer carries MLRI\'s approved paragraph, word for word: "' + FOOTER_TEXT + '"');
check('The **tools landing page** footer does **not** carry that paragraph. It describes the SNAP screener, and that page will list several tools.');
check('The darker strip under it has three links and the copyright: **MassLegalHelp.org**, **Terms of Use**, **Privacy Policy**, then ©2026 Massachusetts Legal Assistance Corporation on the right.');
check('All three links go somewhere real. Terms and Privacy open in a new tab; MassLegalHelp.org opens in the same one, because someone using it means to leave.');
check('Coming back with the browser Back button after MassLegalHelp.org still has your answers.');
/* The ring was the page default, #1f2c5c, which is 1:1 on the footer band. Nothing revealed it
   until these links arrived, because a logo is not something people tab to. */
check('**Tab to each footer link.** A gold focus ring is clearly visible on the dark background. A navy one would be invisible there, which is what it used to be.');
check('On a phone the strip wraps tidily: links on one line, copyright under them, nothing clipped at the edge.');

h2('8. Privacy and safety');

w('The questions cover pregnancy, disability, substance use treatment, and domestic violence. The');
w('working assumption is a shared or borrowed phone.');
blank();
check('**Quick exit** leaves the site immediately.');
check('After Quick exit, pressing Back does **not** return to a screen with answers on it.');
check('After Quick exit, reopening the tool shows the start page with nothing filled in.');
check('**Delete my answers** on the results screen clears everything and returns to the start.');
check('Closing the tab and reopening the tool shows the start page, not the previous answers.');
check('Refreshing mid-way keeps the answers, so a stray reload does not mean starting over.');
check('Open the browser\'s network tab and run the whole screening. **Nothing should be sent anywhere.** No analytics, no fonts from a CDN, no error reporting.');
check('Nothing typed into the name, ID, or explanation fields appears in any URL.');
check('The privacy callout on the start page and on the statement form shows the same wording: **'
  + strip(C.privacyIntroLead) + '** ' + strip(C.privacyIntroBody));

h2('9. Accessibility');

w('People using this tool are more likely than average to have a disability. That is what several');
w('of the exemptions are about.');
blank();

h3('Keyboard only');

check('Unplug the mouse. The whole screening can be completed with Tab, arrow keys, Space, and Enter.');
check('Arrow keys move between the options of one question; Tab moves between questions.');
check('The focus outline is always visible and never hidden behind the sticky footer.');
check('Every button and link can be reached and activated.');
check('The signature pad cannot be operated by keyboard. Confirm the sentence explaining the paper alternative is present and reachable, and that leaving it blank prints a signature line.');

h3('Screen reader');

check('The section heading is announced when you move between sections.');
check('The progress bar announces "Section 2 of 4" when the section changes, not just visually.');
check('Each question is announced with its options, and selecting one announces the change.');
check('Help text behind "What does this mean?" is reachable and announced.');
check('The dotted-underlined **ABAWD** on the start page announces as "What does ABAWD mean?", opens on Enter or Space, and reads the definition. The same for **exempt** in the exempt result heading, which should announce "What does exempt mean?" and not the ABAWD one.');
check('The result screen heading is announced on arrival.');
check('The signature pad announces as a control with an explanation, not as an unlabelled image.');

h3('Seeing it');

check('Zoom the browser to 200%. Nothing overlaps, nothing is cut off, no horizontal scrolling.');
check('At 400% zoom, or a 320px-wide window, the questions and buttons are still usable.');
check('Turn on the operating system\'s "reduce motion" setting. Screens change without animation. The start button still visibly presses in when clicked: that is feedback for a deliberate action, not decoration, so it should survive the setting. What goes is the easing, not the movement.');
check('In high contrast mode, the selected answer is still visibly selected.');
check('A selected answer is marked by more than colour alone: there is a filled dot or tick as well as a border.');

h2('10. Devices and conditions');

check('An older Android phone on a slow connection. Time how long the first screen takes.');
check('An iPhone, in Safari.');
check('A desktop browser: Chrome, Firefox, Safari, and Edge.');
check('A phone with the text size turned up in the OS settings.');
check('Airplane mode partway through: does the tool keep working, given it needs no network after loading?');
check('A tablet in both orientations.');
check('The browser Back button mid-screening. It should not lose answers or land on a broken screen.');

h2('11. Review-only modes and the archived guided build');

check('The tools landing page shows one SNAP card only.');
check('`?sample=exempt`, `?sample=goodcause`, and `?sample=notexempt` each open the right result on a review host.');
check('Sample mode shows the "Sample result" banner and does not overwrite a real session.');
check('The archived guided build at `archive/snap-guided/` still loads and names itself as archived.');

h2('12. Things only a person can judge');

w('None of this can be automated and all of it matters more than the rest of this document.');
blank();
check('**Is the wording right?** Read `SCREENER-WALKTHROUGH.md`, which lays out every word in the order someone meets it. The author has final say on copy.');
check('**Are the thresholds still current?** ' + S.THRESHOLD_SOURCE + ' Worth re-checking only if a state minimum wage rise or a federal change has landed since.');
check('**Is the exemption list complete?** Someone who knows DTA policy should confirm nothing is missing. A missing exemption is a person who stays cut off.');
check('**Would DTA accept the composed letter?** The guided version is archived, but the composed sentences in `SCREENER-COPY.md` section 10 are still worth a legal read if the idea returns.');
check('**Is a composed statement still the claimant\'s statement?** A question for lawyers, not designers. It sits above their signature.');
check('**Does it read as though it respects the person?** Someone in this situation has usually been told no several times already.');
check('**The legal footer.** The disclaimer came out on 2026-07-30 and has not been replaced, so nothing currently says this is not legal advice, sends nothing to DTA, and does not change a SNAP case. All three are true and worth saying.');
check('**Terms of Use and Privacy Policy links.** Absent, because the URLs are unknown. Get them from the vendor.');
check('**Quick exit destination.** Currently weather.com. Confirm that is the right neutral site.');
check('**Languages.** English only. MassLegalHelp publishes the ABAWD article in Spanish.');

h2('13. What is already checked automatically');

w('Do not spend manual time on these. They run on every push and fail the build.');
blank();
w('```');
w('"$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" scripts/check-pages.js');
w('"$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" --test tests/snap-screening-logic.test.js tests/render-smoke.test.js');
w('"$LOCALAPPDATA/OpenAI/Codex/bin/node.exe" scripts/publish-mlh.js --check');
w('python docassemble-snap-abawd/tests/test_snap_abawd_parity.py');
w('python docassemble-snap-abawd/tests/test_good_cause_text.py');
w('```');
blank();
w('| Checked automatically | Where |');
w('| --- | --- |');
w('| Every exemption rule, and the full 33-row housing truth table | `tests/snap-screening-logic.test.js` |');
w('| The JavaScript and the Python Docassemble port agreeing | `test_snap_abawd_parity.py` |');
w('| Every composed sentence, and that guided answers never change the decision | `tests/snap-screening-logic.test.js` |');
w('| That the letter never states a reason twice | `tests/snap-screening-logic.test.js` |');
w('| Every screen rendering without throwing | `tests/render-smoke.test.js` |');
w('| Answers never reaching localStorage, and Quick exit clearing them | `tests/render-smoke.test.js` |');
w('| No parent-relative path that would 404 in production | `scripts/publish-mlh.js` |');
w('| The copy documents matching the code | the `generated-files` CI job |');
w('| A walk through both versions in a real browser | `tests/snap-screening.spec.js`, CI only |');
blank();
w('The browser suite cannot run on the authoring machine, so it runs only in CI. If you are');
w('checking a change locally, the browser paths are the ones your own testing has to cover.');

h2('14. Reporting what you find');

w('Useful:');
blank();
w('- Which version, A or B, and the URL you were on');
w('- The answers you gave, in order');
w('- What you expected and what happened');
w('- The device and browser');
w('- A screenshot, or the printed letter, if the problem is in the wording');
blank();
w('**Anything where the tool tells someone they must meet the work rules when they might be');
w('exempt is the most serious kind of problem here.** Say so plainly and it will go to the front.');

blank();
w('---');
blank();
w('_Generated by `scripts/testing-doc.js`. The exemptions, guided questions, and composed');
w('sentences above are read from the screener itself, so this checklist cannot quietly fall');
w('behind the tool. Re-run it after any change and the build fails if you have not._');

/* The "skip section N" note near the top names a section number and a check count, and both are
 * facts about a document that does not exist until the last line is written. So it is emitted
 * with placeholders and filled in here, from the sections actually produced.
 *
 * Written out by hand first, as "skip section 5, that is 47 of the checks". Which is the same
 * shape as every drift bug found this week: a number copied to a second place, correct on the
 * day and wrong the moment a check is added. The throw below is the point of the exercise. A
 * placeholder that silently survived would put `{{ARCHIVED_CHECKS}}` in front of a reviewer. */
const counted = [];
for (const l of lines) {
  const h = /^## (\d+)\. (.+)$/.exec(l);
  if (h) counted.push({ no: Number(h[1]), title: h[2], checks: 0 });
  else if (/^- \[ \]/.test(l) && counted.length) counted[counted.length - 1].checks += 1;
}
const archived = counted.find(s => /archived/i.test(s.title) && /guided/i.test(s.title));
const core = counted.slice().sort((a, b) => b.checks - a.checks)[0];
const FILL = {
  ARCHIVED_NO: archived && String(archived.no),
  ARCHIVED_CHECKS: archived && String(archived.checks),
  /* Every check in the file, not the sum over `counted`. "Before you start" is an unnumbered
   * heading, so its checks fall outside the per-section walk and summing that walk reported 210
   * where the script's own console line said 213. Two totals for one document is the drift this
   * whole mechanism exists to prevent, in miniature. */
  TOTAL_CHECKS: String(lines.filter(l => l.startsWith('- [ ]')).length),
  CORE_NO: core && String(core.no)
};
let doc = lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
for (const [k, v] of Object.entries(FILL)) {
  if (!v) throw new Error('testing-doc: nothing to fill {{' + k + '}} with. Did a section get renamed?');
  doc = doc.split('{{' + k + '}}').join(v);
}
const leftover = /\{\{[A-Z_]+\}\}/.exec(doc);
if (leftover) throw new Error('testing-doc: placeholder ' + leftover[0] + ' reached the output.');

fs.writeFileSync(OUT, doc, 'utf8');
console.log('Wrote ' + path.basename(OUT));
console.log('  ' + lines.filter(l => l.startsWith('- [ ]')).length + ' checks, '
  + sentenceCases.length + ' sentences, ' + seenQ.size + ' guided questions');
