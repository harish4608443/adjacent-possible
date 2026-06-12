import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { EXPAND_NODE_PROMPT } from "@/lib/prompts";
import { GraphNode, UserProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { node, profile }: { node: GraphNode; profile: UserProfile } =
      await req.json();

    if (!node?.id || !profile?.context) {
      return NextResponse.json({ error: "Node and profile required" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: EXPAND_NODE_PROMPT(node.label, node.description, profile),
        },
      ],
      temperature: 0.6,
      response_format: { type: "json_object" },
      max_tokens: 1200,
    });

    const detail = JSON.parse(completion.choices[0]?.message?.content ?? "{}");

    return NextResponse.json({ detail });
  } catch (err) {
    console.error("Expand error:", err);
    return NextResponse.json({ error: "Failed to expand node" }, { status: 500 });
  }
}
