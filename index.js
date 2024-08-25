require('dotenv').config();
const { Client, Events, EmbedBuilder } = require('discord.js');
const axios = require('axios');  // TODO: I think i should use fetch instead of axios xd
const channelIdGeneral = '1198741772029923348';
const fetch = require('node-fetch');
// const { OpenAI } = require('openai');

// const openai = new OpenAI();

const client = new Client({
    intents: 3276799
});

client.on(Events.ClientReady, async () => {
    console.log(`Bot is ready: ${client.user.username}`);
});


const queryOpenAI = async (prompt) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const url = 'https://api.openai.com/v1/chat/completions';


        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant, but with the personality of\
                        a philosopher. You think you are Wittgenstein herself,\
                         designed for mathematicians,\
                        and data science, engineering, and physics students. You do not talk\
                        more than necessary."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 4000
            })
        });
        return response.json();
    }



const generateImage = async (prompt) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const url = 'https://api.openai.com/v1/images/generations';

    try {
        const response = await axios.post(url, {
            prompt: prompt,
            n: 1,
            size: "1024x1024"
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.data[0].url;
    } catch (error) {
        console.error('Error generating image:', error);
        return 'Sorry, there was an error generating the image.';
    }
};

const createImage = async (message) => {
    const target = message.mentions.users.first();
    const memberId = await message.guild.members.fetch(target.id);

    if (!target) {
        message.reply('Please mention someone to show their image');
        return;
    }

    if (!memberId) {
        message.reply('Sorry, the user was not found');
        return;
    }

    const image = memberId.user.displayAvatarURL({ dynamic: true, size: 512 });
    
    const embed = new EmbedBuilder()
        .setTitle(`${target.username}'s Avatar`)
        .setImage(image)
        .setColor('#00ff00')
        .setFooter('WittgensteinBOT')
        .setTimestamp();
    message.reply({ embeds: [embed] });
}

client.on(Events.MessageCreate, async (message) => {
    const botIdMention = '@1248874590416011264'

    try {
        // Commands:
        if (message.content.startsWith('!')) {
            const messageCommand = message.content.slice(1).toLowerCase();
            console.log('messageCommand: ', messageCommand)
            const commandSplitted = messageCommand.split(' ');

            if (commandSplitted[0] === 'image') {
                createImage(message);

            } else if (commandSplitted[0] === 'query') {
                const question = commandSplitted.slice(1).join(' ');
                const answer = await queryOpenAI(question);
                console.log('answerRRR', answer.choices[0].message.content);
                const finalResponse = answer.choices[0].message.content
                // message.reply(answer);
                // message.channel.send({ embeds: [embed] });
                message.channel.send(`<@${message.author.id}> ${finalResponse}`);

            } else if (commandSplitted[0] === 'show') {
                const prompt = commandSplitted.slice(1).join(' ');
                const imageUrl = await generateImage(prompt);
                console.log('generated image URL', imageUrl);
                const embed = new EmbedBuilder()
                    .setTitle('Generated Image')
                    .setImage(imageUrl)
                    .setColor('#00ff00')
                    .setFooter({
                        text: `Requested by ${message.author.tag}`,
                        iconURL: `${message.author.displayAvatarURL()}`,
                    })
                    .setDescription(`Latency : ${client.ws.ping}ms`)
                    .setTimestamp();
                // message.reply({ embeds: [embed] });
                message.channel.send({ embeds: [embed] });
            }



        }

        // Message logging
        if (!message.content.includes(botIdMention)) {
            console.log(`${message.author.username}: ${message.content},\t
                In the channel: ${message.channel.name},\t
                At ${message.createdAt}`)
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
                message.channel.send(`Hi <@${message.author.id}>, You asked: ${question}`);
            }
        }
    } catch (e) {
        console.error(`error: ${e}`);
    }
});

// Welcome message
client.on(Events.GuildMemberAdd, async (member) => {
    const channel = await client.channels.fetch(channelIdGeneral);
    channel.send(`Welcome to the server, <@${member.user.id}>!`);
});

// TODO: Remove the token before pushing to GitHub
const token = process.env.API_KEY;
client.login(token);
