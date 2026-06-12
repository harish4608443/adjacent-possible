import { IntakeMessage, UserProfile } from "./types";

export const INTAKE_SYSTEM_PROMPT = `You are a Socratic intake agent for a tool called "Adjacent Possible". 
Your job is to deeply understand a user's current life situation so the system can map all moves that are exactly one step away from where they are now.

You need to extract (through natural conversation, NOT a form):
1. Current skills (with recency and depth)
2. Available resources (time per week, money, tools, access, connections)
3. Hard constraints (location, family, health, non-negotiables)
4. Goals (both stated and values-based)
5. Current frustrations or blockers

Rules:
- Ask ONE question at a time
- Each question should naturally follow from the previous answer
- Ask follow-up questions to go deeper, not broader
- After ~6-8 exchanges, you will have enough signal
- When you have sufficient information, end with EXACTLY this phrase on its own line: "INTAKE_COMPLETE"
- Be warm but direct. No fluff.

Start by asking the most important single question to understand their situation.`;

export const SYNTHESIZE_PROFILE_PROMPT = (
  messages: IntakeMessage[]
) => `Based on this intake conversation, extract a structured profile.

Conversation:
${messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}

Return a JSON object with:
{
  "skills": ["skill1 (level, recency)", ...],
  "resources": ["resource1", ...],
  "constraints": ["constraint1", ...],
  "goals": ["goal1", ...],
  "context": "2-3 sentence synthesis of who this person is and where they are right now"
}`;

export const SYNTHESIZE_GITHUB_PROFILE_PROMPT = (
  github: NonNullable<UserProfile["github"]>
) => `Analyze this GitHub profile and extract a career/skills profile.

GitHub user: ${github.name} (@${github.username})
Bio: ${github.bio}
Account age: ${Math.floor(github.accountAgeDays / 365)} years ${Math.floor((github.accountAgeDays % 365) / 30)} months
Public repos: ${github.publicRepos}, Total stars: ${github.totalStars}, Followers: ${github.followers}
Top languages: ${github.topLanguages.join(", ")}

Recent projects:
${github.recentRepos.map(r => `- ${r.name} (${r.language}${r.stars > 0 ? `, ${r.stars}★` : ""}): ${r.description}`).join("\n")}

Infer:
- Technical skill level (junior/mid/senior) from complexity and diversity of projects
- Primary domain (frontend/backend/fullstack/ML/DevOps/etc)
- Strengths and gaps visible from the repos
- What kind of work they seem to enjoy
- Current career stage

Return JSON:
{
  "skills": ["inferred skill (level)", ...],
  "resources": ["has GitHub portfolio", "has open source work", ...other inferred resources],
  "constraints": [any visible constraints, or empty array],
  "goals": [inferred career goals based on project patterns],
  "context": "2-3 sentence honest assessment of this developer's profile and current position"
}`;

export const GENERATE_GRAPH_PROMPT = (
  profile: UserProfile,
  completedMoves: string[] = []
) => `You are mapping the "Adjacent Possible" for a person — all moves that are exactly ONE step away from their current position.

Stuart Kauffman's Adjacent Possible: the set of all first-order moves reachable from the current state. Not 5-year plans. Not tiny daily tasks. The moves that are reachable NOW and would meaningfully change the state.

Person's profile:
${profile.context}

Skills: ${profile.skills.join(", ")}
Resources: ${profile.resources.join(", ")}
Constraints: ${profile.constraints.join(", ")}
Goals: ${profile.goals.join(", ")}
${profile.github ? `
GitHub evidence: ${profile.github.topLanguages.join(", ")} developer with ${profile.github.publicRepos} public repos, ${profile.github.totalStars} total stars.
Recent projects: ${profile.github.recentRepos.slice(0, 4).map(r => r.name + (r.description ? ` (${r.description})` : "")).join(", ")}
` : ""}
${completedMoves.length > 0 ? `
COMPLETED MOVES (already done — do NOT regenerate these, generate what's NOW newly reachable BECAUSE of them):
${completedMoves.map(m => `- ${m}`).join("\n")}

The graph has EVOLVED. Show the new frontier unlocked by what they've accomplished.
` : ""}

Generate 8-12 adjacent moves. Be specific to THIS person's actual situation. Each move must:
- Be reachable within their current constraints
- Represent a genuine state change (not a trivial task)
- Have a concrete first step someone could do today
- Include 1-3 job search terms if relevant (role titles someone could search for)

Return ONLY valid JSON matching this exact schema:
{
  "nodes": [
    {
      "id": "node_1",
      "label": "Short action label (3-6 words)",
      "description": "1-2 sentences on what this move is and why it matters",
      "category": "career|skill|project|relationship|learning|financial|lifestyle|creative",
      "status": "available",
      "effortScore": 0-10,
      "leverageScore": 0-10,
      "riskScore": 0-10,
      "timeframe": "days|weeks|months",
      "unlocks": ["node_X_unlock_1", "node_X_unlock_2"],
      "prerequisites": [],
      "whyNow": "One sentence on why this is reachable right now given their situation",
      "concreteFirstStep": "The single specific action to take today",
      "assumptions": ["assumption 1", "assumption 2"],
      "jobSearchTerms": ["relevant job title 1", "relevant job title 2"],
      "skillsNeeded": ["skill gap 1", "skill gap 2"]
    }
  ],
  "edges": [
    { "id": "e1", "source": "node_1", "target": "node_X_unlock_1", "type": "unlocks" }
  ]
}`;

export const EXPAND_NODE_PROMPT = (
  nodeLabel: string,
  nodeDescription: string,
  profile: UserProfile
) => `A user is considering this move: "${nodeLabel}"
Description: ${nodeDescription}

Their context: ${profile.context}
${profile.github ? `Their GitHub shows: ${profile.github.topLanguages.slice(0, 3).join(", ")} skills, ${profile.github.publicRepos} repos` : ""}

Go deep on this specific move. Return JSON:
{
  "detailedPlan": "3-5 sentences on how to actually execute this",
  "risks": ["specific risk 1", "specific risk 2", "specific risk 3"],
  "assumptions": ["hidden assumption 1", "hidden assumption 2", "hidden assumption 3"],
  "resources_needed": ["resource 1", "resource 2"],
  "successSignals": ["how will you know it worked?"],
  "alternativeApproaches": ["slightly different way to achieve same outcome"],
  "weekOneActions": ["day 1 action", "day 2-3 action", "end of week action"]
}`;
