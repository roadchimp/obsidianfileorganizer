const fs = require('fs');
const path = require('path');
const glob = require('glob');
const matter = require('gray-matter');
const OpenAI = require('openai');
const axios = require('axios');

// Function to configure OpenAI API
function configureOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENAI_API_KEY environment variable not set');
    process.exit(1);
  }

  return new OpenAI({ apiKey });
}

// Load tag glossary from tags/tags.json
function loadGlossary(tagsFilePath) {
  try {
    const data = fs.readFileSync(tagsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error loading glossary from ${tagsFilePath}:`, err);
    return [];
  }
}

// Save updated glossary back to tags/tags.json
function saveGlossary(tagsFilePath, tags) {
  try {
    fs.writeFileSync(tagsFilePath, JSON.stringify(tags, null, 2), 'utf-8');
    console.log(`Updated glossary saved to ${tagsFilePath}`);
  } catch (err) {
    console.error(`Error saving glossary to ${tagsFilePath}:`, err);
  }
}

// Update markdown file frontmatter with new tags (merges with existing tags)
function updateFileFrontmatter(filePath, newTags) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(fileContent);
    const existingTags = Array.isArray(parsed.data.tags) ? parsed.data.tags : 
                        (typeof parsed.data.tags === 'string' ? [parsed.data.tags] : []);
    
    // Merge and remove duplicates, ensuring all tags are prefixed with '#'
    const mergedTags = Array.from(new Set([...existingTags, ...newTags.map(tag => `#${tag}`)]));

    // Limit the number of tags to a maximum of 10 (or any number you prefer)
    const limitedTags = mergedTags.slice(0, 10).join(' '); // Join as a single line string

    // Set the tags as a single string without introducing newlines
    parsed.data.tags = limitedTags; 
    
    // Preserve the original content
    const updatedContent = matter.stringify(parsed.content, parsed.data);
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    
    console.log(`Updated tags in ${filePath}: ${limitedTags}`);
    return true;
  } catch (err) {
    console.error(`Error updating frontmatter in ${filePath}:`, err);
    return false;
  }
}

// Generate tags using OpenAI API
async function generateTagsForContent(content, glossary, openai) {
  // Craft a prompt that includes the current tag glossary
  const prompt = `
You are an assistant that assigns concise thematic tags to notes.
Use tags from this list when relevant: ${glossary.join(', ')}.
If none of these fully apply, you may suggest a new tag (short and general).
Return 3-5 comma-separated tags for the note below:
""" 
${content.substring(0, 4000)} ${content.length > 4000 ? '... (content truncated)' : ''}
"""
  `;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50,
      temperature: 0.2,
      n: 1,
    });

    const tagsText = response.choices[0].message.content.trim();
    
    // Split tags, normalize to lowercase, and trim whitespace
    return tagsText.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  } catch (err) {
    console.error("Error generating tags using OpenAI:", err.message);
    return [];
  }
}

// Main function to process a directory and add AI-generated tags to all markdown files
async function processDirectoryWithAITags(directoryPath, tagsFilePath) {
  // Initialize OpenAI
  const openai = configureOpenAI();
  
  // Load existing glossary
  const glossary = loadGlossary(tagsFilePath);
  console.log(`Loaded ${glossary.length} tags from glossary`);
  
  // Find all markdown files in the specified directory
  const mdFiles = glob.sync(path.join(directoryPath, '**/*.md'));
  console.log(`Found ${mdFiles.length} markdown files in ${directoryPath}`);
  
  let newTagsCount = 0;
  
  // Process each markdown file
  for (const filePath of mdFiles) {
    console.log(`\nProcessing: ${filePath}`);
    
    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Generate tags for the content
    const generatedTags = await generateTagsForContent(content, glossary, openai);
    
    if (generatedTags.length === 0) {
      console.log('No tags generated for this file, skipping...');
      continue;
    }
    
    console.log(`Generated tags: ${generatedTags.join(', ')}`);
    
    // Identify tags not already in the glossary
    const tagsToAdd = generatedTags.filter(tag => !glossary.includes(tag));
    
    if (tagsToAdd.length > 0) {
      console.log(`New tags found: ${tagsToAdd.join(', ')}. Adding to glossary.`);
      glossary.push(...tagsToAdd);
      newTagsCount += tagsToAdd.length;
      saveGlossary(tagsFilePath, glossary);
    }
    
    // Update the file's frontmatter with the new tags
    updateFileFrontmatter(filePath, generatedTags);
  }
  
  console.log(`\nProcessing complete. Added ${newTagsCount} new tags to the glossary.`);
}

module.exports = {
  loadGlossary,
  saveGlossary,
  updateFileFrontmatter,
  generateTagsForContent,
  processDirectoryWithAITags
}; 