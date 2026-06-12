import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { GENERATE_GRAPH_PROMPT } from "@/lib/prompts";
import { AdjacentGraph, UserProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const {
      profile,
      completedMoves = [],
      generationCount = 0,
    }: { profile: UserProfile; completedMoves?: string[]; generationCount?: number } =
      await req.json();

    if (!profile?.context) {
      return NextResponse.json({ error: "Profile required" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: GENERATE_GRAPH_PROMPT(profile, completedMoves),
        },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
      max_tokens: 4000,
    });

    const raw = JSON.parse(completion.choices[0]?.message?.content ?? "{}");

    const graph: AdjacentGraph = {
      nodes: raw.nodes ?? [],
      edges: raw.edges ?? [],
      generatedAt: new Date().toISOString(),
      userContext: profile.context,
      generationCount: generationCount + 1,
      completedMoves,
    };

    return NextResponse.json({ graph });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "Failed to generate graph" }, { status: 500 });
  }
}
