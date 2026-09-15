import { Redirect, usePathname, useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const NAV_LINKS: { label: string; path: string }[] = [
  { label: 'About', path: '/about' },
  { label: 'How it works', path: '/how-it-works' },
  { label: 'Pricing', path: '/pricing' },
];

/** Shared top navigation for the public site. Sign-in lives top right. */
export function PublicNav() {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.nav}>
      <Text style={[styles.brand, { color: theme.text }]} onPress={() => router.push('/')}>
        🏠 Appliance Tracker
      </Text>
      <View style={styles.navLinks}>
        {NAV_LINKS.map((link) => {
          const active = pathname === link.path;
          return (
            <Text
              key={link.path}
              onPress={() => router.push(link.path as never)}
              style={[
                styles.navLink,
                { color: active ? theme.tint : theme.textSecondary },
              ]}>
              {link.label}
            </Text>
          );
        })}
        <Pressable
          onPress={() => router.push('/sign-in')}
          style={({ pressed }) => [
            styles.signInButton,
            { backgroundColor: theme.tint, opacity: pressed ? 0.8 : 1 },
          ]}>
          <Text style={{ color: theme.onTint, fontWeight: '700', fontSize: 14 }}>Sign in</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Shared footer for the public site. */
export function PublicFooter() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <View style={[styles.footer, { borderTopColor: theme.border }]}>
      <Text style={{ color: theme.text, fontSize: 14, fontWeight: '700' }}>
        🏠 Appliance Tracker
      </Text>
      <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center' }}>
        Appliance maintenance, warranties, and repairs — for property managers and the investors
        they serve.
      </Text>
      <View style={styles.footerLinks}>
        {[
          ...NAV_LINKS,
          { label: 'Request an invite', path: '/request-invite' },
          { label: 'Sign in', path: '/sign-in' },
        ].map((link) => (
          <Text
            key={link.path}
            onPress={() => router.push(link.path as never)}
            style={[styles.footerLink, { color: theme.textSecondary }]}>
            {link.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Consistent hero header for public pages: tinted icon badge, title, subtitle. */
export function PageHero({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.hero}>
      <View style={[styles.heroBadge, { backgroundColor: theme.tintSoft }]}>
        <Text style={styles.heroEmoji}>{emoji}</Text>
      </View>
      <Text style={[styles.heroTitle, { color: theme.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

/** Page wrapper for public pages: sticky top nav, centered content column, footer. */
export function PublicPage({ children }: { children: ReactNode }) {
  const theme = useTheme();
  // The public site is web-only; on the mobile apps these routes go home,
  // where the gate shows sign-in (signed out) or the app (signed in).
  if (Platform.OS !== 'web') {
    return <Redirect href="/" />;
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      stickyHeaderIndices={[0]}>
      <View
        style={[
          styles.navWrap,
          { backgroundColor: theme.background, borderBottomColor: theme.border },
        ]}>
        <View style={styles.inner}>
          <PublicNav />
        </View>
      </View>
      <View style={styles.contentWrap}>
        <View style={[styles.inner, styles.content]}>{children}</View>
      </View>
      <View style={styles.footerWrap}>
        <View style={styles.inner}>
          <PublicFooter />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  navWrap: {
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  contentWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  footerWrap: {
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  content: {
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  brand: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  navLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  signInButton: {
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.four,
    marginTop: Spacing.three,
    borderTopWidth: 1,
  },
  footerLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  heroBadge: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 40,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    maxWidth: 620,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    maxWidth: 560,
  },
});
