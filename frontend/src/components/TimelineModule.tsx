import { useState, useMemo, useEffect } from 'react';
import { Eye, EyeOff, Lock, Unlock, ChevronDown } from 'lucide-react';
import { useCaseContext } from '@/lib/CaseContext';
import { useHypotheses } from '@/hooks/useHypotheses';
import { useTimeline } from '@/lib/TimelineContext';
import { BlueprintView3D } from '@/components/blueprint/BlueprintView3D';
import {
  getActorPositionsAtTime,
  getActorColor,
  getActorRole,
  parseTimestamp,
  actionLabel,
  getTimelineRange,
} from '@/lib/timelineAnimation';
import type { Hypothesis } from '@/types';
import type { ActorData } from '@/components/blueprint/types';

// Role-based colors for actors
const roleColors: Record<string, string> = {
  suspect: '#EF4444',
  victim: '#64748B',
  witness: '#3B82F6',
  officer: '#22C55E',
};

interface DerivedActor {
  id: string;
  name: string;
  color: string;
  type: string;
  visible: boolean;
  locked: boolean;
  actions: { start: number; end: number; label: string; action: string }[];
}

export function TimelineModule() {
  const { caseId, caseData } = useCaseContext();
  const { data: hypotheses, loading } = useHypotheses(caseId);
  const { currentTime, selectedHypothesisId, selectHypothesis } = useTimeline();

  const [visibilityOverrides, setVisibilityOverrides] = useState<Record<string, boolean>>({});
  const [lockOverrides, setLockOverrides] = useState<Record<string, boolean>>({});
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Sort hypotheses by rank
  const sorted = useMemo(
    () => [...hypotheses].sort((a, b) => a.rank - b.rank),
    [hypotheses]
  );

  // Auto-select top hypothesis when none selected
  useEffect(() => {
    if (!selectedHypothesisId && sorted.length > 0) {
      selectHypothesis(sorted[0].id);
    }
  }, [sorted, selectedHypothesisId, selectHypothesis]);

  // Get the currently selected hypothesis
  const selectedHypothesis = useMemo(
    () => hypotheses.find((h) => h.id === selectedHypothesisId) || null,
    [hypotheses, selectedHypothesisId]
  );

  // Compute timeline range for track display
  const timeRange = useMemo(() => {
    if (!selectedHypothesis) return { startHour: 17, endHour: 24 };
    const range = getTimelineRange(selectedHypothesis);
    // Pad by 1 hour on each side
    const startHour = Math.max(0, Math.floor(range.start / 60) - 1);
    const endHour = Math.min(24, Math.ceil(range.end / 60) + 1);
    return { startHour, endHour };
  }, [selectedHypothesis]);

  const hours = Array.from(
    { length: timeRange.endHour - timeRange.startHour + 1 },
    (_, i) => timeRange.startHour + i
  );

  // Derive actors from the selected hypothesis timeline
  const actors: DerivedActor[] = useMemo(() => {
    if (!selectedHypothesis?.timeline?.length) return [];

    // Group timeline events by actor
    const actorMap = new Map<string, typeof selectedHypothesis.timeline>();
    for (const event of selectedHypothesis.timeline) {
      if (!actorMap.has(event.actor)) {
        actorMap.set(event.actor, []);
      }
      actorMap.get(event.actor)!.push(event);
    }

    const result: DerivedActor[] = [];
    for (const [actorId, events] of actorMap) {
      const role = getActorRole(actorId);
      const color = getActorColor(actorId);

      // Convert HH:mm timestamps to hour numbers for track display
      const actions = events.map((ev) => {
        const mins = parseTimestamp(ev.timestamp);
        const startHours = mins / 60;
        // Give each block a duration based on next event or 30 min default
        return {
          start: startHours,
          end: startHours + 0.5,
          label: ev.description,
          action: ev.action,
        };
      });

      result.push({
        id: actorId,
        name: actorId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        color: color,
        type: role,
        visible:
          visibilityOverrides[actorId] !== undefined
            ? visibilityOverrides[actorId]
            : true,
        locked:
          lockOverrides[actorId] !== undefined
            ? lockOverrides[actorId]
            : false,
        actions,
      });
    }

    return result;
  }, [selectedHypothesis, visibilityOverrides, lockOverrides]);

  // Compute interpolated 3D actor positions
  const actorPositions: ActorData[] = useMemo(() => {
    if (!selectedHypothesis) return [];
    const all = getActorPositionsAtTime(selectedHypothesis, currentTime);
    // Filter by visibility overrides
    return all.filter(
      (a) =>
        visibilityOverrides[a.id] === undefined || visibilityOverrides[a.id]
    );
  }, [selectedHypothesis, currentTime, visibilityOverrides]);

  const toggleVisibility = (id: string) => {
    setVisibilityOverrides((prev) => ({
      ...prev,
      [id]: !(prev[id] !== undefined ? prev[id] : true),
    }));
  };
  const toggleLock = (id: string) => {
    setLockOverrides((prev) => ({
      ...prev,
      [id]: !(prev[id] !== undefined ? prev[id] : false),
    }));
  };

  const totalWidth = (timeRange.endHour - timeRange.startHour) * 120;
  const rangeMinutes =
    (timeRange.endHour - timeRange.startHour) * 60;

  // Playhead position as percentage of track width
  const playheadPct =
    rangeMinutes > 0
      ? ((currentTime - timeRange.startHour * 60) / rangeMinutes) * 100
      : 0;

  const displayProb = (p: number) =>
    p <= 1 ? Math.round(p * 100) : Math.round(p);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Top: Viewport with 3D actors */}
      <div
        className="h-[60%] relative overflow-hidden border-b border-white/10"
        style={{ cursor: 'crosshair' }}
      >
        {caseData?.blueprintData ? (
          <BlueprintView3D
            blueprintData={caseData.blueprintData}
            actors={actorPositions}
          />
        ) : (
          <div className="w-full h-full viewport-frosted flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-muted-foreground relative z-10">
              <span className="text-[11px] font-mono font-bold opacity-30 uppercase tracking-widest">
                Timeline Playback
              </span>
              <span className="text-[9px] font-mono text-muted-foreground/40">
                No blueprint data
              </span>
            </div>
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
          <span className="status-dot" />
          <span className="text-[9px] font-mono font-bold text-muted-foreground tracking-wider">
            PLAYBACK_ACTIVE
          </span>
        </div>
      </div>

      {/* Bottom: Hypothesis selector + Track editor */}
      <div className="h-[40%] flex flex-col min-h-0">
        {/* Hypothesis selector bar */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10 bg-white/[0.02] shrink-0">
          <span className="text-[9px] font-mono font-bold text-muted-foreground/50 uppercase tracking-wider">
            //&nbsp;HYPOTHESIS
          </span>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2.5 py-1 interactive focus-ring hover:bg-white/10 max-w-[360px]"
            >
              {selectedHypothesis ? (
                <>
                  <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 rounded-sm px-1 py-0">
                    #{selectedHypothesis.rank}
                  </span>
                  <span className="text-[10px] font-mono text-foreground/80 truncate">
                    {selectedHypothesis.title}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-primary">
                    {displayProb(selectedHypothesis.probability)}%
                  </span>
                </>
              ) : (
                <span className="text-[10px] font-mono text-muted-foreground/40">
                  No hypothesis
                </span>
              )}
              <ChevronDown size={10} className="text-muted-foreground ml-1" />
            </button>

            {dropdownOpen && sorted.length > 0 && (
              <div className="absolute top-full left-0 mt-1 z-50 glass-strong rounded-lg border border-white/15 py-1 min-w-[300px] max-w-[400px] shadow-xl">
                {sorted.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      selectHypothesis(h.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left interactive hover:bg-white/10 ${
                      h.id === selectedHypothesisId ? 'bg-white/10' : ''
                    }`}
                  >
                    <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 border border-primary/20 rounded-sm px-1 py-0 shrink-0">
                      #{h.rank}
                    </span>
                    <span className="text-[10px] font-mono text-foreground/80 flex-1 truncate">
                      {h.title}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-primary shrink-0">
                      {displayProb(h.probability)}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {sorted.length > 1 && (
            <div className="flex gap-1 ml-2">
              {sorted.slice(0, 4).map((h) => (
                <button
                  key={h.id}
                  onClick={() => selectHypothesis(h.id)}
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm border interactive focus-ring ${
                    h.id === selectedHypothesisId
                      ? 'bg-primary/15 border-primary/30 text-primary'
                      : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  H{h.rank}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Track editor */}
        <div className="flex-1 flex min-h-0">
          {/* Actor list */}
          <div className="w-48 glass flex flex-col shrink-0">
            <div className="panel-header">
              <span>// ACTORS</span>
            </div>
            {loading && actors.length === 0 && (
              <div className="flex items-center justify-center py-4">
                <span className="text-[9px] font-mono text-muted-foreground/40">
                  Loading...
                </span>
              </div>
            )}
            {!loading && actors.length === 0 && (
              <div className="flex items-center justify-center py-4">
                <span className="text-[9px] font-mono text-muted-foreground/40">
                  No actors
                </span>
              </div>
            )}
            {actors.map((actor) => (
              <div
                key={actor.id}
                className="h-10 flex items-center px-3 gap-2.5 border-b border-white/5 hover-row"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: actor.color }}
                />
                <span className="text-[11px] font-mono font-medium text-foreground/70 flex-1 truncate">
                  {actor.name}
                </span>
                <button
                  onClick={() => toggleVisibility(actor.id)}
                  className="interactive focus-ring p-1 rounded-sm hover:bg-white/10"
                >
                  {actor.visible ? (
                    <Eye size={11} className="text-muted-foreground" />
                  ) : (
                    <EyeOff size={11} className="text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => toggleLock(actor.id)}
                  className="interactive focus-ring p-1 rounded-sm hover:bg-white/10"
                >
                  {actor.locked ? (
                    <Lock size={11} className="text-muted-foreground" />
                  ) : (
                    <Unlock size={11} className="text-muted-foreground" />
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Tracks */}
          <div className="flex-1 overflow-x-auto min-w-0 border-l border-white/5">
            <div
              style={{ width: totalWidth, minWidth: '100%' }}
              className="relative h-full"
            >
              {/* Time ruler */}
              <div className="h-8 border-b border-white/10 flex relative bg-white/[0.02]">
                {hours.map((h) => (
                  <div key={h} className="flex-none" style={{ width: 120 }}>
                    <span className="text-[9px] font-mono font-bold text-muted-foreground/40 pl-2 tabular-nums">
                      {h.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Actor tracks */}
              {actors.map((actor, i) => (
                <div
                  key={actor.id}
                  className="h-10 relative border-b border-white/5"
                  style={{
                    backgroundColor:
                      i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  }}
                >
                  {actor.visible &&
                    actor.actions.map((action, ai) => {
                      const left =
                        ((action.start - timeRange.startHour) /
                          (timeRange.endHour - timeRange.startHour)) *
                        100;
                      const width =
                        ((action.end - action.start) /
                          (timeRange.endHour - timeRange.startHour)) *
                        100;
                      return (
                        <div
                          key={ai}
                          className="absolute top-1.5 h-7 rounded-sm flex items-center px-2.5 text-[9px] font-mono font-medium text-foreground/60 truncate"
                          style={{
                            left: `${left}%`,
                            width: `${Math.max(width, 1)}%`,
                            backgroundColor: actor.color + '18',
                            borderLeft: `2px solid ${actor.color}60`,
                          }}
                          title={`${actionLabel(action.action)}: ${action.label}`}
                        >
                          {action.label}
                        </div>
                      );
                    })}
                </div>
              ))}

              {/* Playhead */}
              {playheadPct >= 0 && playheadPct <= 100 && (
                <div
                  className="absolute top-0 bottom-0 w-px z-10 pointer-events-none"
                  style={{
                    left: `${playheadPct}%`,
                    backgroundColor: 'hsl(217 91% 60% / 0.6)',
                    boxShadow: '0 0 6px hsl(217 91% 60% / 0.3)',
                  }}
                >
                  <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary -ml-[5px]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
