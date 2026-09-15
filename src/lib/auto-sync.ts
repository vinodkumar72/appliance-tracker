import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';

import { countPendingChanges, useAppStore } from './store';
import { supabase } from './supabase';
import { syncNow } from './sync';

/** Don't re-fire event-based auto-sync more often than this (manual Sync now is unaffected). */
const MIN_INTERVAL_MS = 15_000;
/** How long after the last local change before it auto-uploads. */
const CHANGE_DEBOUNCE_MS = 4_000;

/** While the app is open, also pull remote changes this often. */
const PERIODIC_SYNC_MS = 60_000;

/**
 * Background auto-sync triggers, mounted once for the whole app:
 * - a local change being made (debounced — a burst of edits = one sync)
 * - connectivity returning (offline → online)
 * - the app coming back to the foreground
 * - a periodic refresh while the app sits open (picks up other devices' changes)
 * Each fires only when signed in; syncNow() itself prevents overlapping runs.
 */
export function useAutoSync() {
  const lastRun = useRef(0);

  useEffect(() => {
    const trySync = async () => {
      const now = Date.now();
      if (now - lastRun.current < MIN_INTERVAL_MS) return;
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      lastRun.current = now;
      syncNow().catch(() => {});
    };

    // Reconnect trigger.
    let unsubscribeNet: (() => void) | undefined;
    if (Platform.OS === 'web') {
      const onOnline = () => void trySync();
      window.addEventListener('online', onOnline);
      unsubscribeNet = () => window.removeEventListener('online', onOnline);
    } else {
      let wasConnected: boolean | null = null;
      unsubscribeNet = NetInfo.addEventListener((state) => {
        const connected = !!state.isConnected && state.isInternetReachable !== false;
        // Only the offline → online transition triggers a sync (the initial
        // event and repeated online reports do not).
        if (connected && wasConnected === false) void trySync();
        wasConnected = connected;
      });
    }

    // Foreground trigger (phone unlocked / app switched back to).
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') void trySync();
    });

    // Change trigger: any store update schedules a sync a few seconds out,
    // but it only actually runs when something is pending — a completed
    // sync's own state update therefore never re-triggers (pending is 0),
    // and a failed sync doesn't loop (failures change no state).
    let changeTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribeStore = useAppStore.subscribe(() => {
      if (changeTimer) clearTimeout(changeTimer);
      changeTimer = setTimeout(async () => {
        if (countPendingChanges(useAppStore.getState()) === 0) return;
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        lastRun.current = Date.now();
        syncNow().catch(() => {});
      }, CHANGE_DEBOUNCE_MS);
    });

    // Periodic refresh: an open, idle app still learns about changes made on
    // other devices (the browser sees the phone's new repair within a minute).
    const interval = setInterval(() => void trySync(), PERIODIC_SYNC_MS);

    return () => {
      unsubscribeNet?.();
      appStateSub.remove();
      unsubscribeStore();
      if (changeTimer) clearTimeout(changeTimer);
      clearInterval(interval);
    };
  }, []);
}
