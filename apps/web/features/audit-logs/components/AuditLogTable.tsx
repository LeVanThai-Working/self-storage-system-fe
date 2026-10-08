"use client";

import React, { useState, useMemo } from "react";
import { useAuditLogs } from "../hooks";
import type { AuditLogAction, AuditLogQueryParams, AuditLogStatus } from "../types";
import { Search, AlertCircle, RefreshCw, Eye } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { AuditLogDetailModal } from "./AuditLogDetailModal";

// ─── Action colour map (keys match backend enum values) ──────────────────────
const ACTION_COLORS: Record<string, string> = {
  login: "bg-teal-50 text-teal-700",
  logout: "bg-slate-100 text-slate-600",
  register: "bg-green-50 text-green-700",
  login_google: "bg-blue-50 text-blue-700",
  create: "bg-emerald-50 text-emerald-700",
  update: "bg-blue-50 text-blue-600",
  delete: "bg-red-50 text-red-700",
  restore: "bg-teal-50 text-teal-600",
  change_password: "bg-amber-50 text-amber-700",
  forgot_password: "bg-amber-50 text-amber-600",
  reset_password: "bg-amber-50 text-amber-700",
  send_otp: "bg-slate-100 text-slate-500",
  toggle_maintenance: "bg-orange-50 text-orange-700",
  approve: "bg-green-50 text-green-700",
  reject: "bg-red-50 text-red-600",
  cancel: "bg-red-50 text-red-500",
  assign_manager: "bg-purple-50 text-purple-700",
};

const ALL_ACTIONS = Object.keys(ACTION_COLORS);

const LIMIT = 15;

// ─── Helper: format ISO date/time based on locale ─────────────────────────────
const formatDateTime = (iso: string, locale: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(locale === "vi" ? "vi-VN" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${date}, ${time}`;
};

// ─── Skeleton row ─────────────────────────────────────────────────────────────
const SkeletonRow = () => (
  <tr>
    {[36, 160, 90, 70, 70, 100].map((w, i) => (
      <td key={i} className="px-5 py-2">
        <div className="h-3.5 bg-slate-100 rounded animate-pulse" style={{ width: w }} />
      </td>
    ))}
  </tr>
);

// ─── Main component ───────────────────────────────────────────────────────────
export const AuditLogTable = () => {
  const t = useTranslations("systemAdmin.auditLog");
  const locale = useLocale();

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const hasFilters = search || actionFilter || statusFilter || fromDate || toDate;

  const handleFilter =
    (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setter(e.target.value);
      setPage(1);
    };

  const queryParams = useMemo<AuditLogQueryParams>(
    () => ({
      page,
      limit: LIMIT,
      sortBy: "createdAt",
      sortOrder: "desc",
      ...(search && { search }),
      ...(actionFilter && { action: actionFilter as AuditLogAction }),
      ...(statusFilter && { status: statusFilter as AuditLogStatus }),
      ...(fromDate && { from: new Date(fromDate).toISOString() }),
      ...(toDate && { to: new Date(toDate + "T23:59:59").toISOString() }),
    }),
    [page, search, actionFilter, statusFilter, fromDate, toDate]
  );

  const { data, isLoading, isError, refetch } = useAuditLogs(queryParams);

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  const clearFilters = () => {
    setSearch("");
    setActionFilter("");
    setStatusFilter("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="w-full space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          {t("refresh")}
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input
              id="audit-search"
              type="text"
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={handleFilter(setSearch)}
              className="w-full bg-slate-50 border-none rounded-full py-2 pl-10 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Action filter */}
          <select
            id="audit-action-filter"
            value={actionFilter}
            onChange={handleFilter(setActionFilter)}
            className="bg-slate-50 border-none rounded-full py-2 px-4 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="">{t("allActions")}</option>
            {ALL_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {t(`actions.${a}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            id="audit-status-filter"
            value={statusFilter}
            onChange={handleFilter(setStatusFilter)}
            className="bg-slate-50 border-none rounded-full py-2 px-4 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="">{t("allStatus")}</option>
            <option value="success">{t("statusSuccess")}</option>
            <option value="failure">{t("statusFailure")}</option>
          </select>

          {/* From date */}
          <label className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
            {t("from")}
            <input
              id="audit-from-date"
              type="date"
              value={fromDate}
              onChange={handleFilter(setFromDate)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </label>

          {/* To date */}
          <label className="flex items-center gap-2 text-xs text-slate-500 whitespace-nowrap">
            {t("to")}
            <input
              id="audit-to-date"
              type="date"
              value={toDate}
              onChange={handleFilter(setToDate)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </label>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-400 hover:text-red-500 transition-colors underline underline-offset-2"
            >
              {t("clearFilters")}
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">
                  {t("columns.time")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t("columns.actor")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t("columns.action")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t("columns.resource")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t("columns.result")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {t("columns.ip")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                  {t("columns.details")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {/* Loading skeleton */}
              {isLoading && Array.from({ length: LIMIT }).map((_, i) => <SkeletonRow key={i} />)}

              {/* Error state */}
              {isError && !isLoading && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-10 h-10 text-red-300" />
                      <p className="text-sm font-medium text-red-500">{t("errorMessage")}</p>
                      <button
                        onClick={() => refetch()}
                        className="text-xs text-emerald-600 hover:underline"
                      >
                        {t("retry")}
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {!isLoading && !isError && items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-slate-400 text-sm">
                    {t("empty")}
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {!isLoading &&
                !isError &&
                items.map((log) => {
                  const colorClass = ACTION_COLORS[log.action] ?? "bg-gray-50 text-gray-600";
                  // Translate action label — fall back to raw value if key is unknown
                  const actionLabel = ALL_ACTIONS.includes(log.action)
                    ? t(`actions.${log.action}` as Parameters<typeof t>[0])
                    : log.action;
                  // Translate resource type label
                  const resourceKey = `resources.${log.resourceType}` as Parameters<typeof t>[0];
                  const resourceLabel = t(resourceKey, { default: log.resourceType });
                  const isSuccess = log.status === "success";

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Time */}
                      <td className="px-5 py-2">
                        <div className="font-mono text-sm text-slate-500 whitespace-nowrap">
                          {formatDateTime(log.createdAt, locale)}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="px-5 py-2">
                        {log.actorEmail ? (
                          <div>
                            <div
                              className="text-sm font-semibold text-slate-800 truncate max-w-[180px]"
                              title={log.actorEmail}
                            >
                              {log.actorEmail}
                            </div>
                            {log.actorRole && (
                              <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 mt-1 uppercase tracking-wider">
                                {log.actorRole.replace(/_/g, " ")}
                              </div>
                            )}
                          </div>
                        ) : log.actorId ? (
                          <div>
                            <div className="text-sm font-medium text-slate-600 truncate max-w-[180px]">
                              {t("unknownEmail")}
                            </div>
                            <div
                              className="text-[10px] text-slate-400 font-mono mt-1 truncate max-w-[150px]"
                              title={log.actorId}
                            >
                              ID: {log.actorId}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 italic">{t("guest")}</span>
                        )}
                      </td>

                      {/* Action badge */}
                      <td className="px-5 py-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize ${colorClass}`}
                        >
                          {actionLabel}
                        </span>
                      </td>

                      {/* Resource type */}
                      <td className="px-5 py-2">
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-medium">
                            {resourceLabel}
                          </span>
                          {log.resourceId && (
                            <div
                              className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[120px]"
                              title={log.resourceId}
                            >
                              ({log.resourceId})
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                            isSuccess
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              isSuccess ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          {isSuccess ? t("success") : t("failure")}
                        </span>
                      </td>

                      {/* IP */}
                      <td className="px-5 py-2">
                        {log.ip ? (
                          <span className="font-mono text-sm text-slate-600">{log.ip}</span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">N/A</span>
                        )}
                      </td>

                      {/* View Details Action */}
                      <td className="px-5 py-2 text-right">
                        <button
                          onClick={() => {
                            setSelectedLogId(log.id);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title={t("viewDetails")}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {pagination && pagination.totalItems > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              {t("total")}{" "}
              <span className="font-medium text-slate-700">{pagination.totalItems}</span>{" "}
              {t("records")}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage || isLoading}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t("prevPage")}
              >
                {t("prevPage")}
              </button>

              <span className="px-2 text-sm text-slate-500">
                {t("page")} <span className="font-medium text-slate-700">{page}</span> {t("of")}{" "}
                {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNextPage || isLoading}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label={t("nextPage")}
              >
                {t("nextPage")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      <AuditLogDetailModal
        id={selectedLogId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          // Wait for animation to finish before clearing ID to prevent flash of empty content
          setTimeout(() => setSelectedLogId(null), 300);
        }}
      />
    </div>
  );
};
