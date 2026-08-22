import { Linking, StyleSheet, Text } from 'react-native';

import { Card } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import type { OwnerContact } from '@/lib/types';

/** Owner/investor contact card with tap-to-call and tap-to-email. Renders nothing when empty. */
export function OwnerCard({ contact, title = 'Owner' }: { contact: OwnerContact; title?: string }) {
  const theme = useTheme();
  const { ownerName, ownerPhone, ownerEmail, ownerMailingAddress } = contact;
  if (!ownerName && !ownerPhone && !ownerEmail && !ownerMailingAddress) return null;

  return (
    <Card>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {ownerName ? (
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{ownerName}</Text>
      ) : null}
      {ownerPhone ? (
        <Text
          style={{ color: theme.tint, fontSize: 14 }}
          onPress={() => Linking.openURL(`tel:${ownerPhone.replace(/[^+\d]/g, '')}`)}>
          📞 {ownerPhone}
        </Text>
      ) : null}
      {ownerEmail ? (
        <Text
          style={{ color: theme.tint, fontSize: 14 }}
          onPress={() => Linking.openURL(`mailto:${ownerEmail}`)}>
          ✉️ {ownerEmail}
        </Text>
      ) : null}
      {ownerMailingAddress ? (
        <Text style={{ color: theme.textSecondary, fontSize: 14 }}>📬 {ownerMailingAddress}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
});
