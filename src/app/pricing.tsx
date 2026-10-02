import { Stack, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { PlanTable } from '@/components/plan-table';
import { PageHero, PublicPage } from '@/components/public-page';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Public page: the live plan catalog (mirrored from Stripe), readable without an account. */
export default function PricingScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <PublicPage>
      <Stack.Screen options={{ title: 'Pricing' }} />
      <PageHero
        emoji="💳"
        title="Simple, unit-based pricing"
        subtitle="Pay for the units you manage — every feature is included in every tier."
      />

      <PlanTable />

      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
        Start on the free tier in minutes — no credit card required. Create an account, set up your
        company, and upgrade whenever you outgrow it. Prefer a guided start? Request an invite and
        we'll set you up.
      </Text>

      <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
        <Button title="Start free" onPress={() => router.push('/sign-in?mode=signup' as never)} />
        <Button
          title="Request an invite"
          variant="secondary"
          onPress={() => router.push('/request-invite')}
        />
      </View>
    </PublicPage>
  );
}
