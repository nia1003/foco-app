// ─────────────────────────────────────────────
// useNotifications — expo-notifications 排程/取消
// ─────────────────────────────────────────────
import { useRef, useCallback, useEffect } from 'react';
import * as Notifications from 'expo-notifications';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function useNotifications() {
  const notifIdRef = useRef<string | null>(null);

  // Request permissions on mount
  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => {});
  }, []);

  /** Schedule a timer-complete notification `seconds` from now */
  const scheduleTimerEnd = useCallback(async (seconds: number) => {
    try {
      // Cancel any existing
      if (notifIdRef.current) {
        await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
      }
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Focus session complete!',
          body: 'Your pet is proud of you. Come claim your reward!',
          sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.max(1, seconds) },
      });
      notifIdRef.current = id;
    } catch {
      // Notifications not granted — silently ignore
    }
  }, []);

  /** Cancel the currently scheduled timer notification */
  const cancelTimerNotif = useCallback(async () => {
    if (notifIdRef.current) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
      } catch {}
      notifIdRef.current = null;
    }
  }, []);

  return { scheduleTimerEnd, cancelTimerNotif };
}
