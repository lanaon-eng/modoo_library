import { useState, useRef, useEffect } from 'react';
import {
  Search, BookOpen, ArrowRight, ArrowLeft, X, Send,
  Sparkles, Loader2, BookMarked, Globe,
} from 'lucide-react';
import type { SearchBook, Category, ChatCard, ChatMessage } from '@/types';
import { fetchPersonaReply, generateChatCards } from '@/lib/chatApi';
import { searchBooks } from '@/lib/search';
import { CoverImage } from '@/components/CoverImage';

type Props = {
  onSave: (data: SaveData) => void;
  existingBookTitles: string[];
};

export type SaveData = {
  book: SearchBook;
  category: Category;
  chatCards: ChatCard[];
  userReview: string;
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
];

let msgIdCounter = 0;
function makeMsgId() {
  return `msg-${++msgIdCounter}-${Date.now()}`;
}

export function AIBookChat({ onSave, existingBookTitles }: Props) {
  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedBook, setSelectedBook] = useState<SearchBook | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

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

    setTyping(true);
    fetchPersonaReply(
      selectedBook.title,
      selectedBook.authors.join(', '),
      selectedBook.contents,
      []
    )
      .then((reply) => {
        setTyping(false);
        setMessages([{ id: makeMsgId(), role: 'character', text: reply }]);
      })
      .catch(() => {
        setTyping(false);
        setMessages([{ id: makeMsgId(), role: 'character', text: '이 책에 대해 어떤 점이 가장 기억에 남았나요? 자유롭게 이야기해보세요.' }]);
      });
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

    fetchPersonaReply(
      selectedBook.title,
      selectedBook.authors.join(', '),
      selectedBook.contents,
      newMessages
    )
      .then((reply) => {
        setTyping(false);
        setMessages((prev) => [...prev, { id: makeMsgId(), role: 'character', text: reply }]);
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
    setStep('cards');
    setGeneratingCards(true);

    generateChatCards(
      selectedBook.title,
      selectedBook.authors.join(', '),
      selectedBook.contents,
      finalMessages
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
      chatCards: chatCards,
      userReview: userReview.trim(),
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
    chatStartedRef.current = false;
  };

  // --- SEARCH STEP ---
  if (step === 'search') {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-ink-50 px-3.5 py-2.5 transition-colors focus-within:border-brand-400 focus-within:bg-white dark:border-ink-700 dark:bg-ink-800 dark:focus-within:bg-ink-900">
          <Search size={18} className="text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            placeholder="책 제목을 검색하세요"
            className="w-full bg-transparent text-[14px] font-medium text-ink-900 outline-none placeholder:text-ink-400 dark:text-ink-100"
          />
        </div>

        <div className="mt-4">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-ink-400">
              <Loader2 size={24} className="animate-spin" />
              <p className="text-[13px] font-medium">검색 중...</p>
            </div>
          )}
          {!loading && !searched && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-300 dark:text-ink-600">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800">
                <BookOpen size={28} strokeWidth={1.5} />
              </div>
              <p className="text-[13px] font-medium">책을 검색하고 AI 북챗을 시작하세요</p>
            </div>
          )}
          {!loading && searched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-ink-400">
              <BookOpen size={32} strokeWidth={1.5} />
              <p className="text-[13px] font-medium">검색 결과가 없어요</p>
            </div>
          )}
          {!loading && results.length > 0 && (
            <ul className="space-y-2.5">
              {results.map((book) => {
                const exists = existingBookTitles.some((t) => t === book.title);
                return (
                  <li key={book.id}>
                    <button
                      onClick={() => handleSelectBook(book)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-ink-200/70 bg-white p-2.5 text-left transition-all hover:border-brand-400 hover:shadow-md dark:border-ink-800/70 dark:bg-ink-900 dark:hover:border-brand-500"
                    >
                      <BookThumb book={book} />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[13.5px] font-bold">{book.title}</h3>
                        <p className="mt-0.5 truncate text-[11.5px] text-ink-500 dark:text-ink-400">
                          {book.authors.join(', ')} · {book.publisher}
                        </p>
                      </div>
                      {exists && (
                        <span className="rounded-full bg-ink-100 px-2.5 py-1 text-[10px] font-bold text-ink-400 dark:bg-ink-800">보유</span>
                      )}
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

        <div className="mt-5">
          <p className="mb-3 text-[13px] font-bold">과목 선택</p>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center gap-1 rounded-2xl border py-3 transition-all ${
                  selectedCategory === cat.id
                    ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400'
                    : 'border-ink-200/70 bg-white text-ink-600 hover:border-ink-300 dark:border-ink-800/70 dark:bg-ink-900 dark:text-ink-300'
                }`}
              >
                <span className="text-xl">{cat.emoji}</span>
                <span className="text-[12px] font-semibold">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleConfirmCategory}
          disabled={!selectedCategory}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-600 active:scale-95 disabled:opacity-40"
        >
          대화 시작하기
          <ArrowRight size={17} />
        </button>
      </div>
    );
  }

  // --- CHAT STEP ---
  if (step === 'chat' && selectedBook) {
    return (
      <div className="flex flex-col" style={{ height: 'calc(100vh - 128px)' }}>
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 dark:border-ink-800">
          <button
            onClick={() => { setStep('category'); chatStartedRef.current = false; setMessages([]); }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
            <BookThumbSmall book={selectedBook} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold">
              {selectedBook.title}
            </p>
            <p className="truncate text-[11px] text-ink-400">
              AI와 책 이야기 나누는 중
            </p>
          </div>
        </div>

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
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-ink-50 px-4 py-4 no-scrollbar dark:bg-ink-950">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === 'character' ? (
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <div className="max-w-[78%]">
                    <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm dark:bg-ink-800">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <div className="max-w-[78%] rounded-2xl rounded-tr-md bg-brand-500 px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-sm">
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
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm dark:bg-ink-800">
                <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:0ms] dark:bg-ink-500" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:150ms] dark:bg-ink-500" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:300ms] dark:bg-ink-500" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-ink-100 px-3 py-3 dark:border-ink-800">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="메시지를 입력하세요..."
              className="flex-1 rounded-full border border-ink-200 bg-ink-50 px-4 py-2.5 text-[13px] font-medium outline-none transition-colors focus:border-brand-400 focus:bg-white dark:border-ink-700 dark:bg-ink-800 dark:focus:bg-ink-900"
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
        <p className="mt-1 text-[12px] text-ink-400">대화 내용을 바탕으로 카드를 만들고 있어요</p>
      </div>
    );
  }

  // --- SAVE STEP ---
  if (step === 'save' && selectedBook) {
    const allCards: ChatCard[] = [
      { title: selectedBook.title, content: selectedBook.authors.join(', '), emoji: '📖' },
      ...chatCards,
    ];

    return (
      <div className="px-4 py-4">
        <div className="mb-4 flex items-center gap-2">
          <button onClick={resetAll} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800">
            <X size={18} />
          </button>
          <h2 className="text-[16px] font-bold">카드 미리보기</h2>
        </div>

        {/* Card preview carousel */}
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {allCards.map((card, i) => (
            <div
              key={i}
              className="relative aspect-[3/4] w-64 shrink-0 overflow-hidden rounded-2xl bg-ink-900 shadow-lg"
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
                        fallback={<div className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink-950" />}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink-950" />
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
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-800" />
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
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-ink-200 dark:bg-ink-700" />
          ))}
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
            className="w-full resize-none rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3 text-[13px] font-medium outline-none transition-colors focus:border-brand-400 focus:bg-white dark:border-ink-700 dark:bg-ink-800 dark:focus:bg-ink-900"
          />
          <p className="mt-1 text-right text-[11px] text-ink-400">{userReview.length}/200</p>
        </div>

        {/* Save / Publish buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink-200 py-3.5 text-[14px] font-bold text-ink-700 transition-all hover:border-ink-300 hover:bg-ink-50 active:scale-95 dark:border-ink-700 dark:text-ink-200 dark:hover:bg-ink-800 disabled:opacity-50"
          >
            <BookMarked size={17} />
            나의 서재에 저장
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 text-[14px] font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-600 active:scale-95 disabled:opacity-50"
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
    <div className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white dark:border-ink-800/70 dark:bg-ink-900">
      <div className="flex items-center gap-3 p-3.5">
        {coverUrls.length > 0 ? (
          <CoverImage
            urls={coverUrls}
            alt={book.title}
            className="h-20 w-14 shrink-0 rounded-md object-cover"
            fallback={<div className="flex h-20 w-14 items-center justify-center rounded-md bg-ink-100 dark:bg-ink-800"><BookOpen size={20} className="text-ink-300" /></div>}
          />
        ) : (
          <div className="flex h-20 w-14 items-center justify-center rounded-md bg-ink-100 dark:bg-ink-800">
            <BookOpen size={20} className="text-ink-300" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-bold">{book.title}</h3>
          <p className="mt-0.5 truncate text-[12px] text-ink-500 dark:text-ink-400">
            {book.authors.join(', ')}
          </p>
          {book.publisher && (
            <p className="mt-0.5 truncate text-[11px] text-ink-400">{book.publisher}</p>
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
        fallback={<div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-300 dark:bg-ink-700 dark:text-ink-500"><BookOpen size={18} strokeWidth={1.5} /></div>}
      />
    );
  }
  return (
    <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-300 dark:bg-ink-700 dark:text-ink-500">
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
