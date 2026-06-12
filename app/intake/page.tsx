"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { IntakeMessage, UserProfile } from "@/lib/types";
import { saveState } from "@/lib/store";
import { ArrowUp, Loader2, GitBranch, MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";

type Mode = "choose" | "github" | "chat";

export default function IntakePage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");

  // --- GitHub flow ---
  const [githubUsername, setGithubUsername] = useState("");
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [githubStep, setGithubStep] = useState<"input" | "analyzing" | "generating">("input");

  // --- Chat flow ---
  const [messages, setMessages] = useState<IntakeMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [generatingGraph, setGeneratingGraph] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const generateGraph = useCallback(
    async (profile: UserProfile) => {
      setGeneratingGraph(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, completedMoves: [], generationCount: 0 }),
        });
        const data = await res.json();
        if (data.graph) {
          saveState({ profile, graph: data.graph, intakeComplete: true, selectedNodeId: null });
          router.push("/explore");
        }
      } catch {
        setGeneratingGraph(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (mode === "chat" && messages.length === 0) {
      sendChatMessage("", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleGithubImport = async () => {
    const username = githubUsername.trim();
    if (!username) return;
    setGithubError("");
    setGithubLoading(true);
    setGithubStep("analyzing");

    try {
      const ghRes = await fetch(`/api/github?username=${encodeURIComponent(username)}`);
      if (!ghRes.ok) {
        const err = await ghRes.json();
        throw new Error(err.error ?? "GitHub user not found");
      }
      const { github } = await ghRes.json();
      setGithubStep("generating");

      const synthRes = await fetch("/api/github-synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ github }),
      });
      if (!synthRes.ok) throw new Error("Profile synthesis failed");
      const { profile } = await synthRes.json();

      await generateGraph(profile);
    } catch (err) {
      setGithubError(err instanceof Error ? err.message : "Something went wrong");
      setGithubStep("input");
      setGithubLoading(false);
    }
  };

  const sendChatMessage = async (userText: string, isFirst = false) => {
    const newMessages: IntakeMessage[] = isFirst
      ? []
      : [...messages, { role: "user", content: userText }];
    if (!isFirst) setMessages(newMessages);
    setInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      const withReply: IntakeMessage[] = [...newMessages, { role: "assistant", content: data.reply }];
      setMessages(withReply);
      if (data.isComplete && data.profile) await generateGraph(data.profile);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading || generatingGraph) return;
    sendChatMessage(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e as unknown as React.FormEvent); }
  };

  const userMsgCount = messages.filter((m) => m.role === "user").length;
  const progress = Math.min((userMsgCount / 7) * 100, 90);

  // --- Mode chooser ---
  if (mode === "choose") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] px-6">
        <div className="max-w-lg w-full">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold text-white mb-2">How do you want to start?</h1>
            <p className="text-gray-500 text-sm">We map your adjacent possible from real information — not generic advice.</p>
          </div>
          <div className="space-y-4">
            <button onClick={() => setMode("github")} className="w-full p-5 rounded-2xl border border-gray-700 hover:border-violet-500 bg-gray-900/50 hover:bg-violet-900/20 text-left transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-800 group-hover:bg-violet-800 flex items-center justify-center flex-shrink-0 transition-colors">
                  <GitBranch size={20} className="text-gray-300" />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1">Import from GitHub</div>
                  <div className="text-sm text-gray-500 leading-relaxed">
                    We read your repos, languages, and projects to build your map from <em className="text-gray-400">actual evidence</em>, not self-report.
                  </div>
                  <div className="mt-2 text-xs text-violet-400 font-medium">Recommended — 30 seconds</div>
                </div>
              </div>
            </button>
            <button onClick={() => setMode("chat")} className="w-full p-5 rounded-2xl border border-gray-700 hover:border-gray-500 bg-gray-900/50 text-left transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={20} className="text-gray-300" />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1">Answer 7 questions</div>
                  <div className="text-sm text-gray-500 leading-relaxed">A short Socratic conversation about your skills, constraints, and goals. Better for non-technical paths.</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- GitHub flow ---
  if (mode === "github") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0f] px-6">
        <div className="max-w-md w-full">
          <button onClick={() => { setMode("choose"); setGithubError(""); setGithubStep("input"); setGithubLoading(false); }} className="text-sm text-gray-600 hover:text-gray-400 mb-8 transition-colors">← Back</button>
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <GitBranch size={28} className="text-gray-200" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Your GitHub username</h2>
            <p className="text-sm text-gray-500">Only public data is read. No authentication required.</p>
          </div>

          {githubStep === "input" && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 flex items-center bg-gray-900 border border-gray-700 focus-within:border-violet-500 rounded-xl px-4 transition-colors">
                  <span className="text-gray-600 text-sm mr-1">github.com/</span>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGithubImport()}
                    placeholder="your-username"
                    className="flex-1 bg-transparent py-3 text-white text-sm outline-none placeholder-gray-600"
                    autoFocus
                    disabled={githubLoading}
                  />
                </div>
                <button onClick={handleGithubImport} disabled={!githubUsername.trim() || githubLoading} className="px-5 py-3 bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl font-medium text-sm transition-colors">
                  Import
                </button>
              </div>
              {githubError && (
                <div className="flex items-center gap-2 text-rose-400 text-sm">
                  <AlertCircle size={14} />
                  {githubError}
                </div>
              )}
            </div>
          )}

          {(githubStep === "analyzing" || githubStep === "generating") && (
            <div className="space-y-4">
              <Step done={githubStep === "generating" || generatingGraph} active={githubStep === "analyzing"} label={`Reading @${githubUsername}'s GitHub profile…`} />
              <Step done={generatingGraph} active={githubStep === "generating" && !generatingGraph} label="Synthesizing your skills and context…" />
              <Step done={false} active={generatingGraph} label="Building your adjacent possible graph…" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Chat flow ---
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800/60">
        <div className="flex items-center gap-3">
          <button onClick={() => setMode("choose")} className="text-gray-600 hover:text-gray-400 text-sm transition-colors">← Back</button>
          <span className="text-gray-700">|</span>
          <span className="text-sm text-gray-500">Intake conversation</span>
        </div>
        {userMsgCount > 0 && !generatingGraph && (
          <div className="flex items-center gap-3">
            <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs text-gray-600">{userMsgCount}/7</span>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold mr-3 mt-1 flex-shrink-0">AP</div>
              )}
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-violet-600 text-white rounded-br-sm" : "bg-gray-900 border border-gray-800 text-gray-200 rounded-bl-sm"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {(chatLoading || generatingGraph) && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0">AP</div>
              <div className="px-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl rounded-bl-sm">
                {generatingGraph
                  ? <span className="text-sm text-gray-400 flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Building your graph…</span>
                  : <span className="flex gap-1">{[0, 150, 300].map((d) => <span key={d} className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</span>
                }
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {!generatingGraph && (
        <div className="border-t border-gray-800/60 px-4 py-4">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex items-end gap-3">
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Your answer…" rows={1} disabled={chatLoading} className="flex-1 resize-none bg-gray-900 border border-gray-700 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors max-h-40 overflow-y-auto" />
            <button type="submit" disabled={!input.trim() || chatLoading} className="w-10 h-10 flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl transition-colors flex-shrink-0">
              <ArrowUp size={16} />
            </button>
          </form>
          <p className="text-center text-xs text-gray-700 mt-2">Enter to send · Shift+Enter for new line</p>
        </div>
      )}
    </div>
  );
}

function Step({ done, active, label }: { done: boolean; active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
        {done ? <CheckCircle2 size={20} className="text-emerald-400" /> : active ? <Loader2 size={18} className="text-violet-400 animate-spin" /> : <div className="w-5 h-5 rounded-full border-2 border-gray-700" />}
      </div>
      <span className={`text-sm ${done ? "text-gray-500 line-through" : active ? "text-white" : "text-gray-600"}`}>{label}</span>
    </div>
  );
}
