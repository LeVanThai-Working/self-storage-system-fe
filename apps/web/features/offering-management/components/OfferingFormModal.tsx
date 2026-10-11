"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Tag, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFacilities } from "@/features/facility-management/hooks";
import { FacilityStatusEnum } from "@/features/facility-management/types";
import { useUnitTypes } from "@/features/unit-type-management/hooks";
import { UnitTypeStatusEnum } from "@/features/unit-type-management/types";
import { AppApiError } from "@/lib/api/axios";
import { useCreateOffering, useUpdateOffering } from "../hooks";
import {
  BillingUnitEnum,
  FacilityUnitTypeOfferingStatusEnum,
  type FacilityUnitTypeOfferingResponse,
} from "../types";

interface OfferingFormModalProps {
  /** null = create mode; an offering = edit mode (facility/unitType are fixed). */
  offering: FacilityUnitTypeOfferingResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OfferingFormModal = ({ offering, isOpen, onClose }: OfferingFormModalProps) => {
  const t = useTranslations("businessOps.offerings.formModal");
  const isEdit = Boolean(offering);
  const createMutation = useCreateOffering();
  const updateMutation = useUpdateOffering();

  const { data: facilitiesData } = useFacilities({
    limit: 100,
    status: FacilityStatusEnum.ACTIVE,
  });
  const { data: unitTypesData } = useUnitTypes({ limit: 100, status: UnitTypeStatusEnum.ACTIVE });

  const [facilityId, setFacilityId] = useState("");
  const [unitTypeId, setUnitTypeId] = useState("");
  const [billingUnit, setBillingUnit] = useState<BillingUnitEnum>(BillingUnitEnum.MONTH);
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [depositMultiplier, setDepositMultiplier] = useState("1");
  const [minRentalDays, setMinRentalDays] = useState("1");
  const [status, setStatus] = useState<FacilityUnitTypeOfferingStatusEnum>(
    FacilityUnitTypeOfferingStatusEnum.ACTIVE
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFacilityId(offering?.facility.id || "");
    setUnitTypeId(offering?.unitType.id || "");
    setBillingUnit(offering?.billingUnit || BillingUnitEnum.MONTH);
    setPricePerUnit(offering ? String(offering.pricePerUnit) : "");
    setDepositMultiplier(offering ? String(offering.depositMultiplier) : "1");
    setMinRentalDays(offering ? String(offering.minRentalDays) : "1");
    setStatus(offering?.status || FacilityUnitTypeOfferingStatusEnum.ACTIVE);
    setNotes(offering?.notes || "");
    setError(null);
    setSuccess(null);
  }, [isOpen, offering]);

  const handleClose = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEdit && (!facilityId || !unitTypeId)) {
      setError(t("validation.required"));
      return;
    }
    const price = Number(pricePerUnit);
    if (!pricePerUnit || Number.isNaN(price) || price < 0) {
      setError(t("validation.price"));
      return;
    }

    try {
      if (isEdit && offering) {
        await updateMutation.mutateAsync({
          id: offering.id,
          payload: {
            billingUnit,
            pricePerUnit: price,
            depositMultiplier: Number(depositMultiplier) || 0,
            minRentalDays: Number(minRentalDays) || 1,
            status,
            notes: notes.trim() || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          facilityId,
          unitTypeId,
          billingUnit,
          pricePerUnit: price,
          depositMultiplier: Number(depositMultiplier) || 0,
          minRentalDays: Number(minRentalDays) || 1,
          status,
          notes: notes.trim() || undefined,
        });
      }
      setSuccess(t("success"));
      setTimeout(handleClose, 1000);
    } catch (err) {
      setError(err instanceof AppApiError ? err.message : t("error"));
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-600" />
            {isEdit ? t("editTitle") : t("createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("facilityLabel")} *
              </label>
              <select
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                disabled={isEdit}
                className="w-full bg-slate-50 text-sm py-2.5 px-3 rounded-xl border border-slate-200 outline-none disabled:opacity-60"
              >
                <option value="">{t("facilityPlaceholder")}</option>
                {facilitiesData?.items.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("unitTypeLabel")} *
              </label>
              <select
                value={unitTypeId}
                onChange={(e) => setUnitTypeId(e.target.value)}
                disabled={isEdit}
                className="w-full bg-slate-50 text-sm py-2.5 px-3 rounded-xl border border-slate-200 outline-none disabled:opacity-60"
              >
                <option value="">{t("unitTypePlaceholder")}</option>
                {unitTypesData?.items.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("priceLabel")} *
              </label>
              <input
                type="number"
                min={0}
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                className="w-full bg-slate-50 text-sm py-2.5 px-3 rounded-xl border border-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("billingUnitLabel")}
              </label>
              <select
                value={billingUnit}
                onChange={(e) => setBillingUnit(e.target.value as BillingUnitEnum)}
                className="w-full bg-slate-50 text-sm py-2.5 px-3 rounded-xl border border-slate-200 outline-none"
              >
                <option value={BillingUnitEnum.DAY}>{t("billingUnit.day")}</option>
                <option value={BillingUnitEnum.MONTH}>{t("billingUnit.month")}</option>
                <option value={BillingUnitEnum.ONE_TIME}>{t("billingUnit.oneTime")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("depositLabel")}
              </label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={depositMultiplier}
                onChange={(e) => setDepositMultiplier(e.target.value)}
                className="w-full bg-slate-50 text-sm py-2.5 px-3 rounded-xl border border-slate-200 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("minRentalDaysLabel")}
              </label>
              <input
                type="number"
                min={1}
                value={minRentalDays}
                onChange={(e) => setMinRentalDays(e.target.value)}
                className="w-full bg-slate-50 text-sm py-2.5 px-3 rounded-xl border border-slate-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("statusLabel")}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FacilityUnitTypeOfferingStatusEnum)}
                className="w-full bg-slate-50 text-sm py-2.5 px-3 rounded-xl border border-slate-200 outline-none"
              >
                <option value={FacilityUnitTypeOfferingStatusEnum.ACTIVE}>
                  {t("status.active")}
                </option>
                <option value={FacilityUnitTypeOfferingStatusEnum.INACTIVE}>
                  {t("status.inactive")}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t("notesLabel")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={1000}
              className="w-full bg-slate-50 text-sm py-2.5 px-3 rounded-xl border border-slate-200 outline-none resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
