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
w('| Write-in (shipping) | `http://127.0.0.1:4173/masslegalhelp/tool/snap/` |');
w('| Guided (archived) | `http://127.0.0.1:4173/archive/snap-guided/` |');
w('| The tools landing page | `http://127.0.0.1:4173/masslegalhelp/tool/` |');
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

h3('Working');

w('Three ways of working count. The thresholds below were last verified in November 2025 and');
w('still need someone who knows the rules to confirm them.');
blank();
S.WORK_OPTION_DEFS.forEach(o => {
  const answers = { working: o.id };
  check('"' + strip(o.labelDraft || o.label) + '" → exempt, listing: ' + A.exemptReasons(answers).join('; '));
});
check('"' + strip(A.qById('working').noneLabel) + '" → **not** exempt.');
blank();
w('| Threshold | Value in the tool |');
w('| --- | --- |');
w('| Weekly earnings that make someone exempt | $' + S.WORK_INCOME_THRESHOLD + ' |');
w('| Minimum wage used | $' + S.MA_MIN_WAGE + ' an hour |');
w('| Hours a week at minimum wage | ' + S.WORK_HOURS_AT_MIN_WAGE + ' |');
w('| Hours that count as meeting the rules | ' + S.WORK_HOURS_COMPLIANCE + ' |');

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

h2('3. The order the decision is made in');

w('These are precedence rules. Each one is a case where two things are true at once and only one');
w('answer is right.');
blank();
check('**An exemption beats good cause.** Answer Yes to pregnant and also pick a good-cause reason. Expect exempt, and the good-cause question should never have been shown.');
check('**Good cause only when nothing else applies.** With no exemption, the good-cause question appears as the last question.');
check('Picking "' + strip(A.GOODCAUSE.noneLabel) + '" on the good-cause question gives the "may need to meet the work rules" result, not good cause.');
check('Every question is optional: clicking a selected answer a second time clears it, and the result changes back.');
check('"Skip to results" from any point gives the same result as answering nothing further.');

h2('4. The guided version (archived)');

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

h2('5. The letter itself');

w('Test this on both versions. The letter is the whole point: everything else is a way of');
w('getting to it.');
blank();
check('**Print or save this form** opens the print dialog and the preview shows the letter, not the web page.');
check('The letter has today\'s date, the DTA address block, the person\'s name, and their client ID if they gave one.');
check('Leaving the client ID blank omits that row rather than printing an empty label.');
check('**Download as Word** produces a file that opens in Word, and the signature is in it as a picture.');
check('**Email myself a copy** opens a panel where you can enter an email address.');
check('The panel says sending from this page is not set up yet, and **Send** stays disabled.');
check('**Open in my email app instead** opens the mail app with the summary already filled in.');
check('On a machine with no mail app, the fallback panel appears with the text to copy, and "Copy the text" works.');
check('A very long set of answers still produces a usable email; the summary is trimmed with a note saying so rather than silently cut.');

h3('The signature');

check('Signing with a finger on a phone works and the mark appears.');
check('Signing with a mouse works.');
check('**Clear** empties the pad.');
check('A drawn signature appears in the printed letter as a real image, not a font.');
check('Leaving the pad empty prints a ruled line to sign by hand. This is the only route for someone who cannot use a pointer, so it must work.');
check('Rotating the phone does not wipe a signature already drawn.');

h2('6. Privacy and safety');

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

h2('7. Accessibility');

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

h2('8. Devices and conditions');

check('An older Android phone on a slow connection. Time how long the first screen takes.');
check('An iPhone, in Safari.');
check('A desktop browser: Chrome, Firefox, Safari, and Edge.');
check('A phone with the text size turned up in the OS settings.');
check('Airplane mode partway through: does the tool keep working, given it needs no network after loading?');
check('A tablet in both orientations.');
check('The browser Back button mid-screening. It should not lose answers or land on a broken screen.');

h2('9. Review-only modes and the archived guided build');

check('The tools landing page shows one SNAP card only.');
check('`?sample=exempt`, `?sample=goodcause`, and `?sample=notexempt` each open the right result on a review host.');
check('Sample mode shows the "Sample result" banner and does not overwrite a real session.');
check('The archived guided build at `archive/snap-guided/` still loads and names itself as archived.');

h2('10. Things only a person can judge');

w('None of this can be automated and all of it matters more than the rest of this document.');
blank();
check('**Is the wording right?** Read `SCREENER-WALKTHROUGH.md`, which lays out every word in the order someone meets it. The author has final say on copy.');
check('**Are the thresholds current?** $' + S.WORK_INCOME_THRESHOLD + ' a week and $' + S.MA_MIN_WAGE + ' an hour were last verified in November 2025. MLRI\'s own ABAWD article was reviewed in February 2026, so the article is newer than the tool.');
check('**Is the exemption list complete?** Someone who knows DTA policy should confirm nothing is missing. A missing exemption is a person who stays cut off.');
check('**Would DTA accept the composed letter?** The guided version is archived, but the composed sentences in `SCREENER-COPY.md` section 10 are still worth a legal read if the idea returns.');
check('**Is a composed statement still the claimant\'s statement?** A question for lawyers, not designers. It sits above their signature.');
check('**Does it read as though it respects the person?** Someone in this situation has usually been told no several times already.');
check('**The legal footer.** The disclaimer came out on 2026-07-30 and has not been replaced, so nothing currently says this is not legal advice, sends nothing to DTA, and does not change a SNAP case. All three are true and worth saying.');
check('**Terms of Use and Privacy Policy links.** Absent, because the URLs are unknown. Get them from the vendor.');
check('**Quick exit destination.** Currently weather.com. Confirm that is the right neutral site.');
check('**Languages.** English only. MassLegalHelp publishes the ABAWD article in Spanish.');

h2('11. What is already checked automatically');

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

h2('12. Reporting what you find');

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

fs.writeFileSync(OUT, lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n', 'utf8');
console.log('Wrote ' + path.basename(OUT));
console.log('  ' + lines.filter(l => l.startsWith('- [ ]')).length + ' checks, '
  + sentenceCases.length + ' sentences, ' + seenQ.size + ' guided questions');
