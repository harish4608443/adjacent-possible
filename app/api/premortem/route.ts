import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { PREMORTEM_PROMPT } from "@/lib/prompts";
import { GraphNode, UserProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { node, profile }: { node: GraphNode; profile: UserProfile } = await req.json();
    if (!node?.label || !profile?.context) {
      return NextResponse.json({ error: "Node and profile required" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: PREMORTEM_PROMPT(node.label, node.description, profile) }],
      temperature: 0.7,
      response_format: { type: "json_object" },
      max_tokens: 1200,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    return NextResponse.json({ premortem: result });
  } catch (err) {
    console.error("Pre-mortem error:", err);
    return NextResponse.json({ error: "Failed to generate pre-mortem" }, { status: 500 });
  }
}
