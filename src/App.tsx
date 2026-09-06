import { useState } from 'react';
import { Header } from '@/components/Header';
import { PublicFeed } from '@/components/PublicFeed';
import { MyLibrary } from '@/components/MyLibrary';
import { CardViewerModal } from '@/components/CardViewerModal';
import { LoginScreen } from '@/components/LoginScreen';
import { KakaoCallback } from '@/components/KakaoCallback';
import { BottomNav, type FeedTab } from '@/components/BottomNav';
import { AIBookChat, type SaveData } from '@/components/AIBookChat';
import { NicknameModal } from '@/components/NicknameModal';
import { RecommendModal } from '@/components/RecommendModal';
import { useTheme } from '@/hooks/useTheme';
import { useBooks } from '@/hooks/useBooks';
import { useCards } from '@/hooks/useCards';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useFollows';
import { useRecommendations } from '@/hooks/useRecommendations';
import { supabase } from '@/lib/supabase';
import type { ReadingCard, Book } from '@/types';

const TAB_TITLES: Record<FeedTab, string> = {
  all: '모두의 서재',
  chat: 'AI 북챗',
  mine: '나의 서재',
};

function App() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<FeedTab>('all');
  const [viewCard, setViewCard] = useState<ReadingCard | null>(null);
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [recommendBook, setRecommendBook] = useState<Book | null>(null);

  const { books: allBooks, toggleLike: toggleLikeAll, likedIds: likedIdsAll, refetch: refetchAll } = useBooks(user, 'all');
  const { books: myBooks, removeBook, updateBook, refetch: refetchMine } = useBooks(user, 'mine');
  const { cards, addCard } = useCards();
  const { followingIds, followerCount, followingCount, followingList, toggleFollow, refetch: refetchFollows } = useFollows(user);
  const { received: recommendations, unreadCount: unreadRecCount, sendRecommendation, markAllAsRead, refetch: refetchRecs } = useRecommendations(user);

  if (window.location.pathname === '/auth/kakao') {
    return <KakaoCallback />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500 dark:border-ink-800 dark:border-t-brand-500" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const hasKakaoProvider = user.user_metadata?.provider === 'kakao';
  const hasCustomNickname = user.user_metadata?.nickname_set === true;
  const nickname =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    '독서러';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

  const needsNicknameSetup = hasKakaoProvider && !hasCustomNickname;

  const handleSaveFromChat = async (data: SaveData) => {
    const coverUrls = data.book.coverUrls?.length
      ? data.book.coverUrls
      : data.book.thumbnail
        ? [data.book.thumbnail]
        : [];

    const { data: insertData, error } = await supabase.from('posts').insert({
      user_id: user.id,
      book_title: data.book.title,
      book_author: data.book.authors.join(', '),
      cover_url: data.book.thumbnail || null,
      cover_urls: coverUrls.length > 0 ? coverUrls : null,
      book_cover_url: data.book.thumbnail || null,
      ai_insight: data.book.contents || null,
      category: data.category,
      chat_cards: data.chatCards,
      user_review: data.userReview || null,
      is_published: data.isPublished,
    }).select('id').single();

    if (!error && insertData) {
      const card: ReadingCard = {
        id: `card-${insertData.id}-${Date.now()}`,
        bookId: insertData.id as string,
        bookTitle: data.book.title,
        bookAuthor: data.book.authors.join(', '),
        thumbnail: data.book.thumbnail,
        coverUrls,
        characterName: 'AI 북챗',
        characterEmoji: '✨',
        insight: data.chatCards[1]?.content || data.userReview || '대화하며 깊이 생각해보았어요.',
        createdAt: Date.now(),
      };
      addCard(card);
    }

    refetchMine();
    refetchAll();
    setTab(data.isPublished ? 'all' : 'mine');
  };

  const handleTogglePublish = (id: string, isPublished: boolean) => {
    updateBook(id, { isPublished });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleNicknameSaved = () => {
    setNicknameModalOpen(false);
    setIsFirstLogin(false);
    window.location.reload();
  };

  const handleSendRecommendation = async (receiverId: string, postId: string, message?: string) => {
    const result = await sendRecommendation(receiverId, postId, message);
    if (!result.error) {
      refetchRecs();
    }
    return result;
  };

  const handleMarkAllRecsRead = () => {
    markAllAsRead();
  };

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        title={TAB_TITLES[tab]}
        nickname={nickname}
        avatarUrl={avatarUrl}
        onSignOut={handleSignOut}
        onEditNickname={() => {
          setIsFirstLogin(false);
          setNicknameModalOpen(true);
        }}
      />
      <main className="mx-auto max-w-md pb-20">
        {tab === 'all' && (
          <PublicFeed
            books={allBooks}
            likedIds={likedIdsAll}
            onToggleLike={toggleLikeAll}
            followingIds={followingIds}
            onToggleFollow={(userId) => {
              toggleFollow(userId);
              refetchFollows();
            }}
            currentUserId={user.id}
          />
        )}
        {tab === 'chat' && (
          <AIBookChat
            onSave={handleSaveFromChat}
            existingBookTitles={myBooks.map((b) => b.title)}
          />
        )}
        {tab === 'mine' && (
          <MyLibrary
            books={myBooks}
            cards={cards}
            onRemove={removeBook}
            onAdd={() => setTab('chat')}
            onTogglePublish={handleTogglePublish}
            onCardClick={(card) => setViewCard(card)}
            nickname={nickname}
            avatarUrl={avatarUrl}
            followerCount={followerCount}
            followingCount={followingCount}
            recommendations={recommendations}
            unreadRecCount={unreadRecCount}
            onMarkAllRecsRead={handleMarkAllRecsRead}
            onRecommend={(book) => setRecommendBook(book)}
          />
        )}
      </main>

      <BottomNav active={tab} onChange={setTab} />

      <CardViewerModal
        card={viewCard}
        open={!!viewCard}
        onClose={() => setViewCard(null)}
        nickname={nickname}
      />

      <NicknameModal
        open={nicknameModalOpen || needsNicknameSetup}
        currentNickname={nickname}
        isFirstLogin={isFirstLogin || needsNicknameSetup}
        onClose={() => setNicknameModalOpen(false)}
        onSaved={handleNicknameSaved}
      />

      <RecommendModal
        open={!!recommendBook}
        book={recommendBook}
        followingList={followingList}
        onSend={handleSendRecommendation}
        onClose={() => setRecommendBook(null)}
      />
    </div>
  );
}

export default App;
