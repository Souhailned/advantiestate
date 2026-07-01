import { getTranslations } from "next-intl/server"
import { MarkedsKartHoved } from "@/components/markedsinnsikt/maps/MarkedsKartHoved"
import { LATEST_RELEASE } from "@/components/markedsinnsikt/marketReleases"
import { CtaStrip } from "@/components/site/CtaStrip"
import { SubHero } from "@/components/site/SubHero"
import { constructMetadata } from "@/lib/utils"
import { Metadata } from "next"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Markedsinnsikt.Kart")
  return constructMetadata({
    path: "/markedsinnsikt/kart",
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  })
}

// Stamp derived from the release register — never hand-edited copy.
// UTC getters: publishedAt is date-only ISO (UTC midnight); local-TZ getters
// would render the previous day on any build machine west of UTC.
function publishedStamp(): string {
  const d = new Date(LATEST_RELEASE.publishedAt)
  const months = [
    "JAN", "FEB", "MAR", "APR", "MAI", "JUN",
    "JUL", "AUG", "SEP", "OKT", "NOV", "DES",
  ]
  return `OPPDATERT ${d.getUTCDate()}. ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export default async function MarkedskartPage() {
  const t = await getTranslations("Markedsinnsikt.Kart")

  return (
    <>
      <SubHero
        crumb={[
          { label: t("crumbMarkedsinnsikt"), href: "/markedsinnsikt" },
          { label: t("crumbMarkedskart") },
        ]}
        eyebrow={t("eyebrow")}
        title={
          <>
            {t("titleLine1")} <br />
            <span className="italic">{t("titleLine2")}</span>
          </>
        }
        lede={t("lede")}
      >
        <div className="km-intro-meta">
          <div>
            <span className="v">{LATEST_RELEASE.cities.length}</span>
            <span className="l">{t("metaCities")}</span>
          </div>
          <div>
            <span className="v">3</span>
            <span className="l">{t("metaKeyFigures")}</span>
          </div>
          <div>
            <span className="v">+1 400</span>
            <span className="l">{t("metaProperties")}</span>
          </div>
          <div>
            <span className="v">{LATEST_RELEASE.quarter}</span>
            <span className="l">{t("metaUpdated")}</span>
          </div>
        </div>
      </SubHero>

      {/* INTERAKTIVT KART */}
      <section
        className="section section-divider km-map"
        style={{ paddingTop: 64 }}
      >
        <div className="wrap">
          <div className="mi-section-head">
            <div>
              <span
                className="eyebrow"
                style={{ marginBottom: 18, display: "inline-flex" }}
              >
                {t("sectionEyebrow")}
              </span>
              <h2>
                {t("sectionTitle1")} <span className="italic">{t("sectionTitle2")}</span>
              </h2>
            </div>
            <div className="updated">
              <span className="live">{publishedStamp()}</span>
              <span>{t("updatedYieldLeieLedighet", { quarter: LATEST_RELEASE.quarter })}</span>
            </div>
          </div>

          <MarkedsKartHoved />

          <div className="mi-footnote">
            <span className="source">
              {t("footnoteSource")}
            </span>
            <span>
              {t("footnoteSummary", { count: LATEST_RELEASE.cities.length, quarter: LATEST_RELEASE.quarter })}
            </span>
          </div>
        </div>
      </section>

      {/* SLIK LESER DU KARTET */}
      <section className="section">
        <div className="wrap">
          <div className="head-compact">
            <span className="eyebrow">{t("insightsEyebrow")}</span>
            <div>
              <h2>
                {t("insightsTitle1")} <span className="italic">{t("insightsTitle2")}</span>
              </h2>
              <p>
                {t("insightsIntro", { quarter: LATEST_RELEASE.quarter })}
              </p>
            </div>
          </div>

          <div className="mi-insights">
            <div className="mi-insight">
              <div className="ipre">{t("insight01Pre")}</div>
              <h3>{t("insight01Title")}</h3>
              <p>
                {t("insight01Body")}
              </p>
            </div>
            <div className="mi-insight">
              <div className="ipre">{t("insight02Pre")}</div>
              <h3>{t("insight02Title")}</h3>
              <p>
                {t("insight02Body")}
              </p>
            </div>
            <div className="mi-insight">
              <div className="ipre">{t("insight03Pre")}</div>
              <h3>{t("insight03Title")}</h3>
              <p>
                {t("insight03Body")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaStrip
        eyebrow={t("ctaEyebrow")}
        title={
          <>
            {t("ctaTitle1")} <br />
            <span className="italic">{t("ctaTitle2")}</span>
          </>
        }
        sub={t("ctaSub")}
        primary={{ label: t("ctaPrimary"), href: "/analyseportal" }}
        secondary={{ label: t("ctaSecondary"), href: "/kontakt" }}
      />
    </>
  )
}
