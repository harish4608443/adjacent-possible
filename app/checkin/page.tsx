"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadState, saveState } from "@/lib/store";
import { Commitment, CheckIn } from "@/lib/types";
import { CheckCircle2, Minus, XCircle, ArrowRight, Loader2, Home, TrendingUp } from "lucide-react";

type Outcome = "done" | "partial" | "not_done";

interface OutcomeEntry {
  commitmentId: string;
  outcome: Outcome | null;
  reflection: string;
}

export default function CheckInPage() {
  const router = useRouter();
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeEntry[]>([]);
  const [step, setStep] = useState<"review" | "analyzing" | "done">("review");
  const [analysis, setAnalysis] = useState<{
    followThroughRate: number;
    patterns: string[];
    repeatBlocker?: string;
    insight: string;
    suggestion: string;
    encouragement: string;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const state = loadState();
    const pending = (state.commitments ?? []).filter((c) => !c.outcome);
    setCommitments(pending);
    setOutcomes(pending.map((c) => ({ commitmentId: c.id, outcome: null, reflection: "" })));
  }, []);

  const setOutcome = (id: string, outcome: Outcome) => {
    setOutcomes((prev) => prev.map((o) => o.commitmentId === id ? { ...o, outcome } : o));
  };

  const setReflection = (id: string, reflection: string) => {
    setOutcomes((prev) => prev.map((o) => o.commitmentId === id ? { ...o, reflection } : o));
  };

  const allAnswered = outcomes.every((o) => o.outcome !== null);

  const handleSubmit = async () => {
    setStep("analyzing");
    const state = loadState();

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitments,
          outcomes: outcomes.filter(o => o.outcome !== null),
          allCheckIns: state.checkIns ?? [],
        }),
      });
      const data = await res.json();

      // Save check-in and update commitments
      const newCheckIn: CheckIn = {
        id: `ci_${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
        outcomes: outcomes.filter(o => o.outcome !== null) as CheckIn["outcomes"],
        patternInsight: data.analysis?.insight,
      };

      const updatedCommitments = (state.commitments ?? []).map((c) => {
        const o = outcomes.find((x) => x.commitmentId === c.id);
        if (!o?.outcome) return c;
        return { ...c, outcome: o.outcome, reflection: o.reflection, revisitedAt: new Date().toISOString() };
      });

      saveState({
        commitments: updatedCommitments,
        checkIns: [...(state.checkIns ?? []), newCheckIn],
      });

      setAnalysis(data.analysis);
      setStep("done");
    } catch {
      setStep("review");
    }
  };

  if (!mounted) return null;

  if (commitments.length === 0 && step === "review") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">🌱</div>
          <h2 className="text-xl font-bold text-white mb-2">Nothing to check in on yet</h2>
          <p className="text-gray-500 text-sm mb-8">
            When you commit to moves in your graph, they show up here for weekly accountability.
          </p>
          <button onClick={() => router.push("/explore")} className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors">
            Go to my graph
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-gray-800/60">
        <button onClick={() => router.push("/")} className="text-gray-600 hover:text-gray-400 transition-colors">
          <Home size={16} />
        </button>
        <span className="text-gray-700 text-sm">›</span>
        <span className="text-sm font-semibold text-white">Weekly Check-in</span>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8">
        {step === "review" && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">What happened?</h1>
              <p className="text-gray-500 text-sm">
                You made {commitments.length} commitment{commitments.length !== 1 ? "s" : ""}. Be honest — this is for you, not anyone else.
              </p>
            </div>

            <div className="space-y-6">
              {commitments.map((c, i) => {
                const o = outcomes[i];
                return (
                  <div key={c.id} className="p-5 rounded-2xl border border-gray-800 bg-gray-900/30">
                    <div className="flex items-start justify-between mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border text-${c.category === "career" ? "blue" : c.category === "skill" ? "violet" : "gray"}-400 bg-${c.category === "career" ? "blue" : c.category === "skill" ? "violet" : "gray"}-900/20 border-${c.category === "career" ? "blue" : c.category === "skill" ? "violet" : "gray"}-800/30`}>
                        {c.category}
                      </span>
                      <span className="text-xs text-gray-600">
                        {Math.floor((Date.now() - new Date(c.committedAt).getTime()) / (1000 * 60 * 60 * 24))}d ago
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-1 mt-2">{c.nodeLabel}</h3>
                    <p className="text-xs text-gray-500 mb-4">{c.nodeDescription}</p>

                    <div className="flex gap-2 mb-4">
                      {(["done", "partial", "not_done"] as Outcome[]).map((outcome) => (
                        <button
                          key={outcome}
                          onClick={() => setOutcome(c.id, outcome)}
                          className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                            o?.outcome === outcome
                              ? outcome === "done" ? "bg-emerald-600 border-emerald-500 text-white"
                                : outcome === "partial" ? "bg-amber-600 border-amber-500 text-white"
                                : "bg-rose-700 border-rose-600 text-white"
                              : "border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-300"
                          }`}
                        >
                          {outcome === "done" ? <><CheckCircle2 size={12} /> Done</>
                            : outcome === "partial" ? <><Minus size={12} /> Partial</>
                            : <><XCircle size={12} /> Didn&apos;t happen</>}
                        </button>
                      ))}
                    </div>

                    {o?.outcome && (
                      <textarea
                        value={o.reflection}
                        onChange={(e) => setReflection(c.id, e.target.value)}
                        placeholder={
                          o.outcome === "done" ? "What made it happen?"
                            : o.outcome === "partial" ? "What got in the way?"
                            : "What actually happened instead?"
                        }
                        rows={2}
                        className="w-full bg-gray-950 border border-gray-700 focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors resize-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="w-full mt-8 py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl font-semibold text-base transition-colors flex items-center justify-center gap-2"
            >
              See my pattern analysis
              <ArrowRight size={18} />
            </button>
          </>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Loader2 size={32} className="animate-spin text-violet-400 mb-4" />
            <p className="text-white font-medium mb-1">Analyzing your patterns…</p>
            <p className="text-gray-500 text-sm">Looking for what your behavior actually reveals</p>
          </div>
        )}

        {step === "done" && analysis && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Your pattern analysis</h1>
              <p className="text-gray-500 text-sm">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
            </div>

            {/* Follow through rate */}
            <div className="p-5 rounded-2xl border border-gray-800 bg-gray-900/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white flex items-center gap-2"><TrendingUp size={16} className="text-violet-400" /> Follow-through rate</span>
                <span className={`text-2xl font-bold ${analysis.followThroughRate >= 70 ? "text-emerald-400" : analysis.followThroughRate >= 40 ? "text-amber-400" : "text-rose-400"}`}>
                  {analysis.followThroughRate}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${analysis.followThroughRate >= 70 ? "bg-emerald-500" : analysis.followThroughRate >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${analysis.followThroughRate}%` }}
                />
              </div>
            </div>

            {/* Insight */}
            <div className="p-5 rounded-2xl border border-violet-800/30 bg-violet-900/20">
              <div className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-2">What your behavior reveals</div>
              <p className="text-sm text-gray-200 leading-relaxed">{analysis.insight}</p>
            </div>

            {/* Patterns */}
            {analysis.patterns?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Patterns observed</div>
                <div className="space-y-2">
                  {analysis.patterns.map((p, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-900/50 border border-gray-800">
                      <span className="text-gray-600 font-mono text-xs mt-0.5">{i + 1}.</span>
                      <span className="text-sm text-gray-400">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.repeatBlocker && (
              <div className="p-4 rounded-xl bg-rose-900/20 border border-rose-800/30">
                <div className="text-xs font-semibold text-rose-400 mb-1">Most common blocker</div>
                <p className="text-sm text-gray-300">{analysis.repeatBlocker}</p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-800/30">
              <div className="text-xs font-semibold text-amber-400 mb-1">Try this differently this week</div>
              <p className="text-sm text-gray-300">{analysis.suggestion}</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-800/30">
              <div className="text-xs font-semibold text-emerald-400 mb-1">What&apos;s working</div>
              <p className="text-sm text-gray-300">{analysis.encouragement}</p>
            </div>

            <button onClick={() => router.push("/explore")} className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
              Back to my graph
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
