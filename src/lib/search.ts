import type { SearchBook } from '@/types';

// Build a list of candidate cover URLs to try in order.
// Kakao CDN may block hotlinking, so we provide ISBN-based fallbacks.
export function getCoverUrls(thumbnail: string, isbn: string): string[] {
  const urls: string[] = [];
  if (thumbnail) {
    urls.push(thumbnail);
    // Also try the source image directly (decoded fname param)
    try {
      const u = new URL(thumbnail);
      const fname = u.searchParams.get('fname');
      if (fname) {
        urls.push(fname.replace(/^http:/, 'https:'));
      }
    } catch {
      // not a URL with params, skip
    }
  }
  const cleanIsbn = isbn.replace(/[^0-9Xx]/g, '');
  if (cleanIsbn) {
    urls.push(`https://covers.openlibrary.org/isbn/${cleanIsbn}-L.jpg`);
  }
  return urls;
}

const MOCK_BOOKS: SearchBook[] = [
  {
    id: 'mock-1',
    title: '해리 포터와 마법사의 돌',
    authors: ['J.K. 롤링'],
    publisher: '문학수첩',
    thumbnail:
      'https://search1.kakaocdn.net/thumb/R600x870.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F1464476',
    coverUrls: [
      'https://search1.kakaocdn.net/thumb/R600x870.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F1464476',
      'https://t1.daumcdn.net/lbook/image/1464476',
    ],
    contents:
      '마법의 세계로 들어간 소년 해리 포터의 모험을 그린 판타지 소설. 호그와트 마법학교에서의 첫 해를 중심으로 펼쳐지는 이야기.',
    url: 'https://book.daum.net/book/book.do?bookid=BOK0001464476',
  },
  {
    id: 'mock-2',
    title: '어린 왕자',
    authors: ['앙투안 드 생텍쥐페리'],
    publisher: '열린책들',
    thumbnail:
      'https://search1.kakaocdn.net/thumb/R600x870.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5339770',
    coverUrls: [
      'https://search1.kakaocdn.net/thumb/R600x870.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5339770',
      'https://t1.daumcdn.net/lbook/image/5339770',
    ],
    contents:
      '사막에 불시착한 비행사가 어린 왕자를 만나며 벌어지는 이야기. 삶의 본질을 잃지 않는 어른을 위한 동화.',
    url: 'https://book.daum.net/book/book.do?bookid=BOK0005339770',
  },
  {
    id: 'mock-3',
    title: '나미야 잡화점의 기적',
    authors: ['히가시노 게이고'],
    publisher: '현대문학',
    thumbnail:
      'https://search1.kakaocdn.net/thumb/R600x870.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F10674037',
    coverUrls: [
      'https://search1.kakaocdn.net/thumb/R600x870.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F10674037',
      'https://t1.daumcdn.net/lbook/image/10674037',
    ],
    contents:
      '한적한 마을의 잡화점에 도착한 세 명의 절도범이 과거에서 온 편지를 받으며 겪는 따뜻한 이야기.',
    url: 'https://book.daum.net/book/book.do?bookid=BOK00010674037',
  },
  {
    id: 'mock-4',
    title: '코스모스',
    authors: ['칼 세이건'],
    publisher: '사이언스북스',
    thumbnail:
      'https://search1.kakaocdn.net/thumb/R600x870.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5919384',
    coverUrls: [
      'https://search1.kakaocdn.net/thumb/R600x870.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5919384',
      'https://t1.daumcdn.net/lbook/image/5919384',
    ],
    contents:
      '우주의 기원과 인류의 위치를 과학적 시각으로 탐구한 현대 과학 교양서의 고전.',
    url: 'https://book.daum.net/book/book.do?bookid=BOK0005919384',
  },
  {
    id: 'mock-5',
    title: '데미안',
    authors: ['헤르만 헤세'],
    publisher: '민음사',
    thumbnail:
      'https://search1.kakaocdn.net/thumb/R600x870.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5914184',
    coverUrls: [
      'https://search1.kakaocdn.net/thumb/R600x870.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5914184',
      'https://t1.daumcdn.net/lbook/image/5914184',
    ],
    contents:
      '두 세계 사이에서 자아를 찾아가는 소년 싱클레어의 성장을 그린 헤세의 대표작.',
    url: 'https://book.daum.net/book/book.do?bookid=BOK0005914184',
  },
  {
    id: 'mock-6',
    title: '별의 계승자',
    authors: ['유종원'],
    publisher: '북로망스',
    thumbnail:
      'https://search1.kakaocdn.net/thumb/R600x870.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5909650',
    coverUrls: [
      'https://search1.kakaocdn.net/thumb/R600x870.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F5909650',
      'https://t1.daumcdn.net/lbook/image/5909650',
    ],
    contents:
      '우주를 배경으로 한 SF 장편소설. 인류의 미래와 우주 전쟁을 그린 한국형 스페이스 오페라.',
    url: 'https://book.daum.net/book/book.do?bookid=BOK0005909650',
  },
];

export async function searchBooks(query: string): Promise<SearchBook[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const kakaoKey = import.meta.env.VITE_KAKAO_BOOK_API_KEY as string | undefined;

  if (kakaoKey) {
    try {
      const res = await fetch(
        `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(
          trimmed
        )}&size=20`,
        {
          headers: { Authorization: `KakaoAK ${kakaoKey}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const docs = (data.documents ?? []) as Array<{
          title: string;
          authors: string[];
          publisher: string;
          thumbnail: string;
          contents: string;
          url: string;
          isbn: string;
        }>;
        const mapped: SearchBook[] = docs.map((d, i) => ({
          id: d.isbn || `kakao-${i}-${d.title}`,
          title: d.title,
          authors: d.authors?.length ? d.authors : ['저자 미상'],
          publisher: d.publisher || '출판사 미상',
          thumbnail: d.thumbnail,
          coverUrls: getCoverUrls(d.thumbnail, d.isbn),
          contents: d.contents || '',
          url: d.url,
        }));
        if (mapped.length > 0) return mapped;
      }
    } catch {
      // fall through to mock
    }
  }

  // Fallback: Open Library (no key required)
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(
        trimmed
      )}&limit=20`
    );
    if (res.ok) {
      const data = await res.json();
      const docs = (data.docs ?? []) as Array<{
        key: string;
        title: string;
        author_name?: string[];
        publisher?: string[];
        cover_i?: number;
        first_publish_year?: number;
      }>;
      const mapped: SearchBook[] = docs
        .filter((d) => d.title)
        .map((d) => ({
          id: d.key,
          title: d.title,
          authors: d.author_name?.length ? d.author_name : ['저자 미상'],
          publisher: d.publisher?.[0] || '출판사 미상',
          thumbnail: d.cover_i
            ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
            : '',
          coverUrls: d.cover_i
            ? [`https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`]
            : [],
          contents: d.first_publish_year
            ? `최초 출판: ${d.first_publish_year}년`
            : '',
          url: `https://openlibrary.org${d.key}`,
        }));
      if (mapped.length > 0) return mapped;
    }
  } catch {
    // fall through to mock
  }

  // Final fallback: filter mock books
  const q = trimmed.toLowerCase();
  return MOCK_BOOKS.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.authors.some((a) => a.toLowerCase().includes(q)) ||
      b.publisher.toLowerCase().includes(q)
  );
}

export const MOCK_BOOKS_EXPORT = MOCK_BOOKS;
