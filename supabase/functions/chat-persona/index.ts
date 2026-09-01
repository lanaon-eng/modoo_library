import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type ChatRole = "protagonist" | "villain" | "helper";

type RequestBody = {
  bookTitle: string;
  bookAuthor?: string;
  bookContents?: string;
  category?: string;
  role: ChatRole;
  messages: { role: "user" | "assistant"; content: string }[];
};

const ROLE_LABELS: Record<ChatRole, { label: string; desc: string }> = {
  protagonist: {
    label: "주인공",
    desc: "책의 주인공으로서 독자와 대화합니다. 주인공의 감정, 선택, 성장을 중심으로 이야기합니다.",
  },
  villain: {
    label: "악당/라이벌",
    desc: "책의 악당이나 라이벌로서 독자와 대화합니다. 자신만의 논리와 입장을 가지고 있습니다.",
  },
  helper: {
    label: "조력자",
    desc: "책의 조력자/멘토로서 독자에게 지혜를 전합니다. 따뜻하면서도 깊이 있는 통찰을 줍니다.",
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as RequestBody;
    const { bookTitle, bookAuthor, bookContents, category, role, messages } = body;

    if (!bookTitle || !role || !messages) {
      return new Response(
        JSON.stringify({ error: "bookTitle, role, messages are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const roleInfo = ROLE_LABELS[role];
    if (!roleInfo) {
      return new Response(
        JSON.stringify({ error: "Invalid role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = `당신은 「${bookTitle}」${bookAuthor ? ` (저자: ${bookAuthor})` : ""}이라는 책 속의 ${roleInfo.label}입니다.
${roleInfo.desc}
${category ? `이 책은 ${category} 과목과 관련이 있습니다.` : ""}

중요 규칙:
- 항상 ${roleInfo.label}의 1인칭 시점으로 대화합니다.
- 책의 내용과 세계관에 충실하게 응답합니다.
- 독자에게 질문을 던지며 깊은 생각을 유도합니다.
- 응답은 2~4문장으로 자연스럽고 따뜻한 대화체로 작성합니다.
- 한국어로 응답합니다.
${bookContents ? `\n책 소개: ${bookContents}` : ""}`;

    const openaiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${openaiRes.status}`, detail: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return new Response(
        JSON.stringify({ error: "Empty response from OpenAI" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
