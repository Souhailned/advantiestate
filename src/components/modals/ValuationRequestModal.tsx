"use client"

import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/Select"
import Modal from "@/components/blog/modal"
import { RiCloseLine, RiCalculatorLine, RiCheckLine } from "@remixicon/react"
import { useRef, useState, type Dispatch, type SetStateAction } from "react"
import { useTranslations } from "next-intl"
import { submitCtaLead } from "@/app/actions/cta-lead"
import { trackLeadSubmit } from "@/lib/analytics"
import { useLeadStartOnFocus } from "@/lib/hooks/useLeadFunnel"

interface ValuationRequestModalProps {
  showModal: boolean
  setShowModal: Dispatch<SetStateAction<boolean>>
}

export default function ValuationRequestModal({
  showModal,
  setShowModal,
}: ValuationRequestModalProps) {
  const t = useTranslations("Modals.valuation")
  const tc = useTranslations("Modals.common")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const onFirstFocus = useLeadStartOnFocus("service-modal", "Verdsettelse")
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Synchronous double-submit guard: isSubmitting only flips after a re-render,
  // so two clicks in the same frame would both dispatch the lead.
  const submitting = useRef(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await submitCtaLead({
      formType: "Verdsettelse",
      name: `${formData.get("firstname")} ${formData.get("lastname")}`,
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? "") || undefined,
      pageUrl: window.location.pathname,
      fields: {
        Adresse: String(formData.get("address") ?? ""),
        Eiendomstype: String(formData.get("propertyType") ?? ""),
        Størrelse: String(formData.get("size") ?? ""),
        Leieinntekter: String(formData.get("income") ?? ""),
        Kostnader: String(formData.get("costs") ?? ""),
      },
    })

    setIsSubmitting(false)
    submitting.current = false
    if (result.ok) {
      trackLeadSubmit("service-modal", "Verdsettelse")
      setIsSuccess(true)
      setTimeout(() => { setShowModal(false); setIsSuccess(false) }, 3000)
    } else {
      setError(result.error)
    }
  }

  return (
    <Modal
      showModal={showModal}
      setShowModal={setShowModal}
      className="max-h-[85vh] overflow-y-auto"
    >
      <div className="relative bg-warm-white">
        {/* Header */}
        <div className="border-b border-warm-grey-1/20 bg-gradient-to-br from-light-blue/10 to-warm-white px-6 py-6">
          <button
            type="button"
            aria-label={tc("closeAriaLabel")}
            onClick={() => setShowModal(false)}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full text-warm-grey-2 transition-colors hover:bg-warm-grey-1/10"
          >
            <RiCloseLine aria-hidden="true" className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-light-blue/20 p-3">
              <RiCalculatorLine className="h-6 w-6 text-warm-grey" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-warm-grey">
                {t("title")}
              </h2>
              <p className="mt-1 text-sm text-warm-grey-2">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <div className="mb-4 rounded-full bg-green-100 p-4">
              <RiCheckLine className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-warm-grey">
              {tc("successTitle")}
            </h3>
            <p className="mt-2 text-center text-warm-grey-2">
              {t("successBody")}
            </p>
          </div>
        ) : (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} onFocusCapture={onFirstFocus} className="px-6 py-6">
              <div className="space-y-4">
                {/* Name Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstname"
                      className="mb-2 block text-sm font-medium text-warm-grey"
                    >
                      {tc("firstnameLabel")}
                    </label>
                    <Input
                      id="firstname"
                      name="firstname"
                      type="text"
                      placeholder={tc("firstnamePlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastname"
                      className="mb-2 block text-sm font-medium text-warm-grey"
                    >
                      {tc("lastnameLabel")}
                    </label>
                    <Input
                      id="lastname"
                      name="lastname"
                      type="text"
                      placeholder={tc("lastnamePlaceholder")}
                      required
                    />
                  </div>
                </div>

                {/* Contact Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-warm-grey"
                    >
                      {tc("emailLabel")}
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={tc("emailPlaceholder")}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-medium text-warm-grey"
                    >
                      {tc("phoneLabel")}
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder={tc("phonePlaceholder")}
                      required
                    />
                  </div>
                </div>

                {/* Address / Location */}
                <div>
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-medium text-warm-grey"
                  >
                    {t("addressLabel")}
                  </label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    placeholder={t("addressPlaceholder")}
                    required
                  />
                </div>

                {/* Property Type & Size */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="propertyType"
                      className="mb-2 block text-sm font-medium text-warm-grey"
                    >
                      {t("propertyTypeLabel")}
                    </label>
                    <Select name="propertyType" required>
                      <SelectTrigger id="propertyType">
                        <SelectValue placeholder={t("propertyTypePlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kontor">{t("propertyTypeKontor")}</SelectItem>
                        <SelectItem value="handel">{t("propertyTypeHandel")}</SelectItem>
                        <SelectItem value="industri">{t("propertyTypeIndustri")}</SelectItem>
                        <SelectItem value="bolig">{t("propertyTypeBolig")}</SelectItem>
                        <SelectItem value="hotell">{t("propertyTypeHotell")}</SelectItem>
                        <SelectItem value="annet">{t("propertyTypeAnnet")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label
                      htmlFor="size"
                      className="mb-2 block text-sm font-medium text-warm-grey"
                    >
                      {t("sizeLabel")}
                    </label>
                    <Input
                      id="size"
                      name="size"
                      type="text"
                      inputMode="numeric"
                      placeholder={t("sizePlaceholder")}
                    />
                  </div>
                </div>

                {/* Income & Costs */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="income"
                      className="mb-2 block text-sm font-medium text-warm-grey"
                    >
                      {t("incomeLabel")}
                    </label>
                    <Input
                      id="income"
                      name="income"
                      type="text"
                      inputMode="numeric"
                      placeholder={t("incomePlaceholder")}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="costs"
                      className="mb-2 block text-sm font-medium text-warm-grey"
                    >
                      {t("costsLabel")}
                    </label>
                    <Input
                      id="costs"
                      name="costs"
                      type="text"
                      inputMode="numeric"
                      placeholder={t("costsPlaceholder")}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? tc("submitting") : tc("submit")}
                </Button>
              </div>

              <p className="mt-4 text-center text-xs text-warm-grey-2">
                {t("consent")}
              </p>
            </form>
          </>
        )}
      </div>
    </Modal>
  )
}
