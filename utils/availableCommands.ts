import { description } from "../showImage";

const { ApplicationCommandOptionType } = require('discord.js');

export const availableCommands = [
    {
        name: 'logs',
        description: 'Show the logs status and info.',
        usage: '/logs'
    },
    {
        name: 'logs_user',
        description: 'Show the logs of the user.',
        usage: '/logs <username>',
        options: [
            {
                name: 'username',
                description: 'The username of the user to show the logs',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: 'logs_enable',
        description: 'Enable the logs globally.',
        usage: '/logs enable'
    },
    {
        name: 'logs_disable',
        description: 'Disable the logs globally.',
        usage: '/logs disable'
    },
    {
        name: 'sudo_man',
        description: 'Show the manual of the bot.',
        usage: '/sudo man'
    },
    {
        name: 'query',
        description: 'Ask me a question, I respond using AI.',
        usage: '/query <question>',
        options: [
            {
                name: 'query_input',
                description: 'The query input to process',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    {
        name: 'new_cool_command',
        description: 'this is a new cool command',
        usage: '/new_command'
    }
];