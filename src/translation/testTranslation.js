import GenZTranslator from './translator.js';
import fs from 'fs/promises';

// Simple usage example
async function translateBook() {
    // Initialize translator with your API key
    const translator = new GenZTranslator(process.env.ANTHROPIC_API_KEY);
    
    try {
        // Read the HTML file
        const htmlContent = await fs.readFile('2641.html', 'utf8');
        
        // Translate with progress tracking
        console.log('Starting translation...');
        const result = await translator.translateText(htmlContent, (current, total) => {
            const percentage = Math.round((current / total) * 100);
            console.log(`📚 Progress: ${current}/${total} batches (${percentage}%)`);
        });
        
        // Generate and save translated HTML
        const translatedHTML = translator.generateTranslatedHTML(result);
        await translator.saveToFile(translatedHTML, 'room_with_view_genz.html');
        
        // Save raw data as JSON
        await translator.saveToFile(JSON.stringify(result, null, 2), 'translation_data.json');
        
        console.log('✅ Translation complete!');
        console.log(`📄 Translated ${result.translatedParagraphs.length} paragraphs`);
        console.log(`💾 Files saved: room_with_view_genz.html, translation_data.json`);
        
    } catch (error) {
        console.error('❌ Translation failed:', error.message);
    }
}

// Run it
translateBook();