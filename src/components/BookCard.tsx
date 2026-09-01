import { useState } from 'react';
import { BookOpen, Trash2, ExternalLink, MessageCircle } from 'lucide-react';
import type { Book } from '@/types';
import { BookCoverDisplay } from '@/components/BookCoverDisplay';

type Props = {
  book: Book;
  onRemove: (id: string) => void;
  onChat: (book: Book) => void;
};

export function BookCard({ book, onRemove, onChat }: Props) {
  const [confirming, setConfirming] = useState(false);

  const coverUrls = book.coverUrls?.length
    ? book.coverUrls
    : book.thumbnail
      ? [book.thumbnail]
      : [];

  return (
    <article className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-ink-800/70 dark:bg-ink-900">
      {/* Header: user-like row */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-[11px] font-bold text-white">
          나
        </div>
        <div className="flex-1 leading-tight">
          <p className="text-[13px] font-semibold">나의 서재</p>
          <p className="text-[11px] text-ink-400">
            {new Date(book.addedAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onRemove(book.id)}
              className="rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-red-600"
            >
              삭제
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink-500 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              취소
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            aria-label="책 삭제"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-red-500 dark:hover:bg-ink-800"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Cover image with blurred background */}
      <div className="mt-3">
        <BookCoverDisplay
          urls={coverUrls}
          alt={book.title}
          fallback={
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-300 dark:text-ink-600">
              <BookOpen size={36} strokeWidth={1.5} />
              <span className="text-[11px] font-medium">표지 없음</span>
            </div>
          }
        />
      </div>

      {/* Body */}
      <div className="px-4 py-3.5">
        <h3 className="text-[15px] font-bold leading-snug">{book.title}</h3>
        <p className="mt-0.5 text-[12px] font-medium text-ink-500 dark:text-ink-400">
          {book.authors.join(', ')} · {book.publisher}
        </p>

        {book.contents && (
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink-600 dark:text-ink-300">
            {book.contents}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3">
          {book.url && (
            <a
              href={book.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400"
            >
              도서 정보 보기
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {/* Chat button */}
      <div className="border-t border-ink-100 px-4 py-2.5 dark:border-ink-800">
        <button
          onClick={() => onChat(book)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink-50 py-2 text-[12.5px] font-bold text-ink-600 transition-all hover:bg-brand-50 hover:text-brand-600 dark:bg-ink-800/50 dark:text-ink-300 dark:hover:bg-brand-900/20 dark:hover:text-brand-400"
        >
          <MessageCircle size={15} />
          캐릭터와 대화하기
        </button>
      </div>
    </article>
  );
}
