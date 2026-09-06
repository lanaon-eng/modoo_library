import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { CurrentlyReading, SearchBook } from '@/types';
import { supabase } from '@/lib/supabase';

type Row = {
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

function mapRow(r: Row): CurrentlyReading {
  return {
    id: r.id,
    bookTitle: r.book_title,
    bookAuthor: r.book_author,
    bookPublisher: r.book_publisher,
    thumbnail: r.thumbnail,
    coverUrls: r.cover_urls ?? [],
    bookUrl: r.book_url,
    bookContents: r.book_contents,
    externalId: r.external_id,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export function useCurrentlyReading(user: User | null) {
  const [books, setBooks] = useState<CurrentlyReading[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchBooks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('currently_reading')
      .select('id, book_title, book_author, book_publisher, thumbnail, cover_urls, book_url, book_contents, external_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error || !data) {
      setBooks([]);
      setLoaded(true);
      return;
    }
    setBooks((data as unknown as Row[]).map(mapRow));
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const addBook = useCallback(
    async (book: SearchBook) => {
      if (!user) return;
      const coverUrls = book.coverUrls?.length ? book.coverUrls : book.thumbnail ? [book.thumbnail] : [];
      const { data, error } = await supabase
        .from('currently_reading')
        .insert({
          user_id: user.id,
          book_title: book.title,
          book_author: book.authors.join(', '),
          book_publisher: book.publisher,
          thumbnail: book.thumbnail || null,
          cover_urls: coverUrls.length > 0 ? coverUrls : null,
          book_url: book.url,
          book_contents: book.contents || null,
          external_id: book.id,
        })
        .select('id, book_title, book_author, book_publisher, thumbnail, cover_urls, book_url, book_contents, external_id, created_at')
        .maybeSingle();
      if (error || !data) return;
      const newBook = mapRow(data as unknown as Row);
      setBooks((prev) => [newBook, ...prev.filter((b) => b.bookTitle !== book.title)]);
    },
    [user]
  );

  const removeBook = useCallback(async (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    await supabase.from('currently_reading').delete().eq('id', id);
  }, []);

  const removeByTitle = useCallback(async (bookTitle: string) => {
    setBooks((prev) => prev.filter((b) => b.bookTitle !== bookTitle));
    await supabase.from('currently_reading').delete().eq('book_title', bookTitle);
  }, []);

  const isReading = useCallback(
    (bookTitle: string) => books.some((b) => b.bookTitle === bookTitle),
    [books]
  );

  return {
    books,
    loaded,
    addBook,
    removeBook,
    removeByTitle,
    isReading,
    refetch: fetchBooks,
  };
}
