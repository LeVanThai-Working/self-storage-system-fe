"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  AlertCircle,
  ArrowUpDown,
  Boxes,
  Calendar,
  ClipboardCheck,
  CreditCard,
  Eye,
  FileSignature,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { useMyFacility, useStorageUnits } from "@/features/storage-unit-management/hooks";
import { useContractStats, useContracts, useFacilityStaffs } from "../hooks";
import {
  ContractSourceEnum,
  ContractStatusEnum,
  RoleEnum,
  UserStatusEnum,
  type ContractFilterParams,
  type ContractQuickStatusTab,
  type ContractResponse,
  type ContractScopeTab,
  type ContractSortBy,
} from "../types";
import {
  canCheckInContract,
  formatDateOnly,
  formatDateTime,
  formatVnd,
  getBillingUnitLabel,
  getContractDurationDays,
  getCurrentUserId,
  isContractAssignedToStaff,
} from "../utils";
import { CheckInContractModal, CollectWalkInDepositModal } from "./ContractActionModals";
import {
  ContractDepositBadge,
  ContractSourceBadge,
  ContractStatusBadge,
} from "./ContractStatusBadge";
import { CreateWalkInContractModal } from "./CreateWalkInContractModal";

const PAGE_LIMIT = 10;

const FILTER_CONTROL =
  "bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-700 text-xs font-medium py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all";

interface ContractsListViewProps {
  portalBase: "facility-manager" | "facility-staff";
}

export const ContractsListView: React.FC<ContractsListViewProps> = ({ portalBase }) => {
  const locale = useLocale() === "en" ? "en" : "vi";
  const isEn = locale === "en";
  const currentUser = useAuthStore((s) => s.currentUser);
  const isAuthLoading = useAuthStore((s) => s.isLoading);
  const currentUserId = getCurrentUserId(currentUser);
  const userRole = String(currentUser?.role ?? "").toLowerCase();
  const isStaff = userRole === RoleEnum.FACILITY_STAFF || portalBase === "facility-staff";
  const isManager = userRole === RoleEnum.FACILITY_MANAGER && !isStaff;

  const { data: facility, isLoading: isLoadingFacility } = useMyFacility();
  const facilityId = facility?.id;

  // Scope toggle: Staff is strictly locked to "ASSIGNED_TO_ME", Manager defaults to "ALL"
  const [scopeTab, setScopeTab] = useState<ContractScopeTab>(() =>
    isStaff ? "ASSIGNED_TO_ME" : "ALL"
  );
  const effectiveScope: ContractScopeTab = isStaff ? "ASSIGNED_TO_ME" : scopeTab;

  const [statusFilter, setStatusFilter] = useState<ContractStatusEnum | "">("");
  const [sourceFilter, setSourceFilter] = useState<ContractSourceEnum | "">("");
  const [storageUnitFilter, setStorageUnitFilter] = useState<string>("");
  const [codeInput, setCodeInput] = useState("");
  const [sortBy, setSortBy] = useState<ContractSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [checkInTarget, setCheckInTarget] = useState<ContractResponse | null>(null);
  const [collectDepositTarget, setCollectDepositTarget] = useState<ContractResponse | null>(null);

  const assignedStaffFilter = effectiveScope === "ASSIGNED_TO_ME" ? currentUserId : undefined;

  // Staff must NOT fire an unfiltered GET /contracts request before currentUserId is hydrated
  const shouldEnableContractsQuery =
    effectiveScope === "ASSIGNED_TO_ME" ? Boolean(currentUserId) : true;

  const queryParams: ContractFilterParams | null = useMemo(
    () => ({
      facilityId,
      page,
      limit: PAGE_LIMIT,
      assignedStaffId: assignedStaffFilter,
      status: statusFilter || undefined,
      source: sourceFilter || undefined,
      storageUnitId: storageUnitFilter || undefined,
      contractCode: codeInput.trim() || undefined,
      sortBy,
      sortOrder,
    }),
    [
      facilityId,
      page,
      assignedStaffFilter,
      statusFilter,
      sourceFilter,
      storageUnitFilter,
      codeInput,
      sortBy,
      sortOrder,
    ]
  );

  const contractsQuery = useContracts(queryParams, shouldEnableContractsQuery);
  const stats = useContractStats(facilityId, assignedStaffFilter, shouldEnableContractsQuery);

  // Load staffs & units to display friendly names in table
  const staffsQuery = useFacilityStaffs({ status: UserStatusEnum.ACTIVE, limit: 100 }, isManager);
  const unitsQuery = useStorageUnits(facilityId, {
    page: 1,
    limit: 200,
    sortBy: "unitNumber",
  });

  const staffNameMap = useMemo(() => {
    const map = new Map<string, string>();
    if (currentUserId && currentUser?.name) {
      map.set(currentUserId, currentUser.name);
    }
    for (const s of staffsQuery.data?.items ?? []) {
      map.set(s.id, s.name);
    }
    return map;
  }, [staffsQuery.data?.items, currentUser, currentUserId]);

  const unitLabelMap = useMemo(() => {
    const map = new Map<string, { unitNumber: string; floor: number; zone?: string | null }>();
    for (const u of unitsQuery.data?.items ?? []) {
      map.set(u.id, { unitNumber: u.unitNumber, floor: u.floor, zone: u.zone });
    }
    return map;
  }, [unitsQuery.data?.items]);

  const rawItems = contractsQuery.data?.items;

  // Client-side filter + sort priority when viewing "ASSIGNED_TO_ME"
  const displayedItems = useMemo(() => {
    let list = rawItems ?? [];

    if (effectiveScope === "ASSIGNED_TO_ME") {
      if (!currentUserId) {
        return [];
      }
      // Strictly keep ONLY contracts assigned to this staff member
      list = list.filter((c) => isContractAssignedToStaff(c, currentUserId));

      // Prioritize DRAFT contracts awaiting check-in at the top
      if (!statusFilter) {
        list = [...list].sort((a, b) => {
          const aIsDraft = a.status === ContractStatusEnum.DRAFT ? 0 : 1;
          const bIsDraft = b.status === ContractStatusEnum.DRAFT ? 0 : 1;
          if (aIsDraft !== bIsDraft) return aIsDraft - bIsDraft;
          return 0;
        });
      }
    }

    return list;
  }, [rawItems, effectiveScope, currentUserId, statusFilter]);

  const pagination = contractsQuery.data?.pagination;

  const handleResetFilters = () => {
    setStatusFilter("");
    setSourceFilter("");
    setStorageUnitFilter("");
    setCodeInput("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  if (isLoadingFacility || (isStaff && isAuthLoading && !currentUserId)) {
    return (
      <div className="p-12 flex items-center justify-center text-sm text-slate-500 gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
        <span>
          {isEn ? "Loading facility workspace..." : "Đang tải không gian làm việc cơ sở..."}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {isEn ? "Storage Lease Contracts & Handover" : "Quản lý Hợp đồng Thuê kho & Bàn giao"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isEn
              ? `Manage contract lifecycle, walk-in deposits, check-in handover, renewals, and check-out settlement at ${facility?.name ?? "your facility"}.`
              : `Quản lý vòng đời hợp đồng, thu cọc tại quầy, bàn giao Check-in, gia hạn và thanh lý Check-out tại ${facility?.name ?? "cơ sở"}.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => contractsQuery.refetch()}
            disabled={contractsQuery.isFetching}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 text-emerald-600 ${contractsQuery.isFetching ? "animate-spin" : ""}`}
            />
            {isEn ? "Refresh" : "Làm mới"}
          </button>

          <button
            type="button"
            onClick={() => setIsWalkInModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            {isEn ? "+ Create Walk-in Contract" : "+ Tạo hợp đồng Walk-in"}
          </button>
        </div>
      </div>

      {/* Scope Segmented Toggle: Staff only sees "Được giao cho tôi", Manager can switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
        <div className="inline-flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setScopeTab("ASSIGNED_TO_ME");
              setPage(1);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              effectiveScope === "ASSIGNED_TO_ME"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            {isEn ? "Assigned to Me" : "Được giao cho tôi"}
          </button>

          {!isStaff && (
            <button
              type="button"
              onClick={() => {
                setScopeTab("ALL");
                setPage(1);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                effectiveScope === "ALL"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileSignature className="w-4 h-4 text-teal-600" />
              {isEn ? "All Facility Contracts" : "Tất cả hợp đồng cơ sở"}
            </button>
          )}
        </div>

        <p className="text-xs text-slate-500 px-2">
          {effectiveScope === "ASSIGNED_TO_ME"
            ? isEn
              ? "Showing only contracts assigned to you (DRAFT contracts awaiting check-in are prioritized)."
              : "Chỉ hiển thị các hợp đồng được phân công cho bạn phụ trách (ưu tiên hợp đồng DRAFT chờ đón khách Check-in)."
            : isEn
              ? "Showing all contracts across the facility."
              : "Hiển thị toàn bộ hợp đồng thuê kho tại cơ sở."}
        </p>
      </div>

      {/* Static Statistical Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(
          [
            {
              key: "ALL" as ContractQuickStatusTab,
              label: isEn ? "All Contracts" : "Tất cả",
              count: stats.total,
              tone: "border-slate-200 bg-white text-slate-800",
            },
            {
              key: "DRAFT" as ContractQuickStatusTab,
              label: isEn ? "Pending Check-in" : "Chờ ký & Check-in",
              count: stats.draft,
              tone: "border-amber-200 bg-amber-50/50 text-amber-800",
            },
            {
              key: "ACTIVE" as ContractQuickStatusTab,
              label: isEn ? "Active" : "Đang thuê",
              count: stats.active,
              tone: "border-emerald-200 bg-emerald-50/50 text-emerald-800",
            },
            {
              key: "OVERDUE" as ContractQuickStatusTab,
              label: isEn ? "Overdue" : "Quá hạn trả kho",
              count: stats.overdue,
              tone: "border-orange-200 bg-orange-50/50 text-orange-800",
            },
            {
              key: "COMPLETED" as ContractQuickStatusTab,
              label: isEn ? "Completed" : "Đã hoàn tất",
              count: stats.completed,
              tone: "border-sky-200 bg-sky-50/50 text-sky-800",
            },
            {
              key: "TERMINATED_GROUP" as ContractQuickStatusTab,
              label: isEn ? "Cancelled / Terminated" : "Đã huỷ / Chấm dứt",
              count: stats.terminatedGroup,
              tone: "border-rose-200 bg-rose-50/40 text-rose-800",
            },
          ] as const
        ).map((tab) => (
          <div key={tab.key} className={`p-3.5 rounded-2xl border text-left shadow-sm ${tab.tone}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold truncate">{tab.label}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-white/90 border border-slate-200/80 text-slate-900">
                {tab.count}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Contract Code */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                setPage(1);
              }}
              placeholder={
                isEn
                  ? "Search by contract code (e.g., CTR-2026...)"
                  : "Tìm theo mã hợp đồng (VD: CTR-2026...)"
              }
              className={`${FILTER_CONTROL} w-full pl-9`}
            />
          </div>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value as ContractSourceEnum | "");
              setPage(1);
            }}
            className={FILTER_CONTROL}
          >
            <option value="">{isEn ? "All Sources" : "Tất cả nguồn tạo"}</option>
            <option value={ContractSourceEnum.RESERVATION}>
              {isEn ? "From Reservation" : "Khách đặt chỗ"}
            </option>
            <option value={ContractSourceEnum.WALK_IN}>
              {isEn ? "Walk-in at Counter" : "Khách trực tiếp"}
            </option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ContractStatusEnum | "");
              setPage(1);
            }}
            className={FILTER_CONTROL}
          >
            <option value="">{isEn ? "All Statuses" : "Tất cả trạng thái"}</option>
            <option value={ContractStatusEnum.DRAFT}>
              {isEn ? "Pending Check-in" : "Chờ ký & Check-in"}
            </option>
            <option value={ContractStatusEnum.ACTIVE}>{isEn ? "Active" : "Đang thuê"}</option>
            <option value={ContractStatusEnum.OVERDUE}>
              {isEn ? "Overdue" : "Quá hạn trả kho"}
            </option>
            <option value={ContractStatusEnum.COMPLETED}>
              {isEn ? "Completed" : "Đã hoàn tất"}
            </option>
            <option value={ContractStatusEnum.CANCELLED}>
              {isEn ? "Cancelled" : "Đã huỷ bản nháp"}
            </option>
            <option value={ContractStatusEnum.TERMINATED}>
              {isEn ? "Terminated" : "Chấm dứt trước hạn"}
            </option>
          </select>

          {/* Storage Unit Filter */}
          <select
            value={storageUnitFilter}
            onChange={(e) => {
              setStorageUnitFilter(e.target.value);
              setPage(1);
            }}
            className={FILTER_CONTROL}
          >
            <option value="">{isEn ? "All Storage Units" : "Tất cả phòng kho"}</option>
            {(unitsQuery.data?.items ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                #{u.unitNumber} ({isEn ? `Fl. ${u.floor}` : `Tầng ${u.floor}`})
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as ContractSortBy);
              setPage(1);
            }}
            className={FILTER_CONTROL}
          >
            <option value="createdAt">{isEn ? "Created Date" : "Mới tạo nhất"}</option>
            <option value="contractCode">{isEn ? "Contract Code" : "Mã hợp đồng"}</option>
            <option value="startDate">{isEn ? "Start Date" : "Ngày bắt đầu"}</option>
            <option value="endDate">{isEn ? "End Date" : "Ngày kết thúc"}</option>
            <option value="totalRentalAmount">{isEn ? "Total Rental" : "Tổng tiền thuê"}</option>
            <option value="status">{isEn ? "Status" : "Trạng thái"}</option>
          </select>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
            className={`${FILTER_CONTROL} inline-flex items-center gap-1.5`}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
            {sortOrder === "desc" ? (isEn ? "Desc" : "Giảm dần") : isEn ? "Asc" : "Tăng dần"}
          </button>

          {(statusFilter || sourceFilter || storageUnitFilter || codeInput) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              {isEn ? "Clear" : "Xóa lọc"}
            </button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {contractsQuery.isLoading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 mx-auto mb-2" />
            {isEn ? "Loading contracts..." : "Đang tải danh sách hợp đồng..."}
          </div>
        ) : contractsQuery.isError ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              {isEn ? "Failed to load contracts" : "Không thể tải danh sách hợp đồng"}
            </p>
            <button
              type="button"
              onClick={() => contractsQuery.refetch()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isEn ? "Retry" : "Thử lại"}
            </button>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="p-14 text-center space-y-2">
            <FileSignature className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              {isEn ? "No contracts found" : "Chưa có hợp đồng nào khớp bộ lọc"}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isEn
                ? "Create a contract from a confirmed reservation or click '+ Create Walk-in Contract' above."
                : "Bạn có thể tạo hợp đồng từ khách đặt chỗ đã xác nhận hoặc nhấn '+ Tạo hợp đồng Walk-in' ở góc trên."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">{isEn ? "Contract Code" : "Mã hợp đồng"}</th>
                  <th className="py-3.5 px-4">{isEn ? "Customer" : "Khách hàng"}</th>
                  <th className="py-3.5 px-4">{isEn ? "Source" : "Nguồn"}</th>
                  <th className="py-3.5 px-4">{isEn ? "Storage Unit" : "Kho vật lý"}</th>
                  <th className="py-3.5 px-4">{isEn ? "Lease Period" : "Thời hạn thuê"}</th>
                  <th className="py-3.5 px-4">{isEn ? "Total & Deposit" : "Giá thuê & Cọc"}</th>
                  <th className="py-3.5 px-4">{isEn ? "Assigned Staff" : "NV phụ trách"}</th>
                  <th className="py-3.5 px-4">{isEn ? "Status" : "Trạng thái"}</th>
                  <th className="py-3.5 px-4 text-right">
                    {isEn ? "Quick Actions" : "Hành động nhanh"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayedItems.map((contract) => {
                  const resolvedUnit =
                    contract.storageUnit ?? unitLabelMap.get(contract.storageUnitId);
                  const resolvedStaffName =
                    contract.assignedStaff?.name ||
                    (contract.assignedStaffId
                      ? staffNameMap.get(contract.assignedStaffId)
                      : undefined) ||
                    (contract.assignedStaffId && contract.assignedStaffId === currentUser?.id
                      ? currentUser?.name
                      : contract.assignedStaffId
                        ? `#${contract.assignedStaffId.slice(-6)}`
                        : "—");

                  const canQuickCollectDeposit =
                    contract.status === ContractStatusEnum.DRAFT &&
                    contract.source === ContractSourceEnum.WALK_IN &&
                    !contract.depositPaidAt;

                  const canQuickCheckIn = canCheckInContract(contract);

                  const durationDays = getContractDurationDays(
                    contract.startDate,
                    contract.endDate
                  );

                  return (
                    <tr key={contract.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* 1. Contract Code */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/${locale}/${portalBase}/contracts/${contract.id}`}
                          className="font-mono font-extrabold text-emerald-700 hover:underline block"
                        >
                          {contract.contractCode}
                        </Link>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(contract.createdAt, locale)}
                        </span>
                      </td>

                      {/* 2. Customer Snapshot */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">
                          {contract.customer?.name || `#${contract.customerId.slice(-6)}`}
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          {contract.customer?.phoneNumber || contract.customer?.email || "—"}
                        </span>
                      </td>

                      {/* 3. Source */}
                      <td className="py-3.5 px-4">
                        <ContractSourceBadge source={contract.source} />
                      </td>

                      {/* 4. Storage Unit */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Boxes className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>
                            {resolvedUnit
                              ? `#${resolvedUnit.unitNumber}`
                              : `#${contract.storageUnitId.slice(-6)}`}
                          </span>
                        </div>
                        {resolvedUnit && (
                          <span className="text-[11px] text-slate-500">
                            {isEn ? `Floor ${resolvedUnit.floor}` : `Tầng ${resolvedUnit.floor}`}
                            {resolvedUnit.zone ? ` • ${resolvedUnit.zone}` : ""}
                          </span>
                        )}
                      </td>

                      {/* 5. Lease Period */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>
                            {formatDateOnly(contract.startDate, locale)} →{" "}
                            {formatDateOnly(contract.endDate, locale)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {durationDays} {isEn ? "days" : "ngày"}
                          {(contract.renewalCount ?? 0) > 0
                            ? ` • ${isEn ? `Renewed ${contract.renewalCount}x` : `Đã gia hạn ${contract.renewalCount} lần`}`
                            : ""}
                        </span>
                      </td>

                      {/* 6. Total Periodic Price & Deposit Status */}
                      <td className="py-3.5 px-4 space-y-1">
                        <div className="font-extrabold text-slate-900">
                          {formatVnd(contract.totalPeriodicPrice)}{" "}
                          <span className="text-[11px] font-medium text-slate-500">
                            / {getBillingUnitLabel(contract.billingUnit, locale)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] text-slate-500">
                            {isEn ? "Deposit:" : "Cọc:"} {formatVnd(contract.depositAmount)}
                          </span>
                          <ContractDepositBadge
                            source={contract.source}
                            depositPaidAt={contract.depositPaidAt}
                          />
                        </div>
                      </td>

                      {/* 7. Assigned Staff */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[140px]">{resolvedStaffName}</span>
                        </div>
                      </td>

                      {/* 8. Status */}
                      <td className="py-3.5 px-4">
                        <ContractStatusBadge status={contract.status} />
                      </td>

                      {/* 9. Quick Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {canQuickCollectDeposit && (
                            <button
                              type="button"
                              onClick={() => setCollectDepositTarget(contract)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              {isEn ? "Collect Deposit" : "Thu tiền cọc tại quầy"}
                            </button>
                          )}

                          {canQuickCheckIn && (
                            <button
                              type="button"
                              onClick={() => setCheckInTarget(contract)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              {isEn
                                ? "Handover & Sign (Staff)"
                                : "Xác nhận bàn giao kho & Ký (Staff)"}
                            </button>
                          )}

                          <Link
                            href={`/${locale}/${portalBase}/contracts/${contract.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                          >
                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                            {isEn ? "Detail" : "Chi tiết"}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
            <span>
              {isEn ? "Page" : "Trang"} <strong>{pagination.page}</strong> /{" "}
              <strong>{pagination.totalPages}</strong> ({pagination.totalItems}{" "}
              {isEn ? "contracts" : "hợp đồng"})
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40"
              >
                {isEn ? "Previous" : "Trước"}
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 disabled:opacity-40"
              >
                {isEn ? "Next" : "Tiếp theo"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateWalkInContractModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        facilityId={facilityId}
        portalBase={portalBase}
      />

      <CollectWalkInDepositModal
        isOpen={Boolean(collectDepositTarget)}
        onClose={() => setCollectDepositTarget(null)}
        contract={collectDepositTarget}
      />

      <CheckInContractModal
        isOpen={Boolean(checkInTarget)}
        onClose={() => setCheckInTarget(null)}
        contract={checkInTarget}
      />
    </div>
  );
};
