const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { extractDatesFromFileContents } = require('./dateUtils');
const { generateTags, readStandardTags } = require('./tagUtils');

// Helper function to determine the tags file path
function determineTagsFilePath(dir) {
    // First try looking for a tags.json in the parent "folder tags" directory
    const vaultRoot = process.env.VAULT_PATH || '/Users/samsena/Library/CloudStorage/GoogleDrive-samsena@gmail.com/My Drive/repos/Obsidian File Organizer';
    const jsonTagsPath = path.join(vaultRoot, 'folder tags', 'tags.json');
    
    if (fs.existsSync(jsonTagsPath)) {
        return jsonTagsPath;
    }
    
    // Fallback to a tags.txt in the current directory
    const txtTagsPath = path.join(dir, 'tags.txt');
    return fs.existsSync(txtTagsPath) ? txtTagsPath : null;
}

// Function to add or update frontmatter in each file
async function addFrontmatterToFiles(dir, specifiedTagsFilePath = null) {
    // Determine tags file path if not specified
    const tagsFilePath = specifiedTagsFilePath || determineTagsFilePath(dir);
    if (!tagsFilePath) {
        console.warn(`Warning: No tags file found for directory ${dir}. Tags will be generated without a glossary.`);
    } else {
        console.log(`Using tags file: ${tagsFilePath}`);
    }
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.lstatSync(filePath).isFile() && path.extname(file) === '.md') {
            const fileContents = fs.readFileSync(filePath, 'utf-8');
            const { creationDate, lastModifiedDate } = extractDatesFromFileContents(filePath);
            const rootFolderName = path.basename(dir); // Get the root folder name
            const tags = await generateTags(filePath, tagsFilePath, rootFolderName); // Generate tags
            
            try {
                // Parse the file with gray-matter
                const parsed = matter(fileContents);
                
                // Update the front matter
                parsed.data.title = parsed.data.title || file.replace(/\.[^/.]+$/, ""); // Use existing title or filename
                parsed.data.tags = Array.isArray(parsed.data.tags) ? parsed.data.tags : 
                                (typeof parsed.data.tags === 'string' ? [parsed.data.tags] : []);
                
                // Merge tags (avoid duplicates)
                const mergedTags = Array.from(new Set([...parsed.data.tags, ...tags]));
                parsed.data['File Creation Date'] = creationDate || 'N/A';
                parsed.data['Last Modified'] = lastModifiedDate || 'N/A';
                parsed.data.tags = mergedTags;
                
                // Write back the updated file
                const updatedContent = matter.stringify(parsed.content, parsed.data);
                fs.writeFileSync(filePath, updatedContent, 'utf-8');
                console.log(`Updated frontmatter in: ${filePath}`);
            } catch (error) {
                console.error(`Error processing frontmatter for ${filePath}:`, error.message);
                
                // Fallback to old approach if gray-matter fails
                if (fileContents.startsWith('---')) {
                    // Update existing frontmatter (simple string replace)
                    const updatedFrontmatter = `tags: ${tags.join(', ')}\nFile Creation Date: ${creationDate || 'N/A'}\nLast Modified: ${lastModifiedDate || 'N/A'}\n`;
                    const newContents = fileContents.replace(/(---\n.*?\n---\n)/s, `$1${updatedFrontmatter}`);
                    fs.writeFileSync(filePath, newContents, 'utf-8');
                    console.log(`Updated frontmatter in (fallback method): ${filePath}`);
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
}

module.exports = { addFrontmatterToFiles, determineTagsFilePath };
