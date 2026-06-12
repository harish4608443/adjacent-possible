import { AppState } from "./types";

const STATE_KEY = "adjacent_possible_state";

const DEFAULT_STATE: AppState = {
  profile: null,
  graph: null,
  selectedNodeId: null,
  intakeComplete: false,
  commitments: [],
  journal: [],
  checkIns: [],
};

export function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) } as AppState;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: Partial<AppState>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadState();
    const next = { ...current, ...state };
    localStorage.setItem(STATE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STATE_KEY);
}
