import { useState, useMemo } from 'react';
import { BookOpen, Trash2, Globe, Lock, ChevronDown, Send, Gift } from 'lucide-react';
import type { Book, Category, ReadingCard, Recommendation } from '@/types';
import { BookCoverDisplay } from '@/components/BookCoverDisplay';
import { CoverImage } from '@/components/CoverImage';

type Props = {
  books: Book[];
  cards: ReadingCard[];
  onRemove: (id: string) => void;
  onAdd: () => void;
  onTogglePublish: (id: string, isPublished: boolean) => void;
  onCardClick: (card: ReadingCard) => void;
  nickname: string;
  avatarUrl: string | null;
  followerCount: number;
  followingCount: number;
  recommendations: Recommendation[];
  unreadRecCount: number;
  onMarkAllRecsRead: () => void;
  onRecommend: (book: Book) => void;
};

const CATEGORIES: Category[] = ['국어', '사회', '과학기술', '수학', '도덕', '예능'];

export function MyLibrary({
  books,
  cards,
  onRemove,
  onAdd,
  onTogglePublish,
  onCardClick,
  nickname,
  avatarUrl,
  followerCount,
  followingCount,
  recommendations,
  unreadRecCount,
  onMarkAllRecsRead,
  onRecommend,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');
  const [yearOpen, setYearOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [recSectionOpen, setRecSectionOpen] = useState(false);

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
      <div className="mb-5 rounded-2xl border border-ink-200/70 bg-white p-4 shadow-sm dark:border-ink-800/70 dark:bg-ink-900">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt={nickname} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-[18px] font-bold text-white">
              {nickname.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-[16px] font-bold">{nickname}</h2>
            <p className="text-[11px] text-ink-400">나의 독서 기록</p>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-bold leading-none">{books.length}</p>
            <p className="text-[10px] text-ink-400">권</p>
          </div>
        </div>
        <div className="mt-3 flex gap-6 border-t border-ink-100 pt-3 dark:border-ink-800">
          <div>
            <span className="text-[15px] font-bold">{followingCount}</span>
            <span className="ml-1 text-[11px] text-ink-400">팔로잉</span>
          </div>
          <div>
            <span className="text-[15px] font-bold">{followerCount}</span>
            <span className="ml-1 text-[11px] text-ink-400">팔로워</span>
          </div>
        </div>
      </div>

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
                <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
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
                      ? 'border-ink-200/70 bg-white dark:border-ink-800/70 dark:bg-ink-900'
                      : 'border-brand-300 bg-brand-50/50 dark:border-brand-700 dark:bg-brand-900/10'
                  }`}
                >
                  {rec.coverUrl.length > 0 ? (
                    <img src={rec.coverUrl || rec.coverUrls[0]} alt={rec.bookTitle} className="h-14 w-10 rounded object-cover" />
                  ) : (
                    <div className="flex h-14 w-10 items-center justify-center rounded bg-ink-200 dark:bg-ink-700">
                      <BookOpen size={16} className="text-ink-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">{rec.bookTitle}</p>
                    <p className="truncate text-[11px] text-ink-400">{rec.bookAuthor}</p>
                    <p className="mt-0.5 text-[10px] text-ink-500 dark:text-ink-400">
                      {rec.senderName}님이 추천
                    </p>
                    {rec.message && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-ink-500 dark:text-ink-400">"{rec.message}"</p>
                    )}
                  </div>
                  {!rec.isRead && <div className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reading cards section */}
      {cards.length > 0 && (
        <section className="mb-5">
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
                  const urls = card.coverUrls?.length ? card.coverUrls : card.thumbnail ? [card.thumbnail] : [];
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
                    <p className="line-clamp-3 text-[10.5px] font-bold leading-tight text-white">{card.insight}</p>
                    <p className="mt-1 truncate text-[8.5px] text-white/60">{card.bookTitle}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Filter bar */}
      <div className="mb-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => { setYearOpen(!yearOpen); setMonthOpen(false); }}
              className="flex items-center gap-1 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300"
            >
              {selectedYear === 'all' ? '연도' : `${selectedYear}년`}
              <ChevronDown size={13} />
            </button>
            {yearOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-24 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg dark:border-ink-700 dark:bg-ink-900">
                <button
                  onClick={() => { setSelectedYear('all'); setYearOpen(false); }}
                  className={`block w-full px-3 py-1.5 text-left text-[12px] font-medium transition-colors hover:bg-ink-50 dark:hover:bg-ink-800 ${
                    selectedYear === 'all' ? 'text-brand-500' : 'text-ink-600 dark:text-ink-300'
                  }`}
                >
                  전체
                </button>
                {availableYears.map((y) => (
                  <button
                    key={y}
                    onClick={() => { setSelectedYear(y); setYearOpen(false); }}
                    className={`block w-full px-3 py-1.5 text-left text-[12px] font-medium transition-colors hover:bg-ink-50 dark:hover:bg-ink-800 ${
                      selectedYear === y ? 'text-brand-500' : 'text-ink-600 dark:text-ink-300'
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
              className="flex items-center gap-1 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-600 transition-colors hover:border-brand-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300"
            >
              {selectedMonth === 'all' ? '월' : `${selectedMonth}월`}
              <ChevronDown size={13} />
            </button>
            {monthOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-20 overflow-y-auto rounded-xl border border-ink-200 bg-white py-1 shadow-lg dark:border-ink-700 dark:bg-ink-900 no-scrollbar">
                <button
                  onClick={() => { setSelectedMonth('all'); setMonthOpen(false); }}
                  className={`block w-full px-3 py-1.5 text-left text-[12px] font-medium transition-colors hover:bg-ink-50 dark:hover:bg-ink-800 ${
                    selectedMonth === 'all' ? 'text-brand-500' : 'text-ink-600 dark:text-ink-300'
                  }`}
                >
                  전체
                </button>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setSelectedMonth(m); setMonthOpen(false); }}
                    className={`block w-full px-3 py-1.5 text-left text-[12px] font-medium transition-colors hover:bg-ink-50 dark:hover:bg-ink-800 ${
                      selectedMonth === m ? 'text-brand-500' : 'text-ink-600 dark:text-ink-300'
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

      {/* Book count */}
      <div className="mb-3 flex items-center gap-2">
        <BookOpen size={15} className="text-ink-400" />
        <h2 className="text-[14px] font-bold">{filteredBooks.length}권</h2>
      </div>

      {/* Book list */}
      {filteredBooks.length === 0 ? (
        books.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ink-100 text-ink-300 dark:bg-ink-800 dark:text-ink-600">
              <BookOpen size={36} strokeWidth={1.5} />
            </div>
            <h2 className="mt-5 text-[17px] font-bold">서재가 비어있어요</h2>
            <button
              onClick={onAdd}
              className="mt-6 flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-brand-500/30 transition-all hover:scale-[1.03] active:scale-95"
            >
              AI 북챗 시작하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 px-6 py-10 text-center dark:border-ink-800">
            <p className="text-[12.5px] font-semibold text-ink-400">필터 조건에 맞는 책이 없어요</p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          {filteredBooks.map((book) => {
            const coverUrls = book.coverUrls?.length ? book.coverUrls : book.thumbnail ? [book.thumbnail] : [];
            return (
              <article
                key={book.id}
                className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-ink-800/70 dark:bg-ink-900"
              >
                <div className="flex items-center gap-2.5 px-4 pt-3.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-[11px] font-bold text-white">
                    나
                  </div>
                  <div className="flex-1 leading-tight">
                    <p className="text-[13px] font-semibold">{book.title}</p>
                    <p className="text-[11px] text-ink-400">
                      {new Date(book.addedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  {book.category && (
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                      {book.category}
                    </span>
                  )}
                  {confirmingId === book.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { onRemove(book.id); setConfirmingId(null); }}
                        className="rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-red-600"
                      >
                        삭제
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink-500 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800"
                      >
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onRecommend(book)}
                        aria-label="추천"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-900/20"
                      >
                        <Send size={15} />
                      </button>
                      <button
                        onClick={() => setConfirmingId(book.id)}
                        aria-label="삭제"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-red-500 dark:hover:bg-ink-800"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
                  <h3 className="text-[15px] font-bold leading-snug">{book.title}</h3>
                  <p className="mt-0.5 text-[12px] font-medium text-ink-500 dark:text-ink-400">
                    {book.authors.join(', ')}
                  </p>
                  {book.userReview && (
                    <p className="mt-2 text-[12.5px] leading-relaxed text-ink-600 dark:text-ink-300">{book.userReview}</p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-ink-100 px-4 py-3 dark:border-ink-800">
                  <div className="flex items-center gap-1.5">
                    {book.isPublished ? (
                      <>
                        <Globe size={14} className="text-brand-500" />
                        <span className="text-[12px] font-semibold text-brand-500">모두의 서재에 공유됨</span>
                      </>
                    ) : (
                      <>
                        <Lock size={14} className="text-ink-400" />
                        <span className="text-[12px] font-semibold text-ink-400">비공개</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => onTogglePublish(book.id, !book.isPublished)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      book.isPublished ? 'bg-brand-500' : 'bg-ink-200 dark:bg-ink-700'
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
              </article>
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
          : 'border border-ink-200 bg-white text-ink-600 hover:border-ink-300 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300'
      }`}
    >
      {label}
    </button>
  );
}
