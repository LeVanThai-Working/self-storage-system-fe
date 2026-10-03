import { useTranslations } from "next-intl";
import { CircleCheck } from "lucide-react";
import { TRUST_INDICATORS } from "@/features/landing/constants";

export function TrustIndicators() {
  const t = useTranslations("landing.trust");

  return (
    <ul className="flex w-full flex-wrap items-center justify-between gap-x-6 gap-y-3 px-2 pt-6 pb-2 sm:px-4">
      {TRUST_INDICATORS.map((id) => (
        <li
          key={id}
          className="flex items-center gap-2.5 text-xs font-semibold text-neutral-main/80 transition-colors hover:text-brand-dark sm:text-sm"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-brand text-white shadow-xs">
            <CircleCheck className="size-3.5 stroke-[2.5]" />
          </span>
          {t(id)}
        </li>
      ))}
    </ul>
  );
}
