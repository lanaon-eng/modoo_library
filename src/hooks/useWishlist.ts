import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { WishlistBook, SearchBook } from '@/types';
import { supabase } from '@/lib/supabase';

type WishlistRow = {
  id: string;
  book_title: string;
  book_author: string | null;
  book_publisher: string | null;
  thumbnail: string | null;
  cover_urls: string[] | null;
  book_url: string | null;
  book_contents: string | null;
  external_id: string | null;
  created_at: string;
};

function mapRow(row: WishlistRow): WishlistBook {
  return {
    id: row.id,
    bookTitle: row.book_title,
    bookAuthor: row.book_author || '',
    bookPublisher: row.book_publisher || '',
    thumbnail: row.thumbnail || '',
    coverUrls: row.cover_urls ?? [],
    bookUrl: row.book_url || '',
    bookContents: row.book_contents || '',
    externalId: row.external_id,
    addedAt: new Date(row.created_at).getTime(),
  };
}

export function useWishlist(user: User | null) {
  const [books, setBooks] = useState<WishlistBook[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!user) return;
    setLoaded(false);
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error || !data) {
      setBooks([]);
      setLoaded(true);
      return;
    }
    setBooks((data as WishlistRow[]).map(mapRow));
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = useCallback(
    async (book: SearchBook) => {
      if (!user) return { error: '로그인이 필요합니다' };
      const coverUrls = book.coverUrls?.length
        ? book.coverUrls
        : book.thumbnail
          ? [book.thumbnail]
          : [];
      const { error } = await supabase.from('wishlist').insert({
        user_id: user.id,
        book_title: book.title,
        book_author: book.authors.join(', '),
        book_publisher: book.publisher,
        thumbnail: book.thumbnail || null,
        cover_urls: coverUrls.length > 0 ? coverUrls : null,
        book_url: book.url || null,
        book_contents: book.contents || null,
        external_id: book.id,
      });
      if (error) return { error: error.message };
      fetchWishlist();
      return { error: null };
    },
    [user, fetchWishlist]
  );

  const removeFromWishlist = useCallback(
    async (id: string) => {
      setBooks((prev) => prev.filter((b) => b.id !== id));
      await supabase.from('wishlist').delete().eq('id', id);
    },
    []
  );

  const isInWishlist = useCallback(
    (bookTitle: string) => books.some((b) => b.bookTitle === bookTitle),
    [books]
  );

  return {
    wishlist: books,
    loaded,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    refetch: fetchWishlist,
  };
}
