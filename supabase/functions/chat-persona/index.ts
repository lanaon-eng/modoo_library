import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

type RequestBody = {
  bookTitle: string;
  bookAuthor?: string;
  userNote?: string;
  category?: string;
  action: "chat" | "summarize";
  messages: { role: "user" | "assistant"; content: string }[];
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as RequestBody;
    const { bookTitle, bookAuthor, userNote, category, action, messages } = body;

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

    if (action === "summarize") {
      const systemPrompt = `당신은 독서 토론을 요약하는 AI입니다. 다음 대화를 바탕으로 「${bookTitle}」에 대한 카드뉴스를 만들어주세요.

규칙:
- 정확히 3장의 카드를 JSON 배열 형식으로 출력하세요.
- 각 카드는 { "title": string, "content": string, "emoji": string } 형식입니다.
- title은 10자 이내의 짧은 제목입니다.
- content는 60자 이내의 핵심 내용입니다.
- emoji는 카드 주제를 나타내는 이모지 1개입니다.
- JSON 외의 다른 텍스트는 출력하지 마세요.
${userNote ? `\n책 소개: ${userNote}` : ""}`;

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
${userNote ? `\n책 소개: ${userNote}` : ""}`;

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
