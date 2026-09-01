import { useState } from 'react';
import { Heart, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Book } from '@/types';
import { BookCoverDisplay } from './BookCoverDisplay';

type Props = {
  books: Book[];
  likedIds: Set<string>;
  onToggleLike: (postId: string) => void;
};

export function PublicFeed({ books, likedIds, onToggleLike }: Props) {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100 text-ink-300 dark:bg-ink-800 dark:text-ink-600">
          <BookOpen size={36} strokeWidth={1.5} />
        </div>
        <h2 className="mt-5 text-[17px] font-bold">아직 공유된 기록이 없어요</h2>
        <p className="mt-1.5 text-[13px] text-ink-400">AI 북챗에서 기록을 만들고 공유해보세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 py-4">
      {books.map((book) => (
        <FeedPostCard
          key={book.id}
          book={book}
          isLiked={likedIds.has(book.id)}
          onToggleLike={() => onToggleLike(book.id)}
        />
      ))}
    </div>
  );
}

function FeedPostCard({
  book,
  isLiked,
  onToggleLike,
}: {
  book: Book;
  isLiked: boolean;
  onToggleLike: () => void;
}) {
  const [cardIdx, setCardIdx] = useState(0);
  const cards = getCardsForBook(book);
  const coverUrls = book.coverUrls?.length ? book.coverUrls : book.thumbnail ? [book.thumbnail] : [];

  const goNext = () => { if (cardIdx < cards.length - 1) setCardIdx(cardIdx + 1); };
  const goPrev = () => { if (cardIdx > 0) setCardIdx(cardIdx - 1); };

  const card = cards[cardIdx];

  return (
    <article className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-sm dark:border-ink-800/70 dark:bg-ink-900">
      {/* Author header */}
      <div className="flex items-center gap-2.5 px-4 pt-3.5">
        {book.authorAvatar ? (
          <img
            src={book.authorAvatar}
            alt={book.authorName || '사용자'}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-[11px] font-bold text-white">
            {(book.authorName || '?').charAt(0)}
          </div>
        )}
        <div className="flex-1 leading-tight">
          <p className="text-[13px] font-semibold">{book.authorName || '독서러'}</p>
          <p className="text-[11px] text-ink-400">
            {new Date(book.addedAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        {book.category && (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
            {book.category}
          </span>
        )}
      </div>

      {/* Card carousel */}
      <div className="relative mt-3 h-56 overflow-hidden bg-ink-900">
        {card.type === 'cover' ? (
          <>
            {coverUrls.length > 0 ? (
              <BookCoverDisplay
                urls={coverUrls}
                alt={book.title}
                fallback={<div className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink-950" />}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink-950" />
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 pt-16">
              <h2 className="text-[20px] font-bold leading-snug text-white drop-shadow-lg">{card.title}</h2>
              <p className="mt-1 text-[13px] text-white/70">{card.content}</p>
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-ink-900" />
            <div className="absolute inset-0 flex flex-col justify-between p-5">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{card.emoji}</span>
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                  {cardIdx + 1} / {cards.length}
                </span>
              </div>
              <div className="flex-1 flex items-center py-4">
                <div>
                  <h3 className="text-[18px] font-bold text-white">{card.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-white/90">{card.content}</p>
                </div>
              </div>
              <div>
                <div className="h-px w-full bg-white/20" />
                <p className="mt-2 truncate text-[12px] font-bold text-white/80">{book.title}</p>
              </div>
            </div>
          </>
        )}

        {/* Card pager dots */}
        {cards.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => setCardIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === cardIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

        {/* Nav arrows */}
        {cardIdx > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-1 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-all hover:bg-black/40"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {cardIdx < cards.length - 1 && (
          <button
            onClick={goNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition-all hover:bg-black/40"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>

      {/* Footer: book info + like */}
      <div className="px-4 py-3.5">
        <h3 className="text-[15px] font-bold leading-snug">{book.title}</h3>
        <p className="mt-0.5 text-[12px] font-medium text-ink-500 dark:text-ink-400">
          {book.authors.join(', ') || '저자 미상'}
        </p>
        {book.userReview && (
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-600 dark:text-ink-300">
            {book.userReview}
          </p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={onToggleLike}
            className="flex items-center gap-1.5 transition-all active:scale-90"
          >
            <Heart
              size={18}
              className={isLiked ? 'fill-red-500 text-red-500' : 'text-ink-400'}
            />
            <span className={`text-[12px] font-bold ${isLiked ? 'text-red-500' : 'text-ink-400'}`}>
              {book.likesCount ?? 0}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

type FeedCard = { type: 'cover' | 'content'; title: string; content: string; emoji?: string };

function getCardsForBook(book: Book): FeedCard[] {
  const cards: FeedCard[] = [
    { type: 'cover', title: book.title, content: book.authors.join(', ') },
  ];
  if (book.chatCards && book.chatCards.length > 0) {
    for (const c of book.chatCards) {
      cards.push({ type: 'content', title: c.title, content: c.content, emoji: c.emoji });
    }
  } else if (book.userReview) {
    cards.push({ type: 'content', title: '한줄평', content: book.userReview, emoji: '✍️' });
  }
  return cards;
}
