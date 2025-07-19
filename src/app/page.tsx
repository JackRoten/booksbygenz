// app/page.tsx
import Link from "next/link";
import { loadBooks } from "@/lib/loadBooks";


export default async function HomePage() {
  const books = await loadBooks();
  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Available Books</h1>
      <ul>
        {books.map((book: any) => (
          <li key={book.id}>
            <Link href={`/books/${book.id}`}>
              {book.title} {book.author}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
