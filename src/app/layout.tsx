import { Inter } from "next/font/google";
import "./globals.css";

// D3: Inter for both body and display. The italic axis is mandatory — every
// editorial heading uses an italic-flourish span. var(--font-inter) is read by
// the design system's --font-display / --font-body tokens (advanti-design.css).
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
  variable: "--font-inter",
});

/**
 * Minimal root layout.
 *
 * With i18n (next-intl), the `<html lang>` and `<body>` chrome live here at the
 * root so that non-locale route handlers (api/, sitemap.ts, robots.ts) still
 * have a valid document shell. The active `lang` is set dynamically from the
 * `[locale]` segment via the `setRequestLocale` flow in
 * `src/app/[locale]/layout.tsx`.
 *
 * All visible chrome (Nav, Footer, analytics providers, StructuredData,
 * MotionProvider, skip-link) has moved to the locale layout so it can be
 * rendered per-locale.
 *
 * Note: `lang="en"` is the default-locale fallback. The locale layout overrides
 * it at runtime by setting `document.documentElement.lang` via a small client
 * effect (see LocaleHtmlLang below).
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={inter.variable}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased selection:bg-light-blue selection:text-warm-grey">
        {children}
      </body>
    </html>
  );
}
