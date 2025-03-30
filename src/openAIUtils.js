const axios = require('axios');
const OpenAI = require('openai');

// Initialize OpenAI client
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable not set');
    process.exit(1);
  }

  return new OpenAI({ apiKey });
}

// Use the OpenAI client for summarization
async function summarizeFileContentWithOpenAI(fileContents) {
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Summarize the following content in a few words: ${fileContents.substring(0, 4000)}` }],
      max_tokens: 100,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error using OpenAI for summarization:', error.message);
    return 'Untitled';
  }
}

// Legacy method using axios directly (kept for backward compatibility)
async function summarizeFileContentWithOpenAILegacy(fileContents) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable not set');
    return 'Untitled';
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `Summarize the following content in a few words: ${fileContents.substring(0, 4000)}` }],
        max_tokens: 100,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error using OpenAI API directly:', error.message);
    return 'Untitled';
  }
}

module.exports = { summarizeFileContentWithOpenAI, getOpenAIClient };
