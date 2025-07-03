// lib/loadBooks.ts
import fs from 'fs';
import path from 'path';

export function loadBooks() {
  const filePath = path.join(process.cwd(), 'src', 'lib', 'books.json');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}
