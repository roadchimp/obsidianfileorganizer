const fs = require('fs');

// Function to extract the creation and modification dates from file contents
function extractDatesFromFileContents(filePath) {
    const fileContents = fs.readFileSync(filePath, 'utf-8');

    // Define an array of patterns to search for
    const datePatterns = [
        { label: 'Created at:', regex: /Created at:\s*(\d{4}-\d{2}-\d{2})/ },
        { label: 'Updated at:', regex: /Updated at:\s*(\d{4}-\d{2}-\d{2})/ },
        { label: 'File Creation Date:', regex: /File Creation Date:\s*(\d{4}-\d{2}-\d{2})/ },
        { label: 'Last Modified:', regex: /Last Modified:\s*(\d{4}-\d{2}-\d{2})/ },
        // Add more patterns as needed
    ];

    let creationDate = null;
    let lastModifiedDate = null;

    // Iterate through the patterns to find matches
    for (const pattern of datePatterns) {
        const match = fileContents.match(pattern.regex);
        if (match) {
            if (pattern.label.includes('Created') || pattern.label.includes('Creation')) {
                creationDate = match[1]; // Capture the creation date
            } else if (pattern.label.includes('Updated') || pattern.label.includes('Modified')) {
                lastModifiedDate = match[1]; // Capture the last modified date
            }
        }
    }

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

    // Remove any existing date from the original name for the title
    const descriptiveName = file.replace(/(\d{4})[ -]?(\d{1,2})[ -]?(\d{1,2})/, '').trim(); // Remove the date

    // Construct the new file name
    const newFileName = finalDate ? `${finalDate} ${descriptiveName}` : descriptiveName; // Format: YYYY-MM-DD Title or just Title
    return cleanUpFileName(newFileName); // Clean up the file name
}

module.exports = { 
    extractDatesFromFileContents, 
    convertToStandardDateFormat, 
    extractDateFromFileName, 
    cleanUpFileName, 
    generateNewFileName 
};
