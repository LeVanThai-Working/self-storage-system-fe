"use client";

import React from "react";

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
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200 border hover:bg-emerald-50"
        >
          <span>{t("active")}</span>
        </Badge>
      );
    case "revoked":
      return (
        <Badge
          variant="outline"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 bg-rose-50 text-rose-700 border-rose-200 border hover:bg-rose-50"
        >
          <span>{t("revoked")}</span>
        </Badge>
      );
    case "expired":
      return (
        <Badge
          variant="outline"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 bg-amber-50 text-amber-700 border-amber-200 border hover:bg-amber-50"
        >
          <span>{t("expired")}</span>
        </Badge>
      );
    default:
      return (
        <Badge
          variant="outline"
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 bg-slate-50 text-slate-600 border-slate-200 border"
        >
          {status}
        </Badge>
      );
  }
};
