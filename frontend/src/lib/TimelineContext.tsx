import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';

export interface TimeRange {
  /** Start of scrubber range in minutes from 00:00 */
  start: number;
  /** End of scrubber range in minutes from 00:00 */
  end: number;
}

interface TimelineContextValue {
  /** Minutes from 00:00 (0-1439) */
  currentTime: number;
  playing: boolean;
  /** Playback speed multiplier */
  speed: number;
  /** Which hypothesis timeline to display */
  selectedHypothesisId: string | null;
  /** Dynamic scrubber range based on hypothesis events */
  timeRange: TimeRange;

  play: () => void;
  pause: () => void;
  setTime: (mins: number) => void;
  setSpeed: (n: number) => void;
  selectHypothesis: (id: string | null) => void;
  setTimeRange: (range: TimeRange) => void;
}

const DEFAULT_TIME_RANGE: TimeRange = { start: 0, end: 1439 };

const TimelineContext = createContext<TimelineContextValue>({
  currentTime: 0,
  playing: false,
  speed: 1,
  selectedHypothesisId: null,
  timeRange: DEFAULT_TIME_RANGE,
  play: () => {},
  pause: () => {},
  setTime: () => {},
  setSpeed: () => {},
  selectHypothesis: () => {},
  setTimeRange: () => {},
});

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string | null>(null);
  const [timeRange, setTimeRangeState] = useState<TimeRange>(DEFAULT_TIME_RANGE);

  // Use refs to avoid stale closures in rAF loop
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);
  const currentTimeRef = useRef(currentTime);
  const timeRangeRef = useRef(timeRange);
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

  useEffect(() => {
    timeRangeRef.current = timeRange;
  }, [timeRange]);

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

    const rangeEnd = timeRangeRef.current.end;
    if (nextTime >= rangeEnd) {
      setCurrentTime(rangeEnd);
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

  const setTimeRange = useCallback((range: TimeRange) => {
    setTimeRangeState(range);
  }, []);

  return (
    <TimelineContext.Provider
      value={{
        currentTime,
        playing,
        speed,
        selectedHypothesisId,
        timeRange,
        play,
        pause,
        setTime,
        setSpeed,
        selectHypothesis,
        setTimeRange,
      }}
    >
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline(): TimelineContextValue {
  return useContext(TimelineContext);
}
