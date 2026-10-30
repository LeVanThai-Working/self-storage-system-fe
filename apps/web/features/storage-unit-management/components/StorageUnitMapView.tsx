"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Boxes, Layers, RotateCw, Wrench } from "lucide-react";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { StorageUnitStatusEnum, type StorageUnitResponse } from "../types";

/** Tile colors follow UnitStatusBadge: green / amber / red / orange / dark red / grey. */
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
  [StorageUnitStatusEnum.PENDING_CLEARANCE]: {
    tile: "bg-red-950/10 border-red-800 border-dashed text-red-950 hover:bg-red-950/20",
    dot: "bg-red-800",
  },
  [StorageUnitStatusEnum.INACTIVE]: {
    tile: "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200/70",
    dot: "bg-slate-400",
  },
};

const NO_ZONE = "__no_zone__";

const byUnitNumber = (a: StorageUnitResponse, b: StorageUnitResponse) =>
  a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true });

interface StorageUnitMapViewProps {
  units: StorageUnitResponse[];
  onSelectUnit: (unit: StorageUnitResponse) => void;
  selectedUnitId?: string;
  isLoading?: boolean;
  isError?: boolean;
  error?: unknown;
  hasActiveFilters?: boolean;
  onRetry?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const StorageUnitMapView: React.FC<StorageUnitMapViewProps> = ({
  units,
  onSelectUnit,
  selectedUnitId,
  isLoading,
  isError,
  error,
  hasActiveFilters,
  onRetry,
  onRefresh,
  isRefreshing,
}) => {
  const t = useTranslations("storageUnitStatus");
  const getErrorMessage = useApiErrorMessage();

  // Group by floor -> zone
  const floorMap = useMemo(() => {
    const map = new Map<number, Map<string, StorageUnitResponse[]>>();
    for (const unit of units) {
      if (!map.has(unit.floor)) {
        map.set(unit.floor, new Map());
      }
      const zoneMap = map.get(unit.floor)!;
      const zoneKey = unit.zone?.trim() || NO_ZONE;
      if (!zoneMap.has(zoneKey)) {
        zoneMap.set(zoneKey, []);
      }
      zoneMap.get(zoneKey)!.push(unit);
    }
    return map;
  }, [units]);

  const sortedFloors = useMemo(() => Array.from(floorMap.keys()).sort((a, b) => a - b), [floorMap]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, f) => (
          <div
            key={f}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 animate-pulse"
          >
            <div className="h-6 w-32 bg-slate-100 rounded-lg" />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-50 rounded-2xl border border-slate-100" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-3 text-rose-500">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-800">Không thể tải sơ đồ mặt bằng</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">{getErrorMessage(error)}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Thử lại
          </button>
        )}
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center shadow-sm">
        <Boxes className="mx-auto w-12 h-12 text-slate-300 mb-3" />
        <p className="text-sm font-semibold text-slate-600">
          {hasActiveFilters
            ? "Không tìm thấy phòng kho nào phù hợp với bộ lọc."
            : "Chưa có phòng kho nào trong sơ đồ mặt bằng."}
        </p>
      </div>
    );
  }

  const handleRefresh = onRefresh || onRetry;

  return (
    <div className="space-y-6">
      {/* Legend & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">
            Chú thích:
          </span>
          {Object.entries(TILE_STYLES).map(([stKey, style]) => (
            <div key={stKey} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
              <span className="text-slate-600 font-medium">{t.has(stKey) ? t(stKey) : stKey}</span>
            </div>
          ))}
        </div>

        {handleRefresh && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`}
            />
            Làm mới
          </button>
        )}
      </div>

      {/* Grid by Floor */}
      {sortedFloors.map((floor) => {
        const zoneMap = floorMap.get(floor)!;
        const sortedZones = Array.from(zoneMap.keys()).sort((a, b) => {
          if (a === NO_ZONE) return 1;
          if (b === NO_ZONE) return -1;
          return a.localeCompare(b);
        });

        const floorTotal = Array.from(zoneMap.values()).reduce((acc, cur) => acc + cur.length, 0);

        return (
          <div
            key={floor}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-900">Tầng {floor}</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/60">
                {floorTotal} phòng kho
              </span>
            </div>

            <div className="space-y-4">
              {sortedZones.map((zoneKey) => {
                const zoneUnits = (zoneMap.get(zoneKey) || []).slice().sort(byUnitNumber);
                const displayZoneTitle = zoneKey === NO_ZONE ? "Khu vực chung" : `Khu ${zoneKey}`;

                return (
                  <div key={zoneKey} className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 tracking-wide uppercase">
                      {displayZoneTitle}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5">
                      {zoneUnits.map((unit) => {
                        const isSelected = unit.id === selectedUnitId;
                        const style =
                          TILE_STYLES[unit.status] ?? TILE_STYLES[StorageUnitStatusEnum.INACTIVE];

                        return (
                          <button
                            key={unit.id}
                            type="button"
                            onClick={() => onSelectUnit(unit)}
                            className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[82px] cursor-pointer ${
                              style.tile
                            } ${
                              isSelected ? "ring-2 ring-emerald-600 ring-offset-2 shadow-md" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 w-full">
                              <span className="font-extrabold text-sm truncate">
                                {unit.unitNumber}
                              </span>
                              <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${style.dot}`} />
                            </div>

                            <div className="mt-2 text-[11px] leading-tight space-y-0.5">
                              <p className="font-medium truncate opacity-80">
                                {unit.unitType?.name ?? "—"}
                              </p>
                              <div className="flex items-center justify-between text-[10px] opacity-70">
                                <span>{t.has(unit.status) ? t(unit.status) : unit.status}</span>
                                {unit.status === StorageUnitStatusEnum.UNDER_MAINTENANCE && (
                                  <Wrench className="w-3 h-3 text-orange-600" />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
