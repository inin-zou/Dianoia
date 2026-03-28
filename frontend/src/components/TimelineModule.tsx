import { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Box } from 'lucide-react';
import { mockActors } from '@/data/mockData';
import type { TimelineActor } from '@/data/mockData';

export function TimelineModule() {
  const [actors, setActors] = useState<TimelineActor[]>(mockActors);
  const hourStart = 17;
  const hourEnd = 24;
  const hours = Array.from({ length: hourEnd - hourStart + 1 }, (_, i) => hourStart + i);
  const [playheadHour, setPlayheadHour] = useState(22);

  const toggleVisibility = (id: string) => {
    setActors(actors.map((a) => a.id === id ? { ...a, visible: !a.visible } : a));
  };
  const toggleLock = (id: string) => {
    setActors(actors.map((a) => a.id === id ? { ...a, locked: !a.locked } : a));
  };

  const totalWidth = (hourEnd - hourStart) * 120;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Top: Viewport */}
      <div className="h-[60%] flex items-center justify-center viewport-frosted border-b border-white/10 relative overflow-hidden" style={{ cursor: 'crosshair' }}>
        <div className="flex flex-col items-center gap-3 text-muted-foreground relative z-10">
          <Box size={40} strokeWidth={1} className="opacity-15" />
          <span className="text-[11px] font-mono font-bold opacity-30 uppercase tracking-widest">Timeline Playback</span>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
          <span className="status-dot" />
          <span className="text-[9px] font-mono font-bold text-muted-foreground tracking-wider">PLAYBACK_READY</span>
        </div>
      </div>

      {/* Bottom: Track editor */}
      <div className="h-[40%] flex min-h-0">
        {/* Actor list */}
        <div className="w-48 glass flex flex-col shrink-0">
          <div className="panel-header">
            <span>// ACTORS</span>
          </div>
          {actors.map((actor) => (
            <div key={actor.id} className="h-10 flex items-center px-3 gap-2.5 border-b border-white/5 hover-row">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: actor.color }} />
              <span className="text-[11px] font-mono font-medium text-foreground/70 flex-1 truncate">{actor.name}</span>
              <button onClick={() => toggleVisibility(actor.id)} className="interactive focus-ring p-1 rounded-sm hover:bg-white/10">
                {actor.visible ? <Eye size={11} className="text-muted-foreground" /> : <EyeOff size={11} className="text-muted-foreground" />}
              </button>
              <button onClick={() => toggleLock(actor.id)} className="interactive focus-ring p-1 rounded-sm hover:bg-white/10">
                {actor.locked ? <Lock size={11} className="text-muted-foreground" /> : <Unlock size={11} className="text-muted-foreground" />}
              </button>
            </div>
          ))}
        </div>

        {/* Tracks */}
        <div className="flex-1 overflow-x-auto min-w-0 border-l border-white/5">
          <div style={{ width: totalWidth, minWidth: '100%' }} className="relative">
            {/* Time ruler */}
            <div className="h-8 border-b border-white/10 flex relative bg-white/[0.02]">
              {hours.map((h) => (
                <div key={h} className="flex-none" style={{ width: 120 }}>
                  <span className="text-[9px] font-mono font-bold text-muted-foreground/40 pl-2 tabular-nums">{h.toString().padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>

            {/* Actor tracks */}
            {actors.map((actor, i) => (
              <div
                key={actor.id}
                className="h-10 relative border-b border-white/5"
                style={{ backgroundColor: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}
              >
                {actor.visible && actor.actions.map((action, ai) => {
                  const left = ((action.start - hourStart) / (hourEnd - hourStart)) * 100;
                  const width = ((action.end - action.start) / (hourEnd - hourStart)) * 100;
                  return (
                    <div
                      key={ai}
                      className="absolute top-1.5 h-7 rounded-sm flex items-center px-2.5 text-[9px] font-mono font-medium text-foreground/60 truncate"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: actor.color + '18',
                        borderLeft: `2px solid ${actor.color}60`,
                      }}
                    >
                      {action.label}
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-px z-10 pointer-events-none"
              style={{
                left: `${((playheadHour - hourStart) / (hourEnd - hourStart)) * 100}%`,
                backgroundColor: 'hsl(217 91% 60% / 0.6)',
                boxShadow: '0 0 6px hsl(217 91% 60% / 0.3)',
              }}
            >
              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-primary -ml-[5px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
