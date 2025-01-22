import { ApplicationCommand, Message, AttachmentBuilder} from "discord.js";

require('dotenv').config();
const path = require('node:path');
const { processAnyMessage }  = require(path.join(__dirname,'processAnyMessage.js'));
const { processTheInput } = require(path.join(__dirname, 'utils', 'tf-idf-process'));
const retrieveUserLogs = require('./retrieveUserLogs.js');
const { generateImage } = require(path.join(__dirname,'utils', 'generateLatexImage'));
const express = require('express');
const app = express();
const { Request, Response } = require('express');

const { Client, Events, EmbedBuilder} = require('discord.js');
const { channelIdGeneral, adminIds } = require(path.join(__dirname, 'config', 'stableSettings'));
const { modifyLogs, updateTotalQueries } = require(path.join(__dirname, 'adminActions', 'actions'));
const { getFromConfig } = require(path.join(__dirname, 'config', 'loadSettings'));
const { queryOpenAI, queryOpenAIForImage } = require('./openAI_module.js');
const { possibleCommands } = require(path.join(__dirname, 'utils', 'tf-idf-process'));
const { availableCommands } = require(path.join(__dirname, 'utils', 'availableCommands'));

const fs = require('node:fs');
const { Pool } = require('pg');


interface UserType {
    userId: string;
    queries: number;
}

interface userQuery {
    query: string;
    response: string | null;
}

interface UserQueriesArray {
    queries: Array<userQuery>;
}

const client = new Client({
    intents: 3276799
});

const GUILD_TEXT_CODE = 0;

const token = process.env.API_KEY;
client.login(token);


//TODO: This is defined one time, and again down below, we should use await pool.query(sql);
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
    rejectUnauthorized: false
    }
});

async function createTables() {

    // Initiate the pool for the database
    try{
      const client = await pool.connect();
      const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
      await client.query(sql);
  
      console.log('Tables created successfully');
      client.release();
    }

    catch (error) {
    console.error('Error creating the tables:', error);
    }

}

const checkCommands = async () => {

    try{
        console.log(`The bot is ready: ${client?.user?.username}`);
        const currentCommands = await client?.application?.commands?.fetch();

        // Check if the commands need to be updated based on the available commands defined above
        const isUpdateNeeded:boolean = 
        availableCommands.some((command:any) => !currentCommands.some((current:any) => 
            current?.name === command?.name 
        && current?.description === command?.description));

        if (isUpdateNeeded) {
            console.log('Updating commands...');
            await client?.application?.commands?.set(availableCommands);
            console.log('Commands updated.');
        } else {
            console.log('No command updates needed.');
        }
    }
    catch (error) {
        console.error('Error setting the commands and starting the bot:', error);
    }

}

client.on(Events.ClientReady, async () => {
    await checkCommands();
    await createTables();
    //TODO: Fix this type to avoid using strict mode false on tsconfig.json
    app.get('/', (req, res) => res.send("Bot is running, this root endpoint doesn't do/hide anything, don't try. ou're welcome."));
    const port = process.env.PORT || '0.0.0.0';

    app.listen(port, () => {
    console.log(`Listening on port ${port}`);
    
    });

});


let usersQueriesHistory: { [userId: string]: UserQueriesArray } = {};

//TODO: That would be retrieve from a database or a file, not hardcoded
let arrayOfUsers: Array<UserType> = [];
//start a timeout to clean all the queries of the users
// TODO: We need to process this and save in a database or logs, NOT HERE!
let totalQueriesToday = 0;
setTimeout(() => {
    arrayOfUsers = [];
}, 3600*4);
setTimeout(() => {
    totalQueriesToday = 0;
}, 3600*12);



const splitMessage = (message: string, arrayOfResponses: Array<string> ) => {

    // TODO: Cut the message correctly, if ends in the middle of a word.

    const messageParts = Math.floor(message.length/1950)
    const remaining = message.length % 1950;

    for (let i = 0; i < messageParts; i++){
        arrayOfResponses.push(message.slice(i*1950, (i+1)*1950));
        if (remaining >= 1) {
        arrayOfResponses.push(message.slice(messageParts*1950, message.length));
        }
    }
}


const processUserCounter = async (userId:string) => {

    if (adminIds.includes(userId)){
        return 0;
    }

    const userIndex = arrayOfUsers.findIndex(user => user.userId === userId);

    if (userIndex === -1){
        arrayOfUsers.push({userId, queries: 1});
        return 1;
    }

    else {
        arrayOfUsers[userIndex].queries += 1;
        totalQueriesToday += 1;
        console.log('totalQueriesToday', totalQueriesToday);
        return arrayOfUsers[userIndex].queries;
    }

    // TODO: We need to process this and save in a database or logs,
    // and before everything, we need to check the queries of users at the start of the bot

}

client.on(Events.MessageCreate, async (message: Message) => {

    if (!message.guild) {
        message.reply("I only respond to messages in the server, not in private messages.\n If you want to talk with me on private, please contact the admin.");
        return;
    }

    if (message.channel?.type !== GUILD_TEXT_CODE) {
        message.reply("I only respond to messages in the server, not in private messages.\n If you want to talk with me on private, please contact the admin.");
        return;
    }

    
    const botIdMention = '@1248874590416011264'
    const arrayOfResponses: Array<string> = [];
    
    if (!message.author.bot && message.content.length > 0){
        await processAnyMessage(message);
    }

    try {

        const isCommand = message.content.startsWith('/');
        let messageContent = isCommand ? message.content.slice(1) : message.content;
        const isValidQuery = !message.author.bot && messageContent.length > 1;
        // if (!isValidQuery) throw new Error('Invalid query'); //This is not working for logging the messages with 1 char.

        messageContent = processTheInput(messageContent);
        console.log('messagecontent processed by TF-IDF ->', messageContent);


        // Commands:
        const messageCommand = messageContent.slice(1);
        const commandSplitted = messageCommand.split(' ');
        let requestedCommand = commandSplitted[0];
        requestedCommand.toLowerCase();

        // console.log('messageCommand: ', messageCommand)
        // console.log(' username ', commandSplitted[1], 'type of data>', typeof commandSplitted[1]);

        // Message logging
        if (!message.content.includes(botIdMention)) {
            // console.log(`\n${message.author.username}: '{${message.content}}'
            //     In the channel: ${message.channel.name}, At ${message.createdAt}\n`);
            return;
            }

        // Message handling
        else {
            if (message.author.bot) return;

            const args = message.content.split(' ');

            if (message.content.includes('help')) {
                const embed = new EmbedBuilder()
                    .setTitle('WittgensteinBOT')
                    .setDescription(`Latency : ${client.ws.ping}ms`)
                    .setFooter({
                        text: `Requested by ${message.author.tag}`,
                        iconURL: `${message.author.displayAvatarURL()}`,
                    })
                    .setTimestamp();
                message.channel.send({ embeds: [embed] });
            }

            if (args.length === 0) {
                message.channel.send("Hello! I am WittgensteinBOT, but I'm currently useless.");
            } else {
                const question = args.slice(1).join(' ');

                if (message.attachments.size > 0) {
                    const attachment = message.attachments.first();
                    const imageUrl = attachment?.url;
        
                    try {
                        let generatedImage = '';
                        const analysisResult = await queryOpenAIForImage(imageUrl, question);
                        const queriesOfTheUser = await processUserCounter(message.author.id);
                        console.log("The user has made: ", queriesOfTheUser, " queries");

                        // si la question tiene latex, entonces se llama a una funcion que genera la imagen
                        // en base a analysisResult
                        if (question.toLocaleLowerCase().includes('latex')) {
                            try {
                                generatedImage = await generateImage(analysisResult);

                            } catch (error) {
                                console.error('Error generating the image:', error);
                                message.channel.send(`There was an error generating the image. Please try again later.`);
                            }
                        }
                        if (generatedImage === ''){
                        message.channel.send(`${message.author}: ${analysisResult}`);
                        }
                        else {
                            const attachedGeneratedImage = new AttachmentBuilder(generatedImage)
                            .setName(`WittgensteinBOT_LaTeX_${Date.now()}.png`)
                            .setDescription('Generated LaTeX image');
                            message.channel.send({
                                content: `${message.author}: ${analysisResult}`,
                                files: [attachedGeneratedImage],
                            });
                        }

                    } catch (error) {
                        console.error('Error analyzing the image:', error);
                        message.channel.send(`There was an error analyzing the image. Please try again later.`);
                    }
                }

            }
        }
    } catch (e) {
        console.error(`Error processing the message: ${e}`);
    }
     
});

client.on('interactionCreate', async (interaction: any) => {

    if (!interaction.isCommand()) {
        console.log('The interaction is not a valid command');
        return;
    }

    const requestedCommand = interaction.commandName;
    const userAuthor = interaction.user;
    const arrayOfResponses: Array<string> = [];

    if (interaction.channel?.type !== GUILD_TEXT_CODE) {
        interaction.reply("I only respond to messages in the server, not in private messages.\n If you want to talk with me on private, please contact the admin.");
        return;
    }

    if (requestedCommand === 'query') {

        try{
            const question = interaction?.options?.getString('query_input');
            // Defer the reply for asynchronous actions that take time
            await interaction.deferReply();

            //We process the user for security reasons
            const queriesOfTheUser = await processUserCounter(userAuthor.id);
            console.log("The user has made: ", queriesOfTheUser, " queries");

            if (queriesOfTheUser >= 20){
                interaction.followUp(`${userAuthor}: Sorry, you have reached the limit of queries for now. Try again in 4 hours.`);
                return;
            }

            if (totalQueriesToday >= 300){
                interaction.followUp(`${userAuthor}: Sorry, the limit of queries today has been reached. Contact the admin.`);
                return;
            }
            
            // This is another way of get something from the config file:
            // let { total_queries } = await getFromConfig('total_queries');
            // console.log('total_queries', total_queries);

            const totalQueries = await updateTotalQueries()
            if (totalQueries >= 2000){
                //TODO: Put this @roles outside, in a config file or something better.
                interaction.followUp(`${userAuthor}: Sorry, the global limit of queries has been reached. Contact the @Admin or @Moderator.`);
                return;
            }

            const userIsPremium = adminIds.includes(userAuthor.id); //TODO: In the near future, change this to a function.
            
            let answer = null;

            if (userIsPremium){

                if (!usersQueriesHistory[userAuthor.id]) {
                    // Initialize if the user does not have any queries made by now
                    usersQueriesHistory[userAuthor.id] = { queries: [] };
                }

                //First we update just the query
                usersQueriesHistory[userAuthor.id]?.queries?.push({query: question, response: ''});

                answer = await queryOpenAI(question, usersQueriesHistory[userAuthor.id]['queries']);

                //Finally, whe update the response of the query defined above
                const lastElement = usersQueriesHistory[userAuthor.id]['queries']?.length - 1

                usersQueriesHistory[userAuthor.id]['queries'][lastElement]['response']
                = answer?.choices[0]?.message?.content;
                console.log("usersQueriesHistory", usersQueriesHistory);
            }
            
            else{
                answer = await queryOpenAI(question);
            }

            const finalResponse = answer?.choices[0]?.message?.content

            if (finalResponse.length >= 1950){
                splitMessage(finalResponse, arrayOfResponses);
                console.log('arrayOfResponses.length', arrayOfResponses.length);
                console.log('arrayOfResponses', arrayOfResponses);

                for (let i = 0; i < arrayOfResponses.length; i++){
                    console.log('Sending message', i+1);
                    interaction.followUp(`${userAuthor} ${i+1}/${arrayOfResponses.length}: ${arrayOfResponses[i]}`);
                }

                return;
            }

            interaction.followUp(`${userAuthor}: ${finalResponse}`);
        }
        catch (error) {
            console.error('Error processing the query:', error);
            interaction.followUp(`There was an error processing the query. Please try again later.`);
        }

    } 

    else if (requestedCommand === 'show') {
        interaction.reply(`<@${userAuthor}>: Sorry, this option is not available right now.`);
        return;

        // const prompt = commandSplitted.slice(1).join(' ');
        // const imageUrl = await generateImage(prompt);
        // console.log('generated image URL', imageUrl);
        // const embed = new EmbedBuilder()
        //     .setTitle('Generated Image')
        //     .setImage(imageUrl)
        //     .setColor('#00ff00')
        //     .setFooter({
        //         text: `Requested by ${message.author.tag}`,
        //         iconURL: `${message.author.displayAvatarURL()}`,
        //     })
        //     .setDescription(`Latency : ${client.ws.ping}ms`)
        //     .setTimestamp();
        // // message.reply({ embeds: [embed] });
        // message.channel.send({ embeds: [embed] });
    } 

    else if (requestedCommand === 'logs_enable' || requestedCommand === 'logs_disable') {

        // Defer the reply for asynchronous actions that take time
        await interaction.deferReply();

        if (!(adminIds.includes(userAuthor.id))){
            interaction.followUp(`${userAuthor}: Sorry, to use this command you need to be root.`);
            return;
        }

        let changeTo = requestedCommand === 'logs_enable' ? true : false;

        try{
            let newLogStatus = await modifyLogs(changeTo=changeTo);

            if (newLogStatus === null) {
                return
            };

            if (newLogStatus){
                interaction.followUp(`${userAuthor}: The logs are now globally **enabled**.`);
            } else {
                interaction.followUp(`${userAuthor}: The logs are now globally **disabled**.`);
            }
        } 
        catch (error) {
            console.error('Error modifying the logs:', error);
            interaction.followUp(`There was an error modifying the logs. Please try again later.`);
        }
    }

    else if (requestedCommand === 'sudo_man') {
        try{
        const embed = new EmbedBuilder()
            .setTitle('WittgensteinBOT Manual')
            .setDescription(`
                /query_latex <question>: I will respond using AI, but the answer will be an image in LaTeX format.\n
                /query <question>: Ask me a question, I will respond using AI.\n
                /logs: Show the logs status and info.\n
                /logs_user <username>: Show the logs of the user.\n
                /logs_enable: Enable the logs globally (must be root).\n
                /logs_disable: Disable the logs globally (must be root).\n
                @WittgensteinBOT + attached image + <optional question>: I process the image using AI\
                image analysis, if you add "latex" i will send you an image of the LaTeX response.\n
                /image <@user>: Show the image of the mentioned user (unavailable).\n
                /show <prompt>: Generate an image based on the prompt (unavailable).\n
                /sudo_man: Show this manual.\n
            `)
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();
    
        // Send the embed
        interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error showing the manual:', error);
            interaction.followUp(`There was an error showing the manual. Please try again later.`);
        }
    }

    else if (requestedCommand.startsWith('logs')) {
        let userRequested = interaction?.options?.getString('username');

        //We cannot use @ just like that, because it is not a valid username, it's the id. Apply this in the future will be
        //increase the cost of the query, so we need to avoid it.
        // if (userRequested.includes('@')) {
        //     userRequested = userRequested.slice(1);
        // }

        console.log('The user', userAuthor, 'requested the logs of', userRequested);

        try{
            // Defer the reply for asynchronous actions that take time
            await interaction.deferReply();

            let { global_logs } = await getFromConfig('global_logs');
            global_logs = global_logs ? 'enabled' : 'disabled';

            if (global_logs === null) {
                return
            };

            if (!userRequested) {
                interaction.followUp(`${userAuthor} \n- Log status => **${global_logs}** \n\nIf you want to enable or disable the logs globally, try /logs enable or /logs disable.`);
            }

            // interaction.followUp(`${userAuthor} You need to specify the username of the user you want to see the logs. Try **!logs <username>**\
            //     \n\n- Log status => **${global_logs}** \n\nIf you want to enable or disable the logs globally, try !logs enable or !logs disable.`);
        }

        catch (error) {
            console.error('Error in command logs:', error);
            interaction.followUp(`There was an error using the command. Please try again later.`);
            return
        }

        if (!userRequested) return;

            try{
                //IIFE to retrieve the logs of the user
                (async () => {
                const logFile = await retrieveUserLogs(userRequested);
            
                if (!logFile) {
                    interaction.followUp(`${userAuthor} Sorry, there was an error retrieving the logs.`);
                    return;
                }

                interaction.followUp(`Here is the log file for ${userRequested}\n `);
                interaction.followUp({ files: [logFile] });
                })();
            } 
            catch (error) {
                console.error('Error retrieving the logs:', error);
                interaction.followUp(`There was an error retrieving the logs. Please try again later.`);
            }
        }

    });


// Welcome message
client.on(Events.GuildMemberAdd, async (member:any) => {
    const channel = await client.channels.fetch(channelIdGeneral);
    channel.send(`Welcome to the server, <@${member.user.id}>!\n
I'm an AI powered BOT, You can ask me anything you want, I'm here to help you.
Send me images, code, text, or anything you want to know and I will try to help you.
To see the list of commands, use the /sudo_man in the chat.`);
});
