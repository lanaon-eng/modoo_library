import { useState } from 'react';
import { Header } from '@/components/Header';
import { PublicFeed } from '@/components/PublicFeed';
import { MyLibrary } from '@/components/MyLibrary';
import { BookFeedModal } from '@/components/BookFeedModal';
import { LoginScreen } from '@/components/LoginScreen';
import { KakaoCallback } from '@/components/KakaoCallback';
import { BottomNav, type FeedTab } from '@/components/BottomNav';
import { AIBookChat, type SaveData } from '@/components/AIBookChat';
import { ReadingNotePage } from '@/components/ReadingNotePage';
import { NicknameModal } from '@/components/NicknameModal';
import { RecommendModal } from '@/components/RecommendModal';
import { FollowListModal } from '@/components/FollowListModal';
import { useTheme } from '@/hooks/useTheme';
import { useBooks } from '@/hooks/useBooks';
import { useAuth } from '@/hooks/useAuth';
import { useFollows } from '@/hooks/useFollows';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useWishlist } from '@/hooks/useWishlist';
import { useReadingNotes } from '@/hooks/useReadingNotes';
import { useCurrentlyReading } from '@/hooks/useCurrentlyReading';
import { supabase } from '@/lib/supabase';
import type { Book, SearchBook, CurrentlyReading } from '@/types';

const TAB_TITLES: Record<FeedTab, string> = {
  all: '모두의 서재',
  chat: 'AI 북챗',
  mine: '나의 서재',
};

function App() {
  const { theme, toggleTheme } = useTheme();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<FeedTab>('all');
  const [viewBook, setViewBook] = useState<Book | null>(null);
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [recommendBook, setRecommendBook] = useState<Book | null>(null);
  const [followListTab, setFollowListTab] = useState<'following' | 'followers'>('following');
  const [followListOpen, setFollowListOpen] = useState(false);
  const [readingBook, setReadingBook] = useState<CurrentlyReading | null>(null);
  const [presetChatBook, setPresetChatBook] = useState<SearchBook | null>(null);

  const { books: allBooks, toggleLike: toggleLikeAll, likedIds: likedIdsAll, refetch: refetchAll } = useBooks(user, 'all');
  const { books: myBooks, removeBook, updateBook, refetch: refetchMine } = useBooks(user, 'mine');
  const { followingIds, pendingFollowingIds, followerCount, followingCount, followingList, followerList, pendingRequests, toggleFollow, unfollow, acceptFollowRequest, rejectFollowRequest, fetchFollowers, fetchPendingRequests, refetch: refetchFollows } = useFollows(user);
  const { received: recommendations, unreadCount: unreadRecCount, sendRecommendation, markAllAsRead, refetch: refetchRecs } = useRecommendations(user);
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist, refetch: refetchWishlist } = useWishlist(user);
  const { notes: readingNotes, addNote: addReadingNote, deleteNote: deleteReadingNote, getNotesForBook } = useReadingNotes(user);
  const { books: currentlyReading, addBook: addCurrentlyReading, removeBook: removeCurrentlyReading, removeByTitle: removeCurrentlyReadingByTitle, isReading, refetch: refetchCurrentlyReading } = useCurrentlyReading(user);

  if (window.location.pathname === '/auth/kakao') {
    return <KakaoCallback />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-brand-500 dark:border-slate-800 dark:border-t-brand-500" />
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

    // Move from currently_reading to posts (finished)
    await removeCurrentlyReadingByTitle(data.book.title);

    if (!error && insertData) {
      refetchMine();
      refetchAll();
      setTab(data.isPublished ? 'all' : 'mine');
    } else {
      refetchMine();
      refetchAll();
      setTab(data.isPublished ? 'all' : 'mine');
    }
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

  const handleToggleWishlist = async (book: SearchBook) => {
    if (isInWishlist(book.title)) {
      const item = wishlist.find((w) => w.bookTitle === book.title);
      if (item) removeFromWishlist(item.id);
    } else {
      await addToWishlist(book);
    }
  };

  const handleAddCurrentlyReading = async (book: SearchBook) => {
    await addCurrentlyReading(book);
  };

  const handleStartChatFromReading = (book: CurrentlyReading) => {
    const searchBook: SearchBook = {
      id: book.externalId || book.id,
      title: book.bookTitle,
      authors: book.bookAuthor ? book.bookAuthor.split(', ') : [],
      publisher: book.bookPublisher || '',
      thumbnail: book.thumbnail || '',
      coverUrls: book.coverUrls,
      contents: book.bookContents || '',
      url: book.bookUrl || '',
    };
    setReadingBook(null);
    setPresetChatBook(searchBook);
    setTab('chat');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
            pendingFollowingIds={pendingFollowingIds}
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
            wishlistTitles={new Set(wishlist.map((w) => w.bookTitle))}
            onToggleWishlist={handleToggleWishlist}
            readingNotes={readingNotes}
            onAddNote={addReadingNote}
            onDeleteNote={deleteReadingNote}
            getNotesForBook={getNotesForBook}
            presetBook={presetChatBook}
            onPresetConsumed={() => setPresetChatBook(null)}
            onAddCurrentlyReading={handleAddCurrentlyReading}
            isCurrentlyReading={isReading}
          />
        )}
        {tab === 'mine' && (
          <MyLibrary
            books={myBooks}
            onRemove={removeBook}
            onAdd={() => setTab('chat')}
            onTogglePublish={handleTogglePublish}
            onBookClick={(book) => setViewBook(book)}
            nickname={nickname}
            avatarUrl={avatarUrl}
            followerCount={followerCount}
            followingCount={followingCount}
            pendingFollowerCount={pendingRequests.length}
            recommendations={recommendations}
            unreadRecCount={unreadRecCount}
            onMarkAllRecsRead={handleMarkAllRecsRead}
            onRecommend={(book) => setRecommendBook(book)}
            wishlist={wishlist}
            onRemoveFromWishlist={removeFromWishlist}
            onOpenFollowList={(tab) => {
              setFollowListTab(tab);
              setFollowListOpen(true);
              fetchFollowers();
              fetchPendingRequests();
            }}
            currentlyReading={currentlyReading}
            onReadingBookClick={(book) => setReadingBook(book)}
            onRemoveReading={removeCurrentlyReading}
          />
        )}
      </main>

      {readingBook && (
        <ReadingNotePage
          book={readingBook}
          notes={getNotesForBook(readingBook.bookTitle)}
          onAddNote={(content, noteType) => addReadingNote(readingBook.bookTitle, readingBook.bookAuthor, content, noteType)}
          onDeleteNote={deleteReadingNote}
          onStartChat={() => handleStartChatFromReading(readingBook)}
          onBack={() => setReadingBook(null)}
        />
      )}

      <BottomNav active={tab} onChange={setTab} />

      <BookFeedModal
        book={viewBook}
        open={!!viewBook}
        onClose={() => setViewBook(null)}
        onTogglePublish={handleTogglePublish}
        onRecommend={(book) => { setViewBook(null); setRecommendBook(book); }}
        onRemove={removeBook}
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
        followingList={followingList.filter((f) => followerList.some((fol) => fol.id === f.id && fol.status === 'accepted'))}
        onSend={handleSendRecommendation}
        onClose={() => setRecommendBook(null)}
      />

      <FollowListModal
        open={followListOpen}
        initialTab={followListTab}
        followingList={followingList}
        followerList={followerList}
        onClose={() => setFollowListOpen(false)}
        onAccept={(followerId) => {
          acceptFollowRequest(followerId);
          refetchFollows();
        }}
        onReject={(followerId) => {
          rejectFollowRequest(followerId);
          refetchFollows();
        }}
        onUnfollow={(userId) => {
          unfollow(userId);
          refetchFollows();
        }}
      />
    </div>
  );
}

export default App;
