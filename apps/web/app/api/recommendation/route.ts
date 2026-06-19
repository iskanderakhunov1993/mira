import OpenAI from "openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      recommendation:
        "Сегодня телу может лучше подойти сбалансированный день: мягкое движение, достаточно белка, вода и спокойное вечернее восстановление.",
      source: "fallback"
    });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Ты Mira, мягкий премиальный AI wellness-коуч для женщин. Никогда не ставь диагнозы. Используй вероятностные формулировки. Отвечай кратко, поддерживающе и на русском языке."
      },
      {
        role: "user",
        content: `Создай рекомендацию для тела на сегодня по этому контексту: ${JSON.stringify(body)}`
      }
    ],
    temperature: 0.6
  });

  return NextResponse.json({
    recommendation: response.choices[0]?.message.content,
    source: "openai"
  });
}
