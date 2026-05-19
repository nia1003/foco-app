// ─────────────────────────────────────────────
// useApiCall — 10 秒 cooldown 防呆 + loading 狀態
//
// 用法：
//   const { call, loading, blocked, cooldown } = useApiCall(async () => { ... });
//
// blocked = true → 10s 內已呼叫過，按鈕禁用
// cooldown       → 剩餘秒數（可顯示在按鈕上）
// loading        → async fn 執行中
// ─────────────────────────────────────────────
import { useCallback, useEffect, useRef, useState } from 'react';

const COOLDOWN_MS = 10_000;

export function useApiCall<T extends unknown[]>(fn: (...args: T) => Promise<void>) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const lastCalledAt = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const call = useCallback(async (...args: T) => {
    if (Date.now() - lastCalledAt.current < COOLDOWN_MS) return;

    lastCalledAt.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);
    setCooldown(Math.ceil(COOLDOWN_MS / 1000));
    timerRef.current = setInterval(() => {
      const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastCalledAt.current)) / 1000);
      if (remaining <= 0) {
        setCooldown(0);
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      } else {
        setCooldown(remaining);
      }
    }, 1000);

    setLoading(true);
    try {
      await fnRef.current(...args);
    } finally {
      setLoading(false);
    }
  }, []);

  return { call, loading, blocked: cooldown > 0, cooldown };
}
