import { Stack, useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { PageHero, PublicPage } from '@/components/public-page';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Step {
  title: string;
  body: string;
  images: number[];
}

const STEPS: Step[] = [
  {
    title: 'Set up your portfolio',
    body:
      'Add each property once — a single-family home, or a building with units under it. Owner contact details live right on the property (or on each unit, for condos), so the investor behind any building is one tap away.',
    images: [require('../../assets/demo/02-property.png')],
  },
  {
    title: 'Point your camera at the appliance label',
    body:
      'Photograph the label — the sticker with the model and serial number — and AI reads it straight into the form. Pick the appliance type and the recommended maintenance schedule fills itself in: a water heater arrives already knowing it needs an annual flush. About thirty seconds per appliance, and it works offline too.',
    images: [require('../../assets/demo/05-add-appliance.png')],
  },
  {
    title: 'Every appliance carries its whole history',
    body:
      'Age against expected lifespan, warranty status (flagged before it lapses, not after), every repair with its cost and vendor, and the maintenance schedule — one record per machine. When a filter change or tank flush gets done, one tap marks it done: the reminder resets and the history entry writes itself.',
    images: [
      require('../../assets/demo/03-appliance-top.png'),
      require('../../assets/demo/04-appliance-history.png'),
    ],
  },
  {
    title: 'Due dates surface themselves',
    body:
      'The Tasks board sorts the whole portfolio by urgency — overdue first, due soon next — each row naming the appliance, unit, and property. The dashboard gives the same picture at a glance: what needs attention, what warranties are expiring, across everything you manage. Technicians check work off from their phone inside the unit; a dead-signal basement just syncs on the walk back to the truck.',
    images: [
      require('../../assets/demo/06-tasks.png'),
      require('../../assets/demo/01-dashboard.png'),
    ],
  },
  {
    title: 'Everyone gets exactly the right window',
    body:
      'Six roles, from owner to read-only. Scope a technician to the buildings they service, or an investor to the single condo unit they own — enforced in the database, not just the interface. When an investor signs in, the app reshapes around them: their property, their appliances, live and read-only. What used to be a phone call to you becomes a glance for them.',
    images: [
      require('../../assets/demo/07-roles.png'),
      require('../../assets/demo/08-investor.png'),
    ],
  },
];

const ROLES: { emoji: string; name: string; blurb: string }[] = [
  {
    emoji: '👩‍💼',
    name: 'Managers',
    blurb: 'Run the whole portfolio: properties, appliances, schedules, team, and plan.',
  },
  {
    emoji: '🔧',
    name: 'Technicians',
    blurb: 'See their assigned buildings and tasks; log work from the field, even offline.',
  },
  {
    emoji: '🏠',
    name: 'Investors',
    blurb: 'A live, read-only view of their own properties and units — nothing else.',
  },
];

/** Public page: the product loop in five steps, every screen the real app. */
export default function HowItWorksScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <PublicPage>
      <Stack.Screen options={{ title: 'How it works' }} />
      <PageHero
        emoji="🗺️"
        title="How it works"
        subtitle="From appliance label to organized portfolio — the whole loop in five steps. Every screen below is the real product with sample data."
      />

      {STEPS.map((step, index) => (
        <View key={step.title} style={styles.step}>
          <View style={styles.stepHead}>
            <View style={[styles.stepPill, { backgroundColor: theme.tintSoft }]}>
              <Text style={[styles.stepPillText, { color: theme.tint }]}>STEP {index + 1}</Text>
            </View>
            <View style={[styles.stepLine, { backgroundColor: theme.border }]} />
          </View>
          <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
          <Text style={[styles.stepBody, { color: theme.textSecondary }]}>{step.body}</Text>
          {step.images.map((source, imageIndex) => (
            <View key={imageIndex} style={[styles.shotFrame, { borderColor: theme.border }]}>
              <Image source={source} style={styles.shotImage} resizeMode="cover" />
            </View>
          ))}
        </View>
      ))}

      {/* Who sees what */}
      <View style={styles.rolesBlock}>
        <Text style={[styles.rolesTitle, { color: theme.text }]}>Who sees what</Text>
        <View style={styles.rolesRow}>
          {ROLES.map((role) => (
            <View
              key={role.name}
              style={[
                styles.roleCard,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <Text style={styles.roleEmoji}>{role.emoji}</Text>
              <Text style={[styles.roleName, { color: theme.text }]}>{role.name}</Text>
              <Text style={[styles.roleBlurb, { color: theme.textSecondary }]}>{role.blurb}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Closing */}
      <View style={[styles.closing, { backgroundColor: theme.tintSoft }]}>
        <Text style={[styles.closingTitle, { color: theme.text }]}>
          Know every appliance. Stay ahead of the failures. Keep every owner in the loop.
        </Text>
        <Text style={[styles.closingBody, { color: theme.textSecondary }]}>
          Most companies are set up and tracking their first building the same morning.
        </Text>
        <View style={styles.ctaRow}>
          <Button title="Request an invite" onPress={() => router.push('/request-invite')} />
          <Button title="See pricing" variant="secondary" onPress={() => router.push('/pricing')} />
        </View>
      </View>
    </PublicPage>
  );
}

const styles = StyleSheet.create({
  step: {
    gap: Spacing.two,
    paddingTop: Spacing.five,
  },
  stepHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  stepPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  stepLine: {
    flex: 1,
    height: 1,
  },
  stepTitle: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stepBody: {
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 640,
  },
  shotFrame: {
    width: '100%',
    aspectRatio: 880 / 660,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  shotImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  rolesBlock: {
    gap: Spacing.two,
    paddingTop: Spacing.five,
  },
  rolesTitle: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  roleCard: {
    flexGrow: 1,
    flexBasis: 190,
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 4,
  },
  roleEmoji: {
    fontSize: 26,
  },
  roleName: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleBlurb: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  closing: {
    borderRadius: 18,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  closingTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 29,
    maxWidth: 560,
  },
  closingBody: {
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 520,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
