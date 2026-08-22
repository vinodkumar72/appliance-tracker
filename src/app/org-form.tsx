import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, EmptyState, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { can } from '@/lib/permissions';
import { useAppStore, useSessionInfo } from '@/lib/store';

export default function OrgFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const theme = useTheme();
  const router = useRouter();
  const organizations = useAppStore((s) => s.organizations);
  const createOrganization = useAppStore((s) => s.createOrganization);
  const renameOrganization = useAppStore((s) => s.renameOrganization);
  const { role, isPlatformAdmin } = useSessionInfo();

  const existing = id ? organizations.find((o) => o.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [errors, setErrors] = useState<{ name?: string; ownerName?: string; ownerEmail?: string }>(
    {},
  );

  // Onboarding new companies is the platform owner's job; renaming needs
  // manageOrg within the company (or the platform owner).
  const allowed = existing ? can(role, 'manageOrg') || isPlatformAdmin : isPlatformAdmin;
  if (!allowed) {
    return (
      <Screen>
        <EmptyState
          emoji="🔒"
          title="No permission"
          message={
            existing
              ? 'Only the company owner or the platform owner can rename a company.'
              : 'Only the platform owner can onboard new companies.'
          }
        />
      </Screen>
    );
  }

  const save = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Company name is required.';
    if (!existing) {
      if (!ownerName.trim()) nextErrors.ownerName = "The company owner's name is required.";
      if (ownerEmail.trim() && !/^\S+@\S+\.\S+$/.test(ownerEmail.trim())) {
        nextErrors.ownerEmail = 'Enter a valid email address.';
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (existing) {
      renameOrganization(existing.id, name);
    } else {
      createOrganization(name, ownerName, ownerEmail);
    }
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Rename company' : 'Onboard company' }} />
      <FormField
        label="Company name *"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Acme Property Management"
        error={errors.name}
      />
      {!existing ? (
        <>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
            Every company needs its first Owner — they'll manage the company's members and
            properties from there.
          </Text>
          <FormField
            label="Company owner's name *"
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Who runs this company?"
            error={errors.ownerName}
          />
          <FormField
            label="Company owner's email"
            value={ownerEmail}
            onChangeText={setOwnerEmail}
            placeholder="owner@company.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.ownerEmail}
          />
        </>
      ) : null}
      <View style={{ gap: Spacing.two }}>
        <Button title={existing ? 'Save' : 'Onboard company'} onPress={save} />
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
