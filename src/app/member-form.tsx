import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, ChipPicker, EmptyState, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { assignableRoles, can, ROLE_DESCRIPTIONS, ROLE_LABELS } from '@/lib/permissions';
import { useAppStore, useSessionInfo } from '@/lib/store';
import type { Role } from '@/lib/types';

type AccessScope = 'all' | 'selected';

export default function MemberFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const theme = useTheme();
  const router = useRouter();
  const users = useAppStore((s) => s.users);
  const memberships = useAppStore((s) => s.memberships);
  const allProperties = useAppStore((s) => s.properties);
  const allUnits = useAppStore((s) => s.units);
  const addMember = useAppStore((s) => s.addMember);
  const updateMembership = useAppStore((s) => s.updateMembership);
  const removeMember = useAppStore((s) => s.removeMember);
  const { currentOrg, role: actorRole, isPlatformAdmin } = useSessionInfo();
  // The platform owner can manage any company's members, acting with owner-level authority.
  const effectiveActorRole = isPlatformAdmin ? 'owner' : actorRole;

  const existing = id ? memberships.find((m) => m.id === id) : undefined;
  const existingUser = existing ? users.find((u) => u.id === existing.userId) : undefined;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>(existing?.role ?? 'manager');
  const [scope, setScope] = useState<AccessScope>(
    existing?.propertyIds || existing?.unitIds ? 'selected' : 'all',
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(existing?.propertyIds ?? []);
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(existing?.unitIds ?? []);
  const [errors, setErrors] = useState<{ name?: string; email?: string; scope?: string }>({});

  if ((!can(actorRole, 'manageUsers') && !isPlatformAdmin) || !currentOrg) {
    return (
      <Screen>
        <EmptyState
          emoji="🔒"
          title="No permission"
          message="Only owners and admins can manage members."
        />
      </Screen>
    );
  }

  const orgProperties = allProperties.filter((p) => p.orgId === currentOrg.id);
  const roleOptions = assignableRoles(effectiveActorRole);
  const ownersInOrg = memberships.filter((m) => m.orgId === currentOrg.id && m.role === 'owner');
  const isLastOwner = existing?.role === 'owner' && ownersInOrg.length === 1;
  // Admins may not edit owners at all.
  const canEditTarget = existing
    ? effectiveActorRole === 'owner' || existing.role !== 'owner'
    : true;

  const toggleProperty = (propertyId: string) => {
    const selecting = !selectedIds.includes(propertyId);
    setSelectedIds((ids) =>
      selecting ? [...ids, propertyId] : ids.filter((x) => x !== propertyId),
    );
    if (selecting) {
      // Whole-property access supersedes unit grants within it.
      const propUnitIds = new Set(
        allUnits.filter((u) => u.propertyId === propertyId).map((u) => u.id),
      );
      setSelectedUnitIds((ids) => ids.filter((x) => !propUnitIds.has(x)));
    }
  };

  const toggleUnit = (unitId: string) =>
    setSelectedUnitIds((ids) =>
      ids.includes(unitId) ? ids.filter((x) => x !== unitId) : [...ids, unitId],
    );

  const save = () => {
    const nextErrors: typeof errors = {};
    if (!existing) {
      if (!name.trim()) nextErrors.name = 'Name is required.';
      if (!email.trim()) nextErrors.email = 'Email is required.';
    }
    if (scope === 'selected' && selectedIds.length === 0 && selectedUnitIds.length === 0) {
      nextErrors.scope = 'Select at least one property or unit, or grant access to everything.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const propertyIds = scope === 'selected' && selectedIds.length > 0 ? selectedIds : undefined;
    const unitIds = scope === 'selected' && selectedUnitIds.length > 0 ? selectedUnitIds : undefined;
    if (existing) {
      if (isLastOwner) return; // guarded in UI below
      updateMembership(existing.id, {
        role,
        propertyIds: propertyIds ?? null,
        unitIds: unitIds ?? null,
      });
    } else {
      addMember(name, email, role, propertyIds, unitIds);
    }
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Manage member' : 'Add member' }} />
      {existing ? (
        <View style={{ gap: 2 }}>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>
            {existingUser?.name}
          </Text>
          {existingUser?.email ? (
            <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{existingUser.email}</Text>
          ) : null}
        </View>
      ) : (
        <>
          <FormField
            label="Name *"
            value={name}
            onChangeText={setName}
            placeholder="Full name"
            error={errors.name}
          />
          <FormField
            label="Email *"
            value={email}
            onChangeText={setEmail}
            placeholder="person@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
        </>
      )}

      {canEditTarget && !isLastOwner ? (
        <>
          <ChipPicker
            label="Role"
            value={role}
            onChange={setRole}
            options={roleOptions.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
          />
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{ROLE_DESCRIPTIONS[role]}</Text>

          <ChipPicker
            label="Property access"
            value={scope}
            onChange={setScope}
            options={[
              { value: 'all', label: 'All properties' },
              { value: 'selected', label: 'Specific properties' },
            ]}
          />
          {scope === 'selected' ? (
            <View style={styles.propertyList}>
              {orgProperties.length === 0 ? (
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  No properties in this company yet.
                </Text>
              ) : (
                orgProperties.map((p) => {
                  const selected = selectedIds.includes(p.id);
                  const propUnits = allUnits.filter((u) => u.propertyId === p.id);
                  return (
                    <View key={p.id} style={{ gap: 6 }}>
                      <Pressable
                        onPress={() => toggleProperty(p.id)}
                        style={[
                          styles.propertyChip,
                          {
                            backgroundColor: selected ? theme.tint : theme.backgroundElement,
                            borderColor: selected ? theme.tint : theme.border,
                          },
                        ]}>
                        <Text style={{ color: selected ? theme.onTint : theme.text, fontSize: 14 }}>
                          {selected ? '✓ ' : ''}
                          {p.name}
                          {propUnits.length > 0 ? ' (entire property)' : ''}
                        </Text>
                      </Pressable>
                      {propUnits.length > 0 && !selected ? (
                        <View style={styles.unitChipRow}>
                          {propUnits.map((u) => {
                            const unitSelected = selectedUnitIds.includes(u.id);
                            return (
                              <Pressable
                                key={u.id}
                                onPress={() => toggleUnit(u.id)}
                                style={[
                                  styles.unitChip,
                                  {
                                    backgroundColor: unitSelected
                                      ? theme.tint
                                      : theme.backgroundElement,
                                    borderColor: unitSelected ? theme.tint : theme.border,
                                  },
                                ]}>
                                <Text
                                  style={{
                                    color: unitSelected ? theme.onTint : theme.text,
                                    fontSize: 13,
                                  }}>
                                  {unitSelected ? '✓ ' : ''}🚪 {u.name}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
              {errors.scope ? (
                <Text style={{ color: theme.danger, fontSize: 13 }}>{errors.scope}</Text>
              ) : null}
              {role === 'investor' ? (
                <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                  Typical for investors: select the properties — or, for condo owners, just the
                  units — they own. They'll see that data read-only, plus shared building
                  appliances for their units.
                </Text>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
      {isLastOwner ? (
        <Text style={{ color: theme.warning, fontSize: 14 }}>
          This is the company's only owner — promote someone else to owner before changing or
          removing this member.
        </Text>
      ) : null}
      {!canEditTarget ? (
        <Text style={{ color: theme.warning, fontSize: 14 }}>Admins can't modify owners.</Text>
      ) : null}

      <View style={{ gap: Spacing.two }}>
        {canEditTarget && !isLastOwner ? (
          <Button title={existing ? 'Save' : 'Add member'} onPress={save} />
        ) : null}
        {existing && canEditTarget && !isLastOwner ? (
          <Button
            title="Remove from company"
            variant="danger"
            onPress={() =>
              confirmDestructive(
                'Remove member?',
                `${existingUser?.name ?? 'This member'} will lose access to ${currentOrg.name}.`,
                () => {
                  removeMember(existing.id);
                  router.back();
                },
              )
            }
          />
        ) : null}
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  propertyList: {
    gap: Spacing.two,
  },
  propertyChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  unitChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingLeft: 16,
  },
  unitChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
