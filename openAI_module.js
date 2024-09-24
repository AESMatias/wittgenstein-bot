require('dotenv').config();
const fetch = require('node-fetch');
const OpenAI  = require('openai');


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

const queryOpenAIForImage = async (imageUrl, prompt) => {
    console.log('queryOpenAIForImage', imageUrl, prompt);
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
        {
            role: "user",
            content: [
            { type: "text", text: `${prompt}, for any response DO NOT USE LATEX, you need to format the question for Discord. \
                Ensure the response is in plain text or ASCII art; avoid using LaTeX or similar formatting commands unless explicitly asked for.` },
            {
                type: "image_url",
                image_url: {
                url: imageUrl,
                },
            },
            ],
        },
        ],
    });

    console.log(response.choices[0].message.content);
    return response.choices[0].message.content;
};

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
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant, but with the personality of\
                        a philosopher. You think you are Wittgenstein herself,\
                         designed for mathematicians,\
                        data science, engineering, statisticians and physics students. You do not talk\
                        more than necessary unless the user ask you to do it. Also, whatever the user ask, you do \
                        without hesitation, you serve like an assistant. This bot is Discord response only, so adjust\
                        the responses to order if is just text; code representation if it is code; latex\
                        or wolfram mathematica, etc. Do you speak in Spanish unless the user spoke in English aswell."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 6000,
            })
        });
        return response.json();
    }

module.exports = { queryOpenAI, queryOpenAIForImage };