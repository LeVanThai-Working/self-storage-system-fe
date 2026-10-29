"use client";

import { useTranslations } from "next-intl";
import {
  Bell,
  Building2,
  CircleHelp,
  Droplets,
  ShieldAlert,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  IncidentCategoryEnum,
  IncidentSeverityEnum,
  IncidentStatusEnum,
} from "@self-storage-system-fe/shared";

const STATUS_STYLE: Record<IncidentStatusEnum, string> = {
  [IncidentStatusEnum.REPORTED]: "bg-amber-50 text-amber-700 border-amber-200/80",
  [IncidentStatusEnum.ASSIGNED]: "bg-sky-50 text-sky-600 border-sky-100",
  [IncidentStatusEnum.INVESTIGATING]: "bg-sky-50 text-sky-700 border-sky-200/80",
  [IncidentStatusEnum.IN_PROGRESS]: "bg-violet-50 text-violet-700 border-violet-200/80",
  [IncidentStatusEnum.RESOLVED]: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  [IncidentStatusEnum.CLOSED]: "bg-slate-200 text-slate-700 border-slate-300",
  [IncidentStatusEnum.CANCELLED]: "bg-slate-100 text-slate-500 border-slate-200",
};

const SEVERITY_STYLE: Record<IncidentSeverityEnum, string> = {
  [IncidentSeverityEnum.LOW]: "bg-slate-100 text-slate-600 border-slate-200",
  [IncidentSeverityEnum.MEDIUM]: "bg-amber-50 text-amber-700 border-amber-200/80",
  [IncidentSeverityEnum.HIGH]: "bg-orange-50 text-orange-700 border-orange-200/80",
  [IncidentSeverityEnum.CRITICAL]: "bg-rose-50 text-rose-700 border-rose-200/80",
};

export const CATEGORY_ICON: Record<IncidentCategoryEnum, LucideIcon> = {
  [IncidentCategoryEnum.STRUCTURAL]: Building2,
  [IncidentCategoryEnum.ELECTRICAL]: Zap,
  [IncidentCategoryEnum.WATER_LEAK]: Droplets,
  [IncidentCategoryEnum.SECURITY]: ShieldAlert,
  [IncidentCategoryEnum.CLEANLINESS]: Sparkles,
  [IncidentCategoryEnum.OTHER]: CircleHelp,
};

const pill =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap";

export const IncidentStatusBadge = ({ status }: { status: IncidentStatusEnum }) => {
  const t = useTranslations("incidentDesk.status");
  return <span className={`${pill} ${STATUS_STYLE[status]}`}>{t(status)}</span>;
};

export const IncidentSeverityBadge = ({ severity }: { severity: IncidentSeverityEnum }) => {
  const t = useTranslations("incidentDesk.severity");
  return (
    <span className={`${pill} ${SEVERITY_STYLE[severity]}`}>
      {severity === IncidentSeverityEnum.CRITICAL ? <Bell className="h-3 w-3" /> : null}
      {t(severity)}
    </span>
  );
};

export const IncidentCategoryLabel = ({ category }: { category: IncidentCategoryEnum }) => {
  const t = useTranslations("incidentDesk.category");
  const Icon = CATEGORY_ICON[category];
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-600">
      <Icon className="h-3.5 w-3.5" />
      {t(category)}
    </span>
  );
};
