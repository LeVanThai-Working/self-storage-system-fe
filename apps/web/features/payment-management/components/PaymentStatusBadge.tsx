import React from "react";
import { useLocale } from "next-intl";
import { PaymentStatusEnum } from "../types";
import { getPaymentStatusConfig } from "../utils";

interface PaymentStatusBadgeProps {
  status: PaymentStatusEnum | string;
  className?: string;
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  className = "",
}) => {
  const locale = useLocale();
  const config = getPaymentStatusConfig(status, locale);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${config.badgeClass} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dotClass}`} />
      <span>{config.label}</span>
    </span>
  );
};
