import React from "react";
import { useLocale } from "next-intl";
import { Banknote, CreditCard, QrCode } from "lucide-react";
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

  const getIcon = () => {
    switch (method) {
      case PaymentMethodEnum.SEPAY_QR:
      case PaymentMethodEnum.QR_CODE:
        return <QrCode className="w-3 h-3 text-sky-700" />;
      case PaymentMethodEnum.CASH:
        return <Banknote className="w-3 h-3 text-emerald-700" />;
      case PaymentMethodEnum.BANK_TRANSFER:
        return <CreditCard className="w-3 h-3 text-indigo-700" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap shrink-0 gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${config.badgeClass} ${className}`}
    >
      {getIcon()}
      <span>{config.label}</span>
    </span>
  );
};
