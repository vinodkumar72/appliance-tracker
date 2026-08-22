import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysUntil } from '@/lib/dates';
import { APPLIANCE_TYPES } from '@/lib/defaults';
import type { Appliance } from '@/lib/types';

export function ApplianceRow({
  appliance,
  overdueCount,
}: {
  appliance: Appliance;
  overdueCount: number;
}) {
  const theme = useTheme();
  const router = useRouter();
  const typeInfo = APPLIANCE_TYPES[appliance.type];
  const warrantyDays = appliance.warrantyExpiry ? daysUntil(appliance.warrantyExpiry) : null;

  return (
    <Pressable
      onPress={() => router.push(`/appliance/${appliance.id}`)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
      ]}>
      <Text style={styles.emoji}>{typeInfo.emoji}</Text>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]}>{appliance.name}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
          {[appliance.brand, appliance.model].filter(Boolean).join(' ') || typeInfo.label}
        </Text>
        <View style={styles.badges}>
          {overdueCount > 0 ? <Badge label={`${overdueCount} overdue`} tone="danger" /> : null}
          {warrantyDays !== null ? (
            warrantyDays < 0 ? (
              <Badge label="warranty expired" tone="neutral" />
            ) : warrantyDays <= 90 ? (
              <Badge label="warranty expiring" tone="warning" />
            ) : (
              <Badge label="under warranty" tone="success" />
            )
          ) : null}
        </View>
      </View>
      <Text style={{ color: theme.textSecondary, fontSize: 20 }}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  emoji: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
});
