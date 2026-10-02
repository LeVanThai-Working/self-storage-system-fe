import { useLocale, useTranslations } from "next-intl";
import { Award, Clock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/common/logo";
import {
  FOOTER_LEGAL_ITEMS,
  FOOTER_SERVICE_LINKS,
  FOOTER_SUPPORT_LINKS,
} from "@/features/landing/constants";

const CONTACT_ITEMS = [
  { id: "address", icon: MapPin },
  { id: "hotline", icon: Phone },
  { id: "email", icon: Mail },
] as const;

const SAFETY_ITEMS = [
  { id: "camera", icon: ShieldCheck, iconClass: "text-brand" },
  { id: "access", icon: Clock, iconClass: "text-brand" },
  { id: "insurance", icon: Award, iconClass: "text-cta" },
] as const;

export function LandingFooter() {
  const t = useTranslations("landing.footer");
  const locale = useLocale();

  const columnTitleClass = "text-sm font-semibold tracking-wider text-white uppercase";
  const linkListClass = "space-y-2 text-sm text-[#A0B6B9]";

  return (
    <footer
      id="support"
      className="w-full border-t border-brand-dark bg-neutral-main pt-16 pb-12 text-white"
    >
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-[#1D3E43] pb-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          <div className="space-y-4 lg:col-span-2">
            <Logo href={`/${locale}`} inverted showTagline={false} />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#A0B6B9]">
              {t("description")}
            </p>
            <ul className="flex flex-col gap-2.5 pt-2 text-xs text-[#CBD8D8]">
              {CONTACT_ITEMS.map(({ id, icon: Icon }) => (
                <li key={id} className="flex items-center gap-2.5">
                  <Icon className="size-4 shrink-0 text-brand" />
                  {t(id)}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className={columnTitleClass}>{t("services.title")}</h3>
            <ul className={linkListClass}>
              {FOOTER_SERVICE_LINKS.map(({ id, href }) => (
                <li key={id}>
                  <a href={href} className="transition-colors hover:text-white">
                    {t(`services.items.${id}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className={columnTitleClass}>{t("support.title")}</h3>
            <ul className={linkListClass}>
              {FOOTER_SUPPORT_LINKS.map(({ id, href }) => (
                <li key={id}>
                  <a href={href} className="transition-colors hover:text-white">
                    {t(`support.items.${id}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className={columnTitleClass}>{t("safety.title")}</h3>
            <ul className="space-y-3 text-xs text-[#A0B6B9]">
              {SAFETY_ITEMS.map(({ id, icon: Icon, iconClass }) => (
                <li key={id} className="flex items-start gap-2.5">
                  <Icon className={`mt-0.5 size-4 shrink-0 ${iconClass}`} />
                  {t(`safety.items.${id}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-neutral-muted sm:flex-row">
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          {/* TODO: link to the legal pages once they exist. */}
          <div className="flex items-center gap-6">
            {FOOTER_LEGAL_ITEMS.map((id) => (
              <span key={id} className="transition-colors hover:text-[#A0B6B9]">
                {t(`legal.${id}`)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
