import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function KakaoCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const savedState = sessionStorage.getItem('kakao_oauth_state');

      if (!code || !state || state !== savedState) {
        setError('잘못된 로그인 요청입니다');
        return;
      }

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kakao-auth`;
        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            code,
            redirect_uri: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kakao-auth`,
            client_id: import.meta.env.VITE_KAKAO_CLIENT_ID,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || '카카오 로그인에 실패했습니다');
          return;
        }

        const data = await res.json();
        if (data.error || !data.email || !data.password) {
          setError(data.error || '로그인 정보를 가져올 수 없습니다');
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (signInError) {
          setError(signInError.message || '로그인에 실패했습니다');
          return;
        }

        sessionStorage.removeItem('kakao_oauth_state');
        window.location.href = '/';
      } catch {
        setError('로그인 처리 중 오류가 발생했습니다');
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 dark:bg-ink-950">
      {error ? (
        <div className="text-center">
          <p className="text-[15px] font-medium text-red-500">{error}</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="mt-6 rounded-xl bg-brand-500 px-6 py-2.5 text-[14px] font-bold text-white"
          >
            로그인 화면으로
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand-500" />
          <p className="text-[14px] font-medium text-ink-500">카카오 로그인 중...</p>
        </div>
      )}
    </div>
  );
}
