I would like to create an application that reviews and optimizes my Obsidian Vault, stored on my Macbook Air, comprising primarily of folders, markdown files, and attachments (images and files) 

Key requirements:

1. Work through all files on a folder by folder basis (in a batch)
2. Tag all files consistently
- Add a header section for each file (or modify existing header) so it looks like this:
title:  name of the file
tags: 
File Creation Date: date file was created
Last Modified: date file last modified
3. The Tag section of each file is populated based on 
- Using OPENAI APIs to review each document and add up to 5 tags based on a summary of the document
- I would like consistency of tagging across files, so new tags should be stored in a tag glossary file and the preference is to use an existing tag if that accurately describes the content of the file, if not, when using a new tag, append that to the tag glossary