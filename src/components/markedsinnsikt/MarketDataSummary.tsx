// Server-rendered (NO "use client") plain-text market data tables for
// /markedsinnsikt. The interactive MarkedsinnsiktShell renders only the active
// tab on the server and loads its charts client-only (ssr:false), so the bulk of
// the figures never reach the initial HTML. This component mirrors the same data
// (from ./marketData) as semantic tables that are always in the server HTML —
// crawlable and citable by Google and AI engines (ChatGPT, Claude, Perplexity),
// and a useful, accessible reference for visitors.
import { getLocale, getTranslations } from "next-intl/server"
import {
  CITIES,
  YIELD,
  LEIE,
  VACANCY,
  TX,
  LATEST_QUARTER,
  fmtNoComma,
  fmtNum,
  fmtPct1,
  type Segment,
} from "./marketData"

const SEGMENTS: { key: Segment; label: string }[] = [
  { key: "kontor", label: "Kontor" },
  { key: "handel", label: "Handel" },
  { key: "logistikk", label: "Logistikk" },
]

const last = (arr: number[]) => arr[arr.length - 1]

export async function MarketDataSummary() {
  const locale = await getLocale()
  const t = await getTranslations("Markedsinnsikt.DataSummary")
  const tShell = await getTranslations("Markedsinnsikt.Shell")

  // Flatten LEIE[segment][city] → latest value per (segment, city) pair.
  const leieRows = SEGMENTS.flatMap((seg) =>
    Object.entries(LEIE[seg.key]).map(([city, values]) => ({
      segment: seg.label,
      city,
      value: last(values),
    })),
  )

  return (
    <section
      className="section section-divider"
      id="markedsdata-tall"
      aria-label={t("ariaLabel", { quarter: LATEST_QUARTER })}
    >
      <div className="wrap">
        <div className="head-compact">
          <span className="eyebrow">{t("eyebrow", { quarter: LATEST_QUARTER })}</span>
          <div>
            <h2>
              {t("title1")} <span className="italic">{t("title2")}</span>
            </h2>
            <p>
              {t("intro", { quarter: LATEST_QUARTER })}
            </p>
          </div>
        </div>

        {/* Per-by snapshot */}
        <h3 className="mi-data-h3">{t("h3CityOverview")}</h3>
        <div className="mi-tablewrap">
        <table className="mi-table">
          <caption className="sr-only">
            {t("captionCity", { quarter: LATEST_QUARTER })}
          </caption>
          <thead>
            <tr>
              <th>{t("thCity")}</th>
              <th className="r">{t("thPrimeYieldOffice")}</th>
              <th className="r">{t("thMarketRentOffice")}</th>
              <th className="r">{t("thVacancyOffice")}</th>
              <th>{t("thComment")}</th>
            </tr>
          </thead>
          <tbody>
            {CITIES.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="r">{c.yield}</td>
                <td className="r">{c.leie}</td>
                <td className="r">{c.vac}</td>
                <td>{c.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Prime yield per segment */}
        <h3 className="mi-data-h3">{t("h3PrimeYieldSegment")}</h3>
        <div className="mi-tablewrap">
        <table className="mi-table">
          <caption className="sr-only">
            {t("captionPrimeYield", { quarter: LATEST_QUARTER })}
          </caption>
          <thead>
            <tr>
              <th>{t("thSegment")}</th>
              <th className="r">{t("thPrimeYieldQuarter", { quarter: LATEST_QUARTER })}</th>
            </tr>
          </thead>
          <tbody>
            {SEGMENTS.map((seg) => (
              <tr key={seg.key}>
                <td>{seg.label}</td>
                <td className="r">{fmtNoComma(last(YIELD[seg.key]))} %</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Markedsleie per segment & by */}
        <h3 className="mi-data-h3">{t("h3RentCitySegment")}</h3>
        <div className="mi-tablewrap">
        <table className="mi-table">
          <caption className="sr-only">
            {t("captionRent", { quarter: LATEST_QUARTER })}
          </caption>
          <thead>
            <tr>
              <th>{t("thSegment")}</th>
              <th>{t("thCity")}</th>
              <th className="r">{t("thRentQuarter", { quarter: LATEST_QUARTER })}</th>
            </tr>
          </thead>
          <tbody>
            {leieRows.map((row) => (
              <tr key={`${row.segment}-${row.city}`}>
                <td>{row.segment}</td>
                <td>{row.city}</td>
                <td className="r">{fmtNum(row.value, locale)} {t("rentUnit")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Ledighet per by & segment */}
        <h3 className="mi-data-h3">{t("h3VacancyCitySegment")}</h3>
        <div className="mi-tablewrap">
        <table className="mi-table">
          <caption className="sr-only">
            {t("captionVacancy", { quarter: LATEST_QUARTER })}
          </caption>
          <thead>
            <tr>
              <th>{t("thCity")}</th>
              <th className="r">{tShell("segKontor")}</th>
              <th className="r">{tShell("segHandel")}</th>
              <th className="r">{tShell("segLogistikk")}</th>
            </tr>
          </thead>
          <tbody>
            {VACANCY.map((row) => (
              <tr key={row.city}>
                <td>{row.city}</td>
                <td className="r">{fmtPct1(row.kontor)}</td>
                <td className="r">{fmtPct1(row.handel)}</td>
                <td className="r">{fmtPct1(row.logistikk)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Recent transactions */}
        <h3 className="mi-data-h3">{t("h3Transactions")}</h3>
        <div className="mi-tablewrap">
        <table className="mi-table">
          <caption className="sr-only">
            {t("captionTransactions")}
          </caption>
          <thead>
            <tr>
              <th>{t("thDate")}</th>
              <th>{t("thProperty")}</th>
              <th>{t("thSegment")}</th>
              <th className="r">{t("thValue")}</th>
              <th className="r">{t("thYield")}</th>
            </tr>
          </thead>
          <tbody>
            {TX.map((tx) => (
              <tr key={tx.name}>
                <td>{tx.date}</td>
                <td>
                  {tx.name}
                  <span className="mi-data-sub"> · {tx.loc}</span>
                </td>
                <td>{tx.seg}</td>
                <td className="r">{tx.value}</td>
                <td className="r">{tx.yield}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="mi-footnote" style={{ marginTop: 24 }}>
          <span className="source">
            {t("footnote")}
          </span>
          <span>{t("footnoteStamp", { quarter: LATEST_QUARTER })}</span>
        </div>
      </div>
    </section>
  )
}
