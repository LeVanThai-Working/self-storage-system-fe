"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Boxes,
  CheckCircle2,
  Lock,
  Wrench,
  Search,
  RotateCw,
  XCircle,
  ChevronDown,
  ChevronUp,
  DoorOpen,
  Eye,
  Info,
  X,
  Layers,
  LayoutGrid,
  AlertCircle,
  Warehouse,
} from "lucide-react";
import {
  RoleEnum,
  StorageUnitStatusEnum,
  UnitTypeCategoryEnum,
  formatCurrency,
  type UnitTypeSnapshot,
} from "@self-storage-system-fe/shared";
import { useAuthStore } from "@/features/auth/store";
import { UnitStatusBadge } from "@/components/common/UnitStatusBadge";
import { DimensionBadge } from "@/components/common/DimensionBadge";
import { useFacility } from "../hooks";
import {
  useDebouncedValue,
  useFacilityMapLayout,
  useFacilityOfferings,
} from "@/features/storage-unit-management/hooks";
import { StorageUnitMapView } from "@/features/storage-unit-management/components/StorageUnitMapView";
import { RackStructureView } from "@/features/storage-rack/components/RackStructureView";
import type {
  FacilityUnitTypeOfferingResponse,
  StorageUnitResponse,
  StorageUnitSortBy,
} from "@/features/storage-unit-management/types";

const EMPTY_OFFERINGS: FacilityUnitTypeOfferingResponse[] = [];
const EMPTY_UNITS: StorageUnitResponse[] = [];

interface FacilityStorageUnitsViewProps {
  facilityId: string;
}

interface UnitGroup {
  unitType:
    | UnitTypeSnapshot
    | {
        id: string;
        name: string;
        category?: UnitTypeCategoryEnum | null;
        area?: number;
        volume?: number;
        dimensions?: { length: number; width: number; height: number } | null;
      };
  offeringPrice?: number;
  billingUnit?: string;
  units: StorageUnitResponse[];
}

export const FacilityStorageUnitsView: React.FC<FacilityStorageUnitsViewProps> = ({
  facilityId,
}) => {
  const locale = useLocale();
  const t = useTranslations("facilityManager.storageUnits");
  const currentUser = useAuthStore((state) => state.currentUser);
  const isFacilityManager =
    String(currentUser?.role ?? "").toLowerCase() === RoleEnum.FACILITY_MANAGER;

  // View mode: 'list' (grouped by unit type) or 'map' (interactive floor plan)
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Filter & Search states
  const [searchInput, setSearchInput] = useState<string>("");
  const [floorInput, setFloorInput] = useState<string>("");
  const [zoneInput, setZoneInput] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedUnitTypeId, setSelectedUnitTypeId] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<StorageUnitSortBy>("unitNumber");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Inspect detail modal state
  const [inspectUnit, setInspectUnit] = useState<StorageUnitResponse | null>(null);
  // Warehouse rack map modal state
  const [selectedRackUnit, setSelectedRackUnit] = useState<StorageUnitResponse | null>(null);

  const isWarehouseRackUnit = (unit?: StorageUnitResponse | null) => {
    if (!unit) return false;
    const cat = String(unit.unitType?.category ?? "").toLowerCase();
    return (
      unit.unitType?.category === UnitTypeCategoryEnum.WAREHOUSE_RACK ||
      cat === "warehouse_rack" ||
      cat === "warehouse"
    );
  };

  const debouncedSearch = useDebouncedValue(searchInput.trim());
  const debouncedFloor = useDebouncedValue(floorInput.trim());
  const debouncedZone = useDebouncedValue(zoneInput.trim());

  const floorNumber = Number(debouncedFloor);
  const floorFilter =
    debouncedFloor && Number.isInteger(floorNumber) && floorNumber >= 1 ? floorNumber : undefined;

  // Fetch Facility details
  const facilityQuery = useFacility(facilityId);
  const facility = facilityQuery.data;

  // Fetch all physical units of facility via GET /storage-units/facility/:facilityId/map-layout
  const mapLayoutQuery = useFacilityMapLayout(facilityId);
  const allUnits = mapLayoutQuery.data ?? EMPTY_UNITS;

  // Fetch Offerings for this facility (for price & billingUnit lookup only)
  const offeringsQuery = useFacilityOfferings(facilityId);
  const offerings = offeringsQuery.data ?? EMPTY_OFFERINGS;

  // Map offerings for quick price lookup by unitTypeId
  const offeringMap = useMemo(() => {
    const map = new Map<string, { pricePerUnit: number; billingUnit: string }>();
    offerings.forEach((off) => {
      if (off.unitType?.id) {
        map.set(off.unitType.id, {
          pricePerUnit: off.pricePerUnit,
          billingUnit: off.billingUnit,
        });
      }
    });
    return map;
  }, [offerings]);

  // Overall KPI stats based on all physical units of this facility
  const stats = useMemo(() => {
    const total = allUnits.length;
    const available = allUnits.filter((u) => u.status === StorageUnitStatusEnum.AVAILABLE).length;
    const occupied = allUnits.filter((u) => u.status === StorageUnitStatusEnum.OCCUPIED).length;
    const reserved = allUnits.filter((u) => u.status === StorageUnitStatusEnum.RESERVED).length;
    const maintenance = allUnits.filter(
      (u) => u.status === StorageUnitStatusEnum.UNDER_MAINTENANCE
    ).length;
    return {
      total,
      available,
      inUse: occupied + reserved,
      maintenance,
    };
  }, [allUnits]);

  // Available unit types present in this facility
  const availableUnitTypes = useMemo(() => {
    const typeMap = new Map<string, { id: string; name: string; count: number }>();
    allUnits.forEach((unit) => {
      const utId = unit.unitTypeId || unit.unitType?.id;
      const utName = unit.unitType?.name || (locale === "vi" ? "Chưa phân loại" : "Uncategorized");
      if (utId) {
        if (!typeMap.has(utId)) {
          typeMap.set(utId, { id: utId, name: utName, count: 0 });
        }
        typeMap.get(utId)!.count++;
      }
    });
    return Array.from(typeMap.values());
  }, [allUnits, locale]);

  const hasActiveSearchFilters = Boolean(
    searchInput ||
    floorInput ||
    zoneInput ||
    selectedStatus !== "ALL" ||
    selectedUnitTypeId !== "ALL"
  );

  // Filtered units according to current active filters
  const filteredUnits = useMemo(() => {
    return allUnits.filter((unit) => {
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase();
        const matchesNumber = unit.unitNumber.toLowerCase().includes(query);
        const matchesNotes = unit.notes?.toLowerCase().includes(query);
        if (!matchesNumber && !matchesNotes) return false;
      }
      if (floorFilter !== undefined && unit.floor !== floorFilter) {
        return false;
      }
      if (debouncedZone) {
        const z = (unit.zone ?? "").toLowerCase();
        if (!z.includes(debouncedZone.toLowerCase())) return false;
      }
      if (selectedStatus !== "ALL" && unit.status !== selectedStatus) {
        return false;
      }
      if (selectedUnitTypeId !== "ALL") {
        const utId = unit.unitTypeId || unit.unitType?.id;
        if (utId !== selectedUnitTypeId) return false;
      }
      return true;
    });
  }, [allUnits, debouncedSearch, floorFilter, debouncedZone, selectedStatus, selectedUnitTypeId]);

  // Sorted filtered units
  const sortedUnits = useMemo(() => {
    return [...filteredUnits].sort((a, b) => {
      if (sortBy === "floor") {
        return (
          a.floor - b.floor ||
          a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true })
        );
      }
      if (sortBy === "createdAt") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true });
    });
  }, [filteredUnits, sortBy]);

  // Group units by Unit Type (only groups with actual units)
  const groupedUnits = useMemo<UnitGroup[]>(() => {
    const groupMap = new Map<string, UnitGroup>();

    sortedUnits.forEach((unit) => {
      const utId = unit.unitTypeId || unit.unitType?.id || "unspecified";
      if (!groupMap.has(utId)) {
        const fallbackName = locale === "vi" ? "Chưa phân loại" : "Uncategorized";
        groupMap.set(utId, {
          unitType: unit.unitType ?? {
            id: utId,
            name: fallbackName,
            category: null,
            area: 0,
            volume: 0,
            dimensions: null,
          },
          offeringPrice: offeringMap.get(utId)?.pricePerUnit,
          billingUnit: offeringMap.get(utId)?.billingUnit,
          units: [],
        });
      }
      groupMap.get(utId)!.units.push(unit);
    });

    return Array.from(groupMap.values());
  }, [sortedUnits, offeringMap, locale]);

  const resetFilters = () => {
    setSearchInput("");
    setFloorInput("");
    setZoneInput("");
    setSelectedStatus("ALL");
    setSelectedUnitTypeId("ALL");
    setSortBy("unitNumber");
  };

  const toggleGroupCollapse = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // KPI stat cards
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

  if (facilityQuery.isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-6">
        <div className="h-6 bg-slate-200 rounded-lg w-48 mb-4" />
        <div className="h-28 bg-white rounded-3xl border border-slate-100 p-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-3xl border border-slate-100" />
      </div>
    );
  }

  if (facilityQuery.isError || !facility) {
    return (
      <div className="p-8 bg-white rounded-3xl border border-slate-100 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">
          {locale === "vi" ? "Không tìm thấy cơ sở lưu trữ" : "Facility Not Found"}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {locale === "vi"
            ? "Không thể tải thông tin cơ sở này. Vui lòng kiểm tra lại đường dẫn hoặc thử lại."
            : "Could not load facility details. Please check the URL or try again."}
        </p>
        <Link
          href={`/${locale}/business-ops/facilities`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === "vi" ? "Quay lại danh sách cơ sở" : "Back to facilities"}
        </Link>
      </div>
    );
  }

  const hours = facility.operatingHours;
  const operatingHoursText =
    hours?.open && hours?.close ? `${hours.open} - ${hours.close}` : "24/7";

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/business-ops/facilities`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          {locale === "vi" ? "Danh sách cơ sở" : "Facilities List"}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-semibold text-slate-500 truncate max-w-xs">
          {facility.name}
        </span>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200/60">
          {locale === "vi" ? "Danh sách ô kho theo loại" : "Storage Units by Unit Type"}
        </span>
      </div>

      {/* Facility Header Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          {facility.images && facility.images[0] ? (
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-slate-200/80 shadow-xs bg-slate-100">
              <Image
                src={facility.images[0]}
                alt={facility.name}
                fill
                sizes="64px"
                unoptimized
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500/20 to-emerald-500/20 text-teal-700 flex items-center justify-center font-bold text-xl shrink-0 border border-teal-200/60 shadow-xs">
              <Building2 className="w-8 h-8" />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {facility.code && (
                <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200 font-mono text-xs font-bold text-teal-800">
                  {facility.code}
                </span>
              )}
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {facility.name}
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                {facility.status === "active"
                  ? locale === "vi"
                    ? "Đang hoạt động"
                    : "Active"
                  : facility.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {facility.address}, {facility.city}
              </span>
              {facility.phone && (
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  {facility.phone}
                </span>
              )}
              {facility.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  {facility.email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {operatingHoursText}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions: View Mode toggle & Refresh */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center whitespace-nowrap shrink-0 gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{locale === "vi" ? "Danh sách" : "List"}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`inline-flex items-center whitespace-nowrap shrink-0 gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "map"
                  ? "bg-white text-slate-800 shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{locale === "vi" ? "Sơ đồ mặt bằng" : "Floor Plan"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => mapLayoutQuery.refetch()}
            disabled={mapLayoutQuery.isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${mapLayoutQuery.isFetching ? "animate-spin" : ""}`}
            />
            {t("refresh")}
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-xs flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-slate-400 font-medium">{card.label}</p>
                <p className={`text-2xl font-black mt-1 ${card.valueClass}`}>{card.value}</p>
              </div>
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconBox}`}
              >
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                locale === "vi"
                  ? "Tìm theo số ô kho, ghi chú..."
                  : "Search by unit number, notes..."
              }
              className="w-full bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Status, Floor, Zone */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">{t("statusFilter.all")}</option>
              <option value={StorageUnitStatusEnum.AVAILABLE}>{t("statusFilter.available")}</option>
              <option value={StorageUnitStatusEnum.OCCUPIED}>{t("statusFilter.occupied")}</option>
              <option value={StorageUnitStatusEnum.RESERVED}>{t("statusFilter.reserved")}</option>
              <option value={StorageUnitStatusEnum.UNDER_MAINTENANCE}>
                {t("statusFilter.under_maintenance")}
              </option>
              <option value={StorageUnitStatusEnum.PENDING_CLEARANCE}>
                {t("statusFilter.pending_clearance")}
              </option>
              <option value={StorageUnitStatusEnum.INACTIVE}>{t("statusFilter.inactive")}</option>
            </select>

            {/* Floor input */}
            <input
              type="number"
              min={1}
              value={floorInput}
              onChange={(e) => setFloorInput(e.target.value)}
              placeholder={t("floorPlaceholder")}
              className="w-20 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
            />

            {/* Zone input */}
            <input
              type="text"
              value={zoneInput}
              onChange={(e) => setZoneInput(e.target.value)}
              placeholder={t("zonePlaceholder")}
              className="w-24 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
            />

            {/* Sort by */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as StorageUnitSortBy)}
              className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="unitNumber">
                {locale === "vi" ? "Sắp xếp: Số phòng" : "Sort: Unit Number"}
              </option>
              <option value="floor">{locale === "vi" ? "Sắp xếp: Tầng" : "Sort: Floor"}</option>
              <option value="createdAt">
                {locale === "vi" ? "Sắp xếp: Mới nhất" : "Sort: Newest"}
              </option>
            </select>

            {/* Clear filters */}
            {hasActiveSearchFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                {t("clearFilters")}
              </button>
            )}
          </div>
        </div>

        {/* Unit Type Tab / Pills Selector */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>{locale === "vi" ? "Lọc nhanh theo loại kho:" : "Filter by Unit Type:"}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedUnitTypeId("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedUnitTypeId === "ALL"
                  ? "bg-teal-600 text-white shadow-sm shadow-teal-500/20"
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70"
              }`}
            >
              <span>{t("unitTypeFilterAll")}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  selectedUnitTypeId === "ALL"
                    ? "bg-teal-700 text-teal-100"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {allUnits.length}
              </span>
            </button>

            {availableUnitTypes.map((ut) => {
              const isSelected = selectedUnitTypeId === ut.id;

              return (
                <button
                  key={ut.id}
                  type="button"
                  onClick={() => setSelectedUnitTypeId(isSelected ? "ALL" : ut.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-teal-600 text-white shadow-sm shadow-teal-500/20"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70"
                  }`}
                >
                  <span className="truncate max-w-[150px]">{ut.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                      isSelected ? "bg-teal-700 text-teal-100" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {ut.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content: Map View or Grouped List */}
      {viewMode === "map" ? (
        <StorageUnitMapView
          units={filteredUnits}
          onSelectUnit={(unit) => setInspectUnit(unit)}
          selectedUnitId={inspectUnit?.id}
          isLoading={mapLayoutQuery.isLoading}
          isError={mapLayoutQuery.isError}
          error={mapLayoutQuery.error}
          hasActiveFilters={hasActiveSearchFilters}
          onRefresh={() => mapLayoutQuery.refetch()}
          isRefreshing={mapLayoutQuery.isFetching}
        />
      ) : mapLayoutQuery.isLoading ? (
        <div className="space-y-6 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-white rounded-3xl border border-slate-100 p-6" />
          ))}
        </div>
      ) : groupedUnits.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-3 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
            <Boxes className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {hasActiveSearchFilters ? t("empty.filteredTitle") : t("empty.title")}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {hasActiveSearchFilters ? t("empty.filteredDescription") : t("empty.description")}
          </p>
          {hasActiveSearchFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              {t("clearFilters")}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedUnits.map((group) => {
            const ut = group.unitType;
            const isCollapsed = Boolean(collapsedGroups[ut.id]);
            const totalUnits = group.units.length;
            const availableCount = group.units.filter(
              (u) => u.status === StorageUnitStatusEnum.AVAILABLE
            ).length;
            const inUseCount = group.units.filter(
              (u) =>
                u.status === StorageUnitStatusEnum.OCCUPIED ||
                u.status === StorageUnitStatusEnum.RESERVED
            ).length;
            const maintenanceCount = group.units.filter(
              (u) => u.status === StorageUnitStatusEnum.UNDER_MAINTENANCE
            ).length;

            return (
              <div
                key={ut.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Unit Type Section Header */}
                <div
                  onClick={() => toggleGroupCollapse(ut.id)}
                  className="p-5 bg-gradient-to-r from-slate-50/90 to-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start md:items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold shrink-0 border border-teal-200/50 shadow-xs">
                      {ut.category === UnitTypeCategoryEnum.WAREHOUSE_RACK ? (
                        <Warehouse className="w-5 h-5" />
                      ) : (
                        <Layers className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                          {ut.name}
                        </h2>
                        {ut.category && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
                            {ut.category}
                          </span>
                        )}
                        {group.offeringPrice !== undefined && (
                          <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            {formatCurrency(group.offeringPrice)}{" "}
                            <span className="text-[10px] text-emerald-600 font-normal">
                              /{" "}
                              {group.billingUnit === "month"
                                ? locale === "vi"
                                  ? "tháng"
                                  : "mo"
                                : group.billingUnit}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Dimensions & Specs */}
                      {"area" in ut && ut.area ? (
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                          <DimensionBadge
                            area={ut.area}
                            volume={ut.volume ?? 0}
                            dimensions={ut.dimensions}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Summary badges & Collapse Toggle */}
                  <div className="flex items-center gap-2.5 self-end md:self-auto">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 font-semibold text-slate-700">
                        {locale === "vi" ? `Tổng: ${totalUnits}` : `Total: ${totalUnits}`}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-50 font-semibold text-emerald-700 border border-emerald-200/60">
                        {locale === "vi" ? `Trống: ${availableCount}` : `Avail: ${availableCount}`}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-rose-50 font-semibold text-rose-700 border border-rose-200/60">
                        {locale === "vi" ? `Đang thuê: ${inUseCount}` : `In Use: ${inUseCount}`}
                      </span>
                      {maintenanceCount > 0 && (
                        <span className="px-2.5 py-1 rounded-xl bg-orange-50 font-semibold text-orange-700 border border-orange-200/60">
                          {locale === "vi"
                            ? `Bảo trì: ${maintenanceCount}`
                            : `Maint: ${maintenanceCount}`}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      aria-label="Toggle group collapse"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronUp className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Table of Storage Units under this Unit Type */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    {group.units.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        {locale === "vi"
                          ? "Không có ô kho nào phù hợp với bộ lọc trong quy cách này."
                          : "No storage units match filters in this unit type."}
                      </div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-[960px]">
                        <thead>
                          <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                            <th className="py-3 px-6 whitespace-nowrap">
                              {locale === "vi" ? "Số phòng / Ô kho" : "Unit Number"}
                            </th>
                            <th className="py-3 px-6 whitespace-nowrap">
                              {locale === "vi" ? "Vị trí (Tầng - Dãy)" : "Location (Floor - Zone)"}
                            </th>
                            <th className="py-3 px-6 whitespace-nowrap">
                              {locale === "vi" ? "Trạng thái" : "Status"}
                            </th>
                            <th className="py-3 px-6 whitespace-nowrap">
                              {locale === "vi" ? "Ghi chú" : "Notes"}
                            </th>
                            <th className="py-3 px-6 text-right whitespace-nowrap">
                              {locale === "vi" ? "Chi tiết" : "Actions"}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                          {group.units.map((unit) => (
                            <tr
                              key={unit.id}
                              onClick={() => setInspectUnit(unit)}
                              className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                            >
                              {/* Unit Number */}
                              <td className="py-3.5 px-6 font-mono font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-teal-50 group-hover:text-teal-600 text-slate-500 flex items-center justify-center shrink-0 transition-colors">
                                    <DoorOpen className="w-3.5 h-3.5" />
                                  </div>
                                  <span>{unit.unitNumber}</span>
                                </div>
                              </td>

                              {/* Floor / Zone */}
                              <td className="py-3.5 px-6 text-slate-600 font-medium">
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>
                                    {t("location.floor", { floor: unit.floor })}
                                    {unit.zone
                                      ? ` · ${t("location.zone", { zone: unit.zone })}`
                                      : ""}
                                  </span>
                                </div>
                              </td>

                              {/* Status Badge */}
                              <td className="py-3.5 px-6">
                                <UnitStatusBadge
                                  status={unit.status}
                                  category={unit.unitType?.category}
                                  rackCapacity={unit.rackCapacity}
                                />
                              </td>

                              {/* Notes */}
                              <td className="py-3.5 px-6 text-slate-500">
                                {unit.notes ? (
                                  <span className="truncate max-w-xs block" title={unit.notes}>
                                    {unit.notes}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 italic">—</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-6 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {(isWarehouseRackUnit(unit) ||
                                    group.unitType?.category ===
                                      UnitTypeCategoryEnum.WAREHOUSE_RACK ||
                                    String(group.unitType?.category ?? "").toLowerCase() ===
                                      "warehouse_rack" ||
                                    String(group.unitType?.category ?? "").toLowerCase() ===
                                      "warehouse") && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRackUnit(unit);
                                      }}
                                      title={locale === "vi" ? "Xem sơ đồ kệ kho" : "View rack map"}
                                      className="inline-flex items-center whitespace-nowrap shrink-0 gap-1 px-2.5 py-1 rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200/60 transition-colors text-xs font-semibold cursor-pointer"
                                    >
                                      <Warehouse className="w-3.5 h-3.5" />
                                      <span>{locale === "vi" ? "Sơ đồ kệ" : "Rack Map"}</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInspectUnit(unit);
                                    }}
                                    title={
                                      locale === "vi" ? "Xem chi tiết ô kho" : "View unit details"
                                    }
                                    className="inline-flex items-center whitespace-nowrap shrink-0 gap-1 px-2.5 py-1 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors text-xs font-semibold cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>{locale === "vi" ? "Chi tiết" : "View"}</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Storage Unit Detail Modal */}
      {inspectUnit && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-mono">
                    {locale === "vi"
                      ? `Ô kho: ${inspectUnit.unitNumber}`
                      : `Unit: ${inspectUnit.unitNumber}`}
                  </h3>
                  <p className="text-xs text-slate-400">{facility.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectUnit(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 text-xs">
              {/* Status and Unit Type banner */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-bold block mb-1">
                    {locale === "vi" ? "Trạng thái vận hành" : "Operational Status"}
                  </span>
                  <UnitStatusBadge
                    status={inspectUnit.status}
                    category={inspectUnit.unitType?.category}
                    rackCapacity={inspectUnit.rackCapacity}
                  />
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 uppercase font-bold block mb-1">
                    {locale === "vi" ? "Loại kho" : "Unit Type"}
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {inspectUnit.unitType?.name ?? "—"}
                  </span>
                </div>
              </div>

              {/* Warehouse Rack Banner & Action */}
              {isWarehouseRackUnit(inspectUnit) && (
                <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-200/80 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Warehouse className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">
                        {locale === "vi" ? "Kho hàng kệ cho thuê" : "Warehouse Rack Storage"}
                      </p>
                      <p className="text-[11px] text-teal-700 font-medium">
                        {locale === "vi"
                          ? "Bố trí theo các dãy kệ và từng tầng để hàng"
                          : "Arranged in aisles, bays and rack tiers"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const u = inspectUnit;
                      setInspectUnit(null);
                      setSelectedRackUnit(u);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    <Warehouse className="w-3.5 h-3.5" />
                    <span>{locale === "vi" ? "Xem sơ đồ kệ" : "View Rack Map"}</span>
                  </button>
                </div>
              )}

              {/* Specs & Location Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    {locale === "vi" ? "Vị trí trong cơ sở" : "Location"}
                  </span>
                  <p className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>
                      {t("location.floor", { floor: inspectUnit.floor })}
                      {inspectUnit.zone
                        ? ` · ${t("location.zone", { zone: inspectUnit.zone })}`
                        : ""}
                    </span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-100 bg-white space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">
                    {locale === "vi" ? "Kích thước & Thể tích" : "Dimensions"}
                  </span>
                  {inspectUnit.unitType ? (
                    <DimensionBadge
                      area={inspectUnit.unitType.area}
                      volume={inspectUnit.unitType.volume}
                      dimensions={inspectUnit.unitType.dimensions}
                    />
                  ) : (
                    <p className="text-slate-400 italic">—</p>
                  )}
                </div>
              </div>

              {/* Notes */}
              {inspectUnit.notes && (
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    {locale === "vi" ? "Ghi chú ô kho" : "Notes"}
                  </span>
                  <p className="text-slate-700 leading-relaxed">{inspectUnit.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectUnit(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                {locale === "vi" ? "Đóng" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Rack Structure Modal */}
      {selectedRackUnit && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/80 via-white to-white shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-600/20">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-900 font-mono">
                      {locale === "vi"
                        ? `Sơ đồ kệ kho: ${selectedRackUnit.unitNumber}`
                        : `Rack Map: ${selectedRackUnit.unitNumber}`}
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 text-teal-800 uppercase">
                      {selectedRackUnit.unitType?.name ?? "Warehouse Rack"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {facility.name} · {t("location.floor", { floor: selectedRackUnit.floor })}
                    {selectedRackUnit.zone
                      ? ` · ${t("location.zone", { zone: selectedRackUnit.zone })}`
                      : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRackUnit(null)}
                className="p-2.5 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
              <RackStructureView
                unitId={selectedRackUnit.id}
                unitNumber={selectedRackUnit.unitNumber}
                canManage={isFacilityManager}
              />
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                <span>
                  {locale === "vi"
                    ? "Nhấp vào từng ô kệ để xem chi tiết tầng, tải trọng và giá thuê"
                    : "Click on any rack tile to view tier details, max weight, and pricing"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRackUnit(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer self-end sm:self-auto"
              >
                {locale === "vi" ? "Đóng" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
