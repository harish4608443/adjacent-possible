import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { JOURNAL_ANALYSIS_PROMPT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const { decision, context, options }: { decision: string; context: string; options: string } =
      await req.json();

    if (!decision) {
      return NextResponse.json({ error: "Decision required" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: JOURNAL_ANALYSIS_PROMPT(decision, context, options) }],
      temperature: 0.6,
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const analysis = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("Journal error:", err);
    return NextResponse.json({ error: "Failed to analyze" }, { status: 500 });
  }
}
