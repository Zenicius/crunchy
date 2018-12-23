import electron from 'electron';
import path from 'path';
import fs from 'fs';

export default class Preferences {
  constructor(options = null) {
    // user data path (AppData/...)
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');

    // if theres is options use it, if not use lang default
    if (options == null) {
      const langDefault = {
        lang: 'en',
      };
      this.path = path.join(userDataPath, 'preferences' + '.json');
      this.data = this.parseDataFile(this.path, langDefault);
    } else {
      this.path = path.join(userDataPath, options.configName + '.json');
      this.data = this.parseDataFile(this.path, options.defaults);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;

    // use file sistem to write new value
    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }

  parseDataFile(filePath, defaults) {
    // if file doesnt exists yet
    try {
      return JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
      // if there was some kind of error, return the passed in defaults instead.
      return defaults;
    }
  }
}
