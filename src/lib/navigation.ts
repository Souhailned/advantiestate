/**
 * Navigation registry — browser-safe, pure static data.
 * No content-collections import, no react import.
 *
 * Dynamic routes are registered as PATTERN entries only
 * (e.g. "/blog/[slug]") — never individual slugs.
 *
 * Entries with inNav: false are pages that are deliberately outside the
 * nav/footer but still registered so parentChain() can resolve them.
 */

export type GroupId = "tjenester" | "innsikt" | "om-oss";

/** Bylenke for footer-kolonnen og Innsikt-panelet — ren datatype, delt
 *  mellom server-resolveren (navigationServer) og klientkomponentene. */
export type CityLink = { name: string; slug: string };

/** Byene som kan ha eiendomslistinger — speiler ListingPost.city-enumet i
 *  content-collections.ts + CITY_LABELS i /eiendommer. Brukes i Eiendommer-
 *  dropdownen; hver by lenker til /eiendommer?by={slug} (forhåndsfiltrert).
 *  Statisk (ikke content-avledet), så Nav (klient) slipper en server-prop. */
export const EIENDOM_CITIES: { slug: string; label: string }[] = [
  { slug: "bodo", label: "Bodø" },
  { slug: "tromso", label: "Tromsø" },
  { slug: "harstad", label: "Harstad" },
  { slug: "alta", label: "Alta" },
  { slug: "narvik", label: "Narvik" },
  { slug: "lofoten", label: "Lofoten" },
  { slug: "mo-i-rana", label: "Mo i Rana" },
];

export interface NavEntry {
  /** Absolute path or pattern (e.g. "/blog/[slug]"). */
  path: string;
  /** i18n message key (e.g. "Navigation.home") — resolved by consumers via
   *  next-intl's t(). Falls back to raw string if not a recognised key. */
  label: string;
  parent: string | null;
  inNav?: boolean;
  inFooter?: boolean;
  /** Nav dropdown group this entry belongs to. */
  navGroup?: GroupId;
  /** i18n message key for the description, resolved by consumers via t(). */
  description?: string;
}

export const REGISTRY: NavEntry[] = [
  // ── root ────────────────────────────────────────────────────────────────
  { path: "/", label: "Navigation.home", parent: null },

  // ── tjenester group ─────────────────────────────────────────────────────
  // /tjenester is the parent (emphasized first link in the panel column).
  {
    path: "/tjenester",
    label: "Navigation.services",
    parent: null,
    inNav: true,
    inFooter: true,
    navGroup: "tjenester",
  },
  {
    path: "/tjenester/salg",
    label: "Navigation.servicesSalg",
    description: "Navigation.servicesSalgDesc",
    parent: "/tjenester",
    inNav: true,
    inFooter: true,
    navGroup: "tjenester",
  },
  {
    path: "/tjenester/verdivurdering",
    label: "Navigation.servicesVerdivurdering",
    description: "Navigation.servicesVerdivurderingDesc",
    parent: "/tjenester",
    inNav: true,
    inFooter: true,
    navGroup: "tjenester",
  },
  {
    path: "/tjenester/transaksjoner",
    label: "Navigation.servicesTransaksjoner",
    description: "Navigation.servicesTransaksjonerDesc",
    parent: "/tjenester",
    inNav: true,
    inFooter: true,
    navGroup: "tjenester",
  },
  {
    path: "/tjenester/utleie",
    label: "Navigation.servicesUtleie",
    description: "Navigation.servicesUtleieDesc",
    parent: "/tjenester",
    inNav: true,
    inFooter: true,
    navGroup: "tjenester",
  },
  // Label matches the page H1: "Markedsdata og rådgivning."
  {
    path: "/tjenester/radgivning",
    label: "Navigation.servicesRadgivning",
    description: "Navigation.servicesRadgivningDesc",
    parent: "/tjenester",
    inNav: true,
    inFooter: true,
    navGroup: "tjenester",
  },
  {
    path: "/tjenester/strategisk-radgivning",
    label: "Navigation.servicesStrategiskRadgivning",
    description: "Navigation.servicesStrategiskRadgivningDesc",
    parent: "/tjenester",
    inNav: true,
    inFooter: true,
    navGroup: "tjenester",
  },
  // Dynamic service × city routes
  { path: "/tjenester/verdivurdering/[by]", label: "Navigation.servicesVerdivurderingBy", parent: "/tjenester/verdivurdering" },
  { path: "/tjenester/salg/[by]", label: "Navigation.servicesSalgBy", parent: "/tjenester/salg" },
  { path: "/tjenester/utleie/[by]", label: "Navigation.servicesUtleieBy", parent: "/tjenester/utleie" },

  // ── næringsmegler — shown inside the Tjenester panel ─────────────────────
  {
    path: "/naringsmegler",
    label: "Navigation.naringsmegler",
    description: "Navigation.naringsmeglerDesc",
    parent: null,
    inNav: true,
    inFooter: true,
    navGroup: "tjenester",
  },
  { path: "/naringsmegler/[slug]", label: "Navigation.naringsmeglerSlug", parent: "/naringsmegler" },

  // ── eiendommer — plain top-level nav link ─────────────────────────────────
  {
    path: "/eiendommer",
    label: "Navigation.eiendommer",
    parent: null,
    inNav: true,
    inFooter: false,
  },
  { path: "/eiendommer/[slug]", label: "Navigation.eiendommerSlug", parent: "/eiendommer" },

  // ── innsikt group ────────────────────────────────────────────────────────
  // First entry is the emphasized parent link; remaining entries carry
  // description lines shown in the panel.
  {
    path: "/markedsinnsikt",
    label: "Navigation.markedsinnsikt",
    parent: null,
    inNav: true,
    inFooter: true,
    navGroup: "innsikt",
    description: "Navigation.markedsinnsiktDesc",
  },
  {
    path: "/markedsinnsikt/kart",
    label: "Navigation.markedsinnsiktKart",
    parent: "/markedsinnsikt",
    inNav: true,
    inFooter: true,
    navGroup: "innsikt",
    description: "Navigation.markedsinnsiktKartDesc",
  },
  {
    path: "/markedsrapport",
    label: "Navigation.markedsrapport",
    parent: "/markedsinnsikt",
    inNav: true,
    inFooter: true,
    navGroup: "innsikt",
    description: "Navigation.markedsrapportDesc",
  },
  {
    path: "/verktoy",
    label: "Navigation.verktoy",
    parent: "/markedsinnsikt",
    inNav: true,
    inFooter: true,
    navGroup: "innsikt",
    description: "Navigation.verktoyDesc",
  },
  // Kunnskapssenter — promoted to a top-level nav item (own breadcrumb root),
  // no longer nested under the Innsikt panel.
  {
    path: "/help",
    label: "Navigation.help",
    parent: null,
    inNav: true,
    inFooter: true,
    description: "Navigation.helpDesc",
  },
  {
    path: "/blog",
    label: "Navigation.blog",
    parent: "/markedsinnsikt",
    inNav: true,
    inFooter: true,
    navGroup: "innsikt",
    description: "Navigation.blogDesc",
  },
  // Help sub-pages
  { path: "/help/article/[slug]", label: "Navigation.helpArticleSlug", parent: "/help" },
  { path: "/help/category/[slug]", label: "Navigation.helpCategorySlug", parent: "/help" },
  // Blog sub-pages
  { path: "/blog/[slug]", label: "Navigation.blogSlug", parent: "/blog" },
  { path: "/blog/category/[slug]", label: "Navigation.blogCategorySlug", parent: "/blog" },
  // Verktøy sub-pages
  { path: "/verktoy/naringskalkulator", label: "Navigation.verktoyNaringskalkulator", parent: "/verktoy" },
  { path: "/verktoy/yield-kalkulator", label: "Navigation.verktoyYieldKalkulator", parent: "/verktoy" },
  { path: "/verktoy/roi-kalkulator", label: "Navigation.verktoyRoiKalkulator", parent: "/verktoy" },
  { path: "/verktoy/pris-verdivurdering", label: "Navigation.verktoyPrisVerdivurdering", parent: "/verktoy" },
  { path: "/verktoy/boliglan-kalkulator", label: "Navigation.verktoyBoliglanKalkulator", parent: "/verktoy" },

  // ── om oss group ─────────────────────────────────────────────────────────
  {
    path: "/om-oss",
    label: "Navigation.omOss",
    parent: null,
    inNav: true,
    inFooter: true,
    navGroup: "om-oss",
  },
  {
    path: "/personer",
    label: "Navigation.personer",
    parent: "/om-oss",
    inNav: true,
    inFooter: true,
    navGroup: "om-oss",
  },
  { path: "/personer/[slug]", label: "Navigation.personerSlug", parent: "/personer" },
  {
    path: "/kunder",
    label: "Navigation.kunder",
    parent: "/om-oss",
    inNav: true,
    inFooter: true,
    navGroup: "om-oss",
  },
  { path: "/kunder/[slug]", label: "Navigation.kunderSlug", parent: "/kunder" },
  {
    path: "/karriere",
    label: "Navigation.karriere",
    parent: "/om-oss",
    inNav: true,
    inFooter: true,
    navGroup: "om-oss",
  },
  {
    path: "/presserom",
    label: "Navigation.presserom",
    parent: "/om-oss",
    inNav: true,
    inFooter: true,
    navGroup: "om-oss",
  },
  { path: "/presserom/arkiv", label: "Navigation.presseromArkiv", parent: "/presserom" },
  { path: "/presserom/arkiv/[kvartal]", label: "Navigation.presseromArkivKvartal", parent: "/presserom/arkiv" },

  // ── kontakt — plain top-level nav link ────────────────────────────────────
  {
    path: "/kontakt",
    label: "Navigation.kontakt",
    parent: null,
    inNav: true,
    inFooter: true,
  },

  // ── portaler (gated — inNav: false, in footer for authenticated users) ────
  { path: "/analyseportal", label: "Navigation.analyseportal", parent: null, inNav: false, inFooter: true },
  { path: "/investorportal", label: "Navigation.investorportal", parent: null, inNav: false, inFooter: true },

  // ── legal ─────────────────────────────────────────────────────────────────
  { path: "/privacy", label: "Navigation.privacy", parent: null, inNav: false, inFooter: false },
  { path: "/terms", label: "Navigation.terms", parent: null, inNav: false, inFooter: false },

  // ── deliberately outside nav/footer (gated or landing pages) ─────────────
  { path: "/presentasjon", label: "Navigation.presentasjon", parent: null, inNav: false, inFooter: false },
  { path: "/verdivurdering", label: "Navigation.verdivurderingLanding", parent: null, inNav: false, inFooter: true },
  // Indexable conversion surface — reached via sitemap + cross-links (SeOgsa),
  // not primary nav. Parent gives it a Tjenester breadcrumb trail.
  { path: "/beslutningsgrunnlag", label: "Navigation.beslutningsgrunnlag", parent: "/tjenester", inNav: false, inFooter: false },
  { path: "/landing/verdivurdering", label: "Navigation.landingVerdivurdering", parent: null, inNav: false, inFooter: false },
  { path: "/sjekkliste-verdivurdering", label: "Navigation.sjekklisteVerdivurdering", parent: null, inNav: false, inFooter: false },
  // Reached from the Verktøy hub; mandate-registration form is forthcoming.
  { path: "/off-market-tilgang", label: "Navigation.offMarketTilgang", parent: "/verktoy", inNav: false, inFooter: false },

  // ── integrasjoner ─────────────────────────────────────────────────────────
  { path: "/integrasjoner", label: "Navigation.integrasjoner", parent: null, inNav: false, inFooter: false },
  { path: "/integrasjoner/[slug]", label: "Navigation.integrasjonerSlug", parent: "/integrasjoner" },
];

// ── helpers ──────────────────────────────────────────────────────────────────

/** All inNav:true top-level entries (parent: null). */
export function navItems(): NavEntry[] {
  return REGISTRY.filter((e) => e.inNav === true && e.parent === null);
}

/** Group entries ordered for panel rendering (inNav:true within each group). */
export const navGroups: Record<GroupId, NavEntry[]> = {
  tjenester: REGISTRY.filter((e) => e.navGroup === "tjenester" && e.inNav === true),
  innsikt: REGISTRY.filter((e) => e.navGroup === "innsikt" && e.inNav === true),
  "om-oss": REGISTRY.filter((e) => e.navGroup === "om-oss" && e.inNav === true),
};

/** Footer column definitions (byer column is injected from the server layer). */
export const footerColumns: Record<"tjenester" | "advanti", NavEntry[]> = {
  tjenester: REGISTRY.filter(
    (e) =>
      e.inFooter === true &&
      (e.navGroup === "tjenester" ||
        e.path === "/naringsmegler" ||
        e.path === "/verdivurdering") &&
      e.path !== "/tjenester" // parent row not shown as a plain link in footer
  ),
  advanti: [
    "/om-oss",
    "/kunder",
    "/markedsinnsikt",
    "/karriere",
    "/kontakt",
    "/presserom",
    "/analyseportal",
    "/investorportal",
    "/blog",
  ]
    .map((p) => REGISTRY.find((e) => e.path === p))
    .filter((e): e is NavEntry => !!e),
};

/**
 * Returns the ancestor chain for path, from root to the closest registered
 * ancestor. Returns null if path is unregistered. Accepts an optional
 * registry override (used in tests for circular-guard validation).
 *
 * Never throws. Uses a visited-set + depth cap to handle malformed registries.
 */
export function parentChain(
  path: string,
  registry: NavEntry[] = REGISTRY,
): NavEntry[] | null {
  const cleanPath = stripHash(path);

  function findEntry(p: string): NavEntry | undefined {
    return (
      registry.find((e) => e.path === p) ??
      registry.find((e) => matchesPattern(e.path, p))
    );
  }

  const entry = findEntry(cleanPath);
  if (!entry) return null;

  const chain: NavEntry[] = [];
  const visited = new Set<string>();
  let current: NavEntry | undefined = entry;
  const MAX_DEPTH = 20;

  while (current && chain.length < MAX_DEPTH) {
    if (visited.has(current.path)) break; // circular guard
    visited.add(current.path);
    chain.unshift(current);
    if (!current.parent) break;
    current = findEntry(current.parent);
  }

  return chain;
}

/** Strip hash fragment from a path string. */
export function stripHash(path: string): string {
  return path.split("#")[0];
}

/** Returns true if a pattern path (with [param] segments) matches a real path. */
function matchesPattern(pattern: string, real: string): boolean {
  const pp = pattern.split("/");
  const rp = real.split("/");
  if (pp.length !== rp.length) return false;
  return pp.every((part, i) => part.startsWith("[") || part === rp[i]);
}
