"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clearState, loadState } from "@/lib/store";
import { ArrowRight, Compass, GitBranch, Zap, CheckCircle2, BookOpen } from "lucide-react";

export default function Home() {
  const [hasExisting, setHasExisting] = useState(false);
  const [pendingCheckins, setPendingCheckins] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const state = loadState();
    setHasExisting(state.intakeComplete && !!state.graph);
    const pending = (state.commitments ?? []).filter((c) => !c.outcome).length;
    setPendingCheckins(pending);
  }, []);

  if (!mounted) return null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-blue-900/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm mb-8">
          <Compass size={14} />
          <span>Based on Stuart Kauffman&apos;s Adjacent Possible</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
          Map your{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
            next moves
          </span>
        </h1>

        <p className="text-lg text-gray-400 mb-4 max-w-2xl mx-auto leading-relaxed">
          I built this to make decisions feel less scary and more useful —
          a small engine from Harish Renganathan that helps the next move land.
          Not a 5-year plan. Not a to-do list. This maps every move that is <em className="text-gray-200">exactly one step away</em> from where
          you are right now — ranked by effort, leverage, and what each move unlocks.
        </p>

        <p className="text-sm text-gray-500 mb-12 max-w-xl mx-auto">
          Answer ~7 questions. Get a personalized graph of your adjacent
          possible. Expand any node to get a full execution plan.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/intake"
            className="group flex items-center gap-2 px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-base transition-all duration-200 shadow-lg shadow-violet-900/40"
          >
            Map my adjacent possible
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
          {hasExisting && (
            <Link
              href="/explore"
              className="flex items-center gap-2 px-8 py-4 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white rounded-xl font-semibold text-base transition-all duration-200"
            >
              View my graph
            </Link>
          )}
        </div>

        {/* Accountability tools if graph exists */}
        {hasExisting && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link
              href="/checkin"
              className="flex items-center gap-2 px-5 py-3 border border-gray-800 hover:border-emerald-700 text-gray-400 hover:text-emerald-300 rounded-xl text-sm font-medium transition-all"
            >
              <CheckCircle2 size={15} />
              Weekly check-in
              {pendingCheckins > 0 && (
                <span className="ml-1 bg-emerald-700 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {pendingCheckins}
                </span>
              )}
            </Link>
            <Link
              href="/journal"
              className="flex items-center gap-2 px-5 py-3 border border-gray-800 hover:border-violet-700 text-gray-400 hover:text-violet-300 rounded-xl text-sm font-medium transition-all"
            >
              <BookOpen size={15} />
              Decision journal
            </Link>
          </div>
        )}

        {hasExisting && (
          <button
            onClick={() => {
              clearState();
              setHasExisting(false);
            }}
            className="mt-4 text-sm text-gray-600 hover:text-gray-400 transition-colors"
          >
            Start over
          </button>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-24 text-left">
          {[
            {
              icon: <GitBranch size={20} className="text-violet-400" />,
              title: "First-order moves only",
              desc: "No fantasy. Every node in the graph is reachable given your actual constraints right now.",
            },
            {
              icon: <Zap size={20} className="text-blue-400" />,
              title: "Leverage-ranked",
              desc: "Each move scored by effort, leverage, and risk. See which moves unlock the most future moves.",
            },
            {
              icon: <Compass size={20} className="text-emerald-400" />,
              title: "Expand any node",
              desc: "Click any move to get a full execution plan, week-one actions, risks, and hidden assumptions.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-xl border border-gray-800 bg-gray-900/40"
            >
              <div className="mb-3">{f.icon}</div>
              <div className="font-semibold text-white mb-1 text-sm">
                {f.title}
              </div>
              <div className="text-sm text-gray-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

