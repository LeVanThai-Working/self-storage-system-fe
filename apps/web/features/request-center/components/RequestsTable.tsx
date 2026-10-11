"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, CheckCircle2, XCircle, Ban, X, ChevronLeft, ChevronRight } from "lucide-react";
import { AppApiError } from "@/lib/api/axios";
import { useCancelApprovalRequest, useMyRequests } from "../hooks";
import { ApprovalRequestStatusEnum, type ApprovalRequestResponse } from "../types";
import { RequestDetailModal } from "./RequestDetailModal";

const STATUS_BADGE: Record<ApprovalRequestStatusEnum, { icon: typeof Clock; className: string }> = {
  [ApprovalRequestStatusEnum.PENDING]: {
    icon: Clock,
    className: "bg-amber-50 text-amber-700 border-amber-200/80",
  },
  [ApprovalRequestStatusEnum.APPROVED]: {
    icon: CheckCircle2,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  },
  [ApprovalRequestStatusEnum.REJECTED]: {
    icon: XCircle,
    className: "bg-rose-50 text-rose-700 border-rose-200/80",
  },
  [ApprovalRequestStatusEnum.CANCELLED]: {
    icon: Ban,
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export const RequestsTable = () => {
  const t = useTranslations("facilityManager.requests");
  const [page, setPage] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [detailRequest, setDetailRequest] = useState<ApprovalRequestResponse | null>(null);

  const { data, isLoading } = useMyRequests({ page, limit: 10 });
  const cancelMutation = useCancelApprovalRequest();

  const requests = data?.items || [];
  const pagination = data?.pagination;

  const handleCancel = async (request: ApprovalRequestResponse) => {
    setCancelError(null);
    setCancellingId(request.id);
    try {
      await cancelMutation.mutateAsync(request.id);
    } catch (err) {
      setCancelError(err instanceof AppApiError ? err.message : t("cancelError"));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {cancelError && (
        <div className="p-3 m-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {cancelError}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-4 px-6">{t("table.target")}</th>
              <th className="py-4 px-6">{t("table.reason")}</th>
              <th className="py-4 px-6">{t("table.status")}</th>
              <th className="py-4 px-6">{t("table.createdAt")}</th>
              <th className="py-4 px-6 text-right">{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  <td className="py-4 px-6" colSpan={5}>
                    <div className="h-4 bg-slate-100 rounded-md w-full" />
                  </td>
                </tr>
              ))
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center text-sm text-slate-400">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                const badge = STATUS_BADGE[req.status];
                const BadgeIcon = badge.icon;
                return (
                  <tr
                    key={req.id}
                    onClick={() => setDetailRequest(req)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">
                        {t(`targetType.${req.targetType}`)}
                      </div>
                      <div className="text-xs text-slate-400">{t(`action.${req.action}`)}</div>
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <p className="text-xs text-slate-600 line-clamp-2">{req.reason}</p>
                      {req.rejectionReason && (
                        <p className="text-xs text-rose-600 mt-1">
                          {t("rejectionReasonPrefix")}: {req.rejectionReason}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.className}`}
                      >
                        <BadgeIcon className="w-3.5 h-3.5" />
                        {t(`status.${req.status}`)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {req.status === ApprovalRequestStatusEnum.PENDING && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(req);
                          }}
                          disabled={cancellingId === req.id}
                          title={t("cancelRequest")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" />
                          {t("cancelRequest")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && requests.length > 0 && pagination && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            {t("table.page")} {pagination.page}/{pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <RequestDetailModal request={detailRequest} onClose={() => setDetailRequest(null)} />
    </div>
  );
};
