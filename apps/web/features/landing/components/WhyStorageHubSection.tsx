import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STATISTIC_ITEMS } from "@/features/landing/constants";

export function WhyStorageHubSection() {
  const t = useTranslations("landing.why");

  return (
    <section id="about" className="overflow-hidden bg-brand-pageBg py-20 sm:py-24">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 text-left lg:col-span-4">
            <span className="block text-xs font-bold tracking-wider text-cta uppercase">
              {t("eyebrow")}
            </span>
            <h2 className="text-3xl leading-tight font-extrabold tracking-tight text-neutral-main sm:text-4xl">
              {t.rich("title", { br: () => <br className="hidden sm:inline" /> })}
            </h2>
            <p className="text-sm leading-relaxed text-neutral-muted sm:text-base">
              {t("description")}
            </p>
            <a
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "group h-11 gap-2 rounded-full border-brand bg-white px-6 text-sm font-semibold text-brand hover:bg-brand-bg hover:text-brand"
              )}
            >
              {t("learnMore")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:col-span-5">
            {STATISTIC_ITEMS.map(({ id, icon: Icon }) => (
              <div
                key={id}
                className="flex flex-col justify-between rounded-2xl border border-neutral-border bg-white p-4 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand/40 min-[375px]:p-5 sm:p-6 lg:p-5 xl:p-6"
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-brand-light">
                  <Icon className="size-5 text-brand" />
                </div>
                <div>
                  {/* Sized so long values ("100.000+") fit the narrow 2-column card grid */}
                  <div className="text-xl font-extrabold tracking-tight text-neutral-main min-[375px]:text-2xl sm:text-3xl lg:text-2xl xl:text-3xl">
                    {t(`stats.${id}.value`)}
                  </div>
                  <div className="mt-1 text-xs font-bold text-neutral-main sm:text-sm">
                    {t(`stats.${id}.title`)}
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-neutral-muted sm:text-xs">
                    {t(`stats.${id}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative flex justify-center lg:col-span-3">
            <div
              className="absolute -inset-2 -z-10 rounded-full bg-brand-light opacity-60 blur-xl"
              aria-hidden
            />
            <div className="relative aspect-4/5 w-full max-w-[320px] overflow-hidden rounded-[32px] border-4 border-white bg-brand-light shadow-xl">
              <Image
                src="/images/landing/customer-moving.jpg"
                alt={t("imageAlt")}
                fill
                sizes="(min-width: 1024px) 320px, 90vw"
                className="object-cover object-top transition-transform duration-500 hover:scale-103"
              />
              <div className="absolute top-4 right-4 left-4 rounded-2xl border border-white/80 bg-white/95 p-3.5 text-left shadow-md backdrop-blur-sm select-none">
                <p className="font-handwriting text-xs leading-tight font-bold text-brand-dark sm:text-[13px]">
                  {t.rich("noteTitle", { br: () => <br /> })}
                </p>
                <div className="mt-1 flex items-center gap-1 font-sans text-[11px] font-bold text-cta">
                  {t("noteCaption")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
