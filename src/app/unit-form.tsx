import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, EmptyState, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { can } from '@/lib/permissions';
import { useAppStore, useSessionInfo } from '@/lib/store';

export default function UnitFormScreen() {
  const { id, propertyId } = useLocalSearchParams<{ id?: string; propertyId?: string }>();
  const theme = useTheme();
  const router = useRouter();
  const unitsAll = useAppStore((s) => s.units);
  const appliances = useAppStore((s) => s.appliances);
  const addUnit = useAppStore((s) => s.addUnit);
  const updateUnit = useAppStore((s) => s.updateUnit);
  const deleteUnit = useAppStore((s) => s.deleteUnit);
  const { role } = useSessionInfo();

  const existing = id ? unitsAll.find((u) => u.id === id) : undefined;
  const targetPropertyId = existing?.propertyId ?? propertyId;

  const [name, setName] = useState(existing?.name ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [ownerName, setOwnerName] = useState(existing?.ownerName ?? '');
  const [ownerPhone, setOwnerPhone] = useState(existing?.ownerPhone ?? '');
  const [ownerEmail, setOwnerEmail] = useState(existing?.ownerEmail ?? '');
  const [ownerMailingAddress, setOwnerMailingAddress] = useState(
    existing?.ownerMailingAddress ?? '',
  );
  const [errors, setErrors] = useState<{ name?: string; ownerEmail?: string }>({});

  if (!can(role, 'editProperties')) {
    return (
      <Screen>
        <EmptyState emoji="🔒" title="No permission" message="Your role can't edit units." />
      </Screen>
    );
  }

  const applianceCount = existing
    ? appliances.filter((a) => a.unitId === existing.id).length
    : 0;

  const save = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Unit name is required.';
    if (ownerEmail.trim() && !/^\S+@\S+\.\S+$/.test(ownerEmail.trim())) {
      nextErrors.ownerEmail = 'Enter a valid email address.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !targetPropertyId) return;

    const data = {
      name: name.trim(),
      notes: notes.trim(),
      ownerName: ownerName.trim() || undefined,
      ownerPhone: ownerPhone.trim() || undefined,
      ownerEmail: ownerEmail.trim() || undefined,
      ownerMailingAddress: ownerMailingAddress.trim() || undefined,
    };
    if (existing) {
      updateUnit(existing.id, data);
    } else {
      addUnit({ propertyId: targetPropertyId, ...data });
    }
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit unit' : 'Add unit' }} />
      <FormField
        label="Unit name *"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Unit 2B, Apt 301, Basement suite"
        error={errors.name}
      />
      <FormField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Tenant name, access notes…"
        multiline
      />
      <FormField
        label="Unit owner name"
        value={ownerName}
        onChangeText={setOwnerName}
        placeholder="Who owns this unit? (condos: often each unit differs)"
      />
      <FormField
        label="Owner phone"
        value={ownerPhone}
        onChangeText={setOwnerPhone}
        placeholder="+1 (555) 123-4567"
        keyboardType="phone-pad"
      />
      <FormField
        label="Owner email"
        value={ownerEmail}
        onChangeText={setOwnerEmail}
        placeholder="owner@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.ownerEmail}
      />
      <FormField
        label="Owner mailing address"
        value={ownerMailingAddress}
        onChangeText={setOwnerMailingAddress}
        placeholder="Where to send statements and notices"
        multiline
      />
      <View style={{ gap: Spacing.two }}>
        <Button title={existing ? 'Save changes' : 'Add unit'} onPress={save} />
        {existing ? (
          <>
            <Button
              title="Delete unit"
              variant="danger"
              onPress={() =>
                confirmDestructive(
                  'Delete unit?',
                  applianceCount > 0
                    ? `"${existing.name}" will be removed. Its ${applianceCount} appliance${applianceCount === 1 ? '' : 's'} will move to the building / common area.`
                    : `"${existing.name}" will be removed.`,
                  () => {
                    deleteUnit(existing.id);
                    router.back();
                  },
                )
              }
            />
            {applianceCount > 0 ? (
              <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center' }}>
                Appliances are never deleted with a unit — they move to building / common.
              </Text>
            ) : null}
          </>
        ) : null}
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
