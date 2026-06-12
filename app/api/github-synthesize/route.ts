import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { SYNTHESIZE_GITHUB_PROFILE_PROMPT } from "@/lib/prompts";
import { GitHubData, UserProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { github }: { github: GitHubData } = await req.json();

    if (!github?.username) {
      return NextResponse.json({ error: "GitHub data required" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: SYNTHESIZE_GITHUB_PROFILE_PROMPT(github) }],
      temperature: 0.4,
      response_format: { type: "json_object" },
      max_tokens: 800,
    });

    const data = JSON.parse(completion.choices[0]?.message?.content ?? "{}");

    const profile: UserProfile = {
      rawAnswers: [],
      skills: data.skills ?? [],
      resources: data.resources ?? [],
      constraints: data.constraints ?? [],
      goals: data.goals ?? [],
      context: data.context ?? "",
      github,
    };

    return NextResponse.json({ profile });
  } catch (err) {
    console.error("GitHub synthesis error:", err);
    return NextResponse.json({ error: "Failed to synthesize GitHub profile" }, { status: 500 });
  }
}
