'use strict';

const axios = require('axios');
const tough = require('tough-cookie');
const { BASE_URL } = require('../config/env');

const cookieJar = new tough.CookieJar();

/**
 * Pre-configured axios instance.
 * Isolated here so tests can mock it without touching globals.
 */
const httpClient = axios.create({
  baseURL: BASE_URL,
  jar: cookieJar,
});

module.exports = httpClient;
