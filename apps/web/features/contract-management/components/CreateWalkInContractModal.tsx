"use client";

import React, { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Boxes,
  Calendar,
  Minus,
  Plus,
  Sparkles,
  UserCheck,
  UserPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/features/auth/store";
import { useFacilityAmenityOfferings } from "@/features/request-center/hooks";
import { useAvailableStorageUnitsForAssignment } from "@/features/reservation-management/hooks";
import { useFacilityOfferings } from "@/features/storage-unit-management/hooks";
import { useCreateContract, useFacilityStaffs } from "../hooks";
import {
  BillingUnitEnum,
  ContractSourceEnum,
  RoleEnum,
  UserStatusEnum,
  createContractSchema,
} from "../types";
import {
  dateInputToIso,
  formatVnd,
  getBillingUnitLabel,
  getCurrentUserId,
  getDateInputWithOffset,
  resolveContractErrorMessage,
} from "../utils";

interface CreateWalkInContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string | undefined;
  portalBase: "facility-manager" | "facility-staff";
}

export const CreateWalkInContractModal: React.FC<CreateWalkInContractModalProps> = ({
  isOpen,
  onClose,
  facilityId,
  portalBase,
}) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const currentUserId = getCurrentUserId(currentUser);
  const userRole = String(currentUser?.role ?? "").toLowerCase();
  const isManager = userRole === RoleEnum.FACILITY_MANAGER && portalBase !== "facility-staff";

  const offeringsQuery = useFacilityOfferings(facilityId);
  const offerings = useMemo(() => offeringsQuery.data ?? [], [offeringsQuery.data]);

  const amenityOfferingsQuery = useFacilityAmenityOfferings(facilityId);
  const availableAmenities = useMemo(
    () => (amenityOfferingsQuery.data ?? []).filter((a) => (a.availableQuantity ?? 0) > 0),
    [amenityOfferingsQuery.data]
  );

  const staffsQuery = useFacilityStaffs(
    { status: UserStatusEnum.ACTIVE, limit: 100 },
    isOpen && isManager
  );
  const staffList = useMemo(() => staffsQuery.data?.items ?? [], [staffsQuery.data?.items]);

  const [customerId, setCustomerId] = useState("");
  const [selectedOfferingId, setSelectedOfferingId] = useState("");
  const [selectedStorageUnitId, setSelectedStorageUnitId] = useState("");
  const [startDateInput, setStartDateInput] = useState(() => getDateInputWithOffset(0));
  const [endDateInput, setEndDateInput] = useState(() => getDateInputWithOffset(30));
  const [billingUnitOverride, setBillingUnitOverride] = useState<BillingUnitEnum | "">("");
  const [rentalPriceOverride, setRentalPriceOverride] = useState<string>("");
  const [depositAmountOverride, setDepositAmountOverride] = useState<string>("");
  const [amenityQuantities, setAmenityQuantities] = useState<Record<string, number>>({});
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeOffering = useMemo(() => {
    if (selectedOfferingId) {
      return offerings.find((o) => o.id === selectedOfferingId) ?? offerings[0] ?? null;
    }
    return offerings[0] ?? null;
  }, [offerings, selectedOfferingId]);

  const availableUnitsQuery = useAvailableStorageUnitsForAssignment(
    facilityId,
    activeOffering?.unitType?.id ? { unitTypeId: activeOffering.unitType.id } : undefined,
    isOpen && Boolean(facilityId)
  );
  const availableUnits = useMemo(() => availableUnitsQuery.data ?? [], [availableUnitsQuery.data]);

  const effectiveUnitId =
    selectedStorageUnitId && availableUnits.some((u) => u.id === selectedStorageUnitId)
      ? selectedStorageUnitId
      : (availableUnits[0]?.id ?? "");

  const effectiveBillingUnit: BillingUnitEnum =
    billingUnitOverride ||
    (activeOffering?.billingUnit as BillingUnitEnum) ||
    BillingUnitEnum.MONTH;

  const defaultRentalPrice = activeOffering?.pricePerUnit ?? 0;
  const defaultDepositAmount =
    defaultRentalPrice * Math.max(1, activeOffering?.depositMultiplier ?? 1);

  const effectiveRentalPrice =
    rentalPriceOverride !== "" ? Number(rentalPriceOverride) || 0 : defaultRentalPrice;
  const effectiveDepositAmount =
    depositAmountOverride !== "" ? Number(depositAmountOverride) || 0 : defaultDepositAmount;

  const amenitiesSubtotal = useMemo(() => {
    return availableAmenities.reduce((sum, item) => {
      const qty = amenityQuantities[item.id] ?? 0;
      return sum + (item.pricePerUnit || 0) * qty;
    }, 0);
  }, [availableAmenities, amenityQuantities]);

  const createContractMutation = useCreateContract();

  const updateAmenityQty = (id: string, delta: number, maxQty: number) => {
    setAmenityQuantities((prev) => {
      const current = prev[id] ?? 0;
      const nextVal = current + delta;
      const next = { ...prev };
      if (nextVal <= 0) {
        delete next[id];
      } else {
        next[id] = Math.min(maxQty, nextVal);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!facilityId) {
      setErrorMsg(isEn ? "Missing facility ID." : "Chưa xác định được cơ sở kho.");
      return;
    }

    if (!activeOffering) {
      setErrorMsg(isEn ? "Please select a storage package." : "Vui lòng chọn gói loại kho.");
      return;
    }

    if (!effectiveUnitId) {
      setErrorMsg(
        isEn
          ? "No available storage unit selected."
          : "Vui lòng chọn ô kho vật lý đang trống (AVAILABLE)."
      );
      return;
    }

    const startIso = dateInputToIso(startDateInput, false);
    const endIso = dateInputToIso(endDateInput, false);

    const amenitiesPayload = Object.entries(amenityQuantities)
      .filter(([, qty]) => qty >= 1)
      .map(([facilityAmenityOfferingId, quantity]) => ({
        facilityAmenityOfferingId,
        quantity,
      }));

    const resolvedStaffId = isManager
      ? assignedStaffId || staffList[0]?.id || currentUserId
      : currentUserId;

    const candidatePayload = {
      source: ContractSourceEnum.WALK_IN,
      customerId: customerId.trim(),
      facilityId,
      storageUnitId: effectiveUnitId,
      facilityUnitTypeOfferingId: activeOffering.id,
      assignedStaffId: resolvedStaffId || undefined,
      startDate: startIso,
      endDate: endIso,
      billingUnit: effectiveBillingUnit,
      rentalPrice: effectiveRentalPrice,
      depositAmount: effectiveDepositAmount,
      amenities: amenitiesPayload.length > 0 ? amenitiesPayload : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    };

    const parsed = createContractSchema.safeParse(candidatePayload);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setErrorMsg(
        firstIssue?.message ||
          (isEn
            ? "Please check all required Walk-in contract fields."
            : "Vui lòng kiểm tra lại đầy đủ thông tin hợp đồng Walk-in (Mã khách hàng 24 ký tự hex, ngày bắt đầu/kết thúc, ô kho).")
      );
      return;
    }

    try {
      const created = await createContractMutation.mutateAsync(parsed.data);
      onClose();
      router.push(`/${locale}/${portalBase}/contracts/${created.id}`);
    } catch (err: unknown) {
      setErrorMsg(resolveContractErrorMessage(err, locale));
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !createContractMutation.isPending) {
          setErrorMsg(null);
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 rounded-3xl border-slate-100 shadow-2xl overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold text-slate-900">
                {isEn
                  ? "Create Walk-in Contract at Counter"
                  : "Tạo Hợp đồng Khách vãng lai (Walk-in) tại Quầy"}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? "Initialize a DRAFT contract directly for walk-in customers, then collect deposit & check in."
                  : "Khởi tạo hợp đồng nháp (DRAFT) trực tiếp cho khách tại quầy, sau đó thu cọc và bàn giao kho."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 1. Customer ID & Assigned Staff */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {isEn
                  ? "Customer ID (24-hex ObjectId) *"
                  : "Mã tài khoản Khách hàng (Customer ID) *"}
              </label>
              <input
                type="text"
                required
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="VD: 67f1a2b3c4d5e6f7a8b9c0d1"
                className="w-full font-mono bg-slate-50 focus:bg-white text-xs text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>

            {isManager ? (
              <div>
                <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {isEn ? "Assigned Check-in Staff" : "Nhân viên phụ trách Check-in"}
                </label>
                <select
                  value={assignedStaffId || staffList[0]?.id || ""}
                  onChange={(e) => setAssignedStaffId(e.target.value)}
                  className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                >
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.email})
                    </option>
                  ))}
                  {currentUser?.id && !staffList.some((s) => s.id === currentUser.id) && (
                    <option value={currentUser.id}>
                      {currentUser.name} ({isEn ? "Manager" : "Quản lý"})
                    </option>
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  {isEn ? "Assigned Check-in Staff" : "Nhân viên phụ trách"}
                </label>
                <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-2.5 rounded-xl">
                  {currentUser?.name ?? "Facility Staff"} (
                  {isEn ? "Assigned to me" : "Tự phụ trách"})
                </div>
              </div>
            )}
          </div>

          {/* 2. Package Offering & Physical Storage Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                {isEn ? "Storage Package Offering *" : "Gói loại kho mở bán *"}
              </label>
              <select
                value={activeOffering?.id ?? ""}
                onChange={(e) => {
                  setSelectedOfferingId(e.target.value);
                  setSelectedStorageUnitId("");
                  setRentalPriceOverride("");
                  setDepositAmountOverride("");
                  setBillingUnitOverride("");
                }}
                className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              >
                {offerings.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.unitType.name} — {formatVnd(off.pricePerUnit)}/
                    {getBillingUnitLabel(off.billingUnit, locale)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {isEn
                  ? `Available Storage Unit (${availableUnits.length}) *`
                  : `Ô kho vật lý đang trống (${availableUnits.length}) *`}
              </label>
              <select
                value={effectiveUnitId}
                onChange={(e) => setSelectedStorageUnitId(e.target.value)}
                disabled={availableUnits.length === 0}
                className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none disabled:opacity-50"
              >
                {availableUnits.length === 0 ? (
                  <option value="">
                    {isEn ? "No AVAILABLE units for this package" : "Không còn phòng kho trống"}
                  </option>
                ) : (
                  availableUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      #{unit.unitNumber} — {isEn ? `Floor ${unit.floor}` : `Tầng ${unit.floor}`}
                      {unit.zone ? ` • ${isEn ? `Zone ${unit.zone}` : `Dãy ${unit.zone}`}` : ""}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* 3. Start Date, End Date & Billing Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                {isEn ? "Start Date *" : "Ngày bắt đầu *"}
              </label>
              <input
                type="date"
                required
                value={startDateInput}
                onChange={(e) => {
                  setStartDateInput(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                {isEn ? "End Date *" : "Ngày kết thúc *"}
              </label>
              <input
                type="date"
                required
                value={endDateInput}
                min={startDateInput}
                onChange={(e) => {
                  setEndDateInput(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {isEn ? "Billing Unit *" : "Chu kỳ tính giá *"}
              </label>
              <select
                value={effectiveBillingUnit}
                onChange={(e) => setBillingUnitOverride(e.target.value as BillingUnitEnum)}
                className="w-full bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              >
                <option value={BillingUnitEnum.MONTH}>{isEn ? "Month" : "Theo tháng"}</option>
                <option value={BillingUnitEnum.DAY}>{isEn ? "Day" : "Theo ngày"}</option>
                <option value={BillingUnitEnum.ONE_TIME}>{isEn ? "One-time" : "Một lần"}</option>
              </select>
            </div>
          </div>

          {/* 4. Rental Price & Deposit Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {isEn ? "Rental Price (VND) *" : "Đơn giá thuê (VND) *"}
              </label>
              <input
                type="number"
                min={0}
                value={
                  rentalPriceOverride !== "" ? rentalPriceOverride : String(defaultRentalPrice)
                }
                onChange={(e) => setRentalPriceOverride(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white text-xs font-bold text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                {isEn ? "Deposit Amount (VND) *" : "Tiền đặt cọc hợp đồng (VND) *"}
              </label>
              <input
                type="number"
                min={0}
                value={
                  depositAmountOverride !== ""
                    ? depositAmountOverride
                    : String(defaultDepositAmount)
                }
                onChange={(e) => setDepositAmountOverride(e.target.value)}
                className="w-full bg-slate-50 focus:bg-white text-xs font-bold text-emerald-700 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* 5. Add-on Amenities */}
          {availableAmenities.length > 0 && (
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {isEn ? "Add-on Amenities (Optional)" : "Tiện ích đi kèm (Tùy chọn)"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableAmenities.map((item) => {
                  const qty = amenityQuantities[item.id] ?? 0;
                  const maxQty = item.availableQuantity ?? 1;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-2 p-3 rounded-xl border text-xs ${
                        qty > 0
                          ? "border-emerald-300 bg-emerald-50/40"
                          : "border-slate-200/80 bg-slate-50/70"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">{item.amenity.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {formatVnd(item.pricePerUnit)} •{" "}
                          {isEn ? `Stock: ${maxQty}` : `Còn: ${maxQty}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateAmenityQty(item.id, -1, maxQty)}
                          disabled={qty <= 0}
                          className="w-7 h-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 disabled:opacity-40"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center font-extrabold text-slate-800">{qty}</span>
                        <button
                          type="button"
                          onClick={() => updateAmenityQty(item.id, 1, maxQty)}
                          disabled={qty >= maxQty}
                          className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {isEn ? "Notes" : "Ghi chú"}
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isEn
                  ? "Walk-in contract notes at counter..."
                  : "Ghi chú hợp đồng khách vãng lai tại quầy..."
              }
              className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none resize-none"
            />
          </div>

          {/* Summary Box */}
          <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200/80 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-slate-600 font-semibold">
                {isEn ? "Deposit to collect before check-in:" : "Tiền cọc cần thu tại quầy:"}
              </span>{" "}
              <strong className="text-emerald-700 text-sm">
                {formatVnd(effectiveDepositAmount)}
              </strong>
            </div>
            <div>
              <span className="text-slate-600 font-semibold">
                {isEn ? "Amenities subtotal:" : "Tiện ích đi kèm:"}
              </span>{" "}
              <strong className="text-slate-800">{formatVnd(amenitiesSubtotal)}</strong>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={createContractMutation.isPending}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              {isEn ? "Cancel" : "Hủy bỏ"}
            </button>
            <button
              type="submit"
              disabled={createContractMutation.isPending}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm disabled:opacity-50"
            >
              {createContractMutation.isPending
                ? isEn
                  ? "Creating..."
                  : "Đang tạo hợp đồng..."
                : isEn
                  ? "Create Walk-in Contract"
                  : "Tạo hợp đồng Walk-in"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
