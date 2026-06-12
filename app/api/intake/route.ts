import { NextRequest, NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";
import { INTAKE_SYSTEM_PROMPT, SYNTHESIZE_PROFILE_PROMPT } from "@/lib/prompts";
import { IntakeMessage } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: IntakeMessage[] } = await req.json();

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: INTAKE_SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 400,
    });

    const reply = completion.choices[0]?.message?.content ?? "";
    const isComplete = reply.includes("INTAKE_COMPLETE");

    // If intake is complete, synthesize the profile
    if (isComplete) {
      const cleanReply = reply.replace("INTAKE_COMPLETE", "").trim();
      const allMessages: IntakeMessage[] = [
        ...messages,
        { role: "assistant", content: cleanReply },
      ];

      const synthesis = await getOpenAI().chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: SYNTHESIZE_PROFILE_PROMPT(allMessages),
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 800,
      });

      const profileData = JSON.parse(
        synthesis.choices[0]?.message?.content ?? "{}"
      );

      return NextResponse.json({
        reply: cleanReply,
        isComplete: true,
        profile: {
          rawAnswers: allMessages,
          skills: profileData.skills ?? [],
          resources: profileData.resources ?? [],
          constraints: profileData.constraints ?? [],
          goals: profileData.goals ?? [],
          context: profileData.context ?? "",
        },
      });
    }

    return NextResponse.json({ reply, isComplete: false });
  } catch (err) {
    console.error("Intake error:", err);
    return NextResponse.json({ error: "Failed to process intake" }, { status: 500 });
  }
}
