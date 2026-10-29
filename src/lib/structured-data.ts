import { FAQ } from './faq-content';
import { DEFAULT_DESCRIPTION, OG_IMAGE, SITE_NAME, SITE_URL } from './site';

/** schema.org structured data for the homepage: who we are and what the product is. */
const HOME = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: OG_IMAGE,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'iOS, Android, Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  },
];

/** schema.org FAQPage: lets search engines show the questions as rich results. */
const FAQ_PAGE = {
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

/**
 * JSON-LD blocks for a public page, keyed by pathname. Rendered into the
 * static HTML by src/app/+html.tsx: since SDK 58 route metadata comes from
 * `generateMetadata()`, which has no field for script tags, and `<Head>`
 * only applies after hydration.
 */
export function structuredDataFor(pathname: string): object[] {
  switch (pathname) {
    case '/':
      return HOME;
    case '/faq':
      return [FAQ_PAGE];
    default:
      return [];
  }
}
