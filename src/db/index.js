import PouchDB from 'pouchdb-browser';

const db = {
  series: new PouchDB('series'),
  episodes: new PouchDB('episodes'),
  current: new PouchDB('current'),
  //TODO info: new PouchDB('info'),
  auth: new PouchDB('auth'),
  bookmarkSeries: new PouchDB('bookmarkSeries'),
  bookmarkEpisodes: new PouchDB('bookmarkEpisodes'),
};

export default db;
