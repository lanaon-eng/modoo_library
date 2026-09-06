import { useState, useMemo } from 'react';
import { Heart, BookOpen, ChevronLeft, ChevronRight, Search, X, UserPlus, Check } from 'lucide-react';
import type { Book } from '@/types';
import { BookCoverDisplay } from './BookCoverDisplay';

type Props = {
  books: Book[];
  likedIds: Set<string>;
  onToggleLike: (postId: string) => void;
  followingIds: Set<string>;
  onToggleFollow: (userId: string) => void;
  currentUserId: string;
};

export function PublicFeed({ books, likedIds, onToggleLike, followingIds, onToggleFollow, currentUserId }: Props) {
  const [query, setQuery] = useState('');
  const [feedScope, setFeedScope] = useState<'all' | 'following'>('all');

  const scopeFiltered = useMemo(() => {
    if (feedScope === 'following') {
      return books.filter((b) => followingIds.has(b.authorId ?? '') && b.authorId !== currentUserId);
    }
    return books;
  }, [books, feedScope, followingIds, currentUserId]);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scopeFiltered;
    return scopeFiltered.filter((b) => {
      const titleMatch = b.title.toLowerCase().includes(q);
      const authorMatch = b.authors.some((a) => a.toLowerCase().includes(q));
      return titleMatch || authorMatch;
    });
  }, [scopeFiltered, query]);

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
      {/* Scope toggle + search */}
      <div className="sticky top-0 z-10 -mx-4 space-y-2.5 bg-ink-50/95 px-4 py-2 backdrop-blur-sm dark:bg-ink-950/95">
        <div className="flex gap-1.5">
          <ScopeChip label="전체" active={feedScope === 'all'} onClick={() => setFeedScope('all')} />
          <ScopeChip label="팔로잉" active={feedScope === 'following'} onClick={() => setFeedScope('following')} />
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="책 제목 또는 저자를 검색하세요"
            className="w-full rounded-full border border-ink-200 bg-white py-2.5 pl-9 pr-9 text-[13px] font-medium text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-100 dark:placeholder:text-ink-600"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition-colors hover:text-ink-600 dark:hover:text-ink-200"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {query && (
          <p className="px-1 text-[11px] font-medium text-ink-400">
            '{query}' 검색 결과 {filteredBooks.length}개
          </p>
        )}
      </div>

      {feedScope === 'following' && filteredBooks.length === 0 && !query ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-100 text-ink-300 dark:bg-ink-800 dark:text-ink-600">
            <UserPlus size={28} strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-[15px] font-bold">팔로잉 피드가 비어있어요</h2>
          <p className="mt-1.5 text-[12px] text-ink-400">다른 사용자를 팔로우하면 여기에 기록이 나타나요</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-100 text-ink-300 dark:bg-ink-800 dark:text-ink-600">
            <Search size={28} strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-[15px] font-bold">검색 결과가 없어요</h2>
          <p className="mt-1.5 text-[12px] text-ink-400">다른 책 제목이나 저자로 검색해보세요</p>
        </div>
      ) : (
        filteredBooks.map((book) => (
          <FeedPostCard
            key={book.id}
            book={book}
            isLiked={likedIds.has(book.id)}
            onToggleLike={() => onToggleLike(book.id)}
            isFollowing={book.authorId ? followingIds.has(book.authorId) : false}
            onToggleFollow={() => book.authorId && onToggleFollow(book.authorId)}
            isOwnPost={book.authorId === currentUserId}
          />
        ))
      )}
    </div>
  );
}

function ScopeChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-all ${
        active
          ? 'bg-brand-500 text-white shadow-sm'
          : 'border border-ink-200 bg-white text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'
      }`}
    >
      {label}
    </button>
  );
}

function FeedPostCard({
  book,
  isLiked,
  onToggleLike,
  isFollowing,
  onToggleFollow,
  isOwnPost,
}: {
  book: Book;
  isLiked: boolean;
  onToggleLike: () => void;
  isFollowing: boolean;
  onToggleFollow: () => void;
  isOwnPost: boolean;
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
          <img src={book.authorAvatar} alt={book.authorName || '사용자'} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-[11px] font-bold text-white">
            {(book.authorName || '?').charAt(0)}
          </div>
        )}
        <div className="flex-1 leading-tight">
          <p className="text-[13px] font-semibold">{book.authorName || '독서러'}</p>
          <p className="text-[11px] text-ink-400">
            {new Date(book.addedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {book.category && (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
            {book.category}
          </span>
        )}
        {!isOwnPost && (
          <button
            onClick={onToggleFollow}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all active:scale-90 ${
              isFollowing
                ? 'bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-400'
                : 'bg-brand-500 text-white hover:bg-brand-600'
            }`}
          >
            {isFollowing ? <Check size={12} /> : <UserPlus size={12} />}
            {isFollowing ? '팔로잉' : '팔로우'}
          </button>
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

      {/* Footer */}
      <div className="px-4 py-3.5">
        <h3 className="text-[15px] font-bold leading-snug">{book.title}</h3>
        <p className="mt-0.5 text-[12px] font-medium text-ink-500 dark:text-ink-400">
          {book.authors.join(', ') || '저자 미상'}
        </p>
        {book.userReview && (
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-600 dark:text-ink-300">{book.userReview}</p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <button onClick={onToggleLike} className="flex items-center gap-1.5 transition-all active:scale-90">
            <Heart size={18} className={isLiked ? 'fill-red-500 text-red-500' : 'text-ink-400'} />
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
