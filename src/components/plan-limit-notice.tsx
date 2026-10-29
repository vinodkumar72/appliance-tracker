import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { Button, Card, EmptyState, Screen } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { PURCHASING_AVAILABLE } from '@/lib/billing';

/**
 * The one place that tells a user they've hit their company's unit or
 * appliance cap. Every "limit reached" spot in the app renders this, so the
 * wording stays platform-correct:
 *
 * - Web: names the plan and offers "Upgrade plan" (Stripe Checkout).
 * - iOS/Android: neutral wording only — no plan name, no price, no upgrade
 *   button, no pointer to the website. App Store guideline 3.1.3 allows a
 *   free companion app to a web-sold service only on those terms.
 */
export function PlanLimitNotice({
  kind,
  count,
  max,
  planName,
  where,
  hint,
  layout,
}: {
  kind: 'units' | 'appliances';
  /** In use / allowed, from useOrgPlan or useApplianceLimit. */
  count: number;
  max: number;
  planName?: string | null;
  /** Where the cap bit, e.g. "in Unit 4B" or "in the building/common area". */
  where?: string;
  /** A way around it that isn't buying anything, e.g. "Pick a different location." */
  hint?: string;
  /** Inline card inside a screen, or the whole screen (blocked forms). */
  layout: 'banner' | 'screen';
}) {
  const theme = useTheme();
  const router = useRouter();

  const noun = kind === 'units' ? 'units' : 'appliances';
  const title = PURCHASING_AVAILABLE
    ? `${kind === 'units' ? 'Plan' : 'Appliance'} limit reached${where ? ` ${where}` : ''} (${count}/${max}${kind === 'units' ? ' units' : ''})`
    : `Can't add more ${noun}${where ? ` ${where}` : ''}`;
  const body = PURCHASING_AVAILABLE
    ? `The ${planName ?? 'current'} plan ${kind === 'units' ? 'covers' : 'allows'} ${max} ${noun}${
        kind === 'appliances' ? ' per unit' : ''
      }.${hint ? ` ${hint}` : ''} Upgrade the plan to add more.`
    : `This company's account allows ${max} ${noun}${
        kind === 'appliances' ? ' here' : ''
      } and all ${count} are in use.${hint ? ` ${hint}` : ''} Contact your company administrator to add more.`;

  if (layout === 'screen') {
    return (
      <Screen>
        <EmptyState emoji={PURCHASING_AVAILABLE ? '📈' : '🔒'} title={title} message={body}>
          {PURCHASING_AVAILABLE ? (
            <Button title="Upgrade plan" onPress={() => router.replace('/upgrade')} />
          ) : null}
        </EmptyState>
      </Screen>
    );
  }

  return (
    <Card style={{ borderColor: theme.warning, borderWidth: 1.5, gap: 4 }}>
      <Text style={{ color: theme.warning, fontSize: 14, fontWeight: '600' }}>{title}</Text>
      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{body}</Text>
      {PURCHASING_AVAILABLE ? (
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          <Button title="Upgrade plan" compact onPress={() => router.push('/upgrade')} />
        </View>
      ) : null}
    </Card>
  );
}
