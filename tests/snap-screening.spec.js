'use strict';

const { test, expect } = require('@playwright/test');
const path = require('path');

const classicUrl = '/court-forms/snap-abawd.html';
const classicV2Url = '/court-forms/snap-abawd-classic-v2.html';
const v2Url = '/court-forms/snap-screening-v2.html';

async function agreeAndStart(page, ageYes = true) {
  await page.locator('#agree').check();
  await page.locator(`input[name="ageRange"][value="${ageYes ? 'yes' : 'no'}"]`).check();
  await page.locator('#start-btn').click();
}

async function clickYn(page, questionText, answer) {
  const block = page.locator('main').filter({ hasText: questionText });
  await block.getByRole('radio', { name: answer, exact: true }).click();
}

async function clickNext(page) {
  await page.getByRole('button', { name: /Next|See my/ }).click();
}

test.describe('SNAP ABAWD screening — classic', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(classicUrl);
  });

  test('exempt path — child under 14', async ({ page }) => {
    await agreeAndStart(page);
    await clickYn(page, 'child under 14', 'Yes');
    for (let i = 0; i < 4; i++) await clickNext(page);
    await expect(page.getByRole('heading', { name: /exempt from the ABAWD work rules/i })).toBeVisible();
  });

  test('30+ hours below minimum wage routes to exempt', async ({ page }) => {
    await agreeAndStart(page);
    for (let i = 0; i < 3; i++) await clickNext(page);
    await page.getByRole('radio', { name: /30 hours or more/i }).click();
    await clickNext(page);
    await expect(page.getByRole('heading', { name: /exempt from the ABAWD work rules/i })).toBeVisible();
    await expect(page.getByText(/30 or more hours/i)).toBeVisible();
  });

  test('age outside range shows ageinfo', async ({ page }) => {
    await agreeAndStart(page, false);
    await expect(page.getByRole('heading', { name: /may not apply to your age group/i })).toBeVisible();
  });

  test('delete answers clears storage', async ({ page }) => {
    await agreeAndStart(page);
    await clickYn(page, 'child under 14', 'Yes');
    for (let i = 0; i < 4; i++) await clickNext(page);
    await page.getByRole('button', { name: /Delete my answers/i }).click();
    await expect(page.getByRole('heading', { name: /ABAWD Work Rules/i })).toBeVisible();
    const stored = await page.evaluate(() => localStorage.getItem('cfo-abawd-screening-v1'));
    expect(stored).toBeNull();
  });
});

test.describe('SNAP ABAWD screening — classic v2 (author copy)', () => {
  // Target options by their stable question/option ids rather than by visible
  // label, so several Yes/No questions on one page stay unambiguous.
  const yn = (page, qId, val) => page.locator(`[data-q-id="${qId}"][data-opt-val="${val}"]`);
  const choice = (page, qId, idx) => page.locator(`[data-q-id="${qId}"][data-opt-idx="${idx}"]`);
  const noneOf = (page, qId) => page.locator(`[data-q-id="${qId}"][data-opt-kind$="-none"]`);
  const skipToResults = (page) => page.getByRole('button', { name: /Skip to results/i }).click();

  test.beforeEach(async ({ page }) => {
    await page.goto(classicV2Url);
  });

  test('intro uses the draft copy and links', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Did DTA tell you that you need to meet ABAWD Work Rules/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'SNAP and Work notice' })).toBeVisible();
    await expect(page.getByText('More on the SNAP ABAWD work rules')).toBeVisible();
    await expect(page.getByRole('button', { name: /Fill out the form/i })).toBeVisible();
  });

  test('exempt result states the exemption and shows one blank per reason', async ({ page }) => {
    await agreeAndStart(page);
    await yn(page, 'caretaker', 'yes').click();   // group 1
    await clickNext(page);
    await yn(page, 'health', 'yes').click();      // group 2
    await skipToResults(page);
    await expect(page.getByRole('heading', { name: /You are exempt and do not need to meet the ABAWD work rules/i })).toBeVisible();
    await expect(page.getByLabel(/Explain the health reason/i)).toBeVisible();
    await expect(page.getByLabel(/Explain your caretaking responsibilities/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /exemption form/i })).toBeVisible();
  });

  test('not-exempt result carries the good-cause guidance', async ({ page }) => {
    await agreeAndStart(page);
    await skipToResults(page);
    await noneOf(page, 'goodcause').click();
    await clickNext(page);
    await expect(page.getByRole('heading', { name: /may need to meet the ABAWD work rules/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'You can meet the rules by:' })).toBeVisible();
    await expect(page.getByText(/You may have a good reason for missing work, school, or volunteer hours/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'DTA training program' })).toBeVisible();
  });

  test('good-cause result lists every category, not only the one picked', async ({ page }) => {
    await agreeAndStart(page);
    await skipToResults(page);
    await choice(page, 'goodcause', 1).click();   // family or personal emergency
    await clickNext(page);
    await expect(page.getByRole('heading', { name: /good reason for missing work, school, or volunteer hours/i })).toBeVisible();
    for (const title of ['No transportation', 'Emergency', 'Employment issues']) {
      await expect(page.getByText(title, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: 'More examples' })).toHaveCount(2);
  });

  test('state agencies are listed in the question and school uses the long Yes label', async ({ page }) => {
    await agreeAndStart(page);
    for (let i = 0; i < 2; i++) await clickNext(page);   // group 3: benefits
    await expect(page.getByText('MA Commission for Deaf and Hard of Hearing')).toBeVisible();
    await clickNext(page);                               // group 4: school and work
    await expect(yn(page, 'school', 'yes')).toHaveText(/Yes, I am enrolled half-time or more in a school or program/);
  });

  test('answers are stored under their own key, not the classic tool’s', async ({ page }) => {
    await agreeAndStart(page);
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys).toContain('cfo-abawd-classic-v2-screening-v1');
    expect(keys).not.toContain('cfo-abawd-screening-v1');
  });
});

test.describe('SNAP ABAWD screening — v2', () => {
  test('sample exempt mode shows banner and does not persist', async ({ page }) => {
    await page.goto(`${v2Url}?sample=exempt`);
    await expect(page.getByText('Sample result')).toBeVisible();
    await expect(page.getByRole('heading', { name: /do not have to meet the work rules/i })).toBeVisible();
    const stored = await page.evaluate(() => localStorage.getItem('cfo-abawd-screening-v2'));
    expect(stored).toBeNull();
  });

  test('good cause sample uses shared logic ids', async ({ page }) => {
    await page.goto(`${v2Url}?sample=goodcause`);
    await expect(page.getByRole('heading', { name: /good reason for missing hours/i })).toBeVisible();
    await expect(page.getByText(/transportation/i)).toBeVisible();
  });

  test('skip questions routes to good-cause when no exemptions', async ({ page }) => {
    await page.goto(v2Url);
    await agreeAndStart(page);
    await page.getByRole('button', { name: /Skip to results/i }).click();
    await expect(page.getByRole('heading', { name: /hard to work, go to school, or volunteer/i })).toBeVisible();
  });
});
