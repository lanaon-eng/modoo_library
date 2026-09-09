import { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown, Pencil } from 'lucide-react';

const LOGO_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/asset/Gemini_Generated_Image_v2x2suv2x2suv2x2%20(1).png`;

type Props = {
  title: string;
  nickname: string;
  avatarUrl: string | null;
  onSignOut: () => void;
  onEditNickname: () => void;
};

export function Header({ title, nickname, avatarUrl, onSignOut, onEditNickname }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/80">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="북톡" className="h-8 w-8 rounded-lg object-cover" />
          <h1 className="text-[16px] font-bold tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Profile */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-full pl-0.5 pr-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={nickname}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-[12px] font-bold text-white">
                  {nickname.charAt(0)}
                </div>
              )}
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 w-56 animate-scale-in rounded-2xl border border-slate-100/80 bg-white py-1.5 shadow-card dark:border-slate-800/70 dark:bg-slate-900">
                <div className="flex items-center gap-3 px-4 py-2.5">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={nickname}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 text-[14px] font-bold text-white">
                      {nickname.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold">{nickname}</p>
                    <p className="text-[11px] text-slate-400">카카오 계정</p>
                  </div>
                </div>
                <div className="mx-3 my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEditNickname();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Pencil size={16} />
                  닉네임 변경
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <LogOut size={16} />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
