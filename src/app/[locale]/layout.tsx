import type { Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { TrackingListener } from "@/components/analytics/TrackingListener";
import { Footer } from "@/components/site/Footer";
import { MotionProvider } from "@/components/MotionProvider";
import { Nav } from "@/components/site/Nav";
import { navGroups } from "@/lib/navigation";
import { baseMetadata } from "@/lib/utils";
import StructuredData from "@/components/StructuredData";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing, type Locale } from "@/i18n/routing";

// Pre-generate all locales so static rendering works for every language.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Locale layout — renders the visible chrome (Nav, Footer, analytics,
 * StructuredData, MotionProvider, skip-link) per-locale.
 *
 * The `<html>` / `<body>` shell lives in the root `layout.tsx`; this nested
 * layout injects locale-aware providers inside `<body>`. The active `lang` is
 * synced to `document.documentElement.lang` via an inline script so that
 * non-default locales (`nl`, `no`) get the correct HTML lang attribute without
 * a hydration mismatch (the root layout defaults to `lang="en"`).
 */
export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) {
    notFound();
  }
  const locale = rawLocale as Locale;

  // Enable static rendering for this locale.
  setRequestLocale(locale);

  // Sync <html lang> for non-default locales (default `en` is already set
  // in the root layout, but we set it unconditionally to stay correct).
  const langScript = `document.documentElement.lang=${JSON.stringify(locale)}`;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: langScript }} />
      <head>
        <StructuredData type="organization" />
        <StructuredData type="realEstateAgent" />
        <StructuredData type="website" />
      </head>
      <NextIntlClientProvider>
        <GoogleTagManager />
        <TrackingListener />
        <Nav groups={navGroups} />
        <a href="#hovedinnhold" className="skip-link">
          Hopp til innhold
        </a>
        <main id="hovedinnhold" tabIndex={-1}>
          <MotionProvider>{children}</MotionProvider>
        </main>
        <Footer />
        {/* Only on real Vercel deploys — locally/CI the insights script 404s
            and trips the zero-console-error test assertions. */}
        {process.env.VERCEL ? <Analytics /> : null}
      </NextIntlClientProvider>
    </>
  );
}

// Site-wide metadata defaults. Every real page overrides these via
// constructMetadata(); the locale layout deliberately carries NO canonical.
// TODO(i18n): make title/description locale-aware in Fase 2.
export const metadata = baseMetadata();

export const viewport: Viewport = {
  themeColor: "#2c2825",
};
