import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { WHYNOT_SYSTEM_PROMPT } from "@/lib/prompts";
import { IntakeMessage } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      nodeLabel,
    }: { messages: IntakeMessage[]; nodeLabel: string } = await req.json();

    if (!nodeLabel) {
      return NextResponse.json({ error: "nodeLabel required" }, { status: 400 });
    }

    const systemPrompt = `${WHYNOT_SYSTEM_PROMPT}\n\nThe action they keep not doing: "${nodeLabel}"`;

    const completion = await getOpenAI().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...(messages.length === 0
          ? [{ role: "user" as const, content: `I want to explore why I keep not doing: "${nodeLabel}"` }]
          : messages.map((m) => ({ role: m.role, content: m.content }))),
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    const blockerFound = reply.includes("BLOCKER_FOUND:");
    const cleanReply = blockerFound
      ? reply.split("BLOCKER_FOUND:")[0].trim()
      : reply;
    const blocker = blockerFound
      ? reply.split("BLOCKER_FOUND:")[1]?.trim()
      : null;

    return NextResponse.json({ reply: cleanReply, blockerFound, blocker });
  } catch (err) {
    console.error("Why not error:", err);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
