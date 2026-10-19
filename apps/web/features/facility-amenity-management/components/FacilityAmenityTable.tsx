"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles,
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
  Package,
  CheckCircle2,
  MapPin,
  Layers,
  ArrowUpDown,
  Eye,
  Zap,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useFacilities } from "@/features/facility-management/hooks";
import { useAmenities } from "@/features/amenity-management/hooks";
import { useFacilityAmenityOfferings } from "../hooks";
import {
  BillingUnitEnum,
  FacilityAmenityOfferingStatusEnum,
  type FacilityAmenityOfferingResponse,
} from "../types";
import { FacilityAmenityFormModal } from "./FacilityAmenityFormModal";
import { FacilityAmenityDetailModal } from "./FacilityAmenityDetailModal";
import { FacilityAmenityLookupModal } from "./FacilityAmenityLookupModal";
import { ConfirmFacilityAmenityModal } from "./ConfirmFacilityAmenityModal";

/**
 * Chuẩn hóa chuỗi tiếng Việt để tìm kiếm không phân biệt dấu và hoa/thường
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

export const FacilityAmenityTable = () => {
  const t = useTranslations("businessOps.facilityAmenities");

  // Query states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [facilityId, setFacilityId] = useState("ALL");
  const [amenityId, setAmenityId] = useState("ALL");
  const [billingUnit, setBillingUnit] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK">("ALL");
  const [sortKey, setSortKey] = useState<string>("createdAtDesc");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [presetFacilityId, setPresetFacilityId] = useState("");
  const [presetAmenityId, setPresetAmenityId] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<FacilityAmenityOfferingResponse | null>(null);
  const [restoring, setRestoring] = useState<FacilityAmenityOfferingResponse | null>(null);

  // Debounce search input (350ms)
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
    sortBy:
      "pricePerUnit" | "totalQuantity" | "inUseQuantity" | "status" | "createdAt" | "updatedAt";
    sortOrder: "asc" | "desc";
  } => {
    switch (key) {
      case "createdAtAsc":
        return { sortBy: "createdAt", sortOrder: "asc" };
      case "priceDesc":
        return { sortBy: "pricePerUnit", sortOrder: "desc" };
      case "priceAsc":
        return { sortBy: "pricePerUnit", sortOrder: "asc" };
      case "totalQtyDesc":
        return { sortBy: "totalQuantity", sortOrder: "desc" };
      case "totalQtyAsc":
        return { sortBy: "totalQuantity", sortOrder: "asc" };
      case "inUseDesc":
        return { sortBy: "inUseQuantity", sortOrder: "desc" };
      case "createdAtDesc":
      default:
        return { sortBy: "createdAt", sortOrder: "desc" };
    }
  };

  const { sortBy, sortOrder } = getSortParams(sortKey);

  // Fetch facilities & amenities for dropdown filters
  const { data: facilitiesData } = useFacilities({ limit: 100 });
  const { data: amenitiesData } = useAmenities({ limit: 100 });

  const isSearching = Boolean(debouncedSearch.trim());

  // Main Query
  const { data, isLoading, isFetching, refetch } = useFacilityAmenityOfferings({
    page: isSearching || stockFilter !== "ALL" ? 1 : page,
    limit: isSearching || stockFilter !== "ALL" ? 100 : pageSize,
    sortBy,
    sortOrder,
    search: debouncedSearch.trim() || undefined,
    facilityId: facilityId !== "ALL" ? facilityId : undefined,
    amenityId: amenityId !== "ALL" ? amenityId : undefined,
    billingUnit: billingUnit !== "ALL" ? (billingUnit as BillingUnitEnum) : undefined,
    status: status !== "ALL" ? (status as FacilityAmenityOfferingStatusEnum) : undefined,
  });

  const rawOfferings = useMemo(() => data?.items || [], [data?.items]);

  // Client-side filtering (Search + Stock filter)
  const filteredOfferings = useMemo(() => {
    let result = rawOfferings;

    // Filter by Stock availability
    if (stockFilter === "IN_STOCK") {
      result = result.filter((item: FacilityAmenityOfferingResponse) => item.availableQuantity > 0);
    } else if (stockFilter === "OUT_OF_STOCK") {
      result = result.filter(
        (item: FacilityAmenityOfferingResponse) => item.availableQuantity === 0
      );
    }

    // Filter by search keyword
    const query = debouncedSearch.trim();
    if (!query) return result;

    const terms = normalizeVi(query).split(/\s+/).filter(Boolean);
    return result.filter((offering: FacilityAmenityOfferingResponse) => {
      const combined = normalizeVi(
        [
          offering.facility?.name,
          offering.facility?.address,
          offering.facility?.city,
          offering.amenity?.name,
          offering.amenity?.type,
          offering.amenity?.description,
          offering.notes,
          offering.billingUnit,
          String(offering.pricePerUnit),
          ...(offering.amenity?.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
      );
      return terms.every((term) => combined.includes(term));
    });
  }, [rawOfferings, debouncedSearch, stockFilter]);

  // Paginated offerings to display
  const offerings = useMemo(() => {
    if (!isSearching && stockFilter === "ALL") return rawOfferings;
    const startIndex = (page - 1) * pageSize;
    return filteredOfferings.slice(startIndex, startIndex + pageSize);
  }, [isSearching, stockFilter, rawOfferings, filteredOfferings, page, pageSize]);

  const totalFilteredCount =
    isSearching || stockFilter !== "ALL"
      ? filteredOfferings.length
      : (data?.pagination?.totalItems ?? rawOfferings.length);

  const totalPagesCount =
    isSearching || stockFilter !== "ALL"
      ? Math.max(1, Math.ceil(filteredOfferings.length / pageSize))
      : (data?.pagination?.totalPages ?? 1);

  const hasNextPage =
    isSearching || stockFilter !== "ALL"
      ? page < totalPagesCount
      : Boolean(data?.pagination?.hasNextPage);

  const hasPrevPage =
    isSearching || stockFilter !== "ALL" ? page > 1 : Boolean(data?.pagination?.hasPrevPage);

  // KPI Queries
  const { data: allCountData } = useFacilityAmenityOfferings({ limit: 1 });
  const { data: activeCountData } = useFacilityAmenityOfferings({
    limit: 1,
    status: FacilityAmenityOfferingStatusEnum.ACTIVE,
  });
  const { data: inactiveCountData } = useFacilityAmenityOfferings({
    limit: 1,
    status: FacilityAmenityOfferingStatusEnum.INACTIVE,
  });

  const totalOfferings = allCountData?.pagination?.totalItems ?? totalFilteredCount;
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
              <Sparkles className="w-5 h-5" />
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
              setPresetAmenityId("");
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
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("stats.total")}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalOfferings}</div>
          </div>
        </div>

        {/* Active Offerings */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("stats.active")}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalActive}</div>
          </div>
        </div>

        {/* Inactive Offerings */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("stats.inactive")}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalInactive}</div>
          </div>
        </div>

        {/* Total Facilities */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("stats.facilities")}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalFacilities}</div>
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
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 pl-10 pr-24 py-2.5 rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all duration-200"
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
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
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
                className="bg-slate-50 hover:bg-slate-100/70 text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer max-w-[190px] truncate"
              >
                <option value="ALL">{t("facilityFilter.all")}</option>
                {facilitiesData?.items.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amenity Filter */}
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={amenityId}
                onChange={(e) => {
                  setAmenityId(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-50 hover:bg-slate-100/70 text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer max-w-[180px] truncate"
              >
                <option value="ALL">{t("amenityFilter.all")}</option>
                {amenitiesData?.items.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
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
              className="bg-slate-50 hover:bg-slate-100/70 text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">{t("billingUnitFilter.all")}</option>
              <option value={BillingUnitEnum.MONTH}>{t("billingUnitFilter.month")}</option>
              <option value={BillingUnitEnum.DAY}>{t("billingUnitFilter.day")}</option>
              <option value={BillingUnitEnum.ONE_TIME}>{t("billingUnitFilter.one_time")}</option>
            </select>

            {/* Stock Availability Filter */}
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value as "ALL" | "IN_STOCK" | "OUT_OF_STOCK");
                setPage(1);
              }}
              className="bg-slate-50 hover:bg-slate-100/70 text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">{t("stockFilter.all")}</option>
              <option value="IN_STOCK">{t("stockFilter.inStock")}</option>
              <option value="OUT_OF_STOCK">{t("stockFilter.outOfStock")}</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 hover:bg-slate-100/70 text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">{t("statusFilter.all")}</option>
              <option value={FacilityAmenityOfferingStatusEnum.ACTIVE}>
                {t("statusFilter.active")}
              </option>
              <option value={FacilityAmenityOfferingStatusEnum.INACTIVE}>
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
                className="bg-slate-50 hover:bg-slate-100/70 text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer"
              >
                <option value="createdAtDesc">{t("sort.createdAtDesc")}</option>
                <option value="createdAtAsc">{t("sort.createdAtAsc")}</option>
                <option value="priceDesc">{t("sort.priceDesc")}</option>
                <option value="priceAsc">{t("sort.priceAsc")}</option>
                <option value="totalQtyDesc">{t("sort.totalQtyDesc")}</option>
                <option value="totalQtyAsc">{t("sort.totalQtyAsc")}</option>
                <option value="inUseDesc">{t("sort.inUseDesc")}</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => refetch()}
              title={t("refresh")}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
            >
              <RotateCw
                className={`w-4 h-4 ${isFetching ? "animate-spin text-emerald-600" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Active Search/Filter Summary Banner */}
        {(isSearching || stockFilter !== "ALL") && (
          <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/60 rounded-xl px-3.5 py-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-medium">
              <Search className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {t("searchResultsCount", {
                  count: filteredOfferings.length,
                  query: debouncedSearch || (stockFilter === "IN_STOCK" ? "Còn hàng" : "Hết hàng"),
                })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                handleClearSearch();
                setStockFilter("ALL");
              }}
              className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer inline-flex items-center gap-1 shrink-0"
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
                <th className="py-4 px-6">{t("table.amenity")}</th>
                <th className="py-4 px-6">{t("table.price")}</th>
                <th className="py-4 px-6">{t("table.inventory")}</th>
                <th className="py-4 px-6">{t("table.status")}</th>
                <th className="py-4 px-6 text-right">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-4 px-6" colSpan={6}>
                      <div className="h-4 bg-slate-100 rounded-md w-full" />
                    </td>
                  </tr>
                ))
              ) : offerings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
                      {isSearching ? (
                        <Search className="w-8 h-8" />
                      ) : (
                        <Sparkles className="w-8 h-8" />
                      )}
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
                offerings.map((offering: FacilityAmenityOfferingResponse) => {
                  const percentUsed =
                    offering.totalQuantity > 0
                      ? Math.round((offering.inUseQuantity / offering.totalQuantity) * 100)
                      : 0;

                  return (
                    <tr key={offering.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Facility Column */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
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

                      {/* Amenity Column */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{offering.amenity.name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">
                            {offering.amenity.type}
                          </span>
                        </div>
                        {offering.amenity.description && (
                          <div className="text-xs text-slate-400 mt-1 truncate max-w-[260px]">
                            {offering.amenity.description}
                          </div>
                        )}
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

                      {/* Inventory Column (totalQuantity, inUseQuantity, availableQuantity) */}
                      <td className="py-4 px-6 min-w-[200px]">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-slate-600 font-medium">
                            Khả dụng:{" "}
                            <b
                              className={
                                offering.availableQuantity === 0
                                  ? "text-rose-600 font-extrabold"
                                  : offering.availableQuantity <= 2
                                    ? "text-amber-600 font-extrabold"
                                    : "text-emerald-700 font-extrabold"
                              }
                            >
                              {offering.availableQuantity}
                            </b>
                            /{offering.totalQuantity}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Đang dùng: <b className="text-slate-700">{offering.inUseQuantity}</b>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                          <div
                            className="bg-amber-500 h-2"
                            style={{ width: `${percentUsed}%` }}
                            title={`Đang dùng: ${offering.inUseQuantity}`}
                          />
                          <div
                            className="bg-emerald-500 h-2"
                            style={{
                              width: `${
                                offering.totalQuantity > 0
                                  ? (offering.availableQuantity / offering.totalQuantity) * 100
                                  : 0
                              }%`,
                            }}
                            title={`Khả dụng: ${offering.availableQuantity}`}
                          />
                        </div>

                        {/* Stock Tag */}
                        <div className="mt-1.5">
                          {offering.availableQuantity === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-2.5 h-2.5" />
                              {t("stock.outOfStock")}
                            </span>
                          ) : offering.availableQuantity <= 2 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              {t("stock.lowStock")}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {t("stock.inStock")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            offering.status === FacilityAmenityOfferingStatusEnum.ACTIVE
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                              : "bg-slate-100 text-slate-600 border border-slate-200/80"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              offering.status === FacilityAmenityOfferingStatusEnum.ACTIVE
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {t(`status.${offering.status}`)}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingId(offering.id)}
                            title={t("actions.view")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(offering.id)}
                            title={t("actions.edit")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {offering.status === FacilityAmenityOfferingStatusEnum.INACTIVE ? (
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
              <span className="text-slate-400 ml-2">
                (Tổng cộng {totalFilteredCount} phân bổ tiện ích)
              </span>
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

      {/* Creation Modal (API: POST /facility-amenity-offerings) */}
      <FacilityAmenityFormModal
        offeringId={null}
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setPresetFacilityId("");
          setPresetAmenityId("");
        }}
        presetFacilityId={presetFacilityId}
        presetAmenityId={presetAmenityId}
      />

      {/* Quick Lookup Modal (API: GET .../facility/{f}/amenity/{a} & /available) */}
      <FacilityAmenityLookupModal
        isOpen={isLookupOpen}
        onClose={() => setIsLookupOpen(false)}
        onViewDetail={(id) => setViewingId(id)}
        onEdit={(id) => setEditingId(id)}
        onCreateWithPreset={(fId, aId) => {
          setPresetFacilityId(fId);
          setPresetAmenityId(aId);
          setIsCreateOpen(true);
        }}
      />

      {/* Detail Modal (API: GET /facility-amenity-offerings/{id}) */}
      <FacilityAmenityDetailModal
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

      {/* Edit Modal (API: PATCH /facility-amenity-offerings/{id}) */}
      <FacilityAmenityFormModal
        offeringId={editingId}
        isOpen={Boolean(editingId)}
        onClose={() => setEditingId(null)}
      />

      {/* Delete Confirmation Modal (API: DELETE /facility-amenity-offerings/{id}) */}
      <ConfirmFacilityAmenityModal
        mode="delete"
        offering={deleting}
        onClose={() => setDeleting(null)}
      />

      {/* Restore Confirmation Modal (API: POST /facility-amenity-offerings/{id}/restore) */}
      <ConfirmFacilityAmenityModal
        mode="restore"
        offering={restoring}
        onClose={() => setRestoring(null)}
      />
    </div>
  );
};
