"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertCircle,
  ArrowUpDown,
  Boxes,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Eye,
  FileCheck2,
  Inbox,
  Layers,
  MapPin,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  X,
  XCircle,
} from "lucide-react";
import { AppApiError } from "@/lib/api/axios";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useFacilityOfferings, useMyFacility } from "@/features/storage-unit-management/hooks";
import {
  useCompleteReservation,
  useManagerReservationStats,
  useManagerReservations,
  useReceiveReservation,
} from "../hooks";
import {
  MESSAGE_CODE,
  ReservationStatusEnum,
  type ManagerReservationFilterParams,
  type ManagerReservationQuickTab,
  type ReservationResponse,
  type ReservationSortBy,
} from "../types";
import { formatDateOnly, formatDateTime, formatRentalScheduleLabel, formatVnd } from "../utils";
import { AssignStorageUnitModal } from "./AssignStorageUnitModal";
import {
  CancelReservationModal,
  ConfirmReservationModal,
  ManualPaymentConfirmModal,
  RejectReservationModal,
} from "./ReservationActionModals";
import { ReservationDetailSheet } from "./ReservationDetailSheet";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { CreateContractFromReservationModal } from "@/features/contract-management/components/CreateContractFromReservationModal";

const PAGE_LIMIT = 10;

const FILTER_CONTROL =
  "bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-700 text-xs font-medium py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all";

const ALL_RESERVATION_STATUSES: ReservationStatusEnum[] = [
  ReservationStatusEnum.PENDING,
  ReservationStatusEnum.RECEIVED,
  ReservationStatusEnum.PENDING_PAYMENT,
  ReservationStatusEnum.PAYMENT_FAILED,
  ReservationStatusEnum.PAYMENT_SUCCESSFUL,
  ReservationStatusEnum.CONFIRMED,
  ReservationStatusEnum.COMPLETED,
  ReservationStatusEnum.CANCELLED,
  ReservationStatusEnum.REJECTED,
  ReservationStatusEnum.EXPIRED,
];

export const ManagerReservationsView: React.FC = () => {
  const t = useTranslations("facilityManager.reservations");
  const tActions = useTranslations("facilityManager.reservations.actions");
  const tStatuses = useTranslations("facilityManager.reservations.statuses");
  const tBilling = useTranslations("facilityManager.reservations.billingUnit");
  const tErrors = useTranslations("facilityManager.reservations.errors");
  const locale = useLocale() === "en" ? "en" : "vi";
  const getErrorMessage = useApiErrorMessage();

  const { data: facility, isLoading: isLoadingFacility } = useMyFacility();
  const facilityId = facility?.id;

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

  // Offerings of the manager's facility
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

  const queryParams: ManagerReservationFilterParams | null = facilityId
    ? {
        facilityId,
        page,
        limit: PAGE_LIMIT,
        status: statusFilter || undefined,
        reservationCode: debouncedCode || undefined,
        facilityUnitTypeOfferingId: offeringIdFilter || undefined,
        startDateFrom: startDateFromIso,
        startDateTo: startDateToIso,
        sortBy,
        sortOrder,
      }
    : null;

  const listQuery = useManagerReservations(queryParams);
  const stats = useManagerReservationStats(facilityId);

  const receiveMutation = useReceiveReservation();
  const completeMutation = useCompleteReservation();

  // Active modals & drawer state
  const [detailTarget, setDetailTarget] = useState<ReservationResponse | null>(null);
  const [assignTarget, setAssignTarget] = useState<ReservationResponse | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ReservationResponse | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ReservationResponse | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ReservationResponse | null>(null);
  const [manualPaymentTarget, setManualPaymentTarget] = useState<ReservationResponse | null>(null);
  const [createContractTarget, setCreateContractTarget] = useState<ReservationResponse | null>(
    null
  );

  const [bannerFeedback, setBannerFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setBannerFeedback({ type, message });
    setTimeout(() => {
      setBannerFeedback((prev) => (prev?.message === message ? null : prev));
    }, 4000);
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

  const handleQuickReceive = async (reservation: ReservationResponse) => {
    try {
      await receiveMutation.mutateAsync(reservation.id);
      showFeedback("success", t("feedback.receiveSuccess", { code: reservation.reservationCode }));
    } catch (err: unknown) {
      if (err instanceof AppApiError && err.messageCode === MESSAGE_CODE.MESSAGE_CODE_301) {
        void listQuery.refetch();
      }
      showFeedback(
        "error",
        getErrorMessage(err, {
          [MESSAGE_CODE.MESSAGE_CODE_301]: tErrors("statusChanged"),
        })
      );
    }
  };

  const handleQuickComplete = async (reservation: ReservationResponse) => {
    try {
      await completeMutation.mutateAsync(reservation.id);
      showFeedback("success", t("feedback.completeSuccess", { code: reservation.reservationCode }));
      if (detailTarget?.id === reservation.id) {
        setDetailTarget(null);
      }
    } catch (err: unknown) {
      if (err instanceof AppApiError && err.messageCode === MESSAGE_CODE.MESSAGE_CODE_301) {
        void listQuery.refetch();
      }
      showFeedback(
        "error",
        getErrorMessage(err, {
          [MESSAGE_CODE.MESSAGE_CODE_301]: tErrors("statusChanged"),
        })
      );
    }
  };

  if (!isLoadingFacility && !facilityId) {
    return (
      <div className="bg-white rounded-3xl border border-amber-200 p-10 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-lg font-extrabold text-slate-900">{t("noFacility.title")}</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">{t("noFacility.description")}</p>
      </div>
    );
  }

  const items = listQuery.data?.items ?? [];
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
      key: "PENDING",
      label: t("quickTabs.pending"),
      count: stats.pending,
      icon: Sparkles,
      accent: "text-amber-700 bg-amber-50",
    },
    {
      key: "RECEIVED",
      label: t("quickTabs.received"),
      count: stats.received,
      icon: Boxes,
      accent: "text-sky-700 bg-sky-50",
    },
    {
      key: "AWAITING_DEPOSIT",
      label: t("quickTabs.awaitingDeposit"),
      count: stats.awaitingDeposit,
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
      key: "CLOSED",
      label: t("quickTabs.closed"),
      count: stats.closed,
      icon: PackageCheck,
      accent: "text-indigo-700 bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {t("subtitle", { facility: facility?.name ?? "..." })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void listQuery.refetch();
          }}
          disabled={listQuery.isFetching}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-white border border-slate-200/80 hover:border-teal-300 hover:text-teal-700 shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${listQuery.isFetching ? "animate-spin" : ""}`} />
          {t("refresh")}
        </button>
      </div>

      {/* Feedback Banner */}
      {bannerFeedback && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-xs font-bold shadow-sm ${
            bannerFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {bannerFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{bannerFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setBannerFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Section 1A: Static Statistical Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {quickTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <div
              key={tab.key}
              className="text-left p-3.5 rounded-2xl border bg-white border-slate-100 shadow-sm flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between gap-2 w-full">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${tab.accent}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-lg font-extrabold tracking-tight text-slate-900">
                  {stats.isLoading ? "…" : tab.count}
                </span>
              </div>
              <p className="text-xs font-bold leading-snug line-clamp-2 text-slate-600">
                {tab.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Section 1B: Detailed Search & Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search by reservationCode */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder={t("filters.searchCodePlaceholder")}
              className={`${FILTER_CONTROL} w-full pl-9`}
            />
          </div>

          {/* Exact Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => {
              const next = e.target.value as ReservationStatusEnum | "";
              setStatusFilter(next);
              setPage(1);
            }}
            className={FILTER_CONTROL}
          >
            <option value="">{t("filters.allStatuses")}</option>
            {ALL_RESERVATION_STATUSES.map((st) => (
              <option key={st} value={st}>
                {tStatuses(st)}
              </option>
            ))}
          </select>

          {/* Offering / Unit Type Select */}
          <select
            value={offeringIdFilter}
            onChange={(e) => {
              setOfferingIdFilter(e.target.value);
              setPage(1);
            }}
            className={FILTER_CONTROL}
          >
            <option value="">{t("filters.allOfferings")}</option>
            {offerings.map((off) => (
              <option key={off.id} value={off.id}>
                {off.unitType.name} ({formatVnd(off.pricePerUnit)}/{tBilling(off.billingUnit)})
              </option>
            ))}
          </select>

          {/* Start Date From */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">{t("filters.startFrom")}:</span>
            <input
              type="date"
              value={startDateFromInput}
              onChange={(e) => {
                setStartDateFromInput(e.target.value);
                setPage(1);
              }}
              className={FILTER_CONTROL}
            />
          </div>

          {/* Start Date To */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">{t("filters.startTo")}:</span>
            <input
              type="date"
              value={startDateToInput}
              onChange={(e) => {
                setStartDateToInput(e.target.value);
                setPage(1);
              }}
              className={FILTER_CONTROL}
            />
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as ReservationSortBy);
              setPage(1);
            }}
            className={FILTER_CONTROL}
          >
            <option value="createdAt">{t("filters.sortBy.createdAt")}</option>
            <option value="startDate">{t("filters.sortBy.startDate")}</option>
            <option value="totalAmount">{t("filters.sortBy.totalAmount")}</option>
            <option value="updatedAt">{t("filters.sortBy.updatedAt")}</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
            className={`${FILTER_CONTROL} inline-flex items-center gap-1.5`}
            title={t("filters.toggleSortOrder")}
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            {sortOrder === "desc" ? t("filters.desc") : t("filters.asc")}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              {t("filters.clear")}
            </button>
          )}
        </div>
      </div>

      {/* Section 2: Reservations Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {listQuery.isLoading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : listQuery.isError ? (
          <div className="p-10 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-900">{t("loadError")}</p>
            <button
              type="button"
              onClick={() => listQuery.refetch()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {t("retry")}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">{t("empty.title")}</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{t("empty.description")}</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100"
              >
                {t("filters.clear")}
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">{t("table.codeAndDate")}</th>
                  <th className="py-3.5 px-4">{t("table.customer")}</th>
                  <th className="py-3.5 px-4">{t("table.packageAndSchedule")}</th>
                  <th className="py-3.5 px-4">{t("table.storageUnit")}</th>
                  <th className="py-3.5 px-4">{t("table.financials")}</th>
                  <th className="py-3.5 px-4">{t("table.status")}</th>
                  <th className="py-3.5 px-4 text-right">{t("table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.map((item) => {
                  const unitTypeName =
                    offeringMap.get(item.facilityUnitTypeOfferingId) ||
                    (item.offering?.unitTypeId
                      ? offeringMap.get(item.offering.unitTypeId)
                      : undefined) ||
                    t("table.standardPackage");

                  const st = item.status;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group align-top"
                    >
                      {/* 1. Code & CreatedAt */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setDetailTarget(item)}
                          className="font-mono text-xs font-extrabold text-emerald-700 hover:text-emerald-800 hover:underline"
                        >
                          {item.reservationCode}
                        </button>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {formatDateTime(item.createdAt, locale)}
                        </p>
                      </td>

                      {/* 2. Customer */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-[180px]">
                              {item.customer?.name ?? "—"}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {item.customer?.phoneNumber || "—"}
                            </p>
                            {item.customer?.email && (
                              <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                                {item.customer.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. Offering & Rental Schedule */}
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900">{unitTypeName}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {formatVnd(item.basePrice)} / {tBilling(item.billingUnit)}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <Calendar className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>{formatDateOnly(item.startDate, locale)}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-700">
                            {formatRentalScheduleLabel(
                              item.rentalDuration,
                              item.billingUnit,
                              locale
                            )}
                          </span>
                        </div>
                        {item.amenities?.length > 0 && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            +{item.amenities.length} {t("table.amenitiesCount")}
                          </span>
                        )}
                      </td>

                      {/* 4. Physical Storage Unit */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {item.storageUnit ? (
                          <div className="inline-flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-extrabold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                              <Boxes className="w-3.5 h-3.5 text-emerald-600" />
                              {item.storageUnit.unitNumber}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                              <Layers className="w-3 h-3 text-slate-400" />
                              {t("table.floorShort", { floor: item.storageUnit.floor })}
                              {item.storageUnit.zone && (
                                <>
                                  <span>•</span>
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  {t("table.zoneShort", { zone: item.storageUnit.zone })}
                                </>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 text-slate-500 border border-dashed border-slate-200">
                            {t("table.unassigned")}
                          </span>
                        )}
                      </td>

                      {/* 5. Financials & Deposit */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="text-[11px] text-slate-500">
                          {t("table.depositLabel")}:{" "}
                          <strong className="text-emerald-700 font-extrabold">
                            {formatVnd(item.depositAmount)}
                          </strong>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {t("table.totalLabel")}:{" "}
                          <strong className="text-slate-900 font-bold">
                            {formatVnd(item.totalAmount)}
                          </strong>
                        </p>
                        {(item.paidAmount ?? 0) > 0 && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/70">
                            <CheckCircle2 className="w-3 h-3" />
                            {t("table.paidBadge")}: {formatVnd(item.paidAmount)}
                          </span>
                        )}
                      </td>

                      {/* 6. Status & Hold Countdown */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <ReservationStatusBadge
                          status={item.status}
                          expiresAt={item.expiresAt}
                          nowMs={nowMs}
                          showCountdown
                        />
                      </td>

                      {/* 7. Quick Contextual Actions */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap max-w-[260px]">
                          {/* PENDING actions */}
                          {st === ReservationStatusEnum.PENDING && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleQuickReceive(item)}
                                disabled={receiveMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors"
                              >
                                <Inbox className="w-3 h-3" />
                                {tActions("receive")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setAssignTarget(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                              >
                                <Boxes className="w-3 h-3" />
                                {tActions("assignUnitShort")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                              >
                                <XCircle className="w-3 h-3" />
                                {tActions("reject")}
                              </button>
                            </>
                          )}

                          {/* RECEIVED actions */}
                          {st === ReservationStatusEnum.RECEIVED && (
                            <>
                              <button
                                type="button"
                                onClick={() => setAssignTarget(item)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                              >
                                <Boxes className="w-3 h-3" />
                                {tActions("assignUnit")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectTarget(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                              >
                                <XCircle className="w-3 h-3" />
                                {tActions("reject")}
                              </button>
                            </>
                          )}

                          {/* PENDING_PAYMENT / PAYMENT_FAILED actions */}
                          {(st === ReservationStatusEnum.PENDING_PAYMENT ||
                            st === ReservationStatusEnum.PAYMENT_FAILED) && (
                            <>
                              <button
                                type="button"
                                onClick={() => setManualPaymentTarget(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100"
                              >
                                <CreditCard className="w-3 h-3" />
                                {tActions("verifyPayment")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setCancelTarget(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                              >
                                <XCircle className="w-3 h-3" />
                                {tActions("cancel")}
                              </button>
                            </>
                          )}

                          {/* PAYMENT_SUCCESSFUL actions */}
                          {st === ReservationStatusEnum.PAYMENT_SUCCESSFUL && (
                            <button
                              type="button"
                              onClick={() => setConfirmTarget(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              {tActions("confirmOrder")}
                            </button>
                          )}

                          {/* CONFIRMED actions */}
                          {st === ReservationStatusEnum.CONFIRMED && (
                            <>
                              {item.storageUnitId ? (
                                <button
                                  type="button"
                                  onClick={() => setCreateContractTarget(item)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                                >
                                  <FileCheck2 className="w-3 h-3" />
                                  {tActions("createContractShort")}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleQuickComplete(item)}
                                  disabled={completeMutation.isPending}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50"
                                >
                                  <FileCheck2 className="w-3 h-3" />
                                  {tActions("completeShort")}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setCancelTarget(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                              >
                                <XCircle className="w-3 h-3" />
                                {tActions("cancel")}
                              </button>
                            </>
                          )}

                          {/* Always View Detail */}
                          <button
                            type="button"
                            onClick={() => setDetailTarget(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200/80 transition-colors"
                            title={tActions("viewDetail")}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {tActions("viewDetail")}
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
        onReceive={handleQuickReceive}
        onOpenAssignUnit={(r) => setAssignTarget(r)}
        onOpenReject={(r) => setRejectTarget(r)}
        onOpenConfirm={(r) => setConfirmTarget(r)}
        onOpenCancel={(r) => setCancelTarget(r)}
        onOpenManualPayment={(r) => setManualPaymentTarget(r)}
        onOpenCreateContract={(r) => setCreateContractTarget(r)}
        onComplete={handleQuickComplete}
        isReceiving={receiveMutation.isPending}
        isCompleting={completeMutation.isPending}
      />

      {/* Section 4: Assign Storage Unit Modal */}
      <AssignStorageUnitModal
        key={assignTarget?.id ?? "assign-unit-modal"}
        isOpen={Boolean(assignTarget)}
        onClose={() => setAssignTarget(null)}
        reservation={assignTarget}
        offerings={offerings}
        onSwitchToReject={(r) => setRejectTarget(r)}
      />

      {/* Section 5.1: Reject Modal */}
      <RejectReservationModal
        key={rejectTarget?.id ?? "reject-modal"}
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        reservation={rejectTarget}
      />

      {/* Section 5.2: Confirm Modal */}
      <ConfirmReservationModal
        key={confirmTarget?.id ?? "confirm-modal"}
        isOpen={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        reservation={confirmTarget}
      />

      {/* Section 5.3: Cancel Modal */}
      <CancelReservationModal
        key={cancelTarget?.id ?? "cancel-modal"}
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        reservation={cancelTarget}
      />

      {/* Section 5.4: Manual Payment Confirmation Modal */}
      <ManualPaymentConfirmModal
        key={manualPaymentTarget?.id ?? "manual-payment-modal"}
        isOpen={Boolean(manualPaymentTarget)}
        onClose={() => setManualPaymentTarget(null)}
        reservation={manualPaymentTarget}
      />

      {/* Section 5.5: Create Contract & Assign Check-in Staff Modal */}
      <CreateContractFromReservationModal
        key={createContractTarget?.id ?? "create-contract-from-reservation-modal"}
        isOpen={Boolean(createContractTarget)}
        onClose={() => setCreateContractTarget(null)}
        reservation={createContractTarget}
        portalBase="facility-manager"
      />
    </div>
  );
};
