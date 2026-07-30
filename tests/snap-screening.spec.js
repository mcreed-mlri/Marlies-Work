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
const AGE_INFO_HEADING = asRegex(RESULT_COPY.ageInfoHeading);

// One build now. court-forms/ was archived on 2026-07-30, so these drive the page
// that actually ships rather than a lookalike of it.
const screenerUrl = '/masslegalhelp/';

/* agreeAndStart and clickYn were removed with the archived builds on 2026-07-30.
 * agreeAndStart clicked `#agree`, the Terms of Use checkbox, which only ever
 * existed in those two designs: the shipping build has no terms gate at all, which
 * is a separate open question recorded in PRODUCT.md. clickYn matched questions by
 * visible label, which is ambiguous once several Yes/No questions share a page;
 * the id-based helpers below replaced it. */
async function startScreener(page, ageYes = true) {
  await page.locator(`input[name="ageRange"][value="${ageYes ? 'yes' : 'no'}"]`).check();
  await page.locator('#start-btn').click();
}

async function clickNext(page) {
  await page.getByRole('button', { name: /Next|See my/ }).click();
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
    await expect(page.getByText('More on the SNAP ABAWD work rules')).toBeVisible();
    await expect(page.getByText(/Your information is private/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Fill out the form/i })).toBeVisible();
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

  test('state agencies appear in help and school uses the long Yes label', async ({ page }) => {
    await startScreener(page);
    for (let i = 0; i < 2; i++) await clickNext(page);   // group 3: benefits
    const stateAgencyBlock = page.locator('main').filter({ hasText: /receive services from any state agencies/i });
    await stateAgencyBlock.getByRole('button', { name: /What does this mean/i }).click();
    await expect(stateAgencyBlock.getByText('MA Commission for Deaf and Hard of Hearing')).toBeVisible();
    await clickNext(page);                               // group 4: school and work
    await expect(yn(page, 'school', 'yes')).toHaveText(/Yes, I am enrolled half-time or more in a school or program/);
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
