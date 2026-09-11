import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ChatMessage } from '@/types';
import { supabase } from '@/lib/supabase';

type ChatRow = {
  id: string;
  book_title: string;
  role: string;
  content: string;
  category: string | null;
  created_at: string;
};

export function useChatHistory(user: User | null) {
  const [loaded, setLoaded] = useState(false);

  const fetchChatHistory = useCallback(async (bookTitle: string): Promise<ChatMessage[]> => {
    if (!user || !bookTitle) return [];
    const { data, error } = await supabase
      .from('chat_messages')
      .select('id, book_title, role, content, category, created_at')
      .eq('user_id', user.id)
      .eq('book_title', bookTitle)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    const rows = data as unknown as ChatRow[];
    return rows.map((r) => ({
      id: r.id,
      role: r.role as 'user' | 'character',
      text: r.content,
    }));
  }, [user]);

  const saveMessage = useCallback(
    async (bookTitle: string, role: 'user' | 'character', content: string, category?: string): Promise<string | null> => {
      if (!user || !content.trim()) return null;
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          book_title: bookTitle,
          role,
          content: content.trim(),
          category: category ?? null,
        })
        .select('id')
        .single();
      if (error || !data) return null;
      return (data as unknown as { id: string }).id;
    },
    [user]
  );

  const deleteChatHistory = useCallback(
    async (bookTitle: string): Promise<boolean> => {
      if (!user || !bookTitle) return false;
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id)
        .eq('book_title', bookTitle);
      return !error;
    },
    [user]
  );

  const hasHistory = useCallback(
    async (bookTitle: string): Promise<boolean> => {
      if (!user || !bookTitle) return false;
      const { count, error } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('book_title', bookTitle);
      if (error || count === null) return false;
      return count > 0;
    },
    [user]
  );

  useEffect(() => {
    setLoaded(true);
  }, [user]);

  return {
    loaded,
    fetchChatHistory,
    saveMessage,
    deleteChatHistory,
    hasHistory,
  };
}
