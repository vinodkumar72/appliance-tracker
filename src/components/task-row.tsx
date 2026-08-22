import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, BadgeTone, Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { duePhrase, formatDate } from '@/lib/dates';
import { can } from '@/lib/permissions';
import { useAppStore, useSessionInfo } from '@/lib/store';
import type { ScheduleWithDue } from '@/lib/types';

export function dueTone(daysUntilDue: number): BadgeTone {
  if (daysUntilDue < 0) return 'danger';
  if (daysUntilDue <= 30) return 'warning';
  return 'neutral';
}

export function TaskRow({ task, showMarkDone }: { task: ScheduleWithDue; showMarkDone?: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  const markScheduleDone = useAppStore((s) => s.markScheduleDone);
  const { role } = useSessionInfo();

  return (
    <Pressable
      onPress={() => router.push(`/appliance/${task.applianceId}`)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
      ]}>
      <View style={styles.info}>
        <Text style={[styles.title, { color: theme.text }]}>{task.title}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {task.applianceName} · {task.propertyName}
          {task.unitName ? ` · ${task.unitName}` : ''}
        </Text>
        <View style={styles.badgeRow}>
          <Badge label={duePhrase(task.daysUntilDue)} tone={dueTone(task.daysUntilDue)} />
          <Text style={[styles.date, { color: theme.textSecondary }]}>{formatDate(task.nextDue)}</Text>
        </View>
      </View>
      {showMarkDone && can(role, 'logMaintenance') ? (
        <Button title="Mark done" variant="secondary" compact onPress={() => markScheduleDone(task.id)} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: 2,
  },
  date: {
    fontSize: 12,
  },
});
