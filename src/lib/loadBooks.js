// "use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
// exports.loadBooks = loadBooks;
// lib/loadBooks.ts
// var fs_1 = require("fs");
// var path_1 = require("path");

import fs from 'fs';
import path from 'path';
// TODO: Move to S3 for book storage of where this loader gets books from
// TODO: Explore if parquet can be used for book storage
function loadBooks() {
    var filePath = path.join(process.cwd(), 'src', 'lib', 'books.json');
    // const filePath = path.join(process.cwd(), 'src', 'lib', 'books_og.json');
    var fileContent = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(fileContent);
    console.log(JSON.stringify(json, null, 2));
    // return JSON.parse(fileContent);
}
loadBooks();
