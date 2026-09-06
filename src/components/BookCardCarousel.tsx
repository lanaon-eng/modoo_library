import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Book } from '@/types';
import { BookCoverDisplay } from '@/components/BookCoverDisplay';

type FeedCard = { type: 'cover' | 'content'; title: string; content: string; emoji?: string };

function getCardsForBook(book: Book): FeedCard[] {
  const cards: FeedCard[] = [{ type: 'cover', title: book.title, content: book.authors.join(', ') }];
  if (book.chatCards && book.chatCards.length > 0) {
    for (const c of book.chatCards) {
      cards.push({ type: 'content', title: c.title, content: c.content, emoji: c.emoji });
    }
  } else if (book.userReview) {
    cards.push({ type: 'content', title: '한줄평', content: book.userReview, emoji: '✍️' });
  }
  return cards;
}

export function BookCardCarousel({ book }: { book: Book }) {
  const [cardIdx, setCardIdx] = useState(0);
  const cards = getCardsForBook(book);
  const coverUrls = book.coverUrls?.length ? book.coverUrls : book.thumbnail ? [book.thumbnail] : [];

  const goNext = () => { if (cardIdx < cards.length - 1) setCardIdx(cardIdx + 1); };
  const goPrev = () => { if (cardIdx > 0) setCardIdx(cardIdx - 1); };

  const card = cards[cardIdx];

  return (
    <div className="relative h-56 overflow-hidden bg-slate-900">
      {card.type === 'cover' ? (
        <>
          {coverUrls.length > 0 ? (
            <BookCoverDisplay
              urls={coverUrls}
              alt={book.title}
              fallback={<div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-950" />}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-950" />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 pt-16">
            <h2 className="text-[20px] font-bold leading-snug text-white drop-shadow-lg">{card.title}</h2>
            <p className="mt-1 text-[13px] text-white/70">{card.content}</p>
          </div>
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900" />
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

      {cards.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setCardIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === cardIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      )}

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
  );
}
