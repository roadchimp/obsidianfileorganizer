const path = require('path');
const { processDirectory } = require('./fileUtils');
const { processDirectoryWithAITags } = require('./tagGeneratorUtils');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Function to execute the tag formatting cleanup script
async function runTagCleanup(folderName) {
  console.log(`Running tag cleanup for ${folderName}...`);
  try {
    await execAsync(`node ${path.join(__dirname, 'removeTagsFormatting.js')} "${folderName}"`);
    console.log('Tag cleanup completed successfully.');
  } catch (error) {
    console.error('Error during tag cleanup:', error.message);
  }
}

// Main function to process folder with all operations
async function processFolder(folderName) {
  // Validate folder name
  if (!folderName) {
    console.error('Please provide a folder name as an argument.');
    process.exit(1);
  }

  // Set vault path
  const vaultPath = process.env.VAULT_PATH || '/Users/samsena/Library/CloudStorage/GoogleDrive-samsena@gmail.com/My Drive/repos/Obsidian File Organizer';
  const targetPath = path.join(vaultPath, folderName);

  // Step 1: Process files (rename and add frontmatter)
  console.log(`\nStep 1: Processing files in ${folderName} - renaming and adding frontmatter...`);
  processDirectory(targetPath);
  console.log('Step 1 completed.');

  // Step 2: Run AI tagging
  console.log(`\nStep 2: Running AI tagging on ${folderName}...`);
  try {
    await processDirectoryWithAITags(targetPath, path.join(vaultPath, 'folder tags', 'tags.json'));
    console.log('Step 2 completed.');
  } catch (error) {
    console.error('Error during AI tagging:', error.message);
  }

  // Step 3: Clean up tag formatting
  console.log(`\nStep 3: Cleaning up tag formatting in ${folderName}...`);
  await runTagCleanup(folderName);
  console.log('Step 3 completed.');

  console.log('\nAll processing steps completed successfully!');
}

// Get the folder name from command-line arguments
const folderName = process.argv[2];
processFolder(folderName);
