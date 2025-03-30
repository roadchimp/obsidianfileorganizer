const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Function to clean up the tags in the frontmatter
function cleanUpTagsInMarkdownFiles(directoryPath) {
  // Find all markdown files in the specified directory
  const mdFiles = glob.sync(path.join(directoryPath, '**/*.md'));
  console.log(`Found ${mdFiles.length} markdown files in ${directoryPath}`);

  // Process each markdown file
  for (const filePath of mdFiles) {
    console.log(`Processing: ${filePath}`);
    
    // Read file content
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    // Replace the problematic tags section with a correctly formatted one
    // This regex looks for the tags section in the frontmatter and captures the tags content
    const updatedContent = fileContent.replace(
      /tags:\s*>-\s*\n([\s\S]*?)(?=\n\w|---)/g, 
      (match, tagsContent) => {
        // Clean up the tags content
        const cleanedTags = tagsContent
          .replace(/\n/g, ' ')  // Replace newlines with spaces
          .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
          .trim();              // Trim whitespace
        
        // Return the cleaned tags as a single line
        return `tags: ${cleanedTags}\n`;
      }
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    console.log(`Updated tags in ${filePath}`);
  }

  console.log('Cleanup complete.');
}

// Get the folder name from command-line arguments
const folderName = process.argv[2]; // The folder name should be passed as the first argument
if (!folderName) {
  console.error('Please provide a folder name as an argument.');
  process.exit(1);
}

// Specify the directory you want to clean up
const directoryPath = path.join(__dirname, '..', folderName); // Use '..' to go to the parent directory
cleanUpTagsInMarkdownFiles(directoryPath);
