import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

/**
 * Next.js 16 locale proxy (replaces `middleware.ts`).
 *
 * Handles automatic locale detection, redirects users to their
 * preferred locale, and enforces locale prefixes for non-default
 * locales (`/nl/...`, `/no/...`). The default locale (`en`) is
 * served at `/` without a prefix.
 */
export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for:
  //  - API routes (`/api`, `/trpc`)
  //  - Next.js internals (`/_next`, `/_vercel`)
  //  - Files containing a dot (e.g. `favicon.ico`, `robots.txt`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
