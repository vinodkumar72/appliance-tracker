import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, EmptyState, Screen, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { addMonths, daysUntil, duePhrase, formatDate, yearsSince } from '@/lib/dates';
import { APPLIANCE_TYPES } from '@/lib/defaults';
import { can } from '@/lib/permissions';
import { useAppStore, useOrgData, useSessionInfo } from '@/lib/store';
import type { LogType } from '@/lib/types';

const LOG_TONE: Record<LogType, 'danger' | 'tint' | 'neutral' | 'warning'> = {
  repair: 'danger',
  maintenance: 'tint',
  inspection: 'neutral',
  replacement: 'warning',
};

export default function ApplianceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { properties, units, appliances, logs, schedules } = useOrgData();
  const { role } = useSessionInfo();
  const canEdit = can(role, 'editProperties');
  const canLog = can(role, 'logMaintenance');
  const markScheduleDone = useAppStore((s) => s.markScheduleDone);
  const deleteAppliance = useAppStore((s) => s.deleteAppliance);
  const deleteLog = useAppStore((s) => s.deleteLog);

  const appliance = appliances.find((a) => a.id === id);
  if (!appliance) {
    return (
      <Screen>
        <EmptyState emoji="🤔" title="Appliance not found" message="It may have been deleted." />
      </Screen>
    );
  }

  const typeInfo = APPLIANCE_TYPES[appliance.type];
  const property = properties.find((p) => p.id === appliance.propertyId);
  const unit = appliance.unitId ? units.find((u) => u.id === appliance.unitId) : undefined;
  const applianceLogs = logs
    .filter((l) => l.applianceId === appliance.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  const applianceSchedules = schedules
    .filter((s) => s.applianceId === appliance.id)
    .map((s) => {
      const nextDue = addMonths(s.lastDone, s.intervalMonths);
      return { ...s, nextDue, daysUntilDue: daysUntil(nextDue) };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const totalCost = applianceLogs.reduce((sum, l) => sum + (l.cost ?? 0), 0);
  const age = appliance.purchaseDate ? yearsSince(appliance.purchaseDate) : null;
  const lifeFraction = age !== null ? age / typeInfo.lifespanYears : null;
  const warrantyDays = appliance.warrantyExpiry ? daysUntil(appliance.warrantyExpiry) : null;

  return (
    <Screen>
      <Stack.Screen options={{ title: appliance.name }} />

      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.emoji}>{typeInfo.emoji}</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.name, { color: theme.text }]}>{appliance.name}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
              {typeInfo.label}
              {property ? ` · ${property.name}` : ''}
              {unit ? ` · ${unit.name}` : ''}
            </Text>
          </View>
        </View>
        {[
          appliance.brand ? ['Brand', appliance.brand] : null,
          appliance.model ? ['Model', appliance.model] : null,
          appliance.serialNumber ? ['Serial #', appliance.serialNumber] : null,
          appliance.purchaseDate ? ['Purchased', formatDate(appliance.purchaseDate)] : null,
          appliance.purchasePrice != null
            ? ['Purchase price', `$${appliance.purchasePrice.toFixed(2)}`]
            : null,
        ]
          .filter((x): x is [string, string] => x !== null)
          .map(([label, value]) => (
            <View key={label} style={styles.detailRow}>
              <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{label}</Text>
              <Text style={{ color: theme.text, fontSize: 14, fontWeight: '600' }}>{value}</Text>
            </View>
          ))}
        {appliance.notes ? (
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{appliance.notes}</Text>
        ) : null}
        {canEdit ? (
          <View style={styles.actionRow}>
            <Button
              title="Edit"
              variant="secondary"
              compact
              onPress={() => router.push(`/appliance-form?id=${appliance.id}`)}
            />
            <Button
              title="Delete"
              variant="danger"
              compact
              onPress={() =>
                confirmDestructive(
                  'Delete appliance?',
                  `"${appliance.name}" and its logs and schedules will be removed.`,
                  () => {
                    deleteAppliance(appliance.id);
                    router.back();
                  },
                )
              }
            />
          </View>
        ) : null}
      </Card>

      {age !== null && lifeFraction !== null ? (
        <Card>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Lifespan</Text>
          <View style={[styles.lifeBarTrack, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.lifeBarFill,
                {
                  width: `${Math.min(100, Math.round(lifeFraction * 100))}%`,
                  backgroundColor:
                    lifeFraction >= 1 ? theme.danger : lifeFraction >= 0.8 ? theme.warning : theme.success,
                },
              ]}
            />
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
            {age.toFixed(1)} years old · typical lifespan ~{typeInfo.lifespanYears} years.{' '}
            {lifeFraction >= 1
              ? 'Past its typical lifespan — budget for a replacement.'
              : lifeFraction >= 0.8
                ? 'Nearing end of typical lifespan — start planning a replacement.'
                : 'Plenty of life left.'}
          </Text>
        </Card>
      ) : null}

      <Card>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Warranty</Text>
        {warrantyDays === null ? (
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>No warranty on file.</Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row' }}>
              <Badge
                label={
                  warrantyDays < 0
                    ? `expired ${formatDate(appliance.warrantyExpiry!)}`
                    : `active — expires ${formatDate(appliance.warrantyExpiry!)} (${warrantyDays} days)`
                }
                tone={warrantyDays < 0 ? 'danger' : warrantyDays <= 90 ? 'warning' : 'success'}
              />
            </View>
            {appliance.warrantyProvider ? (
              <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                {appliance.warrantyProvider}
              </Text>
            ) : null}
          </>
        )}
      </Card>

      <SectionHeader
        title="Maintenance schedules"
        right={
          canEdit ? (
            <Button
              title="+ Add"
              compact
              onPress={() => router.push(`/schedule-form?applianceId=${appliance.id}`)}
            />
          ) : undefined
        }
      />
      {applianceSchedules.length === 0 ? (
        <Card>
          <Text style={{ color: theme.textSecondary }}>
            No recurring maintenance set up for this appliance.
          </Text>
        </Card>
      ) : (
        applianceSchedules.map((s) => (
          <Card key={s.id}>
            <View style={styles.scheduleRow}>
              <View style={{ flex: 1, gap: 3 }}>
                <Text
                  style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}
                  onPress={canEdit ? () => router.push(`/schedule-form?id=${s.id}`) : undefined}>
                  {s.title}
                </Text>
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  Every {s.intervalMonths} month{s.intervalMonths === 1 ? '' : 's'} · last done{' '}
                  {formatDate(s.lastDone)}
                </Text>
                <View style={{ flexDirection: 'row' }}>
                  <Badge
                    label={duePhrase(s.daysUntilDue)}
                    tone={s.daysUntilDue < 0 ? 'danger' : s.daysUntilDue <= 30 ? 'warning' : 'neutral'}
                  />
                </View>
              </View>
              {canLog ? (
                <Button title="Mark done" variant="secondary" compact onPress={() => markScheduleDone(s.id)} />
              ) : null}
            </View>
          </Card>
        ))
      )}

      <SectionHeader
        title={`History${totalCost > 0 ? ` · $${totalCost.toFixed(0)} total` : ''}`}
        right={
          canLog ? (
            <Button
              title="+ Log"
              compact
              onPress={() => router.push(`/log-form?applianceId=${appliance.id}`)}
            />
          ) : undefined
        }
      />
      {applianceLogs.length === 0 ? (
        <Card>
          <Text style={{ color: theme.textSecondary }}>No repairs or maintenance logged yet.</Text>
        </Card>
      ) : (
        applianceLogs.map((l) => (
          <Card key={l.id}>
            <View style={styles.logHeader}>
              <Badge label={l.type} tone={LOG_TONE[l.type]} />
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{formatDate(l.date)}</Text>
            </View>
            <Text style={{ color: theme.text, fontSize: 15 }}>{l.description}</Text>
            <View style={styles.logFooter}>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                {[l.cost != null && l.cost > 0 ? `$${l.cost.toFixed(2)}` : null, l.vendor]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              {canEdit ? (
                <Text
                  style={{ color: theme.danger, fontSize: 13, fontWeight: '600' }}
                  onPress={() =>
                    confirmDestructive('Delete log entry?', l.description, () => deleteLog(l.id))
                  }>
                  Delete
                </Text>
              ) : null}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  emoji: {
    fontSize: 36,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  lifeBarTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  lifeBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
