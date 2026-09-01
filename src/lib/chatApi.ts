import { supabase } from '@/lib/supabase';
import type { ChatMessage, ChatCard } from '@/types';

type ChatAction = 'chat' | 'summarize';

type ApiResponse = {
  reply?: string;
  cards?: ChatCard[];
  error?: string;
};

type ApiMessage = { role: 'user' | 'assistant'; content: string };

function toApiMessages(messages: ChatMessage[]): ApiMessage[] {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'character')
    .map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.text,
    }));
}

async function invokePersona(body: {
  bookTitle: string;
  author: string;
  userNote: string;
  messages: ApiMessage[];
  action: ChatAction;
}): Promise<ApiResponse> {
  const { data, error } = await supabase.functions.invoke('chat-persona', { body });
  if (error) throw new Error(error.message);
  return data as ApiResponse;
}

export async function fetchPersonaReply(
  bookTitle: string,
  bookAuthor: string,
  userNote: string,
  messages: ChatMessage[],
  isSummarizing: boolean = false
): Promise<string> {
  const data = await invokePersona({
    bookTitle,
    author: bookAuthor || '미상',
    userNote,
    messages: toApiMessages(messages),
    action: isSummarizing ? 'summarize' : 'chat',
  });

  if (data.error) throw new Error(data.error);
  if (!data.reply) throw new Error('Empty response');
  return data.reply;
}

export async function generateChatCards(
  bookTitle: string,
  bookAuthor: string,
  userNote: string,
  messages: ChatMessage[]
): Promise<ChatCard[]> {
  const data = await invokePersona({
    bookTitle,
    author: bookAuthor || '미상',
    userNote,
    messages: toApiMessages(messages),
    action: 'summarize',
  });

  if (data.error) throw new Error(data.error);

  if (data.cards && data.cards.length > 0) {
    return data.cards;
  }

  if (data.reply) {
    try {
      const parsed = JSON.parse(data.reply);
      if (Array.isArray(parsed)) {
        return parsed as ChatCard[];
      }
    } catch {
      // not JSON, use fallback
    }
  }

  return [
    {
      title: '핵심 메시지',
      content: userNote ? userNote.slice(0, 60) : '이 책에서 가장 중요한 메시지를 곰곰이 생각해보세요.',
      emoji: '💡',
    },
    {
      title: '나의 통찰',
      content: extractUserInsight(messages) || '대화를 통해 새롭게 발견한 나의 생각을 기록해요.',
      emoji: '🤔',
    },
  ];
}

function extractUserInsight(messages: ChatMessage[]): string {
  const userMessages = messages.filter((m) => m.role === 'user');
  if (userMessages.length === 0) return '';
  const sorted = [...userMessages].sort((a, b) => b.text.length - a.text.length);
  let insight = sorted[0].text;
  if (insight.length > 60) {
    insight = insight.slice(0, 57) + '...';
  }
  return insight;
}
