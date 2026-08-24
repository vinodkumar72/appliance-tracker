import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { describePlanStatus, getPlanStatus } from '@/lib/billing';
import { Badge, Button, Card, ChipPicker, EmptyState, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore, useSessionInfo } from '@/lib/store';

export default function SubscriptionFormScreen() {
  const { orgId } = useLocalSearchParams<{ orgId: string }>();
  const theme = useTheme();
  const router = useRouter();
  const organizations = useAppStore((s) => s.organizations);
  const plans = useAppStore((s) => s.plans);
  const subscriptions = useAppStore((s) => s.subscriptions);
  const setSubscription = useAppStore((s) => s.setSubscription);
  const { isPlatformAdmin } = useSessionInfo();

  const org = organizations.find((o) => o.id === orgId);
  const [planId, setPlanId] = useState(
    subscriptions.find((s) => s.orgId === orgId)?.planId ?? plans[0]?.id ?? '',
  );

  if (!isPlatformAdmin || !org) {
    return (
      <Screen>
        <EmptyState
          emoji="🔒"
          title="No permission"
          message="Only the platform owner manages company subscriptions."
        />
      </Screen>
    );
  }

  if (plans.length === 0) {
    return (
      <Screen>
        <EmptyState
          emoji="💳"
          title="No plans yet"
          message="Create plans first (Company tab → Plans → New plan), then assign one here."
        />
      </Screen>
    );
  }

  const current = getPlanStatus(plans, subscriptions, org.id);
  const selectedPlan = plans.find((p) => p.id === planId);

  const assign = (mode: 'trial' | 'active') => {
    if (!selectedPlan) return;
    setSubscription(org.id, selectedPlan.id, mode);
    router.back();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: `Plan for ${org.name}` }} />
      <Card>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Current plan</Text>
        <View style={{ flexDirection: 'row' }}>
          <Badge
            label={describePlanStatus(current)}
            tone={
              current.status === 'active'
                ? 'success'
                : current.status === 'trial'
                  ? 'warning'
                  : current.status === 'expired'
                    ? 'danger'
                    : 'neutral'
            }
          />
        </View>
      </Card>

      <ChipPicker
        label="Plan"
        value={planId}
        onChange={setPlanId}
        options={plans.map((p) => ({
          value: p.id,
          label: `${p.name} — ${p.yearlyPrice === 0 ? 'free' : `$${p.yearlyPrice}/yr`}`,
        }))}
      />
      {selectedPlan ? (
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
          {selectedPlan.maxProperties != null
            ? `Up to ${selectedPlan.maxProperties} properties.`
            : 'Unlimited properties.'}
          {selectedPlan.trialDays > 0 ? ` ${selectedPlan.trialDays}-day trial available.` : ''}
        </Text>
      ) : null}

      <View style={{ gap: Spacing.two }}>
        {selectedPlan && selectedPlan.yearlyPrice > 0 && selectedPlan.trialDays > 0 ? (
          <Button
            title={`Start ${selectedPlan.trialDays}-day trial`}
            variant="secondary"
            onPress={() => assign('trial')}
          />
        ) : null}
        {selectedPlan ? (
          <Button
            title={
              selectedPlan.yearlyPrice === 0
                ? `Assign ${selectedPlan.name}`
                : `Activate ${selectedPlan.name} — 1 year ($${selectedPlan.yearlyPrice})`
            }
            onPress={() => assign('active')}
          />
        ) : null}
        <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
      </View>
      <Text style={{ color: theme.textSecondary, fontSize: 12, fontStyle: 'italic' }}>
        Payment collection isn't wired up yet — activate a paid plan after invoicing the customer.
        Stripe checkout can be added later so this happens automatically.
      </Text>
    </Screen>
  );
}
