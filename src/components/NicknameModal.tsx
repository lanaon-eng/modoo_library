import { useState, useEffect } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Props = {
  open: boolean;
  currentNickname: string;
  isFirstLogin: boolean;
  onClose: () => void;
  onSaved: (newNickname: string) => void;
};

export function NicknameModal({ open, currentNickname, isFirstLogin, onClose, onSaved }: Props) {
  const [value, setValue] = useState(currentNickname);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(currentNickname);
      setError(null);
    }
  }, [open, currentNickname]);

  if (!open) return null;

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('닉네임을 입력해주세요');
      return;
    }
    if (trimmed.length > 12) {
      setError('닉네임은 12자 이하로 입력해주세요');
      return;
    }

    setSaving(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError('사용자 정보를 가져올 수 없습니다');
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        full_name: trimmed,
        name: trimmed,
        nickname_set: true,
      },
    });

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm animate-scale-in rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold">
            {isFirstLogin ? '닉네임 설정' : '닉네임 변경'}
          </h2>
          {!isFirstLogin && (
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <p className="mt-2 text-[12.5px] leading-relaxed text-slate-400">
          {isFirstLogin
            ? '모두의 서재에서 사용할 닉네임을 설정해주세요. 언제든지 변경할 수 있어요.'
            : '새로운 닉네임을 입력해주세요.'}
        </p>

        <div className="mt-5">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={12}
            autoFocus
            placeholder="닉네임 (최대 12자)"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-800 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !saving) handleSave();
            }}
          />
          <div className="mt-1.5 flex justify-end">
            <span className="text-[11px] text-slate-400">{value.length}/12</span>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-[12px] font-medium text-red-500">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 py-3 text-[14px] font-bold text-white transition-all hover:from-brand-700 hover:to-brand-600 active:scale-95 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Check size={18} />
              {isFirstLogin ? '시작하기' : '변경하기'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
