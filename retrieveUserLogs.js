
const fs = require('fs');
const path = require('node:path');
const { Message } = require('discord.js');

const findLogFile = (username, date) => {

    const logsDirectory = path.join(__dirname, 'logs', 'usersMessages', `${username}`);

    return new Promise((resolve, reject) => {
        fs.readdir(logsDirectory, (err, files) => {

        if (err) {
            reject(err);
            return;
        }

        // Find the exact file that matches the actual date
        const foundFile = files.find(file => file === `${username}_${date}.log`);
        

        if (foundFile && foundFile !== undefined) {
            // console.log('Found file:', foundFile);
            const fullPath = path.join(logsDirectory, foundFile);
            resolve(fullPath); // Resolve the promise with the full path of the found file
        } 
        else {

            console.log(`No log file found for ${username}_${date}.log`);
            const filenamePattern = `${username}_*.log`; // Using * as a wildcard for any date

            // Find the first matching file
            const foundFile = files.find(file => file.startsWith(filenamePattern));

            if (!foundFile) {
                reject(new Error(`No log file found for ${username} on ${date}`)); // Reject if no matching file is found
                return
            }

            const fullPath = path.join(logsDirectory, foundFile);
            resolve(fullPath); // Resolve the promise with the full path of the found file
        }});
    });
    };


const retrieveUserLogs = async (username) => {

    const todayTimestamp = new Date();
    const todayDate = todayTimestamp.getDate();
    const todayMonth = todayTimestamp.getMonth();
    const todayFullDate = `${todayDate}-${todayMonth}-${todayTimestamp.getFullYear()}`;
 
    try {
        const filePath = await findLogFile(username, todayFullDate);
        return filePath;
        } catch (err) {
        console.error(`Error finding log file for username${username}:`, err);
        return null;
        }
};

module.exports = retrieveUserLogs;