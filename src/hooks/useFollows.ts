import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { FollowUser } from '@/types';
import { supabase } from '@/lib/supabase';

export function useFollows(user: User | null) {
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchFollowing = useCallback(async () => {
    if (!user) return;
    setLoaded(false);

    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const ids = new Set((follows ?? []).map((f: { following_id: string }) => f.following_id));
    setFollowingIds(ids);

    const { data: counts } = await supabase.rpc('get_follow_counts', {
      target_user_id: user.id,
    });
    const row = Array.isArray(counts) ? counts[0] : counts;
    if (row) {
      setFollowerCount(Number(row.follower_count) || 0);
      setFollowingCount(Number(row.following_count) || 0);
    }

    if (ids.size > 0) {
      const { data: profiles } = await supabase.rpc('get_profiles', {
        user_ids: Array.from(ids),
      });
      if (profiles) {
        setFollowingList(
          (profiles as { id: string; full_name: string; avatar_url: string }[]).map((p) => ({
            id: p.id,
            nickname: p.full_name,
            avatarUrl: p.avatar_url || null,
          }))
        );
      }
    } else {
      setFollowingList([]);
    }

    setLoaded(true);
  }, [user]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  const follow = useCallback(
    async (targetId: string) => {
      if (!user || targetId === user.id) return;
      setFollowingIds((prev) => new Set(prev).add(targetId));
      setFollowingCount((c) => c + 1);
      setFollowingList((prev) => {
        const profile = prev.find((p) => p.id === targetId);
        if (profile) return prev;
        return [{ id: targetId, nickname: '', avatarUrl: null }, ...prev];
      });
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetId });
      if (error) {
        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
        setFollowingCount((c) => c - 1);
      }
    },
    [user]
  );

  const unfollow = useCallback(
    async (targetId: string) => {
      if (!user) return;
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      setFollowingCount((c) => Math.max(0, c - 1));
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
    },
    [user]
  );

  const toggleFollow = useCallback(
    (targetId: string) => {
      if (followingIds.has(targetId)) unfollow(targetId);
      else follow(targetId);
    },
    [followingIds, follow, unfollow]
  );

  return {
    followingIds,
    followerCount,
    followingCount,
    followingList,
    loaded,
    follow,
    unfollow,
    toggleFollow,
    refetch: fetchFollowing,
  };
}
