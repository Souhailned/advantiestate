"use client"

// Interactive shell for the Markedsinnsikt editorial page.
// Ported from advanti/markedsinnsikt.html + markedsinnsikt.js.
// Holds the sector sidebar nav, sub-tabs, datasets and the six content views.

import { Fragment, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import { SeOgsa } from "@/components/site/SeOgsa"
import { MapErrorBoundary } from "./MapErrorBoundary"
import { trackEvent } from "@/lib/analytics"
import {
  QUARTERS,
  RATES,
  YIELD,
  LEIE,
  VOLUME,
  VACANCY,
  TX,
  CITIES,
  fmtNoComma,
  fmtPct1,
  fmtNum,
  type Segment,
} from "./marketData"
import { LATEST_RELEASE_STAMP, NEXT_RELEASE_DATE } from "./marketReleases"

// Leaflet needs `window`, so the overview map loads browser-only. This
// dynamic({ ssr: false }) call is legal here because MarkedsinnsiktShell is a
// Client Component — Next 16 forbids ssr:false inside Server Components.
const NordNorgeLeafletMap = dynamic(
  () =>
    import("./maps/NordNorgeLeafletMap").then((m) => m.NordNorgeLeafletMap),
  { ssr: false, loading: () => <div className="mi-map-loading" /> },
)

// recharts (~100KB) is heavy, and its ResponsiveContainer cannot meaningfully
// server-render anyway — so the charts load on demand. The 360px skeleton
// matches CHART_HEIGHT and locks layout to avoid a shift on first paint.
// See PERFORMANCE_PLAN.md Phase 2.1.
const ChartSkeleton = () => (
  <div
    className="mi-chart-skeleton"
    style={{
      width: "100%",
      height: 360,
      borderRadius: 8,
      background: "rgba(44, 40, 37, 0.04)",
    }}
    aria-hidden="true"
  />
)

const MarketBarChart = dynamic(
  () => import("./charts/MarketBarChart").then((m) => m.MarketBarChart),
  { ssr: false, loading: ChartSkeleton },
)

const MarketLineChart = dynamic(
  () => import("./charts/MarketLineChart").then((m) => m.MarketLineChart),
  { ssr: false, loading: ChartSkeleton },
)

// ════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════
// Data (QUARTERS, RATES, YIELD, LEIE, VOLUME, VACANCY, TX, CITIES) and the
// number formatters now live in ./marketData so the server-rendered
// MarketDataSummary tables share the exact same source.

const SECTOR_COLORS = [
  "var(--warm-grey)",
  "var(--warm-grey-85)",
  "var(--warm-grey-85)",
]

// ════════════════════════════════════════════════════════════════════════
// SE OGSÅ — Gå dypere (data-sektorene yield/leie/tx/ledighet)
// Delt konstant — alle fire sektorvisninger bruker de samme tre lenkene.
// Label tekster hentes fra translations (Shell.gaDypere*) i komponenten.
// ════════════════════════════════════════════════════════════════════════

const GA_DYPERE_HREFS = [
  "/markedsinnsikt/kart",
  "/markedsrapport",
  "/help/article/prime-yield",
]

type SectorId =
  | "yield"
  | "leie"
  | "tx"
  | "ledighet"
  | "kart"
  | "rapporter"

const SECTOR_IDS: SectorId[] = ["yield", "leie", "tx", "ledighet", "kart", "rapporter"]

// Sub-tab segment ids — labels come from translations (Shell.seg*) in components.
const SUB_TAB_IDS: Segment[] = ["kontor", "handel", "logistikk"]

// ════════════════════════════════════════════════════════════════════════
// MARKEDSINNSIKT v2 — range windowing + interactive legend
// ════════════════════════════════════════════════════════════════════════
// Two editorial interactions ported from markedsinnsikt-v2.html: a time-range
// selector and a clickable legend. Both operate on the existing real series —
// no forecast/placeholder data (the v2 "Prognose 2026" toggle is deferred to
// TODOS.md until verified forecast numbers exist).

const RANGE_IDS: { id: "3y" | "5y"; quarters: number }[] = [
  { id: "3y", quarters: 12 },
  { id: "5y", quarters: 20 },
]
type RangeId = (typeof RANGE_IDS)[number]["id"]

// Keep the last `n` entries (most recent quarters). The historical series spans
// exactly five years (20 quarters), so "5 år" shows everything and "3 år"
// trims to the last 12. The v2 mock's third range ("Alt") only differed once
// the dropped forecast extended the series, so it is intentionally omitted.
function windowTail<T>(arr: T[], n: number): T[] {
  return arr.length <= n ? arr : arr.slice(arr.length - n)
}

// Segmented filter rendered as a radiogroup, not a tabset: each option just
// re-filters the same chart (there is no separate tabpanel per option), so
// role="radio"/aria-checked is the honest semantic. Roving tabindex + arrow
// keys give it the radio-group keyboard contract the old role="tab" lacked.
function SegmentTabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  items: readonly { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  ariaLabel: string
  className: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const last = items.length - 1
    let next = -1
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = i === last ? 0 : i + 1
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = i === 0 ? last : i - 1
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = last
    else return
    e.preventDefault()
    onChange(items[next].id)
    refs.current[next]?.focus()
  }
  return (
    <div className={className} role="radiogroup" aria-label={ariaLabel}>
      {items.map((it, i) => (
        <button
          key={it.id}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={value === it.id}
          tabIndex={value === it.id ? 0 : -1}
          onClick={() => onChange(it.id)}
          onKeyDown={(e) => onKeyDown(e, i)}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}

function RangeSelector({
  value,
  onChange,
  ariaLabel,
}: {
  value: RangeId
  onChange: (id: RangeId) => void
  ariaLabel: string
}) {
  const t = useTranslations("Markedsinnsikt.Shell")
  const ranges = RANGE_IDS.map((r) => ({
    ...r,
    label: r.id === "3y" ? t("range3y") : t("range5y"),
  }))
  return (
    <SegmentTabs
      className="miv-range"
      ariaLabel={ariaLabel}
      items={ranges}
      value={value}
      onChange={onChange}
    />
  )
}

// Shared section header for the six market views — was hand-repeated verbatim
// (incl. an inline eyebrow style now moved to .mi-section-head .eyebrow in CSS).
function SectionHead({
  eyebrow,
  heading,
  source,
  stamp = LATEST_RELEASE_STAMP,
}: {
  eyebrow: string
  heading: React.ReactNode
  source: string
  stamp?: string
}) {
  return (
    <div className="mi-section-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{heading}</h2>
      </div>
      <div className="updated">
        <span className="live">{stamp}</span>
        <span>{source}</span>
      </div>
    </div>
  )
}

// Sub-tab (segment) + time-range controls, shared by the Yield and Leie views.
function SegmentControls({
  sub,
  setSub,
  range,
  setRange,
}: {
  sub: Segment
  setSub: (s: Segment) => void
  range: RangeId
  setRange: (r: RangeId) => void
}) {
  const t = useTranslations("Markedsinnsikt.Shell")
  const subTabs = SUB_TAB_IDS.map((id) => ({
    id,
    label: id === "kontor" ? t("segKontor") : id === "handel" ? t("segHandel") : t("segLogistikk"),
  }))
  return (
    <div className="miv-controls">
      <SegmentTabs
        className="mi-subtabs"
        ariaLabel={t("ariaViewing")}
        items={subTabs}
        value={sub}
        onChange={setSub}
      />
      <div className="miv-spacer" />
      <RangeSelector value={range} onChange={setRange} ariaLabel={t("ariaTimeRange")} />
    </div>
  )
}

interface LegendItem {
  key: string // must match the chart series `name`
  label: string
  color: string
  dashed?: boolean
}

// Tracks which series are hidden, enforcing "at least one always visible" so
// the chart can never be toggled down to a blank plot. The button for the
// last visible series reports `locked` and is rendered disabled.
function useSeriesToggle(keys: string[]) {
  const [hidden, setHidden] = useState<string[]>([])
  const visibleCount = keys.filter((k) => !hidden.includes(k)).length
  const isHidden = (k: string) => hidden.includes(k)
  const isLocked = (k: string) => visibleCount <= 1 && !isHidden(k)
  const toggle = (k: string) =>
    setHidden((h) => {
      if (h.includes(k)) return h.filter((x) => x !== k)
      if (keys.length - h.length <= 1) return h // keep at least one visible
      return [...h, k]
    })
  return { hidden, isHidden, isLocked, toggle }
}

function InteractiveLegend({
  items,
  isHidden,
  isLocked,
  toggle,
}: {
  items: LegendItem[]
  isHidden: (k: string) => boolean
  isLocked: (k: string) => boolean
  toggle: (k: string) => void
}) {
  const t = useTranslations("Markedsinnsikt.Shell")
  return (
    <div
      className="mi-chart-legend"
      role="group"
      aria-label={t("ariaLegend")}
    >
      {items.map((it) => (
        <button
          key={it.key}
          type="button"
          className={`item${isHidden(it.key) ? " off" : ""}`}
          aria-pressed={!isHidden(it.key)}
          disabled={isLocked(it.key)}
          onClick={() => toggle(it.key)}
        >
          <span
            className="swatch"
            style={
              it.dashed
                ? {
                    borderTop: "2px dashed var(--warm-grey-85)",
                    height: 0,
                    background: "transparent",
                  }
                : { background: it.color }
            }
          />
          {it.label}
        </button>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// VIEW: YIELD
// ════════════════════════════════════════════════════════════════════════

function YieldView() {
  const t = useTranslations("Markedsinnsikt.Shell")
  const [sub, setSub] = useState<Segment>("kontor")
  const [range, setRange] = useState<RangeId>("5y")
  const yieldData = YIELD[sub]
  const last = yieldData[yieldData.length - 1]
  const prev = yieldData[yieldData.length - 5]
  const bps = Math.round((last - prev) * 100)
  const isUp = bps > 0

  // Clickable legend keys must match the chart series `name`s below.
  const legendItems: LegendItem[] = [
    { key: "Prime yield", label: t("yieldLegendPrime"), color: "var(--warm-grey)" },
    { key: "5 år SWAP", label: t("yieldLegendSwap"), color: "var(--warm-grey-85)" },
    {
      key: "10 år statsobl.",
      label: t("yieldLegendGov"),
      color: "var(--warm-grey-85)",
      dashed: true,
    },
  ]
  const legend = useSeriesToggle(legendItems.map((i) => i.key))

  // Range only windows the plotted series; the headline figure and the table
  // below always reflect the latest actual quarter.
  const qn = RANGE_IDS.find((r) => r.id === range)?.quarters ?? 20

  const segments: { key: Segment; label: string; color: string }[] = [
    { key: "kontor", label: t("segKontor"), color: "var(--warm-grey)" },
    { key: "handel", label: t("segHandel"), color: "var(--accent)" },
    { key: "logistikk", label: t("segLogistikk"), color: "var(--warm-grey-85)" },
  ]

  const gaDypereLinks = GA_DYPERE_HREFS.map((href, i) => ({
    href,
    label: i === 0 ? t("gaDypereMarkedskart") : i === 1 ? t("gaDypereMarkedsrapport") : t("gaDyperePrimeYield"),
  }))

  return (
    <div>
      <SectionHead
        eyebrow={t("yieldEyebrow")}
        source={t("yieldSource")}
        heading={
          <>
            {t("yieldHeading1")}{" "}
            <span className="italic">{t("yieldHeading2")}</span>
          </>
        }
      />

      <SegmentControls sub={sub} setSub={setSub} range={range} setRange={setRange} />

      <div className="mi-chart-card">
        <div className="mi-chart-head">
          <div>
            <h3>{t("yieldChartTitle")}</h3>
            <div className="focus-val">
              <span className="val-num">{fmtNoComma(last)}</span>
              <span className="unit">{t("yieldUnit")}</span>
            </div>
            <div className="focus-delta delta-bps">
              <span className={isUp ? "up" : "down"}>
                {isUp ? "▲" : "▼"} {t("yieldDeltaBps", { count: Math.abs(bps) })}
              </span>{" "}
              {t("yieldLast12m")}
            </div>
          </div>
          <InteractiveLegend
            items={legendItems}
            isHidden={legend.isHidden}
            isLocked={legend.isLocked}
            toggle={legend.toggle}
          />
        </div>
        <div className="miv-chart">
          <MarketLineChart
            ariaLabel={t("yieldAriaChart")}
            labels={windowTail(QUARTERS, qn)}
            hidden={legend.hidden}
            yMin={0.5}
            yMax={7.5}
            yTicks={7}
            yFormat={(v) => `${v.toFixed(1)} %`}
            series={[
              {
                name: "Prime yield",
                color: "var(--warm-grey)",
                values: windowTail(yieldData, qn),
              },
              {
                name: "5 år SWAP",
                color: "var(--warm-grey-85)",
                values: windowTail(RATES.swap5y, qn),
              },
              {
                name: "10 år statsobl.",
                color: "var(--warm-grey-85)",
                dashed: true,
                values: windowTail(RATES.gov10y, qn),
              },
            ]}
          />
        </div>
      </div>

      <div className="mi-tablewrap">
      <table className="mi-table">
        <thead>
          <tr>
            <th>{t("yieldTableSegment")}</th>
            <th className="r">{t("yieldTablePrimeYield")}</th>
            <th className="r">{t("yieldTable12m")}</th>
            <th className="r">{t("yieldTable3y")}</th>
            <th className="r">{t("yieldTableSpread")}</th>
          </tr>
        </thead>
        <tbody>
          {segments.map((seg) => {
            const arr = YIELD[seg.key]
            const cur = arr[arr.length - 1]
            const prev1y = arr[arr.length - 5]
            const prev3y = arr[arr.length - 13]
            const d1y = Math.round((cur - prev1y) * 100)
            const d3y = Math.round((cur - prev3y) * 100)
            const spread = cur - RATES.swap5y[RATES.swap5y.length - 1]
            return (
              <tr key={seg.key}>
                <td className="label-cell">
                  <span
                    className="swatch"
                    style={{ background: seg.color }}
                  />
                  {seg.label}
                </td>
                <td className="r">{fmtNoComma(cur)} %</td>
                <td className="r">
                  <span className={`ch ${d1y >= 0 ? "up" : "down"}`}>
                    {d1y >= 0 ? "▲" : "▼"} {t("yieldDeltaBps", { count: Math.abs(d1y) })}
                  </span>
                </td>
                <td className="r">
                  <span className={`ch ${d3y >= 0 ? "up" : "down"}`}>
                    {d3y >= 0 ? "▲" : "▼"} {t("yieldDeltaBps", { count: Math.abs(d3y) })}
                  </span>
                </td>
                <td className="r">{fmtNoComma(spread)} %</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>

      <div className="mi-footnote">
        <span className="source">
          {t("yieldFootnote")}
        </span>
        <span>{t("yieldFootnoteQ")}</span>
      </div>

      <div className="mi-insights">
        <div className="mi-insight">
          <div className="ipre">{t("yieldInsight01Pre")}</div>
          <h3>{t("yieldInsight01Title")}</h3>
          <p>
            {t("yieldInsight01Body")}
          </p>
        </div>
        <div className="mi-insight">
          <div className="ipre">{t("yieldInsight02Pre")}</div>
          <h3>{t("yieldInsight02Title")}</h3>
          <p>
            {t("yieldInsight02Body")}
          </p>
        </div>
        <div className="mi-insight">
          <div className="ipre">{t("yieldInsight03Pre")}</div>
          <h3>{t("yieldInsight03Title")}</h3>
          <p>
            {t("yieldInsight03Body")}
          </p>
        </div>
      </div>

      <SeOgsa heading={t("gaDypereHeading")} from="sektor-yield" links={gaDypereLinks} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// VIEW: MARKEDSLEIE
// ════════════════════════════════════════════════════════════════════════

function LeieView() {
  const t = useTranslations("Markedsinnsikt.Shell")
  const locale = useLocale()
  const [sub, setSub] = useState<Segment>("kontor")
  const [range, setRange] = useState<RangeId>("5y")
  const cityData = LEIE[sub]
  const cities = Object.keys(cityData)
  const primeCity = cities[0]
  const arr = cityData[primeCity]
  const cur = arr[arr.length - 1]
  const prev = arr[arr.length - 5]
  const pct = ((cur - prev) / prev) * 100

  const segLabel = sub === "kontor" ? t("segKontor") : sub === "handel" ? t("segHandel") : t("segLogistikk")

  const legendItems: LegendItem[] = cities.map((c, i) => ({
    key: c,
    label: c,
    color: SECTOR_COLORS[i],
    dashed: i === 2,
  }))
  const legend = useSeriesToggle(cities)
  const qn = RANGE_IDS.find((r) => r.id === range)?.quarters ?? 20

  const gaDypereLinks = GA_DYPERE_HREFS.map((href, i) => ({
    href,
    label: i === 0 ? t("gaDypereMarkedskart") : i === 1 ? t("gaDypereMarkedsrapport") : t("gaDyperePrimeYield"),
  }))

  return (
    <div>
      <SectionHead
        eyebrow={t("leieEyebrow")}
        source={t("leieSource")}
        heading={
          <>
            {t("leieHeading1")}{" "}
            <span className="italic">{t("leieHeading2")}</span>
          </>
        }
      />

      <SegmentControls sub={sub} setSub={setSub} range={range} setRange={setRange} />

      <div className="mi-chart-card">
        <div className="mi-chart-head">
          <div>
            <h3>
              {t("leieChartTitle", { segment: segLabel })},{" "}
              <span className="city-name">{primeCity}</span>
            </h3>
            <div className="focus-val">
              <span className="val-num">{fmtNum(cur, locale)}</span>
              <span className="unit">{t("leieUnit")}</span>
            </div>
            <div className="focus-delta delta-pct">
              <span className={pct >= 0 ? "up" : "down"}>
                {pct >= 0 ? "▲" : "▼"} {pct.toFixed(1).replace(".", ",")} %
              </span>{" "}
              {t("leieYoY")}
            </div>
          </div>
          <InteractiveLegend
            items={legendItems}
            isHidden={legend.isHidden}
            isLocked={legend.isLocked}
            toggle={legend.toggle}
          />
        </div>
        <div className="miv-chart">
          <MarketLineChart
            ariaLabel={t("leieAriaChart", { segment: segLabel })}
            labels={windowTail(QUARTERS, qn)}
            hidden={legend.hidden}
            yFormat={(v) => `${Math.round(v)} kr`}
            series={cities.map((c, i) => ({
              name: c,
              color: SECTOR_COLORS[i],
              dashed: i === 2,
              values: windowTail(cityData[c], qn),
            }))}
          />
        </div>
      </div>

      <div className="mi-tablewrap">
      <table className="mi-table">
        <thead>
          <tr>
            <th>{t("leieTableCity")}</th>
            <th className="r">{t("leieTableRent")}</th>
            <th className="r">{t("leieTable12m")}</th>
            <th className="r">{t("leieTable3y")}</th>
          </tr>
        </thead>
        <tbody>
          {cities.map((c, i) => {
            const v = cityData[c]
            const curC = v[v.length - 1]
            const prev1y = v[v.length - 5]
            const prev3y = v[v.length - 13]
            const d1y = ((curC - prev1y) / prev1y) * 100
            const d3y = ((curC - prev3y) / prev3y) * 100
            return (
              <tr key={c}>
                <td className="label-cell">
                  <span
                    className="swatch"
                    style={{ background: SECTOR_COLORS[i] }}
                  />
                  {c}
                </td>
                <td className="r">{fmtNum(curC, locale)} kr/m²</td>
                <td className="r">
                  <span className={`ch ${d1y >= 0 ? "up" : "down"}`}>
                    {d1y >= 0 ? "▲" : "▼"}{" "}
                    {d1y.toFixed(1).replace(".", ",")} %
                  </span>
                </td>
                <td className="r">
                  <span className={`ch ${d3y >= 0 ? "up" : "down"}`}>
                    {d3y >= 0 ? "▲" : "▼"} {d3y.toFixed(0)} %
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>

      <div className="mi-footnote">
        <span className="source">
          {t("leieFootnote")}
        </span>
        <span>{t("leieFootnoteQ")}</span>
      </div>

      <div className="mi-insights">
        <div className="mi-insight">
          <div className="ipre">{t("leieInsight01Pre")}</div>
          <h3>{t("leieInsight01Title")}</h3>
          <p>
            {t("leieInsight01Body")}
          </p>
        </div>
        <div className="mi-insight">
          <div className="ipre">{t("leieInsight02Pre")}</div>
          <h3>{t("leieInsight02Title")}</h3>
          <p>
            {t("leieInsight02Body")}
          </p>
        </div>
        <div className="mi-insight">
          <div className="ipre">{t("leieInsight03Pre")}</div>
          <h3>{t("leieInsight03Title")}</h3>
          <p>
            {t("leieInsight03Body")}
          </p>
        </div>
      </div>

      <SeOgsa heading={t("gaDypereHeading")} from="sektor-leie" links={gaDypereLinks} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// VIEW: TRANSAKSJONER
// ════════════════════════════════════════════════════════════════════════

function TxView() {
  const t = useTranslations("Markedsinnsikt.Shell")
  const gaDypereLinks = GA_DYPERE_HREFS.map((href, i) => ({
    href,
    label: i === 0 ? t("gaDypereMarkedskart") : i === 1 ? t("gaDypereMarkedsrapport") : t("gaDyperePrimeYield"),
  }))
  return (
    <div>
      <SectionHead
        eyebrow={t("txEyebrow")}
        source={t("txSource")}
        heading={
          <>
            {t("txHeading1")}{" "}
            <span className="italic">{t("txHeading2")}</span>
          </>
        }
      />

      <div className="mi-chart-card">
        <div className="mi-chart-head">
          <div>
            <h3>{t("txChartTitle")}</h3>
            <div className="focus-val">
              <span>{t("txFocusVal")}</span>
              <span className="unit">{t("txFocusUnit")}</span>
            </div>
            <div className="focus-delta">
              <span className="up">{t("txFocusDelta")}</span>
            </div>
          </div>
          <div className="mi-chart-legend">
            <span className="item">
              <span
                className="swatch"
                style={{
                  background: "var(--warm-grey)",
                  height: 12,
                  width: 8,
                  borderRadius: 1,
                }}
              />
              {t("txLegend2025")}
            </span>
            <span className="item">
              <span
                className="swatch"
                style={{
                  background: "var(--accent-soft)",
                  border: "1px solid var(--warm-grey)",
                  height: 12,
                  width: 8,
                  borderRadius: 1,
                }}
              />
              {t("txLegendHistorical")}
            </span>
          </div>
        </div>
        <MarketBarChart
          ariaLabel={t("txAriaChart")}
          labels={VOLUME.years}
          orientation="columns"
          highlightLast
          valueFormatter={(v) => `${v.toFixed(1)} mrd`}
          series={[
            {
              name: "Transaksjonsvolum",
              color: "var(--accent)",
              values: VOLUME.total,
            },
          ]}
        />
      </div>

      <h3 className="miv-subhead">
        {t("txSubhead1")} <span className="italic">{t("txSubhead2")}</span>
      </h3>
      <div className="mi-tx-list">
        {TX.map((tx) => (
          <div className="mi-tx" key={tx.name}>
            <div className="tx-date">{tx.date}</div>
            <div>
              <div className="tx-name">{tx.name}</div>
              <div className="tx-loc">{tx.loc}</div>
            </div>
            <div className="tx-segment">{tx.seg}</div>
            <div className="tx-value">{tx.value}</div>
            <div className="tx-yield">{t("txYield")} {tx.yield}</div>
          </div>
        ))}
      </div>

      <div className="mi-footnote">
        <span className="source">
          {t("txFootnote")}
        </span>
        <span>{t("txFootnoteCount")}</span>
      </div>

      <SeOgsa heading={t("gaDypereHeading")} from="sektor-tx" links={gaDypereLinks} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// VIEW: LEDIGHET
// ════════════════════════════════════════════════════════════════════════

function LedighetView() {
  const t = useTranslations("Markedsinnsikt.Shell")
  const gaDypereLinks = GA_DYPERE_HREFS.map((href, i) => ({
    href,
    label: i === 0 ? t("gaDypereMarkedskart") : i === 1 ? t("gaDypereMarkedsrapport") : t("gaDyperePrimeYield"),
  }))
  return (
    <div>
      <SectionHead
        eyebrow={t("ledighetEyebrow")}
        source={t("ledighetSource")}
        heading={
          <>
            {t("ledighetHeading1")} <span className="italic">{t("ledighetHeading2")}</span>
          </>
        }
      />

      <div className="mi-chart-card">
        <div className="mi-chart-head">
          <div>
            <h3>{t("ledighetChartTitle")}</h3>
            <div className="focus-delta">
              {t("ledighetHint")}
            </div>
          </div>
          <div className="mi-chart-legend">
            <span className="item">
              <span
                className="swatch"
                style={{ background: "var(--warm-grey)" }}
              />
              {t("segKontor")}
            </span>
            <span className="item">
              <span
                className="swatch"
                style={{ background: "var(--warm-grey-85)" }}
              />
              {t("segHandel")}
            </span>
            <span className="item">
              <span
                className="swatch"
                style={{
                  background: "var(--accent)",
                  height: 8,
                  border: "1px solid var(--warm-grey-75)",
                }}
              />
              {t("segLogistikk")}
            </span>
          </div>
        </div>
        <MarketBarChart
          ariaLabel={t("ledighetAriaChart")}
          labels={VACANCY.map((r) => r.city)}
          orientation="rows"
          height={340}
          valueFormatter={fmtPct1}
          series={[
            {
              name: t("segKontor"),
              color: "var(--warm-grey)",
              values: VACANCY.map((r) => r.kontor),
            },
            {
              name: t("segHandel"),
              color: "var(--warm-grey-85)",
              values: VACANCY.map((r) => r.handel),
            },
            {
              name: t("segLogistikk"),
              color: "var(--accent)",
              values: VACANCY.map((r) => r.logistikk),
            },
          ]}
        />
        <table className="mi-city-table" style={{ marginTop: 24 }}>
          <thead>
            <tr>
              <th>{t("leieTableCity")}</th>
              <th>{t("segKontor")}</th>
              <th>{t("segHandel")}</th>
              <th>{t("segLogistikk")}</th>
            </tr>
          </thead>
          <tbody>
            {VACANCY.map((row) => (
              <tr key={row.city}>
                <td className="city-name">{row.city}</td>
                <td>{fmtPct1(row.kontor)}</td>
                <td>{fmtPct1(row.handel)}</td>
                <td>{fmtPct1(row.logistikk)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mi-insights">
        <div className="mi-insight">
          <div className="ipre">{t("ledighetInsight01Pre")}</div>
          <h3>{t("ledighetInsight01Title")}</h3>
          <p>
            {t("ledighetInsight01Body")}
          </p>
        </div>
        <div className="mi-insight">
          <div className="ipre">{t("ledighetInsight02Pre")}</div>
          <h3>{t("ledighetInsight02Title")}</h3>
          <p>
            {t("ledighetInsight02Body")}
          </p>
        </div>
        <div className="mi-insight">
          <div className="ipre">{t("ledighetInsight03Pre")}</div>
          <h3>{t("ledighetInsight03Title")}</h3>
          <p>
            {t("ledighetInsight03Body")}
          </p>
        </div>
      </div>

      <SeOgsa heading={t("gaDypereHeading")} from="sektor-ledighet" links={gaDypereLinks} />
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// VIEW: MARKEDSKART
// ════════════════════════════════════════════════════════════════════════

function KartView() {
  const t = useTranslations("Markedsinnsikt.Shell")
  const [cityId, setCityId] = useState("bodo")
  const city = CITIES.find((c) => c.id === cityId) ?? CITIES[1]

  return (
    <div>
      <SectionHead
        eyebrow={t("kartEyebrow")}
        source={t("kartSource")}
        heading={
          <>
            {t("kartHeading1")} <span className="italic">{t("kartHeading2")}</span>
          </>
        }
      />

      <div className="mi-map-card">
        <div className="mi-map">
          <MapErrorBoundary>
            <NordNorgeLeafletMap
              cities={CITIES}
              activeCityId={cityId}
              onSelectCity={setCityId}
            />
          </MapErrorBoundary>
        </div>
        <div className="mi-map-info">
          <div className="mi-city-picker" role="group" aria-label={t("kartAriaSelectCity")}>
            {CITIES.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={c.id === cityId}
                onClick={() => setCityId(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="city-label">{t("marketLabel", { city: city.name })}</div>
          <h3>{city.name}</h3>
          <div
            style={{
              fontSize: 14,
              color: "var(--warm-grey-85)",
              marginBottom: 22,
              lineHeight: 1.55,
              maxWidth: "30ch",
            }}
          >
            {city.note}
          </div>
          <div className="city-stat">
            <span className="l">{t("statPrimeYield")}</span>
            <span className="v">{city.yield}</span>
          </div>
          <div className="city-stat">
            <span className="l">{t("statMarketRent")}</span>
            <span className="v">{city.leie}</span>
          </div>
          <div className="city-stat">
            <span className="l">{t("statVacancy")}</span>
            <span className="v">{city.vac}</span>
          </div>
          <div style={{ marginTop: 32 }}>
            <Link
              href="/kontakt"
              className="btn btn-outline"
              style={{ fontSize: 12, padding: "10px 18px" }}
            >
              {t("kartFullReport", { city: city.name })} <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mi-footnote">
        <span className="source">
          {t("kartFootnote")}
        </span>
        <Link
          href="/markedsinnsikt/kart"
          style={{ color: "var(--warm-grey)", borderBottom: "1px solid" }}
        >
          {t("kartZoneLink")}
        </Link>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// VIEW: RAPPORTER
// ════════════════════════════════════════════════════════════════════════

// Report keys — the actual text lives in Shell.reports.r1…r6 translations.
const REPORT_KEYS = ["r1", "r2", "r3", "r4", "r5", "r6"] as const

function RapporterView() {
  const t = useTranslations("Markedsinnsikt.Shell")
  const tReports = useTranslations("Markedsinnsikt.Shell.reports")
  return (
    <div>
      <SectionHead
        eyebrow={t("rapporterEyebrow")}
        source={t("rapporterSource")}
        stamp={t("rapporterStamp")}
        heading={
          <>
            {t("rapporterHeading1")}{" "}
            <span className="italic">{t("rapporterHeading2")}</span>
          </>
        }
      />

      <div className="mi-report-card">
        <div>
          <div className="pre">{t("rapporterMainPre")}</div>
          <h3>
            {t("rapporterMainTitle1")}{" "}
            <span className="italic">{t("rapporterMainTitle2")}</span>
          </h3>
          <p>
            {t("rapporterMainBody")}
          </p>
          <div className="row" style={{ marginTop: 32 }}>
            <Link
              href="/markedsrapport"
              className="btn btn-primary"
              onClick={() => trackEvent("rapport_bestill", { source: "hovedkort" })}
            >
              {t("rapporterOrderReport")} <span className="arrow">→</span>
            </Link>
            <Link
              href="/markedsrapport"
              className="btn btn-ghost"
              onClick={() => trackEvent("rapport_bestill", { source: "sammendrag" })}
            >
              {t("rapporterSeeSummary")}
            </Link>
          </div>
        </div>
        <div className="meta">
          <div>
            <div className="key">{t("rapporterMetaFormat")}</div>
            <div className="val">{t("rapporterMetaFormatVal")}</div>
          </div>
          <div>
            <div className="key">{t("rapporterMetaScope")}</div>
            <div className="val">{t("rapporterMetaScopeVal")}</div>
          </div>
          <div>
            <div className="key">{t("rapporterMetaAccess")}</div>
            <div className="val">{t("rapporterMetaAccessVal")}</div>
          </div>
          <div>
            <div className="key">{t("rapporterMetaNext")}</div>
            <div className="val">{NEXT_RELEASE_DATE}</div>
          </div>
        </div>
      </div>

      <h3 className="miv-subhead">
        {t("rapporterArchiveHead1")} <span className="italic">{t("rapporterArchiveHead2")}</span>
      </h3>

      <div className="mi-reports-grid">
        {REPORT_KEYS.map((rk) => (
          <article className="mi-report" key={rk}>
            <div>
              <div className="rpre">{tReports(`${rk}Pre`)}</div>
              <h4>{tReports(`${rk}Title`)}</h4>
              <p>{tReports(`${rk}Body`)}</p>
            </div>
            <div className="rfoot">
              <span>{tReports(`${rk}Foot`)}</span>
              {/* Arkivtilgang går via lead-gaten — aldri en død «Last ned»-span */}
              <Link
                href="/markedsrapport"
                onClick={() => trackEvent("rapport_bestill", { source: "arkiv" })}
              >
                {t("rapporterGetAccess")}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mi-footnote" style={{ marginTop: 32 }}>
        <span className="source">
          {t("rapporterFootnote")}
        </span>
        <span>
          <Link
            href="/markedsrapport"
            style={{
              color: "var(--warm-grey)",
              borderBottom: "1px solid",
            }}
            onClick={() => trackEvent("rapport_bestill", { source: "abonnement" })}
          >
            {t("rapporterSubscriptionLink")}
          </Link>
        </span>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// SHELL
// ════════════════════════════════════════════════════════════════════════

export function MarkedsinnsiktShell() {
  const t = useTranslations("Markedsinnsikt.Shell")
  const [sector, setSector] = useState<SectorId>("yield")

  // Sector labels keyed by id — from translations.
  const sectorLabel = (id: SectorId): string => {
    switch (id) {
      case "yield": return t("sectorYieldLabel")
      case "leie": return t("sectorLeieLabel")
      case "tx": return t("sectorTxLabel")
      case "ledighet": return t("sectorLedighetLabel")
      case "kart": return t("sectorKartLabel")
      case "rapporter": return t("sectorRapporterLabel")
    }
  }
  const sectorPre = (id: SectorId): string => {
    const idx = SECTOR_IDS.indexOf(id)
    return String(idx + 1).padStart(2, "0")
  }

  // Deep-linking: honour /markedsinnsikt#<sector> on load and on back/forward
  // navigation. The hash is kept in sync as the user switches sectors below.
  useEffect(() => {
    const isSector = (h: string): h is SectorId =>
      SECTOR_IDS.includes(h as SectorId)

    const applyHash = () => {
      const hash = window.location.hash.slice(1)
      if (isSector(hash)) setSector(hash)
    }

    applyHash()
    window.addEventListener("hashchange", applyHash)
    return () => window.removeEventListener("hashchange", applyHash)
  }, [])

  const selectSector = (id: SectorId) => {
    setSector(id)
    window.history.replaceState(null, "", `#${id}`)
  }

  // Roving-tabindex keyboard contract for the sector tablist (WAI-ARIA tabs):
  // arrow keys move focus and activate, Home/End jump to the ends. Charts
  // mount-gate (R2), so a keyboard sector switch animates a fresh entrance,
  // never a mid-view replay.
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const onTabKeyDown = (e: React.KeyboardEvent, i: number) => {
    const last = SECTOR_IDS.length - 1
    let next = -1
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = i === last ? 0 : i + 1
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = i === 0 ? last : i - 1
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = last
    else return
    e.preventDefault()
    selectSector(SECTOR_IDS[next]!)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="mi-shell">
      <aside className="mi-nav" role="tablist" aria-label={t("ariaSectors")}>
        <div className="mi-nav-label" aria-hidden="true">
          {t("navLabel")}
        </div>
        {SECTOR_IDS.map((sId, i) => (
          <Fragment key={sId}>
            {i === 4 && <div className="divider" aria-hidden="true" />}
            <button
              ref={(el) => {
                tabRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`mi-tab-${sId}`}
              aria-controls="mi-panel"
              data-sector={sId}
              aria-selected={sector === sId}
              tabIndex={sector === sId ? 0 : -1}
              onClick={() => selectSector(sId)}
              onKeyDown={(e) => onTabKeyDown(e, i)}
            >
              <span>{sectorLabel(sId)}</span>
              <span className="pre">{sectorPre(sId)}</span>
            </button>
          </Fragment>
        ))}
      </aside>

      <section
        id="mi-panel"
        role="tabpanel"
        aria-labelledby={`mi-tab-${sector}`}
        tabIndex={0}
      >
        {sector === "yield" && <YieldView />}
        {sector === "leie" && <LeieView />}
        {sector === "tx" && <TxView />}
        {sector === "ledighet" && <LedighetView />}
        {sector === "kart" && <KartView />}
        {sector === "rapporter" && <RapporterView />}
      </section>
    </div>
  )
}
