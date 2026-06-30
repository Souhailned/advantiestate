import { Button } from "@/components/Button"
import { ArrowAnimated } from "@/components/ui/ArrowAnimated"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { DatabaseLogo } from "../../../public/DatabaseLogo"
import { siteConfig } from "@/app/siteConfig"

export default function NotFound() {
  const t = useTranslations()
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Link href={siteConfig.baseLinks.home}>
        <DatabaseLogo className="mt-6 h-10" />
      </Link>
      <p className="text-warm-grey mt-6 text-4xl font-semibold sm:text-5xl">
        404
      </p>
      <h1 className="text-warm-grey mt-4 text-2xl font-semibold">
        {t("NotFound.title")}
      </h1>
      <p className="text-warm-grey-2 mt-2 text-sm">
        {t("NotFound.description")}
      </p>
      <Button asChild className="group mt-8">
        <Link href={siteConfig.baseLinks.home}>
          {t("NotFound.goHome")}
          <ArrowAnimated
            className="text-warm-white"
            aria-hidden="true"
          />
        </Link>
      </Button>
    </div>
  )
}
