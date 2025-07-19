// TODO: test anthropic code locally for small and large files

import { JSDOM } from 'jsdom';
import Anthropic from '@anthropic-ai/sdk';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

class GenZTranslator {
    constructor(apiKey) {
        this.anthropic = new Anthropic({ apiKey });
        this.batchSize = 5; // Will be dynamically adjusted based on token count
        this.delay = 1200; // 1.2 seconds between batches for rate limiting
        this.maxBatchesPerMinute = 50;
        this.maxTokensPerBatch = 8000;
    }

    // Parse HTML and extract text content
    parseHTML(htmlContent) {
        const dom = new JSDOM(htmlContent);
        const document = dom.window.document;
        
        // Extract main content paragraphs
        const paragraphs = Array.from(document.querySelectorAll('p'))
            .map(p => p.textContent.trim())
            .filter(text => text.length > 0 && !this.isMetadata(text));
        
        // Extract chapter titles
        const chapters = Array.from(document.querySelectorAll('h1, h2'))
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
}

// Save results to S3
async function saveToS3(content, bucket, key, contentType) {
    const s3 = new S3Client();
    await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: content,
        ContentType: contentType
    }));
    console.log(`Saved to s3://${bucket}/${key}`);
}
// Helper to convert S3 stream to string
async function streamToString(stream) {
    return await new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}

// Lambda handler
export const handler = async (event) => {
    try { 
        // console.log('Received event:', JSON.stringify(event));
        
        // 1. Parse S3 event
        const record = event.Records[0];
        const srcBucket = record.s3.bucket.name;
        const srcKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const destBucket = srcBucket; //"lib/translated_topbooks/";
        const filename = srcKey.split("/").pop().replace(/\.html$/, '');
        const destHtmlKey = `lib/translated_topbooks/translated_${filename}.html`;
        const destJsonKey = `lib/translated_topbooks/translated_${filename}.json`;

        // 2. Fetch API key from Secrets Manager
        const secrets = new SecretsManagerClient({region: "us-west-2"});
        const secretResp = await secrets.send(new GetSecretValueCommand({ SecretId: 'booksbygenz/anthropic' }));
        const secret = JSON.parse(secretResp.SecretString);
        const apiKey = secret.apiKey;

        // TODO: Include translation process for a small file sample. 
        // TODO: Would be preferable to test text and translation parsing + input and output this locally

        // // 3. Download HTML from S3
        const s3 = new S3Client();
        const getObj = await s3.send(new GetObjectCommand({ Bucket: srcBucket, Key: srcKey }));
        const htmlContent = await streamToString(getObj.Body);

        // // 4. Translate
        // const translator = new GenZTranslator(apiKey);
        // const progressCallback = (current, total) => {
        //     console.log(`Progress: ${current}/${total} batches completed (${Math.round(current/total*100)}%)`);
        // };
        // const result = await translator.translateText(htmlContent, progressCallback);
        // const translatedHTML = translator.generateTranslatedHTML(result);

        // // 5. Upload results to S3
        //. test S3 upload
        const translatedHTML = htmlContent;
        await saveToS3(translatedHTML, destBucket, destHtmlKey, 'text/html');
        // await saveToS3(JSON.stringify(result, null, 2), destBucket, destJsonKey, 'application/json');
        // console.log('Translation complete!');
        return {
            statusCode: 200,
            body: `Succeded`,
            srcBucket: srcBucket,
            srcKey: srcKey,
            destBucket: destBucket,
            filename: filename,
            destHtmlKey: destHtmlKey,
            destJsonKey: destJsonKey,
            apiKey: apiKey
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
};
