import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(body: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeState(state: string) {
  const padded = state.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(state.length / 4) * 4, "=");
  const parsed = JSON.parse(atob(padded)) as { origin?: string };
  if (!parsed.origin) throw new Error("Missing callback origin");
  const origin = new URL(parsed.origin);
  if (origin.protocol !== "https:" && origin.hostname !== "localhost") {
    throw new Error("Invalid callback origin");
  }
  return origin.origin;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const requestUrl = new URL(req.url);

    if (req.method === "GET") {
      const code = requestUrl.searchParams.get("code");
      const state = requestUrl.searchParams.get("state");
      if (!code || !state) return jsonResponse({ error: "잘못된 카카오 로그인 요청입니다" }, 400);

      const appOrigin = decodeState(state);
      const callbackUrl = new URL(`${appOrigin}/auth/kakao`);
      callbackUrl.searchParams.set("code", code);
      callbackUrl.searchParams.set("state", state);
      return Response.redirect(callbackUrl.toString(), 302);
    }

    const { code, redirect_uri, client_id } = await req.json();
    if (!code || !redirect_uri || !client_id) {
      return jsonResponse({ error: "잘못된 카카오 로그인 요청입니다" }, 400);
    }

    const tokenParams = new URLSearchParams({ grant_type: "authorization_code", client_id, code, redirect_uri });
    const clientSecret = Deno.env.get("KAKAO_CLIENT_SECRET");
    if (clientSecret) tokenParams.set("client_secret", clientSecret);

    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams,
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return jsonResponse({ error: tokenData.error_description || "카카오 인증에 실패했습니다" }, 400);
    }
    const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (!userRes.ok) return jsonResponse({ error: "카카오 사용자 정보를 가져올 수 없습니다" }, 400);

    const userData = await userRes.json();
    const kakaoId = String(userData.id);
    const nickname = userData.properties?.nickname || userData.kakao_account?.profile?.nickname || "카카오 사용자";
    const profileImage = userData.properties?.profile_image || userData.kakao_account?.profile?.thumbnail_image_url || "";
    const email = `kakao_${kakaoId}@kakao.local`;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const password = `kp_${kakaoId}_${serviceKey.slice(-20)}`;
    const userMetadata = { full_name: nickname, name: nickname, avatar_url: profileImage, provider: "kakao" };

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (createError && !createError.message.includes("already been registered")) throw createError;
    if (createError) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      const existingUser = data.users.find((user) => user.email === email);
      if (!existingUser) throw new Error("Kakao user not found");
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: userMetadata,
      });
      if (updateError) throw updateError;
    }

    return jsonResponse({ email, password });
  } catch (err) {
    const message = err instanceof Error ? err.message : "카카오 로그인 처리 중 오류가 발생했습니다";
    return jsonResponse({ error: message }, 500);
  }
});
