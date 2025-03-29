// optimizeVault.js
const fs = require('fs');
const path = require('path');

// Get the folder name from command-line arguments
const folderName = process.argv[2]; // The folder name should be passed as the first argument
const vaultPath = '/Users/samsena/Library/CloudStorage/GoogleDrive-samsena@gmail.com/My Drive/repos/Obsidian File Organizer'; // Updated path
const targetPath = path.join(vaultPath, folderName); // Targeting the specified subfolder
const tagsFolderPath = path.join(__dirname, 'folder tags'); // Path for the "folder tags" subfolder

// Check if the target directory exists
if (!fs.existsSync(targetPath) || !fs.lstatSync(targetPath).isDirectory()) {
    console.error(`Error: The directory "${targetPath}" does not exist.`);
    process.exit(1);
}

// Create "folder tags" subfolder if it doesn't exist
if (!fs.existsSync(tagsFolderPath)) {
    fs.mkdirSync(tagsFolderPath);
}

// Function to standardize file naming conventions
function standardizeFileNames(dir) {
    fs.readdirSync(dir).forEach(file => {
        const oldPath = path.join(dir, file);
        if (fs.lstatSync(oldPath).isFile() && path.extname(file) === '.md') { // Only process .md files
            const newFileName = generateNewFileName(oldPath, file);
            const newPath = path.join(dir, newFileName);
            if (oldPath !== newPath) { // Only rename if the new name is different
                fs.renameSync(oldPath, newPath);
                console.log(`Renamed: ${oldPath} -> ${newPath}`);
            }
        }
    });
}

// Function to extract the creation and modification dates from file contents
function extractDatesFromFileContents(filePath) {
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    const createdAtMatch = fileContents.match(/Created at:\s*(\d{4}-\d{2}-\d{2})/);
    const updatedAtMatch = fileContents.match(/Updated at:\s*(\d{4}-\d{2}-\d{2})/);

    const creationDate = createdAtMatch ? createdAtMatch[1] : null; // Return the date found in "Created at"
    const lastModifiedDate = updatedAtMatch ? updatedAtMatch[1] : null; // Return the date found in "Updated at"

    return { creationDate, lastModifiedDate };
}

// Function to convert date formats to YYYY-MM-DD
function convertToStandardDateFormat(dateString) {
    const dateMatch = dateString.match(/(\d{1,2})-(\d{1,2})-(\d{2,4})/);
    if (dateMatch) {
        let year, month, day;
        if (dateMatch[3].length === 2) {
            year = '20' + dateMatch[3]; // Assuming 21st century
        } else {
            year = dateMatch[3];
        }
        month = dateMatch[1].padStart(2, '0'); // Ensure two-digit month
        day = dateMatch[2].padStart(2, '0'); // Ensure two-digit day
        return `${year}-${month}-${day}`; // Return in YYYY-MM-DD format
    }
    return dateString; // Return original if no match
}

// Function to extract date from the original file name
function extractDateFromFileName(file) {
    const dateMatch = file.match(/(\d{4})[ -]?(\d{1,2})[ -]?(\d{1,2})/);
    if (dateMatch) {
        return `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`; // Format: YYYY-MM-DD
    }
    return null; // No valid date found
}

// Function to clean up file names by removing excessive dashes and trimming whitespace
function cleanUpFileName(fileName) {
    // Remove excessive dashes and trim whitespace
    return fileName.replace(/-{2,}/g, '-') // Replace multiple dashes with a single dash
                   .replace(/^\s+|\s+$/g, '') // Trim leading and trailing whitespace
                   .replace(/-+/g, ' ') // Replace dashes with spaces
                   .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
                   .trim(); // Final trim
}

// Function to generate new file names based on conventions
function generateNewFileName(filePath, file) {
    const { creationDate, lastModifiedDate } = extractDatesFromFileContents(filePath); // Get dates from file contents
    const extractedDate = extractDateFromFileName(file); // Extract date from the original file name
    const existingDateMatch = file.match(/^\d{4}-\d{2}-\d{2}/); // Check if the file name already has a date

    // Use the extracted date if available, otherwise use the creation date
    const finalDate = extractedDate || creationDate || lastModifiedDate;

    // If all dates are null, fall back to just the descriptive name
    const descriptiveName = file.replace(/(\d{4})[ -]?(\d{1,2})[ -]?(\d{1,2})/, '').trim(); // Remove the date

    // Construct the new file name
    const newFileName = finalDate ? `${finalDate} ${descriptiveName}` : descriptiveName; // Format: YYYY-MM-DD Title or just Title
    return cleanUpFileName(newFileName); // Clean up the file name
}

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

// Function to add or update frontmatter in each file
function addFrontmatterToFiles(dir) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isFile() && path.extname(file) === '.md') { // Only process .md files
            const fileContents = fs.readFileSync(filePath, 'utf-8');
            const { creationDate, lastModifiedDate } = extractDatesFromFileContents(filePath); // Get dates from file contents

            // Check if frontmatter already exists
            if (fileContents.startsWith('---')) {
                // Append to existing frontmatter
                const updatedFrontmatter = `File Creation Date: ${creationDate}\nLast Modified: ${lastModifiedDate}\n`;
                const newContents = fileContents.replace(/(---\n.*?\n---\n)/s, `$1${updatedFrontmatter}`);
                fs.writeFileSync(filePath, newContents, 'utf-8');
                console.log(`Updated frontmatter in: ${filePath}`);
            } else {
                // Add new frontmatter
                const frontmatter = `---\n` +
                    `title: ${file.replace(/\.[^/.]+$/, "")}\n` + // Remove file extension for title
                    `tags: \n` +
                    `File Creation Date: ${creationDate}\n` +
                    `Last Modified: ${lastModifiedDate}\n` +
                    `---\n\n`;

                // Prepend frontmatter to the file contents
                const newContents = frontmatter + fileContents; // Ensure original content is preserved
                fs.writeFileSync(filePath, newContents, 'utf-8');
                console.log(`Added frontmatter to: ${filePath}`);
            }
        }
    });
}

// Recursive function to process the specified directory and its subdirectories
function processDirectory(dir) {
    standardizeFileNames(dir);
    addFrontmatterToFiles(dir); // Call the new function to add frontmatter

    // Check for files with only a date in the name
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            // Recursively process subdirectories
            processDirectory(filePath);
        } else if (fs.lstatSync(filePath).isFile() && /^\d{4}-\d{2}-\d{2}/.test(file)) {
            const title = summarizeFileContent(filePath);
            const singleWordTag = generateSingleWordTag(filePath);
            const newFileName = file.replace(/^\d{4}-\d{2}-\d{2}/, `$& ${title}`); // Append title after the date
            const newPath = path.join(dir, newFileName);
            if (filePath !== newPath) {
                fs.renameSync(filePath, newPath);
                console.log(`Renamed: ${filePath} -> ${newPath}`);
            }

            // Append the single-word tag to the frontmatter
            const fileContents = fs.readFileSync(newPath, 'utf-8');
            const updatedFrontmatter = `tags: ${singleWordTag}\n`;
            const newContents = fileContents.replace(/(tags:\s*\n)/, `$1${updatedFrontmatter}`);
            fs.writeFileSync(newPath, newContents, 'utf-8');
            console.log(`Updated tags in: ${newPath}`);
        }
    });

    // Save all tags to a new file in the "folder tags" subfolder
    const allTags = [];
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isFile() && /^\d{4}-\d{2}-\d{2}/.test(file)) {
            const singleWordTag = generateSingleWordTag(filePath);
            allTags.push(singleWordTag);
        }
    });

    // Write tags to a new file in the "folder tags" subfolder
    const tagsFilePath = path.join(tagsFolderPath, `${folderName} file tags.txt`);
    fs.writeFileSync(tagsFilePath, [...new Set(allTags)].join('\n'), 'utf-8'); // Remove duplicates
    console.log(`Saved tags to: ${tagsFilePath}`);
}

// Start processing the specified directory
processDirectory(targetPath);