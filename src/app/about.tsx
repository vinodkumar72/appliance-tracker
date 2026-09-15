import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PageHero, PublicPage } from '@/components/public-page';
import { Button, Card, SectionHeader } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FEATURES: { title: string; body: string }[] = [
  {
    title: '📷 Scan the label, skip the typing',
    body: "Photograph the appliance's label — the sticker with the model and serial number — and AI reads it straight into the record, with an on-device reader as the offline fallback.",
  },
  {
    title: '🗓️ Maintenance that runs itself',
    body: 'Adding an appliance auto-creates the right recurring tasks — HVAC filters, water-heater flushes, dryer vents — and a live task board shows overdue, due soon, and upcoming across the portfolio.',
  },
  {
    title: '🛡️ Warranties that never lapse silently',
    body: 'Expiry alerts before coverage runs out, plus an age-versus-lifespan gauge for repair-or-replace decisions backed by real costs.',
  },
  {
    title: '🏢 Real buildings, modeled properly',
    body: 'Single-family homes, duplexes, apartment buildings, and condos — units with their own appliances and their own owners, plus shared building equipment.',
  },
  {
    title: '👥 A team and an investor portal',
    body: 'Six roles from full control to read-only, scopable to specific properties or single units. Investors see their own property live — repairs, costs, warranties — without the phone calls.',
  },
  {
    title: '📴 Works everywhere, even offline',
    body: 'Native iPhone and Android apps plus the full web app on one account. Every change saves instantly on the device and syncs automatically when connected.',
  },
];

/** Public page: what the product is, for prospects who found the app. */
export default function AboutScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <PublicPage>
      <Stack.Screen options={{ title: 'About' }} />
      <PageHero
        emoji="🏠"
        title="Built for the people who keep rentals running"
        subtitle="The maintenance, warranty, and repair system for property management companies — with a live, read-only window for the investors whose properties they manage."
      />

      <SectionHeader title="What's inside" />
      {FEATURES.map((f) => (
        <Card key={f.title}>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>{f.title}</Text>
          <Text style={{ color: theme.textSecondary, fontSize: 14 }}>{f.body}</Text>
        </Card>
      ))}

      <SectionHeader title="Get started" />
      <View style={{ gap: Spacing.two }}>
        <Button title="Request an invite" onPress={() => router.push('/request-invite')} />
        <Button title="See pricing" variant="secondary" onPress={() => router.push('/pricing')} />
        <Button title="Sign in" variant="secondary" onPress={() => router.push('/sign-in')} />
      </View>
    </PublicPage>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  logo: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 520,
  },
});
