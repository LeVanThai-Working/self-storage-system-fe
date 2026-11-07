"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Check, DoorOpen, Layers, Lock, Wrench } from "lucide-react";
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

function UnitTile({
  unit,
  selected,
  onSelect,
}: {
  unit: StorageUnitResponse;
  selected: boolean;
  onSelect: (unit: StorageUnitResponse) => void;
}) {
  const t = useTranslations("customerReservation.form.seatMap");
  const bookable = isUnitBookable(unit);
  const maintenance = unit.status === StorageUnitStatusEnum.UNDER_MAINTENANCE;
  const StatusIcon = maintenance ? Wrench : Lock;

  return (
    <button
      type="button"
      disabled={!bookable}
      onClick={() => onSelect(unit)}
      aria-pressed={selected}
      title={bookable ? unit.unitNumber : t("unavailable")}
      className={cn(
        "group relative flex h-20 flex-col justify-between rounded-xl border p-2.5 text-left transition-all duration-200",
        "focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:outline-none",
        selected
          ? "border-teal-600 bg-teal-600 text-white shadow-lg ring-4 shadow-teal-600/25 ring-teal-500/20"
          : bookable
            ? "border-teal-200 bg-white text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-md"
            : maintenance
              ? "cursor-not-allowed border-orange-200 bg-orange-50 text-orange-700"
              : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
      )}
    >
      <span className="flex items-start justify-between gap-1">
        <span className="text-sm leading-tight font-bold break-all">{unit.unitNumber}</span>
        {selected ? (
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-teal-600 animate-in zoom-in-50">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        ) : !bookable ? (
          <StatusIcon className="size-3.5 shrink-0" aria-hidden />
        ) : null}
      </span>
      {unit.unitType?.area ? (
        <span
          className={cn(
            "text-xs font-medium",
            selected ? "text-white/85" : bookable ? "text-slate-500" : "text-current/70"
          )}
        >
          {unit.unitType.area} m²
        </span>
      ) : null}
    </button>
  );
}

/** Floor-plan picker of one unit type's rooms: floors → zones → rooms. */
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
    <div className="space-y-3">
      <div
        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70"
        style={{
          backgroundImage: "radial-gradient(#e2e8f0 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        <div className="flex items-center gap-3 border-b border-dashed border-slate-300 bg-white/80 px-4 py-2.5 backdrop-blur-sm">
          <span className="flex size-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <DoorOpen className="size-4" aria-hidden />
          </span>
          <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            {t("entrance")}
          </span>
          <span className="ml-auto rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
            {t("freeCount", { free: freeCount, total: units.length })}
          </span>
        </div>

        <div className="space-y-5 p-4">
          {floors.map((floor) => (
            <section key={floor.floor} className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Layers className="size-4 text-teal-600" aria-hidden />
                {t("floor", { floor: floor.floor })}
                <span className="h-px flex-1 bg-slate-200" />
              </h4>
              {floor.zones.map((zone) => (
                <div
                  key={zone.zone ?? "none"}
                  className="space-y-2.5 rounded-xl border border-slate-200/80 bg-white/90 p-3"
                >
                  {zone.zone ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700">
                      <span className="size-1.5 rounded-full bg-teal-500" />
                      {zone.zone}
                    </span>
                  ) : null}
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2.5">
                    {zone.units.map((unit) => (
                      <UnitTile
                        key={unit.id}
                        unit={unit}
                        selected={unit.id === selectedUnitId}
                        onSelect={onSelect}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>
      <UnitLegend />
    </div>
  );
}

function UnitLegend() {
  const t = useTranslations("customerReservation.form.seatMap.legend");
  const items = [
    { key: "free", box: "border border-teal-300 bg-white" },
    { key: "picked", box: "bg-teal-600" },
    { key: "taken", box: "border border-slate-200 bg-slate-100" },
    { key: "maintenance", box: "border border-orange-200 bg-orange-50" },
  ] as const;
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 px-1 text-xs text-slate-500">
      {items.map((item) => (
        <span key={item.key} className="flex items-center gap-1.5">
          <i className={cn("size-3.5 rounded", item.box)} />
          {t(item.key)}
        </span>
      ))}
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
