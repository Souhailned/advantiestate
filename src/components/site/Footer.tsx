import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { footerColumns } from "@/lib/navigation";
import { getCities } from "@/lib/navigationServer";
import { FooterCityLinks } from "./FooterCityLinks";

/** Shared site footer with the large editorial wordmark. */
export async function Footer() {
  const t = await getTranslations();
  const cities = getCities();
  const tjenester = footerColumns.tjenester;
  const advanti = footerColumns.advanti;

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Link prefetch={false} href="/" className="nav-logo">
              <span className="mark" />
              <span>
                Advanti
                <span style={{ fontStyle: "italic", fontWeight: 300 }}>.</span>
              </span>
              <span className="sub">Estate</span>
            </Link>
            <p>
              {t("Footer.brandDescription")}
            </p>
          </div>

          <div className="footer-col">
            <h4>{t("Footer.colTjenester")}</h4>
            <ul>
              {tjenester.map((l) => (
                <li key={l.path}>
                  <Link prefetch={false} href={l.path}>{t(l.label)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t("Footer.colAdvanti")}</h4>
            <ul>
              {advanti.map((l) => (
                <li key={l.path}>
                  <Link prefetch={false} href={l.path}>{t(l.label)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-col">
            <h4>{t("Footer.colCities")}</h4>
            <FooterCityLinks cities={cities} />
          </div>

          <div className="footer-col">
            <h4>{t("Footer.colOffice")}</h4>
            <address className="addr">
              {t("Footer.officeBodo")}
              <br />
              {t("Footer.officeBodoPostal")}
              <br />
              <br />
              {t("Footer.officeAlta")}
              <br />
              {t("Footer.officeAltaPostal")}
              <br />
              {t("Footer.officeAltaFloor")}
            </address>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            {t("Footer.copyright", { year: new Date().getFullYear() })}
          </span>
          <span>
            <Link prefetch={false} href="/privacy">{t("Footer.privacy")}</Link> ·{" "}
            <Link prefetch={false} href="/terms">{t("Footer.terms")}</Link>
          </span>
        </div>

        <div className="footer-wordmark">
          Advanti<span className="italic">.</span>Estate
        </div>
      </div>
    </footer>
  );
}
