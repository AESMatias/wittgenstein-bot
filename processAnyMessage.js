
const { secret_string, global_logs } = require('./config/generalConfig');
const path = require('node:path');
// const { getFromConfig } = require(path.join(__dirname, 'config', 'loadSettings.js'));
const { Message } = require('discord.js');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
  rejectUnauthorized: false
  }
});

const processAnyMessage = async (message) => {
  // let { secret_string, global_logs } = await getFromConfig('secret_string', 'global_logs');

  if (!(message instanceof Message)) {
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
  const todayFullDate = `${todayDate}-${todayMonth}-${todayTimestamp.getFullYear()}`;
  const todayTime = todayTimestamp.toLocaleTimeString();

  if (!(global_logs)) {
    console.log('Global logs are disabled, the message will not be logged.');
    return;
  }

  if (channelName.includes(secret_string)) {
    console.log('This is a secret channel, the message will not be logged.');
    return;
  }

  try {
    // Acquire a connection from the pool
    const client = await pool.connect();

    // Check if the user exists
    const userResult = await client.query('SELECT 1 FROM users WHERE user_id = $1', [messageAuthorId]);

    if (userResult.rows.length === 0) {
      // Insert the user if it doesn't exist
      if (messageAuthorNickname === null) {
        await client.query('INSERT INTO users (user_id, username) VALUES ($1, $2, $3)', [messageAuthorId, messageAuthor, 'No_nickname']);
      }
      await client.query('INSERT INTO users (user_id, username, nickname) VALUES ($1, $2, $3)', [messageAuthorId, messageAuthor, messageAuthorNickname]);
    }

    // Insert the message
    await client.query(
      'INSERT INTO messages (message_id, user_id, channel_id, channel_name, message_content, message_timestamp) VALUES ($1, $2, $3, $4, $5, TO_TIMESTAMP($6))',
      [message.id, messageAuthorId, channelId, channelName, messageContent, messageTimestamp / 1000]
    );

    console.log('Message from user', messageAuthor, 'saved to the database.');

    // Release the connection
    client.release();
  } catch (error) {
    console.error('Error saving message to database:', error);
  }
};

module.exports = { processAnyMessage };