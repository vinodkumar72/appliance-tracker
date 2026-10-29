import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { isPublicPath, jsonLd } from '@/lib/site';
import { structuredDataFor } from '@/lib/structured-data';

/**
 * Root HTML document for static rendering (web.output: "static"). Every route
 * is pre-rendered into this shell at export time, so the public pages carry
 * their full content, title, and meta tags in the HTML itself — readable by
 * every crawler and link scraper, with or without JavaScript.
 *
 * Runs only in Node.js at export time: no browser APIs, no global CSS imports.
 * Per-page tags come from each route's generateMetadata() (SDK 58+: <Head>
 * tags only apply after hydration, so they no longer reach the static HTML);
 * JSON-LD and the app-screen noindex are emitted here from the pathname.
 *
 * The server document context carries the router's own head/body nodes and
 * element attributes; omitting bodyNodes breaks hydration (SDK 58 migration).
 */
export default function Root({
  children,
  pathname,
}: PropsWithChildren<{
  /** The route being rendered; supplied by the static renderer, absent in other contexts. */
  pathname?: string;
}>) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();
  // Only the public marketing pages belong in search results. Layouts no
  // longer contribute head tags to the static HTML (SDK 58), so the noindex
  // for app screens is emitted here, where the pathname is known.
  const noindex = pathname != null && !isPublicPath(pathname);
  const schemas = pathname != null ? structuredDataFor(pathname) : [];
  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        {headNodes}
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#2158E0" />
        {noindex ? <meta name="robots" content="noindex" /> : null}
        {schemas.map((schema, i) => (
          <script key={i} type="application/ld+json">
            {jsonLd(schema)}
          </script>
        ))}
        {/* Full-height body + no body scroll, so ScrollView behaves like native. */}
        <ScrollViewStyleReset />
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
