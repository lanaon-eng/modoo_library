import { BookOpen, Plus, User } from 'lucide-react';

export type FeedTab = 'all' | 'chat' | 'mine';

type Props = {
  active: FeedTab;
  onChange: (tab: FeedTab) => void;
};

export function BottomNav({ active, onChange }: Props) {
  const tabs: { id: FeedTab; label: string; icon: typeof BookOpen }[] = [
    { id: 'all', label: '모두의 서재', icon: BookOpen },
    { id: 'chat', label: 'AI 북챗', icon: Plus },
    { id: 'mine', label: '나의 서재', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/60 bg-white/90 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/90 safe-bottom">
      <div className="mx-auto flex max-w-md items-center justify-around px-4 py-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          const isCenter = id === 'chat';
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-colors ${
                isActive ? 'text-brand-500' : 'text-slate-400'
              }`}
            >
              {isCenter ? (
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                    isActive
                      ? 'bg-gradient-to-tr from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Icon size={20} strokeWidth={2.6} />
                </div>
              ) : (
                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
              )}
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
