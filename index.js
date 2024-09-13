require('dotenv').config();
const processAnyMessage  = require('./processAnyMessage.js');
const retrieveUserLogs = require('./retrieveUserLogs.js');
const { Client, Events, EmbedBuilder, GatewayIntentBits, Partials } = require('discord.js');
const axios = require('axios');  // TODO: I think i should use fetch instead of axios xd
const fetch = require('node-fetch');
const {channelIdGeneral, adminIds} = require('./config/stableSettings.js');
const {modifyLogs} = require('./adminActions/actions.js');
const {getFromConfig} = require('./config/loadSettings.js');

const { queryOpenAI, queryOpenAIForImage } = require('./openAI_module.js');


const client = new Client({
    intents: 3276799
});

client.on(Events.ClientReady, async () => {
    console.log(`Bot is ready: ${client.user.username}`);
});


let arrayOfUsers = [];
//start a timeout to clean all the queries of the users
// TODO: We need to process this and save in a database or logs, NOT HERE!
setTimeout(() => {
    arrayOfUsers = [];
}, 3600*4);


// const generateImage = async (prompt) => {
//     const apiKey = process.env.OPENAI_API_KEY;
//     const url = 'https://api.openai.com/v1/images/generations';

//     try {
//         const response = await axios.post(url, {
//             prompt: prompt,
//             n: 1,
//             size: "1024x1024"
//         }, {
//             headers: {
//                 'Authorization': `Bearer ${apiKey}`,
//                 'Content-Type': 'application/json'
//             }
//         });

//         return response.data.data[0].url;
//     } catch (error) {
//         console.error('Error generating image:', error);
//         return 'Sorry, there was an error generating the image.';
//     }
// };

// const createImage = async (message) => {
//     const target = message.mentions.users.first();
//     const memberId = await message.guild.members.fetch(target.id);

//     if (!target) {
//         message.reply('Please mention someone to show their image');
//         return;
//     }

//     if (!memberId) {
//         message.reply('Sorry, the user was not found');
//         return;
//     }

//     const image = memberId.user.displayAvatarURL({ dynamic: true, size: 512 });
    
//     const embed = new EmbedBuilder()
//         .setTitle(`${target.username}'s Avatar`)
//         .setImage(image)
//         .setColor('#00ff00')
//         .setFooter('WittgensteinBOT')
//         .setTimestamp();
//     message.reply({ embeds: [embed] });
// }

const splitMessage = (message, arrayOfResponses) => {

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

const processUserCounter = (userId) => {
    if (adminIds.includes(userId)){
        return 0;
    }
    const userIndex = arrayOfUsers.findIndex(user => user.userId === userId);
    if (userIndex === -1){
        arrayOfUsers.push({userId, queries: 1});
        return 1;
    } else {
        arrayOfUsers[userIndex].queries += 1;
        return arrayOfUsers[userIndex].queries;
    }
    // TODO: We need to process this and save in a database or logs,
    // and before everything, we need to check the queries of users at the start of the bot

}

client.on(Events.MessageCreate, async (message) => {
    const botIdMention = '@1248874590416011264'
    const arrayOfResponses = [];
    
    await processAnyMessage(message);

    try {
        // Commands:
        if (message.content.startsWith('!')) {
            const messageCommand = message.content.slice(1);
            console.log('messageCommand: ', messageCommand)
            const commandSplitted = messageCommand.split(' ');

            // console.log(' username ', commandSplitted[1], 'type of data>', typeof commandSplitted[1]);

            if (commandSplitted[0] === 'image') {
                message.channel.send(`<@${message.author.id}>: Sorry, this option is not available at the moment. Try again soon.`);
                return;

            } else if (commandSplitted[0] === 'query') {
                const question = commandSplitted.slice(1).join(' ');

                //We process the user for security reasons
                const queriesOfTheUser = processUserCounter(message.author.id);
                console.log("The user has made: ", queriesOfTheUser, " queries");
                if (queriesOfTheUser >= 10){
                    message.channel.send(`<@${message.author.id}>: Sorry, you have reached the limit of queries for now. Try again in 4 hours.`);
                    return;
                }

                const answer = await queryOpenAI(question);
                const finalResponse = answer.choices[0].message.content
                if (finalResponse.length >= 1950){
                    splitMessage(finalResponse, arrayOfResponses);
                    console.log('arrayOfResponses.length', arrayOfResponses.length);
                    console.log('arrayOfResponses', arrayOfResponses);
                    for (let i = 0; i < arrayOfResponses.length; i++){
                        console.log('Sending message', i+1);
                        message.channel.send(`<@${message.author.id}> ${i+1}/${arrayOfResponses.length}: ${arrayOfResponses[i]}`);
                    }
                // message.reply(answer);
                // message.channel.send({ embeds: [embed] });
                return;
                }
                message.channel.send(`<@${message.author.id}>: ${finalResponse}`);

            } else if (commandSplitted[0] === 'show') {
                message.channel.send(`<@${message.author.id}>: Sorry, to use this, you need to be root.`);
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
            else if (commandSplitted[0] === 'logs' && (commandSplitted[1] === 'enable' || commandSplitted[1] === 'disable')) {
                if (!(adminIds.includes(message.author.id))){
                message.channel.send(`<@${message.author.id}>: Sorry, to use this, you need to be root.`);
                return;
                }
                
                let changeTo = commandSplitted[1] === 'enable' ? true : false;

                try{
                let newLogStatus = await modifyLogs(message, changeTo=changeTo);


                if (newLogStatus === null) {
                    return
                };

                if (newLogStatus){
                    message.channel.send(`<@${message.author.id}>: The logs are now globally enabled.`);
                } else {
                    message.channel.send(`<@${message.author.id}>: The logs are now globally disabled.`);
                }
            } catch (error) {
                console.error('Error modifying the logs:', error);
                message.channel.send(`There was an error modifying the logs. Please try again later.`);
            }
            }
            else if (commandSplitted[0] === 'sudo' && commandSplitted[1] ==='man') {
                message.channel.send(`<@${message.author.id}>!`);
                const embed = new EmbedBuilder()
                    .setTitle('WittgensteinBOT Manual')
                    .setDescription(`\n- !query <question>: Ask me a question, i respond using AI.\n
                    - !image <@user>: Show the image of the mentioned user (unavailable).\n
                    - !<@WittgensteinBOT> + attached image: I process the image using AI image analysis.\n
                    - !show <prompt>: Generate an image based on the prompt (unavailable).\n`)
                    .setFooter({
                        text: `Requested by ${message.author.tag} \n Latency: ${client.ws.ping}ms`,
                        iconURL: `${message.author.displayAvatarURL()}`,
                    })
                    .setTimestamp();
                message.channel.send({ embeds: [embed] });
                return
            }
            else if (commandSplitted[0] === 'logs') {
                if (!commandSplitted[1]) {
                    try{

                        let {global_logs} = await getFromConfig('global_logs');
                        global_logs = global_logs ? 'enabled' : 'disabled';

                        if (global_logs === null) {
                            return
                        };

                        message.channel.send(`<@${message.author.id}> You need to specify the username of the user you want to see the logs. Try !logs <username>\
                            \nLog status: ${global_logs} If you want to enable or disable the logs globally, try !logs enable or !logs disable.`);
        

        
                    } catch (error) {
                        console.error('Error modifying the logs:', error);
                        message.channel.send(`There was an error modifying the logs. Please try again later.`);
                    }
                    return;
                }


                (async () => {
                    const logFile = await retrieveUserLogs(message, commandSplitted[1]);
                
                    if (!logFile) {
                      message.channel.send(`<@${message.author.id}> Sorry, there was an error retrieving the logs.`);
                      return;
                    }
                
                    // Envía el archivo al canal de Discord
                    message.channel.send(`Here is the log file for ${commandSplitted[1]}`);
                    message.channel.send({ files: [logFile] });
                  })();
            }
        }

        // Message logging
        if (!message.content.includes(botIdMention)) {
            console.log(`\n${message.author.username}: '{${message.content}}'
                In the channel: ${message.channel.name}, At ${message.createdAt}\n`);
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
                    const imageUrl = attachment.url;
        
                    try {
                        const analysisResult = await queryOpenAIForImage(imageUrl, question);
                        const queriesOfTheUser = processUserCounter(message.author.id);
                        console.log("The user has made: ", queriesOfTheUser, " queries");
                        message.channel.send(`<@${message.author.id}>: ${analysisResult}`);
                    } catch (error) {
                        console.error('Error analyzing the image:', error);
                        message.channel.send(`There was an error analyzing the image. Please try again later.`);
                    }
                }

            }
        }
    } catch (e) {
        console.error(`error: ${e}`);
    }
     
});

// Welcome message
client.on(Events.GuildMemberAdd, async (member) => {
    const channel = await client.channels.fetch(channelIdGeneral);
    channel.send(`Welcome to the server, <@${member.user.id}>!\n
        I'm an AI powered BOT, You can ask me anything you want, I'm here to help you.
        Send me images, code, text, or anything you want to know and I will try to help you.
        To see the list of commands, type:\n!sudo man`);
});

// TODO: Remove the token before pushing to GitHub
const token = process.env.API_KEY;
client.login(token);
