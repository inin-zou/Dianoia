import { useMemo } from 'react';
import type { Evidence, Hypothesis, Witness } from '@/types';

interface EvidenceGraphProps {
  evidence: Evidence[];
  witnesses: Witness[];
  hypotheses: Hypothesis[];
}

const TYPE_COLORS: Record<string, string> = {
  physical: '#EF4444',
  forensic: '#8B5CF6',
  document: '#3B82F6',
  image: '#F59E0B',
};

const ROLE_COLORS: Record<string, string> = {
  witness: '#3B82F6',
  officer: '#22C55E',
  suspect: '#EF4444',
  victim_relative: '#F59E0B',
};

interface GraphNode {
  id: string;
  label: string;
  type: 'evidence' | 'witness' | 'hypothesis';
  color: string;
  x: number;
  y: number;
  radius: number;
}

interface GraphEdge {
  from: string;
  to: string;
  type: 'supporting' | 'contradicting';
}

export function EvidenceGraph({ evidence, witnesses, hypotheses }: EvidenceGraphProps) {
  const { nodes, edges } = useMemo(() => {
    const allNodes: GraphNode[] = [];
    const allEdges: GraphEdge[] = [];

    if (evidence.length === 0 && witnesses.length === 0 && hypotheses.length === 0) {
      return { nodes: allNodes, edges: allEdges };
    }

    const SVG_W = 400;
    const SVG_H = 400;
    const CX = SVG_W / 2;
    const CY = SVG_H / 2;

    // Hypotheses in center column
    hypotheses.forEach((h, i) => {
      const yStep = SVG_H / (hypotheses.length + 1);
      allNodes.push({
        id: h.id,
        label: `H${h.rank}`,
        type: 'hypothesis',
        color: '#FFFFFF',
        x: CX,
        y: yStep * (i + 1),
        radius: 10 + h.probability * 15,
      });
    });

    // Evidence on the left
    evidence.forEach((e, i) => {
      const yStep = SVG_H / (evidence.length + 1);
      allNodes.push({
        id: e.id,
        label: e.title.length > 12 ? e.title.slice(0, 12) + '..' : e.title,
        type: 'evidence',
        color: TYPE_COLORS[e.type] || '#94A3B8',
        x: 70 + (i % 2) * 30,
        y: yStep * (i + 1),
        radius: 6,
      });
    });

    // Witnesses on the right
    witnesses.forEach((w, i) => {
      const yStep = SVG_H / (witnesses.length + 1);
      allNodes.push({
        id: w.id,
        label: w.name.split(' ')[0],
        type: 'witness',
        color: ROLE_COLORS[w.role] || '#94A3B8',
        x: SVG_W - 70 - (i % 2) * 30,
        y: yStep * (i + 1),
        radius: 6,
      });
    });

    // Edges from hypotheses to supporting/contradicting evidence
    for (const h of hypotheses) {
      for (const eId of (h.supportingEvidence || [])) {
        allEdges.push({ from: h.id, to: eId, type: 'supporting' });
      }
      for (const eId of (h.contradictingEvidence || [])) {
        allEdges.push({ from: h.id, to: eId, type: 'contradicting' });
      }
    }

    return { nodes: allNodes, edges: allEdges };
  }, [evidence, witnesses, hypotheses]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const n of nodes) map.set(n.id, n);
    return map;
  }, [nodes]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-[10px] font-mono font-bold text-muted-foreground/30 uppercase tracking-widest">
          Awaiting Data
        </span>
      </div>
    );
  }

  return (
    <svg viewBox="0 0 400 400" className="w-full h-full" style={{ background: 'transparent' }}>
      {/* Grid */}
      <defs>
        <pattern id="graph-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.3" opacity="0.05" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#graph-grid)" />

      {/* Column labels */}
      <text x="70" y="18" fill="#94A3B8" fontSize="7" fontFamily="JetBrains Mono, monospace" textAnchor="middle" opacity="0.5">EVIDENCE</text>
      <text x="200" y="18" fill="#94A3B8" fontSize="7" fontFamily="JetBrains Mono, monospace" textAnchor="middle" opacity="0.5">HYPOTHESES</text>
      <text x="330" y="18" fill="#94A3B8" fontSize="7" fontFamily="JetBrains Mono, monospace" textAnchor="middle" opacity="0.5">WITNESSES</text>

      {/* Edges */}
      {edges.map((edge, i) => {
        const from = nodeMap.get(edge.from);
        const to = nodeMap.get(edge.to);
        if (!from || !to) return null;
        const color = edge.type === 'supporting' ? '#22C55E' : '#EF4444';
        return (
          <line
            key={`edge-${i}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={color}
            strokeWidth="0.8"
            opacity="0.35"
            strokeDasharray={edge.type === 'contradicting' ? '3,2' : undefined}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => (
        <g key={node.id}>
          {/* Glow */}
          <circle cx={node.x} cy={node.y} r={node.radius + 3} fill={node.color} opacity="0.08" />
          {/* Node */}
          <circle
            cx={node.x}
            cy={node.y}
            r={node.radius}
            fill={node.type === 'hypothesis' ? 'transparent' : node.color}
            stroke={node.color}
            strokeWidth={node.type === 'hypothesis' ? 1.5 : 0.8}
            opacity={0.8}
          />
          {/* Label */}
          <text
            x={node.x}
            y={node.y + node.radius + 10}
            fill="#94A3B8"
            fontSize="6.5"
            fontFamily="JetBrains Mono, monospace"
            textAnchor="middle"
            opacity="0.7"
          >
            {node.label}
          </text>
          {/* Hypothesis probability inside */}
          {node.type === 'hypothesis' && (
            <text
              x={node.x}
              y={node.y + 3}
              fill="white"
              fontSize="7"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="bold"
              textAnchor="middle"
              opacity="0.9"
            >
              {node.label}
            </text>
          )}
        </g>
      ))}

      {/* Legend */}
      <g transform="translate(10, 370)">
        <line x1="0" y1="0" x2="12" y2="0" stroke="#22C55E" strokeWidth="1" opacity="0.6" />
        <text x="15" y="3" fill="#94A3B8" fontSize="5.5" fontFamily="JetBrains Mono, monospace" opacity="0.5">SUPPORTS</text>
        <line x1="70" y1="0" x2="82" y2="0" stroke="#EF4444" strokeWidth="1" strokeDasharray="3,2" opacity="0.6" />
        <text x="85" y="3" fill="#94A3B8" fontSize="5.5" fontFamily="JetBrains Mono, monospace" opacity="0.5">CONTRADICTS</text>
      </g>
    </svg>
  );
}
