const fs = require('fs');
const path = require('path');

const JsonConfigPath = path.join(__dirname, 'generalConfig.json');
let cachedConfig = null;

getFromConfig = (...keys) => {

  if (keys.length === 0) {
    console.error('No keys provided to getFromConfig');
    return null;
  }
  
  if (!cachedConfig) {

    console.log(`**The generalConfig.json is not cached at all, reading from file**`);

    const rawData = fs.readFileSync(JsonConfigPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading the file:', err);
        return null;
      }
    });

    cachedConfig = JSON.parse(rawData);
  }


  const uncachedKeys = keys.filter(
    key => {!(cachedConfig.hasOwnProperty(key))
    // console.log(`The key ${key} is not cached, reading from file...`)
  });
  
  if (uncachedKeys.length > 0) {
    console.log(`The config for ${uncachedKeys} is not cached, reading from file...`);
    const rawData = fs.readFileSync(JsonConfigPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading the file:', err);
        return null;
      }
    });
    cachedConfig = JSON.parse(rawData);
  }

  let results = {};

  keys.forEach(key => {
    results[key] = cachedConfig[key];
  });

  return results;

}

module.exports = {
  getFromConfig
}