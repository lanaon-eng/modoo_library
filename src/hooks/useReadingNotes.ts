import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ReadingNote, NoteType } from '@/types';
import { supabase } from '@/lib/supabase';

type NoteRow = {
  id: string;
  book_title: string;
  book_author: string | null;
  content: string;
  note_type: string;
  created_at: string;
};

export function useReadingNotes(user: User | null) {
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchNotes = useCallback(async (bookTitle?: string) => {
    if (!user) return;
    setLoaded(false);
    let query = supabase
      .from('reading_notes')
      .select('id, book_title, book_author, content, note_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (bookTitle) {
      query = query.eq('book_title', bookTitle);
    }
    const { data, error } = await query;
    if (error || !data) {
      setNotes([]);
      setLoaded(true);
      return;
    }
    const rows = data as unknown as NoteRow[];
    setNotes(
      rows.map((r) => ({
        id: r.id,
        bookTitle: r.book_title,
        bookAuthor: r.book_author,
        content: r.content,
        noteType: r.note_type as NoteType,
        createdAt: new Date(r.created_at).getTime(),
      }))
    );
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = useCallback(
    async (bookTitle: string, bookAuthor: string | null, content: string, noteType: NoteType) => {
      if (!user || !content.trim()) return;
      const { data, error } = await supabase
        .from('reading_notes')
        .insert({
          user_id: user.id,
          book_title: bookTitle,
          book_author: bookAuthor,
          content: content.trim(),
          note_type: noteType,
        })
        .select('id, book_title, book_author, content, note_type, created_at')
        .single();
      if (error || !data) return;
      const row = data as unknown as NoteRow;
      const newNote: ReadingNote = {
        id: row.id,
        bookTitle: row.book_title,
        bookAuthor: row.book_author,
        content: row.content,
        noteType: row.note_type as NoteType,
        createdAt: new Date(row.created_at).getTime(),
      };
      setNotes((prev) => [newNote, ...prev]);
    },
    [user]
  );

  const deleteNote = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await supabase.from('reading_notes').delete().eq('id', id);
  }, []);

  const getNotesForBook = useCallback(
    (bookTitle: string) => notes.filter((n) => n.bookTitle === bookTitle),
    [notes]
  );

  return {
    notes,
    loaded,
    addNote,
    deleteNote,
    fetchNotes,
    getNotesForBook,
  };
}
