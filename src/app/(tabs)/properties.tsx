import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, EmptyState, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { can } from '@/lib/permissions';
import { getSchedulesWithDue, useOrgData, useSessionInfo } from '@/lib/store';

export default function PropertiesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { properties, appliances, schedules } = useOrgData();
  const { role, isPropertyScoped } = useSessionInfo();
  // Property-scoped members can't create properties — a new one would be outside their grant.
  const canEdit = can(role, 'editProperties') && !isPropertyScoped;

  const tasks = getSchedulesWithDue({ schedules, appliances, properties });

  if (properties.length === 0) {
    return (
      <Screen>
        <EmptyState
          emoji="🏘️"
          title="No properties yet"
          message="Add a rental property to start tracking its appliances.">
          {canEdit ? <Button title="Add property" onPress={() => router.push('/property-form')} /> : null}
        </EmptyState>
      </Screen>
    );
  }

  return (
    <Screen>
      {canEdit ? <Button title="+ Add property" onPress={() => router.push('/property-form')} /> : null}
      {properties.map((p) => {
        const applianceCount = appliances.filter((a) => a.propertyId === p.id).length;
        const overdueCount = tasks.filter((t) => t.propertyId === p.id && t.daysUntilDue < 0).length;
        return (
          <Pressable
            key={p.id}
            onPress={() => router.push(`/property/${p.id}`)}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
            ]}>
            <View style={styles.info}>
              <Text style={[styles.name, { color: theme.text }]}>{p.name}</Text>
              <Text style={[styles.address, { color: theme.textSecondary }]}>{p.address}</Text>
              <View style={styles.badges}>
                <Badge label={`${applianceCount} appliance${applianceCount === 1 ? '' : 's'}`} />
                {overdueCount > 0 ? (
                  <Badge label={`${overdueCount} overdue task${overdueCount === 1 ? '' : 's'}`} tone="danger" />
                ) : null}
              </View>
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 20 }}>›</Text>
          </Pressable>
        );
      })}
    </Screen>
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
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  address: {
    fontSize: 14,
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 2,
  },
});
