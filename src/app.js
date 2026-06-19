'use strict';

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const path         = require('path');
const routes       = require('./routes');
const errorHandler = require('./middleware/errorHandler');

/**
 * Create and configure an Express application.
 * Exported as a factory function so integration tests can spin up
 * fresh instances without side effects (no .listen() call here).
 *
 * @returns {import('express').Application}
 */
function createApp() {
  const app = express();

  // ── Security & parsing ──────────────────────────────────────────────────
  app.use(cors());
  app.use(helmet());
  app.use(express.json());

  // ── API routes ──────────────────────────────────────────────────────────
  app.use('/api', routes);

  // ── Static files ────────────────────────────────────────────────────────
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // ── 404 catch-all (must come after all routes) ──────────────────────────
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'API not found' });
  });

  // ── Global error handler (must be last) ─────────────────────────────────
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
