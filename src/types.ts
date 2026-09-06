export type Category = '국어' | '사회' | '과학기술' | '수학' | '도덕' | '예능' | '영어';

export type ChatMessage = {
  id: string;
  role: 'character' | 'user';
  text: string;
};

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
  authorId?: string;
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

export type FollowUser = {
  id: string;
  nickname: string;
  avatarUrl: string | null;
};

export type FollowStatus = 'pending' | 'accepted';

export type FollowerUser = {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  status: FollowStatus;
};

export type WishlistBook = {
  id: string;
  bookTitle: string;
  bookAuthor: string;
  bookPublisher: string;
  thumbnail: string;
  coverUrls: string[];
  bookUrl: string;
  bookContents: string;
  externalId: string | null;
  addedAt: number;
};

export type NoteType = 'quote' | 'question' | 'thought' | 'puzzle';

export type ReadingNote = {
  id: string;
  bookTitle: string;
  bookAuthor: string | null;
  content: string;
  noteType: NoteType;
  createdAt: number;
};

export type CurrentlyReading = {
  id: string;
  bookTitle: string;
  bookAuthor: string | null;
  bookPublisher: string | null;
  thumbnail: string | null;
  coverUrls: string[];
  bookUrl: string | null;
  bookContents: string | null;
  externalId: string | null;
  createdAt: number;
};

export type Recommendation = {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  postId: string;
  bookTitle: string;
  bookAuthor: string;
  coverUrl: string | null;
  coverUrls: string[];
  message: string | null;
  isRead: boolean;
  createdAt: number;
};
