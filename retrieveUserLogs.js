
const fs = require('fs');
const path = require('path');
const { Message } = require('discord.js');

const findLogFile = (username, date) => {
    const logsDirectory = path.join(__dirname, '.', 'logs', 'usersMessages', `${username}`);
    return new Promise((resolve, reject) => {
    
        fs.readdir(logsDirectory, (err, files) => {
        if (err) {
            reject(err);
            return;
        }

        // Find the exact file that matches the actual date
        const foundFile = files.find(file => file === `${username}_${date}.log`);
        console.log('Found file:', foundFile);
        const fullPath = path.join(logsDirectory, foundFile);


    
        if (foundFile) {
            resolve(fullPath); // Resolve the promise with the full path of the found file
        } else {
            console.log(`AAAAANo log file found for ${username}_${date}.log`);
            const filenamePattern = `${username}_*.log`; // Using * as a wildcard for any date
            // Find the first matching file
            const foundFile = files.find(file => file.startsWith(filenamePattern));
            if (foundFile) {
                const fullPath = path.join(logsDirectory, foundFile);
                resolve(fullPath); // Resolve the promise with the full path of the found file
            } else {
                reject(new Error(`No log file found for ${username} on ${date}`)); // Reject if no matching file is found
            }
        }});
    });
    };

const retrieveUserLogs = async (message, username) => {

    if (!(message instanceof Message)){
        console.error('Message is not an instance of Message class');
        return;
    }

    const channelId = message.channel.id;
    const channelName = message.channel.name;
    const channelType = message.channel.type;
    const messageContent = message.content;
    const messageAuthor = message.author.username;
    const messageAuthorId = message.author.id;
    const isBot = message.author.bot;
    const messageTimestamp = message.createdTimestamp;
    const messageAuthorNickname = message.member.nickname;

    const todayTimestamp = new Date();
    const todayDate = todayTimestamp.getDate();
    const todayMonth = todayTimestamp.getMonth();
    const todayDateAndMonth = `${todayDate}-${todayMonth}`;
    const todayFullDate = `${todayDate}-${todayMonth}-${todayTimestamp.getFullYear()}`;
    const todayTime = todayTimestamp.toLocaleTimeString();
    const fileTitle = `-- Messages from ${messageAuthor} (id: ${message.author.id}) on ${todayFullDate}:`;
    
    if (message instanceof Message) {
        // const logPath = path.join(__dirname, '.', 'logs', 'usersMessages', `${messageAuthor}`, `${messageAuthor}_${todayFullDate}.log`);
        // const logMessage = `(${todayTime}) => ${message.author.username}: ${message.content}`;

        try {
            const filePath = await findLogFile(username, todayFullDate);
            return filePath; // Devuelve la ruta del archivo de log encontrado
          } catch (err) {
            console.error('Error finding log file:', err.message);
            return null;
          }

    }
};

module.exports = retrieveUserLogs;