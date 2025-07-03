// app/books/[bookId]/page.tsx
import { loadBooks } from "@/lib/loadBooks";
import Link from "next/link";

export async function generateStaticParams() {
  const books = loadBooks();
  return books.map((book: any) => ({ bookId: book.id }));
}

export default function BookPage({ params }: { params: { bookId: string } }) {
  const books = loadBooks();
  const book = books.find((b: any) => b.id === params.bookId);
  if (!book) return <div>Book not found</div>;

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">{book.title}</h1>
      <p className="mb-4">by {book.author}</p>
      <ul>
        {book.chapters.map((ch: any) => (
          <li key={ch.id}>
            <Link href={`/books/${book.id}/${ch.id}`}>{ch.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
