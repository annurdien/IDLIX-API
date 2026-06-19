'use strict';

/**
 * Validates and coerces a numeric `:page` route parameter.
 * Responds with 400 if the param is missing or not a positive integer.
 * On success, `req.params.page` is replaced with the parsed number.
 *
 * @type {import('express').RequestHandler}
 */
function validatePage(req, res, next) {
  const { page } = req.params;
  if (page !== undefined) {
    const parsed = parseInt(page, 10);
    // Reject floats, negatives, zero, and non-numeric strings
    if (isNaN(parsed) || parsed < 1 || String(parsed) !== String(page)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid page number. Must be a positive integer.' });
    }
    req.params.page = parsed;
  }
  next();
}

/**
 * Validates a `:genre` route parameter.
 * Only allows lowercase letters, digits, and hyphens to prevent injection.
 * Responds with 400 for any other characters (path traversal, XSS, etc.).
 *
 * @type {import('express').RequestHandler}
 */
function validateGenre(req, res, next) {
  const { genre } = req.params;
  if (!genre || !/^[a-z0-9-]+$/i.test(genre)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid genre. Only letters, numbers and hyphens are allowed.' });
  }
  next();
}

module.exports = { validatePage, validateGenre };
