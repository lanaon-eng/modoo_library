import type { ReadingCard } from '@/types';

const STORAGE_KEY = 'booklog.cards.v1';

export function loadCards(): ReadingCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ReadingCard[];
  } catch {
    return [];
  }
}

export function saveCards(cards: ReadingCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch {
    // ignore quota errors
  }
}
