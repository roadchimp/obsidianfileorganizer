const path = require('path');
const fs = require('fs');
const { processDirectory } = require('./fileUtils');
const { processDirectoryWithAITags } = require('./tagGeneratorUtils');
const { determineTagsFilePath } = require('./frontmatterUtils');

// Set default vault path or use environment variable
const vaultPath = process.env.VAULT_PATH || '/Users/samsena/Library/CloudStorage/GoogleDrive-samsena@gmail.com/My Drive/repos/Obsidian File Organizer';

// Parse command line arguments
const args = process.argv.slice(2);
let folderName = null;
let useAITagging = false;

// Check for flags
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ai' || args[i] === '-a') {
        useAITagging = true;
    } else if (!folderName) {
        folderName = args[i];
    }
}

// Set target path based on provided folder name
const targetPath = folderName ? path.join(vaultPath, folderName) : vaultPath;

// Check if the target directory exists
if (!fs.existsSync(targetPath) || !fs.lstatSync(targetPath).isDirectory()) {
    console.error(`Error: The directory "${targetPath}" does not exist.`);
    process.exit(1);
}

// Determine tags file path
const tagsFilePath = determineTagsFilePath(targetPath);

// Display what we're doing
console.log(`Processing directory: ${targetPath}`);
if (useAITagging) {
    console.log('Using AI-assisted tagging');
    if (!process.env.OPENAI_API_KEY) {
        console.error('Error: OPENAI_API_KEY environment variable not set');
        console.error('Please set your OpenAI API key: export OPENAI_API_KEY=your_api_key');
        process.exit(1);
    }
    
    // Start processing with AI tagging
    processDirectoryWithAITags(targetPath, tagsFilePath)
        .then(() => {
            console.log('AI tag generation completed successfully!');
        })
        .catch(error => {
            console.error('Error during AI tag generation:', error);
        });
} else {
    // Standard processing without AI assistance
    console.log('Using standard file processing');
    processDirectory(targetPath);
}
