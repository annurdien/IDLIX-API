'use strict';

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    // Exclude legacy files kept for reference only — they are no longer imported
    '!src/controllers/tv_series.controller.js',
    '!src/routes/tv_series.routes.js',
    // Exclude native browser/HTTP infrastructure
    '!src/lib/httpClient.js',
    '!src/lib/streamClient.js',
    '!src/lib/cfBypass/**',
  ],
  coverageThreshold: {
    global: {
      branches:   65,
      functions:  80,
      lines:      80,
      statements: 80,
    },
  },
  testTimeout: 10_000,
};
