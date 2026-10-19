"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  FileCheck2,
  Search,
  Building2,
  RotateCw,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Eye,
  ArrowUpDown,
  X,
  Layers,
  Sparkles,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useFacilities } from "@/features/facility-management/hooks";
import { useApprovalRequests, useApprovalStats, approvalCenterKeys } from "../hooks";
import {
  ApprovalRequestActionEnum,
  ApprovalRequestStatusEnum,
  ApprovalRequestTargetTypeEnum,
  ApprovalReviewDecisionEnum,
  type ApprovalRequestDetail,
} from "../types";
import { ApprovalDiffModal } from "./ApprovalDiffModal";
import { ReviewConfirmModal } from "./ReviewConfirmModal";

export const ApprovalTable = () => {
  const t = useTranslations("businessOps.approvals");
  const queryClient = useQueryClient();

  // Query state
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [facilityId, setFacilityId] = useState<string>("ALL");
  const [targetType, setTargetType] = useState<string>("ALL");
  const [status, setStatus] = useState<string>("ALL");
  const [sortKey, setSortKey] = useState<string>("createdAtDesc");

  // Modal states
  const [diffRequestId, setDiffRequestId] = useState<string | null>(null);
  const [reviewRequest, setReviewRequest] = useState<ApprovalRequestDetail | null>(null);
  const [reviewDecision, setReviewDecision] = useState<ApprovalReviewDecisionEnum | null>(null);

  // Facilities list for filter
  const { data: facilitiesData } = useFacilities({ limit: 100 });

  // Map sort
  const sortParams = useMemo(() => {
    switch (sortKey) {
      case "createdAtAsc":
        return { sortBy: "createdAt" as const, sortOrder: "asc" as const };
      case "statusDesc":
        return { sortBy: "status" as const, sortOrder: "desc" as const };
      case "targetTypeDesc":
        return { sortBy: "targetType" as const, sortOrder: "desc" as const };
      case "createdAtDesc":
      default:
        return { sortBy: "createdAt" as const, sortOrder: "desc" as const };
    }
  }, [sortKey]);

  // Fetch approval requests
  const { data, isLoading, isFetching, refetch } = useApprovalRequests({
    page,
    limit: pageSize,
    facilityId: facilityId !== "ALL" ? facilityId : undefined,
    targetType: targetType !== "ALL" ? (targetType as ApprovalRequestTargetTypeEnum) : undefined,
    status: status !== "ALL" ? (status as ApprovalRequestStatusEnum) : undefined,
    search: debouncedSearch || undefined,
    ...sortParams,
  });

  const requests = data?.items || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: pageSize,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // KPI Calculations (Thống kê độc lập, không bị reset về 0 khi chọn tab lọc trạng thái)
  const stats = useApprovalStats(facilityId);

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: approvalCenterKeys.all });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setPage(1);
  };

  const openReviewModal = (
    request: ApprovalRequestDetail,
    decision: ApprovalReviewDecisionEnum
  ) => {
    setReviewRequest(request);
    setReviewDecision(decision);
  };

  const renderStatusBadge = (st: ApprovalRequestStatusEnum) => {
    switch (st) {
      case ApprovalRequestStatusEnum.PENDING:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <Clock className="w-3 h-3 text-amber-600" />
            {t(`status.${st}`)}
          </span>
        );
      case ApprovalRequestStatusEnum.APPROVED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {t(`status.${st}`)}
          </span>
        );
      case ApprovalRequestStatusEnum.REJECTED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <XCircle className="w-3 h-3 text-rose-600" />
            {t(`status.${st}`)}
          </span>
        );
      case ApprovalRequestStatusEnum.CANCELLED:
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <Ban className="w-3 h-3 text-slate-400" />
            {t(`status.${st}`)}
          </span>
        );
    }
  };

  const renderTargetBadge = (type: ApprovalRequestTargetTypeEnum) => {
    let icon = <FileCheck2 className="w-3 h-3" />;
    let colorClass = "bg-slate-100 text-slate-700 border-slate-200";

    if (type === ApprovalRequestTargetTypeEnum.FACILITY_UNIT_TYPE_OFFERING) {
      icon = <Tag className="w-3 h-3 text-emerald-600" />;
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    } else if (type === ApprovalRequestTargetTypeEnum.FACILITY_AMENITY_OFFERING) {
      icon = <Sparkles className="w-3 h-3 text-teal-600" />;
      colorClass = "bg-teal-50 text-teal-700 border-teal-200/80";
    } else if (type === ApprovalRequestTargetTypeEnum.UNIT_TYPE) {
      icon = <Layers className="w-3 h-3 text-emerald-600" />;
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${colorClass}`}
      >
        {icon}
        {t(`targetType.${type}`)}
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
              <FileCheck2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            {t("title")}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t("subtitle")}</p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Card (Amber - High Priority) */}
        <div
          onClick={() => {
            setStatus(ApprovalRequestStatusEnum.PENDING);
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-sm flex items-center gap-4 cursor-pointer transition-all hover:shadow-md ${
            status === ApprovalRequestStatusEnum.PENDING
              ? "border-amber-400 ring-2 ring-amber-400/20"
              : "border-slate-100"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("stats.pending")}
            </div>
            <div className="text-2xl font-black text-amber-600 mt-0.5">{stats.pending}</div>
          </div>
        </div>

        {/* Approved Card (Emerald) */}
        <div
          onClick={() => {
            setStatus(ApprovalRequestStatusEnum.APPROVED);
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-sm flex items-center gap-4 cursor-pointer transition-all hover:shadow-md ${
            status === ApprovalRequestStatusEnum.APPROVED
              ? "border-emerald-400 ring-2 ring-emerald-400/20"
              : "border-slate-100"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("stats.approved")}
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{stats.approved}</div>
          </div>
        </div>

        {/* Rejected Card (Rose) */}
        <div
          onClick={() => {
            setStatus(ApprovalRequestStatusEnum.REJECTED);
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-sm flex items-center gap-4 cursor-pointer transition-all hover:shadow-md ${
            status === ApprovalRequestStatusEnum.REJECTED
              ? "border-rose-400 ring-2 ring-rose-400/20"
              : "border-slate-100"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("stats.rejected")}
            </div>
            <div className="text-2xl font-black text-rose-600 mt-0.5">{stats.rejected}</div>
          </div>
        </div>

        {/* Total Card */}
        <div
          onClick={() => {
            setStatus("ALL");
            setPage(1);
          }}
          className={`bg-white rounded-3xl p-5 border shadow-sm flex items-center gap-4 cursor-pointer transition-all hover:shadow-md ${
            status === "ALL" ? "border-teal-400 ring-2 ring-teal-400/20" : "border-slate-100"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("stats.total")}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{stats.total}</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 relative flex items-center min-w-[260px] max-w-md"
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
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <span>{t("searchButton")}</span>
              </button>
            </div>
          </form>

          {/* Filters Selectors */}
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

            {/* Target Type Filter */}
            <select
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 hover:bg-slate-100/70 text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3 rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">{t("targetTypeFilter.all")}</option>
              <option value={ApprovalRequestTargetTypeEnum.FACILITY_UNIT_TYPE_OFFERING}>
                {t("targetTypeFilter.offering")}
              </option>
              <option value={ApprovalRequestTargetTypeEnum.FACILITY_AMENITY_OFFERING}>
                {t("targetTypeFilter.facilityAmenity")}
              </option>
              <option value={ApprovalRequestTargetTypeEnum.UNIT_TYPE}>
                {t("targetTypeFilter.unitType")}
              </option>
              <option value={ApprovalRequestTargetTypeEnum.AMENITY}>
                {t("targetTypeFilter.amenity")}
              </option>
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
              <option value={ApprovalRequestStatusEnum.PENDING}>{t("statusFilter.pending")}</option>
              <option value={ApprovalRequestStatusEnum.APPROVED}>
                {t("statusFilter.approved")}
              </option>
              <option value={ApprovalRequestStatusEnum.REJECTED}>
                {t("statusFilter.rejected")}
              </option>
              <option value={ApprovalRequestStatusEnum.CANCELLED}>
                {t("statusFilter.cancelled")}
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
                <option value="statusDesc">{t("sort.statusDesc")}</option>
                <option value="targetTypeDesc">{t("sort.targetTypeDesc")}</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              title={t("refresh")}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
            >
              <RotateCw
                className={`w-4 h-4 ${isFetching ? "animate-spin text-emerald-600" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Active Search/Filter banner */}
        {debouncedSearch && (
          <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/60 rounded-xl px-3.5 py-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2 font-medium">
              <Search className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {t("searchResultsCount", {
                  count: requests.length,
                  query: debouncedSearch,
                })}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer inline-flex items-center gap-1 shrink-0"
            >
              <X className="w-3 h-3" />
              {t("clearFilter")}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">{t("table.facilityAndRequester")}</th>
                <th className="py-4 px-6">{t("table.targetAndAction")}</th>
                <th className="py-4 px-6">{t("table.reason")}</th>
                <th className="py-4 px-6">{t("table.status")}</th>
                <th className="py-4 px-6">{t("table.createdAt")}</th>
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
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <FileCheck2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">{t("empty.title")}</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {t("empty.description")}
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Facility & Requester */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {req.facility?.name || "Toàn hệ thống"}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {req.requester?.name || req.requesterId}
                        {req.requester?.role && ` • ${req.requester.role}`}
                      </div>
                    </td>

                    {/* Target & Action */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col items-start gap-1">
                        {renderTargetBadge(req.targetType)}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                            req.action === ApprovalRequestActionEnum.CREATE
                              ? "bg-teal-50 text-teal-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {t(`action.${req.action}`)}
                        </span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-4 px-6 max-w-xs">
                      <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                        {req.reason}
                      </p>
                      {req.rejectionReason && (
                        <p className="text-[11px] text-rose-600 mt-1 line-clamp-1">
                          <strong>Lý do từ chối:</strong> {req.rejectionReason}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">{renderStatusBadge(req.status)}</td>

                    {/* Created At */}
                    <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Xem chi tiết / Diff View Button */}
                        <button
                          type="button"
                          onClick={() => setDiffRequestId(req.id)}
                          title={t("actions.viewDiff")}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-teal-700 text-xs font-semibold border border-slate-200/80 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{t("actions.viewDiff")}</span>
                        </button>

                        {/* Fast actions for PENDING status */}
                        {req.status === ApprovalRequestStatusEnum.PENDING && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openReviewModal(req, ApprovalReviewDecisionEnum.APPROVE)
                              }
                              title={t("actions.approve")}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{t("actions.approve")}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openReviewModal(req, ApprovalReviewDecisionEnum.REJECT)
                              }
                              title={t("actions.reject")}
                              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{t("actions.reject")}</span>
                            </button>
                          </>
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
        {!isLoading && requests.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              {t("pagination.pageInfo", {
                page: pagination.page,
                totalPages: pagination.totalPages,
                totalItems: pagination.totalItems,
              })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {t("pagination.prev")}
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage}
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

      {/* Diff View Modal */}
      <ApprovalDiffModal
        requestId={diffRequestId}
        onClose={() => setDiffRequestId(null)}
        onOpenReview={(req, decision) => openReviewModal(req, decision)}
      />

      {/* Review Confirm Modal (Approve or Reject) */}
      <ReviewConfirmModal
        request={reviewRequest}
        decision={reviewDecision}
        isOpen={Boolean(reviewRequest && reviewDecision)}
        onClose={() => {
          setReviewRequest(null);
          setReviewDecision(null);
        }}
        onSuccess={() => {
          refetch();
          if (diffRequestId) setDiffRequestId(null);
        }}
      />
    </div>
  );
};
