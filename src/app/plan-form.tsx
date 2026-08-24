import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, EmptyState, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirmDestructive } from '@/lib/confirm';
import { useAppStore, useSessionInfo } from '@/lib/store';

export default function PlanFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const theme = useTheme();
  const router = useRouter();
  const plans = useAppStore((s) => s.plans);
  const subscriptions = useAppStore((s) => s.subscriptions);
  const addPlan = useAppStore((s) => s.addPlan);
  const updatePlan = useAppStore((s) => s.updatePlan);
  const deletePlan = useAppStore((s) => s.deletePlan);
  const { isPlatformAdmin } = useSessionInfo();

  const existing = id ? plans.find((p) => p.id === id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [yearlyPrice, setYearlyPrice] = useState(
    existing ? String(existing.yearlyPrice) : '0',
  );
  const [maxProperties, setMaxProperties] = useState(
    existing?.maxProperties != null ? String(existing.maxProperties) : '',
  );
  const [trialDays, setTrialDays] = useState(existing ? String(existing.trialDays) : '14');
  const [errors, setErrors] = useState<{
    name?: string;
    yearlyPrice?: string;
    maxProperties?: string;
    trialDays?: string;
  }>({});

  if (!isPlatformAdmin) {
    return (
      <Screen>
        <EmptyState emoji="🔒" title="No permission" message="Only the platform owner configures plans." />
      </Screen>
    );
  }

  const subscriberCount = existing
    ? subscriptions.filter((s) => s.planId === existing.id).length
    : 0;

  const save = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Plan name is required.';
    const price = Number(yearlyPrice.replace(/[$,]/g, ''));
    if (Number.isNaN(price) || price < 0) nextErrors.yearlyPrice = 'Enter a valid amount (0 = free).';
    const max = maxProperties.trim() === '' ? undefined : Number(maxProperties);
    if (max !== undefined && (!Number.isInteger(max) || max < 1)) {
      nextErrors.maxProperties = 'Whole number, or leave blank for unlimited.';
    }
    const trial = Number(trialDays || '0');
    if (!Number.isInteger(trial) || trial < 0 || trial > 365) {
      nextErrors.trialDays = 'Whole number of days (0 = no trial).';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const data = { name: name.trim(), yearlyPrice: price, maxProperties: max, trialDays: trial };
    if (existing) {
      updatePlan(existing.id, data);
    } else {
      addPlan(data);
    }
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? 'Edit plan' : 'New plan' }} />
      <FormField
        label="Plan name *"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Free, Pro, Enterprise"
        error={errors.name}
      />
      <FormField
        label="Yearly price ($) *"
        value={yearlyPrice}
        onChangeText={setYearlyPrice}
        placeholder="0 for a free tier"
        keyboardType="decimal-pad"
        error={errors.yearlyPrice}
      />
      <FormField
        label="Property limit"
        value={maxProperties}
        onChangeText={setMaxProperties}
        placeholder="Leave blank for unlimited"
        keyboardType="number-pad"
        error={errors.maxProperties}
      />
      <FormField
        label="Trial period (days)"
        value={trialDays}
        onChangeText={setTrialDays}
        placeholder="0 for no trial"
        keyboardType="number-pad"
        error={errors.trialDays}
      />
      <View style={{ gap: Spacing.two }}>
        <Button title={existing ? 'Save plan' : 'Create plan'} onPress={save} />
        {existing ? (
          <>
            <Button
              title="Delete plan"
              variant="danger"
              onPress={() =>
                confirmDestructive(
                  'Delete plan?',
                  subscriberCount > 0
                    ? `${subscriberCount} compan${subscriberCount === 1 ? 'y is' : 'ies are'} on "${existing.name}" — they'll fall back to the free tier.`
                    : `"${existing.name}" will be removed.`,
                  () => {
                    deletePlan(existing.id);
                    router.back();
                  },
                )
              }
            />
            {subscriberCount > 0 ? (
              <Text style={{ color: theme.textSecondary, fontSize: 13, textAlign: 'center' }}>
                {subscriberCount} compan{subscriberCount === 1 ? 'y' : 'ies'} currently on this plan.
              </Text>
            ) : null}
          </>
        ) : null}
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
