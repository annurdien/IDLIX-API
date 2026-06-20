'use strict';

const { BASE_URL } = require('../config/env');

/**
 * Maps a native JSON API item from IDLIX into our standardized schema.
 * @param {Object} item - The raw JSON item from /api/movies or /api/homepage
 * @returns {Object} Standardized media item
 */
function mapApiItem(item) {
  if (!item) return null;
  const isSeries = item.contentType === 'series';
  const endpoint = `${isSeries ? 'series' : 'movie'}/${item.slug}`;

  let year = null;
  if (item.releaseDate) {
    year = parseInt(String(item.releaseDate).substring(0, 4), 10) || null;
  }

  const posterUrl = item.posterPath ? `https://image.tmdb.org/t/p/w300${item.posterPath}` : null;

  return {
    title: item.title || '',
    originalTitle: item.title || '',
    year,
    type: isSeries ? 'series' : 'movie',
    quality: item.quality || null,
    rating: item.voteAverage ? parseFloat(item.voteAverage) : null,
    season: null, // Only visible inside series detail usually
    poster: posterUrl,
    slug: item.slug,
    link: {
      endpoint,
      url: `${BASE_URL}/${endpoint}`,
      thumbnail: posterUrl
    }
  };
}

/**
 * Maps a native JSON API detail item from IDLIX into our standardized schema.
 * @param {Object} item - The raw JSON item from /api/movies/:slug or /api/series/:slug
 * @returns {Object} Standardized detail item
 */
function mapApiDetail(item) {
  if (!item) return {};
  const isSeries = !!item.numberOfSeasons;
  const endpoint = `${isSeries ? 'series' : 'movie'}/${item.slug}`;

  let year = null;
  const dateStr = item.releaseDate || item.firstAirDate;
  if (dateStr) {
    year = parseInt(String(dateStr).substring(0, 4), 10) || null;
  }

  const posterUrl = item.posterPath ? `https://image.tmdb.org/t/p/w300${item.posterPath}` : null;
  const backdropUrl = item.backdropPath ? `https://image.tmdb.org/t/p/w1280${item.backdropPath}` : null;

  let runtime = null;
  let runtimeMinutes = null;
  if (item.runtime) {
    runtimeMinutes = parseInt(item.runtime, 10);
    runtime = `PT${runtimeMinutes}M`;
  }

  return {
    title: item.title || '',
    year,
    type: isSeries ? 'series' : 'movie',
    runtime,
    runtimeMinutes,
    overview: item.overview || null,
    poster: posterUrl,
    backdrop: backdropUrl,
    genres: (item.genres || []).map(g => g.name).filter(Boolean),
    country: item.country || null,
    countryCode: null,
    language: item.originalLanguage || null,
    director: item.director ? { name: item.director, url: null } : null,
    cast: (item.cast || []).map(c => ({
      name: c.name,
      character: c.character,
      image: c.profilePath ? `https://image.tmdb.org/t/p/w185${c.profilePath}` : null
    })),
    trailer: item.trailerUrl || null,
    watchUrl: `${BASE_URL}/${endpoint}?play=1`,
    streamUrl: null, // Fetched separately
    keywords: (item.keywords || []).map(k => k.name).filter(Boolean),
    recommendations: [], // Can be populated if API provides it
    seasons: isSeries ? (item.seasons || []).map(s => ({
      name: s.name,
      seasonNumber: s.seasonNumber,
      episodeCount: s.episodeCount,
      episodes: (s.episodes || []).map(e => ({
        episodeNumber: e.episodeNumber,
        title: e.title,
        overview: e.overview
      }))
    })) : null
  };
}

module.exports = {
  mapApiItem,
  mapApiDetail,
};