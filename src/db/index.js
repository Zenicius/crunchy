import PouchDB from 'pouchdb-browser';

const db = {
  series: new PouchDB('series'),
  episodes: new PouchDB('episodes'),
  current: new PouchDB('current'),
  info: new PouchDB('info'),
  auth: new PouchDB('auth'),
};

export default db;
