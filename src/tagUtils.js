const fs = require('fs');

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
function generateSingleWordTag(filePath) {
    const summary = summarizeFileContent(filePath);
    const words = summary.split(' ');
    return words.length > 0 ? words[0] : 'Untitled'; // Use the first word as the tag or 'Untitled' if empty
}

module.exports = { summarizeFileContent, generateSingleWordTag };
