import { Message } from "discord.js";

require('dotenv').config();
const path = require('path');
const { processAnyMessage }  = require(path.join(__dirname,'processAnyMessage.js'));
const { processTheInput } = require(path.join(__dirname, 'utils', 'tf-idf-process'));
const retrieveUserLogs = require('./retrieveUserLogs.js');

const { Client, Events, EmbedBuilder} = require('discord.js');
const axios = require('axios');  // TODO: I think i should use fetch instead of axios xd
// const fetch = require('node-fetch');
const { channelIdGeneral, adminIds } = require(path.join(__dirname, 'config', 'stableSettings'));
const { modifyLogs } = require(path.join(__dirname, 'adminActions', 'actions'));
const { getFromConfig } = require(path.join(__dirname, 'config', 'loadSettings'));
const { queryOpenAI, queryOpenAIForImage } = require('./openAI_module.js');
const { possibleCommands } = require(path.join(__dirname, 'utils', 'tf-idf-process'));
const { availableCommands } = require(path.join(__dirname, 'utils', 'availableCommands'));

// const { APIMessage } = require('discord-api-types/v10');


interface UserType {
    userId: string;
    queries: number;
}


const client = new Client({
    intents: 3276799
});


client.on(Events.ClientReady, async () => {
    try{
        console.log(`The bot is ready: ${client?.user?.username}`);

        const currentCommands = await client?.application?.commands?.fetch();

        // Check if the commands need to be updated based on the available commands defined above
        const isUpdateNeeded = availableCommands
        .some((command:any) => !currentCommands
        .some((current:any) => current?.name === command?.name 
        && current?.description === command?.description)) 
        || currentCommands?.size !== availableCommands.length;

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
});

interface userQuery {
    query: string;
    response: string | null;
}

interface UserQueriesArray {
    queries: Array<userQuery>;
}


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
    
    const botIdMention = '@1248874590416011264'
    const arrayOfResponses: Array<string> = [];
    
    await processAnyMessage(message);

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
                        const analysisResult = await queryOpenAIForImage(imageUrl, question);
                        const queriesOfTheUser = await processUserCounter(message.author.id);
                        console.log("The user has made: ", queriesOfTheUser, " queries");

                        message.channel.send(`${message.author}: ${analysisResult}`);
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

    if (requestedCommand === 'query') {

        try{
            const question = interaction?.options?.getString('query_input');
            // Defer the reply for asynchronous actions that take time
            await interaction.deferReply();

            //We process the user for security reasons
            const queriesOfTheUser = await processUserCounter(userAuthor.id);
            console.log("The user has made: ", queriesOfTheUser, " queries");

            if (queriesOfTheUser >= 10){
                interaction.followUp(`${userAuthor}: Sorry, you have reached the limit of queries for now. Try again in 4 hours.`);
                return;
            }

            if (totalQueriesToday >= 200){
                interaction.followUp(`${userAuthor}: Sorry, the limit of queries for today has been reached. Try again tomorrow.`);
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

            // interface userQuery {
            //     query: string;
            //     response: string | null;
            // }
            
            // interface UserQueriesArray {
            //     queries: Array<userQuery>;
            // }
            
            
            // let usersQueriesHistory: { [userId: string]: UserQueriesArray } = {};
            
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
                /query <question>: Ask me a question, I respond using AI.\n
                /logs: Show the logs status and info.\n
                /logs_user <username>: Show the logs of the user.\n
                /logs_enable: Enable the logs globally (must be root).\n
                /logs_disable: Disable the logs globally (must be root).\n
                @WittgensteinBOT + attached image: I process the image using AI image analysis.\n
                /image <@user>: Show the image of the mentioned user (unavailable).\n
                /show <prompt>: Generate an image based on the prompt (unavailable).\n
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
            interaction.reply(`There was an error showing the manual. Please try again later.`);
        }
    }

    else if (requestedCommand.startsWith('logs')) {
        const userRequested = interaction?.options?.getString('username');
        console.log('userRequested', userRequested);

        try{
            // Defer the reply for asynchronous actions that take time
            await interaction.deferReply();

            let { global_logs } = await getFromConfig('global_logs');
            console.log('global_logs', global_logs);
            global_logs = global_logs ? 'enabled' : 'disabled';

            if (global_logs === null) {
                return
            };

            if (!userRequested) {
                interaction.followUp(`${userAuthor} \n- Log status => **${global_logs}** \n\nIf you want to enable or disable the logs globally, try !logs enable or !logs disable.`);
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
                    interaction.reply(`${userAuthor} Sorry, there was an error retrieving the logs.`);
                    return;
                }

                interaction.followUp(`Here is the log file for ${userRequested}\n `);
                interaction.followUp({ files: [logFile] });
                })();
            } 
            catch (error) {
                console.error('Error retrieving the logs:', error);
                interaction.reply(`There was an error retrieving the logs. Please try again later.`);
            }
        }

    });


// Welcome message
client.on(Events.GuildMemberAdd, async (member:any) => {
    const channel = await client.channels.fetch(channelIdGeneral);
    channel.send(`Welcome to the server, <@${member.user.id}>!\n
        I'm an AI powered BOT, You can ask me anything you want, I'm here to help you.
        Send me images, code, text, or anything you want to know and I will try to help you.
        To see the list of commands, type:\n!sudo man or just tag me @WittgensteinBOT`);
});

const token = process.env.API_KEY;
client.login(token);