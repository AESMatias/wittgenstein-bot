const fs = require('node:fs');
const path = require('node:path');
const { Message } = require('discord.js');
// const { path } = require('node:path');
// const JsonConfigPath = path.join(__dirname, '..', 'config', 'generalConfig.json');
const {configObject} = require(path.join(__dirname, '..', 'config', 'loadSettings.js'));
const { Pool } = require('pg');


// let {cachedConfig} = configObject;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const setNewGlobalLogsStatus = async (newStatus:boolean) => {
  if (typeof newStatus !== 'boolean') {
    return console.error('The new status for "global_logs" must be of type boolean');
  }

  try {
    const client = await pool.connect();
    await client.query('UPDATE config SET value = $1 WHERE key = $2', [newStatus, 'global_logs']);
    client.release();
    console.log(`"global_logs" status has been updated to ${newStatus}`);
  } catch (error) {
    console.error('Error setting new global_logs status:', error);
    throw error;
  }
}

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


const incrementTotalQueries = async () => {
  try {
    const client = await pool.connect();
    // Incrementar el valor de total_queries en 1
    const result = await client.query('UPDATE config SET value = value::int + 1 WHERE key = $1 RETURNING value', ['total_queries']);
    client.release();
    const newTotalQueries = parseInt(result.rows[0].value, 10);
    console.log(`Total queries incremented to ${newTotalQueries}`);
    return newTotalQueries;
  } catch (error) {
    console.error('Error incrementing total queries:', error);
    throw error;
  }
  
};


const updateTotalQueries = async () => {

  try {
      let newStatus = await incrementTotalQueries();
      return newStatus;
      } 
  catch (err) {
    console.error('Error updating total queries:', err);
    return null;
  }
};

module.exports = {
    modifyLogs,
    updateTotalQueries,
}