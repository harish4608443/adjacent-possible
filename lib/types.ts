export interface GitHubData {
  username: string;
  name: string;
  bio: string;
  followers: number;
  publicRepos: number;
  topLanguages: string[];
  recentRepos: { name: string; description: string; language: string; stars: number; updatedAt: string }[];
  totalStars: number;
  accountAgeDays: number;
}

export interface UserProfile {
  rawAnswers: IntakeMessage[];
  skills: string[];
  resources: string[];
  constraints: string[];
  goals: string[];
  context: string;
  github?: GitHubData;
}

export interface IntakeMessage {
  role: "assistant" | "user";
  content: string;
}

export type NodeStatus = "available" | "done" | "locked";
export type NodeCategory =
  | "career"
  | "skill"
  | "project"
  | "relationship"
  | "learning"
  | "financial"
  | "lifestyle"
  | "creative";

export interface GraphNode {
  id: string;
  label: string;
  description: string;
  category: NodeCategory;
  status: NodeStatus;
  effortScore: number;
  leverageScore: number;
  riskScore: number;
  timeframe: "days" | "weeks" | "months";
  unlocks: string[];
  prerequisites: string[];
  whyNow: string;
  concreteFirstStep: string;
  assumptions: string[];
  jobSearchTerms: string[]; // e.g. ["senior react developer", "frontend engineer"]
  skillsNeeded: string[];   // skills this move requires that user may lack
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "unlocks" | "requires";
}

export interface AdjacentGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  generatedAt: string;
  userContext: string;
  generationCount: number; // tracks how many times regenerated (for paywall)
  completedMoves: string[]; // labels of done nodes carried across generations
}

export interface AppState {
  profile: UserProfile | null;
  graph: AdjacentGraph | null;
  selectedNodeId: string | null;
  intakeComplete: boolean;
}
