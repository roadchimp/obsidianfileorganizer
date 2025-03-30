const fs = require('fs');
const path = require('path');
const { summarizeFileContentWithOpenAI } = require('./openAIUtils');

// Function to summarize file content and generate a title
function summarizeFileContent(filePath) {
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const sentences = fileContents.split('.').filter(sentence => sentence.trim() !== '');
    
    // Generate a simple summary (first sentence or a few words)
    const summary = sentences.length > 0 ? sentences[0].trim() : '';
    const titleWords = summary.split(' ').slice(0, 5).join(' '); // Take the first 3-5 words for the title
    return titleWords;
}

// Function to generate a single-word summary tag based on the content
async function generateSingleWordTag(filePath) {
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const summary = await summarizeFileContentWithOpenAI(fileContents);
    const words = summary.split(' ');
    return words.length > 0 ? words[0] : 'Untitled'; // Use the first word as the tag or 'Untitled' if empty
}

// Function to read standardized tags from the tags file
function readStandardTags(tagsFilePath) {
    if (!fs.existsSync(tagsFilePath)) return [];
    const content = fs.readFileSync(tagsFilePath, 'utf-8');
    return content.split('\n').map(tag => tag.trim()).filter(tag => tag);
}

// Function to summarize file content and generate multiple tags
async function generateTags(filePath, tagsFilePath, rootFolderName) {
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const summary = await summarizeFileContentWithOpenAI(fileContents); // Use OpenAI for summarization
    const words = summary.split(' ').slice(0, 5); // Get the first 5 words for potential tags

    // Read standardized tags
    const standardTags = readStandardTags(tagsFilePath);
    const tags = [];

    // Generate tags based on summary and standard tags
    for (const word of words) {
        if (tags.length < 5) {
            const standardizedTag = standardTags.find(tag => tag.toLowerCase() === word.toLowerCase());
            tags.push(standardizedTag || word); // Use standardized tag if available, otherwise use the word
        }
    }

    // Include the root folder name as one of the tags
    if (!tags.includes(rootFolderName)) {
        tags.push(rootFolderName);
    }

    return tags.slice(0, 5); // Return only the first 5 tags
}

module.exports = { summarizeFileContent, generateSingleWordTag, generateTags };
