import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Zap, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCaseContext } from '@/lib/CaseContext';
import { useHypotheses } from '@/hooks/useHypotheses';
import { apiPost } from '@/lib/api';

export function AnalysisModule() {
  const { caseId } = useCaseContext();
  const { data: hypotheses, loading } = useHypotheses(caseId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Track previously seen hypothesis IDs for flash-on-arrival
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());

  // Track previous probability values for animation detection
  const prevProbsRef = useRef<Map<string, number>>(new Map());
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  // Elapsed timer while analyzing
  useEffect(() => {
    if (!analyzing) {
      setElapsedSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [analyzing]);

  // Flash newly-arrived hypotheses
  useEffect(() => {
    const currentIds = new Set(hypotheses.map((h) => h.id));
    const newIds = new Set<string>();
    for (const id of currentIds) {
      if (!prevIdsRef.current.has(id)) {
        newIds.add(id);
      }
    }
    prevIdsRef.current = currentIds;

    if (newIds.size > 0) {
      setFlashIds(newIds);
      const timer = setTimeout(() => setFlashIds(new Set()), 2500);
      return () => clearTimeout(timer);
    }
  }, [hypotheses]);

  // Detect probability changes and trigger pulse animation
  useEffect(() => {
    const changed = new Set<string>();
    for (const h of hypotheses) {
      const prev = prevProbsRef.current.get(h.id);
      if (prev !== undefined && prev !== h.probability) {
        changed.add(h.id);
      }
      prevProbsRef.current.set(h.id, h.probability);
    }
    if (changed.size > 0) {
      setAnimatingIds(changed);
      const timer = setTimeout(() => setAnimatingIds(new Set()), 1200);
      return () => clearTimeout(timer);
    }
  }, [hypotheses]);

  const triggerAnalysis = async (stage: number) => {
    setAnalyzing(true);
    setCurrentStage(stage);
    try {
      await apiPost(`/api/cases/${caseId}/analyze`, { upToStage: stage });
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Sort by rank
  const sorted = [...hypotheses].sort((a, b) => a.rank - b.rank);

  const getProbColor = (p: number) => {
    if (p > 60) return 'bg-primary';
    if (p > 30) return 'bg-warning';
    return 'bg-danger';
  };

  // Probability from DB is 0-1, display as percentage
  const displayProb = (p: number) => (p <= 1 ? Math.round(p * 100) : Math.round(p));

  const stageLabel = (stage: number) => (stage === 999 ? 'ALL' : `S${stage}`);

  return (
    <div className="flex flex-1 min-h-0 gap-3 p-3">
      {/* Left: Hypothesis List (60%) */}
      <div className="w-[60%] flex flex-col min-h-0">
        <div className="panel-header rounded-t-lg">
          <span>// RANKED_HYPOTHESES [{sorted.length}]</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((stage) => (
              <button
                key={stage}
                onClick={() => triggerAnalysis(stage)}
                disabled={analyzing}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold uppercase tracking-wider interactive focus-ring ${
                  analyzing && currentStage === stage
                    ? 'bg-primary/20 text-primary'
                    : 'text-muted-foreground hover:bg-white/10 hover:text-foreground'
                }`}
              >
                {analyzing && currentStage === stage ? (
                  <Loader2 size={8} className="animate-spin" />
                ) : (
                  <Zap size={8} />
                )}
                S{stage}
              </button>
            ))}
            <button
              onClick={() => triggerAnalysis(999)}
              disabled={analyzing}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold uppercase tracking-wider interactive focus-ring ${
                analyzing && currentStage === 999
                  ? 'bg-primary/20 text-primary'
                  : 'text-primary hover:bg-primary/10'
              }`}
            >
              {analyzing && currentStage === 999 ? (
                <Loader2 size={8} className="animate-spin" />
              ) : (
                <Zap size={8} />
              )}
              ALL
            </button>
          </div>
        </div>

        {/* Analyzing indicator banner */}
        {analyzing && (
          <div className="flex items-center gap-3 px-4 py-3 bg-primary/5 border-b border-primary/20">
            <div className="relative">
              <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              <Zap size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-mono font-bold text-primary tracking-wider">
                ANALYZING {stageLabel(currentStage)} EVIDENCE...
              </p>
              <p className="text-[9px] font-mono text-muted-foreground mt-0.5">
                Gemini reasoning pipeline active -- {elapsedSeconds}s elapsed
              </p>
              <div className="mt-1.5 h-0.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/60 rounded-full"
                  style={{
                    width: `${Math.min(95, elapsedSeconds * 1.5)}%`,
                    transition: 'width 1s linear',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1.5 pt-2">
          {loading && sorted.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">Loading...</span>
            </div>
          )}
          {!loading && sorted.length === 0 && !analyzing && (
            <div className="flex items-center justify-center py-8">
              <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">No hypotheses yet. Run analysis to generate.</span>
            </div>
          )}
          {sorted.map((h) => {
            const expanded = expandedId === h.id;
            const prob = displayProb(h.probability);
            const isFlashing = flashIds.has(h.id);
            const isAnimating = animatingIds.has(h.id);
            return (
              <button
                key={h.id}
                onClick={() => setExpandedId(expanded ? null : h.id)}
                className={`w-full text-left glass-subtle rounded-lg p-4 interactive focus-ring hover:bg-white/10 transition-all duration-300 ${
                  h.rank === 1 ? 'border-l-2 border-l-primary' : ''
                } ${isFlashing ? 'ring-1 ring-primary/50 bg-primary/10 animate-hypothesis-flash' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono font-extrabold text-muted-foreground/30 w-8 tabular-nums">
                    {String(h.rank).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground/85 leading-snug">{h.title}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getProbColor(prob)}`}
                          style={{
                            width: `${prob}%`,
                            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                        />
                      </div>
                      <span
                        className={`text-[12px] font-mono font-bold text-foreground tabular-nums w-10 transition-transform duration-500 ${
                          isAnimating ? 'scale-125 text-primary' : ''
                        }`}
                      >
                        {prob}%
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary" className="text-[9px] font-mono font-bold bg-success/10 text-success border border-success/20 rounded-sm px-1.5">{h.supportingEvidence.length} SUPPORT</Badge>
                      <Badge variant="secondary" className="text-[9px] font-mono font-bold bg-danger/10 text-danger border border-danger/20 rounded-sm px-1.5">{h.contradictingEvidence.length} CONTRA</Badge>
                      {h.stageSnapshot !== undefined && (
                        <Badge variant="secondary" className="text-[9px] font-mono font-bold bg-white/5 text-muted-foreground border border-white/10 rounded-sm px-1.5">
                          S{h.stageSnapshot}
                        </Badge>
                      )}
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
