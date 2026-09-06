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

  return `\n\n[독자가 읽으며 남긴 메모]\n${formatted}\n\n중요: 위 메모는 독자가 책을 읽으면서 직접 기록한 것입니다. 이 메모들을 적극적으로 활용하세요:\n- 특정 메모를 인용하며 "메모에서 ~라고 하셨는데, 이 부분에 대해 더 깊이 생각해볼까요?" 같은 질문을 하세요.\n- 여러 메모 사이의 연관성을 짚어주세요. ("메모 1과 메모 3을 보면 ~라는 공통 주제가 보이는데, 어떻게 생각하시나요?")\n- 메모에 남긴 질문에 대해 책 내용과 연결하여 간접적으로 답을 유도하세요.\n- 메모가 없는 주제보다 메모에 있는 주제를 우선적으로 다루세요.`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as RequestBody;
    const { bookTitle, bookAuthor, userNote, category, action, messages, readingNotes } = body;

    if (!bookTitle || !messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "bookTitle, messages are required" }),
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

    const notesSection = formatNotesForPrompt(readingNotes);

    if (action === "summarize") {
      const systemPrompt = `당신은 독서 토론을 요약하는 AI입니다. 다음 대화를 바탕으로 「${bookTitle}」에 대한 카드뉴스를 만들어주세요.

규칙:
- 정확히 3장의 카드를 JSON 배열 형식으로 출력하세요.
- 각 카드는 { "title": string, "content": string, "emoji": string } 형식입니다.
- title은 10자 이내의 짧은 제목입니다.
- content는 60자 이내의 핵심 내용입니다.
- emoji는 카드 주제를 나타내는 이모지 1개입니다.
- JSON 외의 다른 텍스트는 출력하지 마세요.
- 독자가 남긴 메모와 대화 내용을 반영하여 개인화된 카드를 만드세요.
${userNote ? `\n책 소개: ${userNote}` : ""}${notesSection}`;

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
    const systemPrompt = `당신은 독자와 함께 「${bookTitle}」${bookAuthor ? ` (저자: ${bookAuthor})` : ""}을(를) 깊이 있게 읽고 토론하는 AI 독서 파트너입니다.
${category ? `이 책은 ${category} 과목과 관련이 있습니다.` : ""}

중요 규칙:
- 책의 내용에 기반하여 구체적인 장면, 인물, 주제를 언급하며 대화합니다.
- 독자에게 책의 핵심 내용과 관련된 구체적인 질문을 던져 깊은 생각을 유도합니다.
- 정답을 제시하지 않고, 독자가 스스로 생각할 수 있도록 열린 질문을 합니다.
- 독자의 답변에 공감하며, 그 생각을 더 펼칠 수 있도록 유도합니다.
- 첫 메시지에서는 책의 구체적인 내용이나 주제를 하나 짚으며 자연스럽게 대화를 시작하세요.
- 응답은 2~4문장으로 자연스럽고 따뜻한 대화체로 작성합니다.
- 한국어로 응답합니다.
${userNote ? `\n책 소개: ${userNote}` : ""}${notesSection}`;

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
