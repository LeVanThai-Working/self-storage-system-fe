import { useTranslations } from "next-intl";
import { BENEFIT_ITEMS } from "@/features/landing/constants";

export function BenefitsSection() {
  const t = useTranslations("landing.benefits");

  return (
    <section id="benefits" className="border-y border-neutral-border/60 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {BENEFIT_ITEMS.map(({ id, icon: Icon }) => (
            <article
              key={id}
              className="group flex flex-col rounded-2xl border border-neutral-border bg-white p-6 text-left shadow-benefit transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg"
            >
              <div className="mb-5 flex size-13 items-center justify-center rounded-2xl bg-linear-to-br from-[#E8FAF4] to-brand-light shadow-xs transition-transform duration-300 group-hover:scale-105">
                <Icon className="size-6 stroke-[2.2] text-brand" />
              </div>
              <h3 className="mb-2 text-base leading-snug font-bold text-neutral-main transition-colors group-hover:text-brand">
                {t(`${id}.title`)}
              </h3>
              <p className="flex-1 text-xs leading-relaxed text-neutral-muted sm:text-[13px]">
                {t(`${id}.description`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
