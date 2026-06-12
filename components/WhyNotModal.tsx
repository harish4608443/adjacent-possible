"use client";
import { useState, useRef, useEffect } from "react";
import { IntakeMessage } from "@/lib/types";
import { ArrowUp, X, Brain, Loader2 } from "lucide-react";

interface WhyNotModalProps {
  nodeLabel: string;
  onClose: () => void;
}

export default function WhyNotModal({ nodeLabel, onClose }: WhyNotModalProps) {
  const [messages, setMessages] = useState<IntakeMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [blocker, setBlocker] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Start conversation automatically
    sendMessage("", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (userText: string, isFirst = false) => {
    const newMessages: IntakeMessage[] = isFirst
      ? []
      : [...messages, { role: "user", content: userText }];
    if (!isFirst) setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/whynot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, nodeLabel }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
      if (data.blockerFound && data.blocker) {
        setBlocker(data.blocker);
      }
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || blocker) return;
    sendMessage(input.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#0f0f1a] border border-gray-800 rounded-2xl w-full max-w-md flex flex-col" style={{ maxHeight: "80vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-violet-400" />
            <span className="text-sm font-semibold text-white">What&apos;s actually stopping you?</span>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="text-xs text-gray-600 px-4 py-2 border-b border-gray-800/50 flex-shrink-0">
          {nodeLabel}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-violet-600 text-white"
                  : "bg-gray-900 border border-gray-800 text-gray-200"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl">
                <Loader2 size={14} className="animate-spin text-gray-500" />
              </div>
            </div>
          )}

          {blocker && (
            <div className="p-3 rounded-xl bg-violet-900/30 border border-violet-700/40 mt-2">
              <div className="text-xs font-semibold text-violet-400 mb-1">Real blocker identified</div>
              <p className="text-sm text-white">{blocker}</p>
              <p className="text-xs text-gray-500 mt-2">Now you know. This is what to work on.</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!blocker && (
          <div className="p-3 border-t border-gray-800 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Be honest…"
                disabled={loading}
                className="flex-1 bg-gray-900 border border-gray-700 focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-9 h-9 flex items-center justify-center bg-violet-600 hover:bg-violet-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-xl transition-colors"
              >
                <ArrowUp size={14} />
              </button>
            </form>
          </div>
        )}
        {blocker && (
          <div className="p-3 border-t border-gray-800 flex-shrink-0">
            <button onClick={onClose} className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors">
              Got it — close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
