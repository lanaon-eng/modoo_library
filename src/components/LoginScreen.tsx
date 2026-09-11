import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { LOGO_URL } from '@/lib/brand';

const KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID as string;
const KAKAO_REDIRECT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kakao-auth`;

export function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKakao = () => {
    if (!KAKAO_CLIENT_ID) {
      setError('카카오 로그인 설정이 필요합니다');
      return;
    }
    setLoading(true);
    setError(null);

    const state = btoa(
      JSON.stringify({
        nonce: crypto.randomUUID(),
        origin: window.location.origin,
      })
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    sessionStorage.setItem('kakao_oauth_state', state);

    const authUrl = new URL('https://kauth.kakao.com/oauth/authorize');
    authUrl.searchParams.set('client_id', KAKAO_CLIENT_ID);
    authUrl.searchParams.set('redirect_type', 'code');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', KAKAO_REDIRECT);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set(
      'scope',
      'profile_nickname,profile_image'
    );
    window.location.href = authUrl.toString();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 dark:bg-slate-950">
      <div className="flex flex-col items-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-white shadow-lg shadow-brand-500/20">
          <img
            src={LOGO_URL}
            alt="모두의 서재 로고"
            className="h-full w-full rounded-[28px] object-cover"
          />
        </div>
        <h1 className="mt-5 text-[22px] font-bold tracking-tight">모두의 서재</h1>
      </div>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-2 text-[13px] font-medium text-red-600 dark:bg-red-950/50 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-12 w-full max-w-xs">
        <button
          onClick={handleKakao}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#FEE500] px-5 py-3.5 text-[14px] font-bold text-[#191919] shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <KakaoIcon />
          )}
          카카오로 시작하기
        </button>
      </div>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#191919">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.79 1.79 5.25 4.56 6.74-.2.62-.73 2.2-.83 2.54-.13.42.15.41.31.3.13-.09 2.05-1.4 2.88-1.97.99.22 2.03.34 3.08.34 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
  );
}
