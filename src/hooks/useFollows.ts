import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { FollowUser, FollowerUser } from '@/types';
import { supabase } from '@/lib/supabase';

type FollowRow = {
  follower_id: string;
  following_id: string;
  status: string;
};

export function useFollows(user: User | null) {
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [pendingFollowingIds, setPendingFollowingIds] = useState<Set<string>>(new Set());
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);
  const [followerList, setFollowerList] = useState<FollowerUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FollowUser[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchFollowing = useCallback(async () => {
    if (!user) return;
    setLoaded(false);

    const { data: follows } = await supabase
      .from('follows')
      .select('follower_id, following_id, status')
      .eq('follower_id', user.id);

    const rows = (follows ?? []) as unknown as FollowRow[];
    const acceptedIds = new Set(rows.filter((r) => r.status === 'accepted').map((r) => r.following_id));
    const pendingIds = new Set(rows.filter((r) => r.status === 'pending').map((r) => r.following_id));
    setFollowingIds(acceptedIds);
    setPendingFollowingIds(pendingIds);

    const { data: counts } = await supabase.rpc('get_follow_counts', {
      target_user_id: user.id,
    });
    const row = Array.isArray(counts) ? counts[0] : counts;
    if (row) {
      setFollowerCount(Number(row.follower_count) || 0);
      setFollowingCount(Number(row.following_count) || 0);
    }

    if (acceptedIds.size > 0) {
      const { data: profiles } = await supabase.rpc('get_profiles', {
        user_ids: Array.from(acceptedIds),
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

  const fetchFollowers = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc('get_follower_list', {
      target_user_id: user.id,
    });
    if (error || !data) {
      setFollowerList([]);
      return;
    }
    const rows = data as { id: string; full_name: string; avatar_url: string; status: string }[];
    setFollowerList(
      rows.map((r) => ({
        id: r.id,
        nickname: r.full_name,
        avatarUrl: r.avatar_url || null,
        status: r.status as 'pending' | 'accepted',
      }))
    );
  }, [user]);

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc('get_pending_follow_requests');
    if (error || !data) {
      setPendingRequests([]);
      return;
    }
    const rows = data as { follower_id: string; full_name: string; avatar_url: string }[];
    setPendingRequests(
      rows.map((r) => ({
        id: r.follower_id,
        nickname: r.full_name,
        avatarUrl: r.avatar_url || null,
      }))
    );
  }, [user]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  const follow = useCallback(
    async (targetId: string) => {
      if (!user || targetId === user.id) return;
      setPendingFollowingIds((prev) => new Set(prev).add(targetId));
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetId, status: 'pending' });
      if (error) {
        setPendingFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
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
      setPendingFollowingIds((prev) => {
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
      if (followingIds.has(targetId) || pendingFollowingIds.has(targetId)) unfollow(targetId);
      else follow(targetId);
    },
    [followingIds, pendingFollowingIds, follow, unfollow]
  );

  const acceptFollowRequest = useCallback(
    async (followerId: string) => {
      if (!user) return;
      setFollowerList((prev) =>
        prev.map((f) => (f.id === followerId ? { ...f, status: 'accepted' as const } : f))
      );
      setFollowerCount((c) => c + 1);
      await supabase.rpc('accept_follow_request', { follower_id: followerId });
      fetchPendingRequests();
    },
    [user, fetchPendingRequests]
  );

  const rejectFollowRequest = useCallback(
    async (followerId: string) => {
      if (!user) return;
      setFollowerList((prev) => prev.filter((f) => f.id !== followerId));
      await supabase.rpc('reject_follow_request', { follower_id: followerId });
      fetchPendingRequests();
    },
    [user, fetchPendingRequests]
  );

  return {
    followingIds,
    pendingFollowingIds,
    followerCount,
    followingCount,
    followingList,
    followerList,
    pendingRequests,
    loaded,
    follow,
    unfollow,
    toggleFollow,
    acceptFollowRequest,
    rejectFollowRequest,
    fetchFollowers,
    fetchPendingRequests,
    refetch: fetchFollowing,
  };
}
