import React from "react";
import { useLocale } from "next-intl";
import { PaymentPurposeEnum } from "../types";
import { getPaymentPurposeConfig } from "../utils";

interface PaymentPurposeBadgeProps {
  purpose: PaymentPurposeEnum | string;
  className?: string;
}

export const PaymentPurposeBadge: React.FC<PaymentPurposeBadgeProps> = ({
  purpose,
  className = "",
}) => {
  const locale = useLocale();
  const config = getPaymentPurposeConfig(purpose, locale);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold border ${config.badgeClass} ${className}`}
    >
      {config.label}
    </span>
  );
};
