const axios = require('axios');

const OPENAI_API_KEY = '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'; // Replace with your OpenAI API key

async function summarizeFileContentWithOpenAI(fileContents) {
    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-3.5-turbo', // or another model of your choice
            messages: [{ role: 'user', content: `Summarize the following content: ${fileContents}` }],
            max_tokens: 100, // Adjust based on your needs
        },
        {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );

    return response.data.choices[0].message.content.trim(); // Return the summary
}

module.exports = { summarizeFileContentWithOpenAI };
