import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Recommendation } from '@/types';
import { supabase } from '@/lib/supabase';

type RecRow = {
  id: string;
  sender_id: string;
  post_id: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  posts: {
    book_title: string;
    book_author: string | null;
    book_cover_url: string | null;
    cover_urls: string[] | null;
  } | null;
};

export function useRecommendations(user: User | null) {
  const [received, setReceived] = useState<Recommendation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const fetchReceived = useCallback(async () => {
    if (!user) return;
    setLoaded(false);

    const { data, error } = await supabase
      .from('recommendations')
      .select(`
        id, sender_id, post_id, message, is_read, created_at,
        posts!inner ( book_title, book_author, book_cover_url, cover_urls )
      `)
      .eq('receiver_id', user.id)
      .order('created_at', { ascending: false });

    if (error || !data) {
      setReceived([]);
      setUnreadCount(0);
      setLoaded(true);
      return;
    }

    const rows = data as unknown as RecRow[];
    const senderIds = Array.from(new Set(rows.map((r) => r.sender_id)));
    let profileMap = new Map<string, { full_name: string; avatar_url: string }>();
    if (senderIds.length > 0) {
      const { data: profiles } = await supabase.rpc('get_profiles', { user_ids: senderIds });
      if (profiles) {
        for (const p of profiles as { id: string; full_name: string; avatar_url: string }[]) {
          profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
        }
      }
    }

    const mapped: Recommendation[] = rows.map((r) => {
      const profile = profileMap.get(r.sender_id);
      const post = r.posts;
      return {
        id: r.id,
        senderId: r.sender_id,
        senderName: profile?.full_name || '사용자',
        senderAvatar: profile?.avatar_url || null,
        postId: r.post_id,
        bookTitle: post?.book_title || '',
        bookAuthor: post?.book_author || '',
        coverUrl: post?.book_cover_url || null,
        coverUrls: post?.cover_urls ?? [],
        message: r.message,
        isRead: r.is_read,
        createdAt: new Date(r.created_at).getTime(),
      };
    });

    setReceived(mapped);
    setUnreadCount(mapped.filter((r) => !r.isRead).length);
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    fetchReceived();
  }, [fetchReceived]);

  const sendRecommendation = useCallback(
    async (receiverId: string, postId: string, message?: string) => {
      if (!user) return { error: '로그인이 필요합니다' };
      const { error } = await supabase.from('recommendations').insert({
        sender_id: user.id,
        receiver_id: receiverId,
        post_id: postId,
        message: message?.trim() || null,
      });
      if (error) return { error: error.message };
      return { error: null };
    },
    [user]
  );

  const markAsRead = useCallback(async (id: string) => {
    setReceived((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isRead: true } : r))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await supabase.from('recommendations').update({ is_read: true }).eq('id', id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    setReceived((prev) => prev.map((r) => ({ ...r, isRead: true })));
    setUnreadCount(0);
    await supabase
      .from('recommendations')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false);
  }, [user]);

  return {
    received,
    unreadCount,
    loaded,
    sendRecommendation,
    markAsRead,
    markAllAsRead,
    refetch: fetchReceived,
  };
}
