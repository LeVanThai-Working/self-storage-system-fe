"use client";

import React, { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Building2,
  Search,
  RotateCcw,
  Plus,
  MapPin,
  Phone,
  Mail,
  Clock,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Edit3,
  Trash2,
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useFacilities, useRestoreFacility } from "../hooks";
import { FacilityResponse, FacilityStatusEnum } from "../types";
import { CreateFacilityModal } from "./CreateFacilityModal";
import { EditFacilityModal } from "./EditFacilityModal";
import { DeleteFacilityModal } from "./DeleteFacilityModal";
import { AssignManagerModal } from "./AssignManagerModal";

export const FacilityTable = () => {
  const t = useTranslations("businessOps.facilities");
  const [, startTransition] = useTransition();

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
  const [deletingFacility, setDeletingFacility] = useState<{ id: string; name: string } | null>(
    null
  );
  const [lastDeletedFacility, setLastDeletedFacility] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [assigningFacility, setAssigningFacility] = useState<FacilityResponse | null>(null);

  const restoreMutation = useRestoreFacility();

  // Query states
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Fetch data
  const { data, isLoading, isFetching, refetch } = useFacilities({
    page,
    limit: pageSize,
    search: debouncedSearch,
    city: selectedCity,
    status: selectedStatus,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const facilities: FacilityResponse[] = data?.items || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: pageSize,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Debounced search handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    startTransition(() => {
      setDebouncedSearch(val);
      setPage(1);
    });
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedCity("ALL");
    setSelectedStatus("ALL");
    setPage(1);
  };

  // Status Badge Component
  const renderStatusBadge = (status: FacilityStatusEnum | string) => {
    switch (status) {
      case FacilityStatusEnum.ACTIVE:
      case "active":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t("statuses.active")}
          </span>
        );
      case FacilityStatusEnum.INACTIVE:
      case "inactive":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {t("statuses.inactive")}
          </span>
        );
      case FacilityStatusEnum.CLOSED:
      case "closed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {t("statuses.closed")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Stats calculation
  const totalCount = pagination.totalItems;
  const activeCount = facilities.filter((f) => f.status === FacilityStatusEnum.ACTIVE).length;
  const inactiveCount = facilities.filter(
    (f) => f.status === FacilityStatusEnum.INACTIVE || f.status === FacilityStatusEnum.CLOSED
  ).length;

  const handleRestore = async (facilityId: string) => {
    try {
      await restoreMutation.mutateAsync(facilityId);
      setLastDeletedFacility(null);
    } catch (err) {
      console.warn("Restore facility error", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Undo Restore Banner (When a facility was recently deleted) */}
      {lastDeletedFacility && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium">
              Đã xóa cơ sở{" "}
              <span className="font-bold text-amber-300">{lastDeletedFacility.name}</span> thành
              công.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleRestore(lastDeletedFacility.id)}
              disabled={restoreMutation.isPending}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {restoreMutation.isPending ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              <span>
                {restoreMutation.isPending ? "Đang khôi phục..." : "Hoàn tác / Khôi phục"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLastDeletedFacility(null)}
              className="p-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-600 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t("title")}</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Action Button: Add Facility */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            {t("addFacility")}
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm shadow-slate-200/40 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              {t("stats.total")}
            </span>
            <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm shadow-slate-200/40 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 block mb-1">
              {t("stats.active")}
            </span>
            <div className="text-2xl font-black text-emerald-600">{activeCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm shadow-slate-200/40 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-orange-600 block mb-1">
              {t("stats.inactive")}
            </span>
            <div className="text-2xl font-black text-orange-600">{inactiveCount}</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-sm shadow-slate-200/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all duration-200"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* City Filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">{t("cityFilter.all")}</option>
              <option value="Hà Nội">{t("cityFilter.hanoi")}</option>
              <option value="Hồ Chí Minh">{t("cityFilter.hcm")}</option>
              <option value="Đà Nẵng">{t("cityFilter.danang")}</option>
              <option value="Bình Dương">{t("cityFilter.binhduong")}</option>
              <option value="Hải Phòng">{t("cityFilter.haiphong")}</option>
              <option value="Cần Thơ">{t("cityFilter.cantho")}</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
          >
            <option value="ALL">{t("statusFilter.all")}</option>
            <option value={FacilityStatusEnum.ACTIVE}>{t("statusFilter.active")}</option>
            <option value={FacilityStatusEnum.INACTIVE}>{t("statusFilter.inactive")}</option>
            <option value={FacilityStatusEnum.CLOSED}>{t("statusFilter.closed")}</option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => refetch()}
            title={t("refresh")}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-teal-600 transition-colors cursor-pointer"
          >
            <RotateCcw className={`w-4 h-4 ${isFetching ? "animate-spin text-teal-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Facilities Table */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm shadow-slate-200/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">{t("columns.facility")}</th>
                <th className="py-4 px-6">{t("columns.city")}</th>
                <th className="py-4 px-6">{t("columns.contact")}</th>
                <th className="py-4 px-6">{t("columns.operatingHours")}</th>
                <th className="py-4 px-6">{t("columns.status")}</th>
                <th className="py-4 px-6 text-right">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                          <div className="h-3 bg-slate-50 rounded-md w-1/2" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-24" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-28" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-20" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-6 bg-slate-100 rounded-full w-24" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="h-8 bg-slate-100 rounded-xl w-20 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : facilities.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto shadow-sm">
                        <Building2 className="w-8 h-8 stroke-[1.5]" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">{t("empty.title")}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {t("empty.description")}
                      </p>
                      {(searchInput || selectedCity !== "ALL" || selectedStatus !== "ALL") && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          {t("empty.clearFilter")}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Data rows
                facilities.map((facility) => {
                  const hours = facility.operatingHours;
                  const operatingHoursText =
                    hours?.open && hours?.close ? `${hours.open} - ${hours.close}` : "24/7";

                  return (
                    <tr key={facility.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Facility Name & Address */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500/15 to-emerald-500/15 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-200/50 shadow-xs">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 group-hover:text-teal-600 transition-colors truncate">
                              {facility.name}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{facility.address}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* City Badge */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          {facility.city}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-6">
                        <div className="space-y-1 text-xs">
                          {facility.phone ? (
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Phone className="w-3.5 h-3.5 text-teal-600" />
                              <span>{facility.phone}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Chưa có SĐT</span>
                          )}
                          {facility.email && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Mail className="w-3.5 h-3.5 text-orange-500" />
                              <span className="truncate max-w-[180px]">{facility.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Operating Hours */}
                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{operatingHoursText}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">{renderStatusBadge(facility.status)}</td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Assign Manager Action */}
                          <button
                            type="button"
                            onClick={() => setAssigningFacility(facility)}
                            title={t("actions.assignManager")}
                            className="p-2 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>

                          {/* Edit Action */}
                          <button
                            type="button"
                            onClick={() => setEditingFacilityId(facility.id)}
                            title={t("actions.edit")}
                            className="p-2 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete/Deactivate Action */}
                          <button
                            type="button"
                            onClick={() =>
                              setDeletingFacility({
                                id: facility.id,
                                name: facility.name,
                              })
                            }
                            title={t("actions.delete")}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

        {/* Pagination Bar */}
        {pagination.totalItems > 0 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              {t("pagination.showing")}{" "}
              <span className="font-bold text-slate-800">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              -{" "}
              <span className="font-bold text-slate-800">
                {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
              </span>{" "}
              {t("pagination.of")}{" "}
              <span className="font-bold text-slate-800">{pagination.totalItems}</span>{" "}
              {t("pagination.facilities")}
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

              <div className="px-3 py-1.5 text-xs font-bold text-teal-700 bg-teal-50 rounded-xl border border-teal-200/60">
                {pagination.page} / {pagination.totalPages || 1}
              </div>

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

      {/* Modal: Create New Facility */}
      <CreateFacilityModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {/* Modal: Edit Existing Facility (GET /facilities/{id} & PATCH /facilities/{id}) */}
      <EditFacilityModal
        facilityId={editingFacilityId}
        isOpen={Boolean(editingFacilityId)}
        onClose={() => setEditingFacilityId(null)}
      />

      {/* Modal: Delete Facility Confirmation (DELETE /facilities/{id}) */}
      <DeleteFacilityModal
        facility={deletingFacility}
        isOpen={Boolean(deletingFacility)}
        onClose={() => setDeletingFacility(null)}
        onDeleted={(f) => setLastDeletedFacility(f)}
      />

      {/* Modal: Assign Facility Manager (PATCH /facilities/{id}/assign-manager) */}
      <AssignManagerModal
        facility={assigningFacility}
        isOpen={Boolean(assigningFacility)}
        onClose={() => setAssigningFacility(null)}
      />
    </div>
  );
};
