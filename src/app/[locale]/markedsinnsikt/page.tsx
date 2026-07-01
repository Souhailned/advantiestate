import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { constructMetadata } from "@/lib/utils"
import { MI_KPIS } from "@/components/markedsinnsikt/portalSeries"
import { VOLUME } from "@/components/markedsinnsikt/marketData"
import { SubHero } from "@/components/site/SubHero"
import { CtaStrip } from "@/components/site/CtaStrip"
import { NewsletterSection } from "@/components/site/NewsletterSection"
import { MarkedsinnsiktShell } from "@/components/markedsinnsikt/MarkedsinnsiktShell"
import { MarketDataSummary } from "@/components/markedsinnsikt/MarketDataSummary"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Markedsinnsikt.Page")
  return constructMetadata({
    path: "/markedsinnsikt",
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  })
}

export default async function MarkedsinnsiktPage() {
  const t = await getTranslations("Markedsinnsikt.Page")
  const tKpis = await getTranslations("Markedsinnsikt.PortalSeries")

  // Map the four KPIs shown in the band to their translated labels/subs.
  // MI_KPIS keeps the numeric derivation (value, unit, delta, dir) from
  // portalSeries; only the display labels are overridden here.
  const volYear = String(VOLUME.years[VOLUME.years.length - 1])
  const volPrevYear = String(VOLUME.years[VOLUME.years.length - 2])
  const kpiLabels = [
    { label: tKpis("kpiPrimeYieldLabel"), sub: tKpis("kpiPrimeYieldSub") },
    { label: tKpis("kpiSwapLabel"), sub: tKpis("kpiSwapSub") },
    { label: tKpis("kpiVolumeLabel", { year: volYear }), sub: tKpis("kpiVolumeSub", { prevYear: volPrevYear }) },
    { label: tKpis("kpiVacancyLabel"), sub: tKpis("kpiVacancySub") },
  ]
  const deltaUnchanged = tKpis("deltaUnchanged")

  return (
    <>
      <SubHero
        crumb={[
          { label: t("crumbHome"), href: "/" },
          { label: t("crumbMarkedsinnsikt") },
        ]}
        eyebrow={t("eyebrow")}
        title={
          <>
            {t("titleLine1")} <br />
            <span className="italic">
              {t("titleLine2")}
            </span>
          </>
        }
        lede={t("lede")}
      />

      {/* KPI BAND — derived from the shared release-anchored series (no
          hardcoded numbers: portal and overview can never drift apart). */}
      <section className="section-tight">
        <div className="wrap">
          <div className="mi-kpis">
            {MI_KPIS.map((k, i) => {
              const mapped = kpiLabels[i]
              return (
                <div className="mi-kpi" key={mapped?.label ?? k.label}>
                  <div className="label">{mapped?.label ?? k.label}</div>
                  <div className="val">
                    {k.value}
                    <span className="unit">{k.unit}</span>
                  </div>
                  <div className="delta">
                    <span
                      className={
                        k.dir === "up"
                          ? "arrow-up"
                          : k.dir === "down"
                            ? "arrow-down"
                            : undefined
                      }
                    >
                      {k.dir === "up" ? "▲ " : k.dir === "down" ? "▼ " : "→ "}
                      {k.dir === "flat"
                        ? deltaUnchanged
                        : k.delta.replace(/^[+−]/, "")}
                    </span>{" "}
                    {mapped?.sub ?? k.sub}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mi-deeplink">
            <Link href="/analyseportal">
              {t("deeplinkPortal")}
            </Link>
          </p>
        </div>
      </section>

      {/* SHELL: sidebar + content */}
      <section style={{ padding: "0 0 80px" }}>
        <div className="wrap">
          <MarkedsinnsiktShell />
        </div>
      </section>

      {/* Server-rendered data tables — always in the initial HTML for crawlers
          and AI engines (the shell above renders only the active tab + charts
          client-side). */}
      <MarketDataSummary />

      <NewsletterSection
        source="markedsinnsikt"
        eyebrow={t("newsletterEyebrow")}
        title={
          <>
            {t("newsletterTitle")}
          </>
        }
        description={t("newsletterDesc")}
      />

      <CtaStrip
        eyebrow={t("ctaEyebrow")}
        title={
          <>
            {t("ctaTitle1")} <br />
            <span className="italic">{t("ctaTitle2")}</span>
          </>
        }
        sub={t("ctaSub")}
        primary={{ label: t("ctaPrimary"), href: "/kontakt" }}
        secondary={{
          label: t("ctaSecondary"),
          href: "/tjenester/radgivning",
        }}
      />
    </>
  )
}
