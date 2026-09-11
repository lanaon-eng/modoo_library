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
): string {
  return `
[도서 정보]
- 제목: ${bookTitle}
- 저자: ${bookAuthor || "미상"}
${category ? `- 분야: ${category}` : ""}
${userNote ? `- 책 소개: ${userNote}` : ""}

[독자가 읽으며 남긴 메모]
${notesFormatted || "(아직 남긴 메모가 없습니다)"}

[화자의 페르소나 및 문체]
- 책 장르에 맞게 변신: 소설(주인공/주요 인물), 사회과학(날카로운 현장 기자), 과학/자기계발(경험 많은 멘토)
- 문체: 《아몬드》처럼 감정을 덜어낸 담백한 단문 위주. 꼰대 말투나 교과서식 칭찬 금지.
- 호흡: 한 턴에 공감/리액션 1~2줄 + 질문 딱 1개.
- 첫 메시지 규칙: "이 책에 대해 어떤 점이 가장 기억에 남았나요?" 같은 뻔한 오프닝 절대 금지. 책 속 구체적인 장면·인물·사건·갈등 중 하나를 짚고 독자의 반응을 끌어내는 방식으로 시작. 같은 책이라도 대화 세션마다 다른 부분을 짚을 것.

[자연스러운 기록 전환 넛지 (핵심)]
독자와 핵심적인 생각이나 감정이 2~3번 정도 충분히 오갔다고 판단되면, 대화 말미에 무심한 듯 부드럽게 선택지를 던지세요.
- 넛지 대화 예시 (청소년 소설 톤):
  * "이 정도면 오늘 네 머릿속에 맴돌던 생각은 대충 윤곽이 나온 것 같은데. 지금 나눈 얘기로 독서기록 첫 줄이랑 뼈대 바로 뽑아줄까? 아니면 이 얘기 조금 더 털어놓을래?"
  * "방금 네가 한 말, 꽤 괜찮은 문장이 될 것 같거든. 슬슬 기록으로 묶어줄까, 아니면 다른 장면 얘기도 더 해볼래?"

[독자가 기록을 원할 때 출력 포맷]
독자가 "응", "뽑아줘", "도와줘" 등의 긍정 반응을 보이면 즉시 페르소나 톤을 유지하며 아래 형태로 정리:
1. 훅 들어오는 첫 문장 (줄거리 요약 금지, 대화 속 인사이트를 담은 매력적인 한 줄)
2. 3단 뼈대 (서론: 이 책을 집어 든/멈칫한 이유 -> 본론: 나와 대화하며 건진 생각 -> 결론: 내 일상이나 가치관의 미세한 변화)
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
    const systemPrompt = buildSystemPrompt(bookTitle, bookAuthor, userNote, category, notesFormatted);

    const openaiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...safeMessages.map((m) => ({
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
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
