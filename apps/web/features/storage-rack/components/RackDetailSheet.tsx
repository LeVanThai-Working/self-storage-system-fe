"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_RACK_ZONE_PRICING,
  RackStatusEnum,
  RackTierStatusEnum,
  RackZoneEnum,
  formatCurrency,
  type RackTierResponse,
  type StorageRackResponse,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useUpdateRack, useUpdateRackTier } from "../hooks";

const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700";
const INPUT =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400 disabled:bg-slate-50";
const EDITABLE_RACK_STATUSES = [
  RackStatusEnum.AVAILABLE,
  RackStatusEnum.RESERVED,
  RackStatusEnum.RENTED,
  RackStatusEnum.MAINTENANCE,
  RackStatusEnum.INACTIVE,
];

/** R2 — rack details (zone, custom price, status, notes) and an inline-editable tier table. */
export function RackDetailSheet({
  rack,
  readOnly,
  onClose,
}: {
  rack: StorageRackResponse;
  readOnly: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("rackStructure.detail");
  const tStatus = useTranslations("rackStructure.status");
  const getErrorMessage = useApiErrorMessage();
  const updateRack = useUpdateRack(rack.id);

  const [name, setName] = useState(rack.name ?? "");
  const [aisle, setAisle] = useState(rack.aisle ?? "");
  const [bay, setBay] = useState(rack.bay ? String(rack.bay) : "");
  const [zone, setZone] = useState<RackZoneEnum | "">(rack.zone ?? "");
  const [customPrice, setCustomPrice] = useState(
    rack.customPrice || rack.customPrice === 0 ? String(rack.customPrice) : ""
  );
  const [status, setStatus] = useState<RackStatusEnum>(
    rack.status === RackStatusEnum.ACTIVE
      ? RackStatusEnum.AVAILABLE
      : (rack.status as RackStatusEnum)
  );
  const [notes, setNotes] = useState(rack.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const zonePrice = zone ? DEFAULT_RACK_ZONE_PRICING[zone] : null;

  const handleSave = async () => {
    setError(null);
    try {
      await updateRack.mutateAsync({
        name: name.trim() || undefined,
        aisle: aisle.trim() || undefined,
        bay: bay ? Number(bay) : undefined,
        zone: zone || undefined,
        customPrice: customPrice.trim() === "" ? null : Number(customPrice),
        status,
        notes: notes.trim() || undefined,
      });
      toast.success(t("saved", { code: rack.rackCode }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Sheet open onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:!max-w-xl">
        <SheetHeader className="border-b border-slate-100 px-6 py-5">
          <SheetTitle className="text-xl font-extrabold">
            {t("title", { code: rack.rackCode })}
          </SheetTitle>
          <p className="text-xs text-slate-500">
            {[
              rack.aisle && t("aisle", { aisle: rack.aisle }),
              rack.bay && t("bay", { bay: rack.bay }),
              rack.zone,
            ]
              .filter(Boolean)
              .join(" · ")}{" "}
            · {tStatus(rack.status)}
          </p>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <section className="space-y-3 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-800">{t("infoTitle")}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>{t("name")}</label>
                <input
                  value={name}
                  disabled={readOnly}
                  onChange={(event) => setName(event.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>{t("aisleLabel")}</label>
                <input
                  value={aisle}
                  disabled={readOnly}
                  onChange={(event) => setAisle(event.target.value.toUpperCase())}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>{t("bayLabel")}</label>
                <input
                  type="number"
                  min={1}
                  value={bay}
                  disabled={readOnly}
                  onChange={(event) => setBay(event.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>{t("zone")}</label>
                <select
                  value={zone}
                  disabled={readOnly}
                  onChange={(event) => setZone(event.target.value as RackZoneEnum | "")}
                  className={INPUT}
                >
                  <option value="">—</option>
                  {Object.values(RackZoneEnum).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>{t("customPrice")}</label>
                <input
                  type="number"
                  min={0}
                  value={customPrice}
                  disabled={readOnly}
                  onChange={(event) => setCustomPrice(event.target.value)}
                  placeholder={t("customPriceHint")}
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>{t("status")}</label>
                <select
                  value={status}
                  disabled={readOnly}
                  onChange={(event) => setStatus(event.target.value as RackStatusEnum)}
                  className={INPUT}
                >
                  {EDITABLE_RACK_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {tStatus(value)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {zonePrice && customPrice.trim() === "" ? (
              <p className="text-xs text-slate-500">
                {t("zonePriceNote", { price: formatCurrency(zonePrice) })}
              </p>
            ) : null}
            <div>
              <label className={LABEL}>{t("notes")}</label>
              <input
                value={notes}
                disabled={readOnly}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={1000}
                className={INPUT}
              />
            </div>
          </section>

          <section className="space-y-2 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-800">
              {t("tiersTitle", { count: rack.tiers?.length ?? 0 })}
            </p>
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-left font-bold text-slate-500">
                <tr>
                  <th className="px-2 py-2">{t("col.tier")}</th>
                  <th className="px-2 py-2">{t("col.code")}</th>
                  <th className="px-2 py-2">{t("col.maxWeight")}</th>
                  <th className="px-2 py-2">{t("col.dimensions")}</th>
                  <th className="px-2 py-2">{t("col.volume")}</th>
                  <th className="px-2 py-2">{t("col.status")}</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {[...(rack.tiers ?? [])]
                  .sort((a, b) => b.tierNumber - a.tierNumber)
                  .map((tier) => (
                    <TierRow key={tier.id} tier={tier} readOnly={readOnly} />
                  ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-500">{t("tiersHint")}</p>
          </section>

          {error ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            {t("close")}
          </Button>
          {!readOnly ? (
            <Button
              onClick={() => void handleSave()}
              disabled={updateRack.isPending}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {updateRack.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {t("save")}
            </Button>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TierRow({ tier, readOnly }: { tier: RackTierResponse; readOnly: boolean }) {
  const t = useTranslations("rackStructure.detail");
  const tTier = useTranslations("rackStructure.tierStatus");
  const getErrorMessage = useApiErrorMessage();
  const updateTier = useUpdateRackTier();
  const [editing, setEditing] = useState(false);
  const [maxWeight, setMaxWeight] = useState(tier.maxWeightKg ? String(tier.maxWeightKg) : "");
  const [dims, setDims] = useState({
    length: String(tier.dimensions?.length ?? ""),
    width: String(tier.dimensions?.width ?? ""),
    height: String(tier.dimensions?.height ?? ""),
  });
  const [status, setStatus] = useState<RackTierStatusEnum>(tier.status as RackTierStatusEnum);

  const save = async () => {
    const values = [dims.length, dims.width, dims.height].map(Number);
    const dimensionsValid = values.every((value) => value > 0);
    try {
      await updateTier.mutateAsync({
        id: tier.id,
        maxWeightKg: maxWeight ? Number(maxWeight) : undefined,
        dimensions: dimensionsValid
          ? { length: values[0], width: values[1], height: values[2] }
          : undefined,
        status,
      });
      toast.success(t("tierSaved", { tier: tier.tierCode }));
      setEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const small = "w-full rounded border border-teal-400 px-1.5 py-1 text-xs";
  const dimText = tier.dimensions
    ? `${tier.dimensions.length}×${tier.dimensions.width}×${tier.dimensions.height}`
    : "—";

  return (
    <tr className={`border-t border-slate-100 ${editing ? "bg-teal-50/60" : ""}`}>
      <td className="px-2 py-2 font-bold">T{String(tier.tierNumber).padStart(2, "0")}</td>
      <td className="px-2 py-2 font-mono">{tier.tierCode}</td>
      <td className="px-2 py-2">
        {editing ? (
          <input
            type="number"
            min={1}
            value={maxWeight}
            onChange={(event) => setMaxWeight(event.target.value)}
            className={small}
          />
        ) : (
          (tier.maxWeightKg ?? "—")
        )}
      </td>
      <td className="px-2 py-2">
        {editing ? (
          <div className="flex gap-1">
            {(["length", "width", "height"] as const).map((key) => (
              <input
                key={key}
                type="number"
                min={1}
                value={dims[key]}
                onChange={(event) => setDims((prev) => ({ ...prev, [key]: event.target.value }))}
                className={small}
              />
            ))}
          </div>
        ) : (
          dimText
        )}
      </td>
      <td className="px-2 py-2">{tier.volume ? `${Math.round(tier.volume / 1000)} dm³` : "—"}</td>
      <td className="px-2 py-2">
        {editing ? (
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as RackTierStatusEnum)}
            className={small}
          >
            {Object.values(RackTierStatusEnum).map((value) => (
              <option key={value} value={value}>
                {tTier(value)}
              </option>
            ))}
          </select>
        ) : (
          tTier(tier.status)
        )}
      </td>
      <td className="px-2 py-2 text-right">
        {readOnly ? null : editing ? (
          <span className="inline-flex gap-1">
            <button
              type="button"
              onClick={() => void save()}
              disabled={updateTier.isPending}
              className="text-teal-600"
              aria-label={t("save")}
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-slate-400"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-slate-400 hover:text-teal-600"
            aria-label={t("edit")}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </td>
    </tr>
  );
}
