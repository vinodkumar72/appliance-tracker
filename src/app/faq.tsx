import { Stack } from 'expo-router';
import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PageHero, PublicPage } from '@/components/public-page';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const FAQ: { group: string; items: { q: string; a: string }[] }[] = [
  {
    group: 'Getting started',
    items: [
      {
        q: 'What is PropsLane?',
        a: 'Appliance and maintenance tracking for rental properties. Every appliance gets a record — model, serial number, warranty, lifespan, and its full repair history — with maintenance reminders, team roles, and a read-only window for the investors whose properties you manage.',
      },
      {
        q: 'Who is it for?',
        a: 'Property management companies first, from a landlord with a few homes to firms managing many buildings — and the owners and investors they serve, who get visibility without phone calls.',
      },
      {
        q: 'How do I start?',
        a: 'Tap "Start free", create an account, and name your company. You start on the free tier — no credit card, no time limit — and can invite your team by email once you\'re in.',
      },
      {
        q: 'What counts as a "unit"?',
        a: 'Plans are priced by the units you manage. A single-family home counts as 1 unit; a 20-unit building counts as 20. The free tier covers 3 units.',
      },
    ],
  },
  {
    group: 'Appliances & label scanning',
    items: [
      {
        q: 'What can I track for each appliance?',
        a: 'Type, brand, model and serial number, purchase date and price, warranty terms and expiry, age against typical lifespan, recurring maintenance schedules, and every repair with its cost and vendor.',
      },
      {
        q: 'Can PropsLane scan an appliance label?',
        a: 'Yes — photograph the label (the sticker with the model and serial number) and AI reads it straight into the form. Review what it captured before saving; AI can occasionally misread a worn label.',
      },
      {
        q: 'What happens to the label photos?',
        a: 'They\'re used only to extract the text, then discarded — PropsLane does not store your photos. Details are in our privacy policy.',
      },
      {
        q: 'What happens when an appliance is replaced?',
        a: 'Use "Replace" on the appliance: the old record is retired with its entire history preserved and linked to its successor, its reminders stop, and it no longer counts against your plan. Nothing about the machine\'s life is lost.',
      },
    ],
  },
  {
    group: 'Maintenance & warranties',
    items: [
      {
        q: 'Can I schedule recurring maintenance?',
        a: 'Yes — filter changes, HVAC service, tank flushes, anything on an interval. Common appliance types come with recommended schedules filled in automatically when you add them.',
      },
      {
        q: 'How do I know what\'s due?',
        a: 'The dashboard and Tasks board sort everything by urgency: overdue first, due soon next, upcoming after. Marking a task done resets its clock and writes the history entry for you.',
      },
      {
        q: 'Does it track warranties?',
        a: 'Yes. Each appliance\'s warranty status is shown on its record and flagged before it lapses, and the warranty report lists everything expiring in the next 30 and 90 days — so problems get addressed while coverage still applies.',
      },
    ],
  },
  {
    group: 'Teams & investors',
    items: [
      {
        q: 'Can my whole team use it?',
        a: 'Yes. Six roles — Owner, Admin, Manager, Technician, Viewer, and Investor — each seeing exactly what their job needs. Team members join by email invitation only, and access can be scoped to specific buildings or even single condo units.',
      },
      {
        q: 'Can the property owners I manage for see their properties?',
        a: 'Yes — invite them as Investors and they get a live, read-only view of their own properties and units: appliances, histories, upcoming maintenance. Nothing that isn\'t theirs.',
      },
      {
        q: 'Is my company\'s data private?',
        a: 'Yes. Every company\'s data is isolated, enforced by database-level security rules — not just hidden in the interface. We don\'t sell or share your data; see the privacy policy.',
      },
    ],
  },
  {
    group: 'Devices & offline',
    items: [
      {
        q: 'Does it work offline?',
        a: 'Yes — PropsLane is built offline-first. Log a repair in a basement with no signal and it saves on the spot, then syncs itself when you\'re back in coverage.',
      },
      {
        q: 'What devices does it run on?',
        a: 'iPhone, Android, and the web. The phone apps are built for field work — scanning labels, checking off tasks — while reports, team management, and billing live on the web.',
      },
    ],
  },
  {
    group: 'Reports, pricing & your data',
    items: [
      {
        q: 'Does PropsLane provide reports?',
        a: 'Yes, on the web: appliance inventory, maintenance due, repair and maintenance costs, and warranty expirations — filterable by property and time period, printable, and exportable to CSV.',
      },
      {
        q: 'What does it cost?',
        a: 'The free tier (3 units) is free forever, no credit card. Paid tiers are priced by unit count — see the pricing page — and you upgrade in-app whenever you outgrow the free tier. If a paid plan lapses, you drop back to free-tier limits; your data stays untouched.',
      },
      {
        q: 'Can I get my data out?',
        a: 'Yes — every report exports to CSV, including the full appliance inventory. Your data is yours.',
      },
      {
        q: 'Can I delete my account?',
        a: 'Yes — team members are removed by their company\'s administrator, and company owners can contact us to delete a company and its data entirely.',
      },
    ],
  },
];

/** schema.org FAQPage: lets search engines show these questions as rich results. */
const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.flatMap((section) =>
    section.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  ),
};

/** Public page: frequently asked questions. */
export default function FaqScreen() {
  const theme = useTheme();

  return (
    <PublicPage
      title="FAQ"
      description="Straight answers about what PropsLane does, what it costs, how roles and investor access work, and how your data is handled."
      path="/faq"
      jsonLd={FAQ_JSON_LD}>
      <Stack.Screen options={{ title: 'FAQ' }} />
      <PageHero
        emoji="💬"
        title="Frequently asked questions"
        subtitle="Straight answers about what PropsLane does, what it costs, and how your data is handled."
      />

      {FAQ.map((section) => (
        <Fragment key={section.group}>
          <Text role="heading" aria-level={2} style={[styles.group, { color: theme.tint }]}>{section.group.toUpperCase()}</Text>
          {section.items.map((item) => (
            <View key={item.q} style={styles.item}>
              <Text role="heading" aria-level={3} style={[styles.q, { color: theme.text }]}>{item.q}</Text>
              <Text style={[styles.a, { color: theme.textSecondary }]}>{item.a}</Text>
            </View>
          ))}
        </Fragment>
      ))}

      <View style={[styles.closing, { backgroundColor: theme.tintSoft }]}>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
          Didn't find your answer?
        </Text>
        <View style={styles.ctaRow}>
          <Button title="Contact us" href="/contact" />
          <Button title="Start free" variant="secondary" href="/sign-in?mode=signup" />
        </View>
      </View>
    </PublicPage>
  );
}

const styles = StyleSheet.create({
  group: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginTop: Spacing.three,
  },
  item: {
    gap: 4,
  },
  q: {
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  a: {
    fontSize: 14.5,
    lineHeight: 22,
  },
  closing: {
    borderRadius: 16,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
