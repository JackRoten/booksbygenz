// TODO: test anthropic code locally for small and large files

import { JSDOM } from 'jsdom';
import fs from 'fs';
import * as cheerio from 'cheerio';
import path from 'path';



// import Anthropic from '@anthropic-ai/sdk';
// import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
// import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

class GenZTranslator {
    constructor() {
        this.batchSize = 5; // Will be dynamically adjusted based on token count
        this.delay = 1200; // 1.2 seconds between batches for rate limiting
        this.maxBatchesPerMinute = 50;
        this.maxTokensPerBatch = 8000;
    }

    // Parse HTML and extract text content
    async parseHTML(htmlContent) {
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;
        
        // can cheerio make this easier?
        const paragraphs = Array.from(document.querySelectorAll('p'))
            .map(p => p.textContent.trim())
            .filter(text => text.length > 0 && !this.isMetadata(text));
        
        // Extract chapter titles

        const chapters = Array.from(document.querySelectorAll('h2'))
            .map(h => h.textContent.trim())
            .filter(text => text.length > 0 && !this.isMetadata(text));
        
        return {
            paragraphs,
            chapters,
            title: this.extractTitle(document),
            author: this.extractAuthor(document)
        };
    }

    // Check if text is metadata (skip translation)
    isMetadata(text) {
        const metadataPatterns = [
            /^Title:/,
            /^Author:/,
            /^Release date:/,
            /^Language:/,
            /^Chapter [IVX]+/,
            /^Part [A-Z]+/,
            /^CONTENTS$/,
            /^\*\*\* START OF/,
            /^\*\*\* END OF/
        ];
        
        return metadataPatterns.some(pattern => pattern.test(text));
    }

    extractTitle(document) {
        const titleElement = document.querySelector('h1');
        return titleElement ? titleElement.textContent.trim() : '';
    }

    extractAuthor(document) {
        const authorText = document.querySelector('#pg-header-authlist p');
        return authorText ? authorText.textContent.replace('Author:', '').trim() : '';
    }

    // Estimate token count (rough: 1 token ≈ 4 chars)
    estimateTokens(text) {
        return Math.ceil(text.length / 4);
    }

    // Batch paragraphs for efficient API usage, respecting token limit
    createBatches(paragraphs) {
        const batches = [];
        let currentBatch = [];
        let currentTokens = 0;
        for (const p of paragraphs) {
            const tokens = this.estimateTokens(p);
            if (currentBatch.length > 0 && (currentBatch.length >= this.batchSize || currentTokens + tokens > this.maxTokensPerBatch)) {
                batches.push(currentBatch);
                currentBatch = [];
                currentTokens = 0;
            }
            currentBatch.push(p);
            currentTokens += tokens;
        }
        if (currentBatch.length > 0) {
            batches.push(currentBatch);
        }
        return batches;
    }

    // Translate a batch of paragraphs to Gen Z slang
    async translateBatch(paragraphs) {
        const prompt = `Translate the following text passages into modern Gen Z slang while maintaining the core meaning and narrative flow. Use contemporary slang, abbreviations, and expressions that Gen Z would use. Keep the dialogue natural and the story engaging.

Original passages:
${paragraphs.map((p, i) => `${i + 1}. ${p}`).join('\n\n')}

Please respond with the translated passages in the same numbered format.`;

        try {
            const response = await this.anthropic.messages.create({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            });

            return this.parseTranslationResponse(response.content[0].text);
        } catch (error) {
            console.error('Translation error:', error);
            return paragraphs; // Return original if translation fails
        }
    }

    // Parse the API response back into individual paragraphs
    parseTranslationResponse(response) {
        const lines = response.split('\n');
        const translatedParagraphs = [];
        
        for (const line of lines) {
            const match = line.match(/^\d+\.\s*(.+)$/);
            if (match) {
                translatedParagraphs.push(match[1]);
            }
        }
        
        return translatedParagraphs;
    }

    // Add delay between API calls
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Main translation function
    async translateText(htmlContent, progressCallback) {
        console.log('Parsing HTML content...');
        const parsed = this.parseHTML(htmlContent);
        
        console.log(`Found ${parsed.paragraphs.length} paragraphs to translate`);
        
        const batches = this.createBatches(parsed.paragraphs);
        const translatedParagraphs = [];
        
        for (let i = 0; i < batches.length; i++) {
            console.log(`Processing batch ${i + 1}/${batches.length}...`);
            
            if (progressCallback) {
                progressCallback(i + 1, batches.length);
            }
            
            const translated = await this.translateBatch(batches[i]);
            translatedParagraphs.push(...translated);
            
            // Add delay between batches to respect rate limits
            if (i < batches.length - 1) {
                await this.sleep(this.delay);
            }
        }
        
        return {
            title: parsed.title,
            author: parsed.author,
            chapters: parsed.chapters,
            originalParagraphs: parsed.paragraphs,
            translatedParagraphs
        };
    }

    // Generate translated HTML
    generateTranslatedHTML(translationResult) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${translationResult.title} - Gen Z Edition</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .author { font-style: italic; color: #666; }
        .chapter { margin-top: 30px; }
        .original { background: #f5f5f5; padding: 10px; margin: 10px 0; border-left: 3px solid #ccc; }
        .translated { background: #e8f4f8; padding: 10px; margin: 10px 0; border-left: 3px solid #2196F3; }
        .comparison { margin: 20px 0; }
    </style>
</head>
<body>
    <h1>${translationResult.title} - Gen Z Edition</h1>
    <p class="author">Original by ${translationResult.author} | Translated to Gen Z slang</p>
    
    <div class="content">
        ${translationResult.translatedParagraphs.map((translated, index) => `
            <div class="comparison">
                <div class="original">
                    <strong>Original:</strong> ${translationResult.originalParagraphs[index]}
                </div>
                <div class="translated">
                    <strong>Gen Z:</strong> ${translated}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
        
        return html;
    }


    // Parse HTML and extract text content
    async htmlToJson(htmlContent) {
        // const dom = new JSDOM(htmlContent);
        // const document = dom.window.document;
        
        // TODO: Fix data structure name conventions
        const book_list = []
        const book_json = {};
        const chapter_record = [];
        const $ = cheerio.load(htmlContent);
        
        const title = $('h1').first().text().trim() 
        const subtitle = $('h3').first().text().trim();
        const author = $("h2.no-break").first().text().trim();
        book_json['id'] = title.toLowerCase().replace(" ", "-");
        book_json["title"] = (title + " " + subtitle || null).trim()
        book_json["author"] = author;
        

        $('.chapter').each((i, chapterElem) => {
            const chapter = $(chapterElem);

            // Get the <h2> title
            const h2 = chapter.find('h2').first();

            let title = '';

            if (h2.length > 0) {
            const parts = h2.contents().map((i, el) => {
                if (el.type === 'text') return $(el).text().trim();
                if (el.name === 'br') return ' - '; // Replace <br> with dash
                return '';
            }).get();

            title = parts.join('').replace(/\s+-\s+$/, '').trim();
            }
            
            if (!title) title = `Untitled Chapter ${i + 1}`;

            // Get all <p> inside the chapter
            const paragraphs = chapter.find('p').map((i, p) => $(p).text().trim()).get();
            const content = paragraphs.join('\n\n');
            
            const record = {};
            
            record["id"] = title.toLowerCase().replace(" ", "-");
            record["title"] = title;
            record["content"] = content; // .slice(0, 5);
            if (title.toLowerCase() === 'contents') {
                return; // skip this chapter
              }
            chapter_record.push(record);
            
        });

        book_json['chapters'] = chapter_record;
        book_list.push(book_json);
        const outputJSONPath = "src/lib/books.json";
        // Step 4: Save as JSON
        fs.writeFile(outputJSONPath, JSON.stringify(book_list, null, 2), 'utf8', err => {
            if (err) {
            console.error('Error writing JSON:', err);
            } else {
            console.log(`Chapters written to ${outputJSONPath}`);
            }
        });
        // console.log($.html());
        return book_json;

    }
}

// const fs = require('fs').promises;

function getBetterTokenEstimate(text) {
    // Clean the text
    const cleanText = text.trim();
    
    // Count words
    const words = cleanText.split(/\s+/).filter(word => word.length > 0);
    
    // Count punctuation marks (often separate tokens)
    const punctuation = (cleanText.match(/[.,!?;:(){}[\]"'`~@#$%^&*+=<>\/\\|_-]/g) || []).length;
    
    // Estimate: words + punctuation, with some adjustment
    return Math.ceil(words.length + punctuation * 0.5);
}

async function getFileContent(filePath) {
    try {
        const content = await fs.readFileSync(filePath, 'utf8');
        return content;

    } catch (error) {
        console.error('Error reading file:', error);
        return null;
    }

}

async function getTokenCountFromFile(filePath) {
    try {
        
        const content = await fs.readFileSync(filePath, 'utf8');

        return {
            characterCount: content.length,
            betterEstimate: getBetterTokenEstimate(content)
        };
    } catch (error) {
        console.error('Error reading file:', error);
        return null;
    }
}



// Lambda handler
async function handler() {
    try { 
        
        // need to break file down into sets of paragraphs that will not exceed the token limit of 8000

        // 1. Get data locally
        const translator = new GenZTranslator();

        const file_path = "src/translation/84.html";
        // const file_path = "src/translation/sample_2641.html"
        const file_content = await getFileContent(file_path);
        const token_count = await getTokenCountFromFile(file_path);
        const htmlToJson = await translator.htmlToJson(file_content);

        // const parsed = await translator.parseHTML(file_content);

        return {
            statusCode: 200,
            body: token_count,
            // file_content: file_content,
            htmlToJson: htmlToJson

        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
};

console.log(await handler());