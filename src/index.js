const path = require('path');
const fs = require('fs');
const { processDirectory } = require('./fileUtils');

const folderName = process.argv[2]; // The folder name should be passed as the first argument
const vaultPath = '/Users/samsena/Library/CloudStorage/GoogleDrive-samsena@gmail.com/My Drive/repos/Obsidian File Organizer';
const targetPath = path.join(vaultPath, folderName); // Targeting the specified subfolder

// Check if the target directory exists
if (!fs.existsSync(targetPath) || !fs.lstatSync(targetPath).isDirectory()) {
    console.error(`Error: The directory "${targetPath}" does not exist.`);
    process.exit(1);
}

// Start processing the specified directory
processDirectory(targetPath);
