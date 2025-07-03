// app/books/[bookId]/[chapterId]/page.tsx
import { loadBooks } from "@/lib/loadBooks";
import Link from "next/link";

export async function generateStaticParams() {
  const books = loadBooks();
  return books.flatMap((book: any) =>
    book.chapters.map((chapter: any) => ({
      bookId: book.id,
      chapterId: chapter.id,
    }))
  );
}

export default function ChapterPage({
  params,
}: {
  params: { bookId: string; chapterId: string };
}) {
  const books = loadBooks();
  const book = books.find((b: any) => b.id === params.bookId);
  if (!book) return <div>Book not found</div>;

  const chapterIndex = book.chapters.findIndex((c: any) => c.id === params.chapterId);
  if (chapterIndex === -1) return <div>Chapter not found</div>;

  const chapter = book.chapters[chapterIndex];
  const prev = book.chapters[chapterIndex - 1];
  const next = book.chapters[chapterIndex + 1];

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold">{chapter.title}</h1>
      <p className="mt-2 mb-6">{chapter.content}</p>

      <div className="flex gap-4">
        {prev && (
          <Link href={`/books/${book.id}/${prev.id}`}>&larr; {prev.title}</Link>
        )}
        <Link href={`/books/${book.id}`}>Back to Book</Link>
        {next && (
          <Link href={`/books/${book.id}/${next.id}`}>{next.title} &rarr;</Link>
        )}
      </div>
    </main>
  );
}
