import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Book, SearchBook, Category, ChatCard } from '@/types';
import { supabase } from '@/lib/supabase';

type PostRow = {
  id: string;
  user_id: string;
  book_title: string;
  book_author: string | null;
  cover_url: string | null;
  cover_urls: string[] | null;
  book_cover_url: string | null;
  ai_insight: string | null;
  category: string | null;
  chat_cards: ChatCard[] | null;
  user_review: string | null;
  rating: number | null;
  is_published: boolean | null;
  likes_count: number | null;
  created_at: string;
};

function getCoverUrls(row: PostRow): string[] {
  if (row.cover_urls && row.cover_urls.length > 0) return row.cover_urls;
  const url = row.book_cover_url ?? row.cover_url;
  return url ? [url] : [];
}

function mapRow(row: PostRow): Book {
  return {
    id: row.id,
    title: row.book_title,
    authors: row.book_author ? row.book_author.split(', ') : [],
    publisher: '',
    thumbnail: row.book_cover_url ?? row.cover_url ?? '',
    coverUrls: getCoverUrls(row),
    contents: row.ai_insight ?? '',
    url: '',
    addedAt: new Date(row.created_at).getTime(),
    category: (row.category as Category) ?? undefined,
    userReview: row.user_review ?? undefined,
    rating: row.rating ?? undefined,
    isPublished: row.is_published ?? false,
    likesCount: row.likes_count ?? 0,
    chatCards: row.chat_cards ?? undefined,
    authorId: row.user_id,
  };
}

export function useBooks(user: User | null, scope: 'all' | 'mine') {
  const [books, setBooks] = useState<Book[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const fetchBooks = useCallback(async () => {
    if (!user) return;
    setLoaded(false);
    setError(null);
    let query = supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (scope === 'all') {
      query = query.eq('is_published', true);
    } else {
      query = query.eq('user_id', user.id);
    }
    const { data, error: fetchError } = await query;
    if (fetchError) {
      setBooks([]);
      setError(fetchError.message);
      setLoaded(true);
      return;
    }
    setBooks((data as PostRow[]).map(mapRow));
    setLoaded(true);

    // Fetch user's likes
    const { data: likesData } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);
    if (likesData) {
      setLikedIds(new Set(likesData.map((l: { post_id: string }) => l.post_id)));
    }

    // For public feed, fetch author profiles
    if (scope === 'all' && data && data.length > 0) {
      const userIds = Array.from(new Set((data as PostRow[]).map((r) => r.user_id)));
      const { data: profiles } = await supabase.rpc('get_profiles', { user_ids: userIds });
      if (profiles) {
        const profileMap = new Map<string, { full_name: string; avatar_url: string }>();
        for (const p of profiles as { id: string; full_name: string; avatar_url: string }[]) {
          profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
        }
        setBooks((prev) =>
          prev.map((b) => {
            const row = (data as PostRow[]).find((r) => r.id === b.id);
            if (!row) return b;
            const profile = profileMap.get(row.user_id);
            return {
              ...b,
              authorName: profile?.full_name,
              authorAvatar: profile?.avatar_url,
            };
          })
        );
      }
    }
  }, [user, scope]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const addBook = useCallback(
    async (book: SearchBook, category?: Category) => {
      if (!user) return;
      const coverUrls = book.coverUrls?.length
        ? book.coverUrls
        : book.thumbnail
          ? [book.thumbnail]
          : [];
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        book_title: book.title,
        book_author: book.authors.join(', '),
        cover_url: book.thumbnail || null,
        cover_urls: coverUrls.length > 0 ? coverUrls : null,
        book_cover_url: book.thumbnail || null,
        ai_insight: book.contents || null,
        category: category ?? null,
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }
      await fetchBooks();
    },
    [user, fetchBooks]
  );

  const removeBook = useCallback(async (id: string) => {
    const { error: deleteError } = await supabase.from('posts').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const updateBook = useCallback(
    async (id: string, updates: Partial<Pick<Book, 'userReview' | 'category' | 'isPublished' | 'chatCards'>>) => {
      const setObj: Record<string, unknown> = {};
      if (updates.userReview !== undefined) setObj.user_review = updates.userReview;
      if (updates.category !== undefined) setObj.category = updates.category;
      if (updates.isPublished !== undefined) setObj.is_published = updates.isPublished;
      if (updates.chatCards !== undefined) setObj.chat_cards = updates.chatCards;
      const { error: updateError } = await supabase.from('posts').update(setObj).eq('id', id);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      await fetchBooks();
    },
    [fetchBooks]
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!user) return;
      const isLiked = likedIds.has(postId);

      // Optimistic update
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (isLiked) next.delete(postId);
        else next.add(postId);
        return next;
      });
      setBooks((prev) =>
        prev.map((b) =>
          b.id === postId
            ? { ...b, likesCount: Math.max(0, (b.likesCount ?? 0) + (isLiked ? -1 : 1)) }
            : b
        )
      );

      if (isLiked) {
        await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
        await supabase.rpc('decrement_like', { post_id: postId });
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
        await supabase.rpc('increment_like', { post_id: postId });
      }
    },
    [user, likedIds]
  );

  return { books, addBook, removeBook, updateBook, toggleLike, likedIds, loaded, error, refetch: fetchBooks };
}
