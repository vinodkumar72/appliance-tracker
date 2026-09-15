import { useRouter } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { PublicPage } from '@/components/public-page';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

const PAINS: { title: string; body: string }[] = [
  {
    title: 'The spreadsheet nobody trusts',
    body: 'Model numbers in one file, warranty PDFs in an inbox, repair invoices in a drawer. When the water heater fails, the answers aren’t where you are.',
  },
  {
    title: 'Maintenance that only happens after the breakdown',
    body: 'Filters and flushes that cost $20 get skipped — until they become the $1,400 emergency replacement and an angry tenant.',
  },
  {
    title: 'Owners calling to ask what happened',
    body: 'Every repair triggers the same phone call: what broke, what did it cost, was it under warranty? Answering it is a job in itself.',
  },
];

const MANAGER_POINTS = [
  'Every appliance on record — brand, model, serial, purchase price, warranty — organized by property and unit.',
  'A live task board of what’s due, overdue, and coming, across all properties at once.',
  'Field technicians log repairs from their phone in the unit — even with no signal.',
  'Warranty alerts before coverage lapses, so eligible repairs never get paid out of pocket.',
  'Role-based access for the whole team, each seeing exactly what their job needs.',
];

const OWNER_POINTS = [
  'A private, read-only view of your property — and only yours, down to a single condo unit.',
  'Full repair history with real costs and vendors, as it happens.',
  'Warranty status and appliance age at a glance — replacement budgeting without surprises.',
  'One emailed invitation and you’re in, on the web or the mobile app.',
];

const HIGHLIGHTS: { emoji: string; title: string; body: string }[] = [
  {
    emoji: '📷',
    title: 'Scan, don’t type',
    body: 'Photograph the appliance label and AI fills in brand, model, and serial — offline reader as backup.',
  },
  {
    emoji: '🗓️',
    title: 'Maintenance on rails',
    body: 'Recurring tasks create themselves per appliance type; a live board shows what’s overdue and due soon.',
  },
  {
    emoji: '🛡️',
    title: 'Warranties watched',
    body: 'Expiry alerts before coverage lapses, and lifespan gauges for repair-or-replace calls.',
  },
  {
    emoji: '🏢',
    title: 'Built for real buildings',
    body: 'Houses, duplexes, condos — units with their own appliances and their own owners.',
  },
  {
    emoji: '👥',
    title: 'Investor portal',
    body: 'Owners see their property live — repairs, costs, warranties — read-only, scoped to what they own.',
  },
  {
    emoji: '📴',
    title: 'Offline-first everywhere',
    body: 'iPhone, Android, and web on one account. Work with no signal; it syncs itself when you’re back.',
  },
];

const STEPS: { title: string; body: string }[] = [
  { title: 'Create your company', body: 'Request an invite and start your trial — no card, no setup call.' },
  {
    title: 'Walk the units, scan the labels',
    body: 'Point your phone at each appliance’s label; records build themselves, recommended maintenance included.',
  },
  {
    title: 'Invite the team and the owners',
    body: 'Email invitations carry the right role and access automatically.',
  },
  {
    title: 'Work the task list',
    body: 'Overdue, due soon, upcoming — mark done from the field, and the history writes itself.',
  },
];

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.sectionEyebrow, { color: theme.tint }]}>{eyebrow}</Text>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    </View>
  );
}

/** Public marketing homepage shown to signed-out visitors at "/". */
export function Landing() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <PublicPage>
      {/* Hero: pitch + the appliance-label plate */}
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <View style={[styles.eyebrowPill, { backgroundColor: theme.tintSoft }]}>
            <Text style={[styles.eyebrowText, { color: theme.tint }]}>
              FOR PROPERTY MANAGEMENT COMPANIES & INVESTORS
            </Text>
          </View>
          <Text style={[styles.heroTitle, { color: theme.text }]}>
            Every appliance in every unit, accounted for.
          </Text>
          <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
            Maintenance, warranties, and repairs for property management companies — with a live,
            read-only window for the investors whose properties you manage.
          </Text>
          <View style={styles.ctaRow}>
            <Button title="Request an invite" onPress={() => router.push('/request-invite')} />
            <Button
              title="See how it works"
              variant="secondary"
              onPress={() => router.push('/how-it-works')}
            />
          </View>
          <Text style={[styles.heroFine, { color: theme.textSecondary }]}>
            iOS · Android · Web — works offline, syncs itself
          </Text>
        </View>

        <View
          style={[
            styles.plateCard,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <View style={[styles.plateHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.plateMonoBold, { color: theme.text }]}>APPLIANCE LABEL</Text>
            <Text style={[styles.plateMono, { color: theme.textSecondary }]}>#A-0114</Text>
          </View>
          {[
            ['BRAND', 'Whirlpool'],
            ['MODEL', 'WRF535SWHZ'],
            ['SERIAL', 'WH8834021'],
            ['UNIT', '412 Maple St — A'],
          ].map(([k, v]) => (
            <View key={k} style={styles.plateRow}>
              <Text style={[styles.plateMono, { color: theme.textSecondary }]}>{k}</Text>
              <Text style={[styles.plateMonoBold, { color: theme.text }]}>{v}</Text>
            </View>
          ))}
          <View style={[styles.plateScan, { backgroundColor: theme.tintSoft }]}>
            <Text style={[styles.plateMonoBold, { color: theme.tint }]}>
              📷 SCANNED → RECORD CREATED IN 6 SECONDS
            </Text>
          </View>
        </View>
      </View>

      {/* The problem */}
      <SectionHead
        eyebrow="THE PROBLEM"
        title="Appliances are where portfolios quietly leak money."
      />
      <View style={styles.painGrid}>
        {PAINS.map((pain) => (
          <View key={pain.title} style={[styles.pain, { borderLeftColor: theme.danger }]}>
            <Text style={[styles.painTitle, { color: theme.text }]}>{pain.title}</Text>
            <Text style={[styles.painBody, { color: theme.textSecondary }]}>{pain.body}</Text>
          </View>
        ))}
      </View>

      {/* Two audiences */}
      <SectionHead eyebrow="TWO AUDIENCES, ONE SYSTEM" title="Managers run it. Owners see it." />
      <View style={styles.split}>
        <View
          style={[
            styles.audience,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Text style={[styles.audienceWho, { color: theme.tint }]}>
            FOR PROPERTY MANAGEMENT COMPANIES
          </Text>
          <Text style={[styles.audienceTitle, { color: theme.text }]}>
            Your whole portfolio, operational.
          </Text>
          {MANAGER_POINTS.map((point) => (
            <View key={point} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: theme.tint }]} />
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{point}</Text>
            </View>
          ))}
        </View>
        <View
          style={[
            styles.audience,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Text style={[styles.audienceWho, { color: theme.tint }]}>FOR OWNERS & INVESTORS</Text>
          <Text style={[styles.audienceTitle, { color: theme.text }]}>
            Your asset, without the phone calls.
          </Text>
          {OWNER_POINTS.map((point) => (
            <View key={point} style={styles.bulletRow}>
              <View style={[styles.bullet, { backgroundColor: theme.tint }]} />
              <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{point}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Feature grid */}
      <SectionHead eyebrow="WHAT'S INSIDE" title="Built around the appliance, not the paperwork." />
      <View style={styles.grid}>
        {HIGHLIGHTS.map((h) => (
          <View
            key={h.title}
            style={[
              styles.card,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <View style={[styles.cardEmojiTile, { backgroundColor: theme.tintSoft }]}>
              <Text style={styles.cardEmoji}>{h.emoji}</Text>
            </View>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{h.title}</Text>
            <Text style={[styles.cardBody, { color: theme.textSecondary }]}>{h.body}</Text>
          </View>
        ))}
      </View>

      {/* Getting started */}
      <SectionHead eyebrow="GETTING STARTED" title="Live before lunch." />
      <View style={styles.stepsRow}>
        {STEPS.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <Text style={[styles.stepNumber, { color: theme.tint, borderBottomColor: theme.tint }]}>
              {String(index + 1).padStart(2, '0')}
            </Text>
            <Text style={[styles.stepTitle, { color: theme.text }]}>{step.title}</Text>
            <Text style={[styles.stepBody, { color: theme.textSecondary }]}>{step.body}</Text>
          </View>
        ))}
      </View>

      {/* Closing CTA */}
      <View style={[styles.closing, { backgroundColor: theme.tintSoft }]}>
        <Text style={[styles.closingTitle, { color: theme.text }]}>
          Know every appliance. Keep every owner. Skip every surprise.
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
  hero: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.four,
    paddingVertical: Spacing.five,
  },
  heroCopy: {
    flexGrow: 1,
    flexBasis: 380,
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  eyebrowPill: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 44,
    letterSpacing: -0.8,
    maxWidth: 520,
  },
  heroSub: {
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 500,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  heroFine: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  plateCard: {
    flexGrow: 1,
    flexBasis: 280,
    maxWidth: 360,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: 8,
    transform: [{ rotate: '1.5deg' }],
  },
  plateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    paddingBottom: 8,
    marginBottom: 4,
  },
  plateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  plateMono: {
    fontFamily: MONO,
    fontSize: 12.5,
  },
  plateMonoBold: {
    fontFamily: MONO,
    fontSize: 12.5,
    fontWeight: '700',
  },
  plateScan: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  sectionHead: {
    gap: 6,
    paddingTop: Spacing.four,
    alignItems: 'flex-start',
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    maxWidth: 620,
  },
  painGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  pain: {
    flexGrow: 1,
    flexBasis: 230,
    borderLeftWidth: 3,
    paddingLeft: Spacing.three,
    paddingVertical: 4,
    gap: 6,
  },
  painTitle: {
    fontSize: 15.5,
    fontWeight: '700',
  },
  painBody: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  split: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  audience: {
    flexGrow: 1,
    flexBasis: 320,
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  audienceWho: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  audienceTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  bullet: {
    width: 10,
    height: 10,
    borderRadius: 3,
    marginTop: 5,
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  card: {
    flexGrow: 1,
    flexBasis: 230,
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 8,
  },
  cardEmojiTile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  cardEmoji: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.four,
  },
  step: {
    flexGrow: 1,
    flexBasis: 160,
    gap: 6,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700',
    borderBottomWidth: 2,
    paddingBottom: 6,
    alignSelf: 'flex-start',
    fontVariant: ['tabular-nums'],
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  closing: {
    borderRadius: 18,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  closingTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 31,
    maxWidth: 480,
  },
});
