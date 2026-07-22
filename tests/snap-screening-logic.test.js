'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const SnapScreening = require('../court-forms/snap-screening-logic.js');

const { NONE, WORK_REASON_INCOME, WORK_REASON_HOURS_30, DISABILITY_OTHER_REASON, create, migrateAnswers, resultTypeFor, exemptReasonsFor, housingUnableExempt, buildQuestions } = SnapScreening;

describe('snap-screening-logic', () => {
  const classic = create('classic');
  const v2 = create('v2');

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
    assert.match(html, /How to send this statement/);
    assert.doesNotMatch(html, /SAMPLE - draft/);
  });
});
