import PouchDB from 'pouchdb-browser';
PouchDB.plugin(require('pouchdb-adapter-memory'));

const db = {
  series: new PouchDB('series', {adapter: 'memory'}),
  genres: new PouchDB('genres', {adapter: 'memory'}),
  episodes: new PouchDB('episodes', {adapter: 'memory'}),
  current: new PouchDB('current', {adapter: 'memory'}),
  auth: new PouchDB('auth'),
  favorites: new PouchDB('favorites'),
  bookmarkSeries: new PouchDB('bookmarkSeries'),
  settings: new PouchDB('settings'),
};

export default db;
