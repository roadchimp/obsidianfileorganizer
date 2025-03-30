const fs = require('fs');
const path = require('path');
const { summarizeFileContentWithOpenAI } = require('./openAIUtils');
const { loadGlossary } = require('./tagGeneratorUtils');

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
    
    try {
        // Try to read as JSON first (new format)
        const content = fs.readFileSync(tagsFilePath, 'utf-8');
        const tags = JSON.parse(content);
        return Array.isArray(tags) ? tags : [];
    } catch (error) {
        // Fall back to old format (newline-separated)
        const content = fs.readFileSync(tagsFilePath, 'utf-8');
        return content.split('\n').map(tag => tag.trim()).filter(tag => tag);
    }
}

// Function to summarize file content and generate multiple tags
async function generateTags(filePath, tagsFilePath, rootFolderName) {
    // Read standardized tags
    const standardTags = readStandardTags(tagsFilePath);
    
    // If we have a way to get to the AI-generated tags, use that
    if (tagsFilePath && path.extname(tagsFilePath) === '.json') {
        const { processDirectoryWithAITags, generateTagsForContent } = require('./tagGeneratorUtils');
        const { getOpenAIClient } = require('./openAIUtils');
        
        try {
            // Load existing glossary
            const glossary = loadGlossary(tagsFilePath);
            
            // Generate AI tags for the specific file
            const fileContents = fs.readFileSync(filePath, 'utf-8');
            const openai = getOpenAIClient();
            const aiTags = await generateTagsForContent(fileContents, glossary, openai);
            
            // Include the root folder name as one of the tags if available
            if (rootFolderName && !aiTags.includes(rootFolderName)) {
                aiTags.push(rootFolderName);
            }
            
            return aiTags.slice(0, 5); // Return only up to 5 tags
        } catch (error) {
            console.error('Error generating AI tags:', error.message);
            // Fall back to the original method if AI tag generation fails
        }
    }
    
    // Original method as fallback
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const summary = await summarizeFileContentWithOpenAI(fileContents);
    const words = summary.split(' ').slice(0, 5); // Get the first 5 words for potential tags
    
    const tags = [];
    
    // Generate tags based on summary and standard tags
    for (const word of words) {
        if (tags.length < 5) {
            const standardizedTag = standardTags.find(tag => tag.toLowerCase() === word.toLowerCase());
            tags.push(standardizedTag || word); // Use standardized tag if available, otherwise use the word
        }
    }

    // Include the root folder name as one of the tags
    if (rootFolderName && !tags.includes(rootFolderName)) {
        tags.push(rootFolderName);
    }

    return tags.slice(0, 5); // Return only the first 5 tags
}

module.exports = { summarizeFileContent, generateSingleWordTag, generateTags, readStandardTags };
