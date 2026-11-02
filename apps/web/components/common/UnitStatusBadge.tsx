"use client";

import React from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  StorageUnitStatusEnum,
  UnitTypeCategoryEnum,
  type RackCapacity,
} from "@self-storage-system-fe/shared";
import { ActionTooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface UnitStatusBadgeProps {
  status: StorageUnitStatusEnum | string;
  category?: string | null;
  rackCapacity?: RackCapacity | null;
  className?: string;
}

export const UnitStatusBadge = ({
  status,
  category,
  rackCapacity,
  className,
}: UnitStatusBadgeProps) => {
  const t = useTranslations("storageUnitStatus");
  const locale = useLocale();
  const isEn = locale === "en";

  const normStatus = String(status || "").toLowerCase();
  const normCategory = String(category || "").toLowerCase();
  const isWarehouse =
    normCategory === UnitTypeCategoryEnum.WAREHOUSE_RACK || normCategory === "warehouse_rack";

  let label = "";
  let badgeStyle = "";
  let dotStyle = "";
  let tooltip = "";

  // 1. Kho đang bảo trì (Ưu tiên cao nhất)
  if (
    normStatus === StorageUnitStatusEnum.UNDER_MAINTENANCE ||
    normStatus === "under_maintenance"
  ) {
    label = isEn ? "Under maintenance" : "Đang bảo trì";
    badgeStyle = "bg-orange-50 text-orange-700 border-orange-200/80";
    dotStyle = "bg-orange-500";
    tooltip = isEn
      ? "Storage unit is currently under maintenance"
      : "Phòng kho đang trong quá trình bảo trì";
  }
  // 3. Kho Kệ Pallet (category === 'warehouse_rack')
  else if (isWarehouse) {
    if (!rackCapacity || rackCapacity.total === 0) {
      label = isEn ? "No racks set up" : "Chưa thiết lập kệ";
      badgeStyle = "bg-slate-100 text-slate-600 border-slate-200";
      dotStyle = "bg-slate-400";
      tooltip = isEn
        ? "Total: 0 | No racks configured in this unit yet"
        : "Tổng: 0 | Chưa có kệ nào được thiết lập trong kho này";
    } else {
      const { total, available, occupied, availablePercentage } = rackCapacity;
      tooltip = isEn
        ? `Total: ${total} | Occupied: ${occupied} | Available: ${available} (${availablePercentage}%)`
        : `Tổng: ${total} | Đang thuê: ${occupied} | Còn trống: ${available} (${availablePercentage}%)`;

      if (availablePercentage === 0) {
        label = isEn ? `Full (${total}/${total})` : `Hết kệ (${total}/${total})`;
        badgeStyle = "bg-rose-50 text-rose-700 border-rose-200/80";
        dotStyle = "bg-rose-500";
      } else if (availablePercentage < 20) {
        label = isEn
          ? `Almost full (${available}/${total} racks)`
          : `Sắp kín (${available}/${total} kệ)`;
        badgeStyle = "bg-amber-50 text-amber-700 border-amber-200/80";
        dotStyle = "bg-amber-500";
      } else if (availablePercentage === 100) {
        label = isEn ? `Available (${total}/${total} racks)` : `Còn trống (${total}/${total} kệ)`;
        badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
        dotStyle = "bg-emerald-500";
      } else {
        // 20% <= availablePercentage < 100%
        label = isEn
          ? `Available (${available}/${total} racks)`
          : `Còn chỗ (${available}/${total} kệ)`;
        badgeStyle = "bg-blue-50 text-blue-700 border-blue-200/80";
        dotStyle = "bg-blue-500";
      }
    }
  }
  // 2. Kho phòng riêng (Locker, Small, Large - Single Tenant)
  else {
    if (normStatus === StorageUnitStatusEnum.AVAILABLE || normStatus === "available") {
      label = isEn ? "Available" : "Còn trống";
      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      dotStyle = "bg-emerald-500";
    } else if (normStatus === StorageUnitStatusEnum.OCCUPIED || normStatus === "occupied") {
      label = isEn ? "Occupied" : "Đang thuê";
      badgeStyle = "bg-blue-50 text-blue-700 border-blue-200/80";
      dotStyle = "bg-blue-500";
    } else if (normStatus === StorageUnitStatusEnum.RESERVED || normStatus === "reserved") {
      label = isEn ? "Reserved" : "Đang giữ chỗ";
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200/80";
      dotStyle = "bg-amber-500";
    } else if (normStatus === StorageUnitStatusEnum.INACTIVE || normStatus === "inactive") {
      label = isEn ? "Inactive" : "Ngừng sử dụng";
      badgeStyle = "bg-slate-100 text-slate-600 border-slate-200";
      dotStyle = "bg-slate-400";
    } else if (
      normStatus === StorageUnitStatusEnum.PENDING_CLEARANCE ||
      normStatus === "pending_clearance"
    ) {
      label = isEn ? "Pending clearance" : "Chờ dọn kho / Niêm phong";
      badgeStyle = "bg-red-950/10 text-red-900 border-red-800/40 border-dashed";
      dotStyle = "bg-red-800";
    } else {
      label = t.has(normStatus) ? t(normStatus) : normStatus;
      badgeStyle = "bg-slate-100 text-slate-600 border-slate-200";
      dotStyle = "bg-slate-400";
    }
  }

  const badgeContent = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors select-none",
        badgeStyle,
        className
      )}
      title={tooltip || undefined}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotStyle)} />
      <span>{label}</span>
    </span>
  );

  if (tooltip) {
    return <ActionTooltip content={tooltip}>{badgeContent}</ActionTooltip>;
  }

  return badgeContent;
};
