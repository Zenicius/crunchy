import PouchDB from 'pouchdb-browser';

const db = {
  series: new PouchDB('series'),
  episodes: new PouchDB('episodes'),
  current: new PouchDB('current'),
  auth: new PouchDB('auth'),
  bookmarkSeries: new PouchDB('bookmarkSeries'),
};

export default db;
