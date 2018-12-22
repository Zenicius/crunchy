const electron = require('electron');
const path = require('path');
const fs = require('fs');

class Preferences {
  constructor(options) {
    // user data path (AppData/...)
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    // name of the file
    this.path = path.join(userDataPath, options.configName + '.json');

    this.data = parseDataFile(this.path, options.defaults);
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;

    // use file sistem to write new value
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }
}

function parseDataFile(filePath, defaults) {
  // if file doesnt exists yet
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    // if there was some kind of error, return the passed in defaults instead.
    return defaults;
  }
}

module.exports = Preferences;
