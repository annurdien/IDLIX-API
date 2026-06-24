'use strict';

const { mapApiItem, mapApiDetail } = require('../../src/lib/scraper');

describe('scraper.js', () => {

  describe('mapApiItem', () => {
    it('returns null if item is falsy', () => {
      expect(mapApiItem(null)).toBeNull();
    });

    it('maps a movie item correctly', () => {
      const apiItem = {
        title: 'Inception',
        slug: 'inception',
        contentType: 'movie',
        releaseDate: '2010-07-16',
        voteAverage: 8.8,
        posterPath: '/poster.jpg',
        quality: 'HD'
      };

      const mapped = mapApiItem(apiItem);
      expect(mapped).toMatchObject({
        title: 'Inception',
        originalTitle: 'Inception',
        year: 2010,
        type: 'movie',
        quality: 'HD',
        rating: 8.8,
        season: null,
        poster: 'https://image.tmdb.org/t/p/w300/poster.jpg',
        slug: 'inception',
        link: {
          endpoint: 'movie/inception',
          url: 'https://z2.idlixku.com/movie/inception',
          thumbnail: 'https://image.tmdb.org/t/p/w300/poster.jpg'
        }
      });
    });

    it('maps a series item correctly', () => {
      const apiItem = {
        title: 'Breaking Bad',
        slug: 'breaking-bad',
        contentType: 'series',
        releaseDate: '2008-01-20'
      };

      const mapped = mapApiItem(apiItem);
      expect(mapped).toMatchObject({
        title: 'Breaking Bad',
        year: 2008,
        type: 'series',
        link: expect.objectContaining({ endpoint: 'series/breaking-bad' })
      });
    });
  });

  describe('mapApiDetail', () => {
    it('returns empty object if item is falsy', () => {
      expect(mapApiDetail(null)).toEqual({});
    });

    it('maps a movie detail correctly', () => {
      const apiDetail = {
        title: 'Interstellar',
        slug: 'interstellar',
        releaseDate: '2014-11-05',
        runtime: 169,
        overview: 'A team of explorers travel through a wormhole...',
        posterPath: '/interstellar.jpg',
        backdropPath: '/interstellar_bg.jpg',
        genres: [{ name: 'Adventure' }, { name: 'Drama' }, { name: 'Science Fiction' }],
        country: 'United States',
        originalLanguage: 'en',
        director: 'Christopher Nolan',
        cast: [
          { name: 'Matthew McConaughey', character: 'Cooper', profilePath: '/matt.jpg' }
        ],
        trailerUrl: 'https://youtube.com/watch?v=zSWdZVtXT7E',
        keywords: [{ name: 'space travel' }]
      };

      const mapped = mapApiDetail(apiDetail);
      expect(mapped).toMatchObject({
        title: 'Interstellar',
        year: 2014,
        type: 'movie',
        runtime: 'PT169M',
        runtimeMinutes: 169,
        overview: 'A team of explorers travel through a wormhole...',
        poster: 'https://image.tmdb.org/t/p/w300/interstellar.jpg',
        backdrop: 'https://image.tmdb.org/t/p/w1280/interstellar_bg.jpg',
        genres: ['Adventure', 'Drama', 'Science Fiction'],
        country: 'United States',
        language: 'en',
        director: { name: 'Christopher Nolan', url: null },
        trailer: 'https://youtube.com/watch?v=zSWdZVtXT7E',
        keywords: ['space travel'],
        seasons: null
      });
      expect(mapped.cast).toHaveLength(1);
      expect(mapped.cast[0]).toEqual({
        name: 'Matthew McConaughey',
        character: 'Cooper',
        image: 'https://image.tmdb.org/t/p/w185/matt.jpg'
      });
    });

    it('maps a series detail correctly with seasons', () => {
      const apiDetail = {
        title: 'Game of Thrones',
        slug: 'game-of-thrones',
        numberOfSeasons: 8,
        firstAirDate: '2011-04-17',
        seasons: [
          {
            name: 'Season 1',
            seasonNumber: 1,
            episodeCount: 10,
            episodes: [
              { episodeNumber: 1, title: 'Winter Is Coming', overview: 'Ned Stark...' }
            ]
          }
        ]
      };

      const mapped = mapApiDetail(apiDetail);
      expect(mapped).toMatchObject({
        title: 'Game of Thrones',
        year: 2011,
        type: 'series',
        seasons: [
          {
            name: 'Season 1',
            seasonNumber: 1,
            episodeCount: 10,
            episodes: [
              { episodeNumber: 1, title: 'Winter Is Coming', overview: 'Ned Stark...' }
            ]
          }
        ]
      });
    });
  });
});
