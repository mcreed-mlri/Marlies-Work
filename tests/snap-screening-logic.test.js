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
    assert.match(RESULT_COPY.whyInfoExempt, /^Telling DTA about why you missed hours can help them update your SNAP case more quickly\.$/);
    assert.match(RESULT_COPY.whyInfoGoodCause, /^Telling DTA about why you missed hours can help them update your SNAP case more quickly\.$/);
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

  /* ---- Guided mode -------------------------------------------------------
   *
   * ?v=guided replaces the write-in boxes with pick-lists and composes the
   * statement from the answers. Everything it writes ends up above someone's
   * signature on a letter to a state agency, so the properties below are the
   * ones worth holding still. */
  describe('guided mode composes the statement from pick-lists', () => {
    // Fixed, because the good-cause sentence names months.
    const AUG = new Date(2026, 7, 1);
    const compose = (answers, today) =>
      classic2.composeStatement(answers, today || AUG).map(e => e.text).join(' ');

    /* The load-bearing one. Guided mode may add as many questions as it likes so
     * long as none of them decides anything: decision-spec.json is generated
     * from this module and the Python parity suite reads that JSON, so an answer
     * that leaked into the decision would put the two implementations out of
     * step without either test noticing it was a guided question that did it. */
    it('no guided answer changes who is exempt or what the result is', () => {
      const bases = [
        { health: 'yes' },
        { caretaker: 'yes' },
        { child6: 'yes' },
        { working: 'income_weekly' },
        { working: 'hours_30' },
        { disability: ['other'] },
        { housing: 'no', housingFollowup: NONE },
        { housing: 'no', housingFollowup: ['diploma', 'steady_job'] },
        { goodcause: 'transport' },
        { goodcause: NONE },
        { pregnant: 'yes' },
        {}
      ];
      for (const base of bases) {
        const before = { rt: classic2.resultType(base), rs: classic2.exemptReasons(base) };
        // Answer every guided question this case reaches, both ways.
        for (const fill of ['first', 'none']) {
          const filled = { ...base };
          for (const q of classic2.guidedQuestions(base)) {
            if (fill === 'none') { filled[q.id] = NONE; continue; }
            if (q.type === 'yn') filled[q.id] = 'yes';
            else if (q.type === 'multi') filled[q.id] = q.options.map(o => o.id);
            else filled[q.id] = q.options[0].id;
          }
          assert.equal(classic2.resultType(filled), before.rt,
            `guided answers (${fill}) changed the result for ${JSON.stringify(base)}`);
          assert.deepEqual(classic2.exemptReasons(filled), before.rs,
            `guided answers (${fill}) changed the exempt reasons for ${JSON.stringify(base)}`);
          assert.equal(classic2.shouldSkipGoodCause(filled), classic2.shouldSkipGoodCause(base));
        }
      }
    });

    it('asks nothing when every exemption speaks for itself', () => {
      // Pregnant, TAFDC, a Tribe, school, unemployment, DV, substance use, and a
      // named disability benefit all need no explaining.
      for (const answers of [
        { pregnant: 'yes' }, { tafdc: 'yes' }, { tribe: 'yes' }, { school: 'yes' },
        { unemployment: 'yes' }, { dv: 'yes' }, { substanceUse: 'yes' },
        { disability: ['ssi_ssdi'] }, { child14: 'yes' }
      ]) {
        assert.equal(classic2.guidedQuestions(answers).length, 0, JSON.stringify(answers));
        assert.equal(classic2.composeStatement(answers, AUG).length, 0, JSON.stringify(answers));
      }
    });

    it('asks nothing at all when nobody is exempt and there is no good cause', () => {
      for (const answers of [{}, { child14: 'no' }, { goodcause: NONE }]) {
        assert.equal(classic2.guidedQuestions(answers).length, 0, JSON.stringify(answers));
        assert.equal(classic2.composeStatement(answers, AUG).length, 0, JSON.stringify(answers));
      }
    });

    it('asks only about the exemptions the person actually has', () => {
      const ids = (a) => classic2.guidedQuestions(a).map(q => q.id);
      assert.deepEqual(ids({ health: 'yes' }), ['d_health_kind', 'd_health_length', 'd_health_care']);
      assert.deepEqual(ids({ child6: 'yes' }), ['d_child6_live', 'd_child6_often']);
      assert.deepEqual(ids({ disability: ['other'] }), ['d_disability_other']);
      // A named benefit needs no explaining; "other" alongside it still does.
      assert.deepEqual(ids({ disability: ['ssi_ssdi', 'other'] }), ['d_disability_other']);
      /* Both work exemptions share one block rather than asking twice. The
       * 30-hours path drops the hours question, since that exemption is itself
       * the answer to it; see the test below. */
      assert.deepEqual(ids({ working: 'income_weekly' }), ['d_work_hours', 'd_work_jobs', 'd_work_proof']);
      assert.deepEqual(ids({ working: 'hours_30' }), ['d_work_jobs', 'd_work_proof']);
    });

    it('good cause replaces the exemption questions rather than adding to them', () => {
      // Someone with an exemption never reaches the good-cause screen at all.
      const gc = classic2.guidedQuestions({ goodcause: 'transport' });
      assert.deepEqual(gc.map(q => q.id), ['d_gc_what', 'd_gc_when', 'd_gc_now']);
      assert.deepEqual(classic2.guidedQuestions({ health: 'yes', goodcause: 'transport' })
        .map(q => q.id), ['d_health_kind', 'd_health_length', 'd_health_care']);
    });

    it('branches the good-cause question on the category already picked', () => {
      const what = (id) => classic2.guidedQuestions({ goodcause: id })
        .find(q => q.id === 'd_gc_what').options.map(o => o.id);
      assert.ok(what('transport').includes('car_broke'));
      assert.ok(!what('transport').includes('death'));
      assert.ok(what('emergency').includes('death'));
      assert.ok(what('employment').includes('harassment'));
    });

    /* One escape hatch per question, and it is always the last option.
     * Two ("I do not know" above "I am not sure") read as a distinction the
     * person has to work out, and there is none. */
    it('every guided question offers exactly one way to decline', () => {
      const OPT_OUT = /not sure|rather not say|do not know|not on this list|Something else|None of these/i;
      const seen = new Set();
      for (const base of [
        { health: 'yes' }, { caretaker: 'yes' }, { child6: 'yes' },
        { working: 'income_weekly' }, { disability: ['other'] },
        { housing: 'no', housingFollowup: NONE }, { goodcause: 'transport' }
      ]) {
        for (const q of classic2.guidedQuestions(base)) {
          if (seen.has(q.id)) continue;
          seen.add(q.id);
          if (q.type === 'yn') continue;
          assert.ok(q.noneLabel, q.id + ' has no noneLabel, so it renders a blank last option');
          const labels = [...q.options.map(o => o.label), q.noneLabel];
          const outs = labels.filter(l => OPT_OUT.test(l));
          assert.equal(outs.length, 1, q.id + ' offers ' + JSON.stringify(outs));
          assert.ok(OPT_OUT.test(q.noneLabel), q.id + ': the opt-out must be the last option');
        }
      }
      assert.equal(seen.size, 17, 'the guided question count moved; check the copy doc');
    });

    it('writes the full sentence when every question is answered', () => {
      assert.equal(
        compose({ health: 'yes', d_health_kind: 'physical', d_health_length: 'long', d_health_care: 'regularly' }),
        'I have a physical health condition that makes it hard for me to work 30 or more hours a week. '
        + 'It has lasted 6 months or more, or I expect it to. '
        + 'I see a health care provider for it regularly, and I can ask them for a letter if you need one.'
      );
      assert.equal(
        compose({ caretaker: 'yes', d_care_who: 'adult', d_care_often: 'daily', d_care_alone: 'alone' }),
        'I take care of an adult who cannot care for themselves. I do this every day. '
        + 'I am the only person providing this care.'
      );
      assert.equal(
        compose({ child6: 'yes', d_child6_live: 'yes', d_child6_often: 'most_days' }),
        'I take care of a child under 6 years old. The child lives with me. '
        + 'I care for them most days of the week.'
      );
      /* Opens with the exemption claim, because in the letter this paragraph
       * replaces the fixed one that used to make it. */
      assert.equal(
        compose({ working: 'income_weekly', d_work_hours: 'h20_29', d_work_jobs: 'one',
          d_work_proof: ['paystubs', 'employer_letter'] }),
        'I earn enough income to be exempt from the ABAWD work rules. '
        + 'I usually work about 20 to 29 hours a week at one job. '
        + 'I can send you my pay stubs and a letter from my employer.'
      );
      /* Closes with the request the fixed housing paragraph used to make. */
      assert.equal(
        compose({ housing: 'no', housingFollowup: NONE, d_housing_where: 'shelter',
          d_housing_barriers: ['no_address', 'no_transport'] }),
        'I do not have a regular place to sleep. I usually sleep in a shelter. '
        + 'This makes it hard for me to work. I have no address or phone to give an employer. '
        + 'I have no reliable way to get to a job. '
        + 'Please review my situation to decide whether I am unable to work under the ABAWD screening.'
      );
    });

    /* The 30-hours exemption is itself an answer about hours, so asking again
     * is a question whose answer is already known, and the bands on offer let
     * someone disagree with what they just said: picking "about 20 to 29 hours"
     * produced a letter claiming 30 or more in one sentence and something else
     * in the next. On a letter to a state agency that is not a rough edge. */
    it('does not ask about hours when the exemption is already about hours', () => {
      assert.deepEqual(
        classic2.guidedQuestions({ working: 'hours_30' }).map(q => q.id),
        ['d_work_jobs', 'd_work_proof']
      );
      // The pay-based exemptions say nothing about hours, so it is still asked.
      for (const w of ['income_weekly', 'hours_min_wage']) {
        assert.deepEqual(
          classic2.guidedQuestions({ working: w }).map(q => q.id),
          ['d_work_hours', 'd_work_jobs', 'd_work_proof']
        );
      }
      assert.equal(
        compose({ working: 'hours_30', d_work_jobs: 'one' }),
        'I work 30 or more hours a week while earning less than minimum wage. I have one job.'
      );
      /* A stale answer can still reach compose: answer the hours question on
       * the pay path, go back, and change how you work. It must not contradict
       * the claim. */
      assert.equal(
        compose({ working: 'hours_30', d_work_hours: 'h20_29', d_work_jobs: 'one' }),
        'I work 30 or more hours a week while earning less than minimum wage. I have one job.'
      );
    });

    /* The sentence continues "...that makes it hard for me to work", so the
     * phrase naming the condition has to be singular to agree with it. */
    it('the health sentence agrees with itself when both kinds are picked', () => {
      const both = compose({ health: 'yes', d_health_kind: 'both' });
      assert.equal(
        both,
        'I have both a physical and a mental health condition that makes it hard for me to '
        + 'work 30 or more hours a week.'
      );
      assert.doesNotMatch(both, /conditions that makes/);
      // Every kind has to agree, not only this one.
      for (const kind of ['physical', 'mental', 'both', NONE]) {
        assert.match(compose({ health: 'yes', d_health_kind: kind }), /condition that makes it hard/);
      }
    });

    /* The property that makes the whole approach defensible: a skipped question
     * drops its clause instead of guessing. What is left still has to be a true
     * sentence, and one the exemption already supports. */
    it('drops the clause for anything skipped rather than guessing', () => {
      assert.equal(
        compose({ health: 'yes' }),
        'I have a health condition that makes it hard for me to work 30 or more hours a week.'
      );
      assert.equal(
        compose({ health: 'yes', d_health_kind: NONE, d_health_length: NONE, d_health_care: NONE }),
        'I have a health condition that makes it hard for me to work 30 or more hours a week.'
      );
      assert.equal(
        compose({ health: 'yes', d_health_care: 'no' }),
        'I have a health condition that makes it hard for me to work 30 or more hours a week. '
        + 'I am not seeing a health care provider for it right now.'
      );
      assert.equal(compose({ caretaker: 'yes' }), 'I take care of someone who cannot care for themselves.');
      assert.equal(compose({ child6: 'yes' }), 'I take care of a child under 6 years old.');
      assert.equal(
        compose({ housing: 'no', housingFollowup: NONE }),
        'I do not have a regular place to sleep. '
        + 'Please review my situation to decide whether I am unable to work under the ABAWD screening.'
      );
      // No hours and no jobs picked leaves the claim and what the proof supports.
      assert.equal(
        compose({ working: 'income_weekly', d_work_proof: ['paystubs'] }),
        'I earn enough income to be exempt from the ABAWD work rules. I can send you my pay stubs.'
      );
    });

    it('asks for help with proof rather than promising documents that do not exist', () => {
      const claim30 = 'I work 30 or more hours a week while earning less than minimum wage. ';
      assert.equal(
        compose({ working: 'hours_30', d_work_proof: ['need_help'] }),
        claim30 + 'I need help getting proof of my work hours and pay.'
      );
      // Picking help alongside a real document must not claim both are coming.
      assert.equal(
        compose({ working: 'hours_30', d_work_proof: ['paystubs', 'need_help'] }),
        claim30 + 'I can send you my pay stubs. I may need help getting the rest.'
      );
      // The claim stands alone; it is the exemption, not a detail.
      assert.equal(compose({ working: 'hours_30', d_work_proof: NONE }), claim30.trim());
    });

    /* The one place a pick-list is weaker than the box it replaces. A named
     * benefit reads as a claim DTA can act on; anything else has to degrade to a
     * promise to bring paperwork, because no list holds every disability payment
     * in the country. Asserted so the weaker wording cannot be lost by accident. */
    it('names the disability benefit when it can, and promises paperwork when it cannot', () => {
      assert.equal(
        compose({ disability: ['other'], d_disability_other: 'masshealth' }),
        'I receive MassHealth based on a disability determination. '
        + 'Please review it as part of my exemption screening.'
      );
      for (const v of [NONE, undefined]) {
        assert.equal(
          compose({ disability: ['other'], d_disability_other: v }),
          'I receive a disability benefit or payment that was not on the list. '
          + 'I will bring the paperwork so you can review it.'
        );
      }
    });

    /* "also" needs something to refer back to. A named benefit stays in the
     * letter's bullet list; "Other" on its own leaves no bullet at all in
     * composed mode, and the sentence opened by pointing at nothing. */
    it('says "also" only when a named benefit is listed above it', () => {
      assert.match(
        compose({ disability: ['ssi_ssdi', 'other'], d_disability_other: 'masshealth' }),
        /^I also receive MassHealth/
      );
      assert.match(
        compose({ disability: ['other'], d_disability_other: 'masshealth' }),
        /^I receive MassHealth/
      );
    });

    it('names the months for a good-cause statement', () => {
      const gc = (when, today) =>
        compose({ goodcause: 'transport', d_gc_what: 'car_broke', d_gc_when: when, d_gc_now: 'still' }, today);
      // Same year: the year is said once, not after every month.
      assert.match(gc(['this_month', 'last_month']), /I missed hours in July and August 2026\./);
      assert.match(gc(['last_month']), /I missed hours in July 2026\./);
      // Across a year boundary it has to be repeated or the sentence is wrong.
      assert.match(gc(['this_month', 'last_month'], new Date(2026, 0, 15)),
        /I missed hours in December 2025 and January 2026\./);
      assert.match(gc(['longer']), /I missed hours for more than three months\./);
      // Oldest first, whatever order they were picked in.
      assert.match(gc(['two_months', 'this_month', 'last_month']),
        /I missed hours in June, July, and August 2026\./);
      // No month picked still leaves a true sentence.
      assert.equal(gc(NONE),
        'My car broke down and I had no other way to get there. This is still going on.');
      /* The good-cause letter already opens "I am writing to explain why I could
       * not meet the ABAWD work rules for one or more months" and then quotes
       * the category, so this paragraph saying it a third time was padding. */
      assert.doesNotMatch(gc(['last_month']), /I could not meet the ABAWD work rules/);
      // Nothing answered leaves the quoted category standing on its own.
      assert.equal(compose({ goodcause: 'transport' }), '');
    });

    it('month options stay relative so the copy does not change every month', () => {
      const when = classic2.guidedQuestions({ goodcause: 'transport' }).find(q => q.id === 'd_gc_when');
      for (const o of when.options) {
        assert.doesNotMatch(
          o.label, /20\d\d|January|February|March|April|May|June|July|August|September|October|November|December/,
          'a month name in an option label would change SCREENER-COPY.md every month and fail CI'
        );
      }
    });

    /* The letter can state a reason in three places: the bulleted list, a fixed
     * paragraph for the four reasons that get one, and the person's own
     * explanation. In write-in mode the third is a blank box so the repetition
     * never showed. Composed, it did: one letter said "I do not have a regular
     * place to sleep" twice, and another listed "Take care of a child under 6
     * years old" as a bullet directly above a paragraph opening with the same
     * words. Composed, the paragraph is the only statement of its reason. */
    describe('a composed letter states each reason once', () => {
      const letterFor = (answers) => SnapScreening.buildStatementHTML({
        name: 'Test Person',
        rt: classic2.resultType(answers),
        rs: classic2.exemptReasons(answers),
        gcText: classic2.goodCauseText(answers),
        explain: classic2.composeStatement(answers, AUG),
        composed: true,
        today: 'August 1, 2026'
      });
      const times = (haystack, needle) => haystack.split(needle).length - 1;

      it('drops the bullet for a reason a paragraph already covers', () => {
        const letter = letterFor({
          child14: 'yes', child6: 'yes', caretaker: 'yes',
          d_child6_live: 'yes', d_care_who: 'child'
        });
        // The two explained reasons lose their bullets...
        assert.doesNotMatch(letter, /<li[^>]*>Take care of a child under 6 years old<\/li>/);
        assert.doesNotMatch(letter, /<li[^>]*>Take care of a child or adult who cannot care for themselves<\/li>/);
        // ...and the unexplained one keeps its bullet, since nothing repeats it.
        assert.match(letter, /<li[^>]*>Live with a child under 14 years old<\/li>/);
        assert.equal(times(letter, 'I take care of a child under 6 years old'), 1);
      });

      it('drops the fixed paragraph for a reason a composed one covers', () => {
        const housing = letterFor({
          housing: 'no', housingFollowup: NONE, d_housing_where: 'shelter'
        });
        assert.equal(times(housing, 'I do not have a regular place to sleep'), 1);
        assert.doesNotMatch(housing, /Please review the information I provide/);

        const work = letterFor({ working: 'income_weekly', d_work_hours: 'h20_29' });
        assert.equal(times(work, 'I earn enough income to be exempt from the ABAWD work rules'), 1);
        assert.doesNotMatch(work, /I can send proof of my income and hours/);

        const disability = letterFor({ disability: ['other'], d_disability_other: 'masshealth' });
        assert.equal(times(disability, 'Please review it as part of my exemption screening'), 1);
        assert.doesNotMatch(disability, /a disability benefit or payment that is not listed above/);
      });

      it('does not repeat its own opening line in a good-cause letter', () => {
        const letter = letterFor({
          goodcause: 'transport', d_gc_what: 'car_broke', d_gc_when: ['last_month'], d_gc_now: 'still'
        });
        assert.equal(times(letter, 'I could not meet the ABAWD work rules'), 1);
      });

      /* The whole point of the coverage rule is that it only fires for reasons a
       * paragraph actually speaks for. Everything else must be untouched. */
      it('leaves reasons with no composed paragraph exactly as they were', () => {
        const letter = letterFor({ pregnant: 'yes', tafdc: 'yes', tribe: 'yes' });
        assert.match(letter, /<li[^>]*>Pregnant<\/li>/);
        assert.match(letter, /<li[^>]*>Get or applying for TAFDC cash assistance<\/li>/);
        assert.match(letter, /<li[^>]*>Alaska Native or member of a Tribe<\/li>/);
      });

      /* None of this may reach the write-in letter, where the fixed paragraphs
       * and the full bullet list are the only thing stating the reasons. */
      it('changes nothing in the write-in letter', () => {
        const answers = {
          child14: 'yes', child6: 'yes', housing: 'no', housingFollowup: NONE,
          working: 'income_weekly', disability: ['other']
        };
        const writein = SnapScreening.buildStatementHTML({
          rt: 'exempt',
          rs: classic2.exemptReasons(answers),
          explain: classic2.statementPrompts(answers).map(p => ({ prompt: p, text: '' })),
          today: 'August 1, 2026'
        });
        assert.match(writein, /<li[^>]*>Live with a child under 14 years old<\/li>/);
        assert.match(writein, /<li[^>]*>Take care of a child under 6 years old<\/li>/);
        assert.match(writein, /I earn enough income to be exempt from the ABAWD work rules\. I can send proof/);
        assert.match(writein, /I receive a disability benefit or payment that is not listed above/);
        assert.match(writein, /I do not have a regular place to sleep\. Please review the information I provide/);
      });
    });

    it('the composed letter reads as prose, and the write-in one still has boxes', () => {
      const explain = classic2.composeStatement(
        { health: 'yes', d_health_kind: 'mental', d_health_care: 'regularly' }, AUG);
      const composed = SnapScreening.buildStatementHTML({
        name: 'Jane Doe', rt: 'exempt', rs: ['Have a health reason'], explain, composed: true, today: 'August 1, 2026'
      });
      assert.match(composed, /<p style="margin:0 0 14px">I have a mental health condition/);
      assert.doesNotMatch(composed, /border:1px solid #999/, 'a composed sentence must not print inside a ruled box');
      // The caption belongs to a blank someone fills in, not to a finished sentence.
      assert.doesNotMatch(composed, /Your health reason/);
      // A signature rule is still drawn when the pad was left empty.
      assert.match(composed, /border-bottom:1px solid #111/);

      const writein = SnapScreening.buildStatementHTML({
        rt: 'exempt', explain: [{ prompt: 'Explain the health reason', text: '' }], today: 'August 1, 2026'
      });
      assert.match(writein, /border:1px solid #999/, 'an empty box must still print as a ruled area to write in');
      assert.match(writein, /Explain the health reason/);
    });

    it('the emailed summary reads as a statement rather than a half-filled form', () => {
      const explain = classic2.composeStatement(
        { goodcause: 'transport', d_gc_what: 'car_broke', d_gc_now: 'still' }, AUG);
      const composed = buildResultsEmailContent({ rt: 'goodcause', explain, composed: true }).body;
      assert.match(composed, /What your letter says:/);
      assert.match(composed, /My car broke down/);
      assert.doesNotMatch(composed, /In a few sentences:/);
      // The section label is a heading for the questions, not part of the letter.
      assert.doesNotMatch(composed, /Why you missed hours/);

      const writein = buildResultsEmailContent({
        rt: 'exempt', explain: [{ prompt: 'Explain the health reason', text: 'I have asthma.' }]
      }).body;
      assert.match(writein, /In a few sentences:/);
      assert.match(writein, /Explain the health reason/);
    });

    it('carries guided copy for every string the guided screens render', () => {
      for (const k of ['detailsStepHeading', 'detailsStepLead', 'detailsStepPrivacy',
        'composedStatementHeading', 'composedFormLeadExempt', 'composedFormLeadGoodCause',
        'composedChangeLabel', 'composedWhyInfoExempt', 'composedWhyInfoGoodCause']) {
        assert.ok(RESULT_COPY[k] && RESULT_COPY[k].trim(), k + ' is missing or empty');
      }
      // The write-in lead says "fill in the blanks below", which is wrong when
      // there are none. The two must not converge back onto one string.
      assert.notEqual(RESULT_COPY.composedFormLeadExempt, RESULT_COPY.formLeadExempt);
      assert.doesNotMatch(RESULT_COPY.composedFormLeadExempt, /fill in the blanks/);
    });

    it('composes the same sentence for the same answers, run to run', () => {
      const a = { health: 'yes', d_health_kind: 'both', d_health_length: 'short', d_health_care: 'sometimes' };
      assert.equal(compose(a), compose(a));
      // Every variant shares one guided table, as they share the decision.
      assert.equal(classic.composeStatement(a, AUG).map(e => e.text).join(' '), compose(a));
      assert.equal(v2.composeStatement(a, AUG).map(e => e.text).join(' '), compose(a));
    });
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
