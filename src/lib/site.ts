import type { Metadata } from 'expo-router/server';

/**
 * Site-wide constants for the public web pages: canonical URLs, default
 * metadata, and the list of routes reachable without an account.
 */
export const SITE_URL = 'https://propslane.com';
export const SITE_NAME = 'PropsLane';
export const SITE_TAGLINE = 'Appliance & maintenance tracking for property managers';
export const DEFAULT_DESCRIPTION =
  'Appliance, warranty, and maintenance tracking for property management companies — with a live, read-only window for the investors whose properties they manage. iOS, Android, and web; works offline.';
/** Preview image for link shares (served from public/). */
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

/** Web routes that need no account. Everything else is the app and is kept out of search. */
export const PUBLIC_PATHS = [
  '/',
  '/about',
  '/how-it-works',
  '/pricing',
  '/faq',
  '/contact',
  '/request-invite',
  '/privacy',
  '/sign-in',
] as const;

export function isPublicPath(pathname: string): boolean {
  return (PUBLIC_PATHS as readonly string[]).includes(pathname);
}

/**
 * Build-time metadata for a public page, returned from the route's
 * `generateMetadata()` export. Since SDK 58 only this reaches the static
 * HTML (crawlers, link previews); `<Head>` tags apply after hydration.
 * Mirrors what PublicPage renders: title, description, canonical, OG, Twitter.
 */
export function publicMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
}: {
  title?: string;
  description?: string;
  path?: string;
}): Metadata {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`;
  const url = path ? `${SITE_URL}${path}` : undefined;
  return {
    title: fullTitle,
    description,
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: OG_IMAGE,
      ...(url ? { url } : {}),
    },
    twitter: { card: 'summary', title: fullTitle, description, images: OG_IMAGE },
  };
}

/** Serializes structured data for a JSON-LD script tag, escaping `<` so it can't close the tag. */
export function jsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, '\u003c');
}
