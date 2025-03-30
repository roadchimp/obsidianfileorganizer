# Obsidian File Organizer

A utility for organizing and tagging Markdown files in Obsidian vaults, with advanced AI-assisted tagging capabilities.

## Features

- **File Standardization**: Renames files to follow consistent naming conventions
- **Frontmatter Management**: Adds/updates YAML frontmatter in your Markdown files
- **Date Extraction**: Detects and formats dates from file contents
- **AI-Assisted Tagging**: Uses OpenAI to generate relevant tags based on file content
- **Tag Glossary**: Maintains a consistent glossary of tags across your vault

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set your OpenAI API key as an environment variable:
   ```
   export OPENAI_API_KEY=your_api_key_here
   ```

## Usage

### Standard File Processing

Process a specific directory in your vault:

```
npm start <directory_name>
```

This will:
- Standardize file names
- Add/update frontmatter 
- Organize files based on content

### AI-Assisted Tagging

Process a directory with AI-generated tags:

```
npm run tag-ai <directory_name>
```

Or directly:

```
node src/index.js --ai <directory_name>
```

This will:
- Read your existing tags from `folder tags/tags.json`
- Use OpenAI to generate relevant tags for each file
- Update file frontmatter with the generated tags
- Add new tags to your glossary

## Configuration

By default, the script uses the following paths:

- **Vault Path**: `/Users/samsena/Library/CloudStorage/GoogleDrive-samsena@gmail.com/My Drive/repos/Obsidian File Organizer`
- **Tags File**: `<vault_path>/folder tags/tags.json`

You can customize the vault path by setting the `VAULT_PATH` environment variable:

```
export VAULT_PATH=/path/to/your/obsidian/vault
```

## How AI Tagging Works

1. The script reads your existing tag glossary (array of tag strings) from `tags.json`
2. For each Markdown file:
   - Content is analyzed by OpenAI with a prompt that includes your current tags
   - The AI returns 3-5 contextually relevant tags
   - New tags are added to your glossary
   - File frontmatter is updated with the generated tags

The AI is biased to use your existing tags when appropriate, ensuring consistency across your vault while allowing for new tags when needed.

## License

ISC 