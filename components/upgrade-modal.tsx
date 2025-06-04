"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Check } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

interface UpgradeModalProps {
  children: React.ReactNode
}

export function UpgradeModal({ children }: UpgradeModalProps) {
  const { t } = useLanguage()
  const [openFaq, setOpenFaq] = useState(0)

  const plans = [
    {
      name: t("free"),
      price: "$0",
      period: t("month"),
      description: t("freeDescription"),
      features: [t("freeFeature1"), t("freeFeature2"), t("freeFeature3")],
      popular: false,
      buttonText: t("getStarted"),
      buttonVariant: "secondary" as const,
    },
    {
      name: t("pro"),
      price: "$19",
      period: t("month"),
      description: t("proDescription"),
      features: [t("proFeature1"), t("proFeature2"), t("proFeature3"), t("proFeature4")],
      popular: true,
      buttonText: t("getStarted"),
      buttonVariant: "default" as const,
    },
    {
      name: t("team"),
      price: "$49",
      period: t("month"),
      description: t("teamDescription"),
      features: [t("teamFeature1"), t("teamFeature2"), t("teamFeature3"), t("teamFeature4"), t("teamFeature5")],
      popular: false,
      buttonText: t("getStarted"),
      buttonVariant: "secondary" as const,
    },
  ]

  const faqs = [
    {
      question: t("faqQuestion1"),
      answer: t("faqAnswer1"),
    },
    {
      question: t("faqQuestion2"),
      answer: t("faqAnswer2"),
    },
    {
      question: t("faqQuestion3"),
      answer: t("faqAnswer3"),
    },
  ]

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-50 p-6 -m-6">
          <div className="flex flex-col items-center gap-4 p-4 text-center">
            <h1 className="text-slate-900 tracking-tight text-3xl font-bold leading-tight">
              {t("pricingTitle")}
            </h1>
            <p className="text-slate-600 text-base font-normal leading-relaxed max-w-2xl">
              {t("pricingSubtitle")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`flex flex-1 flex-col gap-4 rounded-xl border bg-white p-6 shadow-lg transform hover:scale-105 transition-transform duration-300 ${
                  plan.popular ? "border-2 border-[#2A66A9] relative" : "border border-slate-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-6 -mt-3 bg-[#2A66A9] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {t("mostPopular")}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <h2 className="text-slate-900 text-xl font-semibold leading-tight">{plan.name}</h2>
                  <p className="flex items-baseline gap-1 text-slate-900">
                    <span className="text-slate-900 text-3xl font-bold leading-tight tracking-tighter">
                      {plan.price}
                    </span>
                    <span className="text-slate-500 text-base font-medium leading-tight">/{plan.period}</span>
                  </p>
                  <p className="text-slate-500 text-sm">{plan.description}</p>
                </div>
                <Button
                  variant={plan.buttonVariant}
                  className={`w-full ${
                    plan.popular
                      ? "bg-[#2A66A9] hover:bg-[#22558C] text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {plan.buttonText}
                </Button>
                <div className="flex flex-col gap-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="text-sm font-normal leading-normal flex items-center gap-3 text-slate-700"
                    >
                      <Check className="text-green-500 h-5 w-5" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 pt-8 pb-4">
            <h2 className="text-slate-900 text-2xl font-bold leading-tight tracking-tight">{t("faq")}</h2>
          </div>

          <div className="flex flex-col p-4 gap-4">
            {faqs.map((faq, index) => (
              <details
                key={index}
                className="flex flex-col rounded-xl border border-slate-200 bg-white px-5 py-3 group shadow-sm transition-shadow hover:shadow-lg"
                open={openFaq === index}
                onToggle={() => setOpenFaq(openFaq === index ? -1 : index)}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-2">
                  <p className="text-slate-800 text-base font-medium leading-normal">{faq.question}</p>
                  <svg
                    className={`text-slate-500 transition-transform duration-300 h-6 w-6 ${
                      openFaq === index ? "rotate-180" : ""
                    }`}
                    fill="currentColor"
                    viewBox="0 0 256 256"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                  </svg>
                </summary>
                <p className="text-slate-600 text-sm font-normal leading-relaxed pt-2 pb-2">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 