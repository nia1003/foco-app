// ─────────────────────────────────────────────
// useTimer — 計時器 FSM + AppState 背景同步
// 策略：timestamp-based（不依賴 setInterval 在背景存活）
// ─────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export type TimerPhase = 'detail' | 'timer' | 'reflection' | 'accomplished';

interface UseTimerOptions {
  durationSeconds?: number;
  onComplete?: () => void;
}

export function useTimer({
  durationSeconds = 25 * 60,
  onComplete,
}: UseTimerOptions = {}) {
  const [phase, setPhase] = useState<TimerPhase>('detail');
  const [secs, setSecs] = useState(durationSeconds);
  const [paused, setPaused] = useState(false);

  // Refs for background-safe tracking
  const startedAtRef = useRef<number | null>(null);   // Date.now() when timer started/resumed
  const remainingAtPauseRef = useRef<number>(durationSeconds); // secs left when paused
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Helpers ──────────────────────────────────

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    stopInterval();
    intervalRef.current = setInterval(() => {
      if (!startedAtRef.current) return;
      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      const remaining = Math.max(0, remainingAtPauseRef.current - elapsed);
      setSecs(remaining);
      if (remaining <= 0) {
        stopInterval();
        setPhase('reflection');
        onComplete?.();
      }
    }, 500); // poll every 500ms for smooth display
  }, [stopInterval, onComplete]);

  // ── AppState listener (background → foreground sync) ──
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active' && phase === 'timer' && !paused && startedAtRef.current) {
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        const remaining = Math.max(0, remainingAtPauseRef.current - elapsed);
        setSecs(remaining);
        if (remaining <= 0) {
          stopInterval();
          setPhase('reflection');
          onComplete?.();
        } else {
          startInterval(); // restart the foreground interval
        }
      }
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [phase, paused, startInterval, stopInterval, onComplete]);

  // ── Cleanup on unmount ─────────────────────────
  useEffect(() => () => stopInterval(), [stopInterval]);

  // ── Public actions ────────────────────────────

  const start = useCallback(() => {
    startedAtRef.current = Date.now();
    remainingAtPauseRef.current = durationSeconds;
    setSecs(durationSeconds);
    setPaused(false);
    setPhase('timer');
    startInterval();
  }, [durationSeconds, startInterval]);

  const pause = useCallback(() => {
    if (phase !== 'timer' || paused) return;
    stopInterval();
    // snapshot remaining
    const elapsed = startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current) / 1000)
      : 0;
    remainingAtPauseRef.current = Math.max(0, remainingAtPauseRef.current - elapsed);
    startedAtRef.current = null;
    setPaused(true);
  }, [phase, paused, stopInterval]);

  const resume = useCallback(() => {
    if (phase !== 'timer' || !paused) return;
    startedAtRef.current = Date.now();
    // remainingAtPauseRef.current already holds the correct remaining secs
    setPaused(false);
    startInterval();
  }, [phase, paused, startInterval]);

  const skipToReflection = useCallback(() => {
    stopInterval();
    startedAtRef.current = null;
    setPhase('reflection');
  }, [stopInterval]);

  const reset = useCallback(() => {
    stopInterval();
    startedAtRef.current = null;
    remainingAtPauseRef.current = durationSeconds;
    setSecs(durationSeconds);
    setPaused(false);
    setPhase('detail');
  }, [durationSeconds, stopInterval]);

  const progress = secs / durationSeconds; // 1 → 0 as time decreases

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return {
    phase,
    setPhase,
    secs,
    paused,
    progress,
    mm,
    ss,
    start,
    pause,
    resume,
    skipToReflection,
    reset,
  };
}
