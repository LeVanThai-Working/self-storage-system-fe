"use client";

import React, { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, Boxes, CheckCircle2, Info, Pencil, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UnitStatusBadge } from "@/components/common/UnitStatusBadge";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useCreateStorageUnit, useUpdateStorageUnit } from "../hooks";
import {
  StorageUnitStatusEnum,
  isUnitLocked,
  type FacilityUnitTypeOfferingResponse,
  type StorageUnitResponse,
  type UpdateStorageUnitRequest,
} from "../types";

interface StorageUnitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string;
  /** Offerings ACTIVE của cơ sở - nguồn cho dropdown "Loại kho". */
  offerings: FacilityUnitTypeOfferingResponse[];
  /** Có giá trị = chế độ chỉnh sửa, null = tạo mới. */
  unit?: StorageUnitResponse | null;
}

const UNIT_NUMBER_MAX = 50;
const ZONE_MAX = 100;
const NOTES_MAX = 1000;

const INPUT_BASE =
  "w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-3.5 py-2.5 rounded-xl border focus:ring-2 outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed";
const INPUT_OK = "border-slate-200/80 focus:border-teal-500 focus:ring-teal-500/20";
const INPUT_ERR = "border-rose-400 focus:ring-rose-500/20";
const LABEL = "block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5";

export const StorageUnitFormModal = ({
  isOpen,
  onClose,
  facilityId,
  offerings,
  unit,
}: StorageUnitFormModalProps) => {
  const isEdit = Boolean(unit);
  const t = useTranslations("facilityManager.storageUnits.formModal");
  const tErrors = useTranslations("facilityManager.storageUnits.errors");
  const getErrorMessage = useApiErrorMessage();
  const createMutation = useCreateStorageUnit();
  const updateMutation = useUpdateStorageUnit();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Form states
  const [unitNumber, setUnitNumber] = useState<string>(unit?.unitNumber ?? "");
  const [floor, setFloor] = useState<string>(String(unit?.floor ?? 1));
  const [zone, setZone] = useState<string>(unit?.zone ?? "");
  const [unitTypeId, setUnitTypeId] = useState<string>(unit?.unitTypeId ?? "");
  const [status, setStatus] = useState<StorageUnitStatusEnum>(
    unit?.status ?? StorageUnitStatusEnum.AVAILABLE
  );
  const [notes, setNotes] = useState<string>(unit?.notes ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reserved / occupied units cannot change type; only available / inactive units can change status here.
  const locked = unit ? isUnitLocked(unit.status) : false;
  const statusEditable =
    !unit ||
    unit.status === StorageUnitStatusEnum.AVAILABLE ||
    unit.status === StorageUnitStatusEnum.INACTIVE;

  const statusOptions = isEdit
    ? [StorageUnitStatusEnum.AVAILABLE, StorageUnitStatusEnum.INACTIVE]
    : [
        StorageUnitStatusEnum.AVAILABLE,
        StorageUnitStatusEnum.UNDER_MAINTENANCE,
        StorageUnitStatusEnum.INACTIVE,
      ];

  // Unit types the facility currently sells; keep the unit's current type selectable even if its offering was disabled.
  const unitTypeOptions = useMemo(() => {
    const options = offerings.map((offering) => ({
      id: offering.unitType.id,
      name: offering.unitType.name,
      area: offering.unitType.area,
    }));
    if (unit?.unitType && !options.some((o) => o.id === unit.unitType!.id)) {
      options.unshift({
        id: unit.unitType.id,
        name: unit.unitType.name,
        area: unit.unitType.area,
      });
    }
    return options;
  }, [offerings, unit]);

  const selectedUnitType = offerings.find((o) => o.unitType.id === unitTypeId)?.unitType;

  const clearError = (field: string) => {
    if (errors[field] || errors.general)
      setErrors((prev) => ({ ...prev, [field]: "", general: "" }));
  };

  const validate = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    const trimmedNumber = unitNumber.trim();
    const floorValue = Number(floor);

    if (!trimmedNumber) newErrors.unitNumber = t("validation.unitNumberRequired");
    else if (trimmedNumber.length > UNIT_NUMBER_MAX)
      newErrors.unitNumber = t("validation.unitNumberMax", { max: UNIT_NUMBER_MAX });

    if (!Number.isInteger(floorValue) || floorValue < 1)
      newErrors.floor = t("validation.floorInvalid");
    if (zone.trim().length > ZONE_MAX) newErrors.zone = t("validation.zoneMax", { max: ZONE_MAX });
    if (!unitTypeId) newErrors.unitTypeId = t("validation.unitTypeRequired");
    if (notes.length > NOTES_MAX) newErrors.notes = t("validation.notesMax", { max: NOTES_MAX });

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSuccessMessage(null);

    try {
      if (unit) {
        // Only send what actually changed
        const payload: UpdateStorageUnitRequest = {};
        const nextNumber = unitNumber.trim();
        if (nextNumber.toUpperCase() !== unit.unitNumber) payload.unitNumber = nextNumber;
        if (Number(floor) !== unit.floor) payload.floor = Number(floor);
        if (zone.trim() !== (unit.zone ?? "")) payload.zone = zone.trim();
        if (!locked && unitTypeId !== unit.unitTypeId) payload.unitTypeId = unitTypeId;
        if (statusEditable && status !== unit.status) payload.status = status;
        if (notes.trim() !== (unit.notes ?? "")) payload.notes = notes.trim();

        if (Object.keys(payload).length === 0) {
          onClose();
          return;
        }
        await updateMutation.mutateAsync({ id: unit.id, payload });
      } else {
        await createMutation.mutateAsync({
          facilityId,
          unitTypeId,
          unitNumber: unitNumber.trim(),
          floor: Number(floor),
          zone: zone.trim() || undefined,
          status,
          notes: notes.trim() || undefined,
        });
      }
      setSuccessMessage(isEdit ? t("successEdit") : t("successCreate"));
      setTimeout(onClose, 1000);
    } catch (err: unknown) {
      setErrors({
        general: getErrorMessage(err, {
          MESSAGE_CODE_101: isEdit ? tErrors("updateRejected") : tErrors("createRejected"),
          MESSAGE_CODE_105: tErrors("duplicateUnitNumber"),
        }),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-slate-100 shadow-2xl">
        {/* Modal Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              {isEdit ? <Pencil className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight">
                {isEdit ? t("editTitle") : t("createTitle")}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit ? t("editSubtitle") : t("createSubtitle")}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errors.general && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span className="font-medium">{errors.general}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          )}

          {!isEdit && unitTypeOptions.length === 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
              <span>{t("noOffering")}</span>
            </div>
          )}

          {/* Row 1: Unit number & Unit type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>{t("unitNumberLabel")}</label>
              <input
                type="text"
                value={unitNumber}
                maxLength={UNIT_NUMBER_MAX + 20}
                onChange={(e) => {
                  setUnitNumber(e.target.value);
                  clearError("unitNumber");
                }}
                placeholder={t("unitNumberPlaceholder")}
                className={`${INPUT_BASE} uppercase ${errors.unitNumber ? INPUT_ERR : INPUT_OK}`}
              />
              {errors.unitNumber && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.unitNumber}</p>
              )}
            </div>

            <div>
              <label className={LABEL}>{t("unitTypeLabel")}</label>
              <select
                value={unitTypeId}
                disabled={locked}
                onChange={(e) => {
                  setUnitTypeId(e.target.value);
                  clearError("unitTypeId");
                }}
                className={`${INPUT_BASE} font-medium cursor-pointer ${
                  errors.unitTypeId ? INPUT_ERR : INPUT_OK
                }`}
              >
                <option value="">{t("unitTypePlaceholder")}</option>
                {unitTypeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} ({option.area} m²)
                  </option>
                ))}
              </select>
              {errors.unitTypeId && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.unitTypeId}</p>
              )}
              {locked && (
                <p className="text-[11px] text-amber-700 font-medium mt-1">{t("unitTypeLocked")}</p>
              )}
            </div>
          </div>

          {/* Selected unit type preview */}
          {selectedUnitType && (
            <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-100 flex items-center gap-3 text-xs text-slate-600">
              <Boxes className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span className="font-semibold text-slate-800">{selectedUnitType.name}</span>
              <span>
                {selectedUnitType.area} m² · {selectedUnitType.volume} m³
              </span>
            </div>
          )}

          {/* Row 2: Floor & Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>{t("floorLabel")}</label>
              <input
                type="number"
                min={1}
                step={1}
                value={floor}
                onChange={(e) => {
                  setFloor(e.target.value);
                  clearError("floor");
                }}
                className={`${INPUT_BASE} font-mono ${errors.floor ? INPUT_ERR : INPUT_OK}`}
              />
              {errors.floor && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.floor}</p>
              )}
            </div>

            <div>
              <label className={LABEL}>{t("zoneLabel")}</label>
              <input
                type="text"
                value={zone}
                onChange={(e) => {
                  setZone(e.target.value);
                  clearError("zone");
                }}
                placeholder={t("zonePlaceholder")}
                className={`${INPUT_BASE} ${errors.zone ? INPUT_ERR : INPUT_OK}`}
              />
              {errors.zone && (
                <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.zone}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={LABEL}>{t("statusLabel")}</label>
            {statusEditable ? (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StorageUnitStatusEnum)}
                className={`${INPUT_BASE} ${INPUT_OK} font-medium cursor-pointer`}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {t(`statusOptions.${option}`)}
                  </option>
                ))}
              </select>
            ) : (
              unit && (
                <div className="flex flex-wrap items-center gap-3">
                  <UnitStatusBadge status={unit.status} />
                  <span className="text-[11px] text-slate-500">{t("statusReadonly")}</span>
                </div>
              )
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={LABEL}>{t("notesLabel")}</label>
            <textarea
              value={notes}
              rows={3}
              onChange={(e) => {
                setNotes(e.target.value);
                clearError("notes");
              }}
              placeholder={t("notesPlaceholder")}
              className={`${INPUT_BASE} resize-none ${errors.notes ? INPUT_ERR : INPUT_OK}`}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.notes ? (
                <p className="text-[11px] text-rose-600 font-medium">{errors.notes}</p>
              ) : (
                <span />
              )}
              <span className="text-[11px] text-slate-400">
                {notes.length}/{NOTES_MAX}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-3 border-t border-slate-100 gap-2 sm:gap-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending || Boolean(successMessage)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isPending && (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isPending ? t("saving") : isEdit ? t("confirmEdit") : t("confirmCreate")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
