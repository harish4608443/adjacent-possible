"use client";
import { useEffect, useRef } from "react";
import cytoscape, { Core } from "cytoscape";
import { AdjacentGraph, GraphNode } from "@/lib/types";

interface GraphViewProps {
  graph: AdjacentGraph;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  career: "#60a5fa",
  skill: "#a78bfa",
  project: "#fbbf24",
  relationship: "#f472b6",
  learning: "#34d399",
  financial: "#4ade80",
  lifestyle: "#fb923c",
  creative: "#22d3ee",
};

function nodeColor(node: GraphNode): string {
  if (node.status === "done") return "#4b5563";
  return CATEGORY_COLORS[node.category] ?? "#8b5cf6";
}

function leverageSize(score: number): number {
  return 40 + score * 8;
}

export default function GraphView({
  graph,
  selectedNodeId,
  onSelectNode,
}: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Build elements
    const elements: cytoscape.ElementDefinition[] = [
      // Center node — YOU
      {
        data: { id: "you", label: "YOU\n(now)" },
        classes: "center",
      },
      // Adjacent nodes
      ...graph.nodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          category: n.category,
          status: n.status,
          leverage: n.leverageScore,
          effort: n.effortScore,
        },
        classes: `node ${n.status} ${n.category}`,
      })),
      // Edges from YOU to first-hop nodes
      ...graph.nodes
        .filter((n) => n.prerequisites.length === 0)
        .map((n) => ({
          data: { id: `you-${n.id}`, source: "you", target: n.id },
          classes: "edge-primary",
        })),
      // Edges between adjacent nodes
      ...graph.edges.map((e) => ({
        data: { id: e.id, source: e.source, target: e.target },
        classes: "edge-secondary",
      })),
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: ".center",
          style: {
            "background-color": "#7c3aed",
            "border-color": "#a78bfa",
            "border-width": 3,
            width: 70,
            height: 70,
            label: "data(label)",
            color: "#fff",
            "font-size": 11,
            "text-halign": "center",
            "text-valign": "center",
            "text-wrap": "wrap",
            "font-weight": "bold",
          },
        },
        {
          selector: "node.node",
          style: {
            "background-color": (ele: cytoscape.NodeSingular) =>
              nodeColor(ele.data() as GraphNode),
            width: (ele: cytoscape.NodeSingular) => leverageSize(ele.data("leverage")),
            height: (ele: cytoscape.NodeSingular) => leverageSize(ele.data("leverage")),
            label: "data(label)",
            color: "#e5e7eb",
            "font-size": 10,
            "text-halign": "center",
            "text-valign": "bottom",
            "text-margin-y": 6,
            "text-wrap": "wrap",
            "text-max-width": "120px",
            "border-width": 2,
            "border-color": "#374151",
          },
        },
        {
          selector: "node.done",
          style: {
            opacity: 0.35,
            "border-color": "#4ade80",
            "border-width": 3,
          },
        },
        {
          selector: "node:selected",
          style: {
            "border-color": "#a78bfa",
            "border-width": 4,
            "background-color": "#7c3aed",
          },
        },
        {
          selector: ".edge-primary",
          style: {
            "line-color": "#374151",
            "target-arrow-color": "#374151",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            width: 1.5,
            opacity: 0.6,
          },
        },
        {
          selector: ".edge-secondary",
          style: {
            "line-color": "#1f2937",
            "target-arrow-color": "#1f2937",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            width: 1,
            "line-style": "dashed",
            opacity: 0.4,
          },
        },
      ],
      layout: {
        name: "cose",
        animate: true,
        animationDuration: 800,
        randomize: false,
        nodeRepulsion: () => 8000,
        idealEdgeLength: () => 120,
        edgeElasticity: () => 0.1,
        gravity: 0.25,
        fit: true,
        padding: 60,
      } as cytoscape.LayoutOptions,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cy.on("tap", "node.node", (evt) => {
      onSelectNode(evt.target.id());
    });

    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        // tapped background
      }
    });

    cyRef.current = cy;

    return () => {
      cy.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  // Highlight selected node
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().unselect();
    if (selectedNodeId) {
      cy.getElementById(selectedNodeId).select();
    }
  }, [selectedNodeId]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: "transparent" }}
    />
  );
}
