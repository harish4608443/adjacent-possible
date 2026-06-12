"use client";
import { useState, useEffect } from "react";
import { GraphNode, UserProfile, Commitment } from "@/lib/types";
import { Loader2, AlertTriangle, ChevronRight, X, Shield } from "lucide-react";

interface PreMortemScenario {
  title: string;
  description: string;
  probability: "low" | "medium" | "high";
  earlyWarningSign: string;
}

interface PreMortemResult {
  scenarios: PreMortemScenario[];
  biggestRisk: string;
  proceed: string;
}

interface PreMortemModalProps {
  node: GraphNode;
  profile: UserProfile;
  onProceed: (commitment: Omit<Commitment, "id" | "committedAt">) => void;
  onCancel: () => void;
}

const PROB_COLORS = {
  low: "text-emerald-400 bg-emerald-900/20 border-emerald-800/30",
  medium: "text-amber-400 bg-amber-900/20 border-amber-800/30",
  high: "text-rose-400 bg-rose-900/20 border-rose-800/30",
};

export default function PreMortemModal({ node, profile, onProceed, onCancel }: PreMortemModalProps) {
  const [result, setResult] = useState<PreMortemResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/premortem", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node, profile }),
        });
        const data = await res.json();
        setResult(data.premortem);
      } finally {
        setLoading(false);
      }
    })();
  }, [node, profile]);

  const handleProceed = () => {
    onProceed({
      nodeId: node.id,
      nodeLabel: node.label,
      nodeDescription: node.description,
      category: node.category,
      knownRisks: result?.scenarios.map((s) => s.title) ?? [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f0f1a] border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Pre-mortem</span>
            </div>
            <h2 className="text-base font-semibold text-white">Before you commit to this…</h2>
            <p className="text-xs text-gray-500 mt-0.5">{node.label}</p>
          </div>
          <button onClick={onCancel} className="text-gray-600 hover:text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex items-center gap-3 text-gray-500 py-8 justify-center">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Simulating how this fails for you specifically…</span>
            </div>
          ) : result ? (
            <div className="space-y-5">
              <p className="text-xs text-gray-500 italic">
                Imagining it&apos;s 3 months from now and this didn&apos;t happen. Here&apos;s what probably went wrong:
              </p>

              <div className="space-y-3">
                {result.scenarios.map((s, i) => (
                  <div key={i} className="p-3 rounded-xl border border-gray-800 bg-gray-900/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-white">{s.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${PROB_COLORS[s.probability]}`}>
                        {s.probability}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{s.description}</p>
                    <div className="flex items-start gap-1.5">
                      <AlertTriangle size={10} className="text-gray-600 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-gray-600">Early warning: {s.earlyWarningSign}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-rose-900/20 border border-rose-800/30">
                <div className="text-xs font-semibold text-rose-400 mb-1">Biggest risk for you</div>
                <p className="text-sm text-gray-300">{result.biggestRisk}</p>
              </div>

              <div className="p-3 rounded-xl bg-violet-900/20 border border-violet-800/30">
                <div className="text-xs font-semibold text-violet-400 mb-1">Why do it anyway</div>
                <p className="text-sm text-gray-300">{result.proceed}</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white rounded-xl text-sm font-medium transition-all"
                >
                  Not ready yet
                </button>
                <button
                  onClick={handleProceed}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  I understand — commit
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Failed to load. Proceed anyway?</p>
          )}
        </div>
      </div>
    </div>
  );
}
