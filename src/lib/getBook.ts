// lib/getBook.ts

// Continue to see if this can be adjusted to read data into a json file
// Will need json file to provide proper structure for Open AI prompting.

// API for webscraping 
// example:
// https://www.gutenberg.org/cache/epub/2701/pg2701-images.html

// .ts requests module

// base url:

// get top books from gutenberg
//use https://www.gutenberg.org/browse/scores/top

// next get first book, this example: "A Room with a View"
// https://www.gutenberg.org/ebooks/2641

// https://www.gutenberg.org/cache/epub/2641/pg2641-images.html
// transalate this into json file

import axios from 'axios';
import * as cheerio from 'cheerio';

const URL = 'https://www.gutenberg.org/';
const TOPBOOKS = '/browse/scores/top'; // not used yet, implement

const TOPBOOKSURL = URL + TOPBOOKS

async function getTopBooks(url: string): Promise<string[]> {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
    
        const hrefs: string[] = [];

        $("ol li a").each((_, el) => {
            const href = $(el).attr('href');
            if (href) {
                hrefs.push(href)
            }
        });

        // console.log('Found hrefs:', hrefs);
        return hrefs;
    } catch (error) {
        console.error('Error scraping:', error);
        return [];
    }
  }

async function scrapeGutenbergText(url: string): Promise<string> {
  try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Gutenberg wraps the main text in <body>
        const textContent: string[] = [];

        $('body')
        .children()
        .each((_, elem) => {
            const tag = $(elem);
            const text = tag.text().trim();
            if (text) {
            textContent.push(text);
            }
        });

        // Need a way to capture these groups into json

//         </div>
// <div class="div1 chapter" id="ch38"><span class="pageNum">[<a href="#xd32e586" class="pginternal">Contents</a>]</span><div class="divHead">
// <h2 class="label">Chapter XXXVIII</h2>
// <h2 class="main">Fatality</h2>

        // Join and output first part of the text
        const output = textContent.join('\n\n');
        // console.log(output.slice(0, 3000)); // Just print first 3000 characters
        return output.slice(0, 10000);
        
  } catch (error) {
        console.error('Error scraping:', error);
        return ''; 
  }
}

const hrefs: string[] = await getTopBooks(TOPBOOKSURL);

console.table(hrefs);

const book_href = hrefs[1]; // hardcoded option, will improve upon soon.
console.log('Found href:', hrefs[1]);
const pathSegments: string[] = book_href.split('/');
const book_id: string = pathSegments[pathSegments.length - 1];

const book_url = URL + 'cache/epub/' + book_id + '/pg' + book_id + '-images.html';
console.log(book_url);

const book_text = await scrapeGutenbergText(book_url);
console.log(book_text);

// Pivot, save raw html to S3 location which inlcudes name found in network as file name

// next save data into a json dict similar to books.json format
// will need to change how text is saved and into json format.
