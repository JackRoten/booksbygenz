'use client';

import { useState } from 'react';

type Chapter = {
  title: string;
  original_content: string[];
  translated_content: string[];
};

export default function ChapterViewer({ chapter }: { chapter: Chapter }) {
  const [viewMode, setViewMode] = useState<'original' | 'translated'>('original');
  const [sideBySide, setSideBySide] = useState(false);

  return (
    <div className="space-y-4">
      <div className="space-x-2">
        <button
          onClick={() => setViewMode('original')}
          className={`px-4 py-2 rounded ${viewMode === 'original' ? 'bg-blue-600 text-white' : 'bg-gray-600'}`}
        >
          Original
        </button>
        <button
          onClick={() => setViewMode('translated')}
          className={`px-4 py-2 rounded ${viewMode === 'translated' ? 'bg-blue-600 text-white' : 'bg-gray-600'}`}
        >
          Translated
        </button>
        <button
          onClick={() => setSideBySide(!sideBySide)}
          className="px-4 py-2 rounded bg-green-600"
        >
          {sideBySide ? 'Single View' : 'Side by Side'}
        </button>
      </div>

      {!sideBySide ? (
        <div className="prose max-w-none">
          {(viewMode === 'original' ? chapter.original_content : chapter.translated_content).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 prose max-w-none">
          <div>
            <h3 className="font-semibold text-lg">Original</h3>
            {chapter.original_content.map((para, i) => (
              <p key={`orig-${i}`}>{para}</p>
            ))}
          </div>
          <div>
            <h3 className="font-semibold text-lg">Translated</h3>
            {chapter.translated_content.map((para, i) => (
              <p key={`trans-${i}`}>{para}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
