"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { RoleEnum } from "@self-storage-system-fe/shared";
import { useAuthStore } from "@/features/auth/store";
import { fetchStorageUnitById } from "@/features/contract-management/api";
import { UnitInventoryView } from "@/features/inventory-operations/components/UnitInventoryView";
import type { FacilityPortal } from "@/features/inventory-operations/components/RequestQueueView";
import { RackStructureView } from "./RackStructureView";

type Tab = "structure" | "goods";

/** Rack warehouse unit page: "Rack structure" (FE-34) and "Goods" (FE-35 S4) tabs. */
export function UnitRacksPage({
  unitId,
  portalBase,
}: {
  unitId: string;
  portalBase: FacilityPortal;
}) {
  const t = useTranslations("rackStructure");
  const locale = useLocale();
  // `?tab=goods` deep-links from a move ticket straight to the goods tab.
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(searchParams.get("tab") === "goods" ? "goods" : "structure");
  const currentUser = useAuthStore((state) => state.currentUser);
  const canManage =
    portalBase === "facility-manager" &&
    String(currentUser?.role ?? "").toLowerCase() === RoleEnum.FACILITY_MANAGER;
  const unitQuery = useQuery({
    queryKey: ["rack-unit", unitId],
    queryFn: () => fetchStorageUnitById(unitId),
  });
  const unit = unitQuery.data;
  const unitNumber = unit?.unitNumber ?? "";

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/${locale}/${portalBase}/storage-units`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("back")} / {unitNumber}
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
          {t("title", { unit: unitNumber })}
        </h1>
        {unit ? (
          <p className="mt-1 text-sm text-slate-500">
            {[
              t("floor", { floor: unit.floor }),
              unit.zone && t("zone", { zone: unit.zone }),
              unit.unitType?.name,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        <div className="mt-4 flex gap-6 border-b border-slate-200">
          {(["structure", "goods"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`border-b-2 pb-2.5 text-sm font-semibold ${
                tab === key ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500"
              }`}
            >
              {t(`tabs.${key}`)}
            </button>
          ))}
        </div>
      </div>

      {tab === "structure" ? (
        <RackStructureView unitId={unitId} unitNumber={unitNumber} canManage={canManage} />
      ) : (
        <UnitInventoryView unitId={unitId} />
      )}
    </div>
  );
}
