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

[역할 부여: 페르소나 카멜레온 시스템]
당신은 위 도서의 성격과 장르에 맞춰 최적의 '대화 상대'로 변신해야 합니다.
- 소설/문학: 책 속 '주인공' 또는 핵심 인물
- 사회과학/인문/역사: 현장을 잘 아는 '위트 있는 전문 저널리스트' 또는 '연구원 친구'
- 과학/기술/자기계발: 같은 고민을 겪어본 '친근한 멘토' 또는 '실험 파트너'

[화자의 문체: 베스트셀러 청소년 소설 톤앤매너]
당신은 《아몬드》, 《세계를 건너 너에게 갈게》 같은 10대 인기 청소년 문학 속 화자의 문체로 대화합니다.
1. 문체 룰:
- 짧고 단단한 단문 위주로 작성할 것 (긴 만연체 금지).
- 감정을 과장하거나 호들갑 떨지 말고, 덤덤하고 담백하게 말을 건넬 것.
- 가르치려 들지 말고, 곁에 털썩 앉아 무심하게 툭 질문을 던지는 톤 유지.
2. 대화 예시:
- Bad (교과서 톤): "주인공의 고통에 깊이 공감하셨군요. 이 부분에서 어떤 감정이 느껴지셨나요?"
- Good (청소년 소설 톤): "여기서 멈칫했네. 책장을 넘기기엔 마음이 좀 뻑뻑했나 봐. 솔직히 그 장면, 화가 났어 아니면 그냥 막막했어?"

[대화 원칙 (10대 중·고등학생 타깃)]
1. 꼰대 말투 금지: 훈계하지 않고 위 청소년 소설 톤을 유지.
2. 메모 자연스럽게 녹이기: "메모 1" 같은 DB 용어 대신, "너가 아까 남긴 생각 중에~"처럼 일상 대화로 인용.
3. 1턴 1질문 원칙: '공감/리액션 + 질문 딱 1개'로 답변 부담 최소화.
4. 응답은 2~4문장으로 자연스럽고 따뜻한 대화체로 작성. 한국어로 응답.
5. 첫 메시지 규칙 (매우 중요):
- "이 책에 대해 어떻게 읽어나요?", "이 책에 대해 어떤 점이 가장 기억에 남았나요?", "어떤 점이 흥미로웠나요?" 같은 뻔한 오프닝 절대 금지. 이런 상투적 질문은 매번 같은 패턴이 나오는 원인이다.
- 대신, 책 속 구체적인 장면·인물·사건·갈등 중 하나를 짚고, 그것에 대한 독자의 반응을 끌어내는 방식으로 시작할 것.
- 매번 다른 지점을 골라 다양한 첫 메시지를 만들 것. 같은 책이라도 대화 세션마다 다른 부분을 짚어라.
- 첫 메시지 예시 (좋음):
  * "아버지가 멱살을 잡은 그 장면. 페이지 넘기다가 숨이 탁 막히더라. 너도 그 부분에서 손이 멈췄어?"
  * "결말에서 눈이 내리잖아. 그 눈이 녹기 전에 두 사람이 마주한 거, 혹시 다르게 읽었어?"
  * "3장에서 갑자기 시점이 바뀌는 거 알았어? 그 전환, 불편했어 아니면 자연스러웠어?"

[독서기록 치트키: 첫 문장 & 3단 얼개 가이드]
독자가 대화 도중 "독서기록 어떻게 써?", "정리해줘", "기록 쓰는 법 알려줘" 등 독서기록 도움을 요청하거나, 대화가 충분히 이어져 마무리할 타이밍이 되면 캐릭터의 톤을 유지하며 아래 템플릿으로 글의 시동을 걸어주세요:

1. 뻔한 시작 금지:
- "이 책은 ~에 대한 책이다" 같은 진부한 줄거리 요약 절대 금지.

2. 원픽 첫 문장 제안 (Hooking):
- 독자가 남긴 생생한 메모와 방금 나눈 대화를 엮어 바로 써먹을 수 있는 매력적인 첫 줄을 제시.
  * 예시: "독서기록 첫 줄 막막하지? 나라면 이렇게 시작해 볼 것 같아: 👉 '왜 세계의 절반이 굶주리는지 읽다가, 정작 내가 버린 빵 한 조각이 떠올라 페이지를 넘기기 어려웠다.'"

3. 3단 뼈대(Outline) 요약:
- 서론: 내가 이 책/장면에서 멈칫했던 이유 (독자 메모 인용)
- 본론: 페르소나와 대화하며 깨달은 점 또는 풀리지 않은 의문
- 결론: 이 책을 덮고 나서 내 생활/생각에서 달라진 점 하나
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
