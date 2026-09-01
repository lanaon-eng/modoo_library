import { useEffect, useRef, useState } from 'react';
import { X, Send, Sparkles, ArrowLeft } from 'lucide-react';
import type { Book } from '@/types';
import { CoverImage } from './CoverImage';
import {
  type CharacterRole,
  type ChatMessage,
  type CharacterProfile,
  getCharacter,
  getClosing,
} from '@/lib/chatScenario';
import { fetchCharacterReply } from '@/lib/chatApi';

type Props = {
  book: Book;
  open: boolean;
  onClose: () => void;
  onComplete: (book: Book, role: CharacterRole, messages: ChatMessage[]) => void;
};

const ROLE_TABS: { id: CharacterRole; label: string; emoji: string }[] = [
  { id: 'protagonist', label: '주인공', emoji: '🧑' },
  { id: 'villain', label: '악당/라이벌', emoji: '😈' },
  { id: 'helper', label: '조력자', emoji: '🧙' },
];

let msgIdCounter = 0;
function makeMsgId() {
  return `msg-${++msgIdCounter}-${Date.now()}`;
}

export function ChatModal({ book, open, onClose, onComplete }: Props) {
  const [role, setRole] = useState<CharacterRole | null>(null);
  const [character, setCharacter] = useState<CharacterProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [userTurns, setUserTurns] = useState(0);
  const [canComplete, setCanComplete] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset when opening
  useEffect(() => {
    if (open) {
      setRole(null);
      setCharacter(null);
      setMessages([]);
      setInput('');
      setUserTurns(0);
      setCanComplete(false);
      setTyping(false);
    }
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const selectRole = (r: CharacterRole) => {
    const char = getCharacter(book.title, r);
    setRole(r);
    setCharacter(char);
    setTyping(true);
    setMessages([]);
    setUserTurns(0);
    setCanComplete(false);
    // Greet via GPT
    fetchCharacterReply(book.title, book.contents, r, [])
      .then((reply) => {
        setTyping(false);
        setMessages([
          { id: makeMsgId(), role: 'character', text: reply, chips: char.chips },
        ]);
      })
      .catch(() => {
        setTyping(false);
        setMessages([
          { id: makeMsgId(), role: 'character', text: char.greeting, chips: char.chips },
        ]);
      });
  };

  const backToRoleSelect = () => {
    setRole(null);
    setCharacter(null);
    setMessages([]);
    setUserTurns(0);
    setCanComplete(false);
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || !character) return;
    const userMsg: ChatMessage = {
      id: makeMsgId(),
      role: 'user',
      text: text.trim(),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setTyping(true);

    const nextTurn = userTurns + 1;
    setUserTurns(nextTurn);

    fetchCharacterReply(book.title, book.contents, role!, newMessages)
      .then((reply) => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: makeMsgId(),
            role: 'character',
            text: reply,
          },
        ]);
        if (nextTurn >= 2) {
          setCanComplete(true);
        }
      })
      .catch(() => {
        setTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: makeMsgId(),
            role: 'character',
            text: '잠시 연결이 원활하지 않아요. 다시 시도해주세요.',
          },
        ]);
      });
  };

  const handleComplete = () => {
    if (!role) return;
    // Add closing message
    const closingText = getClosing(book.title);
    const finalMessages = [
      ...messages,
      { id: makeMsgId(), role: 'character' as const, text: closingText },
    ];
    setMessages(finalMessages);
    setTimeout(() => {
      onComplete(book, role, finalMessages);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Chat container */}
      <div className="relative flex h-[88vh] w-full max-w-md animate-slide-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-ink-900 sm:animate-scale-in sm:h-[80vh] sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3 dark:border-ink-800">
          {role && (
            <button
              onClick={backToRoleSelect}
              aria-label="캐릭터 선택으로"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-ink-100"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
            {(() => {
              const urls = book.coverUrls?.length
                ? book.coverUrls
                : book.thumbnail
                  ? [book.thumbnail]
                  : [];
              return urls.length > 0 ? (
                <CoverImage
                  urls={urls}
                  alt={book.title}
                  className="h-full w-full object-cover"
                  fallback={<span className="text-lg">📖</span>}
                />
              ) : (
                <span className="text-lg">📖</span>
              );
            })()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold">
              {character ? `${character.emoji} ${character.name}` : book.title}
            </p>
            <p className="truncate text-[11px] text-ink-400">
              {character ? '책 속 페르소나와 대화 중' : '캐릭터를 선택해주세요'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:hover:bg-ink-800 dark:hover:text-ink-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Complete button banner */}
        {canComplete && role && (
          <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-white animate-fade-in">
            <Sparkles size={15} />
            <button
              onClick={handleComplete}
              className="text-[13px] font-bold transition-opacity hover:opacity-90"
            >
              대화 완료하고 카드 만들기
            </button>
          </div>
        )}

        {/* Body */}
        {!role ? (
          // Role selection screen
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
            <div className="mb-2 text-4xl">🎭</div>
            <h2 className="text-[16px] font-bold">누구와 대화할까?</h2>
            <p className="mt-1.5 max-w-[260px] text-center text-[12.5px] leading-relaxed text-ink-500 dark:text-ink-400">
              책 속 페르소나를 골라보세요. 각자 다른 시선으로 질문을 던질 거예요.
            </p>
            <div className="mt-6 w-full space-y-3">
              {ROLE_TABS.map((tab) => {
                const char = getCharacter(book.title, tab.id);
                return (
                  <button
                    key={tab.id}
                    onClick={() => selectRole(tab.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-ink-200/70 bg-white p-3.5 text-left transition-all hover:scale-[1.02] hover:border-brand-400 hover:shadow-md dark:border-ink-800/70 dark:bg-ink-800/50 dark:hover:border-brand-500"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-ink-100 to-ink-200 text-2xl dark:from-ink-700 dark:to-ink-800">
                      {char.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold">{tab.label}</p>
                      <p className="text-[11.5px] text-ink-500 dark:text-ink-400">
                        {char.name}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-brand-500">
                      대화하기
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Chat screen
          <>
            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto bg-ink-50 px-4 py-4 no-scrollbar dark:bg-ink-950"
            >
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === 'character' ? (
                    <div className="flex items-start gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-base">
                        {character?.emoji}
                      </div>
                      <div className="max-w-[78%]">
                        <div className="rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm dark:bg-ink-800">
                          {msg.text}
                        </div>
                        {msg.chips && msg.chips.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {msg.chips.map((chip, i) => (
                              <button
                                key={i}
                                onClick={() => sendMessage(chip)}
                                className="rounded-full border border-brand-300 bg-brand-50 px-3 py-1.5 text-[12px] font-semibold text-brand-700 transition-all hover:scale-105 hover:bg-brand-100 dark:border-brand-700 dark:bg-brand-900/20 dark:text-brand-300 dark:hover:bg-brand-900/40"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        )}
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

              {/* Typing indicator */}
              {typing && (
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-base">
                    {character?.emoji}
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-white px-4 py-3 shadow-sm dark:bg-ink-800">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:0ms] dark:bg-ink-500" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:150ms] dark:bg-ink-500" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-ink-300 [animation-delay:300ms] dark:bg-ink-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="border-t border-ink-100 px-3 py-3 dark:border-ink-800">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 rounded-full border border-ink-200 bg-ink-50 px-4 py-2.5 text-[13px] font-medium outline-none transition-colors focus:border-brand-400 focus:bg-white dark:border-ink-700 dark:bg-ink-800 dark:focus:bg-ink-900"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  aria-label="전송"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white transition-all hover:bg-brand-600 active:scale-95 disabled:opacity-40"
                >
                  <Send size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
