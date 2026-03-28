import { useState } from 'react';
import { Rewind, Play, Pause, FastForward } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useCaseContext } from '@/lib/CaseContext';
import { useHypotheses } from '@/hooks/useHypotheses';

export function BottomBar() {
  const { caseId } = useCaseContext();
  const { data: hypotheses } = useHypotheses(caseId);
  const [currentTime, setCurrentTime] = useState(1320);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState('1x');

  // Sort by rank
  const sorted = [...hypotheses].sort((a, b) => a.rank - b.rank);

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60).toString().padStart(2, '0');
    const m = (mins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const getProbColor = (p: number) => {
    if (p > 60) return 'bg-primary';
    if (p > 30) return 'bg-warning';
    return 'bg-danger';
  };

  // Probability from DB is 0-1, display as percentage
  const displayProb = (p: number) => (p <= 1 ? Math.round(p * 100) : Math.round(p));

  return (
    <div className="glass shrink-0">
      {/* Scrubber */}
      <div className="px-4 py-2 flex items-center gap-3">
        <span className="text-[10px] font-mono font-bold text-muted-foreground tabular-nums w-10">00:00</span>
        <Slider
          value={[currentTime]}
          onValueChange={(v) => setCurrentTime(v[0])}
          max={1439}
          step={1}
          className="flex-1"
        />
        <span className="text-[10px] font-mono font-bold text-muted-foreground tabular-nums w-10">23:59</span>

        <div className="h-4 w-px bg-border/50 mx-1" />

        <div className="flex items-center gap-0.5">
          <button className="p-2 rounded-md interactive focus-ring hover:bg-white/10" style={{ minWidth: 32, minHeight: 32 }}>
            <Rewind size={13} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => setPlaying(!playing)}
            className="p-2 rounded-md interactive focus-ring hover:bg-white/10"
            style={{ minWidth: 32, minHeight: 32 }}
          >
            {playing ? <Pause size={13} className="text-foreground" /> : <Play size={13} className="text-foreground" />}
          </button>
          <button className="p-2 rounded-md interactive focus-ring hover:bg-white/10" style={{ minWidth: 32, minHeight: 32 }}>
            <FastForward size={13} className="text-muted-foreground" />
          </button>
          <select
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-md text-[10px] font-mono font-bold px-2 py-1 text-foreground focus-ring ml-1"
          >
            <option value="0.5x">0.5x</option>
            <option value="1x">1.0x</option>
            <option value="2x">2.0x</option>
          </select>
        </div>

        <span className="text-[12px] font-mono font-bold text-foreground tabular-nums ml-2 w-12">
          {formatTime(currentTime)}
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
            <span className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-wider">No hypotheses</span>
          </div>
        )}
        {sorted.map((h) => {
          const prob = displayProb(h.probability);
          return (
            <div
              key={h.id}
              className="flex-1 glass-subtle rounded-lg p-3 interactive hover:bg-white/10"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-[10px] font-mono font-bold text-muted-foreground bg-white/5 border border-white/10 rounded-sm px-1.5 py-0.5">
                  #{h.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground/80 line-clamp-2 leading-snug">{h.title}</p>
                  <p className="text-xl font-mono font-bold text-primary mt-1 tracking-tight">{prob}%</p>
                  <div className="w-full h-0.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getProbColor(prob)} transition-all duration-500`}
                      style={{ width: `${prob}%` }}
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
