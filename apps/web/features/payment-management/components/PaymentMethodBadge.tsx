import React from "react";
import { useLocale } from "next-intl";
import { PaymentMethodEnum } from "../types";
import { getPaymentMethodConfig } from "../utils";

interface PaymentMethodBadgeProps {
  method: PaymentMethodEnum | string;
  className?: string;
}

export const PaymentMethodBadge: React.FC<PaymentMethodBadgeProps> = ({
  method,
  className = "",
}) => {
  const locale = useLocale();
  const config = getPaymentMethodConfig(method, locale);

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap shrink-0 gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${config.badgeClass} ${className}`}
    >
      <span>{config.label}</span>
    </span>
  );
};
