import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { HOW_IT_WORKS_STEPS } from "@/features/landing/constants";

export function HowItWorksSection() {
  const t = useTranslations("landing.howItWorks");

  return (
    <section id="how-it-works" className="border-t border-neutral-border/60 bg-white py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-left sm:mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-main sm:text-4xl">
            {t.rich("title", {
              highlight: (chunks) => <span className="text-cta">{chunks}</span>,
            })}
          </h2>
          <p className="mt-2 text-sm font-medium text-neutral-muted sm:text-base">
            {t("subtitle")}
          </p>
        </div>

        <ol className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {HOW_IT_WORKS_STEPS.map(({ id, icon: Icon }, index) => (
            <li key={id} className="group relative flex flex-col">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shadow-xs transition-transform group-hover:scale-110">
                  {index + 1}
                </span>
                <div className="flex size-8 items-center justify-center rounded-lg bg-brand-bg">
                  <Icon className="size-5 text-brand" />
                </div>
                <h3 className="text-base font-bold text-neutral-main transition-colors group-hover:text-brand">
                  {t(`steps.${id}.title`)}
                </h3>
                {index < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div
                    className="ml-auto hidden items-center pr-2 text-[#CBD8D8] lg:flex"
                    aria-hidden
                  >
                    <ArrowRight className="size-4 stroke-2" />
                  </div>
                )}
              </div>
              <p className="pl-10 text-left text-xs leading-relaxed text-neutral-muted sm:text-sm">
                {t(`steps.${id}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
