const fs = require('node:fs');
const path = require('node:path');

const JsonConfigPath = path.join(__dirname, 'generalConfig.json');


let configObject = {
  cachedConfig: null,
};

const getFromConfig = async (...keys) => {

  if (keys.length === 0) {
    console.error('No keys provided to getFromConfig');
    return null;
  }
  
  if (!configObject.cachedConfig) {
    try {
      const rawData = await fs.promises.readFile(JsonConfigPath, 'utf8');
      configObject.cachedConfig = JSON.parse(rawData);
      console.log(`**The generalConfig.json was not cached, reading from file**\nThe cachedConfig is: ${JSON.stringify(configObject.cachedConfig)}`);
    } catch (err) {
      console.error('Error reading or parsing the configuration file:', err);
      return null; 
    }
  }

  const uncachedKeys = keys.filter(key => !(key in configObject.cachedConfig));
  
  //The if statement below almost never runs, but it's here just in case
  if (uncachedKeys.length > 0) {
    console.log(`The config for ${uncachedKeys} is not cached, reading from file...`);
    const rawData = await fs.promises.readFile(JsonConfigPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading the file:', err);
        return null;
      }
    });
    configObject.cachedConfig = JSON.parse(rawData);
  }

  let results = {};

  keys.forEach(key => {
    results[key] = configObject.cachedConfig[key];
  });

  return results;

}

module.exports = {
  getFromConfig,
  configObject,
}