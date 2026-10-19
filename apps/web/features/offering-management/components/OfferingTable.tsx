"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Search,
  X,
  Building2,
  Box,
  CheckCircle2,
  MapPin,
  Calendar,
  Layers,
  ArrowUpDown,
  Eye,
  Zap,
} from "lucide-react";
import { useFacilities } from "@/features/facility-management/hooks";
import { useUnitTypes } from "@/features/unit-type-management/hooks";
import { useOfferings } from "../hooks";
import {
  BillingUnitEnum,
  FacilityUnitTypeOfferingStatusEnum,
  type FacilityUnitTypeOfferingResponse,
} from "../types";
import { OfferingFormModal } from "./OfferingFormModal";
import { OfferingDetailModal } from "./OfferingDetailModal";
import { OfferingLookupModal } from "./OfferingLookupModal";
import { ConfirmOfferingModal } from "./ConfirmOfferingModal";

/**
 * Chuẩn hóa chuỗi tiếng Việt để tìm kiếm không phân biệt dấu và chữ hoa/thường
 */
const normalizeVi = (str?: string | null): string => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
};

export const OfferingTable = () => {
  const t = useTranslations("businessOps.offerings");

  // Query states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [facilityId, setFacilityId] = useState("ALL");
  const [unitTypeId, setUnitTypeId] = useState("ALL");
  const [billingUnit, setBillingUnit] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<string>("createdAtDesc");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [presetFacilityId, setPresetFacilityId] = useState("");
  const [presetUnitTypeId, setPresetUnitTypeId] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<FacilityUnitTypeOfferingResponse | null>(null);
  const [restoring, setRestoring] = useState<FacilityUnitTypeOfferingResponse | null>(null);

  // Debounced search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleClearSearch = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchInput.trim());
    setPage(1);
  };

  // Determine sort parameter
  const getSortParams = (
    key: string
  ): {
    sortBy: "createdAt" | "updatedAt" | "pricePerUnit" | "minRentalDays";
    sortOrder: "asc" | "desc";
  } => {
    switch (key) {
      case "createdAtAsc":
        return { sortBy: "createdAt", sortOrder: "asc" };
      case "priceDesc":
        return { sortBy: "pricePerUnit", sortOrder: "desc" };
      case "priceAsc":
        return { sortBy: "pricePerUnit", sortOrder: "asc" };
      case "minDaysDesc":
        return { sortBy: "minRentalDays", sortOrder: "desc" };
      case "minDaysAsc":
        return { sortBy: "minRentalDays", sortOrder: "asc" };
      case "createdAtDesc":
      default:
        return { sortBy: "createdAt", sortOrder: "desc" };
    }
  };

  const { sortBy, sortOrder } = getSortParams(sortKey);

  // Fetch facilities & unit types for filters
  const { data: facilitiesData } = useFacilities({ limit: 100 });
  const { data: unitTypesData } = useUnitTypes({ limit: 100 });

  const isSearching = Boolean(debouncedSearch.trim());

  // Main Offerings query (GET /facility-unit-type-offerings)
  // Khi tìm kiếm: fetch với limit: 100 để đảm bảo client-side search bao quát toàn bộ danh sách,
  // đồng thời vẫn truyền param `search` cho BE (nếu BE sau này hỗ trợ server-side search)
  const { data, isLoading, isFetching, refetch } = useOfferings({
    page: isSearching ? 1 : page,
    limit: isSearching ? 100 : pageSize,
    sortBy,
    sortOrder,
    search: debouncedSearch.trim() || undefined,
    facilityId: facilityId !== "ALL" ? facilityId : undefined,
    unitTypeId: unitTypeId !== "ALL" ? unitTypeId : undefined,
    billingUnit: billingUnit !== "ALL" ? (billingUnit as BillingUnitEnum) : undefined,
    status: status !== "ALL" ? (status as FacilityUnitTypeOfferingStatusEnum) : undefined,
  });

  const rawOfferings = useMemo(() => data?.items || [], [data?.items]);

  // Lọc thông minh client-side theo từ khóa (hỗ trợ tiếng Việt không dấu, tìm theo tên cơ sở, địa chỉ, loại kho, danh mục, ghi chú)
  const filteredOfferings = useMemo(() => {
    const query = debouncedSearch.trim();
    if (!query) return rawOfferings;

    const terms = normalizeVi(query).split(/\s+/).filter(Boolean);
    return rawOfferings.filter((offering) => {
      const combined = normalizeVi(
        [
          offering.facility?.name,
          offering.facility?.address,
          offering.facility?.city,
          offering.unitType?.name,
          offering.unitType?.category,
          offering.notes,
          offering.billingUnit,
          String(offering.pricePerUnit),
        ]
          .filter(Boolean)
          .join(" ")
      );
      return terms.every((term) => combined.includes(term));
    });
  }, [rawOfferings, debouncedSearch]);

  // Phân trang dữ liệu hiển thị trên bảng
  const offerings = useMemo(() => {
    if (!isSearching) return rawOfferings;
    const startIndex = (page - 1) * pageSize;
    return filteredOfferings.slice(startIndex, startIndex + pageSize);
  }, [isSearching, rawOfferings, filteredOfferings, page, pageSize]);

  const totalFilteredCount = isSearching
    ? filteredOfferings.length
    : (data?.pagination?.totalItems ?? rawOfferings.length);

  const totalPagesCount = isSearching
    ? Math.max(1, Math.ceil(filteredOfferings.length / pageSize))
    : (data?.pagination?.totalPages ?? 1);

  const hasNextPage = isSearching ? page < totalPagesCount : Boolean(data?.pagination?.hasNextPage);

  const hasPrevPage = isSearching ? page > 1 : Boolean(data?.pagination?.hasPrevPage);

  // KPI Queries to get exact system-wide totals
  const { data: allOfferingsCountData } = useOfferings({ limit: 1 });
  const { data: activeCountData } = useOfferings({
    limit: 1,
    status: FacilityUnitTypeOfferingStatusEnum.ACTIVE,
  });
  const { data: inactiveCountData } = useOfferings({
    limit: 1,
    status: FacilityUnitTypeOfferingStatusEnum.INACTIVE,
  });

  const totalOfferings = allOfferingsCountData?.pagination?.totalItems ?? totalFilteredCount;
  const totalActive = activeCountData?.pagination?.totalItems ?? 0;
  const totalInactive = inactiveCountData?.pagination?.totalItems ?? 0;
  const totalFacilities =
    facilitiesData?.pagination?.totalItems ?? facilitiesData?.items?.length ?? 0;

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Tag className="w-5 h-5" />
            </div>
            {t("title")}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t("subtitle")}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsLookupOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold border border-slate-200/90 shadow-2xs transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            {t("quickLookup")}
          </button>

          <button
            type="button"
            onClick={() => {
              setPresetFacilityId("");
              setPresetUnitTypeId("");
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t("addOffering")}
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Offerings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("stats.total")}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalOfferings}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Active Offerings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("stats.active")}
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{totalActive}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Inactive Offerings */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("stats.inactive")}
            </p>
            <p className="text-2xl font-black text-slate-500 mt-1">{totalInactive}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        {/* Participating Facilities */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("stats.facilities")}
            </p>
            <p className="text-2xl font-black text-teal-600 mt-1">{totalFacilities}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Form with Search and Clear buttons */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 relative flex items-center min-w-[280px] max-w-md"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 pl-10 pr-24 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all duration-200"
            />
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchInput && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer"
                  title={t("clearSearch")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <span>{t("searchButton")}</span>
              </button>
            </div>
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Facility Filter */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={facilityId}
                onChange={(e) => {
                  setFacilityId(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 hover:bg-slate-100/70 text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer max-w-[200px] truncate"
              >
                <option value="ALL">{t("facilityFilter.all")}</option>
                {facilitiesData?.items.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Type Filter */}
            <div className="flex items-center gap-1.5">
              <Box className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={unitTypeId}
                onChange={(e) => {
                  setUnitTypeId(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 hover:bg-slate-100/70 text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer max-w-[180px] truncate"
              >
                <option value="ALL">{t("unitTypeFilter.all")}</option>
                {unitTypesData?.items.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Billing Unit Filter */}
            <select
              value={billingUnit}
              onChange={(e) => {
                setBillingUnit(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 hover:bg-slate-100/70 text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">{t("billingUnitFilter.all")}</option>
              <option value={BillingUnitEnum.MONTH}>{t("billingUnitFilter.month")}</option>
              <option value={BillingUnitEnum.DAY}>{t("billingUnitFilter.day")}</option>
              <option value={BillingUnitEnum.ONE_TIME}>{t("billingUnitFilter.one_time")}</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 hover:bg-slate-100/70 text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">{t("statusFilter.all")}</option>
              <option value={FacilityUnitTypeOfferingStatusEnum.ACTIVE}>
                {t("statusFilter.active")}
              </option>
              <option value={FacilityUnitTypeOfferingStatusEnum.INACTIVE}>
                {t("statusFilter.inactive")}
              </option>
            </select>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={sortKey}
                onChange={(e) => {
                  setSortKey(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 hover:bg-slate-100/70 text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
              >
                <option value="createdAtDesc">{t("sort.createdAtDesc")}</option>
                <option value="createdAtAsc">{t("sort.createdAtAsc")}</option>
                <option value="priceDesc">{t("sort.priceDesc")}</option>
                <option value="priceAsc">{t("sort.priceAsc")}</option>
                <option value="minDaysDesc">{t("sort.minDaysDesc")}</option>
                <option value="minDaysAsc">{t("sort.minDaysAsc")}</option>
              </select>
            </div>

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

        {/* Active Search Summary Banner */}
        {isSearching && (
          <div className="flex items-center justify-between bg-teal-50/70 border border-teal-200/60 rounded-xl px-3.5 py-2 text-xs text-teal-800">
            <div className="flex items-center gap-2 font-medium">
              <Search className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>
                {t("searchResultsCount", {
                  count: filteredOfferings.length,
                  query: debouncedSearch,
                })}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-teal-700 hover:text-teal-900 font-bold hover:underline cursor-pointer inline-flex items-center gap-1 shrink-0"
            >
              <X className="w-3 h-3" />
              {t("clearFilter")}
            </button>
          </div>
        )}
      </div>

      {/* Offerings Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">{t("table.facility")}</th>
                <th className="py-4 px-6">{t("table.unitType")}</th>
                <th className="py-4 px-6">{t("table.price")}</th>
                <th className="py-4 px-6">{t("table.deposit")}</th>
                <th className="py-4 px-6">{t("table.minRentalDays")}</th>
                <th className="py-4 px-6">{t("table.status")}</th>
                <th className="py-4 px-6 text-right">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-4 px-6" colSpan={7}>
                      <div className="h-4 bg-slate-100 rounded-md w-full" />
                    </td>
                  </tr>
                ))
              ) : offerings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
                      {isSearching ? <Search className="w-8 h-8" /> : <Tag className="w-8 h-8" />}
                    </div>
                    <h3 className="text-base font-bold text-slate-800">
                      {isSearching ? t("emptySearch.title") : t("empty.title")}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {isSearching
                        ? t("emptySearch.description", { query: debouncedSearch })
                        : t("empty.description")}
                    </p>
                    {isSearching && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        {t("clearFilter")}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                offerings.map((offering) => {
                  const depositAmount = offering.pricePerUnit * offering.depositMultiplier;
                  const dimensions = offering.unitType.dimensions;

                  return (
                    <tr key={offering.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Facility Column */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                          {offering.facility.name}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span className="truncate max-w-[220px]">
                            {offering.facility.address ? `${offering.facility.address}, ` : ""}
                            {offering.facility.city}
                          </span>
                        </div>
                      </td>

                      {/* Unit Type Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{offering.unitType.name}</span>
                          {offering.unitType.category && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">
                              {offering.unitType.category}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-slate-700">
                            {offering.unitType.area} m²
                          </span>
                          <span className="text-slate-300">•</span>
                          <span>{offering.unitType.volume} m³</span>
                          {dimensions && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400 text-[11px]">
                                ({dimensions.length}×{dimensions.width}×{dimensions.height}m)
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Price Column */}
                      <td className="py-4 px-6">
                        <div className="font-black text-slate-900">
                          {formatPrice(offering.pricePerUnit)}
                        </div>
                        <div className="text-xs text-slate-400">
                          /{t(`billingUnit.${offering.billingUnit}`)}
                        </div>
                      </td>

                      {/* Deposit Column */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                          {offering.depositMultiplier}x
                        </span>
                        {depositAmount > 0 && (
                          <div className="text-xs text-slate-500 mt-1">
                            ≈ {formatPrice(depositAmount)}
                          </div>
                        )}
                      </td>

                      {/* Min Rental Days Column */}
                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1 text-slate-700 font-semibold text-xs bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{offering.minRentalDays} ngày</span>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            offering.status === FacilityUnitTypeOfferingStatusEnum.ACTIVE
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              offering.status === FacilityUnitTypeOfferingStatusEnum.ACTIVE
                                ? "bg-emerald-500 animate-pulse"
                                : "bg-slate-400"
                            }`}
                          />
                          {offering.status === FacilityUnitTypeOfferingStatusEnum.ACTIVE
                            ? t("status.active")
                            : t("status.inactive")}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setViewingId(offering.id)}
                            title={t("actions.view")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(offering.id)}
                            title={t("actions.edit")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {offering.status === FacilityUnitTypeOfferingStatusEnum.INACTIVE ? (
                            <button
                              type="button"
                              onClick={() => setRestoring(offering)}
                              title={t("actions.restore")}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleting(offering)}
                              title={t("actions.delete")}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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
        {!isLoading && offerings.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              {t("pagination.page")} <span className="font-bold text-slate-800">{page}</span> /{" "}
              {totalPagesCount}
              <span className="text-slate-400 ml-2">(Tổng cộng {totalFilteredCount} bảng giá)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!hasPrevPage || isFetching}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {t("pagination.prev")}
              </button>
              <button
                type="button"
                disabled={!hasNextPage || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
              >
                {t("pagination.next")}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal (API 2: POST /facility-unit-type-offerings) */}
      <OfferingFormModal
        offeringId={null}
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setPresetFacilityId("");
          setPresetUnitTypeId("");
        }}
        presetFacilityId={presetFacilityId}
        presetUnitTypeId={presetUnitTypeId}
      />

      {/* Quick Lookup Modal (API: GET /facility-unit-type-offerings/facility/{f}/unit-type/{u}) */}
      <OfferingLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onViewDetail={(id) => setViewingId(id)}
        onEdit={(id) => setEditingId(id)}
        onCreateWithPreset={(fId, uId) => {
          setPresetFacilityId(fId);
          setPresetUnitTypeId(uId);
          setIsCreateOpen(true);
        }}
      />

      {/* Detail Modal (API 3: GET /facility-unit-type-offerings/{id}) */}
      <OfferingDetailModal
        offeringId={viewingId}
        onClose={() => setViewingId(null)}
        onEdit={(id) => {
          setViewingId(null);
          setEditingId(id);
        }}
        onDelete={(offering) => {
          setViewingId(null);
          setDeleting(offering);
        }}
        onRestore={(offering) => {
          setViewingId(null);
          setRestoring(offering);
        }}
      />

      {/* Edit Modal (API 3 GET {id} để điền sẵn + API 4 PATCH {id}) */}
      <OfferingFormModal
        offeringId={editingId}
        isOpen={Boolean(editingId)}
        onClose={() => setEditingId(null)}
      />

      {/* Delete Confirmation Modal (API 5: DELETE) */}
      <ConfirmOfferingModal mode="delete" offering={deleting} onClose={() => setDeleting(null)} />

      {/* Restore Confirmation Modal (API 6: POST restore) */}
      <ConfirmOfferingModal
        mode="restore"
        offering={restoring}
        onClose={() => setRestoring(null)}
      />
    </div>
  );
};
