"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadState, saveState } from "@/lib/store";
import { JournalEntry } from "@/lib/types";
import { Home, Loader2, BookOpen, ChevronDown, ChevronUp, Plus, ArrowRight, Bell } from "lucide-react";

type JournalStep = "list" | "new" | "analyzing" | "analysis";

export default function JournalPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [step, setStep] = useState<JournalStep>("list");
  const [form, setForm] = useState({ decision: "", context: "", options: "", resurfaceAt: "" });
  const [analysis, setAnalysis] = useState<{
    hiddenAssumptions: string[];
    realQuestion: string;
    whatTheyMightBeAvoiding: string;
    clarifyingQuestions: string[];
    ifYouDoNothing: string;
    framingReframe: string;
  } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const state = loadState();
    setEntries((state.journal ?? []).slice().reverse());
  }, []);

  const dueToday = entries.filter((e) => e.resurfaceAt && new Date(e.resurfaceAt) <= new Date() && !e.outcome);

  const handleAnalyze = async () => {
    if (!form.decision.trim()) return;
    setStep("analyzing");

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: form.decision,
          context: form.context,
          options: form.options,
        }),
      });
      const data = await res.json();
      setAnalysis(data.analysis);
      setStep("analysis");
    } catch {
      setStep("new");
    }
  };

  const handleSaveEntry = () => {
    const state = loadState();
    const newEntry: JournalEntry = {
      id: `j_${Date.now()}`,
      decision: form.decision,
      context: form.context,
      options: form.options,
      createdAt: new Date().toISOString(),
      resurfaceAt: form.resurfaceAt || undefined,
      analysis: analysis ?? undefined,
    };
    const updated = [...(state.journal ?? []), newEntry];
    saveState({ journal: updated });
    setEntries(updated.slice().reverse());
    setForm({ decision: "", context: "", options: "", resurfaceAt: "" });
    setAnalysis(null);
    setStep("list");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="flex items-center gap-3 px-5 py-4 border-b border-gray-800/60">
        <button onClick={() => router.push("/")} className="text-gray-600 hover:text-gray-400 transition-colors">
          <Home size={16} />
        </button>
        <span className="text-gray-700 text-sm">›</span>
        <span className="text-sm font-semibold text-white">Decision Journal</span>
        {dueToday.length > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs text-amber-400 bg-amber-900/30 border border-amber-800/40 px-2 py-0.5 rounded-full">
            <Bell size={11} /> {dueToday.length} resurface{dueToday.length !== 1 ? "s" : ""}
          </span>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8">
        {step === "list" && (
          <>
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">Decision Journal</h1>
                <p className="text-gray-500 text-sm">Capture decisions before they become regrets. Revisit with fresh eyes later.</p>
              </div>
              <button
                onClick={() => setStep("new")}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors shrink-0 ml-4"
              >
                <Plus size={15} /> New entry
              </button>
            </div>

            {dueToday.length > 0 && (
              <div className="mb-6 p-4 rounded-xl border border-amber-800/40 bg-amber-900/20">
                <div className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5"><Bell size={12} /> Resurface today</div>
                <div className="space-y-2">
                  {dueToday.map((e) => (
                    <div key={e.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{e.decision}</span>
                      <button
                        onClick={() => setExpandedId(e.id)}
                        className="text-xs text-amber-400 hover:underline"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entries.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen size={40} className="text-gray-700 mx-auto mb-4" />
                <p className="text-gray-500 text-sm">No journal entries yet.</p>
                <p className="text-gray-600 text-xs mt-1">Record a decision you&apos;re wrestling with — big or small.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((e) => {
                  const isOpen = expandedId === e.id;
                  const isResurfaceDue = e.resurfaceAt && new Date(e.resurfaceAt) <= new Date() && !e.outcome;
                  return (
                    <div key={e.id} className={`rounded-xl border transition-colors ${isResurfaceDue ? "border-amber-800/40 bg-amber-900/10" : "border-gray-800 bg-gray-900/30"}`}>
                      <button
                        onClick={() => setExpandedId(isOpen ? null : e.id)}
                        className="w-full flex items-start justify-between p-5 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm mb-0.5 truncate">{e.decision}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            {e.resurfaceAt && <span className="ml-3 text-amber-500">resurfaces {new Date(e.resurfaceAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                          </div>
                        </div>
                        {isOpen ? <ChevronUp size={16} className="text-gray-600 ml-3 shrink-0 mt-0.5" /> : <ChevronDown size={16} className="text-gray-600 ml-3 shrink-0 mt-0.5" />}
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-5 space-y-4 border-t border-gray-800">
                          {e.context && (
                            <div className="pt-4">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Context</div>
                              <p className="text-sm text-gray-400">{e.context}</p>
                            </div>
                          )}
                          {e.options && (
                            <div>
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Options considered</div>
                              <p className="text-sm text-gray-400 whitespace-pre-line">{e.options}</p>
                            </div>
                          )}
                          {e.analysis && (
                            <div className="space-y-3">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Analysis</div>
                              <div className="p-3 rounded-xl bg-violet-900/20 border border-violet-800/30">
                                <div className="text-xs font-semibold text-violet-400 mb-1">The real question</div>
                                <p className="text-sm text-gray-300">{e.analysis.realQuestion}</p>
                              </div>
                              {e.analysis.hiddenAssumptions?.length > 0 && (
                                <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                                  <div className="text-xs font-semibold text-gray-400 mb-2">Hidden assumptions</div>
                                  <ul className="space-y-1">
                                    {e.analysis.hiddenAssumptions.map((a, i) => (
                                      <li key={i} className="text-sm text-gray-400 flex gap-2">
                                        <span className="text-gray-700">•</span> {a}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {e.analysis.framingReframe && (
                                <div className="p-3 rounded-xl bg-amber-900/20 border border-amber-800/30">
                                  <div className="text-xs font-semibold text-amber-400 mb-1">Reframing</div>
                                  <p className="text-sm text-gray-300">{e.analysis.framingReframe}</p>
                                </div>
                              )}
                            </div>
                          )}
                          {isResurfaceDue && (
                            <div className="pt-2">
                              <div className="text-xs font-semibold text-amber-400 mb-2">What actually happened?</div>
                              <OutcomeUpdater entry={e} onSave={(outcome) => {
                                const state = loadState();
                                const updated = (state.journal ?? []).map(j => j.id === e.id ? { ...j, outcome } : j);
                                saveState({ journal: updated });
                                setEntries(updated.slice().reverse());
                                setExpandedId(null);
                              }} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {step === "new" && (
          <>
            <div className="flex items-center gap-3 mb-8">
              <button onClick={() => setStep("list")} className="text-gray-600 hover:text-gray-400 transition-colors text-sm">← Back</button>
              <h1 className="text-xl font-bold text-white">New journal entry</h1>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">The decision</label>
                <input
                  value={form.decision}
                  onChange={(e) => setForm((f) => ({ ...f, decision: e.target.value }))}
                  placeholder="What are you deciding?"
                  className="w-full bg-gray-900 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Context</label>
                <textarea
                  value={form.context}
                  onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
                  placeholder="What's the situation? Why does this matter now?"
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Options you&apos;re considering</label>
                <textarea
                  value={form.options}
                  onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
                  placeholder="Option A: ...&#10;Option B: ...&#10;Option C: ..."
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Resurface date <span className="text-gray-600 normal-case font-normal">(optional — when to revisit this)</span></label>
                <input
                  type="date"
                  value={form.resurfaceAt}
                  onChange={(e) => setForm((f) => ({ ...f, resurfaceAt: e.target.value }))}
                  className="bg-gray-900 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white outline-none transition-colors [color-scheme:dark]"
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={!form.decision.trim()}
                className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              >
                Get deeper analysis <ArrowRight size={18} />
              </button>
            </div>
          </>
        )}

        {step === "analyzing" && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Loader2 size={32} className="animate-spin text-violet-400 mb-4" />
            <p className="text-white font-medium mb-1">Thinking through your decision…</p>
            <p className="text-gray-500 text-sm">Looking for hidden assumptions and what&apos;s really at stake</p>
          </div>
        )}

        {step === "analysis" && analysis && (
          <div className="space-y-6">
            <div>
              <button onClick={() => setStep("new")} className="text-gray-600 hover:text-gray-400 transition-colors text-sm mb-4 block">← Edit</button>
              <h1 className="text-2xl font-bold text-white mb-1">What&apos;s really going on</h1>
              <p className="text-sm text-gray-500">{form.decision}</p>
            </div>

            <div className="p-5 rounded-2xl border border-violet-800/30 bg-violet-900/20">
              <div className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-2">The real question</div>
              <p className="text-base text-white leading-relaxed">{analysis.realQuestion}</p>
            </div>

            {analysis.hiddenAssumptions?.length > 0 && (
              <div className="p-5 rounded-2xl border border-gray-800 bg-gray-900/30">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Hidden assumptions you&apos;re making</div>
                <ul className="space-y-2">
                  {analysis.hiddenAssumptions.map((a, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-300">
                      <span className="text-gray-600 shrink-0">→</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.whatTheyMightBeAvoiding && (
              <div className="p-4 rounded-xl border border-rose-800/30 bg-rose-900/20">
                <div className="text-xs font-semibold text-rose-400 mb-1">What you might be avoiding</div>
                <p className="text-sm text-gray-300">{analysis.whatTheyMightBeAvoiding}</p>
              </div>
            )}

            {analysis.framingReframe && (
              <div className="p-4 rounded-xl border border-amber-800/30 bg-amber-900/20">
                <div className="text-xs font-semibold text-amber-400 mb-1">A different frame</div>
                <p className="text-sm text-gray-300">{analysis.framingReframe}</p>
              </div>
            )}

            {analysis.ifYouDoNothing && (
              <div className="p-4 rounded-xl border border-gray-700 bg-gray-900">
                <div className="text-xs font-semibold text-gray-400 mb-1">If you do nothing</div>
                <p className="text-sm text-gray-400">{analysis.ifYouDoNothing}</p>
              </div>
            )}

            {analysis.clarifyingQuestions?.length > 0 && (
              <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/30">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Questions worth sitting with</div>
                <ul className="space-y-2">
                  {analysis.clarifyingQuestions.map((q, i) => (
                    <li key={i} className="text-sm text-gray-300 flex gap-2">
                      <span className="text-gray-600">{i + 1}.</span> {q}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={handleSaveEntry}
              className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
            >
              Save to journal <BookOpen size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OutcomeUpdater({ entry, onSave }: { entry: JournalEntry; onSave: (outcome: string) => void }) {
  const [text, setText] = useState("");
  return (
    <div className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What happened? How did it turn out?"
        rows={2}
        className="w-full bg-gray-950 border border-gray-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors resize-none"
      />
      <button
        onClick={() => text.trim() && onSave(text.trim())}
        disabled={!text.trim()}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg text-xs font-medium transition-colors"
      >
        Save outcome
      </button>
    </div>
  );
}
