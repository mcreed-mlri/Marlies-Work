'use strict';

const { test, expect } = require('@playwright/test');
const path = require('path');

const classicUrl = '/court-forms/snap-abawd.html';
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
    await page.getByRole('button', { name: /Skip questions/i }).click();
    await expect(page.getByRole('heading', { name: /hard to work, go to school, or volunteer/i })).toBeVisible();
  });
});
