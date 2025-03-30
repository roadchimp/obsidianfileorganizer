const path = require('path');
const fs = require('fs');
const { processDirectoryWithAITags } = require('./tagGeneratorUtils');

// Get the folder name from command-line arguments
const folderName = process.argv[2];

// Set paths
const vaultPath = process.env.VAULT_PATH || '/Users/samsena/Library/CloudStorage/GoogleDrive-samsena@gmail.com/My Drive/repos/Obsidian File Organizer';
const targetPath = folderName ? path.join(vaultPath, folderName) : vaultPath;
const tagsFilePath = path.join(vaultPath, 'folder tags', 'tags.json');

// Validate OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable not set');
  console.error('Please set your OpenAI API key: export OPENAI_API_KEY=your_api_key');
  process.exit(1);
}

// Check if the target directory exists
if (!fs.existsSync(targetPath) || !fs.lstatSync(targetPath).isDirectory()) {
  console.error(`Error: The directory "${targetPath}" does not exist.`);
  process.exit(1);
}

// Check if the tags file exists
if (!fs.existsSync(tagsFilePath)) {
  console.error(`Warning: Tags file "${tagsFilePath}" does not exist. Creating a new one.`);
  fs.writeFileSync(tagsFilePath, JSON.stringify([], null, 2), 'utf-8');
}

// Start processing the directory with AI tagging
console.log(`Starting AI tag generation for directory: ${targetPath}`);
console.log(`Using tags glossary from: ${tagsFilePath}`);

processDirectoryWithAITags(targetPath, tagsFilePath)
  .then(() => {
    console.log('AI tag generation completed successfully!');
  })
  .catch(error => {
    console.error('Error during AI tag generation:', error);
  }); 