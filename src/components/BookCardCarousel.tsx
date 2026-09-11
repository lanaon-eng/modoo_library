import { useState, useRef, useCallback, useEffect } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';
import type { Book } from '@/types';
import { BookCoverDisplay } from '@/components/BookCoverDisplay';

type FeedCard =
  | { type: 'cover'; title: string; subtitle: string }
  | { type: 'summary'; title: string; content: string }
  | { type: 'insight'; title: string; content: string; emoji?: string };

function getCardsForBook(book: Book): FeedCard[] {
  const cards: FeedCard[] = [
    { type: 'cover', title: book.title, subtitle: book.authors.join(', ') || '저자 미상' },
  ];

  const summaryContent = book.contents || '';
  if (summaryContent) {
    cards.push({ type: 'summary', title: '책 소개', content: summaryContent });
  }

  const insightCard = book.chatCards?.find(
    (c) => c.title.includes('통찰') || c.title.includes('나의') || c.title.includes('대화')
  );
  if (insightCard) {
    cards.push({ type: 'insight', title: insightCard.title, content: insightCard.content, emoji: insightCard.emoji });
  } else if (book.chatCards && book.chatCards.length > 0) {
    const lastCard = book.chatCards[book.chatCards.length - 1];
    cards.push({ type: 'insight', title: lastCard.title, content: lastCard.content, emoji: lastCard.emoji });
  } else if (book.userReview) {
    cards.push({ type: 'insight', title: '한줄평', content: book.userReview, emoji: '✍️' });
  }

  return cards;
}

export function BookCardCarousel({ book }: { book: Book }) {
  const cards = getCardsForBook(book);
  const coverUrls = book.coverUrls?.length ? book.coverUrls : book.thumbnail ? [book.thumbnail] : [];

  const [currentIdx, setCurrentIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const scrollToIndex = useCallback((idx: number) => {
    const container = containerRef.current;
    if (!container) return;
    const target = container.children[idx] as HTMLElement;
    if (target) {
      container.scrollTo({ left: target.offsetLeft - container.offsetLeft, behavior: 'smooth' });
    }
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || isDraggingRef.current) return;
    const cardWidth = container.offsetWidth;
    const idx = Math.round(container.scrollLeft / cardWidth);
    if (idx !== currentIdx && idx >= 0 && idx < cards.length) {
      setCurrentIdx(idx);
    }
  }, [currentIdx, cards.length]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    scrollLeftRef.current = container.scrollLeft;
    container.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container || !isDraggingRef.current) return;
    const delta = e.clientX - startXRef.current;
    container.scrollLeft = scrollLeftRef.current - delta;
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="flex h-56 snap-x snap-mandatory overflow-x-auto no-scrollbar select-none"
        style={{ touchAction: 'pan-x' }}
      >
        {cards.map((card, idx) => (
          <div key={idx} className="relative h-full w-full shrink-0 snap-center overflow-hidden">
            {card.type === 'cover' && (
              <CoverCard title={card.title} subtitle={card.subtitle} coverUrls={coverUrls} />
            )}
            {card.type === 'summary' && (
              <SummaryCard title={card.title} content={card.content} />
            )}
            {card.type === 'insight' && (
              <InsightCard title={card.title} content={card.content} emoji={card.emoji} bookTitle={book.title} />
            )}
          </div>
        ))}
      </div>

      {/* Indicators */}
      {cards.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={`h-1.5 rounded-full transition-all ${i === currentIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CoverCard({ title, subtitle, coverUrls }: { title: string; subtitle: string; coverUrls: string[] }) {
  return (
    <>
      {coverUrls.length > 0 ? (
        <BookCoverDisplay
          urls={coverUrls}
          alt={title}
          fallback={<div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-950" />}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-950" />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 pt-16">
        <h2 className="text-[20px] font-bold leading-snug text-white drop-shadow-lg">{title}</h2>
        <p className="mt-1 text-[13px] text-white/70">{subtitle}</p>
      </div>
    </>
  );
}

function SummaryCard({ title, content }: { title: string; content: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = content.length > 120;

  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950" />
      <div className="absolute inset-0 flex flex-col justify-between p-5">
        <div className="flex items-center gap-2">
          <BookOpen size={20} className="text-white/70" />
          <span className="text-[13px] font-bold text-white/80">{title}</span>
        </div>
        <div className="flex-1 flex items-center py-4">
          <p
            className={`text-[14px] leading-relaxed text-white/90 ${!expanded && isLong ? 'line-clamp-4' : ''}`}
          >
            {content}
          </p>
        </div>
        <div>
          <div className="h-px w-full bg-white/15" />
          <div className="mt-2 flex items-center justify-between">
            <span className="truncate text-[12px] font-bold text-white/60">책 소개</span>
            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/80 backdrop-blur-md transition-all hover:bg-white/20"
              >
                {expanded ? '접기' : '더 보기'}
                <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function InsightCard({ title, content, emoji, bookTitle }: { title: string; content: string; emoji?: string; bookTitle: string }) {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900" />
      {/* Decorative quote marks */}
      <div className="absolute left-4 top-2 font-serif text-[80px] leading-none text-white/15 select-none">
        &ldquo;
      </div>
      <div className="absolute bottom-8 right-4 font-serif text-[80px] leading-none text-white/15 select-none rotate-180">
        &ldquo;
      </div>

      <div className="absolute inset-0 flex flex-col justify-between p-5">
        <div className="flex items-center gap-2">
          {emoji && <span className="text-2xl">{emoji}</span>}
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            {title}
          </span>
        </div>

        {/* Quote-style insight text */}
        <div className="flex-1 flex items-center justify-center px-2 py-6">
          <blockquote className="relative text-center">
            <p className="text-[15px] font-medium leading-[1.7] text-white/95">
              {content}
            </p>
          </blockquote>
        </div>

        <div>
          <div className="h-px w-full bg-white/20" />
          <p className="mt-2 truncate text-[12px] font-bold text-white/70">{bookTitle}</p>
        </div>
      </div>
    </>
  );
}
