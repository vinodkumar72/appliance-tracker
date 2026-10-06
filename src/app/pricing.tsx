import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { PlanTable } from '@/components/plan-table';
import { PageHero, PublicPage } from '@/components/public-page';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Public page: the live plan catalog (mirrored from Stripe), readable without an account. */
export default function PricingScreen() {
  const theme = useTheme();

  return (
    <PublicPage
      title="Pricing"
      description="Simple, unit-based pricing. Start free with up to 3 units and no credit card; paid tiers are priced by the number of units you manage, and every tier includes every feature."
      path="/pricing">
      <Stack.Screen options={{ title: 'Pricing' }} />
      <PageHero
        emoji="💳"
        title="Simple, unit-based pricing"
        subtitle="Pay for the units you manage — every feature is included in every tier."
      />

      {/* Static summary so the tier structure is readable before the live catalog loads. */}
      <Text style={{ color: theme.textSecondary, fontSize: 14.5, lineHeight: 22 }}>
        Start on the free tier: up to 3 units, no credit card, no time limit. Paid tiers are priced
        by the number of units you manage, and every tier includes every feature — label scanning,
        automatic maintenance schedules, warranty alerts, team roles, and the investor portal.
      </Text>

      <PlanTable />

      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
        Start on the free tier in minutes — no credit card required. Create an account, set up your
        company, and upgrade whenever you outgrow it. Prefer a guided start? Request an invite and
        we'll set you up. Questions?{' '}
        <Link href="/faq" style={{ color: theme.tint, fontWeight: '600' }}>
          Read the FAQ.
        </Link>
      </Text>

      <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
        <Button title="Start free" href="/sign-in?mode=signup" />
        <Button title="Request an invite" variant="secondary" href="/request-invite" />
      </View>
    </PublicPage>
  );
}
