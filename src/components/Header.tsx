import { useState, useRef, useEffect } from 'react';
import { Moon, Sun, LogOut, ChevronDown, Pencil } from 'lucide-react';

const LOGO_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/asset/Gemini_Generated_Image_v2x2suv2x2suv2x2%20(1).png`;

type Props = {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  title: string;
  nickname: string;
  avatarUrl: string | null;
  onSignOut: () => void;
  onEditNickname: () => void;
};

export function Header({ theme, onToggleTheme, title, nickname, avatarUrl, onSignOut, onEditNickname }: Props) {
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
    <header className="sticky top-0 z-30 border-b border-ink-200/60 bg-ink-50/80 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/80">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img src={LOGO_URL} alt="북톡" className="h-8 w-8 rounded-lg object-cover" />
          <h1 className="text-[16px] font-bold tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleTheme}
            aria-label="테마 전환"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-ink-100"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {/* Profile */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-full pl-0.5 pr-1.5 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800"
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
              <ChevronDown size={14} className="text-ink-400" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-11 w-56 animate-scale-in rounded-2xl border border-ink-200/70 bg-white py-1.5 shadow-xl dark:border-ink-800/70 dark:bg-ink-900">
                <div className="flex items-center gap-3 px-4 py-2.5">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={nickname}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-[14px] font-bold text-white">
                      {nickname.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold">{nickname}</p>
                    <p className="text-[11px] text-ink-400">카카오 계정</p>
                  </div>
                </div>
                <div className="mx-3 my-1 border-t border-ink-100 dark:border-ink-800" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEditNickname();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-ink-600 transition-colors hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
                >
                  <Pencil size={16} />
                  닉네임 변경
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSignOut();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-ink-600 transition-colors hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
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
