"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  Lock,
  MapPin,
  Pencil,
  RotateCcw,
  RotateCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { UnitStatusBadge } from "@/components/common/UnitStatusBadge";
import { DimensionBadge } from "@/components/common/DimensionBadge";
import { useApiErrorMessage } from "@/features/auth/error-message";
import {
  useDebouncedValue,
  useFacilityOfferings,
  useMyFacility,
  useRestoreStorageUnit,
  useStorageUnits,
  useStorageUnitStats,
} from "../hooks";
import {
  StorageUnitStatusEnum,
  isUnitLocked,
  type StorageUnitResponse,
  type StorageUnitSortBy,
} from "../types";
import { StorageUnitFormModal } from "./StorageUnitFormModal";
import { DeleteStorageUnitModal } from "./DeleteStorageUnitModal";

const PAGE_SIZE = 10;

const FILTER_CONTROL =
  "bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

export const StorageUnitTable = () => {
  const t = useTranslations("facilityManager.storageUnits");
  const getErrorMessage = useApiErrorMessage();

  // Facility the logged-in manager is responsible for
  const facilityQuery = useMyFacility();
  const facility = facilityQuery.data;
  const facilityId = facility?.id;

  // Query state
  const [searchInput, setSearchInput] = useState<string>("");
  const [floorInput, setFloorInput] = useState<string>("");
  const [zoneInput, setZoneInput] = useState<string>("");
  const [unitTypeId, setUnitTypeId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<StorageUnitSortBy>("createdAt");

  const debouncedSearch = useDebouncedValue(searchInput.trim());
  const debouncedFloor = useDebouncedValue(floorInput.trim());
  const debouncedZone = useDebouncedValue(zoneInput.trim());

  // The current page is only valid for the text filters it was chosen under, so a new
  // search/floor/zone value automatically falls back to page 1.
  const textKey = `${debouncedSearch}|${debouncedFloor}|${debouncedZone}`;
  const [pageState, setPageState] = useState<{ page: number; textKey: string }>({
    page: 1,
    textKey,
  });
  const page = pageState.textKey === textKey ? pageState.page : 1;
  const setPage = (next: number | ((prev: number) => number)) =>
    setPageState((prev) => {
      const current = prev.textKey === textKey ? prev.page : 1;
      return { textKey, page: typeof next === "function" ? next(current) : next };
    });

  const floorNumber = Number(debouncedFloor);
  const floorFilter =
    debouncedFloor && Number.isInteger(floorNumber) && floorNumber >= 1 ? floorNumber : undefined;

  // Modal & Undo states
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [editingUnit, setEditingUnit] = useState<StorageUnitResponse | null>(null);
  const [deletingUnit, setDeletingUnit] = useState<{ id: string; unitNumber: string } | null>(null);
  const [lastDeletedUnit, setLastDeletedUnit] = useState<{
    id: string;
    unitNumber: string;
  } | null>(null);
  const [undoBannerVisible, setUndoBannerVisible] = useState<boolean>(false);
  const [undoError, setUndoError] = useState<string | null>(null);
  const restoreMutation = useRestoreStorageUnit();

  // Auto-dismiss undo banner after 6 seconds
  useEffect(() => {
    if (undoBannerVisible) {
      const timer = setTimeout(() => setUndoBannerVisible(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [undoBannerVisible]);

  const handleUndoRestore = async () => {
    if (!lastDeletedUnit) return;
    setUndoError(null);
    try {
      await restoreMutation.mutateAsync(lastDeletedUnit.id);
      setUndoBannerVisible(false);
    } catch (err: unknown) {
      setUndoError(getErrorMessage(err));
    }
  };

  // Data
  const { data, isLoading, isFetching, isError, error, refetch } = useStorageUnits(facilityId, {
    page,
    limit: PAGE_SIZE,
    sortBy,
    unitNumber: debouncedSearch || undefined,
    floor: floorFilter,
    zone: debouncedZone || undefined,
    unitTypeId: unitTypeId !== "ALL" ? unitTypeId : undefined,
    status: selectedStatus !== "ALL" ? (selectedStatus as StorageUnitStatusEnum) : undefined,
  });
  const offeringsQuery = useFacilityOfferings(facilityId);
  const stats = useStorageUnitStats(facilityId);

  const offerings = offeringsQuery.data ?? [];
  const units = data?.items ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: PAGE_SIZE,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const hasActiveFilters =
    Boolean(searchInput || floorInput || zoneInput) ||
    unitTypeId !== "ALL" ||
    selectedStatus !== "ALL";

  const resetFilters = () => {
    setSearchInput("");
    setFloorInput("");
    setZoneInput("");
    setUnitTypeId("ALL");
    setSelectedStatus("ALL");
    setPage(1);
  };

  // ----- Facility not resolved yet / not assigned -----
  if (facilityQuery.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-2xl w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  if (facilityQuery.isError || !facility) {
    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm py-16 px-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
          <Boxes className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">{t("noFacility.title")}</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          {t("noFacility.description")}
        </p>
        <p className="text-[11px] text-rose-500 mt-3">{getErrorMessage(facilityQuery.error)}</p>
        <button
          type="button"
          onClick={() => facilityQuery.refetch()}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          {t("retry")}
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: t("stats.total"),
      value: stats.total,
      icon: Boxes,
      valueClass: "text-slate-900",
      iconBox: "bg-teal-50 text-teal-600",
    },
    {
      label: t("stats.available"),
      value: stats.available,
      icon: CheckCircle2,
      valueClass: "text-emerald-600",
      iconBox: "bg-emerald-50 text-emerald-600",
    },
    {
      label: t("stats.inUse"),
      value: stats.inUse,
      icon: Lock,
      valueClass: "text-rose-600",
      iconBox: "bg-rose-50 text-rose-600",
    },
    {
      label: t("stats.maintenance"),
      value: stats.maintenance,
      icon: Wrench,
      valueClass: "text-orange-600",
      iconBox: "bg-orange-50 text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Boxes className="w-5 h-5" />
            </div>
            {t("title")}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {t("subtitle", { facility: facility.name })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          {t("addUnit")}
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.label}
                </p>
                <p className={`text-2xl font-black mt-1 ${card.valueClass}`}>
                  {stats.isLoading ? "—" : card.value}
                </p>
              </div>
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center ${card.iconBox}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all duration-200"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />

          <input
            type="number"
            min={1}
            step={1}
            value={floorInput}
            onChange={(e) => setFloorInput(e.target.value)}
            placeholder={t("floorPlaceholder")}
            className={`${FILTER_CONTROL} w-24`}
          />

          <input
            type="text"
            value={zoneInput}
            onChange={(e) => setZoneInput(e.target.value)}
            placeholder={t("zonePlaceholder")}
            className={`${FILTER_CONTROL} w-28`}
          />

          <select
            value={unitTypeId}
            onChange={(e) => {
              setUnitTypeId(e.target.value);
              setPage(1);
            }}
            className={`${FILTER_CONTROL} cursor-pointer`}
          >
            <option value="ALL">{t("unitTypeFilterAll")}</option>
            {offerings.map((offering) => (
              <option key={offering.unitType.id} value={offering.unitType.id}>
                {offering.unitType.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className={`${FILTER_CONTROL} cursor-pointer`}
          >
            <option value="ALL">{t("statusFilter.all")}</option>
            {Object.values(StorageUnitStatusEnum).map((status) => (
              <option key={status} value={status}>
                {t(`statusFilter.${status}`)}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as StorageUnitSortBy);
              setPage(1);
            }}
            className={`${FILTER_CONTROL} cursor-pointer`}
          >
            <option value="createdAt">{t("sortBy.createdAt")}</option>
            <option value="unitNumber">{t("sortBy.unitNumber")}</option>
            <option value="floor">{t("sortBy.floor")}</option>
            <option value="status">{t("sortBy.status")}</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              {t("clearFilters")}
            </button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            title={t("refresh")}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isFetching ? "animate-spin text-teal-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Storage Units Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">{t("table.unit")}</th>
                <th className="py-4 px-6">{t("table.location")}</th>
                <th className="py-4 px-6">{t("table.unitType")}</th>
                <th className="py-4 px-6">{t("table.size")}</th>
                <th className="py-4 px-6">{t("table.status")}</th>
                <th className="py-4 px-6 text-right">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-24 mb-1.5" />
                      <div className="h-3 bg-slate-50 rounded-md w-32" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-28" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-28" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-24" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-5 bg-slate-100 rounded-full w-20" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="h-8 bg-slate-100 rounded-lg w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-400">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">{t("loadError.title")}</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {getErrorMessage(error)}
                    </p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      {t("retry")}
                    </button>
                  </td>
                </tr>
              ) : units.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Boxes className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      {hasActiveFilters ? t("empty.filteredTitle") : t("empty.title")}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {hasActiveFilters ? t("empty.filteredDescription") : t("empty.description")}
                    </p>
                  </td>
                </tr>
              ) : (
                units.map((unit: StorageUnitResponse) => {
                  const locked = isUnitLocked(unit.status);
                  return (
                    <tr
                      key={unit.id}
                      className="hover:bg-slate-50/70 transition-colors duration-150 group"
                    >
                      {/* Unit number & notes */}
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-teal-50 group-hover:text-teal-600 text-slate-500 flex items-center justify-center flex-shrink-0 transition-colors">
                            <DoorOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors font-mono">
                              {unit.unitNumber}
                            </div>
                            {unit.notes && (
                              <p
                                title={unit.notes}
                                className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xs"
                              >
                                {unit.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Floor / Zone */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>
                            {t("location.floor", { floor: unit.floor })}
                            {unit.zone ? ` · ${t("location.zone", { zone: unit.zone })}` : ""}
                          </span>
                        </div>
                      </td>

                      {/* Unit type */}
                      <td className="py-4 px-6">
                        <span className="text-xs font-semibold text-slate-800">
                          {unit.unitType?.name ?? "—"}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="py-4 px-6">
                        {unit.unitType ? (
                          <DimensionBadge
                            area={unit.unitType.area}
                            volume={unit.unitType.volume}
                            dimensions={unit.unitType.dimensions}
                          />
                        ) : (
                          <span className="text-xs text-slate-300 italic">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <UnitStatusBadge status={unit.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setEditingUnit(unit)}
                            title={t("actions.edit")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={locked}
                            onClick={() =>
                              setDeletingUnit({ id: unit.id, unitNumber: unit.unitNumber })
                            }
                            title={locked ? t("actions.deleteBlocked") : t("actions.delete")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && !isError && units.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              {t("pagination.showing")}{" "}
              <span className="font-bold text-slate-800">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              {t("pagination.to")}{" "}
              <span className="font-bold text-slate-800">
                {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
              </span>{" "}
              {t("pagination.of")}{" "}
              <span className="font-bold text-slate-800">{pagination.totalItems}</span>{" "}
              {t("pagination.units")}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage || isFetching}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {t("pagination.prev")}
              </button>

              <span className="px-3 py-1 font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200/50">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={!pagination.hasNextPage || isFetching}
                onClick={() => setPage((prev) => prev + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                {t("pagination.next")}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Create storage unit (POST /storage-units) */}
      {isCreateOpen && (
        <StorageUnitFormModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          facilityId={facility.id}
          offerings={offerings}
        />
      )}

      {/* Modal: Edit storage unit (PATCH /storage-units/{id}) */}
      {editingUnit && (
        <StorageUnitFormModal
          key={editingUnit.id}
          isOpen={Boolean(editingUnit)}
          onClose={() => setEditingUnit(null)}
          facilityId={facility.id}
          offerings={offerings}
          unit={editingUnit}
        />
      )}

      {/* Modal: Delete confirmation (DELETE /storage-units/{id}) */}
      {deletingUnit && (
        <DeleteStorageUnitModal
          key={deletingUnit.id}
          unit={deletingUnit}
          isOpen={Boolean(deletingUnit)}
          onClose={() => setDeletingUnit(null)}
          onDeleted={(deleted) => {
            setLastDeletedUnit(deleted);
            setUndoError(null);
            setUndoBannerVisible(true);
          }}
        />
      )}

      {/* Floating Dark Undo Banner (After Soft Delete) */}
      {undoBannerVisible && lastDeletedUnit && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-slate-900/95 backdrop-blur-md text-white py-3 px-5 rounded-2xl shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-200">
              {t("deleteModal.success")} (
              <strong className="text-white">{lastDeletedUnit.unitNumber}</strong>)
              {undoError && <span className="block text-rose-300 mt-0.5">{undoError}</span>}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={restoreMutation.isPending}
              onClick={handleUndoRestore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {restoreMutation.isPending ? t("deleteModal.restoring") : t("deleteModal.undo")}
            </button>

            <button
              type="button"
              onClick={() => setUndoBannerVisible(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
