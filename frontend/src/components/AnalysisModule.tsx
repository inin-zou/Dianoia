import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCaseContext } from '@/lib/CaseContext';
import { useHypotheses } from '@/hooks/useHypotheses';

export function AnalysisModule() {
  const { caseId } = useCaseContext();
  const { data: hypotheses, loading } = useHypotheses(caseId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sort by rank
  const sorted = [...hypotheses].sort((a, b) => a.rank - b.rank);

  const getProbColor = (p: number) => {
    if (p > 60) return 'bg-primary';
    if (p > 30) return 'bg-warning';
    return 'bg-danger';
  };

  // Probability from DB is 0-1, display as percentage
  const displayProb = (p: number) => (p <= 1 ? Math.round(p * 100) : Math.round(p));

  return (
    <div className="flex flex-1 min-h-0 gap-3 p-3">
      {/* Left: Hypothesis List (60%) */}
      <div className="w-[60%] flex flex-col min-h-0">
        <div className="panel-header rounded-t-lg">
          <span>// RANKED_HYPOTHESES</span>
          <span>[{sorted.length}]</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 pt-2">
          {loading && sorted.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">Loading...</span>
            </div>
          )}
          {!loading && sorted.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">No hypotheses yet. Run analysis to generate.</span>
            </div>
          )}
          {sorted.map((h) => {
            const expanded = expandedId === h.id;
            const prob = displayProb(h.probability);
            return (
              <button
                key={h.id}
                onClick={() => setExpandedId(expanded ? null : h.id)}
                className={`w-full text-left glass-subtle rounded-lg p-4 interactive focus-ring hover:bg-white/10 ${
                  h.rank === 1 ? 'border-l-2 border-l-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono font-extrabold text-muted-foreground/30 w-8 tabular-nums">
                    {String(h.rank).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground/85 leading-snug">{h.title}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getProbColor(prob)} transition-all duration-500`} style={{ width: `${prob}%` }} />
                      </div>
                      <span className="text-[12px] font-mono font-bold text-foreground tabular-nums w-10">{prob}%</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-[9px] font-mono font-bold bg-success/10 text-success border border-success/20 rounded-sm px-1.5">{h.supportingEvidence.length} SUPPORT</Badge>
                      <Badge variant="secondary" className="text-[9px] font-mono font-bold bg-danger/10 text-danger border border-danger/20 rounded-sm px-1.5">{h.contradictingEvidence.length} CONTRA</Badge>
                    </div>
                  </div>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                </div>

                <div className={`overflow-hidden transition-all duration-300 ${expanded ? 'max-h-96 mt-3 pt-3 border-t border-white/10' : 'max-h-0'}`}>
                  <p className="text-[12px] text-muted-foreground line-clamp-4 mb-3 leading-relaxed">{h.reasoning}</p>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {h.supportingEvidence.map((s) => (
                        <span key={s} className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-success/10 text-success border border-success/20">{s}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {h.contradictingEvidence.map((c) => (
                        <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-danger/10 text-danger border border-danger/20">{c}</span>
                      ))}
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground mt-2">{h.timeline?.length || 0} TIMELINE_EVENTS</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Evidence Graph Placeholder (40%) */}
      <div className="w-[40%] glass-subtle rounded-lg flex flex-col overflow-hidden">
        <div className="panel-header">
          <span>// EVIDENCE_GRAPH</span>
          <span>[NODES]</span>
        </div>
        <div className="flex-1 flex items-center justify-center relative viewport-frosted overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 400">
            <circle cx="100" cy="120" r="4" fill="hsl(217 91% 60%)" />
            <circle cx="250" cy="80" r="4" fill="hsl(258 90% 66%)" />
            <circle cx="300" cy="200" r="4" fill="hsl(217 91% 60%)" />
            <circle cx="150" cy="280" r="4" fill="hsl(217 91% 60%)" />
            <circle cx="200" cy="180" r="6" fill="white" />
            <circle cx="80" cy="320" r="4" fill="hsl(0 72% 51%)" />
            <circle cx="320" cy="320" r="4" fill="hsl(142 71% 45%)" />
            <line x1="100" y1="120" x2="200" y2="180" stroke="white" strokeWidth="0.5" opacity="0.3" />
            <line x1="250" y1="80" x2="200" y2="180" stroke="white" strokeWidth="0.5" opacity="0.3" />
            <line x1="300" y1="200" x2="200" y2="180" stroke="white" strokeWidth="0.5" opacity="0.3" />
            <line x1="150" y1="280" x2="200" y2="180" stroke="white" strokeWidth="0.5" opacity="0.3" />
            <line x1="80" y1="320" x2="150" y2="280" stroke="white" strokeWidth="0.5" opacity="0.2" />
            <line x1="320" y1="320" x2="300" y2="200" stroke="white" strokeWidth="0.5" opacity="0.2" />
          </svg>
          <span className="text-[10px] font-mono font-bold text-muted-foreground/30 relative z-10 uppercase tracking-widest">
            Awaiting Data
          </span>
        </div>
      </div>
    </div>
  );
}
