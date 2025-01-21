
const fs = require('fs');
const path = require('node:path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const retrieveUserLogs = async (username) => {

    try {
        const client = await pool.connect();

        // Get all messages for the user
        const result = await client.query(
        'SELECT m.message_content, m.channel_name, m.message_timestamp FROM messages m JOIN users u ON m.user_id = u.user_id WHERE u.username = $1',
        [username]
        );
        client.release();

        if (result.rows.length === 0) {
        return null; // There are no logs for this user
        }

        // Create a string with the logs
        let logContent = `Logs for user ${username}:\n\n`;
        result.rows.forEach(row => {
        const timestamp = new Date(row.message_timestamp).toLocaleString();
        logContent += `(${timestamp}) on #${row.channel_name} => ${username}: "${row.message_content}"\n`;
        });

        // Generate a unique filename based on the current timestamp
        const timestamp = Date.now();
        const filename = `${username}_logs_${timestamp}.txt`;

        // Write the logs to a file
        await fs.promises.writeFile(filename, logContent);

        return filename;
    } catch (error) {
        console.error(`Error retrieving logs for user ${username}:`, error);
        return null;
    }

};

module.exports = retrieveUserLogs;