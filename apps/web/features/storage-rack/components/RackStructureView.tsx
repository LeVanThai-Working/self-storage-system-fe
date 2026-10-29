"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Box, Layers, Loader2, Lock, Plus, Sparkles, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  RackStatusEnum,
  RackZoneEnum,
  formatShortMillion,
  getRackPrice,
  groupRacksByAisle,
  type StorageRackResponse,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useUnitRacks } from "@/features/inventory-operations/hooks";
import { useProvisionRacks } from "../hooks";
import { CreateRackDialog } from "./CreateRackDialog";
import { RackDetailSheet } from "./RackDetailSheet";

const ZONE_STYLE: Record<RackZoneEnum, { border: string; text: string }> = {
  [RackZoneEnum.PRIME]: { border: "border-amber-500", text: "text-amber-700" },
  [RackZoneEnum.STANDARD]: { border: "border-teal-600", text: "text-teal-700" },
  [RackZoneEnum.ECONOMY]: { border: "border-slate-400", text: "text-slate-500" },
};

const isRented = (rack: StorageRackResponse) =>
  rack.status === RackStatusEnum.RENTED || Boolean(rack.currentContractId);

function tileClass(rack: StorageRackResponse) {
  if (rack.status === RackStatusEnum.MAINTENANCE) {
    return "border-orange-400 bg-[repeating-linear-gradient(135deg,#fff0e7_0_6px,#ffb57e_7px_9px)] text-orange-700";
  }
  if (rack.status === RackStatusEnum.INACTIVE)
    return "border-slate-300 bg-slate-100 text-slate-400";
  if (isRented(rack)) return "border-teal-600 bg-teal-600 text-white";
  if (rack.status === RackStatusEnum.RESERVED)
    return "border-dashed border-teal-600 bg-teal-50 text-teal-700";
  return cn(
    "bg-white text-slate-700",
    rack.zone ? ZONE_STYLE[rack.zone].border : "border-slate-400"
  );
}

/** R1 — rack structure of a unit: KPIs, cinema-style grid, provision / create (FM) and rack sheet. */
export function RackStructureView({
  unitId,
  unitNumber,
  canManage,
}: {
  unitId: string;
  unitNumber: string;
  canManage: boolean;
}) {
  const t = useTranslations("rackStructure");
  const getErrorMessage = useApiErrorMessage();
  const racksQuery = useUnitRacks(unitId);
  const provisionMutation = useProvisionRacks(unitId);
  const [createOpen, setCreateOpen] = useState(false);
  const [openRackId, setOpenRackId] = useState<string | null>(null);

  const racks = useMemo(() => racksQuery.data ?? [], [racksQuery.data]);
  const aisles = useMemo(() => groupRacksByAisle(racks), [racks]);
  const openRack = racks.find((rack) => rack.id === openRackId) ?? null;

  const kpis = [
    { key: "total", value: racks.length, icon: Layers, tone: "bg-teal-50 text-teal-700" },
    {
      key: "rented",
      value: racks.filter(isRented).length,
      icon: Lock,
      tone: "bg-teal-50 text-teal-700",
    },
    {
      key: "free",
      value: racks.filter(
        (rack) =>
          !isRented(rack) &&
          (rack.status === RackStatusEnum.AVAILABLE || rack.status === RackStatusEnum.ACTIVE)
      ).length,
      icon: Box,
      tone: "bg-slate-100 text-slate-600",
    },
    {
      key: "maintenance",
      value: racks.filter((rack) => rack.status === RackStatusEnum.MAINTENANCE).length,
      icon: Wrench,
      tone: "bg-orange-50 text-orange-700",
    },
  ] as const;

  const handleProvision = async () => {
    try {
      const created = await provisionMutation.mutateAsync();
      toast.success(t("provisioned", { count: created.length }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-5">
      {canManage ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => void handleProvision()}
            disabled={provisionMutation.isPending}
            className="border-teal-200 text-teal-700"
          >
            {provisionMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {t("provision")}
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            {t("create.open")}
          </Button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map(({ key, value, icon: Icon, tone }) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-500">{t(`kpi.${key}`)}</p>
              <p className="text-2xl font-extrabold text-slate-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm font-bold text-slate-800">
          {t("mapTitle", { unit: unitNumber })}
        </p>
        <div className="mb-4 rounded-b-[48px] bg-gradient-to-b from-slate-100 to-slate-200 py-2 text-center text-[10px] font-bold tracking-wider text-slate-500">
          {t("entrance")}
        </div>
        {racksQuery.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : racksQuery.isError ? (
          // A failed load (e.g. 403 for another facility) must not read as "no racks yet".
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-6 text-center text-sm text-rose-700">
            {getErrorMessage(racksQuery.error)}
          </p>
        ) : racks.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            {canManage ? t("emptyManager") : t("empty")}
          </p>
        ) : (
          <div className="space-y-4">
            {aisles.map((aisle) => {
              const zoneStyle = aisle.zone ? ZONE_STYLE[aisle.zone] : null;
              const price = aisle.racks[0]
                ? getRackPrice({ ...aisle.racks[0], customPrice: null }, null)
                : 0;
              return (
                <div key={aisle.aisle} className="flex gap-4">
                  <div className={cn("w-32 shrink-0", zoneStyle?.text ?? "text-slate-500")}>
                    <p className="text-lg font-extrabold">{aisle.aisle}</p>
                    {aisle.zone ? <p className="text-xs font-bold">{aisle.zone}</p> : null}
                    <p className="text-[10px] text-slate-500">
                      {t("perMonth", { price: formatShortMillion(price) })}
                    </p>
                  </div>
                  <div className="flex flex-1 flex-wrap gap-2">
                    {aisle.racks.map((rack) => (
                      <button
                        key={rack.id}
                        type="button"
                        onClick={() => setOpenRackId(rack.id)}
                        className={cn(
                          "flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 text-xs font-bold transition hover:ring-2 hover:ring-teal-200",
                          tileClass(rack),
                          openRackId === rack.id && "ring-2 ring-teal-500 ring-offset-2"
                        )}
                      >
                        {rack.status === RackStatusEnum.MAINTENANCE ? (
                          <Wrench className="h-3.5 w-3.5" />
                        ) : null}
                        <span>{rack.rackCode}</span>
                        <span className="text-[10px] font-medium opacity-80">
                          {rack.customPrice
                            ? formatShortMillion(rack.customPrice)
                            : t("tiers", { count: rack.tierCount })}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
          {(["rented", "reserved", "free", "maintenance", "inactive"] as const).map((key) => (
            <span key={key} className="flex items-center gap-1.5">
              <i
                className={cn(
                  "h-3 w-3 rounded",
                  key === "rented" && "bg-teal-600",
                  key === "reserved" && "border border-dashed border-teal-600 bg-teal-50",
                  key === "free" && "border border-slate-400 bg-white",
                  key === "maintenance" && "bg-orange-300",
                  key === "inactive" && "bg-slate-200"
                )}
              />
              {t(`legend.${key}`)}
            </span>
          ))}
        </div>
      </div>

      {createOpen ? (
        <CreateRackDialog
          unitId={unitId}
          unitNumber={unitNumber}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}
      {openRack ? (
        <RackDetailSheet
          key={openRack.id}
          rack={openRack}
          readOnly={!canManage}
          onClose={() => setOpenRackId(null)}
        />
      ) : null}
    </div>
  );
}
