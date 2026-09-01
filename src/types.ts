export type Category = '국어' | '사회' | '과학기술' | '수학' | '도덕' | '예능';

export type ChatCard = {
  title: string;
  content: string;
  emoji?: string;
};

export type Book = {
  id: string;
  title: string;
  authors: string[];
  publisher: string;
  thumbnail: string;
  coverUrls: string[];
  contents: string;
  url: string;
  addedAt: number;
  category?: Category;
  userReview?: string;
  isPublished?: boolean;
  likesCount?: number;
  chatCards?: ChatCard[];
  authorName?: string;
  authorAvatar?: string;
};

export type SearchBook = {
  id: string;
  title: string;
  authors: string[];
  publisher: string;
  thumbnail: string;
  coverUrls: string[];
  contents: string;
  url: string;
};

export type ReadingCard = {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  thumbnail: string;
  coverUrls: string[];
  characterName: string;
  characterEmoji: string;
  insight: string;
  createdAt: number;
};
