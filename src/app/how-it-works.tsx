import { Stack, useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { PageHero, PublicPage } from '@/components/public-page';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CAST: { emoji: string; name: string; role: string }[] = [
  { emoji: '👩‍💼', name: 'Alice', role: "Acme's owner. Runs the portfolio, sleeps fine." },
  { emoji: '🔧', name: 'Tina', role: 'Field technician. Phone in pocket, basements with no signal.' },
  { emoji: '🏠', name: 'Maria', role: 'Investor. Owns condo Unit 101. Used to call a lot.' },
  { emoji: '🔥', name: 'The water heater', role: 'Nine years old. The antagonist.' },
];

interface Chapter {
  time: string;
  title: string;
  body: string;
  images: number[];
}

const CHAPTERS: Chapter[] = [
  {
    time: '8:02 AM',
    title: 'Coffee and the dashboard',
    body:
      "Alice opens the app before her first sip. The whole portfolio reports in at once: every property and appliance she's responsible for, what's overdue, what's due this month, and which warranties are about to quietly lapse. No spreadsheet, no inbox archaeology — the day's shape in one screen.",
    images: [require('../../assets/demo/01-dashboard.png')],
  },
  {
    time: '8:15 AM',
    title: 'A closer look at Maple St',
    body:
      'One tap into the duplex. Two units with their own appliances, the shared building systems, and — right at the top — the owner: Ivan, the investor Acme manages the building for, his phone and email one tap away. Condo complexes work the same way, down to a different owner on every unit.',
    images: [require('../../assets/demo/02-property.png')],
  },
  {
    time: '8:20 AM',
    title: 'The antagonist reveals itself',
    body:
      "In the basement lives a nine-year-old water heater, and the app has been watching it for a while. The amber lifespan bar says what a spreadsheet never would: this machine is 9.2 years into a ~10-year life — budget for a replacement, not another repair. Its warranty expired last summer (flagged before it happened, for the record). And below, the paper trail: the $145 thermocouple repair, who fixed it, and the annual tank flush coming due. When someone does that flush, one tap on \"Mark done\" resets the reminder and writes the history entry itself.",
    images: [
      require('../../assets/demo/03-appliance-top.png'),
      require('../../assets/demo/04-appliance-history.png'),
    ],
  },
  {
    time: '10:40 AM',
    title: 'A new refrigerator joins the cast',
    body:
      "A tenant upgrade means a new appliance to track — which takes about thirty seconds. Photograph the appliance's label (the sticker with the model and serial number) and AI reads it straight into the form; an on-device reader covers the no-signal case. Choose the type and the recommended maintenance schedule writes itself. A water heater arrives already knowing it needs an annual flush.",
    images: [require('../../assets/demo/05-add-appliance.png')],
  },
  {
    time: '11:00 AM',
    title: "Tina's briefing",
    body:
      "The Tasks board is the field team's marching orders: overdue first, due-soon next, the future below — each row naming the appliance, the unit, and the property, so Tina knows exactly which door to knock on. She checks work off from her phone inside the unit. In a dead-signal basement, everything still saves; it syncs itself on the walk back to the truck.",
    images: [require('../../assets/demo/06-tasks.png')],
  },
  {
    time: '2:30 PM',
    title: 'A new hire gets exactly the right keys',
    body:
      "Acme brings on another technician. Adding them is one email — pick a role from six (owner down to read-only) and, if you want, scope their access to just the buildings they'll service, or even single condo units. Here, a technician is being limited to specific properties. Whatever someone's job is, that's precisely what they can see and touch — enforced in the database, not just the interface.",
    images: [require('../../assets/demo/07-roles.png')],
  },
  {
    time: '6:45 PM',
    title: 'Maria checks in — without calling',
    body:
      "Across town, Maria wonders how her condo is doing. She signs in and the entire app reshapes around her: one property, her unit's refrigerator, its upcoming filter change, its lapsed warranty — live, read-only, and nothing that isn't hers. Six months ago this was a phone call to Alice. Now it's a glance.",
    images: [require('../../assets/demo/08-investor.png')],
  },
];

/** Public page: the product explained as one day's story. */
export default function HowItWorksScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <PublicPage>
      <Stack.Screen options={{ title: 'How it works' }} />
      <PageHero
        emoji="📖"
        title="How it works"
        subtitle="One Tuesday at a property management company — an owner, a technician, an investor, and the nine-year-old water heater that tried to ruin everyone's week. Every screen below is the real product with sample data."
      />

      {/* The cast */}
      <View style={styles.castRow}>
        {CAST.map((member) => (
          <View
            key={member.name}
            style={[
              styles.castCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <Text style={styles.castEmoji}>{member.emoji}</Text>
            <Text style={[styles.castName, { color: theme.text }]}>{member.name}</Text>
            <Text style={[styles.castRole, { color: theme.textSecondary }]}>{member.role}</Text>
          </View>
        ))}
      </View>

      {CHAPTERS.map((chapter, index) => (
        <View key={chapter.time} style={styles.chapter}>
          <View style={styles.chapterHead}>
            <View style={[styles.timePill, { backgroundColor: theme.tintSoft }]}>
              <Text style={[styles.timeText, { color: theme.tint }]}>{chapter.time}</Text>
            </View>
            <View style={[styles.chapterLine, { backgroundColor: theme.border }]} />
            <Text style={[styles.chapterNumber, { color: theme.textSecondary }]}>
              {index + 1} / {CHAPTERS.length}
            </Text>
          </View>
          <Text style={[styles.chapterTitle, { color: theme.text }]}>{chapter.title}</Text>
          <Text style={[styles.chapterBody, { color: theme.textSecondary }]}>{chapter.body}</Text>
          {chapter.images.map((source, imageIndex) => (
            <View
              key={imageIndex}
              style={[styles.shotFrame, { borderColor: theme.border }]}>
              <Image source={source} style={styles.shotImage} resizeMode="cover" />
            </View>
          ))}
        </View>
      ))}

      {/* Epilogue */}
      <View style={[styles.epilogue, { backgroundColor: theme.tintSoft }]}>
        <Text style={[styles.epilogueEyebrow, { color: theme.tint }]}>EPILOGUE</Text>
        <Text style={[styles.epilogueTitle, { color: theme.text }]}>
          The water heater was replaced on schedule — not at 2 AM with a flooded basement.
        </Text>
        <Text style={[styles.epilogueBody, { color: theme.textSecondary }]}>
          That's the whole product: know every appliance, stay ahead of the failures, and keep
          every owner in the loop without another phone call.
        </Text>
        <View style={styles.ctaRow}>
          <Button title="Request an invite" onPress={() => router.push('/request-invite')} />
          <Button
            title="Try it yourself — free"
            variant="secondary"
            onPress={() => router.push('/sign-in')}
          />
        </View>
      </View>
    </PublicPage>
  );
}

const styles = StyleSheet.create({
  castRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  castCard: {
    flexGrow: 1,
    flexBasis: 170,
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three,
    gap: 4,
  },
  castEmoji: {
    fontSize: 26,
  },
  castName: {
    fontSize: 15,
    fontWeight: '700',
  },
  castRole: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  chapter: {
    gap: Spacing.two,
    paddingTop: Spacing.five,
  },
  chapterHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  timePill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    fontVariant: ['tabular-nums'],
  },
  chapterLine: {
    flex: 1,
    height: 1,
  },
  chapterNumber: {
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  chapterTitle: {
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  chapterBody: {
    fontSize: 15,
    lineHeight: 24,
    maxWidth: 640,
  },
  shotFrame: {
    width: '100%',
    aspectRatio: 1280 / 800,
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
  epilogue: {
    borderRadius: 18,
    padding: Spacing.five,
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  epilogueEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  epilogueTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 29,
    maxWidth: 520,
  },
  epilogueBody: {
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
