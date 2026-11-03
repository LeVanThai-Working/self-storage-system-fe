"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Box, Layers, Loader2, Lock, Plus, RotateCcw, Wrench } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [confirmProvisionOpen, setConfirmProvisionOpen] = useState(false);

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
      setConfirmProvisionOpen(false);
      await racksQuery.refetch();
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
            type="button"
            onClick={() => setConfirmProvisionOpen(true)}
            disabled={provisionMutation.isPending}
            className="border-teal-200 text-teal-700 hover:bg-teal-50 cursor-pointer"
          >
            {provisionMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 text-teal-600" />
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
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center mx-auto shadow-xs">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">{t("empty")}</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {canManage ? t("emptyManager") : t("empty")}
              </p>
            </div>
            {canManage && (
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  onClick={() => setConfirmProvisionOpen(true)}
                  disabled={provisionMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  {t("provision")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(true)}
                  className="text-xs cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  {t("create.open")}
                </Button>
              </div>
            )}
          </div>
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

      {confirmProvisionOpen && (
        <Dialog open={confirmProvisionOpen} onOpenChange={setConfirmProvisionOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    {t("provisionConfirmTitle")}
                  </DialogTitle>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {t("mapTitle", { unit: unitNumber })}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 space-y-1.5">
                <p className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                  {t("provisionConfirmHeading")}
                </p>
                <p className="text-[11px] leading-relaxed">{t("provisionConfirmWarning")}</p>
              </div>

              <div className="space-y-1 text-slate-500 text-[11px]">
                <p>• {t("provisionConfirmNotice1")}</p>
                <p>• {t("provisionConfirmNotice2")}</p>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmProvisionOpen(false)}
                disabled={provisionMutation.isPending}
                className="text-xs cursor-pointer"
              >
                {t("provisionCancel")}
              </Button>
              <Button
                type="button"
                onClick={() => void handleProvision()}
                disabled={provisionMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer"
              >
                {provisionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                )}
                {t("provisionConfirmAction")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
