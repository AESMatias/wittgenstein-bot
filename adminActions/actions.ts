const fs = require('node:fs');
const path = require('node:path');
const { Message } = require('discord.js');
// const { path } = require('node:path');
// const JsonConfigPath = path.join(__dirname, '../config/generalConfig.json');
const JsonConfigPath = path.join(__dirname, '..', 'config', 'generalConfig.json');
const {configObject} = require(path.join(__dirname, '..', 'config', 'loadSettings.js'));

let {cachedConfig} = configObject;

const setNewGlobalLogsStatus = async (newStatus:boolean) => {

    if (typeof newStatus !== 'boolean') {
      return console.error('The new status for "global_logs" must be of type boolean');
    }

    if (!cachedConfig) {
      console.log('NMO CAHCEEEEEEEEE')
      const rawData = fs.readFileSync(JsonConfigPath, 'utf8'); // Change this to Async
      cachedConfig = JSON.parse(rawData);
      console.log(`**The generalConfig.json was not cached, reading from file**\nThe cachedConfig is: ${JSON.stringify(cachedConfig)}`);
    }

    configObject.cachedConfig.global_logs = newStatus;
  
    await fs.promises.writeFile(JsonConfigPath, JSON.stringify(configObject.cachedConfig, null, 2));
    console.log(`** "global_logs" status has been updated to ${newStatus}**`);
    return configObject.cachedConfig.global_logs;
};

const modifyLogs = async (changeTo:boolean) => {

    // if (!(message instanceof Message)){
    //     console.error('Message is not an instance of Message class');
    //     return;
    // }

    try {
        let newLogStatus = await setNewGlobalLogsStatus(changeTo);
        return newLogStatus;
        } 
    catch (err) {
      console.error('Error finding log file:', err);
      return null;
    }
};

module.exports = {
    modifyLogs,
}