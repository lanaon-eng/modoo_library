import { forwardRef } from 'react';
import { Quote } from 'lucide-react';
import type { ReadingCard } from '@/types';
import { CoverImage } from './CoverImage';

type Props = {
  card: ReadingCard;
  nickname?: string;
};

export const ReadingCardView = forwardRef<HTMLDivElement, Props>(
  ({ card, nickname = '독서러' }, ref) => {
    return (
      <div
        ref={ref}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-ink-900"
        style={{ width: '300px' }}
      >
        {/* Book cover background */}
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

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-5">
          {/* Top: character badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-md">
              <span className="text-base">{card.characterEmoji}</span>
              <span className="text-[11px] font-bold text-white">
                {card.characterName}
              </span>
            </div>
          </div>

          {/* Middle: insight quote */}
          <div className="flex-1 flex items-center">
            <div className="w-full">
              <Quote
                size={28}
                className="mb-2 text-white/40"
                strokeWidth={2}
              />
              <p className="text-[17px] font-bold leading-snug text-white drop-shadow-lg">
                {card.insight}
              </p>
            </div>
          </div>

          {/* Bottom: book title + nickname */}
          <div className="space-y-2">
            <div className="h-px w-full bg-white/20" />
            <p className="truncate text-[13px] font-bold text-white">
              {card.bookTitle}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-white/70">
                {card.bookAuthor}
              </p>
              <p className="text-[11px] font-semibold text-white/80">
                @{nickname}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReadingCardView.displayName = 'ReadingCardView';
