// ─────────────────────────────────────────────
// useTimer — 計時器 FSM + AppState 背景同步
//            + FOCO 追蹤：pause_count / left_app_count 等
// 策略：timestamp-based（不依賴 setInterval 在背景存活）
// ─────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import type { TimerSnapshot } from '@/types';

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

  // ── Refs for background-safe timing ──────────
  const startedAtRef = useRef<number | null>(null);        // Date.now() when timer started/resumed
  const remainingAtPauseRef = useRef<number>(durationSeconds); // secs left when paused
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── FOCO tracking refs ────────────────────────
  const wallStartRef = useRef<number | null>(null);        // wall-clock start (unchanged across pauses)
  const plannedRef = useRef<number>(durationSeconds);
  const taskIdRef = useRef<string | null>(null);

  const pauseCountRef = useRef(0);
  const pauseTotalSecRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);

  const leftAppCountRef = useRef(0);
  const leftAppTotalSecRef = useRef(0);
  const leaveAppAtRef = useRef<number | null>(null);

  // ── Helpers ───────────────────────────────────
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
    }, 500); // 500ms poll for smooth display
  }, [stopInterval, onComplete]);

  // ── AppState listener ─────────────────────────
  useEffect(() => {
    const handler = (nextState: AppStateStatus) => {
      const prev = AppState.currentState;

      // App 切到背景
      if (
        prev === 'active' &&
        nextState.match(/inactive|background/) &&
        phase === 'timer' &&
        !paused
      ) {
        leaveAppAtRef.current = Date.now();
      }

      // App 回到前景
      if (
        prev.match(/inactive|background/) &&
        nextState === 'active' &&
        phase === 'timer' &&
        !paused &&
        startedAtRef.current
      ) {
        // 累計切出時間
        if (leaveAppAtRef.current) {
          leftAppCountRef.current += 1;
          leftAppTotalSecRef.current +=
            (Date.now() - leaveAppAtRef.current) / 1000;
          leaveAppAtRef.current = null;
        }

        // 重新同步剩餘秒數
        const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
        const remaining = Math.max(0, remainingAtPauseRef.current - elapsed);
        setSecs(remaining);
        if (remaining <= 0) {
          stopInterval();
          setPhase('reflection');
          onComplete?.();
        } else {
          startInterval();
        }
      }
    };

    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [phase, paused, startInterval, stopInterval, onComplete]);

  // ── Cleanup on unmount ────────────────────────
  useEffect(() => () => stopInterval(), [stopInterval]);

  // ── Public actions ────────────────────────────

  const start = useCallback(() => {
    const now = Date.now();

    // Reset all FOCO tracking
    wallStartRef.current = now;
    plannedRef.current = durationSeconds;
    pauseCountRef.current = 0;
    pauseTotalSecRef.current = 0;
    pauseStartRef.current = null;
    leftAppCountRef.current = 0;
    leftAppTotalSecRef.current = 0;
    leaveAppAtRef.current = null;

    // Timer state
    startedAtRef.current = now;
    remainingAtPauseRef.current = durationSeconds;
    setSecs(durationSeconds);
    setPaused(false);
    setPhase('timer');
    startInterval();
  }, [durationSeconds, startInterval]);

  const pause = useCallback(() => {
    if (phase !== 'timer' || paused) return;
    stopInterval();

    // Snapshot remaining
    const elapsed = startedAtRef.current
      ? Math.floor((Date.now() - startedAtRef.current) / 1000)
      : 0;
    remainingAtPauseRef.current = Math.max(0, remainingAtPauseRef.current - elapsed);
    startedAtRef.current = null;

    // FOCO: track pause
    pauseCountRef.current += 1;
    pauseStartRef.current = Date.now();

    setPaused(true);
  }, [phase, paused, stopInterval]);

  const resume = useCallback(() => {
    if (phase !== 'timer' || !paused) return;

    // FOCO: accumulate pause duration
    if (pauseStartRef.current) {
      pauseTotalSecRef.current += (Date.now() - pauseStartRef.current) / 1000;
      pauseStartRef.current = null;
    }

    startedAtRef.current = Date.now();
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
    wallStartRef.current = null;
    pauseCountRef.current = 0;
    pauseTotalSecRef.current = 0;
    leftAppCountRef.current = 0;
    leftAppTotalSecRef.current = 0;
    setSecs(durationSeconds);
    setPaused(false);
    setPhase('detail');
  }, [durationSeconds, stopInterval]);

  /** focus.tsx 在結束時呼叫，取得完整的追蹤快照 */
  const getSnapshot = useCallback((): TimerSnapshot => {
    // 如果目前暫停中，先結算這次暫停的時間
    const extraPauseSec =
      pauseStartRef.current ? (Date.now() - pauseStartRef.current) / 1000 : 0;
    // 如果 App 目前在背景（不太可能在這裡呼叫，但以防萬一）
    const extraLeftAppSec =
      leaveAppAtRef.current ? (Date.now() - leaveAppAtRef.current) / 1000 : 0;

    return {
      plannedDuration: plannedRef.current,
      startedAt: wallStartRef.current ?? Date.now(),
      pauseCount: pauseCountRef.current,
      pauseTotalSec: pauseTotalSecRef.current + extraPauseSec,
      leftAppCount: leftAppCountRef.current + (extraLeftAppSec > 0 ? 1 : 0),
      leftAppTotalSec: leftAppTotalSecRef.current + extraLeftAppSec,
      taskId: taskIdRef.current,
    };
  }, []);

  const setTaskId = useCallback((id: string | null) => {
    taskIdRef.current = id;
  }, []);

  const progress = secs / durationSeconds; // 1 → 0
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
    getSnapshot,
    setTaskId,
  };
}
