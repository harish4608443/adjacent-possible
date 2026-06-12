"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { loadState, saveState } from "@/lib/store";
import { AdjacentGraph, Commitment, GraphNode, UserProfile } from "@/lib/types";
import NodePanel from "@/components/NodePanel";
import {
  RefreshCw,
  Home,
  ChevronRight,
  Clock,
  Zap,
  TrendingUp,
  CheckCircle2,
  GitBranch,
  Briefcase,
} from "lucide-react";

// Cytoscape requires browser APIs — load client-only
const GraphView = dynamic(() => import("@/components/GraphView"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-gray-600 text-sm">
      Loading graph…
    </div>
  ),
});

const CATEGORY_COLORS: Record<string, string> = {
  career: "bg-blue-400/20 text-blue-300 border-blue-400/30",
  skill: "bg-violet-400/20 text-violet-300 border-violet-400/30",
  project: "bg-amber-400/20 text-amber-300 border-amber-400/30",
  relationship: "bg-pink-400/20 text-pink-300 border-pink-400/30",
  learning: "bg-emerald-400/20 text-emerald-300 border-emerald-400/30",
  financial: "bg-green-400/20 text-green-300 border-green-400/30",
  lifestyle: "bg-orange-400/20 text-orange-300 border-orange-400/30",
  creative: "bg-cyan-400/20 text-cyan-300 border-cyan-400/30",
};

export default function ExplorePage() {
  const router = useRouter();
  const [graph, setGraph] = useState<AdjacentGraph | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [view, setView] = useState<"graph" | "list">("graph");
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const state = loadState();
    if (!state.intakeComplete || !state.graph || !state.profile) {
      router.push("/intake");
      return;
    }
    setGraph(state.graph);
    setProfile(state.profile);
    setSelectedNodeId(state.selectedNodeId ?? null);
  }, [router]);

  const selectedNode = graph?.nodes.find((n) => n.id === selectedNodeId) ?? null;

  const handleSelectNode = (id: string) => {
    setSelectedNodeId(id);
    saveState({ selectedNodeId: id });
  };

  const handleClosePanel = () => {
    setSelectedNodeId(null);
    saveState({ selectedNodeId: null });
  };

  const handleMarkDone = useCallback(
    async (nodeId: string, commitment: Omit<Commitment, "id" | "committedAt">) => {
      if (!graph || !profile) return;
      const doneNode = graph.nodes.find((n) => n.id === nodeId);
      const updated: AdjacentGraph = {
        ...graph,
        nodes: graph.nodes.map((n) => n.id === nodeId ? { ...n, status: "done" } : n),
      };
      const newCompletedMoves = [...(graph.completedMoves ?? []), doneNode?.label ?? nodeId];

      // Save commitment to store
      const newCommitment: Commitment = {
        ...commitment,
        id: `c_${Date.now()}`,
        committedAt: new Date().toISOString(),
      };
      const currentState = loadState();
      const updatedCommitments = [...(currentState.commitments ?? []), newCommitment];

      setGraph(updated);
      saveState({ graph: updated, commitments: updatedCommitments });
      setSelectedNodeId(null);

      // Auto-evolve the graph
      setRegenerating(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile,
            completedMoves: newCompletedMoves,
            generationCount: graph.generationCount ?? 1,
          }),
        });
        const data = await res.json();
        if (data.graph) {
          const doneIds = new Set(updated.nodes.filter(n => n.status === "done").map(n => n.label));
          const evolvedGraph: AdjacentGraph = {
            ...data.graph,
            nodes: data.graph.nodes.map((n: GraphNode) => doneIds.has(n.label) ? { ...n, status: "done" } : n),
          };
          setGraph(evolvedGraph);
          saveState({ graph: evolvedGraph, selectedNodeId: null });
        }
      } finally {
        setRegenerating(false);
      }
    },
    [graph, profile]
  );

  const handleRegenerate = async () => {
    if (!profile || regenerating) return;
    setRegenerating(true);
    setSelectedNodeId(null);
    const completedMoves = graph?.completedMoves ?? [];
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          completedMoves,
          generationCount: graph?.generationCount ?? 0,
        }),
      });
      const data = await res.json();
      if (data.graph) {
        setGraph(data.graph);
        saveState({ graph: data.graph, selectedNodeId: null });
      }
    } finally {
      setRegenerating(false);
    }
  };

  if (!graph || !profile) return null;

  const doneCount = graph.nodes.filter((n) => n.status === "done").length;
  const genCount = graph.generationCount ?? 1;
  const topLeverage = [...graph.nodes]
    .filter((n) => n.status !== "done")
    .sort((a, b) => b.leverageScore - a.leverageScore)
    .slice(0, 3);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
      {/* Top nav */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-800/60 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-gray-600 hover:text-gray-400 transition-colors">
            <Home size={16} />
          </button>
          <ChevronRight size={14} className="text-gray-700" />
          <span className="text-sm font-semibold text-white">Adjacent Possible</span>
          {profile.github && (
            <span className="flex items-center gap-1 text-xs text-gray-500 border border-gray-800 rounded-full px-2 py-0.5">
              <GitBranch size={11} />
              {profile.github.username}
            </span>
          )}
          {doneCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-500">
              <CheckCircle2 size={12} />
              {doneCount} done
            </span>
          )}
          {genCount > 1 && (
            <span className="text-xs text-violet-400 bg-violet-900/30 border border-violet-800/40 rounded-full px-2 py-0.5">
              Generation {genCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5">
            {(["graph", "list"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  view === v
                    ? "bg-gray-700 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {v === "graph" ? "Graph" : "List"}
              </button>
            ))}
          </div>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-800 hover:border-gray-600 rounded-lg transition-all disabled:opacity-40"
          >
            <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
            Regenerate
          </button>
        </div>
      </header>

      {/* Context bar */}
      <div className="px-5 py-2 bg-gray-950/50 border-b border-gray-800/40 flex-shrink-0 flex items-center justify-between">
        <p className="text-xs text-gray-500 truncate flex-1">{profile.context}</p>
        {regenerating && (
          <span className="flex items-center gap-1.5 text-xs text-violet-400 ml-4 flex-shrink-0">
            <RefreshCw size={11} className="animate-spin" />
            Evolving graph…
          </span>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Graph / List area */}
        <div
          className={`flex-1 overflow-hidden relative transition-all duration-300 ${
            selectedNodeId ? "lg:flex-1" : "flex-1"
          }`}
        >
          {view === "graph" ? (
            <div className="w-full h-full">
              <GraphView
                graph={graph}
                selectedNodeId={selectedNodeId}
                onSelectNode={handleSelectNode}
              />
              {/* Legend */}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-1.5">
                {Object.entries(CATEGORY_COLORS).map(([cat, cls]) => (
                  <span
                    key={cat}
                    className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
              {/* Instructions */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-gray-600 bg-gray-950/80 px-3 py-1 rounded-full border border-gray-800">
                Click any node to explore
              </div>
            </div>
          ) : (
            <ListView
              graph={graph}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              topLeverage={topLeverage}
            />
          )}
        </div>

        {/* Side panel */}
        {selectedNode && (
          <div className="w-full lg:w-[420px] flex-shrink-0 border-l border-gray-800 bg-[#0d0d15] overflow-y-auto">
            <NodePanel
              node={selectedNode}
              profile={profile}
              onClose={handleClosePanel}
              onMarkDone={handleMarkDone}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ListView({
  graph,
  selectedNodeId,
  onSelectNode,
  topLeverage,
}: {
  graph: AdjacentGraph;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  topLeverage: GraphNode[];
}) {
  const sorted = [...graph.nodes].sort(
    (a, b) => b.leverageScore - a.leverageScore
  );

  return (
    <div className="overflow-y-auto h-full px-5 py-5">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Quick wins row */}
        {topLeverage.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-violet-400" />
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wide">
                Highest leverage right now
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {topLeverage.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onSelectNode(n.id)}
                  className="p-3 rounded-xl bg-violet-900/20 border border-violet-800/30 hover:border-violet-600/50 text-left transition-all"
                >
                  <div className="text-sm font-medium text-white mb-1 leading-snug">
                    {n.label}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-violet-400">
                    <Zap size={10} />
                    <span>Leverage {n.leverageScore}/10</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All nodes */}
        <div>
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
            All moves ({graph.nodes.length})
          </div>
          <div className="space-y-2">
            {sorted.map((n) => (
              <button
                key={n.id}
                onClick={() => onSelectNode(n.id)}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedNodeId === n.id
                    ? "border-violet-600 bg-violet-900/20"
                    : n.status === "done"
                      ? "border-gray-800 bg-gray-900/20 opacity-40"
                      : "border-gray-800 bg-gray-900/30 hover:border-gray-600"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${CATEGORY_COLORS[n.category] ?? ""}`}>
                        {n.category}
                      </span>
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock size={9} />
                        {n.timeframe}
                      </span>
                      {n.status === "done" && <CheckCircle2 size={12} className="text-emerald-500" />}
                    </div>
                    <div className="text-sm font-medium text-white">{n.label}</div>
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">{n.description}</div>
                    {n.jobSearchTerms?.length > 0 && n.status !== "done" && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <Briefcase size={10} className="text-gray-600" />
                        {n.jobSearchTerms.slice(0, 2).map((term, i) => (
                          <a
                            key={i}
                            href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(term)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                          >
                            {term}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0 text-xs">
                    <span className="text-violet-400">
                      <Zap size={9} className="inline" /> {n.leverageScore}
                    </span>
                    <span className="text-blue-400">
                      Eff {n.effortScore}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
