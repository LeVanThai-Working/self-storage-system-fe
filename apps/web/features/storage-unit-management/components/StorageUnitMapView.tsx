"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Boxes, Layers, RotateCw, Wrench } from "lucide-react";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { StorageUnitStatusEnum, type StorageUnitResponse } from "../types";

/** Tile colors follow UnitStatusBadge: green / amber / red / orange / grey. */
const TILE_STYLES: Record<StorageUnitStatusEnum, { tile: string; dot: string }> = {
  [StorageUnitStatusEnum.AVAILABLE]: {
    tile: "bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100",
    dot: "bg-emerald-500",
  },
  [StorageUnitStatusEnum.RESERVED]: {
    tile: "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100",
    dot: "bg-amber-500",
  },
  [StorageUnitStatusEnum.OCCUPIED]: {
    tile: "bg-rose-50 border-rose-300 text-rose-900 hover:bg-rose-100",
    dot: "bg-rose-500",
  },
  [StorageUnitStatusEnum.UNDER_MAINTENANCE]: {
    tile: "bg-orange-100 border-orange-300 text-orange-900 hover:bg-orange-200/70",
    dot: "bg-orange-500",
  },
  [StorageUnitStatusEnum.INACTIVE]: {
    tile: "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200/70",
    dot: "bg-slate-400",
  },
};

const NO_ZONE = "__no_zone__";

const byUnitNumber = (a: StorageUnitResponse, b: StorageUnitResponse) =>
  a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true, sensitivity: "base" });

interface FloorGroup {
  floor: number;
  total: number;
  zones: Array<{ zone: string; units: StorageUnitResponse[] }>;
}

/** floor (asc) -> zone (A-Z, unzoned last) -> units by unit number. */
const groupByFloorAndZone = (units: StorageUnitResponse[]): FloorGroup[] => {
  const floors = new Map<number, Map<string, StorageUnitResponse[]>>();
  for (const unit of units) {
    const zones = floors.get(unit.floor) ?? new Map<string, StorageUnitResponse[]>();
    const zoneKey = unit.zone?.trim() || NO_ZONE;
    zones.set(zoneKey, [...(zones.get(zoneKey) ?? []), unit]);
    floors.set(unit.floor, zones);
  }

  return [...floors.entries()]
    .sort(([a], [b]) => a - b)
    .map(([floor, zones]) => ({
      floor,
      total: [...zones.values()].reduce((sum, list) => sum + list.length, 0),
      zones: [...zones.entries()]
        .sort(([a], [b]) => {
          if (a === NO_ZONE) return 1;
          if (b === NO_ZONE) return -1;
          return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
        })
        .map(([zone, list]) => ({ zone, units: [...list].sort(byUnitNumber) })),
    }));
};

interface StorageUnitMapViewProps {
  units: StorageUnitResponse[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  hasActiveFilters: boolean;
  onRetry: () => void;
  onSelectUnit: (unit: StorageUnitResponse) => void;
}

export const StorageUnitMapView = ({
  units,
  isLoading,
  isError,
  error,
  hasActiveFilters,
  onRetry,
  onSelectUnit,
}: StorageUnitMapViewProps) => {
  const t = useTranslations("facilityManager.storageUnits");
  const tStatus = useTranslations("storageUnitStatus");
  const getErrorMessage = useApiErrorMessage();

  const floors = useMemo(() => groupByFloorAndZone(units), [units]);

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(
      Object.values(StorageUnitStatusEnum).map((status) => [status, 0])
    ) as Record<StorageUnitStatusEnum, number>;
    for (const unit of units) counts[unit.status] = (counts[unit.status] ?? 0) + 1;
    return counts;
  }, [units]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6 animate-pulse">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="h-5 bg-slate-100 rounded-md w-32" />
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 8 }).map((__, j) => (
                <div key={j} className="w-28 h-20 bg-slate-100 rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">{t("map.loadError")}</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">{getErrorMessage(error)}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Legend */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {t("map.legend")}
        </span>
        {Object.values(StorageUnitStatusEnum).map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`w-2.5 h-2.5 rounded-full ${TILE_STYLES[status].dot}`} />
            {tStatus(status)}
            <span className="font-bold text-slate-800">{statusCounts[status]}</span>
          </span>
        ))}
      </div>

      {units.length === 0 ? (
        <div className="py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
            <Boxes className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {hasActiveFilters ? t("empty.filteredTitle") : t("empty.title")}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {hasActiveFilters ? t("empty.filteredDescription") : t("map.emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="p-6 space-y-8">
          {floors.map((floor) => (
            <section key={floor.floor} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {t("location.floor", { floor: floor.floor })}
                </h3>
                <span className="text-xs text-slate-400">
                  {t("map.unitCount", { count: floor.total })}
                </span>
              </div>

              <div className="space-y-3 pl-1 sm:pl-10">
                {floor.zones.map(({ zone, units: zoneUnits }) => (
                  <div
                    key={zone}
                    className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4"
                  >
                    <div className="sm:w-24 flex-shrink-0 sm:pt-3 text-xs font-bold text-slate-500">
                      {zone === NO_ZONE ? t("map.noZone") : t("location.zone", { zone })}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {zoneUnits.map((unit) => {
                        const style =
                          TILE_STYLES[unit.status] ?? TILE_STYLES[StorageUnitStatusEnum.INACTIVE];
                        return (
                          <button
                            key={unit.id}
                            type="button"
                            onClick={() => onSelectUnit(unit)}
                            title={`${unit.unitNumber} · ${tStatus(unit.status)}${
                              unit.unitType ? ` · ${unit.unitType.name}` : ""
                            }`}
                            className={`relative w-28 h-20 rounded-2xl border-2 px-3 py-2 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer ${style.tile}`}
                          >
                            <span className="block font-mono font-black text-sm truncate">
                              {unit.unitNumber}
                            </span>
                            <span className="block text-[11px] opacity-75 truncate mt-0.5">
                              {unit.unitType ? `${unit.unitType.area} m²` : "—"}
                            </span>
                            <span className="absolute bottom-2 left-3 inline-flex items-center gap-1 text-[10px] font-semibold">
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              {tStatus(unit.status)}
                            </span>
                            {unit.status === StorageUnitStatusEnum.UNDER_MAINTENANCE && (
                              <Wrench className="absolute top-2 right-2 w-3.5 h-3.5 text-orange-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
