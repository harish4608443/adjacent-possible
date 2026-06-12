import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { CHECKIN_PROMPT } from "@/lib/prompts";
import { Commitment, CheckIn } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const {
      commitments,
      outcomes,
      allCheckIns,
    }: {
      commitments: Commitment[];
      outcomes: { commitmentId: string; outcome: string; reflection: string }[];
      allCheckIns: CheckIn[];
    } = await req.json();

    if (!commitments?.length) {
      return NextResponse.json({ error: "Commitments required" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: CHECKIN_PROMPT(commitments, outcomes, allCheckIns) }],
      temperature: 0.6,
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const analysis = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("Check-in error:", err);
    return NextResponse.json({ error: "Failed to analyze check-in" }, { status: 500 });
  }
}
