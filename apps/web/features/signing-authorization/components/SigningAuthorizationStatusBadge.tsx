"use client";

import React from "react";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

interface SigningAuthorizationStatusBadgeProps {
  status: "active" | "revoked" | "expired" | string;
}

export const SigningAuthorizationStatusBadge: React.FC<SigningAuthorizationStatusBadgeProps> = ({
  status,
}) => {
  const t = useTranslations("signingAuthorizations.status");

  switch (status) {
    case "active":
      return (
        <Badge
          variant="outline"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t("active")}</span>
        </Badge>
      );
    case "revoked":
      return (
        <Badge
          variant="outline"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50"
        >
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>{t("revoked")}</span>
        </Badge>
      );
    case "expired":
      return (
        <Badge
          variant="outline"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50"
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>{t("expired")}</span>
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border-slate-200"
        >
          {status}
        </Badge>
      );
  }
};
