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
        Ready to start? Request an invite and we'll onboard your company and send your sign-in
        details.
      </Text>

      <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
        <Button title="Request an invite" onPress={() => router.push('/request-invite')} />
        <Button title="Sign in" variant="secondary" onPress={() => router.push('/sign-in')} />
      </View>
    </PublicPage>
  );
}
