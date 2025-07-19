// app/books/[bookId]/page.tsx
import { loadBooks } from "@/lib/loadBooks";
import Link from "next/link";

export async function generateStaticParams() {
  const books = await loadBooks();
  return books.map((book: any) => ({ bookId: book.id }));
}

export default async function BookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const books = await loadBooks();
  const { bookId } = await params; 
  const book = books.find((b: any) => b.id === bookId);
  if (!book) return <div>Book not found</div>;

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">{book.title}</h1>
      <p className="mb-4">{book.author}</p>
      <ul>
        {book.chapters.map((ch: any) => (
          <li key={ch.id}>
            <Link href={`/books/${book.id}/${ch.id}`}>{ch.title}</Link>
          </li>
        ))}
      </ul>
      <nav className="flex justify-between mt-8">
        <Link href={`/`} className="text-blue-600 hover:underline">
          Back to Home Page
        </Link>
      </nav>
    </main>
  );
}