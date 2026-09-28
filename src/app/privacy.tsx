import { Stack, useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PageHero, PublicPage } from '@/components/public-page';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>{children}</Text>
    </View>
  );
}

/** Public page: privacy policy (required for the app stores). */
export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <PublicPage>
      <Stack.Screen options={{ title: 'Privacy policy' }} />
      <PageHero
        emoji="🔒"
        title="Privacy policy"
        subtitle="Effective September 28, 2026 · PropsLane — appliance & maintenance tracking for property managers."
      />

      <Section title="The short version">
        PropsLane stores the data property-management companies put into it — their properties,
        appliances, and maintenance records — plus the account details needed to sign you in. We
        don't run ads, we don't use third-party analytics or trackers, and we never sell or rent
        your data to anyone.
      </Section>

      <Section title="What we collect">
        Account information: your name, email address, and phone number, provided when your company
        invites you or when you request an invitation. Company data: company name and contact
        details, properties and units, appliance details (brand, model, serial number, purchase
        information, warranties), maintenance schedules and history, and — where a company chooses
        to record them — the contact details of property or unit owners. Payment information for
        subscriptions is collected and processed by Stripe; card numbers never reach our systems.
      </Section>

      <Section title="Appliance label photos">
        When you scan an appliance label, the photo is sent to an AI service (Anthropic) solely to
        read the label's text (model, serial number, and similar details). The extracted text is
        saved to your appliance record; the photo itself is not stored by PropsLane. On supported
        devices an offline reader can process the photo entirely on your device instead.
      </Section>

      <Section title="How we use it">
        Only to provide the service: syncing your data between your devices and our database,
        showing each member of a company exactly the properties their role allows, sending
        account emails (invitations, password resets), and billing subscriptions. Access to data is
        enforced by database-level security rules — members of one company can never read
        another company's data.
      </Section>

      <Section title="Where it lives">
        Data is stored with Supabase (our database and authentication provider) and synced to your
        devices for offline use; a local copy remains on each signed-in device and is cleared when
        you sign out with everything synced, or via "Reset all data". Our service providers are
        Supabase (database, authentication, hosting), Stripe (payments), Anthropic (appliance-label
        reading), and our email provider (account emails). Each receives only what it needs to
        perform its function.
      </Section>

      <Section title="Your choices and rights">
        You can view and correct your account details in the app. To have your account or your
        company's data exported or deleted, contact your company's administrator or reach us
        through the contact page — we'll act on verified requests promptly. Accounts are created
        by invitation from a property-management company; if you believe your details were added
        in error, contact us and we'll remove them.
      </Section>

      <Section title="Cookies and local storage">
        The web app uses browser local storage for your sign-in session and your synced data —
        that's what makes it work offline. We set no advertising or cross-site tracking cookies.
      </Section>

      <Section title="Children">
        PropsLane is a business tool and is not directed at children. We do not knowingly collect
        information from anyone under 16.
      </Section>

      <Section title="Changes">
        If this policy changes materially, we'll update this page and note the new effective date
        above. Questions? We're happy to answer them.
      </Section>

      <View style={{ gap: Spacing.two, marginTop: Spacing.two }}>
        <Button title="Contact us" onPress={() => router.push('/contact')} />
        <Button title="Back to home" variant="secondary" onPress={() => router.replace('/')} />
      </View>
    </PublicPage>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14.5,
    lineHeight: 23,
  },
});
