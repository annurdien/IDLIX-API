'use strict';

/**
 * Global Express error handler.
 * Must be registered LAST — after all routes and 404 catch-all.
 * Sends a consistent JSON error envelope with the correct HTTP status code.
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const status  = err.status  || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ success: false, message });
};
