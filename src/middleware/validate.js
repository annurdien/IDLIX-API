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

/**
 * Validates a generic slug route parameter (movie/series slugs).
 * Allows letters, numbers, and hyphens.
 *
 * @type {import('express').RequestHandler}
 */
function validateSlug(req, res, next) {
  const values = req.params || {};
  const slug = values.slug || values.country || values.network || values.genre;
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid value. Only letters, numbers and hyphens are allowed.' });
  }
  next();
}

/**
 * Validates a media slug parameter like "movie-title-2024".
 * Allows letters, numbers, and hyphens.
 *
 * @type {import('express').RequestHandler}
 */
function validateMediaSlug(req, res, next) {
  const { slug } = req.params;
  if (!slug || !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/i.test(slug)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid slug. Only letters, numbers and hyphens are allowed.' });
  }
  next();
}

/**
 * Validates a four-digit year route parameter.
 *
 * @type {import('express').RequestHandler}
 */
function validateYear(req, res, next) {
  const { year } = req.params;
  if (!year || !/^(19|20)\d{2}$/.test(String(year))) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid year. Must be a four-digit year.' });
  }
  next();
}

/**
 * Validates the `q` query parameter for search.
 * Requires at least 2 non-whitespace characters.
 *
 * @type {import('express').RequestHandler}
 */
function validateSearchQuery(req, res, next) {
  const q = String(req.query.q || '').trim();
  if (!q || q.length < 2) {
    return res
      .status(400)
      .json({ success: false, message: 'Query parameter "q" is required and must be at least 2 characters.' });
  }
  req.query.q = q;
  next();
}

/**
 * Validates :season and :episode route parameters.
 * Both must be positive integers. Coerces to Number on success.
 *
 * @type {import('express').RequestHandler}
 */
function validateEpisodeParams(req, res, next) {
  const { season, episode } = req.params;
  const s = parseInt(season, 10);
  const e = parseInt(episode, 10);

  if (isNaN(s) || s < 1 || String(s) !== String(season)) {
    return res.status(400).json({ success: false, message: 'Invalid season number. Must be a positive integer.' });
  }
  if (isNaN(e) || e < 1 || String(e) !== String(episode)) {
    return res.status(400).json({ success: false, message: 'Invalid episode number. Must be a positive integer.' });
  }

  req.params.season  = s;
  req.params.episode = e;
  next();
}

module.exports = { validatePage, validateGenre, validateSlug, validateMediaSlug, validateYear, validateSearchQuery, validateEpisodeParams };
