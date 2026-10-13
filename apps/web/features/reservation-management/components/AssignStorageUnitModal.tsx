"use client";

import React, { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  Boxes,
  Calendar,
  CheckCircle2,
  Clock,
  Inbox,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  User,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppApiError } from "@/lib/api/axios";
import { useApiErrorMessage } from "@/features/auth/error-message";
import {
  useAssignStorageUnit,
  useAvailableStorageUnitsForAssignment,
  useReceiveReservation,
} from "../hooks";
import {
  MESSAGE_CODE,
  ReservationStatusEnum,
  assignStorageUnitSchema,
  type FacilityUnitTypeOfferingResponse,
  type ReservationResponse,
  type StorageUnitResponse,
} from "../types";
import { formatDateOnly, formatDateTime, formatRentalScheduleLabel, formatVnd } from "../utils";
import { ReservationStatusBadge } from "./ReservationStatusBadge";

interface AssignStorageUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: ReservationResponse | null;
  offerings: FacilityUnitTypeOfferingResponse[];
  onSwitchToReject?: (reservation: ReservationResponse) => void;
  onAssignedSuccess?: (updated: ReservationResponse) => void;
}

const HOLDING_HOUR_PRESETS = [12, 24, 48, 72] as const;

export const AssignStorageUnitModal: React.FC<AssignStorageUnitModalProps> = ({
  isOpen,
  onClose,
  reservation,
  offerings,
  onSwitchToReject,
  onAssignedSuccess,
}) => {
  const t = useTranslations("facilityManager.reservations.assignModal");
  const tErrors = useTranslations("facilityManager.reservations.errors");
  const locale = useLocale() === "en" ? "en" : "vi";
  const getErrorMessage = useApiErrorMessage();

  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [holdingHoursInput, setHoldingHoursInput] = useState<string>("24");
  const [notes, setNotes] = useState<string>(reservation?.notes ?? "");
  const [searchUnitNumber, setSearchUnitNumber] = useState<string>("");
  const [floorFilter, setFloorFilter] = useState<string>("");
  const [zoneFilter, setZoneFilter] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const assignMutation = useAssignStorageUnit();
  const receiveMutation = useReceiveReservation();

  const unitTypeId = reservation?.offering?.unitTypeId;
  const matchedOffering = useMemo(
    () =>
      offerings.find(
        (o) =>
          o.id === reservation?.facilityUnitTypeOfferingId ||
          (unitTypeId && o.unitType.id === unitTypeId)
      ),
    [offerings, reservation?.facilityUnitTypeOfferingId, unitTypeId]
  );

  const availableUnitsQuery = useAvailableStorageUnitsForAssignment(
    reservation?.facilityId,
    unitTypeId ? { unitTypeId } : undefined,
    isOpen && Boolean(reservation?.facilityId)
  );

  const allAvailableUnits = useMemo(
    () => availableUnitsQuery.data ?? [],
    [availableUnitsQuery.data]
  );

  // Extract distinct floors and zones from available units for quick filtering
  const distinctFloors = useMemo(() => {
    const set = new Set<number>();
    allAvailableUnits.forEach((u) => set.add(u.floor));
    return Array.from(set).sort((a, b) => a - b);
  }, [allAvailableUnits]);

  const distinctZones = useMemo(() => {
    const set = new Set<string>();
    allAvailableUnits.forEach((u) => {
      if (u.zone?.trim()) set.add(u.zone.trim());
    });
    return Array.from(set).sort();
  }, [allAvailableUnits]);

  const filteredUnits = useMemo(() => {
    return allAvailableUnits.filter((u) => {
      if (
        searchUnitNumber.trim() &&
        !u.unitNumber.toLowerCase().includes(searchUnitNumber.trim().toLowerCase())
      ) {
        return false;
      }
      if (floorFilter && u.floor !== Number(floorFilter)) {
        return false;
      }
      if (zoneFilter && (u.zone ?? "").toLowerCase() !== zoneFilter.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [allAvailableUnits, searchUnitNumber, floorFilter, zoneFilter]);

  const selectedUnit: StorageUnitResponse | undefined = useMemo(
    () => allAvailableUnits.find((u) => u.id === selectedUnitId),
    [allAvailableUnits, selectedUnitId]
  );

  const parsedHoldingHours = Number(holdingHoursInput);
  const validHoldingHours =
    Number.isInteger(parsedHoldingHours) && parsedHoldingHours >= 1 && parsedHoldingHours <= 168
      ? parsedHoldingHours
      : 24;

  const [baseTimestampMs] = useState(() => Date.now());

  const expectedExpiresAtIso = useMemo(() => {
    return new Date(baseTimestampMs + validHoldingHours * 3600_000).toISOString();
  }, [baseTimestampMs, validHoldingHours]);

  if (!reservation) return null;

  const isPending = assignMutation.isPending || receiveMutation.isPending;

  const handleMarkReceivedFirst = async () => {
    setErrorMsg(null);
    try {
      await receiveMutation.mutateAsync(reservation.id);
      setSuccessMsg(t("receiveSuccess"));
      setTimeout(() => setSuccessMsg(null), 2500);
    } catch (err: unknown) {
      setErrorMsg(
        getErrorMessage(err, {
          [MESSAGE_CODE.MESSAGE_CODE_301]: tErrors("statusChanged"),
        })
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const parsedHours = Number(holdingHoursInput);
    const candidatePayload = {
      storageUnitId: selectedUnitId,
      holdingHours: Number.isNaN(parsedHours) ? 0 : parsedHours,
      notes: notes.trim() ? notes.trim() : undefined,
    };

    const validation = assignStorageUnitSchema.safeParse(candidatePayload);
    if (!validation.success) {
      if (!selectedUnitId) {
        setErrorMsg(t("validation.unitRequired"));
        return;
      }
      if (!Number.isInteger(parsedHours) || parsedHours < 1 || parsedHours > 168) {
        setErrorMsg(t("validation.holdingHoursInvalid"));
        return;
      }
      setErrorMsg(validation.error.issues[0]?.message ?? t("validation.invalidInput"));
      return;
    }

    try {
      const updated = await assignMutation.mutateAsync({
        id: reservation.id,
        payload: validation.data,
      });
      setSuccessMsg(t("assignSuccess", { unitNumber: selectedUnit?.unitNumber ?? "" }));
      onAssignedSuccess?.(updated);
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: unknown) {
      if (err instanceof AppApiError) {
        if (err.messageCode === MESSAGE_CODE.MESSAGE_CODE_305) {
          setSelectedUnitId("");
          void availableUnitsQuery.refetch();
          setErrorMsg(tErrors("unitNotAvailableReloaded"));
          return;
        }
        if (err.messageCode === MESSAGE_CODE.MESSAGE_CODE_306) {
          setErrorMsg(tErrors("unitMismatch"));
          return;
        }
        if (err.messageCode === MESSAGE_CODE.MESSAGE_CODE_301) {
          setErrorMsg(tErrors("statusChanged"));
          return;
        }
      }
      setErrorMsg(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0 rounded-3xl border-slate-100 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {t("title")}
                  </DialogTitle>
                  <span className="font-mono text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    {reservation.reservationCode}
                  </span>
                  <ReservationStatusBadge status={reservation.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{t("subtitle")}</p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer & Requested Package Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                {t("customerSection")}
              </div>
              <p className="text-sm font-bold text-slate-900">
                {reservation.customer?.name ?? "—"}
              </p>
              <p className="text-xs text-slate-600">
                {reservation.customer?.phoneNumber || reservation.customer?.email || "—"}
              </p>
              {reservation.notes && (
                <p className="text-xs text-slate-500 italic bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/60">
                  “{reservation.notes}”
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                {t("packageSection")}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-900">
                  {matchedOffering?.unitType.name ?? t("requestedUnitType")}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/70">
                  {t("depositLabel")}: {formatVnd(reservation.depositAmount)}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                {t("startDate")}:{" "}
                <strong className="text-slate-800">
                  {formatDateOnly(reservation.startDate, locale)}
                </strong>{" "}
                •{" "}
                <strong className="text-slate-800">
                  {formatRentalScheduleLabel(
                    reservation.rentalDuration,
                    reservation.billingUnit,
                    locale
                  )}
                </strong>
              </p>
              <p className="text-xs text-slate-500">
                {t("totalEstimated")}:{" "}
                <strong className="text-slate-800">{formatVnd(reservation.totalAmount)}</strong>
              </p>
            </div>
          </div>

          {/* Optional step 1 banner if status is PENDING */}
          {reservation.status === ReservationStatusEnum.PENDING && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-sky-50/80 border border-sky-200/80">
              <div className="flex items-start gap-2.5 text-xs text-sky-800">
                <Inbox className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t("pendingReceiveHintTitle")}</p>
                  <p className="text-sky-700/90 mt-0.5">{t("pendingReceiveHintDesc")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleMarkReceivedFirst}
                disabled={isPending}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-sky-700 border border-sky-200 hover:bg-sky-100/70 transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {receiveMutation.isPending ? t("receiving") : t("markReceivedBtn")}
              </button>
            </div>
          )}

          {/* Available Storage Units Selector */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  {t("selectUnitLabel")} *
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t("availableCount", { count: filteredUnits.length })}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search unitNumber */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchUnitNumber}
                    onChange={(e) => setSearchUnitNumber(e.target.value)}
                    placeholder={t("searchUnitPlaceholder")}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none w-36"
                  />
                </div>

                {/* Floor filter */}
                {distinctFloors.length > 0 && (
                  <select
                    value={floorFilter}
                    onChange={(e) => setFloorFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none"
                  >
                    <option value="">{t("allFloors")}</option>
                    {distinctFloors.map((f) => (
                      <option key={f} value={String(f)}>
                        {t("floorItem", { floor: f })}
                      </option>
                    ))}
                  </select>
                )}

                {/* Zone filter */}
                {distinctZones.length > 0 && (
                  <select
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none"
                  >
                    <option value="">{t("allZones")}</option>
                    {distinctZones.map((z) => (
                      <option key={z} value={z}>
                        {t("zoneItem", { zone: z })}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => availableUnitsQuery.refetch()}
                  disabled={availableUnitsQuery.isFetching}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 bg-slate-100 hover:bg-teal-50 rounded-xl transition-colors"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${availableUnitsQuery.isFetching ? "animate-spin" : ""}`}
                  />
                  {t("refreshUnits")}
                </button>
              </div>
            </div>

            {/* Units Grid */}
            {availableUnitsQuery.isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-24 rounded-2xl bg-slate-100 animate-pulse border border-slate-200/60"
                  />
                ))}
              </div>
            ) : allAvailableUnits.length === 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                <div>
                  <p className="text-sm font-bold text-amber-900">{t("noAvailableUnitsTitle")}</p>
                  <p className="text-xs text-amber-700 mt-1 max-w-md mx-auto">
                    {t("noAvailableUnitsDesc")}
                  </p>
                </div>
                {onSwitchToReject && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSwitchToReject(reservation);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
                  >
                    {t("switchToRejectBtn")}
                  </button>
                )}
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">
                {t("noFilteredUnits")}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                {filteredUnits.map((unit) => {
                  const isSelected = selectedUnitId === unit.id;
                  const dims = unit.unitType?.dimensions;
                  return (
                    <button
                      key={unit.id}
                      type="button"
                      onClick={() => {
                        setSelectedUnitId(unit.id);
                        setErrorMsg(null);
                      }}
                      className={`text-left p-3.5 rounded-2xl border transition-all relative ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-sm"
                          : "border-slate-200/80 bg-white hover:border-teal-300 hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-extrabold text-slate-900">
                          {unit.unitNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200/70"
                          }`}
                        >
                          {isSelected ? t("selectedBadge") : t("availableBadge")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1 font-semibold">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {t("floorItem", { floor: unit.floor })}
                        </span>
                        {unit.zone && (
                          <span className="inline-flex items-center gap-1 font-semibold">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {t("zoneItem", { zone: unit.zone })}
                          </span>
                        )}
                      </div>

                      {unit.unitType && (
                        <p className="text-[11px] text-slate-500 mt-1.5 truncate">
                          {unit.unitType.name} • {unit.unitType.area} m²
                          {dims ? ` (${dims.length}×${dims.width}×${dims.height}m)` : ""}
                        </p>
                      )}

                      {unit.notes && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                          {unit.notes}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Holding Hours & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t("holdingHoursLabel")} *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={holdingHoursInput}
                  onChange={(e) => setHoldingHoursInput(e.target.value)}
                  className="w-28 bg-slate-50 focus:bg-white text-sm font-bold text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {HOLDING_HOUR_PRESETS.map((preset) => {
                    const active = Number(holdingHoursInput) === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setHoldingHoursInput(String(preset))}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          active
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-teal-300"
                        }`}
                      >
                        {preset}h
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/70">
                <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>
                  {t("expectedExpiresAt")}:{" "}
                  <strong className="text-slate-800">
                    {formatDateTime(expectedExpiresAtIso, locale)}
                  </strong>
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {t("notesLabel")}
              </label>
              <textarea
                rows={3}
                maxLength={1000}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("notesPlaceholder")}
                className="w-full bg-slate-50 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 px-3.5 py-2 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
              />
            </div>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending || !selectedUnitId || allAvailableUnits.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" />
              {assignMutation.isPending ? t("submitting") : t("submitBtn")}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
