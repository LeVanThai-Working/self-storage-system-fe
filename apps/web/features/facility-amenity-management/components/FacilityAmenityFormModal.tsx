"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Package,
  Coins,
  Calendar,
  FileText,
  Loader2,
  MapPin,
  Layers,
} from "lucide-react";
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
import { useAmenities } from "@/features/amenity-management/hooks";
import { AmenityStatusEnum } from "@/features/amenity-management/types";
import { AppApiError } from "@/lib/api/axios";
import {
  useCreateFacilityAmenityOffering,
  useUpdateFacilityAmenityOffering,
  useCheckFacilityAmenityOffering,
  useFacilityAmenityOffering,
} from "../hooks";
import {
  BillingUnitEnum,
  FacilityAmenityOfferingStatusEnum,
  type UpdateFacilityAmenityOfferingRequest,
} from "../types";

interface FacilityAmenityFormModalProps {
  /**
   * null = create mode (POST /facility-amenity-offerings)
   * id   = edit mode (nạp từ GET /{id} và lưu qua PATCH /{id})
   */
  offeringId: string | null;
  isOpen: boolean;
  onClose: () => void;
  presetFacilityId?: string;
  presetAmenityId?: string;
}

const inputClass =
  "w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm font-medium text-slate-800 py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

export const FacilityAmenityFormModal = ({
  offeringId,
  isOpen,
  onClose,
  presetFacilityId,
  presetAmenityId,
}: FacilityAmenityFormModalProps) => {
  const t = useTranslations("businessOps.facilityAmenities.formModal");
  const isEdit = Boolean(offeringId);

  const createMutation = useCreateFacilityAmenityOffering();
  const updateMutation = useUpdateFacilityAmenityOffering();

  // Nạp dữ liệu chi tiết khi ở chế độ edit
  const {
    data: offering,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    refetch: refetchDetail,
  } = useFacilityAmenityOffering(offeringId, { enabled: isOpen && isEdit });

  // Danh sách cơ sở & tiện ích đang hoạt động
  const { data: facilitiesData } = useFacilities({
    limit: 100,
    status: FacilityStatusEnum.ACTIVE,
  });
  const { data: amenitiesData } = useAmenities({
    limit: 100,
    status: AmenityStatusEnum.ACTIVE,
  });

  // Form states
  const [facilityId, setFacilityId] = useState("");
  const [amenityId, setAmenityId] = useState("");
  const [billingUnit, setBillingUnit] = useState<BillingUnitEnum>(BillingUnitEnum.MONTH);
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [totalQuantity, setTotalQuantity] = useState("10");
  const [status, setStatus] = useState<FacilityAmenityOfferingStatusEnum>(
    FacilityAmenityOfferingStatusEnum.ACTIVE
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Kiểm tra trùng lặp chỉ ở chế độ tạo mới
  const checkOfferingQuery = useCheckFacilityAmenityOffering(facilityId, amenityId, {
    enabled: isOpen && !isEdit && Boolean(facilityId && amenityId),
  });
  const existingOffering = checkOfferingQuery.data;
  const isDuplicate = Boolean(!isEdit && existingOffering);

  // Reset form (create) hoặc điền sẵn dữ liệu từ GET {id} (edit)
  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && !offering) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFacilityId(offering?.facility.id || presetFacilityId || "");
    setAmenityId(offering?.amenity.id || presetAmenityId || "");
    setBillingUnit(offering?.billingUnit || BillingUnitEnum.MONTH);
    setPricePerUnit(offering ? String(offering.pricePerUnit) : "");
    setTotalQuantity(offering ? String(offering.totalQuantity) : "10");
    setStatus(offering?.status || FacilityAmenityOfferingStatusEnum.ACTIVE);
    setNotes(offering?.notes || "");
    setError(null);
    setSuccess(null);
  }, [isOpen, isEdit, offering, presetFacilityId, presetAmenityId]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleClose = () => {
    if (isPending) return;
    setError(null);
    setSuccess(null);
    onClose();
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

  const selectedAmenity = amenitiesData?.items.find((a) => a.id === amenityId);

  /** Chỉ gửi những trường thay đổi lên PATCH */
  const buildPatchPayload = (
    price: number,
    quantity: number
  ): UpdateFacilityAmenityOfferingRequest => {
    if (!offering) return {};
    const payload: UpdateFacilityAmenityOfferingRequest = {};
    if (price !== offering.pricePerUnit) payload.pricePerUnit = price;
    if (billingUnit !== offering.billingUnit) payload.billingUnit = billingUnit;
    if (quantity !== offering.totalQuantity) payload.totalQuantity = quantity;
    if (status !== offering.status) payload.status = status;
    const trimmedNotes = notes.trim();
    if (trimmedNotes !== (offering.notes || "")) payload.notes = trimmedNotes;
    return payload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEdit && (!facilityId || !amenityId)) {
      setError(t("validation.required"));
      return;
    }
    if (isDuplicate) {
      setError(t("validation.duplicate"));
      return;
    }

    const price = Number(pricePerUnit);
    if (pricePerUnit === "" || Number.isNaN(price) || price < 0) {
      setError(t("validation.price"));
      return;
    }

    const quantity = Math.floor(Number(totalQuantity));
    if (totalQuantity === "" || Number.isNaN(quantity) || quantity < 0) {
      setError(t("validation.quantity"));
      return;
    }

    // Khi edit: không cho giảm tổng số lượng thấp hơn số lượng đang dùng
    if (isEdit && offering && quantity < offering.inUseQuantity) {
      setError(t("validation.quantityLessThanInUse", { inUse: offering.inUseQuantity }));
      return;
    }

    try {
      if (isEdit && offeringId) {
        const payload = buildPatchPayload(price, quantity);
        if (Object.keys(payload).length === 0) {
          setError(t("noChanges"));
          return;
        }
        await updateMutation.mutateAsync({ id: offeringId, payload });
      } else {
        await createMutation.mutateAsync({
          facilityId,
          amenityId,
          pricePerUnit: price,
          billingUnit,
          totalQuantity: quantity,
          status,
          notes: notes.trim() || undefined,
        });
      }
      setSuccess(isEdit ? t("updateSuccess") : t("success"));
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err instanceof AppApiError ? err.message : t("error"));
    }
  };

  const renderDetailState = () => {
    if (isLoadingDetail) {
      return (
        <div className="py-12 flex flex-col items-center gap-3 text-sm text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          {t("loadingDetail")}
        </div>
      );
    }
    if (isDetailError || !offering) {
      return (
        <div className="py-10 flex flex-col items-center gap-3 text-sm text-rose-700">
          <AlertCircle className="w-6 h-6 text-rose-500" />
          {t("loadDetailError")}
          <Button
            type="button"
            variant="outline"
            onClick={() => refetchDetail()}
            className="rounded-xl"
          >
            {t("retry")}
          </Button>
        </div>
      );
    }
    return null;
  };

  const detailState = isEdit ? renderDetailState() : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg font-bold text-slate-900">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            {isEdit ? t("editTitle") : t("createTitle")}
          </DialogTitle>
        </DialogHeader>

        {detailState ?? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {success && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-800 text-xs sm:text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                {success}
              </div>
            )}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs sm:text-sm font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                {error}
              </div>
            )}

            {/* Cơ sở & Tiện ích */}
            {isEdit && offering ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                    {t("facilityLabel")}
                  </div>
                  <div className="font-bold text-slate-900 mt-1">{offering.facility.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">
                      {offering.facility.address ? `${offering.facility.address}, ` : ""}
                      {offering.facility.city}
                    </span>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <Package className="w-3.5 h-3.5" />
                    {t("amenityLabel")}
                  </div>
                  <div className="font-bold text-slate-900 mt-1">{offering.amenity.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 capitalize">
                    {t(`amenityType.${offering.amenity.type}`)}
                  </div>
                </div>
                <p className="sm:col-span-2 text-[11px] text-slate-400">{t("fixedPairHint")}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {t("facilityLabel")} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={facilityId}
                      onChange={(e) => setFacilityId(e.target.value)}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">{t("facilityPlaceholder")}</option>
                      {facilitiesData?.items.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({f.city})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      {t("amenityLabel")} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={amenityId}
                      onChange={(e) => setAmenityId(e.target.value)}
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="">{t("amenityPlaceholder")}</option>
                      {amenitiesData?.items.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({t(`amenityType.${a.type}`)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedAmenity && (
                  <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{selectedAmenity.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-bold uppercase text-[10px]">
                        {selectedAmenity.type}
                      </span>
                    </div>
                    {selectedAmenity.description && (
                      <span className="text-slate-400 truncate max-w-[200px]">
                        {selectedAmenity.description}
                      </span>
                    )}
                  </div>
                )}

                {/* Cảnh báo kiểm tra trùng lặp theo thời gian thực */}
                {facilityId && amenityId && (
                  <div>
                    {checkOfferingQuery.isLoading ? (
                      <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
                        {t("checkingDuplicate")}
                      </div>
                    ) : isDuplicate ? (
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <div className="font-bold">{t("duplicateWarning")}</div>
                          {existingOffering && (
                            <div className="text-[11px] text-amber-800 mt-1">
                              {formatPrice(existingOffering.pricePerUnit)} /{" "}
                              {existingOffering.billingUnit} • Tồn kho:{" "}
                              {existingOffering.availableQuantity}/{existingOffering.totalQuantity}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 px-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {t("availablePair")}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Đơn giá & Chu kỳ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  <Coins className="w-3.5 h-3.5 text-slate-400" />
                  {t("priceLabel")} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  placeholder={t("pricePlaceholder")}
                  value={pricePerUnit}
                  onChange={(e) => setPricePerUnit(e.target.value)}
                  className={`${inputClass} font-semibold text-slate-900`}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {t("billingUnitLabel")} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={billingUnit}
                  onChange={(e) => setBillingUnit(e.target.value as BillingUnitEnum)}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value={BillingUnitEnum.MONTH}>{t("billingUnit.month")}</option>
                  <option value={BillingUnitEnum.DAY}>{t("billingUnit.day")}</option>
                  <option value={BillingUnitEnum.ONE_TIME}>{t("billingUnit.oneTime")}</option>
                </select>
              </div>
            </div>

            {/* Số lượng trang bị (totalQuantity) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  {t("totalQuantityLabel")} <span className="text-rose-500">*</span>
                </label>
                {isEdit && offering && (
                  <span className="text-[11px] text-slate-500">
                    Đang được thuê: <b className="text-slate-800">{offering.inUseQuantity}</b> • Còn
                    trống: <b className="text-emerald-700">{offering.availableQuantity}</b>
                  </span>
                )}
              </div>
              <input
                type="number"
                min={isEdit && offering ? offering.inUseQuantity : 0}
                step={1}
                placeholder={t("totalQuantityPlaceholder")}
                value={totalQuantity}
                onChange={(e) => setTotalQuantity(e.target.value)}
                className={inputClass}
              />
              <p className="text-[11px] text-slate-400 mt-1">{t("totalQuantityHint")}</p>
            </div>

            {/* Trạng thái */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {t("statusLabel")}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as FacilityAmenityOfferingStatusEnum)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value={FacilityAmenityOfferingStatusEnum.ACTIVE}>
                  {t("status.active")}
                </option>
                <option value={FacilityAmenityOfferingStatusEnum.INACTIVE}>
                  {t("status.inactive")}
                </option>
              </select>
            </div>

            {/* Ghi chú */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  {t("notesLabel")}
                </label>
                <span className="text-[11px] text-slate-400">{notes.length}/1000</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                rows={2}
                maxLength={1000}
                className={`${inputClass} font-normal resize-none`}
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-xl"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending || isDuplicate || Boolean(success)}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("saving")}
                  </>
                ) : isEdit ? (
                  t("update")
                ) : (
                  t("save")
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
