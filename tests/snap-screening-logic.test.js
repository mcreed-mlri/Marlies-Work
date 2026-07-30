'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const SnapScreening = require('../masslegalhelp/snap-screening-logic.js');

const { NONE, WORK_REASON_INCOME, WORK_REASON_HOURS_30, DISABILITY_OTHER_REASON, HOUSING_EXEMPT_REASON, LINKS, RESULT_COPY, exemptHeadingHtml, exemptProofNotes, buildDtaContactsHtml, buildResultsEmailContent, buildResultsMailto, MAILTO_MAX_URL, create, migrateAnswers, resultTypeFor, exemptReasonsFor, housingUnableExempt, buildQuestions, statementPromptsFor, goodCauseCategories } = SnapScreening;

describe('snap-screening-logic', () => {
  const classic = create('classic');
  const v2 = create('v2');
  const classic2 = create('classic2');

  it('classic and v2 produce the same resultType for equivalent answers', () => {
    const cases = [
      { child14: 'yes' },
      { health: 'yes' },
      { housing: 'no', housingFollowup: NONE },
      { housing: 'no', housingFollowup: ['diploma', 'steady_job'] },
      { working: 'income_weekly' },
      { working: 'hours_30' },
      { goodcause: 'transport' },
      { disability: ['other'] },
      { disability: ['ssi_ssdi'] },
      {}
    ];
    for (const answers of cases) {
      assert.equal(
        classic.resultType(answers),
        v2.resultType(answers),
        JSON.stringify(answers)
      );
    }
  });

  it('child under 14 is exempt', () => {
    assert.equal(classic.resultType({ child14: 'yes' }), 'exempt');
  });

  it('housing none-of-the-above is exempt', () => {
    assert.equal(classic.resultType({ housing: 'no', housingFollowup: NONE }), 'exempt');
  });

  it('housing with diploma and steady job is not exempt via housing', () => {
    const answers = { housing: 'no', housingFollowup: ['diploma', 'steady_job'] };
    assert.equal(housingUnableExempt(answers), false);
    assert.equal(classic.resultType(answers), 'notexempt');
  });

  it('income work is exempt with income reason', () => {
    const answers = { working: 'income_weekly' };
    assert.equal(classic.resultType(answers), 'exempt');
    assert.ok(exemptReasonsFor(answers, classic.QUESTIONS).includes(WORK_REASON_INCOME));
  });

  it('30+ hours below minimum wage is exempt', () => {
    const answers = { working: 'hours_30' };
    assert.equal(classic.resultType(answers), 'exempt');
    assert.ok(exemptReasonsFor(answers, classic.QUESTIONS).includes(WORK_REASON_HOURS_30));
  });

  it('good cause when no exemption', () => {
    assert.equal(classic.resultType({ goodcause: 'emergency' }), 'goodcause');
  });

  it('other disability benefit routes to cautious exemption', () => {
    const answers = { disability: ['other'] };
    assert.equal(classic.resultType(answers), 'exempt');
    assert.ok(exemptReasonsFor(answers, classic.QUESTIONS).includes(DISABILITY_OTHER_REASON));
  });

  it('disability SSI is exempt', () => {
    assert.equal(classic.resultType({ disability: ['ssi_ssdi'] }), 'exempt');
  });

  it('age outside range returns ageinfo', () => {
    assert.equal(classic.resultType({ ageRange: 'no' }), 'ageinfo');
  });

  it('multiple exemption reasons can apply together', () => {
    assert.equal(classic.resultType({ child14: 'yes', working: 'hours_30' }), 'exempt');
  });

  it('migrateAnswers converts legacy label strings', () => {
    const legacy = {
      working: 'I make $217.50 a week or more (before taxes)',
      housingFollowup: ['I have a high school diploma (including GED or HiSet)'],
      disability: ['SSI or SSDI'],
      goodcause: 'Yes, I have temporary transportation issues'
    };
    const migrated = migrateAnswers(legacy, 'classic');
    assert.equal(migrated.working, 'income_weekly');
    assert.deepEqual(migrated.housingFollowup, ['diploma']);
    assert.deepEqual(migrated.disability, ['ssi_ssdi']);
    assert.equal(migrated.goodcause, 'transport');
  });

  it('v2 good cause text resolves by id', () => {
    const answers = { goodcause: 'transport' };
    assert.match(v2.goodCauseText(answers), /transportation/i);
  });

  it('substance use treatment is exempt', () => {
    assert.equal(classic.resultType({ substanceUse: 'yes' }), 'exempt');
  });

  it('dv and safety route remains exempt', () => {
    assert.equal(classic.resultType({ dv: 'yes' }), 'exempt');
  });

  it('resultType no longer returns meeting', () => {
    assert.notEqual(classic.resultType({ working: 'hours_30' }), 'meeting');
  });

  it('shouldSkipGoodCause for exempt paths', () => {
    assert.equal(classic.shouldSkipGoodCause({ child14: 'yes' }), true);
    assert.equal(classic.shouldSkipGoodCause({ working: 'hours_30' }), true);
    assert.equal(classic.shouldSkipGoodCause({}), false);
  });

  it('work option labels include current thresholds', () => {
    const working = buildQuestions('classic').find(q => q.id === 'working');
    const labels = working.options.map(o => o.label).join(' ');
    assert.match(labels, /\$217\.50/);
    assert.match(labels, /14\.5/);
    assert.match(labels, /\$15/);
  });

  it('buildStatementHTML uses a plain professional letter format', () => {
    const html = SnapScreening.buildStatementHTML({
      name: 'Jane Doe',
      agency: '12345',
      explain: 'I need help updating my case.',
      rt: 'exempt',
      rs: ['Pregnant'],
      today: 'January 1, 2026'
    });
    assert.match(html, /Dear DTA,/);
    assert.match(html, /I am writing to ask that you update my SNAP case/);
    assert.match(html, /Jane Doe/);
    assert.match(html, /SNAP benefits, ABAWD work rules/);
    assert.match(html, /break-inside:avoid/);
    assert.doesNotMatch(html, /Statement to DTA/);
    assert.doesNotMatch(html, /Court Forms Online/);
    assert.doesNotMatch(html, /not an official DTA form/);
    assert.doesNotMatch(html, /not legal advice/);
    assert.doesNotMatch(html, /How to send this statement/);
    assert.doesNotMatch(html, /SAMPLE - draft/);
  });

  /* ---- classic2: the author's website copy draft ---- */

  it('classic2 decides the same result as classic for equivalent answers', () => {
    const cases = [
      { child14: 'yes' },
      { health: 'yes' },
      { housing: 'no', housingFollowup: NONE },
      { housing: 'no', housingFollowup: ['diploma', 'steady_job'] },
      { working: 'income_weekly' },
      { working: 'hours_30' },
      { goodcause: 'transport' },
      { disability: ['other'] },
      { disability: ['ssi_ssdi'] },
      { ageRange: 'no' },
      {}
    ];
    for (const answers of cases) {
      assert.equal(classic2.resultType(answers), classic.resultType(answers), JSON.stringify(answers));
    }
  });

  it('classic2 carries the draft-only rendering fields', () => {
    const byId = classic2.Q_BY_ID;
    assert.match(byId.child14.helpHtml, /SNAP household/);
    assert.match(byId.caretaker.helpHtml, /Adult Foster Care provider/);
    assert.match(byId.dv.helpHtml, /contact info here/);
    assert.match(byId.health.help, /short- or long-term/);
    assert.match(byId.housing.help, /couch surfing/);
    assert.equal(byId.stateagency.text, 'Do you receive services from any state agencies?');
    assert.match(byId.stateagency.helpHtml, /MassAbility/);
    assert.equal(byId.stateagency.listItems, undefined);
    assert.equal(classic2.GROUPS[0].title, 'Your Family and Household');
    assert.equal(classic2.GROUPS[2].title, 'Public Benefits and Participating in Programs');
    assert.match(classic2.GOODCAUSE.text, /Is something making it hard to work/);
    assert.match(byId.school.yesLabel, /half-time or more/);
    assert.match(byId.substanceUse.help, /daily program/);
    // Other variants must not pick these up.
    assert.equal(classic.Q_BY_ID.stateagency.listItems, undefined);
    assert.equal(classic.Q_BY_ID.school.yesLabel, undefined);
  });

  it('classic2 work options use the draft wording and still normalize', () => {
    const labels = classic2.Q_BY_ID.working.options.map(o => o.label);
    assert.ok(labels.every(l => l.startsWith('Yes, I am ')), labels.join(' | '));
    assert.match(labels.join(' '), /\$217\.50/);
    const migrated = migrateAnswers({ working: labels[2] }, 'classic2');
    assert.equal(migrated.working, 'hours_30');
  });

  it('an unknown variant falls back to classic', () => {
    assert.equal(create('nope').Q_BY_ID.health.text, classic.Q_BY_ID.health.text);
  });

  it('statementPromptsFor returns one prompt per exemption that needs one', () => {
    const answers = { health: 'yes', caretaker: 'yes', pregnant: 'yes' };
    const prompts = classic2.statementPrompts(answers);
    assert.equal(prompts.length, 2);
    assert.match(prompts[0], /health reason/);
    assert.match(prompts[1], /caretaking/);
  });

  it('statementPromptsFor dedupes the two work reasons and always returns one', () => {
    const both = statementPromptsFor([WORK_REASON_INCOME, WORK_REASON_HOURS_30]);
    assert.equal(both.length, 1);
    assert.deepEqual(statementPromptsFor([], 'goodcause'), ['Explain why you had to miss work, school, or volunteer hours']);
    assert.equal(statementPromptsFor(['Pregnant']).length, 1);
    assert.equal(statementPromptsFor([HOUSING_EXEMPT_REASON]).length, 1);
  });

  it('classic2 lists every good-cause category for the results screen', () => {
    const cats = classic2.GOODCAUSE_CATEGORIES;
    assert.deepEqual(cats.map(c => c.title), ['No transportation', 'Emergency', 'Employment issues']);
    assert.ok(cats.every(c => c.detail.length > 0));
    assert.equal(cats.filter(c => c.moreExamplesUrl).length, 2);
    assert.equal(goodCauseCategories('classic2').length, 3);
  });

  it('buildStatementHTML renders one labelled block per prompt', () => {
    const html = SnapScreening.buildStatementHTML({
      name: 'Jane Doe',
      rt: 'exempt',
      rs: ['Pregnant'],
      explain: [
        { prompt: 'Explain the health reason', text: 'chronic back pain' },
        { prompt: 'Explain your caretaking', text: '' }
      ]
    });
    assert.match(html, /Explain the health reason/);
    assert.match(html, /chronic back pain/);
    assert.match(html, /Explain your caretaking/);
    assert.doesNotMatch(html, /No additional explanation provided/);
  });

  it('buildStatementHTML still accepts a plain string explain', () => {
    const html = SnapScreening.buildStatementHTML({ rt: 'exempt', rs: ['Pregnant'], explain: 'just one box' });
    assert.match(html, /just one box/);
    assert.doesNotMatch(html, /No additional explanation provided/);
  });

  it('buildResultsEmailContent summarizes exempt results for mailto', () => {
    const { subject, body } = buildResultsEmailContent({
      rt: 'exempt',
      rs: ['Pregnant'],
      name: 'Jane Doe',
      explain: [{ prompt: 'Explain pregnancy', text: 'Due in March.' }]
    });
    assert.match(subject, /My SNAP ABAWD screening results/);
    assert.match(body, /Pregnant/);
    assert.match(body, /Jane Doe/);
    assert.match(body, /Due in March/);
    assert.match(body, /Print or save this form/);
  });

  /* ----------------------------------------------------------------------- *
   * mailto length. Windows refuses to hand off a mailto past roughly 2048
   * characters and some clients truncate silently, so a filled-in statement
   * used to produce an empty draft or no draft at all with nothing to show the
   * user what went wrong.
   * ----------------------------------------------------------------------- */
  describe('buildResultsMailto', () => {
    it('passes a short summary through whole', () => {
      const { url, truncated } = buildResultsMailto({ subject: 'Subj', body: 'Line one\nLine two' });
      assert.equal(truncated, false);
      assert.equal(url, 'mailto:?subject=Subj&body=' + encodeURIComponent('Line one\nLine two'));
    });

    it('trims a long summary to fit and says so in the draft', () => {
      const body = Array.from({ length: 200 }, (_, i) => 'Sentence number ' + i + ' of the statement.').join('\n');
      const { url, truncated } = buildResultsMailto({ subject: RESULT_COPY.emailSelfSubject, body });
      assert.equal(truncated, true);
      assert.ok(url.length <= MAILTO_MAX_URL, 'url is ' + url.length + ' chars, over the ' + MAILTO_MAX_URL + ' cap');
      const draft = decodeURIComponent(url.split('&body=')[1]);
      assert.match(draft, /Sentence number 0 of the statement\./);
      assert.ok(draft.endsWith(RESULT_COPY.emailTruncatedNote), 'trimmed draft must point at the full copy');
    });

    it('keeps the whole real summary when the boxes are left empty', () => {
      const { body } = buildResultsEmailContent({ rt: 'exempt', rs: ['Pregnant'], name: 'Jane Doe' });
      assert.equal(buildResultsMailto({ subject: RESULT_COPY.emailSelfSubject, body }).truncated, false);
    });

    it('does not split a surrogate pair into an unencodable string', () => {
      // Emoji are two code units each, so a naive slice lands mid-pair and
      // encodeURIComponent throws URIError.
      const { url } = buildResultsMailto({ subject: 'S', body: '\u{1F600}'.repeat(600) });
      assert.doesNotThrow(() => decodeURIComponent(url.split('&body=')[1]));
    });

    it('never returns more than the cap even with a huge subject', () => {
      const { url, truncated } = buildResultsMailto({ subject: 'x'.repeat(3000), body: 'anything' });
      assert.equal(truncated, true);
      assert.equal(url.endsWith('&body='), true);
    });
  });

  it('RESULT_COPY and buildDtaContactsHtml carry the author results draft', () => {
    // The heading must not assert an exemption the screening cannot confirm.
    assert.match(RESULT_COPY.exemptHeading, /^You may be exempt and do not need to meet the ABAWD work rules because of these reasons:$/);
    assert.doesNotMatch(RESULT_COPY.exemptHeading, /Good news|You are exempt/);
    // Only "exempt" and "do not need to meet the ABAWD work rules" carry
    // emphasis, and the plain string must stay in sync with the marked-up one.
    const headingHtml = exemptHeadingHtml();
    assert.equal(headingHtml.replace(/<\/?strong>/g, ''), RESULT_COPY.exemptHeading);
    assert.equal(headingHtml.match(/<strong>/g).length, 2);
    assert.match(headingHtml, /^You may be <strong>exempt<\/strong> and <strong>do not need to meet the ABAWD work rules<\/strong> because of these reasons:$/);
    // The heading absorbed this sentence, so it must stay empty and every
    // render site must omit the paragraph rather than print a blank one.
    assert.equal(RESULT_COPY.exemptReasonsIntro, '');
    assert.match(RESULT_COPY.formTitleExempt, /^Tell DTA that you are exempt as soon as you can\.$/);
    /* "myself" has to stay in the label. Every other button on this screen
     * sends something to DTA, so a bare "Email" reads as emailing DTA, and a
     * user could leave believing DTA has their exemption. */
    assert.match(RESULT_COPY.emailSelfLabel, /^Email myself a copy$/);
    assert.match(RESULT_COPY.emailSelfLabel, /myself/);
    // Print and Save fired the same handler, so the two buttons are now one.
    assert.match(RESULT_COPY.printFormLabel, /^Print or save this form$/);
    assert.match(RESULT_COPY.downloadWordLabel, /^Download as Word$/);
    assert.match(RESULT_COPY.savingTipsBody, /Save as PDF/);
    assert.match(RESULT_COPY.printLead, /\(More info on how to contact DTA in the box below\)$/);
    assert.match(RESULT_COPY.whyInfoLabel, /^Why are we asking for more information\?$/);
    // The pop-up wording is exemption-specific, so good cause gets its own.
    assert.match(RESULT_COPY.whyInfoExempt, /^Telling DTA about your exemption can help them update your SNAP case more quickly\./);
    assert.match(RESULT_COPY.whyInfoGoodCause, /^Telling DTA about your good reason can help them update your SNAP case more quickly\./);
    assert.match(RESULT_COPY.otherWaysHeading, /tell DTA/i);
    assert.match(RESULT_COPY.learnMoreLabel, /ABAWD work rules/);
    assert.doesNotMatch(RESULT_COPY.learnMoreLabel, /SNAP/);
    const contacts = buildDtaContactsHtml(LINKS);
    assert.match(contacts, /local DTA office/);
    assert.match(contacts, /Click here/);
    assert.match(contacts, /8773822363/);
    assert.match(contacts, /Upload on <a/);
  });

  it('exempt proof notes only appear when the answers make them relevant', () => {
    const notesFor = (answers) => exemptProofNotes(classic.exemptReasons(answers));

    // Exempt for a reason that speaks for itself: no proof sentence at all.
    assert.equal(classic.resultType({ child14: 'yes' }), 'exempt');
    assert.deepEqual(notesFor({ child14: 'yes' }), []);
    assert.deepEqual(notesFor({ pregnant: 'yes' }), []);
    // A named disability benefit needs no detail; only the "Other" pick does.
    // Assert the reason list is non-empty first, so a bad option id here cannot
    // make the "no notes" expectation pass for the wrong reason.
    assert.ok(classic.exemptReasons({ disability: ['ssi_ssdi'] }).length > 0);
    assert.deepEqual(notesFor({ disability: ['ssi_ssdi'] }), []);
    assert.deepEqual(notesFor({ disability: ['other'] }), [RESULT_COPY.exemptProofDisability]);

    // Work-based exemptions ask for pay proof, either route in.
    assert.deepEqual(notesFor({ working: 'income_weekly' }), [RESULT_COPY.exemptProofWork]);
    assert.deepEqual(notesFor({ working: 'hours_30' }), [RESULT_COPY.exemptProofWork]);

    assert.deepEqual(notesFor({ housing: 'no', housingFollowup: NONE }), [RESULT_COPY.exemptProofHousing]);

    // Several at once: draft order, no duplicates.
    assert.deepEqual(
      notesFor({ child14: 'yes', working: 'income_weekly', housing: 'no', housingFollowup: NONE, disability: ['other'] }),
      [RESULT_COPY.exemptProofWork, RESULT_COPY.exemptProofHousing, RESULT_COPY.exemptProofDisability]
    );

    // The two work reasons together still yield one sentence.
    assert.deepEqual(exemptProofNotes([WORK_REASON_INCOME, WORK_REASON_HOURS_30]), [RESULT_COPY.exemptProofWork]);
    // Tolerates junk input rather than throwing mid-render.
    assert.deepEqual(exemptProofNotes(undefined), []);
    assert.deepEqual(exemptProofNotes([HOUSING_EXEMPT_REASON, DISABILITY_OTHER_REASON]).length, 2);

    // Every note stands on its own now, so none may keep the "If this is" framing.
    [RESULT_COPY.exemptProofWork, RESULT_COPY.exemptProofHousing, RESULT_COPY.exemptProofDisability]
      .forEach(s => assert.doesNotMatch(s, /^If this is based on/));
  });

  it('must-meet-the-rules copy matches the reviewed edits', () => {
    assert.match(RESULT_COPY.notExemptHeading, /^You may need to meet the ABAWD work rules$/);
    // The "You did not pick a reason to be exempt" sentence was cut.
    assert.doesNotMatch(RESULT_COPY.notExemptIntro, /did not pick/);
    assert.match(RESULT_COPY.notExemptStartOver, /start the form over/);
    assert.match(RESULT_COPY.notExemptReapplyLead, /^Already lost your SNAP because of the work rules\? You can$/);
    assert.match(RESULT_COPY.notExemptEmail, /^Email$/);
    assert.match(RESULT_COPY.notExemptEmailSuffix, /^if you lost or are about to lose SNAP because of these rules\.$/);
    assert.match(RESULT_COPY.workOption1Unpaid, /^Examples of unpaid work can include/);
    assert.match(RESULT_COPY.workOption2, /how many hours to volunteer\.$/);
    assert.match(RESULT_COPY.meetingDtaStatement, /\(handwritten note is fine\) onto$/);
    // The statement sentence folds into the DTAConnect bullet on this screen.
    const merged = buildDtaContactsHtml(LINKS, { uploadPrefix: 'Upload a statement onto' });
    assert.match(merged, /<li>Upload a statement onto <a/);
    assert.doesNotMatch(merged, /Upload on/);
  });

  it('every LINKS entry is an absolute URL or a bare email address', () => {
    const entries = Object.entries(LINKS);
    assert.ok(entries.length >= 13);
    for (const [key, value] of entries) {
      const ok = key === 'advocacyEmail' ? /^[^@\s]+@[^@\s]+$/.test(value) : /^https:\/\/\S+$/.test(value);
      assert.ok(ok, `${key} = ${value}`);
    }
  });
});
