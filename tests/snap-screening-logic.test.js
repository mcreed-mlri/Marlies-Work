'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const SnapScreening = require('../court-forms/snap-screening-logic.js');

const { NONE, WORK_REASON_INCOME, WORK_REASON_HOURS_30, DISABILITY_OTHER_REASON, HOUSING_EXEMPT_REASON, LINKS, create, migrateAnswers, resultTypeFor, exemptReasonsFor, housingUnableExempt, buildQuestions, statementPromptsFor, goodCauseCategories } = SnapScreening;

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

  it('buildStatementHTML uses client letter format', () => {
    const html = SnapScreening.buildStatementHTML({
      name: 'Jane Doe',
      agency: '12345',
      explain: 'I need help updating my case.',
      rt: 'exempt',
      rs: ['Pregnant'],
      today: 'January 1, 2026'
    });
    assert.match(html, /Statement to DTA/);
    assert.match(html, /not an official DTA form/);
    assert.match(html, /Dear DTA,/);
    assert.match(html, /Jane Doe/);
    assert.match(html, /break-inside:avoid/);
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
    assert.match(byId.dv.note, /contact info here/);
    assert.equal(byId.stateagency.listItems.length, 5);
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
    assert.match(html, /No additional explanation provided/);
  });

  it('buildStatementHTML still accepts a plain string explain', () => {
    const html = SnapScreening.buildStatementHTML({ rt: 'exempt', rs: ['Pregnant'], explain: 'just one box' });
    assert.match(html, /just one box/);
    assert.doesNotMatch(html, /No additional explanation provided/);
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
