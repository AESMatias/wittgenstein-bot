const {EmbedBuilder} = require('discord.js');
const {Client, Events} = require('discord.js');

module.exports = {

    description: 'Show an image from a user',

    run: async (message) => {

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
}

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
