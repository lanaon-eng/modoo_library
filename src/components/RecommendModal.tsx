import { useState, useEffect } from 'react';
import { X, Send, Loader2, CheckCircle } from 'lucide-react';
import type { FollowUser, Book } from '@/types';

type Props = {
  open: boolean;
  book: Book | null;
  followingList: FollowUser[];
  onSend: (receiverId: string, postId: string, message?: string) => Promise<{ error: string | null }>;
  onClose: () => void;
};

export function RecommendModal({ open, book, followingList, onSend, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setMessage('');
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  if (!open || !book) return null;

  const handleSend = async () => {
    if (!selectedId) {
      setError('추천받을 친구를 선택해주세요');
      return;
    }
    setSending(true);
    setError(null);
    const { error } = await onSend(selectedId, book.id, message);
    setSending(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="mx-auto w-full max-w-md animate-slide-up rounded-t-3xl bg-white p-5 shadow-2xl dark:bg-slate-900 sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold">책 추천하기</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Book preview */}
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
          {book.thumbnail ? (
            <img src={book.thumbnail} alt={book.title} className="h-14 w-10 rounded object-cover" />
          ) : (
            <div className="flex h-14 w-10 items-center justify-center rounded bg-slate-200 dark:bg-slate-700">
              <span className="text-[8px] text-slate-400">표지</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold">{book.title}</p>
            <p className="truncate text-[11px] text-slate-400">{book.authors.join(', ')}</p>
          </div>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle size={36} className="text-green-500" />
            </div>
            <p className="mt-4 text-[15px] font-bold">추천을 보냈어요!</p>
            <button
              onClick={onClose}
              className="mt-5 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 px-6 py-2.5 text-[13px] font-bold text-white transition-colors hover:from-brand-700 hover:to-brand-600"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            {/* Friend selection */}
            <p className="mt-4 text-[12px] font-semibold text-slate-500 dark:text-slate-400">추천할 친구</p>
            {followingList.length === 0 ? (
              <div className="mt-2 rounded-xl border border-dashed border-slate-200 py-6 text-center dark:border-slate-700">
                <p className="text-[12px] text-slate-400">팔로우한 친구가 없어요</p>
                <p className="mt-1 text-[11px] text-slate-400">피드에서 사용자를 팔로우한 후 추천할 수 있어요</p>
              </div>
            ) : (
              <div className="mt-2 max-h-40 space-y-1.5 overflow-y-auto no-scrollbar">
                {followingList.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setSelectedId(f.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 transition-all ${
                      selectedId === f.id
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-slate-200 hover:border-brand-300 dark:border-slate-700 dark:hover:border-slate-600'
                    }`}
                  >
                    {f.avatarUrl ? (
                      <img src={f.avatarUrl} alt={f.nickname} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-[11px] font-bold text-white">
                        {(f.nickname || '?').charAt(0)}
                      </div>
                    )}
                    <span className="text-[13px] font-semibold">{f.nickname || '사용자'}</span>
                    {selectedId === f.id && (
                      <CheckCircle size={16} className="ml-auto text-brand-500" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Message */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={100}
              placeholder="추천 메시지 (선택사항)"
              className="mt-3 h-16 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
            />

            {error && <p className="mt-2 text-[12px] font-medium text-red-500">{error}</p>}

            <button
              onClick={handleSend}
              disabled={sending || !selectedId}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 py-3 text-[14px] font-bold text-white transition-all hover:from-brand-700 hover:to-brand-600 active:scale-95 disabled:opacity-50"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              추천 보내기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
