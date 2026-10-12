"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, FilePlus2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppApiError } from "@/lib/api/axios";
import { useFacilityOfferings } from "@/features/storage-unit-management/hooks";
import { useUnitTypes } from "@/features/unit-type-management/hooks";
import { UnitTypeStatusEnum } from "@/features/unit-type-management/types";
import { useAmenities } from "@/features/amenity-management/hooks";
import { AmenityStatusEnum } from "@/features/amenity-management/types";
import { BillingUnitEnum } from "@/features/offering-management/types";
import { useCreateApprovalRequest } from "../hooks";
import { ApprovalRequestActionEnum, ApprovalRequestTargetTypeEnum } from "../types";

interface CreateRequestModalProps {
  facilityId: string;
  isOpen: boolean;
  onClose: () => void;
}

/** Bốn loại đề xuất theo yêu cầu nghiệp vụ; mỗi loại map sang targetType/action/payload riêng của BE. */
type RequestKind = "new_offering" | "adjust_price" | "new_amenity" | "new_unit_type";

const REASON_MIN = 5;

export const CreateRequestModal = ({ facilityId, isOpen, onClose }: CreateRequestModalProps) => {
  const t = useTranslations("facilityManager.requests.createModal");
  const createMutation = useCreateApprovalRequest();

  const [kind, setKind] = useState<RequestKind>("new_offering");
  const [reason, setReason] = useState("");

  // new_offering: mở bán loại kho mới tại cơ sở
  const [unitTypeId, setUnitTypeId] = useState("");
  // adjust_price: điều chỉnh offering hiện có
  const [offeringId, setOfferingId] = useState("");
  // new_amenity: xin cấp thêm tiện ích
  const [amenityId, setAmenityId] = useState("");
  // shared pricing fields (new_offering / adjust_price / new_amenity)
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [billingUnit, setBillingUnit] = useState<BillingUnitEnum>(BillingUnitEnum.MONTH);
  const [depositMultiplier, setDepositMultiplier] = useState("1");
  const [totalQuantity, setTotalQuantity] = useState("1");
  // new_unit_type: đề xuất tạo loại kho mới
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeLength, setNewTypeLength] = useState("");
  const [newTypeWidth, setNewTypeWidth] = useState("");
  const [newTypeHeight, setNewTypeHeight] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { data: unitTypesData } = useUnitTypes({ limit: 100, status: UnitTypeStatusEnum.ACTIVE });
  const { data: offerings } = useFacilityOfferings(facilityId);
  const { data: amenitiesData } = useAmenities({ limit: 100, status: AmenityStatusEnum.ACTIVE });

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setKind("new_offering");
    setReason("");
    setUnitTypeId("");
    setOfferingId("");
    setAmenityId("");
    setPricePerUnit("");
    setBillingUnit(BillingUnitEnum.MONTH);
    setDepositMultiplier("1");
    setTotalQuantity("1");
    setNewTypeName("");
    setNewTypeLength("");
    setNewTypeWidth("");
    setNewTypeHeight("");
    setError(null);
    setSuccess(null);
  }, [isOpen]);

  const handleClose = () => {
    if (createMutation.isPending) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < REASON_MIN) {
      setError(t("validation.reason", { min: REASON_MIN }));
      return;
    }

    try {
      if (kind === "new_offering") {
        if (!unitTypeId || !pricePerUnit) return setError(t("validation.required"));
        await createMutation.mutateAsync({
          facilityId,
          targetType: ApprovalRequestTargetTypeEnum.FACILITY_UNIT_TYPE_OFFERING,
          action: ApprovalRequestActionEnum.CREATE,
          payload: {
            facilityId,
            unitTypeId,
            pricePerUnit: Number(pricePerUnit),
            billingUnit,
            depositMultiplier: Number(depositMultiplier) || 1,
          },
          reason: reason.trim(),
        });
      } else if (kind === "adjust_price") {
        if (!offeringId || !pricePerUnit) return setError(t("validation.required"));
        await createMutation.mutateAsync({
          facilityId,
          targetType: ApprovalRequestTargetTypeEnum.FACILITY_UNIT_TYPE_OFFERING,
          action: ApprovalRequestActionEnum.UPDATE,
          targetId: offeringId,
          payload: {
            pricePerUnit: Number(pricePerUnit),
            depositMultiplier: Number(depositMultiplier) || 1,
          },
          reason: reason.trim(),
        });
      } else if (kind === "new_amenity") {
        if (!amenityId || !pricePerUnit) return setError(t("validation.required"));
        await createMutation.mutateAsync({
          facilityId,
          targetType: ApprovalRequestTargetTypeEnum.FACILITY_AMENITY_OFFERING,
          action: ApprovalRequestActionEnum.CREATE,
          payload: {
            facilityId,
            amenityId,
            pricePerUnit: Number(pricePerUnit),
            billingUnit,
            totalQuantity: Number(totalQuantity) || 1,
          },
          reason: reason.trim(),
        });
      } else {
        const length = Number(newTypeLength);
        const width = Number(newTypeWidth);
        const height = Number(newTypeHeight);
        if (!newTypeName.trim() || !length || !width || !height) {
          return setError(t("validation.required"));
        }
        await createMutation.mutateAsync({
          targetType: ApprovalRequestTargetTypeEnum.UNIT_TYPE,
          action: ApprovalRequestActionEnum.CREATE,
          payload: {
            name: newTypeName.trim(),
            dimensions: { length, width, height },
          },
          reason: reason.trim(),
        });
      }
      setSuccess(t("success"));
      setTimeout(handleClose, 1000);
    } catch (err) {
      setError(err instanceof AppApiError ? err.message : t("error"));
    }
  };

  const selectClass =
    "w-full bg-slate-50 text-sm py-2.5 px-3 rounded-xl border border-slate-200 outline-none";
  const labelClass = "block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-emerald-600" />
            {t("title")}
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

          <div>
            <label className={labelClass}>{t("kindLabel")}</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as RequestKind)}
              className={selectClass}
            >
              <option value="new_offering">{t("kind.newOffering")}</option>
              <option value="adjust_price">{t("kind.adjustPrice")}</option>
              <option value="new_amenity">{t("kind.newAmenity")}</option>
              <option value="new_unit_type">{t("kind.newUnitType")}</option>
            </select>
          </div>

          {kind === "new_offering" && (
            <div>
              <label className={labelClass}>{t("unitTypeLabel")}</label>
              <select
                value={unitTypeId}
                onChange={(e) => setUnitTypeId(e.target.value)}
                className={selectClass}
              >
                <option value="">{t("unitTypePlaceholder")}</option>
                {unitTypesData?.items.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {kind === "adjust_price" && (
            <div>
              <label className={labelClass}>{t("offeringLabel")}</label>
              <select
                value={offeringId}
                onChange={(e) => setOfferingId(e.target.value)}
                className={selectClass}
              >
                <option value="">{t("offeringPlaceholder")}</option>
                {offerings?.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.unitType.name} — {o.pricePerUnit.toLocaleString("vi-VN")}đ
                  </option>
                ))}
              </select>
            </div>
          )}

          {kind === "new_amenity" && (
            <div>
              <label className={labelClass}>{t("amenityLabel")}</label>
              <select
                value={amenityId}
                onChange={(e) => setAmenityId(e.target.value)}
                className={selectClass}
              >
                <option value="">{t("amenityPlaceholder")}</option>
                {amenitiesData?.items.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(kind === "new_offering" || kind === "adjust_price" || kind === "new_amenity") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>{t("priceLabel")}</label>
                <input
                  type="number"
                  min={0}
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  className={selectClass}
                />
              </div>
              {kind === "new_amenity" ? (
                <div>
                  <label className={labelClass}>{t("totalQuantityLabel")}</label>
                  <input
                    type="number"
                    min={1}
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(e.target.value)}
                    className={selectClass}
                  />
                </div>
              ) : (
                <div>
                  <label className={labelClass}>{t("depositLabel")}</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={depositMultiplier}
                    onChange={(e) => setDepositMultiplier(e.target.value)}
                    className={selectClass}
                  />
                </div>
              )}
            </div>
          )}

          {(kind === "new_offering" || kind === "new_amenity") && (
            <div>
              <label className={labelClass}>{t("billingUnitLabel")}</label>
              <select
                value={billingUnit}
                onChange={(e) => setBillingUnit(e.target.value as BillingUnitEnum)}
                className={selectClass}
              >
                <option value={BillingUnitEnum.DAY}>{t("billingUnit.day")}</option>
                <option value={BillingUnitEnum.MONTH}>{t("billingUnit.month")}</option>
                <option value={BillingUnitEnum.ONE_TIME}>{t("billingUnit.oneTime")}</option>
              </select>
            </div>
          )}

          {kind === "new_unit_type" && (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>{t("newTypeNameLabel")}</label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className={selectClass}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>{t("lengthLabel")}</label>
                  <input
                    type="number"
                    min={0}
                    value={newTypeLength}
                    onChange={(e) => setNewTypeLength(e.target.value)}
                    className={selectClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("widthLabel")}</label>
                  <input
                    type="number"
                    min={0}
                    value={newTypeWidth}
                    onChange={(e) => setNewTypeWidth(e.target.value)}
                    className={selectClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("heightLabel")}</label>
                  <input
                    type="number"
                    min={0}
                    value={newTypeHeight}
                    onChange={(e) => setNewTypeHeight(e.target.value)}
                    className={selectClass}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>{t("reasonLabel")} *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder={t("reasonPlaceholder")}
              className="w-full bg-slate-50 text-sm py-2.5 px-3 rounded-xl border border-slate-200 outline-none resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t("submitting") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
