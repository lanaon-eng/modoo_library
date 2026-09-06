import { useState, useEffect } from 'react';
import { X, UserCheck, UserPlus, Check, Clock, UserMinus } from 'lucide-react';
import type { FollowUser, FollowerUser } from '@/types';

type Props = {
  open: boolean;
  initialTab: 'following' | 'followers';
  followingList: FollowUser[];
  followerList: FollowerUser[];
  onClose: () => void;
  onAccept: (followerId: string) => void;
  onReject: (followerId: string) => void;
  onUnfollow: (userId: string) => void;
};

export function FollowListModal({
  open,
  initialTab,
  followingList,
  followerList,
  onClose,
  onAccept,
  onReject,
  onUnfollow,
}: Props) {
  const [tab, setTab] = useState<'following' | 'followers'>(initialTab);

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, initialTab]);

  if (!open) return null;

  const pendingFollowers = followerList.filter((f) => f.status === 'pending');
  const acceptedFollowers = followerList.filter((f) => f.status === 'accepted');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="relative w-full max-w-md animate-slide-up rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:animate-scale-in sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-[17px] font-bold">팔로우 목록</h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 px-5 pt-3">
          <button
            onClick={() => setTab('following')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-all ${
              tab === 'following'
                ? 'bg-brand-500 text-white'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <UserCheck size={15} />
            팔로잉 {followingList.length}
          </button>
          <button
            onClick={() => setTab('followers')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-all ${
              tab === 'followers'
                ? 'bg-brand-500 text-white'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            }`}
          >
            <UserPlus size={15} />
            팔로워 {acceptedFollowers.length}
            {pendingFollowers.length > 0 && (
              <span className="rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingFollowers.length}
              </span>
            )}
          </button>
        </div>

        {/* List */}
        <div className="max-h-[52vh] overflow-y-auto px-5 py-4 no-scrollbar">
          {tab === 'following' && (
            <>
              {followingList.length === 0 ? (
                <EmptyState icon={<UserCheck size={32} strokeWidth={1.5} />} text="팔로우한 사용자가 없어요" />
              ) : (
                <ul className="space-y-2">
                  {followingList.map((f) => (
                    <li
                      key={f.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-100/80 bg-white p-2.5 shadow-card dark:border-slate-800/70 dark:bg-slate-800/50"
                    >
                      <Avatar user={f} />
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{f.nickname || '사용자'}</span>
                      <button
                        onClick={() => onUnfollow(f.id)}
                        className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500 transition-all hover:bg-red-50 hover:text-red-500 active:scale-95 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-red-900/20"
                      >
                        <UserMinus size={12} />
                        팔로우 취소
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {tab === 'followers' && (
            <>
              {pendingFollowers.length > 0 && (
                <div className="mb-3">
                  <p className="mb-2 text-[11px] font-bold text-slate-400">수락 대기</p>
                  <ul className="space-y-2">
                    {pendingFollowers.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/50 p-2.5 dark:border-brand-800 dark:bg-brand-900/10"
                      >
                        <Avatar user={f} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-bold">{f.nickname || '사용자'}</p>
                          <p className="flex items-center gap-1 text-[11px] text-brand-500">
                            <Clock size={11} />
                            팔로우 요청
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onAccept(f.id)}
                            className="flex items-center gap-1 rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:from-brand-700 hover:to-brand-600 active:scale-95"
                          >
                            <Check size={12} />
                            수락
                          </button>
                          <button
                            onClick={() => onReject(f.id)}
                            className="rounded-full bg-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-500 transition-colors hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                          >
                            거절
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {acceptedFollowers.length > 0 ? (
                <div>
                  {pendingFollowers.length > 0 && (
                    <p className="mb-2 text-[11px] font-bold text-slate-400">팔로워</p>
                  )}
                  <ul className="space-y-2">
                    {acceptedFollowers.map((f) => (
                      <UserRow key={f.id} user={f} />
                    ))}
                  </ul>
                </div>
              ) : pendingFollowers.length === 0 ? (
                <EmptyState icon={<UserPlus size={32} strokeWidth={1.5} />} text="팔로워가 없어요" />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({ user }: { user: { nickname: string; avatarUrl: string | null } }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.nickname} className="h-10 w-10 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-brand-500 text-[13px] font-bold text-white">
      {(user.nickname || '?').charAt(0)}
    </div>
  );
}

function UserRow({ user }: { user: { id: string; nickname: string; avatarUrl: string | null } }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-slate-100/80 bg-white p-2.5 shadow-card dark:border-slate-800/70 dark:bg-slate-800/50">
      <Avatar user={user} />
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{user.nickname || '사용자'}</span>
    </li>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-300 dark:text-slate-600">
      {icon}
      <p className="text-[13px] font-medium">{text}</p>
    </div>
  );
}
