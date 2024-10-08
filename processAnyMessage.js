
const fs = require('node:fs');
const path = require('node:path');
const { Message } = require('discord.js');
// const { secret_string, global_logs } = require('./config/generalConfig');
const { getFromConfig } = require(path.join(__dirname, 'config', 'loadSettings.js'));

const saveMessageLog = (logPath, logMessage, title) => {
    fs.readFile(logPath, 'utf8', (err, data) => {
      if (err) {
        // If the file doesn't exist (or there's an error), assume it's the first write
        const initialContent = title + '\n\n' + logMessage;
        fs.writeFile(logPath, initialContent, 'utf8', err => {
          if (err) {
            console.error('Error writing the file:', err);
            //If the error is ENOENT, it means the directory doesn't exist, we should create it
            if (err.code === 'ENOENT') {
              fs.mkdir(path.dirname(logPath), { recursive: true }, err => {
                if (err) {
                  console.error('Error creating the directory:', err);
                } else {
                  console.log('Directory created, retrying to save the log file.');
                  saveMessageLog(logPath, logMessage, title);
                }
              });
            }
          } else {
            console.log(`The log file has been created and saved.`);
          }
        });

      } else {
        // If the file already exists, append a newline before the new log message!
        const updatedContent = data + '\n' + logMessage;
        fs.appendFile(logPath, '\n' + logMessage, 'utf8', err => {
          if (err) {
            console.error('Error appending to the log file:', err);
          } else {
            console.log('New message appended to the log file.');
          }
        });
      }
    });
  };

const processAnyMessage = async (message) => {

    let {secret_string, global_logs} = await getFromConfig('secret_string', 'global_logs');

    if (!(message instanceof Message)){
        console.error('Message is not an instance of Message class from discord.js');
        return;
    }

    const channelId = message.channel.id;
    const channelName = message.channel.name;
    const messageContent = message.content;
    const messageAuthor = message.author.username;
    const messageAuthorNickname = message.author.globalName;
    const messageAuthorId = message.author.id;
    const isBot = message.author.bot;
    const messageTimestamp = message.createdTimestamp;
    const messageChannel = message.channel.name;

    const todayTimestamp = new Date();
    const todayDate = todayTimestamp.getDate();
    const todayMonth = todayTimestamp.getMonth();
    // const todayDateAndMonth = `${todayDate}-${todayMonth}`;
    const todayFullDate = `${todayDate}-${todayMonth}-${todayTimestamp.getFullYear()}`;
    const todayTime = todayTimestamp.toLocaleTimeString();
    const fileTitle = `-- Messages from ${messageAuthor} (id: ${message.author.id}, alias: ${messageAuthorNickname}) on ${todayFullDate}:`;
    
    const logPath = path.join(__dirname, '.', 'logs', 'usersMessages', `${messageAuthor}`, `${messageAuthor}_${todayFullDate}.log`);
    const logMessage = `(${todayTime}) on #${messageChannel} => ${messageAuthorNickname}: "{${message.content}}"`;

    if (!(global_logs)) {
        console.log('Global logs are disabled, the message will not be logged.');
        return;
    }

    if (channelName.includes(secret_string)) {
        console.log('This is a secret channel, the message will not be logged.');
        return;
    }

    saveMessageLog(logPath, logMessage, fileTitle);
};

module.exports = {processAnyMessage};