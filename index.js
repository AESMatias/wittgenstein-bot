require('dotenv').config();
const {Client, Events, EmbedBuilder} = require('discord.js');
const channelIdGeneral = '1198741772029923348';


const client = new Client({
    intents: 3276799
});

client.on(Events.ClientReady, async () => {
    console.log(`Bot is ready: ${client.user.username}`);
});

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
            if (commandSplitted[0] === 'image')
                createImage(message);
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
            // console.log(message.content);
            const args = message.content.split(' ');

            if (message.content.includes('help')) {
                const embed = new EmbedBuilder()
                    .setTitle('WittgensteinBOT')
                    // .addField('Commands', 'Command 1')
                    // .addField('Another Field', 'Command 2')
                    // .addField('Yet Another Field', 'Command 3')
                    // .setColor('#00ff00')
                    .setFooter({
                        text: `Requested by ${interaction.user.tag}`,
                        iconURL: `${interaction.user.displayAvatarURL()}`,
                      })
                    setDescription(`Latency : ${client.ws.ping}ms`)
                    .setTimestamp();
                message.channel.send({ embeds: [embed] });
            }

            if (args.length === 0) {
                message.channel.send("Hello! I am WittgensteinBOT, but i'm currently useless.");
            }
            else {
                const question = args.slice(1).join(' ');
                message.channel.send(`Hi <@${message.author.id}>, You asked: ${question}`);
            }
        }
    }
    catch (e) {
        console.error(`error: ${e}`);
    }

});

// Welcome message
client.on(Events.GuildMemberAdd, async (member) => {
    const channel = await client.channels.fetch(channelIdGeneral);
    //send message to channel
    channel.send(`Welcome to the server, <@${member.user.id}>!`);
});


//TODO: Remove the token before pushing to github
const token = process.env.API_KEY;
client.login(token);