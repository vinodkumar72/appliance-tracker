import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, EmptyState, Screen, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { can, ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/permissions';
import { useAppStore, usePendingChanges, useSessionInfo } from '@/lib/store';

export default function OrganizationScreen() {
  const theme = useTheme();
  const router = useRouter();
  const organizations = useAppStore((s) => s.organizations);
  const users = useAppStore((s) => s.users);
  const memberships = useAppStore((s) => s.memberships);
  const properties = useAppStore((s) => s.properties);
  const units = useAppStore((s) => s.units);
  const switchOrganization = useAppStore((s) => s.switchOrganization);
  const switchUser = useAppStore((s) => s.switchUser);
  const loadSampleData = useAppStore((s) => s.loadSampleData);
  const resetAll = useAppStore((s) => s.resetAll);
  const claimPlatformOwnership = useAppStore((s) => s.claimPlatformOwnership);
  const {
    currentOrg,
    currentUser,
    membership: currentMembership,
    role,
    isPlatformAdmin,
  } = useSessionInfo();

  const platformAdmin = users.find((u) => u.isPlatformAdmin);
  const canManageMembers = can(role, 'manageUsers') || isPlatformAdmin;
  const pendingChanges = usePendingChanges();
  const lastSyncAt = useAppStore((s) => s.lastSyncAt);

  if (!currentOrg) {
    return (
      <Screen>
        <EmptyState
          emoji="🏢"
          title={users.length === 0 ? 'Welcome, platform owner' : 'No company selected'}
          message={
            users.length === 0
              ? 'Set up your operator account, then onboard property management companies onto the platform.'
              : isPlatformAdmin
                ? 'Onboard your first company to get started.'
                : 'Ask the platform owner to onboard your company.'
          }>
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

  // The platform owner sees every company; everyone else only theirs.
  const visibleOrgs = isPlatformAdmin
    ? organizations
    : organizations.filter((o) =>
        memberships.some((m) => m.orgId === o.id && m.userId === currentUser?.id),
      );

  const orgMembers = memberships
    .filter((m) => m.orgId === currentOrg.id)
    .map((m) => ({ membership: m, user: users.find((u) => u.id === m.userId) }))
    .filter((x) => x.user);

  return (
    <Screen>
      <SectionHeader
        title={isPlatformAdmin ? `Companies (${visibleOrgs.length})` : 'Company'}
        right={
          can(role, 'manageOrg') || isPlatformAdmin ? (
            <Button
              title="Rename"
              variant="secondary"
              compact
              onPress={() => router.push(`/org-form?id=${currentOrg.id}`)}
            />
          ) : undefined
        }
      />
      {visibleOrgs.map((org) => {
        const selected = org.id === currentOrg.id;
        const memberCount = memberships.filter((m) => m.orgId === org.id).length;
        const propertyCount = properties.filter((p) => p.orgId === org.id).length;
        return (
          <Pressable
            key={org.id}
            onPress={() => switchOrganization(org.id)}
            style={({ pressed }) => [
              styles.orgRow,
              {
                backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
                borderColor: selected ? theme.tint : 'transparent',
              },
            ]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>{org.name}</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                {propertyCount} propert{propertyCount === 1 ? 'y' : 'ies'} · {memberCount} member
                {memberCount === 1 ? '' : 's'}
              </Text>
            </View>
            {selected ? <Badge label="current" tone="tint" /> : null}
          </Pressable>
        );
      })}
      {isPlatformAdmin ? (
        <Button title="+ Onboard company" onPress={() => router.push('/org-form')} />
      ) : null}

      <SectionHeader title="Signed in as" />
      <Card>
        <View style={styles.actingRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>
              {currentUser?.name ?? 'Nobody'}
            </Text>
            {currentUser?.email ? (
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{currentUser.email}</Text>
            ) : null}
          </View>
          {isPlatformAdmin ? (
            <Badge label="Platform owner" tone="success" />
          ) : role ? (
            <Badge label={ROLE_LABELS[role]} tone="tint" />
          ) : (
            <Badge label="not a member" tone="warning" />
          )}
        </View>
        {isPlatformAdmin ? (
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
            Software operator — onboards companies and has oversight of all of them.
          </Text>
        ) : role ? (
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{ROLE_DESCRIPTIONS[role]}</Text>
        ) : null}
        {currentMembership?.propertyIds || currentMembership?.unitIds ? (
          <Text style={{ color: theme.warning, fontSize: 13 }}>
            Access limited to:{' '}
            {[
              ...(currentMembership.propertyIds ?? []).map(
                (pid) => properties.find((p) => p.id === pid)?.name,
              ),
              ...(currentMembership.unitIds ?? []).map((unitId) => {
                const unit = units.find((u) => u.id === unitId);
                if (!unit) return undefined;
                const parent = properties.find((p) => p.id === unit.propertyId);
                return parent ? `${parent.name} — ${unit.name}` : unit.name;
              }),
            ]
              .filter(Boolean)
              .join(', ')}
          </Text>
        ) : null}
        <Text style={{ color: theme.textSecondary, fontSize: 12, fontStyle: 'italic' }}>
          Demo mode: tap "Act as" on any member below to preview the app with their permissions.
          With a real backend this becomes your login.
        </Text>
        {platformAdmin && !isPlatformAdmin ? (
          <Button
            title="Switch back to platform owner"
            variant="secondary"
            compact
            onPress={() => switchUser(platformAdmin.id)}
          />
        ) : null}
        {!platformAdmin && currentUser ? (
          <Button
            title="Claim platform ownership"
            variant="secondary"
            compact
            onPress={claimPlatformOwnership}
          />
        ) : null}
      </Card>

      <SectionHeader
        title={`Members (${orgMembers.length})`}
        right={
          canManageMembers ? (
            <Button title="+ Add" compact onPress={() => router.push('/member-form')} />
          ) : undefined
        }
      />
      {orgMembers.map(({ membership, user }) => (
        <Card key={membership.id}>
          <View style={styles.memberRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{user!.name}</Text>
              {user!.email ? (
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{user!.email}</Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                <Badge label={ROLE_LABELS[membership.role]} />
                {membership.propertyIds || membership.unitIds ? (
                  <Badge
                    label={[
                      membership.propertyIds?.length
                        ? `${membership.propertyIds.length} propert${membership.propertyIds.length === 1 ? 'y' : 'ies'}`
                        : null,
                      membership.unitIds?.length
                        ? `${membership.unitIds.length} unit${membership.unitIds.length === 1 ? '' : 's'}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' + ')}
                    tone="warning"
                  />
                ) : null}
              </View>
            </View>
            <View style={styles.memberActions}>
              {user!.id !== currentUser?.id ? (
                <Button title="Act as" variant="secondary" compact onPress={() => switchUser(user!.id)} />
              ) : null}
              {canManageMembers ? (
                <Button
                  title="Manage"
                  variant="secondary"
                  compact
                  onPress={() => router.push(`/member-form?id=${membership.id}`)}
                />
              ) : null}
            </View>
          </View>
        </Card>
      ))}

      <SectionHeader title="Sync" />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <Badge label="offline-first" tone="success" />
          {pendingChanges > 0 ? (
            <Badge label={`${pendingChanges} change${pendingChanges === 1 ? '' : 's'} pending`} tone="warning" />
          ) : (
            <Badge label="nothing pending" />
          )}
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
          Every change is saved on this device instantly — the app works fully without internet.
          {lastSyncAt
            ? ` Last synced ${new Date(lastSyncAt).toLocaleString()}.`
            : ' Sign in to back up and sync across devices.'}
        </Text>
        <Button
          title="Account & sync"
          variant="secondary"
          compact
          onPress={() => router.push('/account')}
        />
      </Card>

      <SectionHeader title="Demo data" />
      <Card>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
          Wipe everything on this device and start fresh — useful for reloading the latest sample
          data.
        </Text>
        <Button
          title="Reset all data"
          variant="danger"
          compact
          onPress={() =>
            confirmDestructive(
              'Reset all data?',
              'All companies, properties, and history on this device will be erased.',
              resetAll,
            )
          }
        />
      </Card>
    </Screen>
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
  orgRow: {
    borderRadius: 12,
    borderWidth: 2,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  memberActions: {
    gap: 6,
    alignItems: 'flex-end',
  },
});
