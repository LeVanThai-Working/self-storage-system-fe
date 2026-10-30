"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Banknote,
  Boxes,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Eye,
  FileCheck2,
  Flame,
  Inbox,
  Layers,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import { AppApiError } from "@/lib/api/axios";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useAuthStore } from "@/features/auth/store";
import { ContractSourceEnum, RoleEnum } from "@self-storage-system-fe/shared";
import { useFacilityOfferings, useMyFacility } from "@/features/storage-unit-management/hooks";
import { useFacility } from "@/features/facility-management/hooks";
import { useCreateContract } from "@/features/contract-management/hooks";
import { resolveContractErrorMessage } from "@/features/contract-management/utils";
import { useManagerReservationStats, useManagerReservations } from "../hooks";
import {
  MESSAGE_CODE,
  ReservationStatusEnum,
  type ManagerReservationFilterParams,
  type ManagerReservationQuickTab,
  type ReservationResponse,
  type ReservationSortBy,
} from "../types";
import { formatDateOnly, formatDateTime, formatRentalScheduleLabel, formatVnd } from "../utils";
import {
  AssignReservationStaffModal,
  CancelReservationModal,
  ConfirmRefundModal,
  ConfirmReservationModal,
  ExtendGracePeriodModal,
  ForceCancelReservationModal,
  ManualPaymentConfirmModal,
  MarkCustomerArrivedModal,
  ReassignStorageUnitModal,
} from "./ReservationActionModals";
import { ReservationDetailSheet } from "./ReservationDetailSheet";
import { ReservationStatusBadge } from "./ReservationStatusBadge";

const PAGE_LIMIT = 10;

const FILTER_CONTROL =
  "bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-700 text-xs font-medium py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

const ALL_RESERVATION_STATUSES: ReservationStatusEnum[] = [
  ReservationStatusEnum.PENDING_PAYMENT,
  ReservationStatusEnum.PAYMENT_SUCCESSFUL,
  ReservationStatusEnum.CONFIRMED,
  ReservationStatusEnum.OVERDUE,
  ReservationStatusEnum.COMPLETED,
  ReservationStatusEnum.CANCELLED,
  ReservationStatusEnum.EXPIRED,
];

interface ManagerReservationsViewProps {
  portalBase?: "facility-manager" | "facility-staff";
}

export const ManagerReservationsView: React.FC<ManagerReservationsViewProps> = ({
  portalBase = "facility-manager",
}) => {
  const t = useTranslations("facilityManager.reservations");
  const tActions = useTranslations("facilityManager.reservations.actions");
  const tStatuses = useTranslations("facilityManager.reservations.statuses");
  const tBilling = useTranslations("facilityManager.reservations.billingUnit");
  const tErrors = useTranslations("facilityManager.reservations.errors");
  const locale = useLocale() === "en" ? "en" : "vi";
  const getErrorMessage = useApiErrorMessage();

  const currentUser = useAuthStore((s) => s.currentUser);
  const isStaff = portalBase === "facility-staff" || currentUser?.role === RoleEnum.FACILITY_STAFF;
  const isManager = !isStaff;

  const userRecord = currentUser as unknown as Record<string, unknown> | null;
  const userFacilityId =
    (typeof userRecord?.facilityId === "string" && userRecord.facilityId) ||
    (typeof userRecord?.assignedFacilityId === "string" && userRecord.assignedFacilityId) ||
    ((userRecord?.facility as Record<string, unknown>)?.id as string | undefined);

  const userFacilitySnapshot =
    userRecord?.facility && typeof userRecord.facility === "object"
      ? (userRecord.facility as { id?: string; name?: string; address?: string })
      : undefined;

  const { data: myFacility, isLoading: isLoadingFacility } = useMyFacility({ enabled: isManager });
  const candidateFacilityId = isManager ? myFacility?.id : userFacilityId || undefined;

  // Filter states
  const [statusFilter, setStatusFilter] = useState<ReservationStatusEnum | "">("");
  const [codeInput, setCodeInput] = useState("");
  const [debouncedCode, setDebouncedCode] = useState("");
  const [offeringIdFilter, setOfferingIdFilter] = useState("");
  const [startDateFromInput, setStartDateFromInput] = useState("");
  const [startDateToInput, setStartDateToInput] = useState("");
  const [sortBy, setSortBy] = useState<ReservationSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  // Live clock for hold countdown
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  // Debounce reservationCode search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCode(codeInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [codeInput]);

  // Convert local date inputs (YYYY-MM-DD) into ISO 8601 strings for Backend
  const startDateFromIso = useMemo(() => {
    if (!startDateFromInput) return undefined;
    const d = new Date(`${startDateFromInput}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }, [startDateFromInput]);

  const startDateToIso = useMemo(() => {
    if (!startDateToInput) return undefined;
    const d = new Date(`${startDateToInput}T23:59:59.999Z`);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }, [startDateToInput]);

  // Stats for quick filter tabs
  const stats = useManagerReservationStats(
    candidateFacilityId,
    isStaff ? Boolean(currentUser) : Boolean(candidateFacilityId)
  );

  // Main reservations query
  const queryParams: ManagerReservationFilterParams | null = useMemo(() => {
    if (isManager && !candidateFacilityId) return null;
    return {
      facilityId: candidateFacilityId,
      page,
      limit: PAGE_LIMIT,
      status: statusFilter || undefined,
      reservationCode: debouncedCode || undefined,
      facilityUnitTypeOfferingId: offeringIdFilter || undefined,
      startDateFrom: startDateFromIso,
      startDateTo: startDateToIso,
      sortBy,
      sortOrder,
    };
  }, [
    isManager,
    candidateFacilityId,
    page,
    statusFilter,
    debouncedCode,
    offeringIdFilter,
    startDateFromIso,
    startDateToIso,
    sortBy,
    sortOrder,
  ]);

  const listQuery = useManagerReservations(queryParams);
  const items = listQuery.data?.items ?? [];

  // Resolve staff facility from user profile OR first reservation item
  const firstItemFacility = items[0]?.facility;
  const firstItemFacilityId = items[0]?.facilityId;

  const resolvedFacilityId = candidateFacilityId || firstItemFacilityId;

  const facilityDetailQuery = useFacility(resolvedFacilityId ?? "", {
    enabled: !myFacility && !userFacilitySnapshot && Boolean(resolvedFacilityId),
  });

  const facility =
    myFacility || userFacilitySnapshot || facilityDetailQuery.data || firstItemFacility;

  const facilityId = facility?.id || resolvedFacilityId;

  // Offerings of the manager / staff facility
  const offeringsQuery = useFacilityOfferings(facilityId);
  const offerings = useMemo(() => offeringsQuery.data ?? [], [offeringsQuery.data]);

  const offeringMap = useMemo(() => {
    const map = new Map<string, string>();
    offerings.forEach((o) => {
      map.set(o.id, o.unitType.name);
      map.set(o.unitType.id, o.unitType.name);
    });
    return map;
  }, [offerings]);

  // Feedback banner state
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Modals state
  const [detailTarget, setDetailTarget] = useState<ReservationResponse | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ReservationResponse | null>(null);
  const [markArrivedTarget, setMarkArrivedTarget] = useState<ReservationResponse | null>(null);
  const [extendGraceTarget, setExtendGraceTarget] = useState<ReservationResponse | null>(null);
  const [reassignTarget, setReassignTarget] = useState<ReservationResponse | null>(null);
  const [forceCancelTarget, setForceCancelTarget] = useState<ReservationResponse | null>(null);
  const [confirmRefundTarget, setConfirmRefundTarget] = useState<ReservationResponse | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ReservationResponse | null>(null);
  const [manualPaymentTarget, setManualPaymentTarget] = useState<ReservationResponse | null>(null);
  const [assignStaffTarget, setAssignStaffTarget] = useState<ReservationResponse | null>(null);

  // Direct Contract Creation
  const router = useRouter();
  const createContractMutation = useCreateContract();
  const [creatingContractId, setCreatingContractId] = useState<string | null>(null);

  const handleCreateContractDirectly = async (r: ReservationResponse) => {
    if (!r.storageUnitId) {
      showFeedback(
        "error",
        locale === "en"
          ? "This reservation has not been assigned a physical storage unit yet."
          : "Đơn đặt chỗ này chưa được gán ô kho vật lý."
      );
      return;
    }

    try {
      setCreatingContractId(r.id);
      const created = await createContractMutation.mutateAsync({
        source: ContractSourceEnum.RESERVATION,
        reservationId: r.id,
        assignedStaffId: r.assignedStaffId || (currentUser?.id ?? undefined),
      });

      showFeedback(
        "success",
        locale === "en"
          ? "Draft contract created. Redirecting..."
          : "Đã lập hợp đồng nháp. Đang chuyển hướng..."
      );
      router.push(`/${locale}/${portalBase}/contracts/${created.id}`);
    } catch (err: unknown) {
      showFeedback("error", resolveContractErrorMessage(err, locale));
    } finally {
      setCreatingContractId(null);
    }
  };

  // Active quick tab
  const activeQuickTab: ManagerReservationQuickTab = useMemo(() => {
    if (!statusFilter) return "ALL";
    switch (statusFilter) {
      case ReservationStatusEnum.PENDING_PAYMENT:
        return "PENDING_PAYMENT";
      case ReservationStatusEnum.PAYMENT_SUCCESSFUL:
        return "PAYMENT_SUCCESSFUL";
      case ReservationStatusEnum.CONFIRMED:
        return "CONFIRMED";
      case ReservationStatusEnum.OVERDUE:
        return "OVERDUE";
      case ReservationStatusEnum.COMPLETED:
        return "COMPLETED";
      case ReservationStatusEnum.CANCELLED:
        return "CANCELLED";
      case ReservationStatusEnum.EXPIRED:
        return "EXPIRED";
      default:
        return "ALL";
    }
  }, [statusFilter]);

  const handleSelectQuickTab = (tab: ManagerReservationQuickTab) => {
    setPage(1);
    switch (tab) {
      case "ALL":
        setStatusFilter("");
        break;
      case "PENDING_PAYMENT":
        setStatusFilter(ReservationStatusEnum.PENDING_PAYMENT);
        break;
      case "PAYMENT_SUCCESSFUL":
        setStatusFilter(ReservationStatusEnum.PAYMENT_SUCCESSFUL);
        break;
      case "CONFIRMED":
        setStatusFilter(ReservationStatusEnum.CONFIRMED);
        break;
      case "OVERDUE":
        setStatusFilter(ReservationStatusEnum.OVERDUE);
        break;
      case "COMPLETED":
        setStatusFilter(ReservationStatusEnum.COMPLETED);
        break;
      case "CANCELLED":
        setStatusFilter(ReservationStatusEnum.CANCELLED);
        break;
      case "EXPIRED":
        setStatusFilter(ReservationStatusEnum.EXPIRED);
        break;
      default:
        setStatusFilter("");
    }
  };

  const hasActiveFilters = Boolean(
    statusFilter ||
    debouncedCode ||
    offeringIdFilter ||
    startDateFromInput ||
    startDateToInput ||
    sortBy !== "createdAt" ||
    sortOrder !== "desc"
  );

  const clearAllFilters = () => {
    setStatusFilter("");
    setCodeInput("");
    setDebouncedCode("");
    setOfferingIdFilter("");
    setStartDateFromInput("");
    setStartDateToInput("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  if (isManager && !isLoadingFacility && !facilityId) {
    return (
      <div className="bg-white rounded-3xl border border-amber-200 p-10 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-lg font-extrabold text-slate-900">{t("noFacility.title")}</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">{t("noFacility.description")}</p>
      </div>
    );
  }
  const pagination = listQuery.data?.pagination ?? {
    page: 1,
    limit: PAGE_LIMIT,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const quickTabs: {
    key: ManagerReservationQuickTab;
    label: string;
    count: number;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
  }[] = [
    {
      key: "ALL",
      label: t("quickTabs.all"),
      count: stats.total,
      icon: ClipboardList,
      accent: "text-slate-700 bg-slate-100",
    },
    {
      key: "PENDING_PAYMENT",
      label: t("quickTabs.pendingPayment"),
      count: stats.pendingPayment,
      icon: Clock,
      accent: "text-orange-700 bg-orange-50",
    },
    {
      key: "PAYMENT_SUCCESSFUL",
      label: t("quickTabs.paymentSuccessful"),
      count: stats.paymentSuccessful,
      icon: CreditCard,
      accent: "text-teal-700 bg-teal-50",
    },
    {
      key: "CONFIRMED",
      label: t("quickTabs.confirmed"),
      count: stats.confirmed,
      icon: ShieldCheck,
      accent: "text-emerald-700 bg-emerald-50",
    },
    {
      key: "OVERDUE",
      label: t("quickTabs.overdue"),
      count: stats.overdue,
      icon: AlertTriangle,
      accent: "text-amber-700 bg-amber-50",
    },
    {
      key: "COMPLETED",
      label: t("quickTabs.completed"),
      count: stats.completed,
      icon: PackageCheck,
      accent: "text-indigo-700 bg-indigo-50",
    },
    {
      key: "CANCELLED",
      label: t("quickTabs.cancelled"),
      count: stats.cancelled,
      icon: XCircle,
      accent: "text-rose-700 bg-rose-50",
    },
    {
      key: "EXPIRED",
      label: t("quickTabs.expired"),
      count: stats.expired,
      icon: Clock,
      accent: "text-slate-600 bg-slate-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isStaff ? (locale === "en" ? "My Reservations" : "Đơn đặt chỗ của tôi") : t("title")}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isStaff
              ? facility?.name
                ? locale === "en"
                  ? `Reservations assigned to you at ${facility.name}.`
                  : `Các đơn đặt chỗ thuộc về bạn tại cơ sở ${facility.name}.`
                : locale === "en"
                  ? "Manage and fulfill reservations assigned to you."
                  : "Quản lý và tiếp đón khách hàng theo các đơn đặt chỗ thuộc về bạn."
              : t("subtitle", { facility: facility?.name ?? "..." })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void listQuery.refetch();
          }}
          disabled={listQuery.isFetching}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${listQuery.isFetching ? "animate-spin text-teal-600" : ""}`}
          />
          {t("refresh")}
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-xs font-bold shadow-sm transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Quick Filter Tabs (7 Stages) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {quickTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeQuickTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleSelectQuickTab(tab.key)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                isActive
                  ? "bg-white border-teal-500 shadow-md ring-2 ring-teal-500/10"
                  : "bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${tab.accent}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span
                  className={`text-base font-extrabold ${isActive ? "text-teal-600" : "text-slate-800"}`}
                >
                  {stats.isLoading ? "—" : tab.count}
                </span>
              </div>
              <p
                className={`text-[11px] font-bold line-clamp-1 ${
                  isActive ? "text-slate-900" : "text-slate-500"
                }`}
              >
                {tab.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Detailed Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Code Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder={t("filters.searchCodePlaceholder")}
              className={`${FILTER_CONTROL} w-full pl-9`}
            />
            {codeInput && (
              <button
                type="button"
                onClick={() => setCodeInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Status Select */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ReservationStatusEnum | "");
                setPage(1);
              }}
              className={`${FILTER_CONTROL} w-full`}
            >
              <option value="">{t("filters.allStatuses")}</option>
              {ALL_RESERVATION_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {tStatuses(st as Parameters<typeof tStatuses>[0]) || st}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Offering Select */}
          <div>
            <select
              value={offeringIdFilter}
              onChange={(e) => {
                setOfferingIdFilter(e.target.value);
                setPage(1);
              }}
              className={`${FILTER_CONTROL} w-full`}
            >
              <option value="">{t("filters.allOfferings")}</option>
              {offerings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.unitType.name} ({formatVnd(o.pricePerUnit)}/{o.billingUnit})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Start Date Range */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDateFromInput}
              onChange={(e) => {
                setStartDateFromInput(e.target.value);
                setPage(1);
              }}
              className={`${FILTER_CONTROL} w-full text-slate-600`}
            />
            <span className="text-slate-300 text-xs">→</span>
            <input
              type="date"
              value={startDateToInput}
              onChange={(e) => {
                setStartDateToInput(e.target.value);
                setPage(1);
              }}
              className={`${FILTER_CONTROL} w-full text-slate-600`}
            />
          </div>

          {/* 5. Sort By & Clear */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as ReservationSortBy);
                setPage(1);
              }}
              className={`${FILTER_CONTROL} flex-1`}
            >
              <option value="createdAt">{t("filters.sortBy.createdAt")}</option>
              <option value="startDate">{t("filters.sortBy.startDate")}</option>
              <option value="totalAmount">{t("filters.sortBy.totalAmount")}</option>
              <option value="updatedAt">{t("filters.sortBy.updatedAt")}</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                setPage(1);
              }}
              className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-slate-100 text-slate-700"
              title={t("filters.toggleSortOrder")}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                {t("filters.clear")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {listQuery.isLoading ? (
          <div className="p-16 text-center text-xs text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
            Đang tải danh sách đơn đặt chỗ...
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-extrabold text-slate-700">{t("empty.title")}</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">{t("empty.description")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">{t("table.codeAndDate")}</th>
                  <th className="py-3.5 px-4">{t("table.customer")}</th>
                  <th className="py-3.5 px-4">{t("table.packageAndSchedule")}</th>
                  <th className="py-3.5 px-4">{t("table.storageUnit")}</th>
                  <th className="py-3.5 px-4">{t("table.financials")}</th>
                  <th className="py-3.5 px-4">{t("table.status")}</th>
                  <th className="py-3.5 px-4 text-right">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((r) => {
                  const st = r.status;
                  const unitName =
                    offeringMap.get(r.facilityUnitTypeOfferingId) ??
                    r.offering?.unitTypeId ??
                    t("table.standardPackage");

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* 1. Code & CreatedAt */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDetailTarget(r)}
                          className="font-mono font-extrabold text-teal-700 hover:text-teal-900 hover:underline block text-xs"
                        >
                          {r.reservationCode}
                        </button>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {formatDateTime(r.createdAt, locale)}
                        </span>
                      </td>

                      {/* 2. Customer */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800">{r.customer?.name ?? "—"}</div>
                        <div className="text-[11px] text-slate-400">
                          {r.customer?.phoneNumber || r.customer?.email || "—"}
                        </div>
                      </td>

                      {/* 3. Package & Schedule */}
                      <td className="py-4 px-4">
                        <div
                          className="font-semibold text-slate-800 max-w-[200px] truncate"
                          title={unitName}
                        >
                          {unitName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            Hẹn nhận: {formatDateOnly(r.checkInDate, locale)} (
                            {r.checkInTimeSlot || "N/A"})
                          </span>
                        </div>
                      </td>

                      {/* 4. Storage Unit */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {r.storageUnit ? (
                          <div>
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                              #{r.storageUnit.unitNumber}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Tầng {r.storageUnit.floor}{" "}
                              {r.storageUnit.zone ? `• Khu ${r.storageUnit.zone}` : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Chưa chọn</span>
                        )}
                      </td>

                      {/* 5. Financials */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{formatVnd(r.totalAmount)}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          Cọc: {formatVnd(r.depositAmount)}
                        </div>
                      </td>

                      {/* 6. Status & Badges */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <ReservationStatusBadge
                            status={r.status}
                            expiresAt={r.expiresAt}
                            nowMs={nowMs}
                          />
                          {r.arrivedAt && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-800 block w-max">
                              <UserCheck className="w-2.5 h-2.5" /> Đã có mặt
                            </span>
                          )}
                          {r.pendingUnitChange && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 block w-max">
                              <AlertTriangle className="w-2.5 h-2.5" /> Chờ duyệt đổi kho
                            </span>
                          )}
                          {r.refundStatus === "pending" && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 block w-max">
                              <Banknote className="w-2.5 h-2.5" /> Chờ hoàn cọc
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 7. Quick Contextual Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap max-w-[280px]">
                          {/* PENDING_PAYMENT actions */}
                          {st === ReservationStatusEnum.PENDING_PAYMENT && (
                            <>
                              <button
                                type="button"
                                onClick={() => setManualPaymentTarget(r)}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
                              >
                                Thu cọc quầy
                              </button>
                              <button
                                type="button"
                                onClick={() => setCancelTarget(r)}
                                className="px-2 py-1 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600"
                              >
                                Hủy
                              </button>
                            </>
                          )}

                          {/* PAYMENT_SUCCESSFUL actions */}
                          {st === ReservationStatusEnum.PAYMENT_SUCCESSFUL && (
                            <>
                              <button
                                type="button"
                                onClick={() => setConfirmTarget(r)}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                              >
                                Xác nhận đơn
                              </button>
                              {isManager && (
                                <button
                                  type="button"
                                  onClick={() => setReassignTarget(r)}
                                  className="px-2 py-1 rounded-xl text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200"
                                >
                                  Đổi kho
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setCancelTarget(r)}
                                className="px-2 py-1 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600"
                              >
                                Hủy
                              </button>
                            </>
                          )}

                          {/* CONFIRMED actions */}
                          {st === ReservationStatusEnum.CONFIRMED && (
                            <>
                              {!r.arrivedAt && (
                                <button
                                  type="button"
                                  onClick={() => setMarkArrivedTarget(r)}
                                  className="px-2.5 py-1 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm flex items-center gap-1"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  Đã đến
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => void handleCreateContractDirectly(r)}
                                disabled={creatingContractId === r.id}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 shadow-sm flex items-center gap-1"
                              >
                                {creatingContractId === r.id ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FileCheck2 className="w-3 h-3" />
                                )}
                                Lập HĐ
                              </button>

                              {isManager && (
                                <button
                                  type="button"
                                  onClick={() => setAssignStaffTarget(r)}
                                  className="p-1 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                                  title="Đổi nhân viên tiếp đón"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {isManager && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setExtendGraceTarget(r)}
                                    className="p-1 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50"
                                    title="Gia hạn ân hạn"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setReassignTarget(r)}
                                    className="p-1 rounded-xl border border-sky-200 text-sky-700 hover:bg-sky-50"
                                    title="Đổi kho sự cố"
                                  >
                                    <Boxes className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setForceCancelTarget(r)}
                                    className="p-1 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50"
                                    title="Hủy khẩn cấp sự cố"
                                  >
                                    <Flame className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {/* OVERDUE actions */}
                          {st === ReservationStatusEnum.OVERDUE && (
                            <>
                              {!r.arrivedAt && (
                                <button
                                  type="button"
                                  onClick={() => setMarkArrivedTarget(r)}
                                  className="px-2.5 py-1 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm"
                                >
                                  Đã đến
                                </button>
                              )}

                              {r.arrivedAt && (
                                <button
                                  type="button"
                                  onClick={() => void handleCreateContractDirectly(r)}
                                  disabled={creatingContractId === r.id}
                                  className="px-2.5 py-1 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 shadow-sm flex items-center gap-1"
                                >
                                  {creatingContractId === r.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <FileCheck2 className="w-3 h-3" />
                                  )}
                                  Lập HĐ
                                </button>
                              )}

                              {isManager && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setExtendGraceTarget(r)}
                                    className="p-1 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50"
                                    title="Gia hạn ân hạn"
                                  >
                                    <Clock className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setForceCancelTarget(r)}
                                    className="p-1 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50"
                                    title="Hủy khẩn cấp"
                                  >
                                    <Flame className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          {/* CANCELLED / EXPIRED with pending refund */}
                          {(st === ReservationStatusEnum.CANCELLED ||
                            st === ReservationStatusEnum.EXPIRED) &&
                            r.refundStatus === "pending" &&
                            isManager && (
                              <button
                                type="button"
                                onClick={() => setConfirmRefundTarget(r)}
                                className="px-2.5 py-1 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center gap-1"
                              >
                                <Banknote className="w-3 h-3" />
                                Hoàn cọc
                              </button>
                            )}

                          {/* Detail button */}
                          <button
                            type="button"
                            onClick={() => setDetailTarget(r)}
                            className="p-1 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
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
        {pagination.totalItems > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              {t("pagination.showing")}{" "}
              <strong className="text-slate-800">
                {(pagination.page - 1) * pagination.limit + 1}
              </strong>{" "}
              -{" "}
              <strong className="text-slate-800">
                {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
              </strong>{" "}
              {t("pagination.of")}{" "}
              <strong className="text-slate-800">{pagination.totalItems}</strong>{" "}
              {t("pagination.items")}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 rounded-xl font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("pagination.prev")}
              </button>
              <span className="font-bold text-slate-700 px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3.5 py-1.5 rounded-xl font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("pagination.next")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Detail Sheet / Drawer */}
      <ReservationDetailSheet
        isOpen={Boolean(detailTarget)}
        onClose={() => setDetailTarget(null)}
        reservation={detailTarget}
        offerings={offerings}
        nowMs={nowMs}
        portalBase={portalBase}
        isCreatingContract={detailTarget ? creatingContractId === detailTarget.id : false}
        onOpenConfirm={(r) => setConfirmTarget(r)}
        onOpenMarkArrived={(r) => setMarkArrivedTarget(r)}
        onOpenExtendGrace={(r) => setExtendGraceTarget(r)}
        onOpenReassignUnit={(r) => setReassignTarget(r)}
        onOpenForceCancel={(r) => setForceCancelTarget(r)}
        onOpenConfirmRefund={(r) => setConfirmRefundTarget(r)}
        onOpenCancel={(r) => setCancelTarget(r)}
        onOpenManualPayment={(r) => setManualPaymentTarget(r)}
        onOpenAssignStaff={isManager ? (r) => setAssignStaffTarget(r) : undefined}
        onOpenCreateContract={(r) => void handleCreateContractDirectly(r)}
      />

      {/* Section 4: Action Modals */}
      <ConfirmReservationModal
        key={confirmTarget?.id ?? "confirm-modal"}
        isOpen={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        reservation={confirmTarget}
      />

      <MarkCustomerArrivedModal
        key={markArrivedTarget?.id ?? "mark-arrived-modal"}
        isOpen={Boolean(markArrivedTarget)}
        onClose={() => setMarkArrivedTarget(null)}
        reservation={markArrivedTarget}
      />

      <ExtendGracePeriodModal
        key={extendGraceTarget?.id ?? "extend-grace-modal"}
        isOpen={Boolean(extendGraceTarget)}
        onClose={() => setExtendGraceTarget(null)}
        reservation={extendGraceTarget}
      />

      <ReassignStorageUnitModal
        key={reassignTarget?.id ?? "reassign-unit-modal"}
        isOpen={Boolean(reassignTarget)}
        onClose={() => setReassignTarget(null)}
        reservation={reassignTarget}
      />

      <ForceCancelReservationModal
        key={forceCancelTarget?.id ?? "force-cancel-modal"}
        isOpen={Boolean(forceCancelTarget)}
        onClose={() => setForceCancelTarget(null)}
        reservation={forceCancelTarget}
      />

      <ConfirmRefundModal
        key={confirmRefundTarget?.id ?? "confirm-refund-modal"}
        isOpen={Boolean(confirmRefundTarget)}
        onClose={() => setConfirmRefundTarget(null)}
        reservation={confirmRefundTarget}
      />

      <CancelReservationModal
        key={cancelTarget?.id ?? "cancel-modal"}
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        reservation={cancelTarget}
      />

      <ManualPaymentConfirmModal
        key={manualPaymentTarget?.id ?? "manual-payment-modal"}
        isOpen={Boolean(manualPaymentTarget)}
        onClose={() => setManualPaymentTarget(null)}
        reservation={manualPaymentTarget}
      />

      <AssignReservationStaffModal
        key={assignStaffTarget?.id ?? "assign-staff-modal"}
        isOpen={Boolean(assignStaffTarget)}
        onClose={() => setAssignStaffTarget(null)}
        reservation={assignStaffTarget}
      />
    </div>
  );
};
