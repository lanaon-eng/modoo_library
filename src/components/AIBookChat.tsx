import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Search, BookOpen, ArrowRight, ArrowLeft, X, Send,
  Sparkles, Loader2, BookMarked, Globe, Bookmark, Check,
  StickyNote, Trash2, MessageCircle, Star, Palette,
} from 'lucide-react';
import type { SearchBook, Category, ChatCard, ChatMessage, ReadingNote, NoteType } from '@/types';
import { fetchPersonaReply, generateChatCards } from '@/lib/chatApi';
import { searchBooks } from '@/lib/search';
import { CoverImage } from '@/components/CoverImage';
import { ReadingNotePanel } from '@/components/ReadingNotePanel';

type Props = {
  onSave: (data: SaveData) => void;
  existingBookTitles: string[];
  wishlistTitles: Set<string>;
  onToggleWishlist: (book: SearchBook) => void;
  readingNotes: ReadingNote[];
  onAddNote: (bookTitle: string, bookAuthor: string | null, content: string, noteType: NoteType) => void;
  onDeleteNote: (id: string) => void;
  getNotesForBook: (bookTitle: string) => ReadingNote[];
  presetBook?: SearchBook | null;
  onPresetConsumed?: () => void;
  onAddCurrentlyReading?: (book: SearchBook) => void;
  isCurrentlyReading?: (bookTitle: string) => boolean;
  fetchChatHistory: (bookTitle: string) => Promise<ChatMessage[]>;
  saveChatMessage: (bookTitle: string, role: 'user' | 'character', content: string, category?: string) => Promise<string | null>;
  deleteChatHistory: (bookTitle: string) => Promise<boolean>;
  hasChatHistory: (bookTitle: string) => Promise<boolean>;
};

export type SaveData = {
  book: SearchBook;
  category: Category;
  chatCards: ChatCard[];
  userReview: string;
  rating: number;
  isPublished: boolean;
};

type Step = 'search' | 'category' | 'chat' | 'cards' | 'save';

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: '국어', label: '국어', emoji: '📖' },
  { id: '사회', label: '사회', emoji: '🌍' },
  { id: '과학기술', label: '과학기술', emoji: '🔬' },
  { id: '수학', label: '수학', emoji: '🔢' },
  { id: '도덕', label: '도덕', emoji: '🤝' },
  { id: '예능', label: '예능', emoji: '🎨' },
  { id: '영어', label: '영어', emoji: '🔤' },
];

const CARD_COLORS = [
  { id: 'brand', gradient: 'from-brand-600 to-brand-800', label: '브랜드', swatch: 'bg-brand-500' },
  { id: 'ocean', gradient: 'from-cyan-600 to-blue-800', label: '오션', swatch: 'bg-cyan-500' },
  { id: 'sunset', gradient: 'from-orange-500 to-rose-700', label: '선셋', swatch: 'bg-orange-500' },
  { id: 'forest', gradient: 'from-emerald-600 to-green-800', label: '포레스트', swatch: 'bg-emerald-500' },
  { id: 'slate', gradient: 'from-slate-700 to-slate-950', label: '슬레이트', swatch: 'bg-slate-600' },
  { id: 'plum', gradient: 'from-fuchsia-600 to-purple-800', label: '플럼', swatch: 'bg-fuchsia-500' },
];

let msgIdCounter = 0;
function makeMsgId() {
  return `msg-${++msgIdCounter}-${Date.now()}`;
}

export function AIBookChat({ onSave, existingBookTitles, wishlistTitles, onToggleWishlist, readingNotes, onAddNote, onDeleteNote, getNotesForBook, presetBook, onPresetConsumed, onAddCurrentlyReading, isCurrentlyReading, fetchChatHistory, saveChatMessage, deleteChatHistory, hasChatHistory }: Props) {
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedBook, setSelectedBook] = useState<SearchBook | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [hasHistoryMap, setHasHistoryMap] = useState<Record<string, boolean>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resuming, setResuming] = useState(false);

  // Handle preset book from library ("읽는 중" → AI 챗)
  useEffect(() => {
    if (presetBook) {
      setSelectedBook(presetBook);
      setStep('category');
      onPresetConsumed?.();
    }
  }, [presetBook]);

  // Check which search results have existing chat history
  const checkHistoryForResults = useCallback(async (books: SearchBook[]) => {
    const checks = await Promise.all(
      books.map(async (b) => {
        const has = await hasChatHistory(b.title);
        return [b.title, has] as const;
      })
    );
    const map: Record<string, boolean> = {};
    for (const [title, has] of checks) map[title] = has;
    setHasHistoryMap((prev) => ({ ...prev, ...map }));
  }, [hasChatHistory]);

  useEffect(() => {
    if (results.length > 0) {
      checkHistoryForResults(results);
    }
  }, [results, checkHistoryForResults]);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [userTurns, setUserTurns] = useState(0);
  const [canComplete, setCanComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatStartedRef = useRef(false);

  // Card gen state
  const [chatCards, setChatCards] = useState<ChatCard[]>([]);
  const [generatingCards, setGeneratingCards] = useState(false);
  const [userReview, setUserReview] = useState('');
  const [saving, setSaving] = useState(false);
  const [cardColor, setCardColor] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  // Search debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await searchBooks(query);
        setResults(res);
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [query]);

  // Auto-start chat when entering chat step
  useEffect(() => {
    if (step !== 'chat' || !selectedBook || !selectedCategory) return;
    if (chatStartedRef.current) return;
    chatStartedRef.current = true;

    const bookNotes = getNotesForBook(selectedBook.title);
    const category = selectedCategory;

    (async () => {
      setTyping(true);
      const existing = await fetchChatHistory(selectedBook.title);
      if (existing.length > 0) {
        setResuming(true);
        setMessages(existing);
        setUserTurns(existing.filter((m) => m.role === 'user').length);
        setCanComplete(existing.filter((m) => m.role === 'user').length >= 2);
        setTyping(false);
        setResuming(false);
        return;
      }
      fetchPersonaReply(
        selectedBook.title,
        selectedBook.authors.join(', '),
        selectedBook.contents,
        [],
        false,
        bookNotes
      )
        .then(async (reply) => {
          setTyping(false);
          const msgId = makeMsgId();
          setMessages([{ id: msgId, role: 'character', text: reply }]);
          await saveChatMessage(selectedBook.title, 'character', reply, category);
        })
        .catch(() => {
          setTyping(false);
          setMessages([{ id: makeMsgId(), role: 'character', text: '잠시 연결이 원활하지 않아요. 다시 시도해주세요.' }]);
        });
    })();
  }, [step, selectedBook, selectedCategory]);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const handleSelectBook = (book: SearchBook) => {
    setSelectedBook(book);
    setStep('category');
  };

  const handleConfirmCategory = () => {
    if (selectedBook && selectedCategory) {
      chatStartedRef.current = false;
      setMessages([]);
      setUserTurns(0);
      setCanComplete(false);
      setStep('chat');
    }
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || !selectedBook || !selectedCategory) return;
    const userMsg: ChatMessage = { id: makeMsgId(), role: 'user', text: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setTyping(true);

    const nextTurn = userTurns + 1;
    setUserTurns(nextTurn);

    saveChatMessage(selectedBook.title, 'user', text.trim(), selectedCategory);

    const bookNotes = getNotesForBook(selectedBook.title);
    fetchPersonaReply(
      selectedBook.title,
      selectedBook.authors.join(', '),
      selectedBook.contents,
      newMessages,
      false,
      bookNotes
    )
      .then(async (reply) => {
        setTyping(false);
        setMessages((prev) => [...prev, { id: makeMsgId(), role: 'character', text: reply }]);
        await saveChatMessage(selectedBook.title, 'character', reply, selectedCategory);
        if (nextTurn >= 2) setCanComplete(true);
      })
      .catch(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: makeMsgId(), role: 'character', text: '잠시 연결이 원활하지 않아요. 다시 시도해주세요.' },
        ]);
      });
  };

  const handleComplete = () => {
    if (!selectedBook) return;
    const closingText = '좋은 대화였어요! 우리가 나눈 이야기를 카드로 만들어볼까요?';
    const finalMessages = [...messages, { id: makeMsgId(), role: 'character' as const, text: closingText }];
    setMessages(finalMessages);
    saveChatMessage(selectedBook.title, 'character', closingText, selectedCategory ?? undefined);
    setStep('cards');
    setGeneratingCards(true);

    const bookNotes = getNotesForBook(selectedBook.title);
    generateChatCards(
      selectedBook.title,
      selectedBook.authors.join(', '),
      selectedBook.contents,
      finalMessages,
      bookNotes
    )
      .then((cards) => {
        setChatCards(cards);
        setGeneratingCards(false);
        setStep('save');
      })
      .catch(() => {
        setChatCards([
          { title: '핵심 메시지', content: selectedBook.contents?.slice(0, 60) || '이 책에서 가장 중요한 메시지를 곰곰이 생각해보세요.', emoji: '💡' },
          { title: '나의 통찰', content: '대화를 통해 새롭게 발견한 나의 생각을 기록해요.', emoji: '🤔' },
        ]);
        setGeneratingCards(false);
        setStep('save');
      });
  };

  const handleSave = (isPublished: boolean) => {
    if (!selectedBook || !selectedCategory) return;
    setSaving(true);
    onSave({
      book: selectedBook,
      category: selectedCategory,
      chatCards: chatCards.map((c, i) => ({ ...c, color: CARD_COLORS[cardColor].id })),
      userReview: userReview.trim(),
      rating,
      isPublished,
    });
  };

  const resetAll = () => {
    setStep('search');
    setSelectedBook(null);
    setSelectedCategory(null);
    setMessages([]);
    setInput('');
    setUserTurns(0);
    setCanComplete(false);
    setChatCards([]);
    setUserReview('');
    setQuery('');
    setResults([]);
    setSearched(false);
    setShowNotes(false);
    setShowDeleteConfirm(false);
    setResuming(false);
    setCardColor(0);
    setRating(0);
    setHoverRating(0);
    chatStartedRef.current = false;
  };

  const handleDeleteHistory = async () => {
    if (!selectedBook) return;
    await deleteChatHistory(selectedBook.title);
    setHasHistoryMap((prev) => { const m = { ...prev }; delete m[selectedBook.title]; return m; });
    setShowDeleteConfirm(false);
    resetAll();
  };

  // --- SEARCH STEP ---
  if (step === 'search') {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900">
          <Search size={18} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            placeholder="책 제목을 검색하세요"
            className="w-full bg-transparent text-[14px] font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
        </div>

        <div className="mt-4">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-[13px] font-medium">검색 중...</p>
            </div>
          )}
          {!loading && !searched && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-300 dark:text-slate-600">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <BookOpen size={28} strokeWidth={1.5} />
              </div>
              <p className="text-[13px] font-medium">책을 검색하고 AI 북챗을 시작하세요</p>
            </div>
          )}
          {!loading && searched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
              <BookOpen size={32} strokeWidth={1.5} />
              <p className="text-[13px] font-medium">검색 결과가 없어요</p>
            </div>
          )}
          {!loading && results.length > 0 && (
            <ul className="space-y-2.5">
              {results.map((book) => {
                const exists = existingBookTitles.some((t) => t === book.title);
                const inWishlist = wishlistTitles.has(book.title);
                return (
                  <li key={book.id} className="flex items-center gap-2">
                    <button
                      onClick={() => handleSelectBook(book)}
                      className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-100/80 bg-white p-2.5 text-left transition-all hover:border-brand-400 hover:shadow-card dark:border-slate-800/70 dark:bg-slate-900 dark:hover:border-brand-500"
                    >
                      <BookThumb book={book} />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[13.5px] font-bold">{book.title}</h3>
                        <p className="mt-0.5 truncate text-[11.5px] text-slate-500 dark:text-slate-400">
                          {book.authors.join(', ')} · {book.publisher}
                        </p>
                        {hasHistoryMap[book.title] && (
                          <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                            <MessageCircle size={10} />
                            대화 이어하기
                          </span>
                        )}
                      </div>
                      {exists && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:bg-slate-800">보유</span>
                      )}
                    </button>
                    <button
                      onClick={() => onToggleWishlist(book)}
                      aria-label="보관함"
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-90 ${
                        inWishlist
                          ? 'border-brand-500 bg-brand-50 text-brand-500 dark:bg-brand-900/20'
                          : 'border-slate-200 bg-white text-slate-400 hover:border-brand-400 hover:text-brand-500 dark:border-slate-700 dark:bg-slate-900'
                      }`}
                    >
                      {inWishlist ? <Check size={18} /> : <Bookmark size={18} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  // --- CATEGORY STEP ---
  if (step === 'category' && selectedBook) {
    return (
      <div className="px-4 py-4">
        <BookHeader book={selectedBook} />

        {showNotes && (
          <div className="mt-4">
            <ReadingNotePanel
              notes={getNotesForBook(selectedBook.title)}
              onAdd={(content, noteType) => onAddNote(selectedBook.title, selectedBook.authors.join(', ') || null, content, noteType)}
              onDelete={onDeleteNote}
            />
          </div>
        )}

        <div className={`mt-5 ${showNotes ? 'hidden' : ''}`}>
          <p className="mb-3 text-[13px] font-bold">과목 선택</p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center gap-1 rounded-2xl border py-3 transition-all ${
                  selectedCategory === cat.id
                    ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
                    : 'border-slate-200/70 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600 dark:border-slate-800/70 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[12px] font-semibold">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={`mt-5 flex gap-2.5 ${showNotes ? 'hidden' : ''}`}>
          <button
            onClick={() => setShowNotes(true)}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 px-5 py-3.5 text-[13px] font-bold text-slate-600 transition-all hover:border-brand-400 hover:text-brand-600 active:scale-95 dark:border-slate-700 dark:text-slate-300"
          >
            <StickyNote size={16} />
            읽기 노트
            {getNotesForBook(selectedBook.title).length > 0 && (
              <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-900/30">
                {getNotesForBook(selectedBook.title).length}
              </span>
            )}
          </button>
          <button
            onClick={handleConfirmCategory}
            disabled={!selectedCategory}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-brand-500/30 transition-all hover:from-brand-700 hover:to-brand-600 active:scale-95 disabled:opacity-40"
          >
            대화 시작하기
            <ArrowRight size={17} />
          </button>
        </div>

        {onAddCurrentlyReading && (
          <div className={`mt-2.5 ${showNotes ? 'hidden' : ''}`}>
            <button
              onClick={() => onAddCurrentlyReading(selectedBook)}
              disabled={isCurrentlyReading?.(selectedBook.title)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 py-3 text-[12px] font-bold text-slate-500 transition-all hover:border-brand-400 hover:text-brand-600 active:scale-95 disabled:opacity-40 dark:border-slate-700 dark:text-slate-400"
            >
              <BookMarked size={15} />
              {isCurrentlyReading?.(selectedBook.title) ? '읽는 중인 책에 추가됨' : '읽는 중인 책에 추가'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- CHAT STEP ---
  if (step === 'chat' && selectedBook) {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 128px)' }}>
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <button
            onClick={() => { setStep('category'); chatStartedRef.current = false; setMessages([]); }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <BookThumbSmall book={selectedBook} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold">
              {selectedBook.title}
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {resuming ? '대화 기록 불러오는 중...' : 'AI와 책 이야기 나누는 중'}
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
            aria-label="대화 기록 삭제"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition-all ${
              showNotes
                ? 'bg-brand-500 text-white'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <StickyNote size={13} />
            노트
            {getNotesForBook(selectedBook.title).length > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${showNotes ? 'bg-white/20' : 'bg-brand-100 text-brand-600 dark:bg-brand-900/30'}`}>
                {getNotesForBook(selectedBook.title).length}
              </span>
            )}
          </button>
        </div>

        {/* Reading notes panel */}
        {showNotes && (
          <div className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
            <ReadingNotePanel
              notes={getNotesForBook(selectedBook.title)}
              onAdd={(content, noteType) => onAddNote(selectedBook.title, selectedBook.authors.join(', ') || null, content, noteType)}
              onDelete={onDeleteNote}
            />
          </div>
        )}

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="flex items-center justify-between gap-3 bg-red-50 px-4 py-2.5 dark:bg-red-950/30">
            <p className="text-[12px] font-bold text-red-600 dark:text-red-400">대화 기록을 삭제할까요?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg px-3 py-1.5 text-[12px] font-bold text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                취소
              </button>
              <button
                onClick={handleDeleteHistory}
                className="rounded-lg bg-red-500 px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        )}

        {/* Complete banner */}
        {canComplete && (
          <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-white animate-fade-in">
            <Sparkles size={15} />
            <button onClick={handleComplete} className="text-[13px] font-bold hover:opacity-90">
              대화 완료하고 카드 만들기
            </button>
          </div>
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4 no-scrollbar dark:bg-slate-950">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === 'character' ? (
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div className="max-w-[78%]">
                    <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[13px] leading-relaxed shadow-card dark:bg-slate-800">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="max-w-[78%] rounded-2xl rounded-tr-md bg-brand-500 px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-card">
                    {msg.text}
                  </div>
                </div>
              )}
            </div>
          ))}
          {typing && (
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-card dark:bg-slate-800">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms] dark:bg-slate-500" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:150ms] dark:bg-slate-500" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:300ms] dark:bg-slate-500" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 px-3 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="메시지를 입력하세요..."
              className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-medium outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white transition-all hover:bg-brand-600 active:scale-95 disabled:opacity-40"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- CARDS GENERATING STEP ---
  if (step === 'cards') {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20">
        <Loader2 size={32} className="animate-spin text-brand-500" />
        <p className="mt-4 text-[14px] font-bold">카드뉴스 생성 중...</p>
        <p className="mt-1 text-[12px] text-slate-400">대화 내용을 바탕으로 카드를 만들고 있어요</p>
      </div>
    );
  }

  // --- SAVE STEP ---
  if (step === 'save' && selectedBook) {
    const allCards: ChatCard[] = [
      { title: selectedBook.title, content: selectedBook.authors.join(', '), emoji: '📖' },
      ...chatCards,
    ];
    const activeColor = CARD_COLORS[cardColor];

    return (
      <div className="px-4 py-4">
        <div className="mb-4 flex items-center gap-2">
          <button onClick={resetAll} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
          <h2 className="text-[16px] font-bold">카드 미리보기</h2>
        </div>

        {/* Card preview carousel */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {allCards.map((card, i) => (
            <div
              key={i}
              className="relative aspect-[3/4] w-64 shrink-0 overflow-hidden rounded-2xl bg-slate-900 shadow-lg"
            >
              {i === 0 ? (
                <>
                  {(() => {
                    const urls = selectedBook.coverUrls?.length ? selectedBook.coverUrls : selectedBook.thumbnail ? [selectedBook.thumbnail] : [];
                    return urls.length > 0 ? (
                      <CoverImage
                        urls={urls}
                        alt={selectedBook.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        fallback={<div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-950" />}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-950" />
                    );
                  })()}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-4">
                    <p className="text-[15px] font-bold text-white">{card.title}</p>
                    <p className="text-[12px] text-white/70">{card.content}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${activeColor.gradient}`} />
                  <div className="absolute inset-0 flex flex-col justify-between p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{card.emoji}</span>
                      <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                        Card {i + 1}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-white">{card.title}</h3>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/90">{card.content}</p>
                    </div>
                    <div className="h-px w-full bg-white/20" />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-center gap-1.5">
          {allCards.map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>

        {/* Card color picker */}
        <div className="mt-5">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Palette size={14} className="text-slate-500 dark:text-slate-400" />
            <p className="text-[13px] font-bold">카드 색상</p>
            <span className="text-[11px] font-medium text-slate-400">{activeColor.label}</span>
          </div>
          <div className="flex gap-2">
            {CARD_COLORS.map((color, i) => (
              <button
                key={color.id}
                onClick={() => setCardColor(i)}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90 ${
                  i === cardColor ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : ''
                }`}
                aria-label={color.label}
              >
                <span className={`h-7 w-7 rounded-full ${color.swatch}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Star rating */}
        <div className="mt-5">
          <div className="mb-2.5 flex items-center gap-1.5">
            <Star size={14} className="text-slate-500 dark:text-slate-400" />
            <p className="text-[13px] font-bold">이 책 별점</p>
            {rating > 0 && (
              <span className="text-[11px] font-medium text-slate-400">{rating}점</span>
            )}
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(rating === star ? 0 : star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform active:scale-90"
                aria-label={`${star}점`}
              >
                <Star
                  size={32}
                  className={`transition-colors ${
                    (hoverRating || rating) >= star
                      ? 'fill-amber-400 text-amber-400'
                      : 'fill-slate-100 text-slate-300 dark:fill-slate-800 dark:text-slate-700'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* User review input */}
        <div className="mt-5">
          <p className="mb-2 text-[13px] font-bold">한두 줄 평</p>
          <textarea
            value={userReview}
            onChange={(e) => setUserReview(e.target.value)}
            placeholder="이 책에 대한 느낌을 짧게 적어보세요"
            rows={3}
            maxLength={200}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[13px] font-medium outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900"
          />
          <p className="mt-1 text-right text-[11px] text-slate-400">{userReview.length}/200</p>
        </div>

        {/* Save / Publish buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 py-3.5 text-[14px] font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <BookMarked size={17} />
            나의 서재에 저장
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-brand-500/30 transition-all hover:from-brand-700 hover:to-brand-600 active:scale-95 disabled:opacity-50"
          >
            <Globe size={17} />
            모두의 서재에 공유
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function BookHeader({ book }: { book: SearchBook }) {
  const coverUrls = book.coverUrls?.length ? book.coverUrls : book.thumbnail ? [book.thumbnail] : [];
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-card dark:border-slate-800/70 dark:bg-slate-900">
      <div className="flex items-center gap-3 p-3.5">
        {coverUrls.length > 0 ? (
          <CoverImage
            urls={coverUrls}
            alt={book.title}
            className="h-20 w-14 shrink-0 rounded-md object-cover"
            fallback={<div className="flex h-20 w-14 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800"><BookOpen size={20} className="text-slate-300" /></div>}
          />
        ) : (
          <div className="flex h-20 w-14 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800">
            <BookOpen size={20} className="text-slate-300" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold">{book.title}</h3>
          <p className="mt-0.5 truncate text-[12px] text-slate-500 dark:text-slate-400">
            {book.authors.join(', ')}
          </p>
          {book.publisher && (
            <p className="mt-0.5 truncate text-[11px] text-slate-400">{book.publisher}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function BookThumb({ book }: { book: SearchBook }) {
  const coverUrls = book.coverUrls?.length ? book.coverUrls : book.thumbnail ? [book.thumbnail] : [];
  if (coverUrls.length > 0) {
    return (
      <CoverImage
        urls={coverUrls}
        alt={book.title}
        className="h-16 w-12 shrink-0 rounded-md object-cover"
        fallback={<div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-300 dark:bg-slate-700 dark:text-slate-500"><BookOpen size={18} strokeWidth={1.5} /></div>}
      />
    );
  }
  return (
    <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-300 dark:bg-slate-700 dark:text-slate-500">
      <BookOpen size={18} strokeWidth={1.5} />
    </div>
  );
}

function BookThumbSmall({ book }: { book: SearchBook }) {
  const coverUrls = book.coverUrls?.length ? book.coverUrls : book.thumbnail ? [book.thumbnail] : [];
  if (coverUrls.length > 0) {
    return (
      <CoverImage
        urls={coverUrls}
        alt={book.title}
        className="h-full w-full object-cover"
        fallback={<span className="text-lg">📖</span>}
      />
    );
  }
  return <span className="text-lg">📖</span>;
}
