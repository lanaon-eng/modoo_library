import { useState, useMemo } from 'react';
import { BookOpen, ChevronDown, Send, Gift, Bookmark, X } from 'lucide-react';
import type { Book, Category, Recommendation, WishlistBook } from '@/types';
import { CoverImage } from '@/components/CoverImage';

type Props = {
  books: Book[];
  onRemove: (id: string) => void;
  onAdd: () => void;
  onTogglePublish: (id: string, isPublished: boolean) => void;
  onBookClick: (book: Book) => void;
  nickname: string;
  avatarUrl: string | null;
  followerCount: number;
  followingCount: number;
  pendingFollowerCount: number;
  recommendations: Recommendation[];
  unreadRecCount: number;
  onMarkAllRecsRead: () => void;
  onRecommend: (book: Book) => void;
  wishlist: WishlistBook[];
  onRemoveFromWishlist: (id: string) => void;
  onOpenFollowList: (tab: 'following' | 'followers') => void;
};

const CATEGORIES: Category[] = ['국어', '사회', '과학기술', '수학', '도덕', '예능', '영어'];

export function MyLibrary({
  books,
  onRemove,
  onAdd,
  onTogglePublish,
  onBookClick,
  nickname,
  avatarUrl,
  followerCount,
  followingCount,
  pendingFollowerCount,
  recommendations,
  unreadRecCount,
  onMarkAllRecsRead,
  onRecommend,
  wishlist,
  onRemoveFromWishlist,
  onOpenFollowList,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [recSectionOpen, setRecSectionOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    books.forEach((b) => years.add(new Date(b.addedAt).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (selectedCategory !== 'all' && b.category !== selectedCategory) return false;
      const date = new Date(b.addedAt);
      if (selectedYear !== 'all' && date.getFullYear() !== selectedYear) return false;
      if (selectedMonth !== 'all' && date.getMonth() + 1 !== selectedMonth) return false;
      return true;
    });
  }, [books, selectedCategory, selectedYear, selectedMonth]);

  return (
    <div className="px-4 py-4">
      {/* Profile card */}
      <div className="mb-5 rounded-2xl border border-slate-100/80 bg-white p-4 shadow-card dark:border-slate-800/70 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt={nickname} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 text-[18px] font-bold text-white">
              {nickname.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-[16px] font-bold">{nickname}</h2>
            <p className="text-[11px] text-slate-400">나의 독서 기록</p>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-bold leading-none">{books.length}</p>
            <p className="text-[10px] text-slate-400">권</p>
          </div>
        </div>
        <div className="mt-3 flex gap-6 border-t border-slate-100 pt-3 dark:border-slate-800">
          <button onClick={() => onOpenFollowList('following')} className="text-left transition-opacity hover:opacity-70">
            <span className="text-[15px] font-bold">{followingCount}</span>
            <span className="ml-1 text-[11px] text-slate-400">팔로잉</span>
          </button>
          <button onClick={() => onOpenFollowList('followers')} className="text-left transition-opacity hover:opacity-70">
            <span className="text-[15px] font-bold">{followerCount}</span>
            <span className="ml-1 text-[11px] text-slate-400">팔로워</span>
            {pendingFollowerCount > 0 && (
              <span className="ml-1 rounded-full bg-accent-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                {pendingFollowerCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Wishlist section */}
      {wishlist.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => setWishlistOpen(!wishlistOpen)}
            className="flex w-full items-center justify-between rounded-xl bg-slate-100 px-4 py-3 dark:bg-slate-800/60"
          >
            <div className="flex items-center gap-2">
              <Bookmark size={16} className="text-slate-500 dark:text-slate-300" />
              <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">나중에 읽을 책</span>
              <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                {wishlist.length}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${wishlistOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {wishlistOpen && (
            <div className="mt-2 space-y-2">
              {wishlist.map((item) => {
                const urls = item.coverUrls?.length ? item.coverUrls : item.thumbnail ? [item.thumbnail] : [];
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100/80 bg-white p-3 shadow-card dark:border-slate-800/70 dark:bg-slate-900"
                  >
                    {urls.length > 0 ? (
                      <img src={urls[0]} alt={item.bookTitle} className="h-14 w-10 rounded object-cover" />
                    ) : (
                      <div className="flex h-14 w-10 items-center justify-center rounded bg-slate-200 dark:bg-slate-700">
                        <BookOpen size={16} className="text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">{item.bookTitle}</p>
                      <p className="truncate text-[11px] text-slate-400">{item.bookAuthor}</p>
                      {item.bookContents && (
                        <p className="mt-1 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">{item.bookContents}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onRemoveFromWishlist(item.id)}
                      aria-label="보관함에서 삭제"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recommended books section */}
      {recommendations.length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => setRecSectionOpen(!recSectionOpen)}
            className="flex w-full items-center justify-between rounded-xl bg-brand-50 px-4 py-3 dark:bg-brand-900/20"
          >
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-brand-500" />
              <span className="text-[13px] font-bold text-brand-600 dark:text-brand-400">받은 추천</span>
              {unreadRecCount > 0 && (
                <span className="rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unreadRecCount}
                </span>
              )}
            </div>
            <ChevronDown
              size={16}
              className={`text-brand-500 transition-transform ${recSectionOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {recSectionOpen && (
            <div className="mt-2 space-y-2">
              {unreadRecCount > 0 && (
                <button
                  onClick={onMarkAllRecsRead}
                  className="float-right text-[11px] font-semibold text-brand-500"
                >
                  모두 읽음
                </button>
              )}
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    rec.isRead
                      ? 'border-slate-100/80 bg-white dark:border-slate-800/70 dark:bg-slate-900'
                      : 'border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-900/10'
                  }`}
                >
                  {rec.coverUrls.length > 0 ? (
                    <img src={rec.coverUrl || rec.coverUrls[0]} alt={rec.bookTitle} className="h-14 w-10 rounded object-cover" />
                  ) : (
                    <div className="flex h-14 w-10 items-center justify-center rounded bg-slate-200 dark:bg-slate-700">
                      <BookOpen size={16} className="text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{rec.bookTitle}</p>
                    <p className="truncate text-[11px] text-slate-400">{rec.bookAuthor}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      {rec.senderName}님이 추천
                    </p>
                    {rec.message && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">"{rec.message}"</p>
                    )}
                  </div>
                  {!rec.isRead && <div className="h-2 w-2 shrink-0 rounded-full bg-accent-500" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter bar */}
      <div className="mb-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => { setYearOpen(!yearOpen); setMonthOpen(false); }}
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-500 transition-colors hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {selectedYear === 'all' ? '연도' : `${selectedYear}년`}
              <ChevronDown size={13} />
            </button>
            {yearOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-24 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-card dark:border-slate-700 dark:bg-slate-900">
                <button
                  onClick={() => { setSelectedYear('all'); setYearOpen(false); }}
                  className={`block w-full px-3 py-1.5 text-left text-[12px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    selectedYear === 'all' ? 'text-brand-500' : 'text-slate-500 dark:text-slate-300'
                  }`}
                >
                  전체
                </button>
                {availableYears.map((y) => (
                  <button
                    key={y}
                    onClick={() => { setSelectedYear(y); setYearOpen(false); }}
                    className={`block w-full px-3 py-1.5 text-left text-[12px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      selectedYear === y ? 'text-brand-500' : 'text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    {y}년
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setMonthOpen(!monthOpen)}
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-500 transition-colors hover:border-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {selectedMonth === 'all' ? '월' : `${selectedMonth}월`}
              <ChevronDown size={13} />
            </button>
            {monthOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-20 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-card dark:border-slate-700 dark:bg-slate-900 no-scrollbar">
                <button
                  onClick={() => { setSelectedMonth('all'); setMonthOpen(false); }}
                  className={`block w-full px-3 py-1.5 text-left text-[12px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    selectedMonth === 'all' ? 'text-brand-500' : 'text-slate-500 dark:text-slate-300'
                  }`}
                >
                  전체
                </button>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setSelectedMonth(m); setMonthOpen(false); }}
                    className={`block w-full px-3 py-1.5 text-left text-[12px] font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                      selectedMonth === m ? 'text-brand-500' : 'text-slate-500 dark:text-slate-300'
                    }`}
                  >
                    {m}월
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <CategoryChip label="전체" active={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')} />
          {CATEGORIES.map((cat) => (
            <CategoryChip key={cat} label={cat} active={selectedCategory === cat} onClick={() => setSelectedCategory(cat)} />
          ))}
        </div>
      </div>

      {/* Book gallery */}
      <div className="mb-3 flex items-center gap-2">
        <BookOpen size={15} className="text-slate-400" />
        <h2 className="text-[14px] font-bold">내가 읽은 책 {filteredBooks.length}권</h2>
      </div>

      {filteredBooks.length === 0 ? (
        books.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
              <BookOpen size={36} strokeWidth={1.5} />
            </div>
            <h2 className="mt-5 text-[17px] font-bold">서재가 비어있어요</h2>
            <button
              onClick={onAdd}
              className="mt-6 flex items-center gap-1.5 rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:scale-[1.03] active:scale-95"
            >
              AI 북챗 시작하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center dark:border-slate-800">
            <p className="text-[12.5px] font-semibold text-slate-400">필터 조건에 맞는 책이 없어요</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filteredBooks.map((book) => {
            const coverUrls = book.coverUrls?.length ? book.coverUrls : book.thumbnail ? [book.thumbnail] : [];
            const cardCount = (book.chatCards?.length ?? 0) + 1;
            return (
              <button
                key={book.id}
                onClick={() => onBookClick(book)}
                className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-slate-900 shadow-card transition-all hover:scale-[1.03] hover:shadow-card-hover active:scale-95"
              >
                {coverUrls.length > 0 ? (
                  <CoverImage
                    urls={coverUrls}
                    alt={book.title}
                    className="absolute inset-0 h-full w-full object-cover"
                    fallback={<div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-950" />}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between">
                    {book.category && (
                      <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-md">
                        {book.category}
                      </span>
                    )}
                    {book.isPublished && (
                      <span className="flex items-center gap-0.5 rounded-full bg-brand-500/80 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-md">
                        공유됨
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="line-clamp-2 text-[12px] font-bold leading-tight text-white drop-shadow-lg">{book.title}</p>
                    <p className="mt-0.5 truncate text-[10px] text-white/60">{book.authors.join(', ')}</p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-bold text-white/80 backdrop-blur-md">
                        {cardCount}장
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all ${
        active
          ? 'bg-brand-500 text-white shadow-sm'
          : 'border border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}
