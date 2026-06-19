'use strict';

const { validatePage, validateGenre } = require('../../src/middleware/validate');

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeReq  = (params = {}) => ({ params: { ...params } });
const makeRes  = () => {
  const res  = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};
const makeNext = () => jest.fn();

// ── validatePage ─────────────────────────────────────────────────────────────

describe('validatePage middleware', () => {
  it('calls next() and coerces page to a number for "1"', () => {
    const req  = makeReq({ page: '1' });
    const res  = makeRes();
    const next = makeNext();
    validatePage(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.params.page).toBe(1);
  });

  it('calls next() for page "99"', () => {
    const req  = makeReq({ page: '99' });
    const res  = makeRes();
    const next = makeNext();
    validatePage(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.params.page).toBe(99);
  });

  it('calls next() when page param is absent', () => {
    const req  = makeReq({});
    const res  = makeRes();
    const next = makeNext();
    validatePage(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for a non-numeric page "abc"', () => {
    const req  = makeReq({ page: 'abc' });
    const res  = makeRes();
    const next = makeNext();
    validatePage(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 for page "0"', () => {
    const req  = makeReq({ page: '0' });
    const res  = makeRes();
    const next = makeNext();
    validatePage(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for a negative page "-3"', () => {
    const req  = makeReq({ page: '-3' });
    const res  = makeRes();
    const next = makeNext();
    validatePage(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for a float "1.5" (not an integer)', () => {
    const req  = makeReq({ page: '1.5' });
    const res  = makeRes();
    const next = makeNext();
    validatePage(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for a leading-zero string "01"', () => {
    const req  = makeReq({ page: '01' });
    const res  = makeRes();
    const next = makeNext();
    validatePage(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ── validateGenre ─────────────────────────────────────────────────────────────

describe('validateGenre middleware', () => {
  it('calls next() for a simple lowercase genre "action"', () => {
    const req  = makeReq({ genre: 'action' });
    const res  = makeRes();
    const next = makeNext();
    validateGenre(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next() for a hyphenated genre "sci-fi"', () => {
    const req  = makeReq({ genre: 'sci-fi' });
    const res  = makeRes();
    const next = makeNext();
    validateGenre(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next() for an alphanumeric genre "action2"', () => {
    const req  = makeReq({ genre: 'action2' });
    const res  = makeRes();
    const next = makeNext();
    validateGenre(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next() for uppercase genre "COMEDY"', () => {
    const req  = makeReq({ genre: 'COMEDY' });
    const res  = makeRes();
    const next = makeNext();
    validateGenre(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for an empty genre ""', () => {
    const req  = makeReq({ genre: '' });
    const res  = makeRes();
    const next = makeNext();
    validateGenre(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 for a genre with path traversal "../"', () => {
    const req  = makeReq({ genre: '../etc' });
    const res  = makeRes();
    const next = makeNext();
    validateGenre(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for a genre with XSS payload "<script>"', () => {
    const req  = makeReq({ genre: '<script>alert(1)</script>' });
    const res  = makeRes();
    const next = makeNext();
    validateGenre(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for a genre with spaces', () => {
    const req  = makeReq({ genre: 'action drama' });
    const res  = makeRes();
    const next = makeNext();
    validateGenre(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
