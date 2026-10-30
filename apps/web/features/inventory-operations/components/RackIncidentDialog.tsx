"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  RackStatusEnum,
  batchMigrateRackRequestSchema,
  evacuateRackToHoldingRequestSchema,
  type StorageRackResponse,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useBatchMigrateRack, useEvacuateRack } from "../hooks";

type Mode = "migrate" | "evacuate";
type Basis = "incident" | "addendum" | "emergency";

const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700";
const INPUT =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400";
const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

interface RackIncidentDialogProps {
  open: boolean;
  onClose: () => void;
  fromRack: StorageRackResponse;
  racks: StorageRackResponse[];
  /** Pre-filled when opened from an incident (W2). */
  incidentId?: string;
}

const isFreeRack = (rack: StorageRackResponse) =>
  (rack.status === RackStatusEnum.AVAILABLE || rack.status === RackStatusEnum.ACTIVE) &&
  !rack.currentContractId;

/** S5 — move a whole rack to an empty one, or drop its items into the holding area. */
export function RackIncidentDialog({
  open,
  onClose,
  fromRack,
  racks,
  incidentId: presetIncidentId,
}: RackIncidentDialogProps) {
  const t = useTranslations("inventoryOps.rackIncident");
  const getErrorMessage = useApiErrorMessage();
  const migrateMutation = useBatchMigrateRack();
  const evacuateMutation = useEvacuateRack();

  const [mode, setMode] = useState<Mode>("migrate");
  const [toRackId, setToRackId] = useState("");
  const [basis, setBasis] = useState<Basis>(presetIncidentId ? "incident" : "emergency");
  const [incidentId, setIncidentId] = useState(presetIncidentId ?? "");
  const [addendumId, setAddendumId] = useState("");
  const [emergencyReason, setEmergencyReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const candidates = useMemo(
    () => racks.filter((rack) => rack.id !== fromRack.id && rack.tierCount === fromRack.tierCount),
    [racks, fromRack]
  );
  const pending = migrateMutation.isPending || evacuateMutation.isPending;

  const handleSubmit = async () => {
    setError(null);
    const basisFields = {
      incidentId:
        basis === "incident" && OBJECT_ID.test(incidentId.trim()) ? incidentId.trim() : undefined,
      addendumId:
        basis === "addendum" && OBJECT_ID.test(addendumId.trim()) ? addendumId.trim() : undefined,
      emergencyReason: basis === "emergency" ? emergencyReason.trim() || undefined : undefined,
    };
    try {
      if (mode === "migrate") {
        const payload = { fromRackId: fromRack.id, toRackId, ...basisFields };
        if (!toRackId) {
          setError(t("pickTarget"));
          return;
        }
        if (!batchMigrateRackRequestSchema.safeParse(payload).success) {
          setError(t("basisRequired"));
          return;
        }
        const result = await migrateMutation.mutateAsync(payload);
        toast.success(
          t("migrated", { count: result.totalQuantityMigrated, to: result.toRackCode })
        );
      } else {
        const payload = {
          fromRackId: fromRack.id,
          incidentId: basisFields.incidentId,
          emergencyReason: basisFields.emergencyReason,
        };
        if (!evacuateRackToHoldingRequestSchema.safeParse(payload).success) {
          setError(t("evacuateBasisRequired"));
          return;
        }
        const result = await evacuateMutation.mutateAsync(payload);
        toast.success(t("evacuated", { count: result.totalQuantityEvacuated }));
      }
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const basisOptions: Basis[] =
    mode === "migrate" ? ["incident", "addendum", "emergency"] : ["incident", "emergency"];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !pending && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title", { rack: fromRack.rackCode })}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(["migrate", "evacuate"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setMode(value);
                if (value === "evacuate" && basis === "addendum") setBasis("emergency");
              }}
              className={`flex-1 rounded-md px-3 py-1.5 text-xs font-bold ${
                mode === value ? "bg-white text-teal-700 shadow-sm" : "text-slate-500"
              }`}
            >
              {t(`mode.${value}`)}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {mode === "migrate" ? (
            <div>
              <label className={LABEL}>{t("target")} *</label>
              <select
                value={toRackId}
                onChange={(event) => setToRackId(event.target.value)}
                className={INPUT}
              >
                <option value="">{t("targetPlaceholder")}</option>
                {candidates.map((rack) => (
                  <option key={rack.id} value={rack.id} disabled={!isFreeRack(rack)}>
                    {rack.rackCode} · {rack.zone ?? "—"} · {t("tiers", { count: rack.tierCount })}
                    {isFreeRack(rack) ? "" : ` (${t("notFree")})`}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">{t("targetHint")}</p>
            </div>
          ) : (
            <div className="flex gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-800">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              {t("evacuateHint")}
            </div>
          )}

          <div>
            <label className={LABEL}>{t("basis")} *</label>
            <div className="space-y-2">
              {basisOptions.map((value) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                    basis === value ? "border-teal-500 bg-teal-50/50" : "border-slate-200"
                  }`}
                >
                  <input
                    type="radio"
                    checked={basis === value}
                    onChange={() => setBasis(value)}
                    className="mt-0.5 accent-teal-600"
                  />
                  <span className="flex-1 space-y-2">
                    <span className="block font-semibold text-slate-800">
                      {t(`basisOption.${value}`)}
                    </span>
                    {basis === value && value === "incident" ? (
                      <input
                        value={incidentId}
                        onChange={(event) => setIncidentId(event.target.value)}
                        placeholder={t("incidentIdPlaceholder")}
                        className={INPUT}
                      />
                    ) : null}
                    {basis === value && value === "addendum" ? (
                      <input
                        value={addendumId}
                        onChange={(event) => setAddendumId(event.target.value)}
                        placeholder={t("addendumIdPlaceholder")}
                        className={INPUT}
                      />
                    ) : null}
                    {basis === value && value === "emergency" ? (
                      <textarea
                        value={emergencyReason}
                        onChange={(event) => setEmergencyReason(event.target.value)}
                        rows={2}
                        maxLength={1000}
                        placeholder={t("emergencyPlaceholder")}
                        className={INPUT}
                      />
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-500">
            {mode === "migrate" ? t("migrateNote") : t("evacuateNote")}
          </p>
          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={pending}
            className="bg-orange-500 text-white hover:bg-orange-600"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === "migrate" ? t("submitMigrate") : t("submitEvacuate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
