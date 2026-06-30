# Merge Notes — Upstream (Codehagen) tracking

This file tracks updates from the upstream repository (`Codehagen/advantiestate`)
and how they interact with our i18n fork (`Souhailned/advantiestate`).

## Git setup

| Remote | URL | Role |
|--------|-----|------|
| `origin` | `https://github.com/Souhailned/advantiestate.git` | Our fork (push/pull) |
| `upstream` | `https://github.com/Codehagen/advantiestate.git` | Codehagen's original (fetch only) |

**Workflow:** work on feature branches from `main`, push to `origin`. Periodically
fetch `upstream`, review changes, cherry-pick or merge what's relevant.

## How to review upstream updates

```bash
# Fetch latest from Codehagen
git fetch upstream --tags

# See what's new (commits not in our main)
git log HEAD..upstream/main --oneline

# See which files changed
git diff HEAD..upstream/main --stat

# See diff for specific conflict-prone files
git diff HEAD..upstream/main -- src/lib/navigation.ts
git diff HEAD..upstream/main -- content-collections.ts
git diff HEAD..upstream/main -- next.config.mjs
git diff HEAD..upstream/main -- src/app/layout.tsx
```

## Git aliases (optional, convenience)

```bash
git config alias.upstream-log '!git log HEAD..upstream/main --oneline'
git config alias.upstream-diff '!git diff HEAD..upstream/main --stat'
```

## Conflict-prone files (high risk)

These files are modified by our i18n work and will likely conflict when
merging upstream changes:

| File | Why it conflicts | Mitigation |
|------|-----------------|------------|
| `src/lib/navigation.ts` | Labels will become i18n keys | Resolve manually; preserve key structure |
| `content-collections.ts` | Will add `locale` field to schemas (Fase 4) | Resolve manually; preserve locale field |
| `src/app/layout.tsx` | Stripped to minimal root layout | Take upstream changes, re-apply to `[locale]/layout.tsx` |
| `next.config.mjs` | Added `createNextIntlPlugin` wrapper | Preserve wrapper; merge other config changes |
| `src/app/sitemap.ts` | Will become locale-aware (Fase 6) | Resolve manually; preserve hreflang logic |
| `src/content/**/*.mdx` | Will be split into `{no,nl,en}/` subdirs (Fase 4) | Take upstream NO content into `no/` subdir |

## Medium-risk files

| File | Why |
|------|-----|
| `src/lib/utils.ts` | `formatDate()` hardcoded `nb-NO` — will become locale-aware |
| Calculator components | `toLocaleString("nb-NO")` calls — will become locale-aware |
| `src/app/[locale]/page.tsx` (homepage) | Hardcoded NO copy — will become i18n keys |
| `src/components/site/Nav.tsx` | PANELS promo copy — will become i18n keys |
| `src/components/site/Footer.tsx` | Hardcoded footer copy — will become i18n keys |

## Low-risk files (usually merge cleanly)

- `src/components/ui/` — generic primitives, language-agnostic
- `src/app/api/` — route handlers, no locale
- `src/app/actions/` — server actions, no locale
- `src/styles/` — CSS, language-agnostic
- `tests/` — E2E tests (selectors may need locale-awareness later)
- `.github/workflows/` — CI config

## Merge log

Track each upstream merge here with date, commits, and resolution notes.

| Date | Upstream commits | Files conflicted | Resolution | Notes |
|------|-----------------|-----------------|------------|-------|
| _(none yet)_ | | | | |

## Categorization guide for upstream changes

| Category | Example | Action |
|----------|---------|--------|
| Bugfix / security | dependency upgrade, CVE patch | Merge — low conflict risk |
| Feature we want | new calculator, map improvement | Merge + translate in same PR |
| Feature not relevant | Norway-specific integration | Skip / don't cherry-pick |
| i18n-sensitive | changes to `navigation.ts`, `content-collections.ts`, MDX | Review manually, expect conflict |
| Refactor / cleanup | code reorganization | Merge if no conflict, else review |
