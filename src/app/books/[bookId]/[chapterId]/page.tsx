// 'use client';

// app/books/[bookId]/[chapterId]/page.tsx
import ChapterViewer from '@/components/ChapterViewer';
// import { useState } from 'react';
import { loadBooks } from "@/lib/loadBooks";
import Link from "next/link";

export async function generateStaticParams() {
  const books = await loadBooks();
  return books.flatMap((book: any) =>
    book.chapters.map((chapter: any) => ({
      bookId: book.id,
      chapterId: chapter.id,
    }))
  );
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>;
}) {
  const books = await loadBooks();
  const { bookId, chapterId } = await params; 
  
  const book = books.find((b: any) => b.id === bookId);
  if (!book) return <div>Book not found</div>;

  const chapterIndex = book.chapters.findIndex((c: any) => c.id === chapterId);
  if (chapterIndex === -1) return <div>Chapter not found</div>;

  const chapter = book.chapters[chapterIndex];
  const prev = book.chapters[chapterIndex - 1];
  const next = book.chapters[chapterIndex + 1];


  return (
    <main className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">{book.title} — {chapter.title}</h1>
      <ChapterViewer chapter={chapter} />

      <nav className="flex justify-between mt-8">
        {prev ? (
          <Link href={`/books/${book.id}/${prev.id}`} className="text-blue-600 hover:underline">
            &larr; {prev.title}
          </Link>
        ) : <div />}

        <Link href={`/books/${book.id}`} className="text-blue-600 hover:underline">
          Back to Book
        </Link>

        <Link href={`/`} className="text-blue-600 hover:underline">
          Back to Home Page
        </Link>

        {next ? (
          <Link href={`/books/${book.id}/${next.id}`} className="text-blue-600 hover:underline">
            {next.title} &rarr;
          </Link>
        ) : <div />}
      </nav>
    </main>
  );
}