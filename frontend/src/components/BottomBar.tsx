import { useEffect, useMemo, useRef, useState } from 'react';
import { Rewind, Play, Pause, FastForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useCaseContext } from '@/lib/CaseContext';
import { useHypotheses } from '@/hooks/useHypotheses';
import { useTimeline } from '@/lib/TimelineContext';
import { getTimelineRange, formatMinutes } from '@/lib/timelineAnimation';

export function BottomBar() {
  const { caseId } = useCaseContext();
  const { data: hypotheses } = useHypotheses(caseId);
  const {
    currentTime,
    playing,
    speed,
    selectedHypothesisId,
    timeRange,
    play,
    pause,
    setTime,
    setSpeed,
    setTimeRange,
    selectHypothesis,
  } = useTimeline();

  // Track previously seen hypothesis IDs for flash-on-arrival
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());

  // Track previous probability values for animation
  const prevProbsRef = useRef<Map<string, number>>(new Map());
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  // Sort by rank
  const sorted = useMemo(
    () => [...hypotheses].sort((a, b) => a.rank - b.rank),
    [hypotheses]
  );

  // Auto-select top hypothesis when none is selected and hypotheses arrive
  useEffect(() => {
    if (!selectedHypothesisId && sorted.length > 0) {
      selectHypothesis(sorted[0].id);
    }
  }, [sorted, selectedHypothesisId, selectHypothesis]);

  // Auto-set time range when a hypothesis is selected
  const selectedHypothesis = useMemo(
    () => hypotheses.find((h) => h.id === selectedHypothesisId) || null,
    [hypotheses, selectedHypothesisId]
  );

  useEffect(() => {
    if (!selectedHypothesis) return;
    const range = getTimelineRange(selectedHypothesis);
    // If no valid events, keep default
    if (range.start === 0 && range.end === 1439) return;

    // Pad by 30 minutes on each side
    const paddedStart = Math.max(0, range.start - 30);
    const paddedEnd = Math.min(1439, range.end + 30);
    setTimeRange({ start: paddedStart, end: paddedEnd });

    // Auto-jump currentTime to first event if we're outside the range
    if (currentTime < paddedStart || currentTime > paddedEnd) {
      setTime(range.start);
    }
  // Only trigger on hypothesis selection change, not on currentTime changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHypothesisId, selectedHypothesis, setTimeRange, setTime]);

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
      const timer = setTimeout(() => setFlashIds(new Set()), 2000);
      return () => clearTimeout(timer);
    }
  }, [hypotheses]);

  // Detect probability changes and trigger animation
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

  const getProbColor = (p: number) => {
    if (p > 60) return 'bg-primary';
    if (p > 30) return 'bg-warning';
    return 'bg-danger';
  };

  // Probability from DB is 0-1, display as percentage
  const displayProb = (p: number) => (p <= 1 ? Math.round(p * 100) : Math.round(p));

  const handleRewind = () => {
    setTime(Math.max(timeRange.start, currentTime - 30));
  };

  const handleFastForward = () => {
    setTime(Math.min(timeRange.end, currentTime + 30));
  };

  const speedToValue = (s: number) => {
    if (s === 0.5) return '0.5x';
    if (s === 2) return '2x';
    return '1x';
  };

  const valueToSpeed = (v: string) => {
    if (v === '0.5x') return 0.5;
    if (v === '2x') return 2;
    return 1;
  };

  return (
    <div className="glass shrink-0">
      {/* Scrubber */}
      <div className="px-4 py-2 flex items-center gap-3">
        <span className="text-[10px] font-mono font-bold text-muted-foreground tabular-nums w-10">
          {formatMinutes(timeRange.start)}
        </span>
        <Slider
          value={[Math.round(currentTime)]}
          onValueChange={(v) => setTime(v[0])}
          min={Math.round(timeRange.start)}
          max={Math.round(timeRange.end)}
          step={1}
          className="flex-1"
        />
        <span className="text-[10px] font-mono font-bold text-muted-foreground tabular-nums w-10">
          {formatMinutes(timeRange.end)}
        </span>

        <div className="h-4 w-px bg-border/50 mx-1" />

        <div className="flex items-center gap-0.5">
          <button
            onClick={handleRewind}
            className="p-2 rounded-md interactive focus-ring hover:bg-white/10"
            style={{ minWidth: 32, minHeight: 32 }}
          >
            <Rewind size={13} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => (playing ? pause() : play())}
            className="p-2 rounded-md interactive focus-ring hover:bg-white/10"
            style={{ minWidth: 32, minHeight: 32 }}
          >
            {playing ? (
              <Pause size={13} className="text-foreground" />
            ) : (
              <Play size={13} className="text-foreground" />
            )}
          </button>
          <button
            onClick={handleFastForward}
            className="p-2 rounded-md interactive focus-ring hover:bg-white/10"
            style={{ minWidth: 32, minHeight: 32 }}
          >
            <FastForward size={13} className="text-muted-foreground" />
          </button>
          <select
            value={speedToValue(speed)}
            onChange={(e) => setSpeed(valueToSpeed(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-md text-[10px] font-mono font-bold px-2 py-1 text-foreground focus-ring ml-1"
          >
            <option value="0.5x">0.5x</option>
            <option value="1x">1.0x</option>
            <option value="2x">2.0x</option>
          </select>
        </div>

        <span className="text-[12px] font-mono font-bold text-foreground tabular-nums ml-2 w-12">
          {formatMinutes(currentTime)}
        </span>
      </div>

      {/* Hypothesis ranking */}
      <div className="panel-header">
        <span>// HYPOTHESIS_RANKING</span>
        <span>{sorted.length} active</span>
      </div>
      <div className="px-4 pb-3 pt-2 flex gap-2.5">
        {sorted.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-2">
            <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">
              No hypotheses
            </span>
          </div>
        )}
        {sorted.map((h) => {
          const prob = displayProb(h.probability);
          const isSelected = h.id === selectedHypothesisId;
          const isFlashing = flashIds.has(h.id);
          const isAnimating = animatingIds.has(h.id);
          return (
            <div
              key={h.id}
              onClick={() => selectHypothesis(h.id)}
              className={`flex-1 glass-subtle rounded-lg p-3 interactive cursor-pointer hover:bg-white/10 transition-all duration-300 ${
                isSelected ? 'ring-1 ring-primary/40 bg-white/10' : ''
              } ${isFlashing ? 'ring-2 ring-primary/60 bg-primary/10 animate-hypothesis-flash' : ''}`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-[10px] font-mono font-bold text-muted-foreground bg-white/5 border border-white/10 rounded-sm px-1.5 py-0.5">
                  #{h.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground/80 line-clamp-2 leading-snug">
                    {h.title}
                  </p>
                  <p
                    className={`text-xl font-mono font-bold text-primary mt-1 tracking-tight transition-all duration-700 ${
                      isAnimating ? 'scale-110' : ''
                    }`}
                  >
                    {prob}%
                  </p>
                  <div className="w-full h-0.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getProbColor(prob)}`}
                      style={{
                        width: `${prob}%`,
                        transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
