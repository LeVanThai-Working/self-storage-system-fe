import Image from "next/image";
import { useTranslations } from "next-intl";
import { StorageSearchPanel } from "@/features/landing/components/storage-search-panel";
import { TrustIndicators } from "@/features/landing/components/trust-indicators";

const HERO_IMAGE = "/images/landing/hero-facility.jpg";

export function HeroSection() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative z-10 flex w-full flex-col bg-brand-pageBg pt-12 pb-16 xl:min-h-[840px] xl:pt-20 xl:pb-12">
      {/* Organic "cloud" mask for the desktop hero image */}
      <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden>
        <defs>
          <clipPath id="hero-cloud-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0.35 0 C 0.1 0, 0.05 0.35, 0.2 0.5 C 0.3 0.6, 0.5 0.85, 1 0.85 L 1 0 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Decorative blobs */}
      <div
        className="pointer-events-none absolute inset-0 z-0 mx-auto max-w-[1920px] overflow-hidden"
        aria-hidden
      >
        <div className="absolute top-[8%] left-[45%] hidden size-10 rotate-12 rounded-sm bg-[#8CA99B] opacity-90 xl:block" />
        <div className="absolute top-[5%] left-[32%] hidden size-[450px] rounded-full bg-[#E3EBE7] opacity-80 mix-blend-multiply blur-xl xl:block" />
        <div className="absolute top-[45%] left-[38%] hidden h-[350px] w-[250px] rotate-[-25deg] rounded-[100px] bg-[#8CA99B] opacity-40 blur-2xl xl:block" />
      </div>

      {/* Desktop image */}
      <div className="pointer-events-none absolute inset-0 z-0 flex items-end justify-end xl:items-stretch">
        <div
          className="relative hidden h-full w-[60%] xl:block"
          style={{ clipPath: "url(#hero-cloud-clip)" }}
        >
          <Image
            src={HERO_IMAGE}
            alt={t("imageAlt")}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="60vw"
            className="scale-[1.02] object-cover object-left-top"
          />
          <div className="absolute inset-0 bg-linear-to-r from-transparent to-brand-dark/5 mix-blend-multiply" />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] grow flex-col px-4 pt-4 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
        <div className="max-w-[500px] lg:max-w-[540px] xl:max-w-[580px]">
          <span className="mb-6 inline-flex items-center rounded-full bg-brand-light px-4 py-1.5 text-xs font-semibold text-brand-dark shadow-sm sm:text-sm">
            {t("badge")}
          </span>
          <h1 className="mb-5 text-4xl leading-[1.15] font-extrabold tracking-tight text-neutral-main sm:text-5xl lg:text-[46px] xl:text-[54px]">
            {t.rich("title", {
              br: () => <br className="hidden sm:block" />,
              highlight: (chunks) => <span className="text-cta">{chunks}</span>,
            })}
          </h1>
          <p className="max-w-[95%] text-base leading-relaxed text-neutral-muted sm:text-lg">
            {t.rich("description", {
              br: () => <br className="hidden sm:inline" />,
            })}
          </p>
        </div>

        {/* Mobile / tablet image */}
        <div className="relative mt-8 mb-4 h-[280px] w-full overflow-hidden rounded-3xl border border-neutral-border shadow-lg sm:h-[400px] lg:h-[460px] xl:hidden">
          <Image
            src={HERO_IMAGE}
            alt={t("imageAlt")}
            fill
            loading="eager"
            sizes="(min-width: 1280px) 1px, 100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-linear-to-t from-brand-dark/20 to-transparent mix-blend-multiply" />
        </div>

        <div className="hidden min-h-[100px] grow xl:block" />

        <div className="relative z-30 mt-auto w-full pb-4 xl:pb-0">
          <div className="mb-8">
            <StorageSearchPanel />
          </div>

          <div className="flex flex-col justify-between gap-8 xl:flex-row xl:items-start xl:gap-4">
            <div className="flex-1">
              <TrustIndicators />
            </div>

            <div className="hidden shrink-0 flex-col items-end select-none xl:flex" aria-hidden>
              <svg
                viewBox="0 0 70 40"
                fill="none"
                stroke="currentColor"
                className="mb-1 ml-[-8px] h-10 w-14 self-start text-brand"
              >
                <path d="M 5 5 C 15 20, 35 32, 55 35" strokeWidth="1.5" strokeLinecap="round" />
                <path
                  d="M 48 28 L 55 35 L 46 37"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-handwriting text-[15px] font-bold tracking-wide text-brand-dark">
                {t("annotationLine1")}
              </span>
              <span className="flex items-center gap-1.5 font-handwriting text-[15px] font-bold tracking-wide text-brand-dark">
                {t("annotationLine2")}
                <span className="animate-pulse font-sans text-sm text-cta">✦</span>
              </span>
              <svg viewBox="0 0 100 12" fill="none" className="mt-0.5 h-2.5 w-32 text-brand">
                <path
                  d="M2 9C25 3 75 2 98 8"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
