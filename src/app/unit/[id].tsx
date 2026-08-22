import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ApplianceRow } from '@/components/appliance-row';
import { OwnerCard } from '@/components/owner-card';
import { Button, Card, EmptyState, Screen, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { can } from '@/lib/permissions';
import { getSchedulesWithDue, useOrgData, useSessionInfo } from '@/lib/store';

export default function UnitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { properties, units, appliances, schedules } = useOrgData();
  const { role } = useSessionInfo();
  const canEdit = can(role, 'editProperties');

  const unit = units.find((u) => u.id === id);
  if (!unit) {
    return (
      <Screen>
        <EmptyState emoji="🤔" title="Unit not found" message="It may have been deleted." />
      </Screen>
    );
  }

  const property = properties.find((p) => p.id === unit.propertyId);
  const unitAppliances = appliances.filter((a) => a.unitId === unit.id);
  const tasks = getSchedulesWithDue({ schedules, appliances, properties, units });
  const overdueByAppliance = (applianceId: string) =>
    tasks.filter((t) => t.applianceId === applianceId && t.daysUntilDue < 0).length;

  return (
    <Screen>
      <Stack.Screen options={{ title: unit.name }} />
      <Card>
        <View style={styles.headerRow}>
          <Text style={styles.emoji}>🚪</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.name, { color: theme.text }]}>{unit.name}</Text>
            {property ? (
              <Text
                style={{ color: theme.textSecondary, fontSize: 14 }}
                onPress={() => router.push(`/property/${property.id}`)}>
                {property.name} · {property.address}
              </Text>
            ) : null}
          </View>
        </View>
        {unit.notes ? (
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{unit.notes}</Text>
        ) : null}
        {canEdit ? (
          <View style={styles.actionRow}>
            <Button
              title="Edit unit"
              variant="secondary"
              compact
              onPress={() => router.push(`/unit-form?id=${unit.id}`)}
            />
          </View>
        ) : null}
      </Card>

      <OwnerCard contact={unit} title="Unit owner" />

      <SectionHeader
        title={`Appliances (${unitAppliances.length})`}
        right={
          canEdit ? (
            <Button
              title="+ Add"
              compact
              onPress={() =>
                router.push(`/appliance-form?propertyId=${unit.propertyId}&unitId=${unit.id}`)
              }
            />
          ) : undefined
        }
      />
      {unitAppliances.length === 0 ? (
        <Card>
          <Text style={{ color: theme.textSecondary }}>
            No appliances in this unit yet.
            {canEdit ? ' Tap "+ Add" to add its first appliance.' : ''}
          </Text>
        </Card>
      ) : (
        unitAppliances.map((a) => (
          <ApplianceRow key={a.id} appliance={a} overdueCount={overdueByAppliance(a.id)} />
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
    fontSize: 32,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
