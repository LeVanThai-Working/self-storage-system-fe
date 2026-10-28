"use client";

import { useTranslations } from "next-intl";
import { Boxes, Users, Wrench } from "lucide-react";
import { FacilityAmenityOfferingStatusEnum } from "@self-storage-system-fe/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useFacilityStaffs } from "@/features/contract-management/hooks";
import { useFacilityAmenityOfferings } from "@/features/facility-amenity-management/hooks";
import { useMyFacility, useStorageUnitStats } from "@/features/storage-unit-management/hooks";

const AMENITY_LIMIT = 100;

function StatCard({
  label,
  value,
  tone,
  loading,
}: {
  label: string;
  value: number | string;
  tone: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-9 w-20" />
      ) : (
        <p className={`mt-1 text-3xl font-extrabold ${tone}`}>{value}</p>
      )}
    </div>
  );
}

function Bar({ percent, className }: { percent: number; className: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${className}`} style={{ width: `${percent}%` }} />
    </div>
  );
}

export function FacilityDashboardView() {
  const t = useTranslations("facilityManager.dashboard");
  const { data: facility, isLoading: facilityLoading, isError } = useMyFacility();
  const stats = useStorageUnitStats(facility?.id);
  const amenities = useFacilityAmenityOfferings({
    facilityId: facility?.id,
    limit: AMENITY_LIMIT,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  // The BE already limits this list to the manager's own facility.
  const staffs = useFacilityStaffs(undefined, Boolean(facility));

  if (isError) {
    return (
      <p className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-slate-500">
        {t("noFacility")}
      </p>
    );
  }

  const loading = facilityLoading || stats.isLoading;
  const occupancy = stats.total > 0 ? Math.round((stats.inUse / stats.total) * 100) : 0;
  const amenityItems = (amenities.data?.items ?? []).filter(
    (o) => o.status === FacilityAmenityOfferingStatusEnum.ACTIVE
  );
  const staffItems = staffs.data?.items ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{t("title")}</h1>
        <div className="mt-1 text-slate-500">
          {facility ? (
            t("subtitle", { facility: facility.name })
          ) : (
            <Skeleton className="h-5 w-72" />
          )}
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("stats.occupancy")}
          value={`${occupancy}%`}
          tone="text-emerald-600"
          loading={loading}
        />
        <StatCard
          label={t("stats.available")}
          value={stats.available}
          tone="text-slate-900"
          loading={loading}
        />
        <StatCard
          label={t("stats.inUse")}
          value={stats.inUse}
          tone="text-amber-600"
          loading={loading}
        />
        <StatCard
          label={t("stats.maintenance")}
          value={stats.maintenance}
          tone="text-orange-600"
          loading={loading}
        />
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-semibold text-slate-800">
            <Boxes className="size-4" aria-hidden /> {t("occupancyTitle")}
          </span>
          <span className="text-slate-500">{t("totalUnits", { count: stats.total })}</span>
        </div>
        <Bar percent={occupancy} className="bg-emerald-500" />
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
          <Wrench className="size-3.5" aria-hidden /> {t("occupancyNote")}
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">{t("amenities.title")}</h2>
          {amenities.isLoading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : amenities.isError ? (
            <p className="text-sm text-slate-500">{t("amenities.error")}</p>
          ) : amenityItems.length === 0 ? (
            <p className="text-sm text-slate-500">{t("amenities.empty")}</p>
          ) : (
            <ul className="space-y-4">
              {amenityItems.map((o) => {
                // Services have no stock: the BE sends no quantities for them.
                const hasStock = typeof o.totalQuantity === "number" && o.totalQuantity > 0;
                const usedPercent = hasStock
                  ? Math.round(((o.inUseQuantity ?? 0) / o.totalQuantity) * 100)
                  : 0;
                return (
                  <li key={o.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-slate-800">{o.amenity.name}</span>
                      <span className="text-slate-500">
                        {hasStock
                          ? t("amenities.stock", {
                              available: o.availableQuantity ?? 0,
                              total: o.totalQuantity,
                            })
                          : t("amenities.noStock")}
                      </span>
                    </div>
                    {hasStock && (
                      <>
                        <Bar percent={usedPercent} className="bg-amber-500" />
                        <p className="mt-1 text-xs text-slate-400">
                          {t("amenities.inUse", { count: o.inUseQuantity ?? 0 })}
                        </p>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <Users className="size-5" aria-hidden /> {t("staff.title")}
            {!staffs.isLoading && <span className="text-slate-400">({staffItems.length})</span>}
          </h2>
          {staffs.isLoading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : staffs.isError ? (
            <p className="text-sm text-slate-500">{t("staff.error")}</p>
          ) : staffItems.length === 0 ? (
            <p className="text-sm text-slate-500">{t("staff.empty")}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {staffItems.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{s.name}</p>
                    <p className="truncate text-slate-500">{s.email}</p>
                  </div>
                  <span className="shrink-0 text-slate-500">{s.phoneNumber ?? s.phone ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
