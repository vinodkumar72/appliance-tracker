import { Alert, Platform } from 'react-native';

/**
 * Cross-platform destructive-action confirm (Alert is a no-op on web).
 * `confirmLabel` names the native confirm button. It defaults to "Delete",
 * so pass the real verb for anything else ("Sign out", "Remove", "Reset").
 */
export function confirmDestructive(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'Delete',
) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: confirmLabel, style: 'destructive', onPress: onConfirm },
    ]);
  }
}
