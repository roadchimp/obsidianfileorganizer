const fs = require('fs');
const path = require('path');
const { extractDatesFromFileContents } = require('./dateUtils');

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

module.exports = { addFrontmatterToFiles };
