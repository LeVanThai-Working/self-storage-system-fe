"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Layers,
  Search,
  SlidersHorizontal,
  RotateCw,
  Boxes,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Snowflake,
  Lock,
  Box,
  Package,
  Ruler,
  Maximize2,
  Sparkles,
  Eye,
  RotateCcw,
  X,
} from "lucide-react";
import { useUnitTypes, useRestoreUnitType } from "../hooks";
import { UnitTypeCategoryEnum, UnitTypeStatusEnum, type UnitTypeItem } from "../types";
import { CreateUnitTypeModal } from "./CreateUnitTypeModal";
import { UnitTypeDetailModal } from "./UnitTypeDetailModal";
import { EditUnitTypeModal } from "./EditUnitTypeModal";
import { DeleteUnitTypeModal } from "./DeleteUnitTypeModal";

export const UnitTypeTable = () => {
  const t = useTranslations("businessOps.unitTypes");
  const restoreMutation = useRestoreUnitType();

  // Query state
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "area" | "volume">("createdAt");
  const [sortOrder] = useState<"asc" | "desc">("desc");

  // Modal & Undo states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [detailUnitTypeId, setDetailUnitTypeId] = useState<string | null>(null);
  const [editingUnitTypeId, setEditingUnitTypeId] = useState<string | null>(null);
  const [deletingUnitType, setDeletingUnitType] = useState<{ id: string; name: string } | null>(
    null
  );
  const [lastDeletedUnitType, setLastDeletedUnitType] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [undoBannerVisible, setUndoBannerVisible] = useState<boolean>(false);

  // Auto-dismiss undo banner after 6 seconds
  useEffect(() => {
    if (undoBannerVisible) {
      const timer = setTimeout(() => {
        setUndoBannerVisible(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [undoBannerVisible]);

  const handleUndoRestore = async () => {
    if (!lastDeletedUnitType) return;
    try {
      await restoreMutation.mutateAsync(lastDeletedUnitType.id);
      setUndoBannerVisible(false);
    } catch {
      // Error handled by react-query
    }
  };

  // Debounce search input
  const [, startTransition] = useTransition();
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    startTransition(() => {
      setDebouncedSearch(val);
      setPage(1);
    });
  };

  // Fetch unit types via TanStack Query
  const { data, isLoading, isFetching, refetch } = useUnitTypes({
    page,
    limit: pageSize,
    sortBy,
    sortOrder,
    search: debouncedSearch || undefined,
    category: selectedCategory !== "ALL" ? selectedCategory : undefined,
    status: selectedStatus !== "ALL" ? selectedStatus : undefined,
  });

  const unitTypes = data?.items || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: pageSize,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Helper: Format category badge
  const renderCategoryBadge = (category: string) => {
    switch (category) {
      case UnitTypeCategoryEnum.CLIMATE_CONTROLLED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/70">
            <Snowflake className="w-3 h-3 text-cyan-600" />
            {t("categoryFilter.climate_controlled")}
          </span>
        );
      case UnitTypeCategoryEnum.LOCKER:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
            <Lock className="w-3 h-3 text-indigo-600" />
            {t("categoryFilter.locker")}
          </span>
        );
      case UnitTypeCategoryEnum.SMALL:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <Box className="w-3 h-3 text-emerald-600" />
            {t("categoryFilter.small")}
          </span>
        );
      case UnitTypeCategoryEnum.MEDIUM:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
            <Package className="w-3 h-3 text-amber-600" />
            {t("categoryFilter.medium")}
          </span>
        );
      case UnitTypeCategoryEnum.LARGE:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/70">
            <Boxes className="w-3 h-3 text-purple-600" />
            {t("categoryFilter.large")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {category}
          </span>
        );
    }
  };

  // Helper: Status badge
  const renderStatusBadge = (status: string) => {
    const isActive = status === UnitTypeStatusEnum.ACTIVE;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isActive
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
            : "bg-slate-100 text-slate-600 border border-slate-200"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
          }`}
        />
        {isActive ? t("status.active") : t("status.inactive")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            {t("title")}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t("subtitle")}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          {t("addUnitType")}
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Unit Types */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("stats.total")}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{pagination.totalItems}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Active Unit Types */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("stats.active")}
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {unitTypes.filter((u: UnitTypeItem) => u.status === UnitTypeStatusEnum.ACTIVE).length}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Inactive Unit Types */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("stats.inactive")}
            </p>
            <p className="text-2xl font-black text-slate-500 mt-1">
              {
                unitTypes.filter((u: UnitTypeItem) => u.status === UnitTypeStatusEnum.INACTIVE)
                  .length
              }
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Categories Count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("stats.categories")}
            </p>
            <p className="text-2xl font-black text-orange-600 mt-1">5</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
            <Boxes className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">{t("categoryFilter.all")}</option>
              <option value={UnitTypeCategoryEnum.LOCKER}>{t("categoryFilter.locker")}</option>
              <option value={UnitTypeCategoryEnum.SMALL}>{t("categoryFilter.small")}</option>
              <option value={UnitTypeCategoryEnum.MEDIUM}>{t("categoryFilter.medium")}</option>
              <option value={UnitTypeCategoryEnum.LARGE}>{t("categoryFilter.large")}</option>
              <option value={UnitTypeCategoryEnum.CLIMATE_CONTROLLED}>
                {t("categoryFilter.climate_controlled")}
              </option>
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
            <option value={UnitTypeStatusEnum.ACTIVE}>{t("statusFilter.active")}</option>
            <option value={UnitTypeStatusEnum.INACTIVE}>{t("statusFilter.inactive")}</option>
          </select>

          {/* Sort By Filter */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as "createdAt" | "name" | "area" | "volume");
              setPage(1);
            }}
            className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
          >
            <option value="createdAt">{t("sortBy.createdAt")}</option>
            <option value="name">{t("sortBy.name")}</option>
            <option value="area">{t("sortBy.area")}</option>
            <option value="volume">{t("sortBy.volume")}</option>
          </select>

          {/* Refresh Button */}
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

      {/* Unit Types Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">{t("table.name")}</th>
                <th className="py-4 px-6">{t("table.category")}</th>
                <th className="py-4 px-6">{t("table.dimensions")}</th>
                <th className="py-4 px-6">{t("table.metrics")}</th>
                <th className="py-4 px-6">{t("table.features")}</th>
                <th className="py-4 px-6">{t("table.status")}</th>
                <th className="py-4 px-6 text-right">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-36 mb-1.5" />
                      <div className="h-3 bg-slate-50 rounded-md w-24" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-5 bg-slate-100 rounded-full w-24" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-28" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-24" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-20" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-5 bg-slate-100 rounded-full w-20" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="h-8 bg-slate-100 rounded-lg w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : unitTypes.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Layers className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">{t("empty.title")}</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {t("empty.description")}
                    </p>
                  </td>
                </tr>
              ) : (
                // Data Rows
                unitTypes.map((unitType: UnitTypeItem) => (
                  <tr
                    key={unitType.id}
                    className="hover:bg-slate-50/70 transition-colors duration-150 group"
                  >
                    {/* Name & Description */}
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-teal-50 group-hover:text-teal-600 text-slate-500 flex items-center justify-center flex-shrink-0 transition-colors">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                            {unitType.name}
                          </div>
                          {unitType.description && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xs">
                              {unitType.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6">{renderCategoryBadge(unitType.category)}</td>

                    {/* Dimensions (D x R x C) */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-mono font-medium">
                        <Ruler className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>
                          {unitType.dimensions?.length ?? 0}m × {unitType.dimensions?.width ?? 0}m ×{" "}
                          {unitType.dimensions?.height ?? 0}m
                        </span>
                      </div>
                    </td>

                    {/* Metrics (Area & Volume) */}
                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                          <Maximize2 className="w-3 h-3 text-teal-600" />
                          <span>{unitType.area ?? 0} m²</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {unitType.volume ?? 0} m³
                        </div>
                      </div>
                    </td>

                    {/* Features */}
                    <td className="py-4 px-6">
                      {unitType.features && unitType.features.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {unitType.features.slice(0, 2).map((feat, idx) => (
                            <span
                              key={idx}
                              className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                            >
                              {feat}
                            </span>
                          ))}
                          {unitType.features.length > 2 && (
                            <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md">
                              +{unitType.features.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">{renderStatusBadge(unitType.status)}</td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {/* View Details Button (GET /unit-types/{id}) */}
                        <button
                          type="button"
                          onClick={() => setDetailUnitTypeId(unitType.id)}
                          title={t("actions.viewDetails")}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => setEditingUnitTypeId(unitType.id)}
                          title={t("actions.edit")}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Delete / Deactivate Button (Active) */}
                        {unitType.status === UnitTypeStatusEnum.ACTIVE && (
                          <button
                            type="button"
                            onClick={() =>
                              setDeletingUnitType({ id: unitType.id, name: unitType.name })
                            }
                            title={t("actions.delete")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Restore Button (Inactive) */}
                        {unitType.status === UnitTypeStatusEnum.INACTIVE && (
                          <button
                            type="button"
                            onClick={() => restoreMutation.mutate(unitType.id)}
                            disabled={restoreMutation.isPending}
                            title={t("actions.restore")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && unitTypes.length > 0 && (
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
              {t("pagination.unitTypes")}
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

      {/* Modal: Create Unit Type (POST /unit-types) */}
      <CreateUnitTypeModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {/* Modal: View Unit Type Details (GET /unit-types/{id}) */}
      {detailUnitTypeId && (
        <UnitTypeDetailModal
          key={detailUnitTypeId}
          unitTypeId={detailUnitTypeId}
          isOpen={Boolean(detailUnitTypeId)}
          onClose={() => setDetailUnitTypeId(null)}
        />
      )}

      {/* Modal: Edit Unit Type (GET /unit-types/{id} & PATCH /unit-types/{id}) */}
      {editingUnitTypeId && (
        <EditUnitTypeModal
          key={editingUnitTypeId}
          unitTypeId={editingUnitTypeId}
          isOpen={Boolean(editingUnitTypeId)}
          onClose={() => setEditingUnitTypeId(null)}
        />
      )}

      {/* Modal: Delete Confirmation (DELETE /unit-types/{id}) */}
      {deletingUnitType && (
        <DeleteUnitTypeModal
          key={deletingUnitType.id}
          unitType={deletingUnitType}
          isOpen={Boolean(deletingUnitType)}
          onClose={() => setDeletingUnitType(null)}
          onDeleted={(deleted) => {
            setLastDeletedUnitType(deleted);
            setUndoBannerVisible(true);
          }}
        />
      )}

      {/* Floating Dark Undo Banner (After Soft Delete) */}
      {undoBannerVisible && lastDeletedUnitType && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4 bg-slate-900/95 backdrop-blur-md text-white py-3 px-5 rounded-2xl shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-200">
              {t("deleteModal.success")} (
              <strong className="text-white">{lastDeletedUnitType.name}</strong>)
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
