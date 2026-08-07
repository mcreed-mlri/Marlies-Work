'use strict';

const { test, expect } = require('@playwright/test');
const path = require('path');

/* Result copy is read from the logic module rather than typed out here.
 *
 * This file previously hardcoded the exempt heading in five places. The author
 * revised that heading in July 2026, dropping "Good news:" and softening "You are
 * exempt" to "You may be exempt", and all five assertions went stale without
 * anyone noticing: this suite cannot run on the authoring machine, and CI did not
 * run it either. Author copy changes regularly, so a test that duplicates it will
 * keep rotting. Derive it instead. */
const { RESULT_COPY } = require('../masslegalhelp/snap-screening-logic.js');

/** Literal text as a case-insensitive regex, for Playwright's name matchers. */
const asRegex = (text) => new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

const EXEMPT_HEADING = asRegex(RESULT_COPY.exemptHeading);
const GOOD_CAUSE_HEADING = asRegex(RESULT_COPY.goodCauseHeading);
const NOT_EXEMPT_HEADING = asRegex(RESULT_COPY.notExemptHeading);
const WORK_RULES_HEADING = asRegex(RESULT_COPY.workRulesHeading);

// One build now. court-forms/ was archived on 2026-07-30, so these drive the page
// that actually ships rather than a lookalike of it.
const screenerUrl = '/masslegalhelp/tools/snap-abawd/';

/* agreeAndStart and clickYn were removed with the archived builds on 2026-07-30.
 * agreeAndStart clicked `#agree`, the Terms of Use checkbox, which only ever
 * existed in those two designs: the shipping build has no terms gate at all, which
 * is a separate open question recorded in PRODUCT.md. clickYn matched questions by
 * visible label, which is ambiguous once several Yes/No questions share a page;
 * the id-based helpers below replaced it. */
async function startScreener(page) {
  await page.locator('#start-btn').click();
}

async function clickNext(page) {
  await page.getByRole('button', { name: /Next|See my|few more details/i }).click();
}

test.describe('SNAP ABAWD screening (the shipping build)', () => {
  // Target options by their stable question/option ids rather than by visible
  // label, so several Yes/No questions on one page stay unambiguous.
  const yn = (page, qId, val) => page.locator(`[data-q-id="${qId}"][data-opt-val="${val}"]`);
  const choice = (page, qId, idx) => page.locator(`[data-q-id="${qId}"][data-opt-idx="${idx}"]`);
  const noneOf = (page, qId) => page.locator(`[data-q-id="${qId}"][data-opt-kind$="-none"]`);
  const skipToResults = (page) => page.getByRole('button', { name: /Skip to results/i }).click();

  test.beforeEach(async ({ page }) => {
    await page.goto(screenerUrl);
  });

  test('intro uses the draft copy and links', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Did DTA tell you that you need to meet ABAWD Work Rules/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'SNAP and Work notice' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'DTAConnect' })).toBeVisible();
    // Its accessible name, not its visible text: the button reads "ABAWD" on screen.
    await expect(page.getByRole('button', { name: 'What does ABAWD mean?' })).toBeVisible();
    await expect(page.getByText(/Your information is private/i)).toBeVisible();
    await expect(page.getByText(/different from MassHealth work rules/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Click here to check if the ABAWD work rules apply to you/i })).toBeVisible();
  });

  /* Answering No to the age question ends the screening on section 1. This is the only
     path that skips groups, so it is the one most likely to break when navigation is
     touched, and the only result that offers no letter. */
  test('No to the age question goes straight to the age result', async ({ page }) => {
    await startScreener(page);
    await yn(page, 'ageRange', 'no').click();
    await clickNext(page);
    await expect(page.getByRole('heading', {
      name: /You are exempt and do not need to meet the ABAWD work rules because of your age/i
    })).toBeVisible();
    await expect(page.getByText(/DTA should already have your age and date of birth/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'info@masslegalservices.org' })).toBeVisible();
    // No letter: DTA already holds the date of birth, so there is nothing to sign.
    await expect(page.getByLabel(/Your name/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Print or save/i })).toHaveCount(0);
  });

  test('the age result outranks an exemption answered in the same section', async ({ page }) => {
    await startScreener(page);
    await yn(page, 'pregnant', 'yes').click();
    await yn(page, 'ageRange', 'no').click();
    await clickNext(page);
    await expect(page.getByRole('heading', { name: /because of your age/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: EXEMPT_HEADING })).toHaveCount(0);
  });

  test('Yes to the age question carries on through the sections', async ({ page }) => {
    await startScreener(page);
    await yn(page, 'ageRange', 'yes').click();
    await clickNext(page);
    await expect(page.getByText(/Section 2 of 4/i)).toBeVisible();
  });

  /* The state agency question became a checkbox list on 2026-08-06. It is the only question
     whose type changed, so it is the one most likely to render as the wrong widget. */
  test('state agencies is a checkbox list, and the ticked ones reach the results', async ({ page }) => {
    await startScreener(page);
    await clickNext(page);
    await clickNext(page);                             // into group 3
    await expect(page.getByText('MassAbility (formerly Mass Rehab Commission)')).toBeVisible();
    // The list is the answer now: no Yes/No pair underneath it.
    await expect(noneOf(page, 'stateagency')).toHaveText(/No/);
    await choice(page, 'stateagency', 1).click();       // Dept. of Mental Health
    await choice(page, 'stateagency', 3).click();       // MA Commission for the Blind
    await skipToResults(page);
    await expect(page.getByRole('heading', { name: EXEMPT_HEADING })).toBeVisible();
    /* Flat since 2026-08-06: one reason per agency, not a nest under a collapsed one. */
    await expect(page.getByText('I get services from the Dept. of Mental Health')).toBeVisible();
    await expect(page.getByText('I get services from the MA Commission for the Blind')).toBeVisible();
  });

  /* The housing follow-up answers are echoed back on the results page as sub-bullets under
     the housing reason, and in the letter. Author's request, 2026-08-06. */
  test('housing follow-up picks show as sub-bullets under the housing reason', async ({ page }) => {
    await startScreener(page);
    await clickNext(page);                          // past group 1
    await yn(page, 'housing', 'no').click();        // opens the follow-up
    await choice(page, 'housingFollowup', 0).click();  // diploma
    await choice(page, 'housingFollowup', 1).click();  // ongoing care
    await skipToResults(page);
    await expect(page.getByRole('heading', { name: EXEMPT_HEADING })).toBeVisible();

    // Nested inside the housing reason's list item, not a sibling exemption.
    const housingItem = page.locator('li', { hasText: /I do not have a regular place to sleep/ }).first();
    await expect(housingItem.locator('li', { hasText: /high school diploma/ })).toBeVisible();
    await expect(housingItem.locator('li', { hasText: /health care provider/ })).toBeVisible();
  });

  test('exempt result states the exemption and shows one blank per reason', async ({ page }) => {
    await startScreener(page);
    await yn(page, 'caretaker', 'yes').click();   // group 1
    await clickNext(page);
    await yn(page, 'health', 'yes').click();      // group 2
    await skipToResults(page);
    await expect(page.getByRole('heading', { name: EXEMPT_HEADING })).toBeVisible();
    await expect(page.getByLabel(/Explain the health reason/i)).toBeVisible();
    await expect(page.getByLabel(/Explain your caretaking responsibilities/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /exemption form/i })).toBeVisible();
  });

  test('not-exempt result carries the good-cause guidance', async ({ page }) => {
    await startScreener(page);
    await skipToResults(page);
    await noneOf(page, 'goodcause').click();
    await clickNext(page);
    await expect(page.getByRole('heading', { name: NOT_EXEMPT_HEADING })).toBeVisible();
    await expect(page.getByRole('heading', { name: WORK_RULES_HEADING })).toBeVisible();
    await expect(page.getByText(/You may have a good reason for missing work, school, or volunteer hours/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'DTA training program' })).toBeVisible();
  });

  test('good-cause result lists every category, not only the one picked', async ({ page }) => {
    await startScreener(page);
    await skipToResults(page);
    await choice(page, 'goodcause', 1).click();   // family or personal emergency
    await clickNext(page);
    await expect(page.getByRole('heading', { name: GOOD_CAUSE_HEADING })).toBeVisible();
    for (const title of ['No transportation', 'Emergency', 'Employment issues']) {
      await expect(page.getByText(title, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'More examples' })).toHaveCount(2);
  });

  test('state agencies are listed on the question', async ({ page }) => {
    await startScreener(page);
    for (let i = 0; i < 2; i++) await clickNext(page);   // group 3: benefits
    const stateAgencyBlock = page.locator('main').filter({ hasText: /get services from any of these state agencies/i });
    await expect(stateAgencyBlock.getByText('MA Commission for Deaf and Hard of Hearing')).toBeVisible();
    await expect(stateAgencyBlock.getByRole('button', { name: /What does this mean/i })).toHaveCount(0);
    await clickNext(page);                               // group 4: school and work
    await expect(yn(page, 'school', 'yes')).toHaveText(/^Yes$/);
  });

  test('answers are stored under their own key, not the classic tool’s', async ({ page }) => {
    await startScreener(page);
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys).toContain('cfo-abawd-classic-v2-screening-v1');
    expect(keys).not.toContain('cfo-abawd-screening-v1');
  });

  test('sample exempt shows updated language result copy', async ({ page }) => {
    await page.goto(`${screenerUrl}?sample=exempt`);
    await expect(page.getByText('Sample result')).toBeVisible();
    await expect(page.getByRole('heading', { name: EXEMPT_HEADING })).toBeVisible();
    await expect(page.getByLabel(/Explain the health reason/i)).toBeVisible();
    await expect(page.getByLabel(/Explain your caretaking responsibilities/i)).toBeVisible();
    const stored = await page.evaluate(() => localStorage.getItem('cfo-abawd-classic-v2-screening-v1'));
    expect(stored).toBeNull();
  });

  test('sample good cause lists every category', async ({ page }) => {
    await page.goto(`${screenerUrl}?sample=goodcause`);
    await expect(page.getByText('Sample result')).toBeVisible();
    await expect(page.getByRole('heading', { name: GOOD_CAUSE_HEADING })).toBeVisible();
    for (const title of ['No transportation', 'Emergency', 'Employment issues']) {
      await expect(page.getByText(title, { exact: true })).toBeVisible();
    }
  });

  test('reclicking a selected answer clears it', async ({ page }) => {
    await startScreener(page);
    const yesBtn = yn(page, 'child14', 'yes');
    await yesBtn.click();
    await expect(yesBtn).toHaveClass(/opt-selected/);
    await yesBtn.click();
    await expect(yesBtn).not.toHaveClass(/opt-selected/);

    await yn(page, 'housing', 'no').click();
    await choice(page, 'housingFollowup', 0).click();
    await noneOf(page, 'housingFollowup').click();
    await expect(noneOf(page, 'housingFollowup')).toHaveClass(/opt-selected/);
    await noneOf(page, 'housingFollowup').click();
    await expect(noneOf(page, 'housingFollowup')).not.toHaveClass(/opt-selected/);

    for (let i = 0; i < 2; i++) await clickNext(page);
    const workOpt = choice(page, 'working', 0);
    await workOpt.click();
    await expect(workOpt).toHaveClass(/opt-selected/);
    await workOpt.click();
    await expect(workOpt).not.toHaveClass(/opt-selected/);
  });
});

/* ---- The guided version (archived at archive/snap-guided/) ---------------
 *
 * Same screening, different ending: instead of blank boxes on the results
 * screen, a step of pick-lists before it, and a statement composed from the
 * answers. Kept for records; not linked from the shipping screener.
 *
 * The Playwright server runs on 127.0.0.1. */
test.describe('SNAP ABAWD screening (the guided ending)', () => {
  const guidedUrl = '/archive/snap-guided/';
  const yn = (page, qId, val) => page.locator(`[data-q-id="${qId}"][data-opt-val="${val}"]`);
  const choice = (page, qId, idx) => page.locator(`[data-q-id="${qId}"][data-opt-idx="${idx}"]`);
  const noneOf = (page, qId) => page.locator(`[data-q-id="${qId}"][data-opt-kind$="-none"]`);
  const skipToResults = (page) => page.getByRole('button', { name: /Skip to results/i }).click();

  test.beforeEach(async ({ page }) => {
    await page.goto(guidedUrl);
  });

  test('asks for details, then writes the statement instead of asking for it', async ({ page }) => {
    await startScreener(page);
    await clickNext(page);
    await yn(page, 'health', 'yes').click();        // group 2
    await skipToResults(page);

    // The details step, which does not exist in the write-in version.
    await expect(page.getByRole('heading', { name: asRegex(RESULT_COPY.detailsStepHeading) })).toBeVisible();
    await choice(page, 'd_health_kind', 0).click();  // a physical health reason
    await choice(page, 'd_health_length', 1).click(); // 6 months or more
    await choice(page, 'd_health_care', 0).click();   // yes, regularly
    await page.getByRole('button', { name: /See my letter/i }).click();

    await expect(page.getByRole('heading', { name: EXEMPT_HEADING })).toBeVisible();
    await expect(page.getByText(
      /I have a physical health condition that makes it hard for me to work 30 or more hours a week\./i
    )).toBeVisible();
    await expect(page.getByText(/I see a health care provider for it regularly/i)).toBeVisible();

    // The whole point: no blank box to fill in.
    await expect(page.getByLabel(/Explain the health reason/i)).toHaveCount(0);
    await expect(page.locator('textarea[id^="f-explain"]')).toHaveCount(0);

    // What still has to be typed or drawn, because it cannot be derived.
    await expect(page.getByLabel('Your name')).toBeVisible();
    await expect(page.locator('#sig-pad')).toBeVisible();
  });

  test('nobody signs a statement they cannot read, and they can change it', async ({ page }) => {
    await startScreener(page);
    await clickNext(page);
    await yn(page, 'health', 'yes').click();
    await skipToResults(page);
    await choice(page, 'd_health_kind', 1).click();  // a mental health reason
    await page.getByRole('button', { name: /See my letter/i }).click();

    await expect(page.getByText(/I have a mental health condition/i)).toBeVisible();
    await page.getByRole('button', { name: asRegex(RESULT_COPY.composedChangeLabel) }).click();

    // Back on the details step, with the earlier pick still selected.
    await expect(page.getByRole('heading', { name: asRegex(RESULT_COPY.detailsStepHeading) })).toBeVisible();
    await expect(choice(page, 'd_health_kind', 1)).toHaveClass(/opt-selected/);
    await choice(page, 'd_health_kind', 0).click();  // change it to physical
    await page.getByRole('button', { name: /See my letter/i }).click();
    await expect(page.getByText(/I have a physical health condition/i)).toBeVisible();
    await expect(page.getByText(/I have a mental health condition/i)).toHaveCount(0);
  });

  test('good cause is asked before the details, and branches on the category', async ({ page }) => {
    await startScreener(page);
    await skipToResults(page);
    await choice(page, 'goodcause', 0).click();     // transportation
    await clickNext(page);

    await expect(page.getByRole('heading', { name: asRegex(RESULT_COPY.detailsStepHeading) })).toBeVisible();
    // Transport options, not the emergency ones.
    await expect(page.getByText('My car broke down', { exact: true })).toBeVisible();
    await expect(page.getByText('There was a death in my family', { exact: true })).toHaveCount(0);
    await choice(page, 'd_gc_what', 0).click();     // my car broke down
    await choice(page, 'd_gc_now', 0).click();      // still going on
    await page.getByRole('button', { name: /See my letter/i }).click();

    await expect(page.getByRole('heading', { name: GOOD_CAUSE_HEADING })).toBeVisible();
    await expect(page.getByText(/My car broke down and I had no other way to get there\./i)).toBeVisible();
    await expect(page.getByText(/This is still going on\./i)).toBeVisible();
  });

  test('skips the details step when every exemption speaks for itself', async ({ page }) => {
    await startScreener(page);
    await yn(page, 'pregnant', 'yes').click();      // needs no explaining
    await skipToResults(page);

    // Straight to the results: nothing to ask, so nothing is asked.
    await expect(page.getByRole('heading', { name: EXEMPT_HEADING })).toBeVisible();
    await expect(page.getByRole('heading', { name: asRegex(RESULT_COPY.detailsStepHeading) })).toHaveCount(0);
    await expect(page.locator('textarea[id^="f-explain"]')).toHaveCount(0);
    // The write-in version shows an empty "Explain your reasons in your own
    // words" box to exactly these people. This one shows the name and signature
    // fields and nothing else to fill in.
    await expect(page.getByLabel('Your name')).toBeVisible();
  });

  test('the write-in version is unchanged by any of this', async ({ page }) => {
    await page.goto(screenerUrl);
    await startScreener(page);
    await clickNext(page);
    await yn(page, 'health', 'yes').click();
    await skipToResults(page);

    // No details step, and the blank box is still the way this version works.
    await expect(page.getByRole('heading', { name: EXEMPT_HEADING })).toBeVisible();
    await expect(page.getByLabel(/Explain the health reason/i)).toBeVisible();
    await expect(page.getByRole('button', { name: asRegex(RESULT_COPY.composedChangeLabel) })).toHaveCount(0);
  });
});
