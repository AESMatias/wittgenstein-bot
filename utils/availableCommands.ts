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
        name: 'query_latex',
        description: 'I will solve the problem using AI, que response will be a image using LaTeX.',
        usage: '/query_latex <question>',
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
    }
];