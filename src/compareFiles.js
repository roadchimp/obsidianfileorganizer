const fs = require('fs');
const path = require('path');

// Define the paths to the files
const testFilePath = '/Users/samsena/Library/CloudStorage/GoogleDrive-samsena@gmail.com/My Drive/repos/Obsidian File Organizer/000 test/8778 21 16 57 dynamic recovery solutions @ 2_26.md';
const baselineFilePath = '/Users/samsena/Library/CloudStorage/GoogleDrive-samsena@gmail.com/My Drive/repos/Obsidian File Organizer/000 test baseline/8778211657 dynamic recovery solutions @ 2_26.md';


// Read the contents of both files
const testFileContents = fs.readFileSync(testFilePath, 'utf-8');
const baselineFileContents = fs.readFileSync(baselineFilePath, 'utf-8');

// Compare the contents
if (testFileContents === baselineFileContents) {
    console.log('The files are identical.');
} else {
    console.log('The files differ:');
    console.log('--- Test File ---');
    console.log(testFileContents);
    console.log('--- Baseline File ---');
    console.log(baselineFileContents);
}
