const fs = require('fs');
const path = require('path');
const { extractDatesFromFileContents } = require('./dateUtils');
const { generateTags } = require('./tagUtils');

// Function to add or update frontmatter in each file
async function addFrontmatterToFiles(dir, tagsFilePath) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isFile() && path.extname(file) === '.md') {
            const fileContents = fs.readFileSync(filePath, 'utf-8');
            const { creationDate, lastModifiedDate } = extractDatesFromFileContents(filePath);
            const rootFolderName = path.basename(dir); // Get the root folder name
            const tags = await generateTags(filePath, tagsFilePath, rootFolderName); // Generate tags

            // Check if frontmatter already exists
            if (fileContents.startsWith('---')) {
                // Update existing frontmatter
                const updatedFrontmatter = `tags: ${tags.join(', ')}\nFile Creation Date: ${creationDate || 'N/A'}\nLast Modified: ${lastModifiedDate || 'N/A'}\n`;
                const newContents = fileContents.replace(/(---\n.*?\n---\n)/s, `$1${updatedFrontmatter}`);
                fs.writeFileSync(filePath, newContents, 'utf-8');
                console.log(`Updated frontmatter in: ${filePath}`);
            } else {
                // Add new frontmatter
                const frontmatter = `---\n` +
                    `title: ${file.replace(/\.[^/.]+$/, "")}\n` + // Remove file extension for title
                    `tags: ${tags.join(', ')}\n` + // Add the generated tags
                    `File Creation Date: ${creationDate || 'N/A'}\n` +
                    `Last Modified: ${lastModifiedDate || 'N/A'}\n` +
                    `---\n\n`;

                // Prepend frontmatter to the file contents
                const newContents = frontmatter + fileContents; // Ensure original content is preserved
                fs.writeFileSync(filePath, newContents, 'utf-8');
                console.log(`Added frontmatter to: ${filePath}`);
            }
        }
    }
}

module.exports = { addFrontmatterToFiles };
