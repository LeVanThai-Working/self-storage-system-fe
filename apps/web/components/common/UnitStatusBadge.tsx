"use client";

import { useTranslations } from "next-intl";
import { StorageUnitStatusEnum } from "@self-storage-system-fe/shared";

const STATUS_STYLES: Record<StorageUnitStatusEnum, { badge: string; dot: string }> = {
  [StorageUnitStatusEnum.AVAILABLE]: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  [StorageUnitStatusEnum.RESERVED]: {
    badge: "bg-amber-50 text-amber-700 border-amber-200/80",
    dot: "bg-amber-500",
  },
  [StorageUnitStatusEnum.OCCUPIED]: {
    badge: "bg-rose-50 text-rose-700 border-rose-200/80",
    dot: "bg-rose-500",
  },
  [StorageUnitStatusEnum.UNDER_MAINTENANCE]: {
    badge: "bg-orange-50 text-orange-700 border-orange-200/80",
    dot: "bg-orange-500",
  },
  [StorageUnitStatusEnum.INACTIVE]: {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

interface UnitStatusBadgeProps {
  status: StorageUnitStatusEnum;
}

/** Available (xanh), Reserved (vàng), Occupied (đỏ), Under Maintenance (cam), Inactive (xám). */
export const UnitStatusBadge = ({ status }: UnitStatusBadgeProps) => {
  const t = useTranslations("storageUnitStatus");
  const style = STATUS_STYLES[status] ?? STATUS_STYLES[StorageUnitStatusEnum.INACTIVE];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {t.has(status) ? t(status) : status}
    </span>
  );
};
