import { BookOpen, Heart, Globe, Lock } from 'lucide-react';
import type { Book, ReadingCard } from '@/types';
import { BookCard } from './BookCard';
import { BookCoverDisplay } from './BookCoverDisplay';
import { CoverImage } from './CoverImage';

type Props = {
  books: Book[];
  cards: ReadingCard[];
  onRemove: (id: string) => void;
  onAdd: () => void;
  onChat: (book: Book) => void;
  onCardClick: (card: ReadingCard) => void;
  scope: 'all' | 'mine';
};

export function BookFeed({
  books,
  cards,
  onRemove,
  onAdd,
  onChat,
  onCardClick,
  scope,
}: Props) {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100 text-ink-300 dark:bg-ink-800 dark:text-ink-600">
          <BookOpen size={36} strokeWidth={1.5} />
        </div>
        <h2 className="mt-5 text-[17px] font-bold">
          {scope === 'all' ? '아직 공유된 기록이 없어요' : '서재가 비어있어요'}
        </h2>
        {scope === 'mine' && (
          <button
            onClick={onAdd}
            className="mt-6 flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-brand-500/30 transition-all hover:scale-[1.03] active:scale-95"
          >
            책 등록하기
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-4">
      {scope === 'mine' && cards.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen size={15} className="text-brand-500" />
            <h2 className="text-[14px] font-bold">독서 카드</h2>
            <span className="text-[11px] text-ink-400">{cards.length}장</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => onCardClick(card)}
                className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-ink-900 transition-all hover:scale-[1.03] hover:shadow-lg active:scale-95"
              >
                {(() => {
                  const urls = card.coverUrls?.length
                    ? card.coverUrls
                    : card.thumbnail
                      ? [card.thumbnail]
                      : [];
                  return urls.length > 0 ? (
                    <CoverImage
                      urls={urls}
                      alt={card.bookTitle}
                      className="absolute inset-0 h-full w-full object-cover"
                      fallback={<div className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink-950" />}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink-950" />
                  );
                })()}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-between p-2.5">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px]">{card.characterEmoji}</span>
                  </div>
                  <div>
                    <p className="line-clamp-3 text-[10.5px] font-bold leading-tight text-white">
                      {card.insight}
                    </p>
                    <p className="mt-1 truncate text-[8.5px] text-white/60">
                      {card.bookTitle}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2">
          <BookOpen size={15} className="text-ink-400" />
          <h2 className="text-[14px] font-bold">{books.length}권</h2>
        </div>
        <div className="space-y-4">
          {books.map((book) =>
            scope === 'all' ? (
              <PublicBookCard key={book.id} book={book} />
            ) : (
              <BookCard
                key={book.id}
                book={book}
                onRemove={onRemove}
                onChat={onChat}
              />
            )
          )}
        </div>
      </section>

      {scope === 'mine' && cards.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 px-6 py-8 text-center dark:border-ink-800">
          <p className="text-[12.5px] font-semibold text-ink-500 dark:text-ink-400">
            AI 북챗에서 캐릭터와 대화하고 카드를 만들어보세요
          </p>
        </div>
      )}
    </div>
  );
}

function PublicBookCard({ book }: { book: Book }) {
  const coverUrls = book.coverUrls?.length
    ? book.coverUrls
    : book.thumbnail
      ? [book.thumbnail]
      : [];

  return (
    <article className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-sm dark:border-ink-800/70 dark:bg-ink-900">
      <div className="flex items-center gap-2.5 px-4 pt-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-[11px] font-bold text-white">
          {book.title.charAt(0)}
        </div>
        <div className="flex-1 leading-tight">
          <p className="text-[13px] font-semibold">{book.title}</p>
          <p className="text-[11px] text-ink-400">
            {book.authors.join(', ') || '저자 미상'}
          </p>
        </div>
        {book.category && (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
            {book.category}
          </span>
        )}
      </div>

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

      <div className="px-4 py-3.5">
        {book.userReview && (
          <p className="text-[12.5px] leading-relaxed text-ink-700 dark:text-ink-200">
            {book.userReview}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-ink-400">
            <Heart size={13} />
            {book.likesCount ?? 0}
          </div>
          {book.isPublished ? (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-brand-500">
              <Globe size={11} />
              공유됨
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-semibold text-ink-400">
              <Lock size={11} />
              비공개
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
