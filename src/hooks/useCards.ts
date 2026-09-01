import { useCallback, useEffect, useState } from 'react';
import type { ReadingCard } from '@/types';
import { loadCards, saveCards } from '@/lib/cardStorage';

export function useCards() {
  const [cards, setCards] = useState<ReadingCard[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCards(loadCards());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveCards(cards);
  }, [cards, loaded]);

  const addCard = useCallback((card: ReadingCard) => {
    setCards((prev) => [card, ...prev]);
  }, []);

  const removeCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { cards, addCard, removeCard, loaded };
}
