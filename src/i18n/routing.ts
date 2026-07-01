import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

/**
 * i18n routing configuration for Advanti.
 *
 * Locales:
 *  - `en` (default) → served at `/` (no prefix)
 *  - `nl`           → served at `/nl/...`
 *  - `no`           → served at `/no/...`
 *
 * Iteration 1 keeps pathname segments identical across locales
 * (e.g. `/tjenester`, `/nl/tjenester`, `/no/tjenester`). Localized
 * pathnames (`/en/services`, `/nl/diensten`) can be added later in
 * a separate phase without changing the message-key architecture.
 */
export const locales = ["en", "nl", "no"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // `as-needed`: the default locale (`en`) is served without a prefix
  // at `/`, while non-default locales get a prefix (`/nl/...`, `/no/...`).
  localePrefix: "as-needed",
});

// i18n-aware navigation helpers (use these instead of next/link & next/navigation
// once components are migrated to next-intl).
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

/**
 * Map a next-intl locale (`en` | `nl` | `no`) to the corresponding BCP-47 tag
 * used by `Intl.NumberFormat` / `toLocaleString` / NumberFlow `locales`.
 *
 *  - `no` → `nb-NO` (Norwegian Bokmål)
 *  - `nl` → `nl-NL` (Dutch)
 *  - `en` → `en-US` (English, default)
 */
export function toIntlLocale(locale: string): string {
  return locale === "no" ? "nb-NO" : locale === "nl" ? "nl-NL" : "en-US";
}
