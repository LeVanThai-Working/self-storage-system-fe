"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  MESSAGE_CODE,
  RackZoneEnum,
  createStorageRackSchema,
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
import { AppApiError } from "@/lib/api/axios";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useCreateRack } from "../hooks";

const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700";
const INPUT =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400";

const toNumber = (value: string) => (value.trim() === "" ? undefined : Number(value));

/** R1 dialog — FM creates one rack (with its tiers) in a rack warehouse unit. */
export function CreateRackDialog({
  unitId,
  unitNumber,
  onClose,
}: {
  unitId: string;
  unitNumber: string;
  onClose: () => void;
}) {
  const t = useTranslations("rackStructure.create");
  const getErrorMessage = useApiErrorMessage();
  const createMutation = useCreateRack();

  const [form, setForm] = useState({
    rackCode: "",
    name: "",
    aisle: "",
    bay: "",
    zone: "" as RackZoneEnum | "",
    customPrice: "",
    tierCount: "4",
    maxWeight: "",
    length: "",
    width: "",
    height: "",
    notes: "",
  });
  const [codeError, setCodeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    setCodeError(null);
    const dims = [form.length, form.width, form.height].map(toNumber);
    const payload = {
      storageUnitId: unitId,
      rackCode: form.rackCode.trim().toUpperCase(),
      name: form.name.trim() || undefined,
      aisle: form.aisle.trim() || undefined,
      bay: toNumber(form.bay),
      zone: form.zone || undefined,
      customPrice: toNumber(form.customPrice) ?? null,
      tierCount: toNumber(form.tierCount) ?? 1,
      defaultTierMaxWeightKg: toNumber(form.maxWeight),
      defaultTierDimensions: dims.every((value) => value !== undefined)
        ? { length: dims[0]!, width: dims[1]!, height: dims[2]! }
        : undefined,
      notes: form.notes.trim() || undefined,
    };
    const parsed = createStorageRackSchema.safeParse(payload);
    if (!parsed.success) {
      setError(t("invalid"));
      return;
    }
    try {
      const rack = await createMutation.mutateAsync(parsed.data);
      toast.success(t("created", { code: rack.rackCode }));
      onClose();
    } catch (err) {
      if (err instanceof AppApiError && err.messageCode === MESSAGE_CODE.MESSAGE_CODE_603) {
        setCodeError(t("codeTaken"));
        return;
      }
      setError(getErrorMessage(err));
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div>
      <label className={LABEL}>{label}</label>
      <input
        value={form[key]}
        onChange={(event) => set(key)(event.target.value)}
        className={INPUT}
        {...props}
      />
    </div>
  );

  return (
    <Dialog open onOpenChange={(next) => !next && !createMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle", { unit: unitNumber })}</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[65vh] grid-cols-2 gap-3 overflow-y-auto pr-1">
          <div>
            <label className={LABEL}>{t("rackCode")} *</label>
            <input
              value={form.rackCode}
              onChange={(event) => set("rackCode")(event.target.value.toUpperCase())}
              maxLength={20}
              className={`${INPUT} ${codeError ? "border-rose-400" : ""}`}
            />
            {codeError ? <p className="mt-1 text-xs text-rose-600">{codeError}</p> : null}
          </div>
          {field("name", t("name"), { maxLength: 100 })}
          {field("aisle", t("aisle"), { maxLength: 3 })}
          {field("bay", t("bay"), { type: "number", min: 1 })}
          <div>
            <label className={LABEL}>{t("zone")}</label>
            <select
              value={form.zone}
              onChange={(event) => set("zone")(event.target.value)}
              className={INPUT}
            >
              <option value="">{t("zoneNone")}</option>
              {Object.values(RackZoneEnum).map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>
          {field("customPrice", t("customPrice"), {
            type: "number",
            min: 0,
            placeholder: t("customPriceHint"),
          })}
          {field("tierCount", `${t("tierCount")} *`, { type: "number", min: 1 })}
          {field("maxWeight", t("maxWeight"), { type: "number", min: 1 })}
          <div className="col-span-2">
            <label className={LABEL}>{t("dimensions")}</label>
            <div className="grid grid-cols-3 gap-2">
              {(["length", "width", "height"] as const).map((key) => (
                <input
                  key={key}
                  type="number"
                  min={1}
                  value={form[key]}
                  onChange={(event) => set(key)(event.target.value)}
                  placeholder={t(key)}
                  className={INPUT}
                />
              ))}
            </div>
          </div>
          <div className="col-span-2">{field("notes", t("notes"), { maxLength: 1000 })}</div>
        </div>
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={createMutation.isPending}>
            {t("cancel")}
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={!form.rackCode.trim() || createMutation.isPending}
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
