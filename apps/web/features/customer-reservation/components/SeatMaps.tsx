"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Wrench } from "lucide-react";
import {
  RackStatusEnum,
  RackZoneEnum,
  StorageUnitStatusEnum,
  formatShortMillion,
  getRackPrice,
  groupRacksByAisle,
  groupUnitsByFloorAndZone,
  isRackBookable,
  isUnitBookable,
  type StorageRackResponse,
  type StorageUnitResponse,
  type ZonePricing,
} from "@self-storage-system-fe/shared";
import { cn } from "@/lib/utils";

const ZONE_STYLE: Record<RackZoneEnum, { border: string; text: string; label: string }> = {
  [RackZoneEnum.PRIME]: { border: "border-amber-500", text: "text-amber-700", label: "★ PRIME" },
  [RackZoneEnum.STANDARD]: { border: "border-teal-600", text: "text-teal-700", label: "STANDARD" },
  [RackZoneEnum.ECONOMY]: { border: "border-slate-400", text: "text-slate-500", label: "ECONOMY" },
};

function Entrance() {
  const t = useTranslations("customerReservation.form.seatMap");
  return (
    <div className="rounded-b-[48px] bg-gradient-to-b from-slate-100 to-slate-200 py-2 text-center text-[10px] font-bold tracking-wider text-slate-500">
      {t("entrance")}
    </div>
  );
}

function Legend() {
  const t = useTranslations("customerReservation.form.seatMap.legend");
  const items = [
    { key: "free", box: "border border-teal-600 bg-white" },
    { key: "picked", box: "bg-teal-600" },
    { key: "taken", box: "bg-slate-200" },
    { key: "maintenance", box: "border border-orange-300 bg-orange-100" },
  ] as const;
  return (
    <div className="flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
      {items.map((item) => (
        <span key={item.key} className="flex items-center gap-1.5">
          <i className={cn("h-3 w-3 rounded", item.box)} />
          {t(item.key)}
        </span>
      ))}
    </div>
  );
}

/** Cinema-style picker of one unit type's rooms: floors → zones → seats. */
export function UnitSeatMapWeb({
  units,
  selectedUnitId,
  onSelect,
}: {
  units: StorageUnitResponse[];
  selectedUnitId?: string;
  onSelect: (unit: StorageUnitResponse) => void;
}) {
  const t = useTranslations("customerReservation.form.seatMap");
  const floors = useMemo(() => groupUnitsByFloorAndZone(units), [units]);
  const freeCount = units.filter(isUnitBookable).length;

  return (
    <div className="space-y-4">
      <Entrance />
      <p className="text-xs text-slate-500">
        {t("freeCount", { free: freeCount, total: units.length })}
      </p>
      {floors.map((floor) => (
        <div key={floor.floor} className="space-y-2">
          <p className="text-sm font-bold text-slate-800">{t("floor", { floor: floor.floor })}</p>
          {floor.zones.map((zone) => (
            <div key={zone.zone ?? "none"} className="flex gap-3">
              <span className="w-8 pt-3 text-center text-sm font-extrabold text-teal-700">
                {zone.zone ?? "–"}
              </span>
              <div className="flex flex-1 flex-wrap gap-2">
                {zone.units.map((unit) => {
                  const bookable = isUnitBookable(unit);
                  const selected = unit.id === selectedUnitId;
                  const maintenance = unit.status === StorageUnitStatusEnum.UNDER_MAINTENANCE;
                  return (
                    <button
                      key={unit.id}
                      type="button"
                      disabled={!bookable}
                      onClick={() => onSelect(unit)}
                      aria-pressed={selected}
                      title={bookable ? unit.unitNumber : t("unavailable")}
                      className={cn(
                        "flex h-14 w-16 flex-col items-center justify-center rounded-lg border text-xs font-bold transition",
                        selected
                          ? "border-teal-600 bg-teal-600 text-white"
                          : bookable
                            ? "border-teal-500/60 bg-white text-slate-800 hover:border-teal-600 hover:bg-teal-50"
                            : maintenance
                              ? "cursor-not-allowed border-orange-300 bg-orange-100 text-orange-700"
                              : "cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400"
                      )}
                    >
                      {maintenance ? <Wrench className="h-3 w-3" /> : null}
                      <span>{unit.unitNumber}</span>
                      {unit.unitType?.area ? (
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            selected ? "text-white/90" : "text-slate-500"
                          )}
                        >
                          {unit.unitType.area} m²
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
      <Legend />
    </div>
  );
}

/** Cinema-style rack picker inside a shared rack warehouse: aisles are rows, bays are seats. */
export function RackSeatMapWeb({
  racks,
  pricing,
  fallbackPrice,
  selectedRackIds,
  onToggle,
}: {
  racks: StorageRackResponse[];
  pricing: ZonePricing;
  /** Offering `pricePerUnit`, BE last-resort rack price. */
  fallbackPrice?: number | null;
  selectedRackIds: string[];
  onToggle: (rack: StorageRackResponse) => void;
}) {
  const t = useTranslations("customerReservation.form.seatMap");
  const aisles = useMemo(() => groupRacksByAisle(racks), [racks]);
  const selected = new Set(selectedRackIds);

  return (
    <div className="space-y-4">
      <Entrance />
      {aisles.map((aisle) => {
        const zoneStyle = aisle.zone ? ZONE_STYLE[aisle.zone] : null;
        const zonePrice = aisle.racks[0]
          ? getRackPrice({ ...aisle.racks[0], customPrice: null }, pricing, fallbackPrice)
          : 0;
        return (
          <div key={aisle.aisle} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className={cn("text-lg font-extrabold", zoneStyle?.text ?? "text-slate-500")}>
                {aisle.aisle}
              </span>
              {zoneStyle ? (
                <span className={cn("text-xs font-bold", zoneStyle.text)}>
                  {zoneStyle.label} · {t("perMonth", { price: formatShortMillion(zonePrice) })}
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {aisle.racks.map((rack) => {
                const bookable = isRackBookable(rack);
                const picked = selected.has(rack.id);
                const maintenance = rack.status === RackStatusEnum.MAINTENANCE;
                return (
                  <button
                    key={rack.id}
                    type="button"
                    disabled={!bookable}
                    onClick={() => onToggle(rack)}
                    aria-pressed={picked}
                    className={cn(
                      "flex h-16 w-14 flex-col items-center justify-center gap-0.5 rounded-md border-2 text-[11px] font-bold transition",
                      picked
                        ? "border-teal-600 bg-teal-600 text-white"
                        : bookable
                          ? cn(
                              "bg-white text-slate-800 hover:bg-teal-50",
                              rack.zone ? ZONE_STYLE[rack.zone].border : "border-slate-400"
                            )
                          : maintenance
                            ? "cursor-not-allowed border-orange-300 bg-orange-100 text-orange-700"
                            : "cursor-not-allowed border-slate-200 bg-slate-200 text-slate-400"
                    )}
                  >
                    {maintenance ? <Wrench className="h-3 w-3" /> : null}
                    <span>{rack.rackCode}</span>
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        picked ? "text-white/90" : "text-slate-500"
                      )}
                    >
                      {bookable || picked
                        ? formatShortMillion(getRackPrice(rack, pricing, fallbackPrice))
                        : maintenance
                          ? ""
                          : t("taken")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <Legend />
    </div>
  );
}
