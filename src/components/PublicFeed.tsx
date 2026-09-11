import { useState, useMemo } from 'react';
import { Heart, BookOpen, Search, X, UserPlus, Check, Clock, Star } from 'lucide-react';
import type { Book } from '@/types';
import { BookCardCarousel } from './BookCardCarousel';

type Props = {
  books: Book[];
  likedIds: Set<string>;
  onToggleLike: (postId: string) => void;
  followingIds: Set<string>;
  pendingFollowingIds: Set<string>;
  onToggleFollow: (userId: string) => void;
  currentUserId: string;
};

export function PublicFeed({ books, likedIds, onToggleLike, followingIds, pendingFollowingIds, onToggleFollow, currentUserId }: Props) {
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
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
          <BookOpen size={36} strokeWidth={1.5} />
        </div>
        <h2 className="mt-5 text-[17px] font-bold">아직 공유된 기록이 없어요</h2>
        <p className="mt-1.5 text-[13px] text-slate-400">AI 북챗에서 기록을 만들고 공유해보세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 px-4 py-4">
      {/* Scope toggle + search */}
      <div className="sticky top-0 z-10 -mx-4 space-y-2.5 bg-slate-50/95 px-4 py-2 backdrop-blur-sm dark:bg-slate-950/95">
        <div className="flex gap-1.5">
          <ScopeChip label="전체" active={feedScope === 'all'} onClick={() => setFeedScope('all')} />
          <ScopeChip label="팔로잉" active={feedScope === 'following'} onClick={() => setFeedScope('following')} />
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="책 제목 또는 저자를 검색하세요"
            className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-9 text-[13px] font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {query && (
          <p className="px-1 text-[11px] font-medium text-slate-400">
            '{query}' 검색 결과 {filteredBooks.length}개
          </p>
        )}
      </div>

      {feedScope === 'following' && filteredBooks.length === 0 && !query ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
            <UserPlus size={28} strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-[15px] font-bold">팔로잉 피드가 비어있어요</h2>
          <p className="mt-1.5 text-[12px] text-slate-400">다른 사용자를 팔로우하면 여기에 기록이 나타나요</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
            <Search size={28} strokeWidth={1.5} />
          </div>
          <h2 className="mt-4 text-[15px] font-bold">검색 결과가 없어요</h2>
          <p className="mt-1.5 text-[12px] text-slate-400">다른 책 제목이나 저자로 검색해보세요</p>
        </div>
      ) : (
        filteredBooks.map((book) => (
          <FeedPostCard
            key={book.id}
            book={book}
            isLiked={likedIds.has(book.id)}
            onToggleLike={() => onToggleLike(book.id)}
            isFollowing={book.authorId ? followingIds.has(book.authorId) : false}
            isPending={book.authorId ? pendingFollowingIds.has(book.authorId) : false}
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
          : 'border border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
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
  isPending,
  onToggleFollow,
  isOwnPost,
}: {
  book: Book;
  isLiked: boolean;
  onToggleLike: () => void;
  isFollowing: boolean;
  isPending: boolean;
  onToggleFollow: () => void;
  isOwnPost: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-card dark:border-slate-800/70 dark:bg-slate-900">
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
          <p className="text-[11px] text-slate-400">
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
                ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                : isPending
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
            }`}
          >
            {isFollowing ? <Check size={12} /> : isPending ? <Clock size={12} /> : <UserPlus size={12} />}
            {isFollowing ? '팔로잉' : isPending ? '대기중' : '팔로우'}
          </button>
        )}
      </div>

      {/* Card carousel */}
      <div className="mt-3">
        <BookCardCarousel book={book} />
      </div>

      {/* Footer */}
      <div className="px-4 py-3.5">
        <h3 className="text-[15px] font-bold leading-snug">{book.title}</h3>
        <p className="mt-0.5 text-[12px] font-medium text-slate-500 dark:text-slate-400">
          {book.authors.join(', ') || '저자 미상'}
        </p>
        {book.rating && book.rating > 0 && (
          <div className="mt-2 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={13}
                className={star <= (book.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300 dark:fill-slate-800 dark:text-slate-700'}
              />
            ))}
          </div>
        )}
        {book.userReview && (
          <p className="mt-2 text-[12.5px] leading-relaxed text-slate-600 dark:text-slate-300">{book.userReview}</p>
        )}
        <div className="mt-3 flex items-center gap-3">
          <button onClick={onToggleLike} className="flex items-center gap-1.5 transition-all active:scale-90">
            <Heart size={18} className={isLiked ? 'fill-accent-500 text-accent-500' : 'text-slate-400'} />
            <span className={`text-[12px] font-bold ${isLiked ? 'text-accent-500' : 'text-slate-400'}`}>
              {book.likesCount ?? 0}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

