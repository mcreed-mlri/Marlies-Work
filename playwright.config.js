'use strict';

const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: 'snap-screening.spec.js',
  use: {
    baseURL: 'http://127.0.0.1:4173',
  },
  webServer: {
    command: 'npx --yes serve . -l 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
