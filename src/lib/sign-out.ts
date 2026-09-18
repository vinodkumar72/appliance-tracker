import { Alert, Platform } from 'react-native';

import { countPendingChanges, useAppStore } from './store';
import { supabase } from './supabase';
import { syncNow } from './sync';

/**
 * Sign out leaving the device clean. Outstanding changes get one last sync;
 * if everything is uploaded, local data is cleared (it all lives on the
 * server, so nothing is lost and the next account starts fresh). Only when
 * changes can't be uploaded does it ask: sign out keeping them on-device
 * (they upload when the SAME account signs back in), or stay signed in.
 *
 * Returns a status message to show, or '' if the user cancelled.
 */
export async function signOutClean(): Promise<string> {
  let pendingCount = countPendingChanges(useAppStore.getState());
  if (pendingCount > 0) {
    await syncNow().catch(() => {});
    pendingCount = countPendingChanges(useAppStore.getState());
  }

  if (pendingCount === 0) {
    await supabase.auth.signOut();
    useAppStore.getState().resetAll();
    useAppStore.setState({ demoMode: false });
    return 'Signed out. Everything was synced, so this device was cleared.';
  }

  const proceed = await confirmAsync(
    'Sign out with unsynced changes?',
    `${pendingCount} change${pendingCount === 1 ? '' : 's'} couldn't be uploaded. ` +
      'They stay on this device and upload when you sign back in with the same account ' +
      '(a different account will start clean instead). Sign out anyway?',
  );
  if (!proceed) return '';
  await supabase.auth.signOut();
  useAppStore.setState({ demoMode: false });
  return 'Signed out. Unsynced changes stay on this device until you sign in again.';
}

function confirmAsync(title: string, message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Sign out', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
