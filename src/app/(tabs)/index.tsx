import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { TaskRow } from '@/components/task-row';
import { Badge, Button, Card, EmptyState, Screen, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { daysUntil, formatDate } from '@/lib/dates';
import { can, ROLE_LABELS } from '@/lib/permissions';
import { getSchedulesWithDue, useAppStore, useOrgData, useSessionInfo } from '@/lib/store';

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const organizations = useAppStore((s) => s.organizations);
  const hydrated = useAppStore((s) => s.hydrated);
  const loadSampleData = useAppStore((s) => s.loadSampleData);
  const { properties, units, appliances, schedules } = useOrgData();
  const { currentOrg, currentUser, role, isPropertyScoped, isPlatformAdmin } = useSessionInfo();
  const users = useAppStore((s) => s.users);

  if (!hydrated) return <Screen>{null}</Screen>;

  if (organizations.length === 0) {
    return (
      <Screen>
        <EmptyState
          emoji="🏠"
          title="Welcome to Appliance Tracker"
          message="Track appliances across all your rental properties — repairs, warranties, and maintenance reminders, with your whole team.">
          <View style={styles.emptyButtons}>
            {users.length === 0 ? (
              <Button title="Set up platform" onPress={() => router.push('/platform-setup')} />
            ) : isPlatformAdmin ? (
              <Button title="Onboard a company" onPress={() => router.push('/org-form')} />
            ) : null}
            <Button title="Load sample data" variant="secondary" onPress={loadSampleData} />
          </View>
        </EmptyState>
      </Screen>
    );
  }

  if (properties.length === 0) {
    return (
      <Screen>
        <OrgHeader orgName={currentOrg?.name} userName={currentUser?.name} roleLabel={role ? ROLE_LABELS[role] : undefined} />
        <EmptyState
          emoji="🏘️"
          title={`No properties in ${currentOrg?.name ?? 'this company'} yet`}
          message="Add the first property to start tracking its appliances.">
          {can(role, 'editProperties') && !isPropertyScoped ? (
            <Button title="Add property" onPress={() => router.push('/property-form')} />
          ) : null}
        </EmptyState>
      </Screen>
    );
  }

  const tasks = getSchedulesWithDue({ schedules, appliances, properties, units });
  const overdue = tasks.filter((t) => t.daysUntilDue < 0);
  const dueSoon = tasks.filter((t) => t.daysUntilDue >= 0 && t.daysUntilDue <= 30);
  const attention = tasks.filter((t) => t.daysUntilDue <= 30).slice(0, 6);

  const warrantyAlerts = appliances
    .filter((a) => a.warrantyExpiry)
    .map((a) => ({ appliance: a, days: daysUntil(a.warrantyExpiry!) }))
    .filter((w) => w.days <= 90)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  return (
    <Screen>
      <OrgHeader
        orgName={currentOrg?.name}
        userName={currentUser?.name}
        roleLabel={role ? ROLE_LABELS[role] : undefined}
      />
      <View style={styles.statRow}>
        <StatCard label="Properties" value={properties.length} />
        <StatCard label="Appliances" value={appliances.length} />
        <StatCard label="Overdue" value={overdue.length} tone={overdue.length ? 'danger' : undefined} />
        <StatCard label="Due in 30 days" value={dueSoon.length} tone={dueSoon.length ? 'warning' : undefined} />
      </View>

      <SectionHeader
        title="Needs attention"
        right={<Button title="All tasks" variant="secondary" compact onPress={() => router.push('/tasks')} />}
      />
      {attention.length === 0 ? (
        <Card>
          <Text style={{ color: theme.textSecondary }}>
            Nothing due in the next 30 days. You're all caught up. 🎉
          </Text>
        </Card>
      ) : (
        attention.map((t) => <TaskRow key={t.id} task={t} showMarkDone />)
      )}

      <SectionHeader title="Warranty alerts" />
      {warrantyAlerts.length === 0 ? (
        <Card>
          <Text style={{ color: theme.textSecondary }}>No warranties expiring in the next 90 days.</Text>
        </Card>
      ) : (
        warrantyAlerts.map(({ appliance, days }) => (
          <Card key={appliance.id}>
            <Text
              style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}
              onPress={() => router.push(`/appliance/${appliance.id}`)}>
              {appliance.name}
            </Text>
            <View style={styles.warrantyRow}>
              <Badge
                label={
                  days < 0
                    ? `warranty expired ${formatDate(appliance.warrantyExpiry!)}`
                    : days === 0
                      ? 'warranty expires today'
                      : `warranty expires in ${days} days (${formatDate(appliance.warrantyExpiry!)})`
                }
                tone={days < 0 ? 'danger' : 'warning'}
              />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

function OrgHeader({
  orgName,
  userName,
  roleLabel,
}: {
  orgName?: string;
  userName?: string;
  roleLabel?: string;
}) {
  const theme = useTheme();
  if (!orgName) return null;
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: theme.text, fontSize: 22, fontWeight: '700' }}>{orgName}</Text>
      {userName ? (
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
          {userName}
          {roleLabel ? ` · ${roleLabel}` : ''}
        </Text>
      ) : null}
    </View>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'danger' | 'warning';
}) {
  const theme = useTheme();
  const valueColor = tone === 'danger' ? theme.danger : tone === 'warning' ? theme.warning : theme.text;
  return (
    <Card style={styles.statCard}>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  emptyButtons: {
    gap: Spacing.two,
    marginTop: Spacing.three,
    alignSelf: 'stretch',
    maxWidth: 320,
    width: '100%',
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 140,
    alignItems: 'flex-start',
    gap: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  warrantyRow: {
    flexDirection: 'row',
  },
});
