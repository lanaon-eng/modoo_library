import { useEffect, useRef, useState } from 'react';
import { Search, X, BookOpen, Check, Loader2 } from 'lucide-react';
import type { SearchBook } from '@/types';
import { searchBooks } from '@/lib/search';
import { CoverImage } from '@/components/CoverImage';

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (book: SearchBook) => void;
  existingIds: string[];
};

export function AddBookModal({ open, onClose, onAdd, existingIds }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSearched(false);
      setAddedId(null);
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await searchBooks(query);
        setResults(res);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  if (!open) return null;

  const handleAdd = (book: SearchBook) => {
    onAdd(book);
    setAddedId(book.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const isExisting = (book: SearchBook) =>
    existingIds.some((id) => id.startsWith(book.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md animate-slide-up rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:animate-scale-in sm:rounded-3xl">
        {/* Grab handle */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1 w-9 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Title bar */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div>
            <h2 className="text-[17px] font-bold">책 검색</h2>
            <p className="text-[11px] text-slate-400">
              읽은 책을 검색하고 내 서재에 담아보세요
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pt-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900">
            <Search size={18} className="text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="책 제목, 저자를 검색해보세요"
              className="w-full bg-transparent text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="검색어 지우기"
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[52vh] overflow-y-auto px-5 py-4 no-scrollbar">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-[13px] font-medium">검색 중...</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
              <BookOpen size={32} strokeWidth={1.5} />
              <p className="text-[13px] font-medium">
                '{query}'에 대한 검색 결과가 없어요
              </p>
            </div>
          )}

          {!loading && !searched && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-300 dark:text-slate-600">
              <Search size={32} strokeWidth={1.5} />
              <p className="text-[13px] font-medium">
                검색어를 입력하면 책을 찾아드릴게요
              </p>
            </div>
          )}}

          {!loading && results.length > 0 && (
            <ul className="space-y-2.5">
              {results.map((book) => {
                const exists = isExisting(book);
                const justAdded = addedId === book.id;
                return (
                  <li
                    key={book.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100/80 bg-white p-2.5 transition-colors dark:border-slate-800/70 dark:bg-slate-800/50"
                  >
                    <BookThumb book={book} />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[13.5px] font-bold">
                        {book.title}
                      </h3>
                      <p className="mt-0.5 truncate text-[11.5px] font-medium text-slate-500 dark:text-slate-400">
                        {book.authors.join(', ')} · {book.publisher}
                      </p>
                    </div>
                    {justAdded ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1.5 text-[11px] font-bold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        <Check size={13} strokeWidth={3} />
                        담김
                      </span>
                    ) : exists ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-400 dark:bg-slate-700 dark:text-slate-400">
                        보유중
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAdd(book)}
                        className="shrink-0 rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 px-3.5 py-1.5 text-[12px] font-bold text-white transition-all hover:scale-105 hover:from-brand-700 hover:to-brand-600 active:scale-95"
                      >
                        담기
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function BookThumb({ book }: { book: SearchBook }) {
  const coverUrls = book.coverUrls?.length
    ? book.coverUrls
    : book.thumbnail
      ? [book.thumbnail]
      : [];

  if (coverUrls.length > 0) {
    return (
      <CoverImage
        urls={coverUrls}
        alt={book.title}
        className="h-16 w-12 shrink-0 rounded-md object-cover"
        fallback={
          <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-300 dark:bg-slate-700 dark:text-slate-500">
            <BookOpen size={18} strokeWidth={1.5} />
          </div>
        }
      />
    );
  }
  return (
    <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-300 dark:bg-slate-700 dark:text-slate-500">
      <BookOpen size={18} strokeWidth={1.5} />
    </div>
  );
}
