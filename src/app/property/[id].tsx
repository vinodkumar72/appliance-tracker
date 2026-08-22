import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ApplianceRow } from '@/components/appliance-row';
import { OwnerCard } from '@/components/owner-card';
import { Badge, Button, Card, EmptyState, Screen, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { can } from '@/lib/permissions';
import { getSchedulesWithDue, useAppStore, useOrgData, useSessionInfo } from '@/lib/store';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const router = useRouter();
  const { properties, units, appliances, schedules } = useOrgData();
  const { role } = useSessionInfo();
  const canEdit = can(role, 'editProperties');
  const deleteProperty = useAppStore((s) => s.deleteProperty);

  const property = properties.find((p) => p.id === id);
  if (!property) {
    return (
      <Screen>
        <EmptyState emoji="🤔" title="Property not found" message="It may have been deleted." />
      </Screen>
    );
  }

  const propertyUnits = units.filter((u) => u.propertyId === property.id);
  const propertyAppliances = appliances.filter((a) => a.propertyId === property.id);
  const hasUnits = propertyUnits.length > 0;
  const commonAppliances = hasUnits
    ? propertyAppliances.filter((a) => !a.unitId)
    : propertyAppliances;
  const tasks = getSchedulesWithDue({ schedules, appliances, properties, units });
  const overdueByAppliance = (applianceId: string) =>
    tasks.filter((t) => t.applianceId === applianceId && t.daysUntilDue < 0).length;

  return (
    <Screen>
      <Stack.Screen options={{ title: property.name }} />
      <Card>
        <Text style={[styles.address, { color: theme.text }]}>{property.address}</Text>
        {property.notes ? (
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{property.notes}</Text>
        ) : null}
        {hasUnits ? (
          <View style={{ flexDirection: 'row' }}>
            <Badge label={`${propertyUnits.length} units`} tone="tint" />
          </View>
        ) : null}
        {canEdit ? (
          <View style={styles.actionRow}>
            <Button
              title="Edit"
              variant="secondary"
              compact
              onPress={() => router.push(`/property-form?id=${property.id}`)}
            />
            <Button
              title="Delete"
              variant="danger"
              compact
              onPress={() =>
                confirmDestructive(
                  'Delete property?',
                  `"${property.name}" and all of its units, appliances, logs, and schedules will be removed.`,
                  () => {
                    deleteProperty(property.id);
                    router.back();
                  },
                )
              }
            />
          </View>
        ) : null}
      </Card>

      <OwnerCard contact={property} title={hasUnits ? 'Building owner' : 'Owner'} />

      {hasUnits || canEdit ? (
        <>
          <SectionHeader
            title={`Units (${propertyUnits.length})`}
            right={
              canEdit ? (
                <Button
                  title="+ Add unit"
                  compact
                  onPress={() => router.push(`/unit-form?propertyId=${property.id}`)}
                />
              ) : undefined
            }
          />
          {propertyUnits.length === 0 ? (
            <Card>
              <Text style={{ color: theme.textSecondary }}>
                Single-unit property. For an apartment building or duplex, add units — each unit
                gets its own page with its own appliances.
              </Text>
            </Card>
          ) : (
            propertyUnits.map((u) => {
              const count = propertyAppliances.filter((a) => a.unitId === u.id).length;
              const unitOverdue = tasks.filter(
                (t) =>
                  t.daysUntilDue < 0 &&
                  propertyAppliances.some((a) => a.id === t.applianceId && a.unitId === u.id),
              ).length;
              return (
                <Pressable
                  key={u.id}
                  onPress={() => router.push(`/unit/${u.id}`)}
                  style={({ pressed }) => [
                    styles.unitRow,
                    {
                      backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
                    },
                  ]}>
                  <Text style={styles.unitEmoji}>🚪</Text>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>
                      {u.name}
                    </Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                      {count} appliance{count === 1 ? '' : 's'}
                      {u.ownerName ? ` · 👤 ${u.ownerName}` : ''}
                      {u.notes ? ` · ${u.notes}` : ''}
                    </Text>
                    {unitOverdue > 0 ? (
                      <View style={{ flexDirection: 'row', marginTop: 2 }}>
                        <Badge label={`${unitOverdue} overdue`} tone="danger" />
                      </View>
                    ) : null}
                  </View>
                  <Text style={{ color: theme.textSecondary, fontSize: 20 }}>›</Text>
                </Pressable>
              );
            })
          )}
        </>
      ) : null}

      <SectionHeader
        title={
          hasUnits
            ? `Building / common (${commonAppliances.length})`
            : `Appliances (${commonAppliances.length})`
        }
        right={
          canEdit ? (
            <Button
              title="+ Add"
              compact
              onPress={() => router.push(`/appliance-form?propertyId=${property.id}`)}
            />
          ) : undefined
        }
      />
      {commonAppliances.length === 0 ? (
        <Card>
          <Text style={{ color: theme.textSecondary }}>
            {hasUnits
              ? 'No shared building appliances (like a central HVAC or building water heater). Unit appliances live on each unit’s page.'
              : 'No appliances yet. Add one to start tracking maintenance and warranties.'}
          </Text>
        </Card>
      ) : (
        commonAppliances.map((a) => (
          <ApplianceRow key={a.id} appliance={a} overdueCount={overdueByAppliance(a.id)} />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  address: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  unitRow: {
    borderRadius: 12,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  unitEmoji: {
    fontSize: 26,
  },
});
