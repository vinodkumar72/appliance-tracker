import { FunctionsHttpError } from '@supabase/supabase-js';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { Button, Card, ChipPicker, EmptyState, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useOrgPlan } from '@/lib/billing';
import { useAppStore, useSessionInfo } from '@/lib/store';
import { supabase } from '@/lib/supabase';

/**
 * Self-serve plan upgrade for company owners/admins: pick a tier + billing
 * interval, pay through Stripe Checkout. The stripe-catalog-sync webhook then
 * writes the subscription, and devices pick it up on the next sync.
 * Web-only — checkout is a browser redirect.
 */
export default function UpgradeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { currentOrg, role, isPlatformAdmin } = useSessionInfo();
  const plans = useAppStore((s) => s.plans);
  const planInfo = useOrgPlan(currentOrg?.id);

  const paidPlans = plans
    .filter((p) => p.yearlyPrice > 0 || (p.monthlyPrice ?? 0) > 0)
    .sort((a, b) => a.yearlyPrice - b.yearlyPrice);

  const [chosenPlanId, setChosenPlanId] = useState('');
  const [interval, setInterval_] = useState<'month' | 'year'>('year');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const selectedId = chosenPlanId || paidPlans[0]?.id || '';
  const selected = paidPlans.find((p) => p.id === selectedId);

  if (!currentOrg) {
    return (
      <Screen>
        <EmptyState emoji="🏢" title="No company selected" message="Select a company first, then upgrade its plan." />
      </Screen>
    );
  }

  const canUpgrade = role === 'owner' || role === 'admin';
  if (!canUpgrade && !isPlatformAdmin) {
    return (
      <Screen>
        <EmptyState
          emoji="🔒"
          title="Ask your company owner"
          message="Only a company owner or admin can change the plan."
        />
      </Screen>
    );
  }

  if (Platform.OS !== 'web') {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Upgrade plan' }} />
        <EmptyState
          emoji="💳"
          title="Upgrade on the web"
          message="Plan upgrades are handled through our website — sign in there with this same account and choose Upgrade plan from the Company tab."
        />
      </Screen>
    );
  }

  const checkout = async () => {
    if (!selected) return;
    setBusy(true);
    setMessage('');
    const origin = window.location.origin;
    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: {
        orgId: currentOrg.id,
        planId: selected.id,
        interval,
        successUrl: `${origin}/?checkout=success`,
        cancelUrl: `${origin}/upgrade`,
      },
    });
    if (error) {
      let detail = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const body = (await error.context.json()) as { error?: string };
          if (body.error) detail = body.error;
        } catch {
          // keep the generic message
        }
      }
      setMessage(`Could not start checkout: ${detail}`);
      setBusy(false);
      return;
    }
    const url = (data as { url?: string })?.url;
    if (!url) {
      setMessage('Could not start checkout: no checkout link returned.');
      setBusy(false);
      return;
    }
    window.location.assign(url);
  };

  const intervalOptions: { value: 'month' | 'year'; label: string }[] = [];
  if (selected?.monthlyPrice != null) {
    intervalOptions.push({ value: 'month', label: `Monthly — $${selected.monthlyPrice}/mo` });
  }
  if (selected) {
    intervalOptions.push({ value: 'year', label: `Yearly — $${selected.yearlyPrice}/yr` });
  }
  const effectiveInterval =
    interval === 'month' && selected?.monthlyPrice == null ? 'year' : interval;

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Upgrade plan' }} />

      {planInfo ? (
        <Card>
          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>
            Current plan: {planInfo.plan?.name ?? 'none'}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
            {planInfo.unitCount} of {planInfo.effectiveMax ?? 'unlimited'} units used
            {planInfo.atLimit ? ' — you’ve reached the limit.' : '.'}
          </Text>
        </Card>
      ) : null}

      {isPlatformAdmin && !canUpgrade ? (
        <Card>
          <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
            You're the platform owner — you can also assign plans directly without payment from the
            company's row on the Company tab.
          </Text>
        </Card>
      ) : null}

      {paidPlans.length === 0 ? (
        <EmptyState emoji="🗒️" title="No paid plans" message="No paid tiers are configured yet." />
      ) : (
        <>
          <ChipPicker
            label="Choose a plan"
            value={selectedId}
            onChange={setChosenPlanId}
            options={paidPlans.map((p) => ({
              value: p.id,
              label: `${p.emoji ? `${p.emoji} ` : ''}${p.name} — ${
                p.maxUnits != null ? `${p.maxUnits} units` : 'unlimited'
              }`,
            }))}
          />
          {intervalOptions.length > 0 ? (
            <ChipPicker
              label="Billing"
              value={effectiveInterval}
              onChange={setInterval_}
              options={intervalOptions}
            />
          ) : null}
          <View style={{ gap: Spacing.two }}>
            <Button
              title={busy ? 'Opening secure checkout…' : 'Continue to secure checkout'}
              onPress={busy ? () => {} : checkout}
            />
            <Button title="Cancel" variant="secondary" onPress={() => router.back()} />
          </View>
          <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
            Payment is handled by Stripe. Your new limits apply automatically within a minute of
            payment — use Sync now on the Company tab if they don't.
          </Text>
        </>
      )}

      {message ? (
        <Card>
          <Text style={{ color: theme.danger, fontSize: 14 }}>{message}</Text>
        </Card>
      ) : null}
    </Screen>
  );
}
