const fs = require('fs');
const path = require('path');
const { extractDatesFromFileContents, generateNewFileName, cleanUpFileName } = require('./dateUtils');
const { summarizeFileContent, generateSingleWordTag } = require('./tagUtils');
const { addFrontmatterToFiles } = require('./frontmatterUtils');

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
}

module.exports = { processDirectory };
