import { useEffect } from 'react';
import { X, Trash2, Globe, Lock, Send } from 'lucide-react';
import type { Book } from '@/types';
import { BookCardCarousel } from '@/components/BookCardCarousel';

type Props = {
  book: Book | null;
  open: boolean;
  onClose: () => void;
  onTogglePublish: (id: string, isPublished: boolean) => void;
  onRecommend: (book: Book) => void;
  onRemove: (id: string) => void;
};

export function BookFeedModal({ book, open, onClose, onTogglePublish, onRecommend, onRemove }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !book) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-md animate-slide-up flex-col overflow-y-auto rounded-t-3xl bg-slate-50 no-scrollbar dark:bg-slate-950 sm:rounded-3xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 text-[11px] font-bold text-white">
              나
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-semibold">{book.title}</p>
              <p className="text-[11px] text-slate-400">
                {new Date(book.addedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 py-4">
          {book.category && (
            <span className="mb-3 inline-block rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
              {book.category}
            </span>
          )}

          <BookCardCarousel book={book} />

          <div className="mt-4">
            <h3 className="text-[17px] font-bold leading-snug">{book.title}</h3>
            <p className="mt-0.5 text-[13px] font-medium text-slate-500 dark:text-slate-400">
              {book.authors.join(', ')}
            </p>
            {book.userReview && (
              <p className="mt-3 text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300">{book.userReview}</p>
            )}
          </div>

          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={() => onRecommend(book)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-[13px] font-bold text-slate-700 transition-all hover:border-brand-400 hover:text-brand-500 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Send size={16} />
              추천하기
            </button>
            <button
              onClick={() => { onRemove(book.id); onClose(); }}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] font-bold text-slate-400 transition-all hover:border-red-400 hover:text-red-500 active:scale-95 dark:border-slate-700 dark:bg-slate-900"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-1.5">
              {book.isPublished ? (
                <>
                  <Globe size={14} className="text-brand-500" />
                  <span className="text-[12px] font-semibold text-brand-500">모두의 서재에 공유됨</span>
                </>
              ) : (
                <>
                  <Lock size={14} className="text-slate-400" />
                  <span className="text-[12px] font-semibold text-slate-400">비공개</span>
                </>
              )}
            </div>
            <button
              onClick={() => onTogglePublish(book.id, !book.isPublished)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                book.isPublished ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'
              }`}
              aria-label="공개 토글"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  book.isPublished ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
