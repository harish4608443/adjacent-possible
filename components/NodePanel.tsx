"use client";
import { useState } from "react";
import { GraphNode, UserProfile } from "@/lib/types";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Briefcase,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface NodeDetail {
  detailedPlan: string;
  risks: string[];
  assumptions: string[];
  resources_needed: string[];
  successSignals: string[];
  alternativeApproaches: string[];
  weekOneActions: string[];
}

interface NodePanelProps {
  node: GraphNode;
  profile: UserProfile;
  onClose: () => void;
  onMarkDone: (nodeId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  career: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  skill: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  project: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  relationship: "text-pink-400 bg-pink-400/10 border-pink-400/20",
  learning: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  financial: "text-green-400 bg-green-400/10 border-green-400/20",
  lifestyle: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  creative: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
};

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${(value / 10) * 100}%` }}
        />
      </div>
      <span className="text-xs text-gray-600 w-4">{value}</span>
    </div>
  );
}

export default function NodePanel({
  node,
  profile,
  onClose,
  onMarkDone,
}: NodePanelProps) {
  const [detail, setDetail] = useState<NodeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isDone = node.status === "done";

  const loadDetail = async () => {
    if (detail || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node, profile }),
      });
      const data = await res.json();
      if (data.detail) setDetail(data.detail);
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = () => {
    setExpanded(!expanded);
    if (!expanded && !detail) loadDetail();
  };

  const timeframeColor = {
    days: "text-emerald-400",
    weeks: "text-amber-400",
    months: "text-orange-400",
  }[node.timeframe];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-gray-800">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[node.category] ?? "text-gray-400 bg-gray-800 border-gray-700"}`}
            >
              {node.category}
            </span>
            <span className={`text-xs font-medium ${timeframeColor}`}>
              <Clock size={10} className="inline mr-1" />
              {node.timeframe}
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white leading-snug">
            {node.label}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-5 space-y-5 flex-1">
        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed">
          {node.description}
        </p>

        {/* Why now */}
        <div className="p-3 rounded-lg bg-violet-900/20 border border-violet-800/30">
          <div className="text-xs font-medium text-violet-400 mb-1">
            Why reachable now
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{node.whyNow}</p>
        </div>

        {/* Scores */}
        <div className="space-y-2">
          <ScoreBar
            label="Effort"
            value={node.effortScore}
            color="bg-blue-500"
          />
          <ScoreBar
            label="Leverage"
            value={node.leverageScore}
            color="bg-violet-500"
          />
          <ScoreBar label="Risk" value={node.riskScore} color="bg-rose-500" />
        </div>

        {/* Concrete first step */}
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
              First step today
            </span>
          </div>
          <p className="text-sm text-white leading-relaxed">
            {node.concreteFirstStep}
          </p>
        </div>

        {/* Assumptions */}
        {node.assumptions?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={13} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-wide">
                Hidden assumptions
              </span>
            </div>
            <ul className="space-y-1">
              {node.assumptions.map((a, i) => (
                <li key={i} className="text-xs text-gray-500 pl-3 border-l border-gray-800">
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skill gaps */}
        {node.skillsNeeded?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={13} className="text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                Skills you may need to build
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {node.skillsNeeded.map((s, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-900/20 border border-blue-800/30 text-blue-300">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Job market links */}
        {node.jobSearchTerms?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={13} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                Related roles in job market
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {node.jobSearchTerms.map((term, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 flex-1">{term}</span>
                  <div className="flex gap-1.5">
                    <a
                      href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(term)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-900/30 border border-blue-800/40 text-blue-300 hover:bg-blue-800/40 transition-colors"
                    >
                      LinkedIn <ExternalLink size={9} />
                    </a>
                    <a
                      href={`https://www.indeed.com/jobs?q=${encodeURIComponent(term)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      Indeed <ExternalLink size={9} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expand deep dive */}
        <div className="border-t border-gray-800 pt-4">
          <button
            onClick={handleExpand}
            className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors w-full"
          >
            <Zap size={14} />
            <span>{expanded ? "Hide" : "Get full execution plan"}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expanded && (
            <div className="mt-4 space-y-5">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 size={14} className="animate-spin" />
                  Generating plan…
                </div>
              ) : detail ? (
                <>
                  <DetailSection title="Execution plan" color="text-blue-400">
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {detail.detailedPlan}
                    </p>
                  </DetailSection>

                  <DetailSection title="Week 1 actions" color="text-emerald-400">
                    <ol className="space-y-1 list-none">
                      {detail.weekOneActions?.map((a, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-400">
                          <span className="text-emerald-600 font-mono text-xs mt-0.5">
                            {i + 1}.
                          </span>
                          {a}
                        </li>
                      ))}
                    </ol>
                  </DetailSection>

                  <DetailSection title="Risks" color="text-rose-400">
                    <ul className="space-y-1">
                      {detail.risks?.map((r, i) => (
                        <li key={i} className="text-sm text-gray-400 pl-3 border-l border-gray-800">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </DetailSection>

                  <DetailSection title="What success looks like" color="text-amber-400">
                    <ul className="space-y-1">
                      {detail.successSignals?.map((s, i) => (
                        <li key={i} className="text-sm text-gray-400 pl-3 border-l border-gray-800">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </DetailSection>

                  {detail.alternativeApproaches?.length > 0 && (
                    <DetailSection title="Alternative approaches" color="text-gray-400">
                      <ul className="space-y-1">
                        {detail.alternativeApproaches.map((a, i) => (
                          <li key={i} className="text-sm text-gray-500 pl-3 border-l border-gray-800">
                            {a}
                          </li>
                        ))}
                      </ul>
                    </DetailSection>
                  )}
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Footer action */}
      <div className="p-5 border-t border-gray-800">
        {isDone ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm justify-center py-2">
            <CheckCircle2 size={16} />
            <span>Marked as done</span>
          </div>
        ) : (
          <button
            onClick={() => onMarkDone(node.id)}
            className="w-full py-3 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <CheckCircle2 size={16} />
            Done — evolve my graph
          </button>
        )}
      </div>
    </div>
  );
}

function DetailSection({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className={`text-xs font-semibold uppercase tracking-wide mb-2 ${color}`}>
        {title}
      </div>
      {children}
    </div>
  );
}
