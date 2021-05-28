const db = require("quick.db");

// Create new databases for loaded pages

const page = new db.table("page");
const trending = new db.table("trending");
const featured = new db.table("featured");
const cinemaxxi = new db.table("cinemaxxi");
const serialtv = new db.table("serialtv");
const mcu = new db.table("mcu");

module.exports = {
  page,
  trending,
  featured,
  cinemaxxi,
  serialtv,
  mcu,
};
