import { ArrowLeft, Sparkles, BookOpen } from 'lucide-react';
import type { CurrentlyReading, ReadingNote, NoteType } from '@/types';
import { CoverImage } from '@/components/CoverImage';
import { ReadingNotePanel } from '@/components/ReadingNotePanel';

type Props = {
  book: CurrentlyReading;
  notes: ReadingNote[];
  onAddNote: (content: string, noteType: NoteType) => void;
  onDeleteNote: (id: string) => void;
  onStartChat: () => void;
  onBack: () => void;
};

export function ReadingNotePage({ book, notes, onAddNote, onDeleteNote, onStartChat, onBack }: Props) {
  const coverUrls = book.coverUrls?.length ? book.coverUrls : book.thumbnail ? [book.thumbnail] : [];

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col">
      {/* Top bar with back button */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={18} />
        </button>
        <p className="text-[15px] font-bold">읽기 노트</p>
      </div>

      {/* Book info card */}
      <div className="mx-4 mb-3 overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-card dark:border-slate-800/70 dark:bg-slate-900">
        <div className="flex items-center gap-3 p-3.5">
          {coverUrls.length > 0 ? (
            <CoverImage
              urls={coverUrls}
              alt={book.bookTitle}
              className="h-[72px] w-[50px] shrink-0 rounded-md object-cover"
              fallback={
                <div className="flex h-[72px] w-[50px] items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
                  <BookOpen size={18} className="text-slate-300" />
                </div>
              }
            />
          ) : (
            <div className="flex h-[72px] w-[50px] items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
              <BookOpen size={18} className="text-slate-300" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[14px] font-bold leading-snug">{book.bookTitle}</h3>
            <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-400">
              {book.bookAuthor || '저자 미상'}
            </p>
            {book.bookPublisher && (
              <p className="mt-0.5 truncate text-[11px] text-slate-400">{book.bookPublisher}</p>
            )}
          </div>
          <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
            읽는 중
          </span>
        </div>
      </div>

      {/* Notes panel — fills remaining space */}
      <div className="flex-1">
        <ReadingNotePanel
          notes={notes}
          onAdd={onAddNote}
          onDelete={onDeleteNote}
        />
      </div>

      {/* Start AI chat button — fixed at bottom, centered */}
      <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-slate-100 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/95">
        <button
          onClick={onStartChat}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-brand-500/30 transition-all hover:from-brand-700 hover:to-brand-600 active:scale-[0.98]"
        >
          <Sparkles size={17} />
          다 읽었어요, AI 북챗 시작
        </button>
      </div>
    </div>
  );
}
