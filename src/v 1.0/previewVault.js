const fs = require('fs');
const path = require('path');

const vaultPath = '/Users/samsena/Documents/Obsidian-Alpha';

// Function to preview the directory structure based on PARA method
function previewDirectoryStructure(dir) {
    const structure = {
        Projects: [],
        Areas: [],
        Resources: [],
        Archives: []
    };

    // Recursive function to traverse directories
    function traverseDirectory(currentDir) {
        fs.readdirSync(currentDir).forEach(folder => {
            const folderPath = path.join(currentDir, folder);
            if (fs.lstatSync(folderPath).isDirectory()) {
                // Simulate categorization based on folder names
                if (folder.toLowerCase().includes('project')) {
                    structure.Projects.push(folderPath);
                } else if (folder.toLowerCase().includes('area')) {
                    structure.Areas.push(folderPath);
                } else if (folder.toLowerCase().includes('resource')) {
                    structure.Resources.push(folderPath);
                } else if (folder.toLowerCase().includes('archive')) {
                    structure.Archives.push(folderPath);
                }
                // Recursively traverse subdirectories
                traverseDirectory(folderPath);
            }
        });
    }

    traverseDirectory(dir);

    console.log('Current Directory Structure:');
    console.log(JSON.stringify(structure, null, 2));
}

// Start the preview
previewDirectoryStructure(vaultPath);
