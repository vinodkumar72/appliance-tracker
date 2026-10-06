import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Root HTML document for static rendering (web.output: "static"). Every route
 * is pre-rendered into this shell at export time, so the public pages carry
 * their full content, title, and meta tags in the HTML itself — readable by
 * every crawler and link scraper, with or without JavaScript.
 *
 * Runs only in Node.js at export time: no browser APIs, no global CSS imports.
 * Per-page tags come from <Head> in src/components/public-page.tsx.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#2158E0" />
        {/* Full-height body + no body scroll, so ScrollView behaves like native. */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
