import { Href, Link, Redirect, usePathname } from 'expo-router';
import Head from 'expo-router/head';
import { ReactNode } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';

const logoMark = require('../../assets/images/logo-mark.png');

/** The PropsLane mark + wordmark, used in the nav and footer. A real link when `href` is given. */
export function BrandLockup({ size = 26, href }: { size?: number; href?: Href }) {
  const theme = useTheme();
  const content = (
    <>
      <Image
        source={logoMark}
        accessibilityLabel="PropsLane logo"
        style={{ width: size, height: size, borderRadius: size * 0.23 }}
      />
      <Text style={[styles.brand, { color: theme.text, fontSize: size * 0.65 + 0.5 }]}>
        Props<Text style={{ color: theme.tint }}>Lane</Text>
      </Text>
    </>
  );
  if (!href) return <View style={styles.brandRow}>{content}</View>;
  return (
    <Link href={href} asChild>
      <Pressable style={styles.brandRow}>{content}</Pressable>
    </Link>
  );
}

const NAV_LINKS: { label: string; path: Href }[] = [
  { label: 'About', path: '/about' },
  { label: 'How it works', path: '/how-it-works' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Contact', path: '/contact' },
];

/**
 * Shared top navigation for the public site. Sign-in lives top right.
 * Everything here is a real anchor (expo-router Link) so crawlers can follow it.
 */
export function PublicNav() {
  const theme = useTheme();
  const pathname = usePathname();

  return (
    <View style={styles.nav} role="navigation">
      <BrandLockup href="/" />
      <View style={styles.navLinks}>
        {NAV_LINKS.map((link) => {
          const active = pathname === link.path;
          return (
            <Link
              key={String(link.path)}
              href={link.path}
              style={[styles.navLink, { color: active ? theme.tint : theme.textSecondary }]}>
              {link.label}
            </Link>
          );
        })}
        <Link href="/sign-in" style={[styles.navLink, { color: theme.textSecondary }]}>
          Sign in
        </Link>
        <Link href="/sign-in?mode=signup" asChild>
          {/* Link's asChild slot needs a single style object, not an array. */}
          <Pressable style={StyleSheet.flatten([styles.signInButton, { backgroundColor: theme.tint }])}>
            <Text style={{ color: theme.onTint, fontWeight: '700', fontSize: 14 }}>Start free</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const FOOTER_LINKS: { label: string; path: Href }[] = [
  ...NAV_LINKS,
  { label: 'FAQ', path: '/faq' },
  { label: 'Request an invite', path: '/request-invite' },
  { label: 'Privacy policy', path: '/privacy' },
  { label: 'Sign in', path: '/sign-in' },
];

/** Shared footer for the public site. */
export function PublicFooter() {
  const theme = useTheme();
  return (
    <View style={[styles.footer, { borderTopColor: theme.border }]} role="contentinfo">
      <BrandLockup size={20} />
      <Text style={{ color: theme.textSecondary, fontSize: 12, textAlign: 'center' }}>
        Appliance & maintenance tracking for property managers — and the investors they serve.
      </Text>
      <View style={styles.footerLinks}>
        {FOOTER_LINKS.map((link) => (
          <Link
            key={String(link.path)}
            href={link.path}
            style={[styles.footerLink, { color: theme.textSecondary }]}>
            {link.label}
          </Link>
        ))}
      </View>
    </View>
  );
}

/** Consistent hero header for public pages: tinted icon badge, title (the page's h1), subtitle. */
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
      <Text role="heading" aria-level={1} style={[styles.heroTitle, { color: theme.text }]}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

/**
 * Page wrapper for public pages: sticky top nav, centered content column, footer.
 *
 * The page's search metadata (title, description, canonical, Open Graph,
 * Twitter) is produced at build time by each route's `generateMetadata()`
 * export via `publicMetadata()` in src/lib/site.ts — since SDK 58, `<Head>`
 * tags only apply after hydration and never reach the static HTML. `<Head>`
 * here just keeps the title current on client-side navigation. JSON-LD is
 * emitted by src/app/+html.tsx (see src/lib/structured-data.ts).
 */
export function PublicPage({
  title,
  children,
}: {
  title?: string;
  description?: string;
  path?: string;
  children: ReactNode;
}) {
  const theme = useTheme();
  // The public site is web-only; on the mobile apps these routes go home,
  // where the gate shows sign-in (signed out) or the app (signed in).
  if (Platform.OS !== 'web') {
    return <Redirect href="/" />;
  }
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
  return (
    <>
      <Head>
        <title>{fullTitle}</title>
      </Head>
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
    </>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brand: {
    fontWeight: '800',
    letterSpacing: -0.4,
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
