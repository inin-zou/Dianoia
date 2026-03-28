import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

interface TimelineContextValue {
  /** Minutes from 00:00 (0-1439) */
  currentTime: number;
  playing: boolean;
  /** Playback speed multiplier */
  speed: number;
  /** Which hypothesis timeline to display */
  selectedHypothesisId: string | null;

  play: () => void;
  pause: () => void;
  setTime: (mins: number) => void;
  setSpeed: (n: number) => void;
  selectHypothesis: (id: string | null) => void;
}

const TimelineContext = createContext<TimelineContextValue>({
  currentTime: 0,
  playing: false,
  speed: 1,
  selectedHypothesisId: null,
  play: () => {},
  pause: () => {},
  setTime: () => {},
  setSpeed: () => {},
  selectHypothesis: () => {},
});

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string | null>(null);

  // Use refs to avoid stale closures in rAF loop
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);
  const currentTimeRef = useRef(currentTime);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  // Animation loop using requestAnimationFrame for smooth 60fps
  const tick = useCallback((timestamp: number) => {
    if (!playingRef.current) return;

    if (lastFrameRef.current === 0) {
      lastFrameRef.current = timestamp;
    }

    const elapsed = timestamp - lastFrameRef.current;
    lastFrameRef.current = timestamp;

    // Speed multiplier: at 1x, 1 real second = 1 timeline minute
    // This means a 24-hour day plays in ~24 minutes at 1x
    const deltaMinutes = (elapsed / 1000) * speedRef.current;
    const nextTime = currentTimeRef.current + deltaMinutes;

    if (nextTime >= 1439) {
      setCurrentTime(1439);
      setPlaying(false);
      return;
    }

    setCurrentTime(nextTime);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (playing) {
      lastFrameRef.current = 0;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [playing, tick]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);

  const setTime = useCallback((mins: number) => {
    const clamped = Math.max(0, Math.min(1439, mins));
    setCurrentTime(clamped);
  }, []);

  const setSpeed = useCallback((n: number) => {
    setSpeedState(n);
  }, []);

  const selectHypothesis = useCallback((id: string | null) => {
    setSelectedHypothesisId(id);
  }, []);

  return (
    <TimelineContext.Provider
      value={{
        currentTime,
        playing,
        speed,
        selectedHypothesisId,
        play,
        pause,
        setTime,
        setSpeed,
        selectHypothesis,
      }}
    >
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline(): TimelineContextValue {
  return useContext(TimelineContext);
}
