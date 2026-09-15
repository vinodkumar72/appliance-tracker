import { Stack, useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { PageHero, PublicPage } from '@/components/public-page';
import { StripePricingTable } from '@/components/stripe-pricing-table';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Public page: subscribe via the Stripe-hosted pricing table. */
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

      <StripePricingTable />

      <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
        A home with no units counts as 1 unit; a 20-unit building counts as 20. After subscribing,
        we'll onboard your company and send your sign-in invitation.
      </Text>

      <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
        <Button title="Request an invite" onPress={() => router.push('/request-invite')} />
        <Button title="Sign in" variant="secondary" onPress={() => router.push('/sign-in')} />
      </View>
    </PublicPage>
  );
}
