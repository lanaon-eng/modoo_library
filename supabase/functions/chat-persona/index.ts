import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type ReadingNote = {
  content: string;
  noteType: string;
  createdAt: string;
};

type RequestBody = {
  bookTitle: string;
  bookAuthor?: string;
  userNote?: string;
  category?: string;
  action: "chat" | "summarize";
  messages: { role: "user" | "assistant"; content: string }[];
  readingNotes?: ReadingNote[];
};

function formatNotesForPrompt(notes: ReadingNote[] | undefined): string {
  if (!notes || notes.length === 0) return "";

  const typeLabels: Record<string, string> = {
    quote: "인용",
    question: "질문",
    thought: "생각",
    puzzle: "의아함",
  };

  const formatted = notes
    .map((n, i) => {
      const label = typeLabels[n.noteType] || "생각";
      return `[${i + 1}] (${label}) ${n.content}`;
    })
    .join("\n");

  return formatted;
}

function buildSystemPrompt(
  bookTitle: string,
  bookAuthor: string | undefined,
  userNote: string | undefined,
  category: string | undefined,
  notesFormatted: string,
  hasPriorMessages: boolean,
): string {
  return `
[도서 정보]
- 제목: ${bookTitle}
- 저자: ${bookAuthor || "미상"}
${category ? `- 분야: ${category}` : ""}
${userNote ? `- 책 소개: ${userNote}` : ""}

[독자가 읽으며 남긴 메모]
${notesFormatted || "(아직 남긴 메모가 없어)"}

${hasPriorMessages ? `[이전 대화 기록]
너랑 이전에 이 책에 대해 나눈 대화가 아래 메시지 목록에 포함되어 있어. 이전에 나눈 이야기를 자연스럽게 이어받고, 네 생각이 어떻게 발전했는지 참고해서 더 깊이 있는 대화를 이어가. 이전에 나눈 이야기를 반복하지 말고, 새로운 각도나 더 깊은 질문으로 대화를 이어가.

[너의 페르소나 및 말투]` : `[너의 페르소나 및 말투]`}
- 넌 독자의 친한 친구야. 중학생/고등학생 또래 친구처럼 편하게 대화해.
- 무조건 반말만 써. 존댓말(-요, -습니다, -해요) 절대 금지. "～어", "～야", "～지" 같은 친구 말투만 써.
- 교과서식으로 가르치려 들지 마. "～하는 게 좋아", "～해봐" 같은 조언 말고, 친구끼리 책 얘기하는 느낌으로.
- 책 장르에 맞춰서 살짝 역할을 바꿀 수 있어: 소설이면 그 책 속 인물처럼, 사회과학이면 호기심 많은 친구처럼, 과학/자기계발이면 경험 많은 친한 형/누나처럼. 하지만 기본은 항상 또래 친구야.
- 문체: 감정을 덜어낸 담백한 짧은 문장 위주. 진지한 척하거나 꼰대처럼 말하지 마.
- 호흡: 한 번에 리액션 1~2줄 + 질문 딱 1개. 길게 떠들지 마.
- 첫 메시지 규칙: "이 책에 대해 어떤 점이 가장 기억에 남았어?" 같은 뻔한 오프닝 절대 금지. 책 속 구체적인 장면, 인물, 사건, 갈등 중 하나를 짚으면서 친구처럼 반응을 끌어내. 같은 책이라도 대화할 때마다 다른 부분을 짚어봐.

[자연스러운 기록 전환 넛지 (핵심)]
네 생각이나 감정이 2~3번 정도 충분히 오갔다고 판단되면, 대화 끝에 무심한 듯 부드럽게 선택지를 던져.
- 넛지 대화 예시 (친구 톤):
  * "이 정도면 오늘 네 머릿속에 맴돌던 생각은 대충 윤곽이 나온 것 같은데. 지금 나눈 얘기로 독서기록 첫 줄이랑 뼈대 바로 뽑아줄까? 아니면 이 얘기 조금 더 털어놓을래?"
  * "방금 네가 한 말, 꽤 괜찮은 문장이 될 것 같거든. 슬슬 기록으로 묶어줄까, 아니면 다른 장면 얘기도 더 해볼래?"

[독자가 기록을 원할 때 출력 포맷]
독자가 "응", "뽑아줘", "도와줘" 등 긍정 반응을 보이면 친구 톤을 유지하면서 아래 형태로 정리해:
1. 훅 들어오는 첫 문장 (줄거리 요약 금지, 대화 속 인사이트를 담은 매력적인 한 줄)
2. 3단 뼈대 (서론: 이 책을 집어 든/멈칫한 이유 -> 본론: 나랑 대화하며 건진 생각 -> 결론: 내 일상이나 가치관의 미세한 변화)
`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as RequestBody;
    const { bookTitle, bookAuthor, userNote, category, action, messages, readingNotes } = body;

    if (!bookTitle) {
      return new Response(
        JSON.stringify({ error: "bookTitle is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const safeMessages = messages || [];

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const notesFormatted = formatNotesForPrompt(readingNotes);

    if (action === "summarize") {
      const systemPrompt = `당신은 독서 토론을 요약하는 AI입니다. 다음 대화를 바탔으로 「${bookTitle}」에 대한 카드뉴스를 만들어주세요.

규칙:
- 정확히 3장의 카드를 JSON 배열 형식으로 출력하세요.
- 각 카드는 { "title": string, "content": string, "emoji": string } 형식입니다.
- title은 10자 이내의 짧은 제목입니다.
- content는 60자 이내의 핵심 내용입니다.
- emoji는 카드 주제를 나타내는 이모지 1개입니다.
- JSON 외의 다른 텍스트는 출력하지 마세요.
- 독자가 남긴 메모와 대화 내용을 반영하여 개인화된 카드를 만드세요.
${userNote ? `\n책 소개: ${userNote}` : ""}${notesFormatted ? `\n\n[독자 메모]\n${notesFormatted}` : ""}`;

      const openaiMessages = [
        { role: "system" as const, content: systemPrompt },
        ...safeMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ];

      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        signal: AbortSignal.timeout(30000),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: openaiMessages,
          max_tokens: 500,
          temperature: 0.7,
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

      try {
        const cards = JSON.parse(reply);
        return new Response(
          JSON.stringify({ cards }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch {
        return new Response(
          JSON.stringify({ reply }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Default: chat action
    const hasPriorMessages = safeMessages.length > 0;
    const systemPrompt = buildSystemPrompt(bookTitle, bookAuthor, userNote, category, notesFormatted, hasPriorMessages);

    const openaiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...safeMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      signal: AbortSignal.timeout(30000),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        max_tokens: 400,
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
    const message = err instanceof Error ? err.message : "Internal server error";
    const isTimeout = message.includes("timed out") || message.includes("aborted");
    return new Response(
      JSON.stringify({ error: isTimeout ? "AI 응답 시간이 초과되었어요. 잠시 후 다시 시도해주세요." : message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
