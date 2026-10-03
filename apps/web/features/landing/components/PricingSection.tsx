"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { formatCurrency } from "@self-storage-system-fe/shared";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type BillingCycle, HOTLINE_HREF, PRICING_PLANS } from "@/features/landing/constants";

const BILLING_CYCLES: BillingCycle[] = ["monthly", "annual"];

export function PricingSection() {
  const t = useTranslations("landing.pricing");
  const locale = useLocale();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const isAnnual = billingCycle === "annual";

  return (
    <section
      id="pricing"
      className="border-t border-neutral-border/60 bg-brand-pageBg py-20 sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-4 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl space-y-3">
          <span className="block text-xs font-bold tracking-wider text-cta uppercase">
            {t("eyebrow")}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-main sm:text-4xl">
            {t("title")}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-muted sm:text-base">
            {t("description")}
          </p>
        </div>

        <div
          role="group"
          aria-label={t("billingCycle")}
          className="mb-14 inline-flex items-center rounded-full border border-neutral-border bg-white p-1 shadow-xs"
        >
          {BILLING_CYCLES.map((cycle) => {
            const isActive = billingCycle === cycle;
            return (
              <button
                key={cycle}
                type="button"
                aria-pressed={isActive}
                onClick={() => setBillingCycle(cycle)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-6 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm",
                  isActive
                    ? "bg-brand-dark text-white shadow-xs"
                    : "text-neutral-muted hover:text-neutral-main"
                )}
              >
                {t(cycle)}
                {cycle === "annual" && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold sm:text-xs",
                      isAnnual ? "bg-cta text-white" : "bg-cta-light text-cta"
                    )}
                  >
                    {t("annualDiscount")}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 items-stretch gap-6 md:grid-cols-3 md:gap-4 lg:gap-8">
          {PRICING_PLANS.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const features = t.raw(`plans.${plan.id}.features`) as string[];
            const popular = plan.isPopular;

            return (
              <article
                key={plan.id}
                className={cn(
                  "flex flex-col justify-between rounded-[28px] p-7 text-left transition-all duration-300 sm:p-8 md:p-6 lg:p-8",
                  popular
                    ? "relative bg-[#0A6E5E] text-white shadow-xl ring-1 ring-brand-dark md:-translate-y-2"
                    : "border border-neutral-border bg-white shadow-sm hover:shadow-md"
                )}
              >
                <div>
                  {popular && (
                    <div className="mb-4">
                      <span className="inline-block rounded-full bg-cta px-3 py-1 text-[11px] font-bold text-white shadow-xs">
                        {t("popular")}
                      </span>
                    </div>
                  )}
                  <h3
                    className={cn(
                      "text-xl font-bold",
                      popular ? "text-white" : "text-neutral-main"
                    )}
                  >
                    {t(`plans.${plan.id}.name`)}
                  </h3>
                  <p
                    className={cn(
                      "mt-0.5 text-xs font-semibold",
                      popular ? "text-brand-light" : "text-neutral-muted"
                    )}
                  >
                    {t(`plans.${plan.id}.size`)}
                  </p>
                  <p
                    className={cn(
                      "mt-2 min-h-8 text-xs leading-relaxed",
                      popular ? "text-brand-light/85" : "text-[#8BA0A3]"
                    )}
                  >
                    {t(`plans.${plan.id}.description`)}
                  </p>

                  <div
                    className={cn(
                      "my-6 border-b pb-6",
                      popular ? "border-white/20" : "border-neutral-border"
                    )}
                  >
                    <div className="flex flex-wrap items-baseline gap-x-1">
                      <span
                        className={cn(
                          "text-3xl font-extrabold tracking-tight whitespace-nowrap sm:text-4xl md:text-2xl lg:text-3xl xl:text-4xl",
                          popular ? "text-white" : "text-neutral-main"
                        )}
                      >
                        {formatCurrency(price)}
                      </span>
                      <span
                        className={cn(
                          "text-xs",
                          popular ? "text-brand-light/90" : "text-neutral-muted"
                        )}
                      >
                        {t("perMonth")}
                      </span>
                    </div>
                    {isAnnual && (
                      <span
                        className={cn(
                          "mt-1 block text-[11px] font-medium",
                          popular ? "text-[#34D399]" : "text-brand"
                        )}
                      >
                        {t("annualNote")}
                      </span>
                    )}
                  </div>

                  <ul
                    className={cn(
                      "mb-8 space-y-3 text-xs sm:text-[13px]",
                      popular ? "text-[#E8FAF4]" : "text-[#364B4E]"
                    )}
                  >
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full",
                            popular ? "bg-white/20" : "bg-brand-light"
                          )}
                        >
                          <Check
                            className={cn(
                              "size-2.5 stroke-3",
                              popular ? "text-white" : "text-brand"
                            )}
                          />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/${locale}/register`}
                  className={cn(
                    buttonVariants({ variant: popular ? "ghost" : "primary" }),
                    "h-auto w-full rounded-2xl py-3.5 text-base",
                    popular
                      ? "bg-white font-bold text-brand-dark shadow-md hover:bg-brand-bg hover:text-brand-dark active:bg-brand-light"
                      : "bg-[#0B7564] font-semibold shadow-xs hover:bg-[#085C4E]"
                  )}
                >
                  {t("bookNow")}
                </Link>
              </article>
            );
          })}
        </div>

        <p className="mt-12 text-center text-xs text-neutral-muted sm:text-sm">
          {t("customPrompt")}{" "}
          <a href={HOTLINE_HREF} className="font-bold text-brand hover:underline">
            {t("customLink")}
          </a>
        </p>
      </div>
    </section>
  );
}
