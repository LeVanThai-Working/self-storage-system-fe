import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HOTLINE_HREF } from "@/features/landing/constants";

export function CallToActionSection() {
  const t = useTranslations("landing.cta");
  const locale = useLocale();

  return (
    <section className="relative overflow-hidden bg-[#08544D] py-20 text-white sm:py-24">
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[100px]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-[1280px] px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mx-auto max-w-2xl text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-4xl lg:text-[46px]">
          {t.rich("title", { br: () => <br /> })}
        </h2>
        <p className="mx-auto mt-4 mb-8 max-w-xl text-sm leading-relaxed text-brand-light/90 sm:text-base">
          {t("description")}
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={`/${locale}/register`}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "h-auto w-full rounded-full bg-white px-8 py-3.5 text-sm font-bold text-brand-dark shadow-lg hover:bg-brand-bg hover:text-brand-dark hover:shadow-xl active:bg-brand-light sm:w-auto"
            )}
          >
            {t("register")}
          </Link>
          <a
            href={HOTLINE_HREF}
            className="inline-flex w-full items-center justify-center rounded-full border border-[#1FB89D] px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 active:bg-white/20 sm:w-auto"
          >
            {t("contact")}
          </a>
        </div>

        <p className="mt-6 text-xs tracking-wide text-[#8DBDB5]">{t("note")}</p>
      </div>
    </section>
  );
}
