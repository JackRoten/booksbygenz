// lib/loadBooks.ts
import fs from 'fs';
import path from 'path';

// TODO: Move to S3 for book storage of where this loader gets books from
// TODO: Explore if parquet can be used for book storage

export async function loadBooks() {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'books.json');
  // const filePath = path.join(process.cwd(), 'src', 'lib', 'books_og.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}