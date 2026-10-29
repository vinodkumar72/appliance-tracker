import { Stack } from 'expo-router';
import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PageHero, PublicPage } from '@/components/public-page';
import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FAQ } from '@/lib/faq-content';
import { publicMetadata } from '@/lib/site';

/** Public page: frequently asked questions. */
/** Build-time metadata for the static HTML (SDK 58+); PublicPage's <Head> only updates after hydration. */
export function generateMetadata() {
  return publicMetadata({
    title: 'FAQ',
    description: 'Straight answers about what PropsLane does, what it costs, how roles and investor access work, and how your data is handled.',
    path: '/faq',
  });
}

export default function FaqScreen() {
  const theme = useTheme();

  return (
    <PublicPage
      title="FAQ"
      description="Straight answers about what PropsLane does, what it costs, how roles and investor access work, and how your data is handled."
      path="/faq">
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
