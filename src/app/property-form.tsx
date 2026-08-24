import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { Button, EmptyState, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useOrgPlan } from '@/lib/billing';
import { can } from '@/lib/permissions';
import { useAppStore, useSessionInfo } from '@/lib/store';

export default function PropertyFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const properties = useAppStore((s) => s.properties);
  const addProperty = useAppStore((s) => s.addProperty);
  const updateProperty = useAppStore((s) => s.updateProperty);
  const { role, isPropertyScoped, currentOrg } = useSessionInfo();
  const planInfo = useOrgPlan(currentOrg?.id);

  const existing = id ? properties.find((p) => p.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  // Creating a property requires org-wide access; editing a visible one does not.
  const allowed = can(role, 'editProperties') && (existing ? true : !isPropertyScoped);
  const [address, setAddress] = useState(existing?.address ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [ownerName, setOwnerName] = useState(existing?.ownerName ?? '');
  const [ownerPhone, setOwnerPhone] = useState(existing?.ownerPhone ?? '');
  const [ownerEmail, setOwnerEmail] = useState(existing?.ownerEmail ?? '');
  const [ownerMailingAddress, setOwnerMailingAddress] = useState(
    existing?.ownerMailingAddress ?? '',
  );
  const [errors, setErrors] = useState<{ name?: string; address?: string; ownerEmail?: string }>({});

  if (!allowed) {
    return (
      <Screen>
        <EmptyState emoji="🔒" title="No permission" message="Your role can't edit properties." />
      </Screen>
    );
  }

  if (!existing && planInfo?.atLimit) {
    return (
      <Screen>
        <EmptyState
          emoji="📈"
          title="Plan limit reached"
          message={`The ${planInfo.plan?.name ?? 'current'} plan allows ${planInfo.effectiveMax} properties (${planInfo.propertyCount} in use). Upgrade the company's plan to add more.`}
        />
      </Screen>
    );
  }

  const save = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Name is required.';
    if (!address.trim()) nextErrors.address = 'Address is required.';
    if (ownerEmail.trim() && !/^\S+@\S+\.\S+$/.test(ownerEmail.trim())) {
      nextErrors.ownerEmail = 'Enter a valid email address.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const data = {
      name: name.trim(),
      address: address.trim(),
      notes: notes.trim(),
      ownerName: ownerName.trim() || undefined,
      ownerPhone: ownerPhone.trim() || undefined,
      ownerEmail: ownerEmail.trim() || undefined,
      ownerMailingAddress: ownerMailingAddress.trim() || undefined,
    };
    if (existing) {
      updateProperty(existing.id, data);
    } else {
      addProperty(data);
    }
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit property' : 'Add property' }} />
      <FormField
        label="Name *"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Maple St Duplex"
        error={errors.name}
      />
      <FormField
        label="Address *"
        value={address}
        onChangeText={setAddress}
        placeholder="Street, city"
        error={errors.address}
      />
      <FormField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Tenants, access codes, anything useful"
        multiline
      />
      <FormField
        label="Owner name"
        value={ownerName}
        onChangeText={setOwnerName}
        placeholder="Who owns this property?"
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
        <Button title={existing ? 'Save changes' : 'Add property'} onPress={save} />
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
