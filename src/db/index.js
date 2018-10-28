import PouchDB from 'pouchdb-browser';
PouchDB.plugin(require('pouchdb-adapter-memory'));

const db = {
  series: new PouchDB('series', {adapter: 'memory'}),
  episodes: new PouchDB('episodes', {adapter: 'memory'}),
  current: new PouchDB('current', {adapter: 'memory'}),
  auth: new PouchDB('auth'),
  bookmarkSeries: new PouchDB('bookmarkSeries'),
};

export default db;
