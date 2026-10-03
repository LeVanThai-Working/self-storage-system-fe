import Image from "next/image";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { TESTIMONIALS } from "@/features/landing/constants";

const MAX_RATING = 5;

export function TestimonialsSection() {
  const t = useTranslations("landing.testimonials");

  return (
    <section
      id="testimonials"
      className="border-t border-neutral-border/60 bg-white py-20 sm:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-4 text-center sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-2xl space-y-3">
          <span className="block text-xs font-bold tracking-wider text-cta uppercase">
            {t("eyebrow")}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-neutral-main sm:text-4xl">
            {t("title")}
          </h2>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 text-left md:grid-cols-3 lg:gap-8">
          {TESTIMONIALS.map(({ id, avatar, rating }) => (
            <figure
              key={id}
              className="flex flex-col justify-between rounded-[26px] bg-[#F5F2EA] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:p-7 md:p-5 lg:p-7"
            >
              <div>
                <figcaption className="mb-4 flex items-center gap-3.5 md:gap-3 lg:gap-3.5">
                  <Image
                    src={avatar}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 rounded-full border border-white object-cover shadow-xs"
                  />
                  <div>
                    <div className="text-sm leading-snug font-bold text-neutral-main sm:text-base md:text-sm lg:text-base">
                      {t(`items.${id}.name`)}
                    </div>
                    <div className="text-xs text-[#7B8F92]">{t(`items.${id}.role`)}</div>
                  </div>
                </figcaption>
                <div
                  className="mb-4 flex items-center gap-1"
                  role="img"
                  aria-label={t("rating", { rating })}
                >
                  {Array.from({ length: MAX_RATING }, (_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-4 stroke-none",
                        i < rating ? "fill-[#F59E0B]" : "fill-[#D1D5DB]"
                      )}
                    />
                  ))}
                </div>
                <blockquote className="text-xs leading-relaxed text-[#2B3E42] sm:text-[13px]">
                  &ldquo;{t(`items.${id}.content`)}&rdquo;
                </blockquote>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
