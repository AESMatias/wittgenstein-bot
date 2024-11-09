require('dotenv').config();
const OpenAI  = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

const queryOpenAIForImage = async (imageUrl, prompt) => {

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
        {
            role: "user",
            content: [
            {
                type: "image_url",
                image_url: {
                url: imageUrl,
                },
            },
            { 
            type: "text", 
            // text: `${prompt}, It is very much important you use LaTeX for any math question, \
            //             generate the response in TeX format but compatible with mathjax-node.\
            //             You are a helpful assistant, but with the personality of\
            //             a philosopher. You think you are Wittgenstein herself, designed for mathematicians,\
            //             data science, engineering, statisticians and physics students.\
            //             Do you speak in Spanish unless the user spoke in Spanish aswell.\
            //             If the question is not about math, format the response for Discord.`
            // },
            text: `Please respond in LaTeX format, ensuring compatibility with mathjax-node.
            Avoid delimiters like \\[ ... \\] and instead use \\( ... \\) for inline math or \\begin{equation} ... \\end{equation} 
            only when necessary for centered equations. This will prevent parsing errors.

            Explanation of Adjustments:
            - **Adjusted Delimiters**: Use delimiters \\( ... \\) for inline math instead of \\begin{equation} ... \\end{equation} for centered expressions, as this should avoid nesting errors.
            - **Structural Integrity**: This adjustment is intended to ensure that MathJax interprets each equation correctly without overlapping \\begin{equation} structures, which could cause errors.

            Please implement the following replacements before processing:

            .replace(/\\\\\\[/g, "\\\\(")
            .replace(/\\\\\\]/g, "\\\\)")
            .replace(/\\\\\\(/g, "\\\\(")
            .replace(/\\\\\\)/g, "\\\\)")

            As an assistant, adopt a clear and precise tone, inspired by Wittgenstein's clarity, and geared towards an audience of students and professionals in mathematics, data science, engineering, and physics.

            The user speaks Spanish, so respond in Spanish unless specified otherwise.
            If the question is not math-related, format the response for Discord.`

   },
            ],
        },
        ],
        max_tokens: 2000,
    });

    console.log(response.choices[0].message.content);
    return response.choices[0].message.content;
};

const queryOpenAI = async (prompt, messages) => {
    const apiKey = process.env.OPENAI_API_KEY;
    const modelName = "gpt-4o-mini";
    const client = new OpenAI({apiKey});
    let response = '';

        if (!messages) {
            messages = [
                {
                    role: "user",
                    content: prompt
                }
            ]
        }

        else{
            //If the user is premium, then the last four messages are saved so he can have a better context
            const lastFourMessages = [];
            //If the messages are more than 4, then the last four messages are saved
            if (messages.length > 4){
                messages = messages.slice(messages.length-4, messages.length);
            }

            for (let i=0; i<messages.length; i++){


                const actualQuery = messages[i].query;
                const actualResponse = messages[i].response;

                lastFourMessages.push({
                    role: "user",
                    content: actualQuery
                });

                lastFourMessages.push({
                    role: "assistant",
                    content: actualResponse
                });
            }

            messages = [
                {
                    role: "user",
                    content: prompt
                },
                ...lastFourMessages
            ]

        }
    
            response = await client.chat.completions.create({
            messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant, but with the personality of\
                        a philosopher. You think you are Wittgenstein herself, designed for mathematicians,\
                        data science, engineering, statisticians and physics students. You do not talk\
                        more than necessary unless the user ask you to do it. Also, whatever the user ask, you do \
                        without hesitation, you serve like an assistant.\
                        Do you speak in Spanish unless the user spoke in Spanish aswell.\
                        It is very much important you use TeX for any math question.\
                        For any math question, you generate the response in TeX format.\
                        If the question is not about math, format the response for Discord."
                    },
                    ...messages
            ],
            model: modelName,
            max_tokens: 2000
        });

        return response;
    }

module.exports = { queryOpenAI, queryOpenAIForImage };