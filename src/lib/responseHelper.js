'use strict';

/**
 * Standardised API response envelope helpers.
 *
 * All API responses follow the shape:
 *   { success: boolean, data: *, pagination?: Object, filters?: Object, meta?: Object }
 *
 * Using these helpers ensures consistency across all controllers.
 */

/**
 * Send a successful JSON response.
 *
 * @param {import('express').Response} res
 * @param {*} data           - The primary payload (array or object).
 * @param {Object} [options]
 * @param {Object} [options.pagination] - Pagination metadata.
 * @param {Object} [options.filters]    - Active filter values.
 * @param {Object} [options.meta]       - Any additional metadata.
 * @param {number} [options.status=200] - HTTP status code.
 */
function success(res, data, { pagination, filters, meta, status = 200 } = {}) {
  const body = { success: true, data };
  if (pagination != null) body.pagination = pagination;
  if (filters != null) body.filters = filters;
  if (meta != null) body.meta = meta;
  return res.status(status).json(body);
}

/**
 * Send a failure JSON response.
 *
 * @param {import('express').Response} res
 * @param {string} message  - Human-readable error description.
 * @param {number} [status=500] - HTTP status code.
 */
function error(res, message, status = 500) {
  return res.status(status).json({ success: false, message });
}

module.exports = { success, error };
