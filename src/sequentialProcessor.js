const fs = require('fs');
const path = require('path');
const glob = require('glob');
const matter = require('gray-matter');
const { extractDatesFromFileContents } = require('./dateUtils');
const { generateTagsForContent } = require('./tagGeneratorUtils');
const { loadGlossary, saveGlossary } = require('./tagGeneratorUtils');
const { getOpenAIClient } = require('./openAIUtils');
const { cleanUpFileName, generateNewFileName } = require('./dateUtils');

// Main function to process files sequentially
async function processFilesSequentially(directoryPath, tagsFilePath) {
  console.log(`Starting sequential processing of files in ${directoryPath}`);
  
  // Ensure we have the OpenAI client
  const openai = getOpenAIClient();
  
  // Load the glossary
  const glossary = loadGlossary(tagsFilePath);
  console.log(`Loaded ${glossary.length} tags from glossary`);
  
  // Find all markdown files in the directory
  const mdFiles = glob.sync(path.join(directoryPath, '**/*.md'));
  console.log(`Found ${mdFiles.length} markdown files to process`);
  
  // Process each file sequentially
  for (const filePath of mdFiles) {
    console.log(`\nProcessing file: ${filePath}`);
    
    // Step 1: Standardize the file name and add basic frontmatter
    console.log(`Step 1: Standardizing file name for ${path.basename(filePath)}`);
    const newFilePath = standardizeFileName(filePath);
    
    // The path to use for subsequent operations
    const currentPath = newFilePath || filePath;
    
    // Step 2: Generate and add AI tags
    console.log(`Step 2: Generating AI tags for ${path.basename(currentPath)}`);
    const fileContent = fs.readFileSync(currentPath, 'utf-8');
    const generatedTags = await generateTagsForContent(fileContent, glossary, openai);
    
    // Check if we have new tags to add to the glossary
    if (generatedTags.length > 0) {
      const tagsToAdd = generatedTags.filter(tag => !glossary.includes(tag));
      if (tagsToAdd.length > 0) {
        console.log(`Adding new tags to glossary: ${tagsToAdd.join(', ')}`);
        glossary.push(...tagsToAdd);
        saveGlossary(tagsFilePath, glossary);
      }
      
      // Update the file with new tags
      await updateFileWithAITags(currentPath, generatedTags);
    }
    
    // Step 3: Clean up tag formatting
    console.log(`Step 3: Cleaning up tag formatting for ${path.basename(currentPath)}`);
    cleanupTagFormatting(currentPath);
  }
  
  console.log('\nAll files have been processed sequentially through all steps.');
}

// Function to standardize a single file name and add basic frontmatter
function standardizeFileName(filePath) {
  try {
    const dir = path.dirname(filePath);
    const file = path.basename(filePath);
    
    // Only process markdown files
    if (path.extname(file) !== '.md') {
      return filePath;
    }
    
    // Generate new file name based on your existing logic
    const newFileName = generateNewFileName(filePath, file);
    const newFilePath = path.join(dir, newFileName);
    
    // Rename the file if the name changed
    if (filePath !== newFilePath && newFileName !== file) {
      fs.renameSync(filePath, newFilePath);
      console.log(`Renamed: ${filePath} -> ${newFilePath}`);
    }
    
    // Add or update frontmatter
    addBasicFrontmatter(newFilePath);
    
    return newFilePath;
  } catch (error) {
    console.error(`Error standardizing file name: ${error.message}`);
    return filePath; // Return original path if an error occurs
  }
}

// Function to add basic frontmatter to a file
function addBasicFrontmatter(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { creationDate, lastModifiedDate } = extractDatesFromFileContents(filePath);
    const fileName = path.basename(filePath);
    
    // Get the content without any existing frontmatter
    let mainContent = fileContent;
    if (fileContent.startsWith('---')) {
      const endOfFrontmatter = fileContent.indexOf('---', 3);
      if (endOfFrontmatter !== -1) {
        mainContent = fileContent.slice(endOfFrontmatter + 4).trim();
      }
    }
    
    // Construct new frontmatter
    const frontmatter = `---\ntitle: ${fileName.replace(/\.[^/.]+$/, "")}\ntags: \nFile Creation Date: ${creationDate || 'N/A'}\nLast Modified: ${lastModifiedDate || 'N/A'}\n---\n\n`;
    
    // Combine frontmatter with content
    const newContent = frontmatter + mainContent;
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Added/Updated basic frontmatter in: ${filePath}`);
    
    return true;
  } catch (error) {
    console.error(`Error adding basic frontmatter: ${error.message}`);
    return false;
  }
}

// Function to update a file with AI-generated tags
async function updateFileWithAITags(filePath, tags) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Only process files with frontmatter
    if (!fileContent.startsWith('---')) {
      console.log(`No frontmatter found in ${path.basename(filePath)}, skipping tag update.`);
      return false;
    }
    
    // Find the end of frontmatter
    const endOfFrontmatter = fileContent.indexOf('---', 3);
    if (endOfFrontmatter === -1) {
      console.log(`Invalid frontmatter in ${path.basename(filePath)}, skipping.`);
      return false;
    }
    
    // Extract existing frontmatter and content
    const frontmatter = fileContent.slice(0, endOfFrontmatter);
    const mainContent = fileContent.slice(endOfFrontmatter + 4).trim();
    
    // Parse existing frontmatter lines
    const frontmatterLines = frontmatter.split('\n').filter(line => line !== '---');
    const frontmatterData = {};
    
    frontmatterLines.forEach(line => {
      const [key, ...values] = line.split(':').map(part => part.trim());
      if (key && values.length > 0) {
        frontmatterData[key] = values.join(':').trim();
      }
    });
    
    // Get existing tags and merge with new ones
    const existingTags = frontmatterData.tags ? 
      frontmatterData.tags.split(' ').filter(tag => tag.length > 0) : [];
    const mergedTags = Array.from(new Set([...existingTags, ...tags]));
    
    // Construct new frontmatter
    let newFrontmatter = '---\n';
    newFrontmatter += 'tags:\n';  // Start the tags list
    mergedTags.forEach(tag => {
      newFrontmatter += `  - ${tag}\n`;  // Add each tag as a list item
    });
    
    // Add other frontmatter fields
    for (const [key, value] of Object.entries(frontmatterData)) {
      if (key !== 'tags') {
        newFrontmatter += `${key}: ${value}\n`;
      }
    }
    newFrontmatter += '---\n\n';
    
    // Write the updated file
    const updatedContent = newFrontmatter + mainContent;
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    console.log(`Added AI tags to ${path.basename(filePath)}: ${tags.join(', ')}`);
    
    return true;
  } catch (error) {
    console.error(`Error updating file with AI tags: ${error.message}`);
    return false;
  }
}

// Function to clean up tag formatting
function cleanupTagFormatting(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Only process files with frontmatter
    if (!fileContent.startsWith('---')) {
      console.log(`No frontmatter found in ${path.basename(filePath)}, skipping cleanup.`);
      return false;
    }
    
    // Find the end of frontmatter
    const endOfFrontmatter = fileContent.indexOf('---', 3);
    if (endOfFrontmatter === -1) {
      console.log(`Invalid frontmatter in ${path.basename(filePath)}, skipping.`);
      return false;
    }
    
    // Extract frontmatter and content
    const frontmatter = fileContent.slice(0, endOfFrontmatter);
    const mainContent = fileContent.slice(endOfFrontmatter + 4).trim();
    
    // Parse existing frontmatter lines
    const frontmatterLines = frontmatter.split('\n').filter(line => line !== '---');
    const frontmatterData = {};
    
    frontmatterLines.forEach(line => {
      const [key, ...values] = line.split(':').map(part => part.trim());
      if (key && values.length > 0) {
        frontmatterData[key] = values.join(':').trim();
      }
    });
    
    // Clean up tags if they exist
    if (frontmatterData.tags) {
      const cleanedTags = frontmatterData.tags
        .replace(/>-\s*/g, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Construct new frontmatter
      let newFrontmatter = '---\n';
      newFrontmatter += `tags: ${cleanedTags}\n`;  // Put tags first
      
      // Add other frontmatter fields
      for (const [key, value] of Object.entries(frontmatterData)) {
        if (key !== 'tags') {
          newFrontmatter += `${key}: ${value}\n`;
        }
      }
      newFrontmatter += '---\n\n';
      
      // Write the updated file
      const updatedContent = newFrontmatter + mainContent;
      fs.writeFileSync(filePath, updatedContent, 'utf-8');
      console.log(`Cleaned up tag formatting for ${path.basename(filePath)}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error cleaning up tag formatting: ${error.message}`);
    return false;
  }
}

// Command-line argument handling
const folderName = process.argv[2];
if (!folderName) {
  console.error('Please provide a folder name as an argument.');
  process.exit(1);
}

// Set vault path
const vaultPath = process.env.VAULT_PATH || '/Users/samsena/Library/CloudStorage/GoogleDrive-samsena@gmail.com/My Drive/repos/Obsidian File Organizer';
const targetPath = path.join(vaultPath, folderName);
const tagsFilePath = path.join(vaultPath, 'folder tags', 'tags.json');

// Check if the OpenAI API key is set
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable not set');
  console.error('Please set your OpenAI API key: export OPENAI_API_KEY=your_api_key');
  process.exit(1);
}

// Start the sequential processing
processFilesSequentially(targetPath, tagsFilePath)
  .then(() => console.log('Sequential processing completed successfully.'))
  .catch(error => console.error('Error during sequential processing:', error));
