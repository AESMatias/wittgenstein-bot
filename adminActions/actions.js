const fs = require('fs');
const path = require('path');
const { Message } = require('discord.js');
const JsonConfigPath = path.join(__dirname, '../config/generalConfig.json');
const {configObject} = require(path.join('../config/loadSettings'));

let {cachedConfig} = configObject;

const setNewGlobalLogsStatus = async (newStatus) => {
    if (typeof newStatus !== 'boolean') {
      return console.error('The new status for "global_logs" must be of type boolean');
    }

    if (!cachedConfig) {
      const rawData = fs.readFileSync(JsonConfigPath, 'utf8');
      cachedConfig = JSON.parse(rawData);
    }

    configObject.cachedConfig.global_logs = newStatus;
  
    await fs.promises.writeFile(JsonConfigPath, JSON.stringify(configObject.cachedConfig, null, 2));
    console.log(`**TAASDASDSADhe "global_logs" status has been updated to ${newStatus}**`);
    console.log('RETORNANDO', configObject.cachedConfig.global_logs);
    return configObject.cachedConfig.global_logs;
  
  
};

const modifyLogs = async (message, changeTo ,username='Admin') => {

    if (!(message instanceof Message)){
        console.error('Message is not an instance of Message class');
        return;
    }

    try {
        let newLogStatus = await setNewGlobalLogsStatus(changeTo);
        console.log('RETORNAAAAAAAAAAAAA', newLogStatus);
        return newLogStatus;
        } catch (err) {
        console.error('Error finding log file:', err.message);
        return null;
        }
};

module.exports = {
    modifyLogs,
}