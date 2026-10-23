"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  Building2,
  User,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Layers,
  Sparkles,
  Tag,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApprovalRequestDetail } from "../hooks";
import {
  ApprovalRequestActionEnum,
  ApprovalRequestStatusEnum,
  ApprovalRequestTargetTypeEnum,
  ApprovalReviewDecisionEnum,
  type ApprovalRequestDetail,
} from "../types";

interface ApprovalDiffModalProps {
  requestId: string | null;
  onClose: () => void;
  onOpenReview: (request: ApprovalRequestDetail, decision: ApprovalReviewDecisionEnum) => void;
}

export const ApprovalDiffModal = ({ requestId, onClose, onOpenReview }: ApprovalDiffModalProps) => {
  const t = useTranslations("businessOps.approvals.diffModal");
  const commonT = useTranslations("businessOps.approvals");

  const { data: request, isLoading, isError, refetch } = useApprovalRequestDetail(requestId);

  const formatCurrency = (value: unknown) => {
    if (typeof value === "number" && !isNaN(value)) {
      return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
    }
    return String(value ?? "—");
  };

  const formatFieldValue = (key: string, val: unknown): string => {
    if (val === undefined || val === null) return "—";
    if (key === "pricePerUnit") return formatCurrency(val);
    if (key === "depositMultiplier") return `x${val}`;
    if (key === "billingUnit") {
      if (val === "day") return "Theo ngày";
      if (val === "month") return "Theo tháng";
      if (val === "one_time") return "Một lần";
      return String(val);
    }
    if (key === "dimensions" && typeof val === "object" && val !== null) {
      const dim = val as { length?: number; width?: number; height?: number };
      return `${dim.length || 0}m × ${dim.width || 0}m × ${dim.height || 0}m`;
    }
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  const getFieldLabel = (key: string): string => {
    const labels: Record<string, string> = {
      pricePerUnit: t("fields.pricePerUnit"),
      depositMultiplier: t("fields.depositMultiplier"),
      billingUnit: t("fields.billingUnit"),
      minRentalDays: t("fields.minRentalDays"),
      totalQuantity: t("fields.totalQuantity"),
      name: t("fields.name"),
      category: t("fields.category"),
      dimensions: t("fields.dimensions"),
      area: t("fields.area"),
      volume: t("fields.volume"),
      description: t("fields.description"),
      notes: t("fields.notes"),
      status: t("fields.status"),
    };
    return labels[key] || key;
  };

  const renderTargetIcon = (targetType?: ApprovalRequestTargetTypeEnum) => {
    switch (targetType) {
      case ApprovalRequestTargetTypeEnum.FACILITY_UNIT_TYPE_OFFERING:
        return <Tag className="w-4 h-4 text-emerald-600" />;
      case ApprovalRequestTargetTypeEnum.FACILITY_AMENITY_OFFERING:
        return <Sparkles className="w-4 h-4 text-teal-600" />;
      case ApprovalRequestTargetTypeEnum.UNIT_TYPE:
        return <Layers className="w-4 h-4 text-emerald-600" />;
      default:
        return <FileText className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <Dialog open={Boolean(requestId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>{t("title")}</span>
                {request && (
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md border ${
                      request.action === ApprovalRequestActionEnum.CREATE
                        ? "bg-teal-50 text-teal-700 border-teal-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {commonT(`action.${request.action}`)}
                  </span>
                )}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">{t("subtitle")}</p>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500 text-sm">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <span>{t("loading")}</span>
          </div>
        ) : isError || !request ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <p className="text-sm font-semibold text-slate-800">{t("loadError")}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="rounded-xl"
            >
              {t("retry")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 my-2">
            {/* Meta Info Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    <strong className="text-slate-900">
                      {request.facility?.name || "Toàn hệ thống"}
                    </strong>
                    {request.facility?.city && ` (${request.facility.city})`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {t("requester")}:{" "}
                    <strong className="text-slate-900">
                      {request.requester?.name || request.requesterId}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  {renderTargetIcon(request.targetType)}
                  <span>
                    {t("targetType")}:{" "}
                    <strong className="text-slate-900">
                      {commonT(`targetType.${request.targetType}`)}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    {t("createdAt")}:{" "}
                    <strong className="text-slate-900">
                      {request.createdAt
                        ? new Date(request.createdAt).toLocaleString("vi-VN")
                        : "—"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Reason box */}
              <div className="pt-2 border-t border-slate-200/70">
                <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider block mb-1">
                  {t("reasonLabel")}:
                </span>
                <p className="text-slate-800 text-xs sm:text-sm bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed italic">
                  &ldquo;{request.reason}&rdquo;
                </p>
              </div>
            </div>

            {/* DIFF VIEW CONTAINER */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  {request.action === ApprovalRequestActionEnum.UPDATE
                    ? t("diffTitleUpdate")
                    : t("diffTitleCreate")}
                </h3>
              </div>

              {/* Case 1: UPDATE -> Diff view so sánh Dữ liệu Cũ vs Đề xuất Mới */}
              {request.action === ApprovalRequestActionEnum.UPDATE ? (
                <div className="rounded-2xl border border-slate-200/80 overflow-hidden text-xs">
                  <div className="grid grid-cols-2 bg-slate-100/80 font-bold border-b border-slate-200/80 text-[11px] uppercase tracking-wider">
                    <div className="p-3 text-slate-600 border-r border-slate-200/80">
                      {t("currentDataCol")}
                    </div>
                    <div className="p-3 text-emerald-800 bg-emerald-50/70">
                      {t("proposedDataCol")}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 bg-white">
                    {/* Render các trường có trong payload */}
                    {Object.entries(request.payload || {})
                      .filter(([key]) => !key.endsWith("Id"))
                      .map(([key, newVal]) => {
                        const oldVal = request.targetCurrentData?.[key];
                        const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

                        return (
                          <div key={key} className="grid grid-cols-2 divide-x divide-slate-100">
                            {/* Cột dữ liệu cũ */}
                            <div className="p-3 bg-slate-50/50">
                              <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                                {getFieldLabel(key)}
                              </span>
                              <span
                                className={`text-xs block mt-0.5 ${isChanged ? "text-slate-600 line-through" : "text-slate-800"}`}
                              >
                                {formatFieldValue(key, oldVal)}
                              </span>
                            </div>

                            {/* Cột dữ liệu mới */}
                            <div className={`p-3 ${isChanged ? "bg-emerald-50/50" : "bg-white"}`}>
                              <span className="text-[10px] text-emerald-700 font-semibold block uppercase">
                                {getFieldLabel(key)}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span
                                  className={`text-xs font-bold ${isChanged ? "text-emerald-900" : "text-slate-800"}`}
                                >
                                  {formatFieldValue(key, newVal)}
                                </span>
                                {isChanged && (
                                  <span className="inline-flex items-center text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded-md font-extrabold">
                                    <ArrowRight className="w-2.5 h-2.5 mr-0.5" />
                                    {t("changedBadge")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                /* Case 2: CREATE -> Hiển thị danh sách thông số tạo mới */
                <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/80 space-y-2 text-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800 mb-1">
                    {t("newEntityDetails")}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {Object.entries(request.payload || {})
                      .filter(([key]) => !key.endsWith("Id"))
                      .map(([key, val]) => (
                        <div key={key} className="p-2.5 rounded-xl bg-white border border-teal-100">
                          <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                            {getFieldLabel(key)}
                          </span>
                          <span className="text-xs font-bold text-slate-800 block mt-0.5">
                            {formatFieldValue(key, val)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Trạng thái duyệt trước đó (nếu không phải PENDING) */}
            {request.status === ApprovalRequestStatusEnum.APPROVED && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{t("alreadyApprovedTitle")}</span>
                </div>
                <div className="text-[11px] text-emerald-700">
                  {request.approver && (
                    <span>
                      {t("approvedBy")}: <strong>{request.approver.name}</strong> •{" "}
                    </span>
                  )}
                  {request.reviewedAt && (
                    <span>{new Date(request.reviewedAt).toLocaleString("vi-VN")}</span>
                  )}
                </div>
                {request.reviewNotes && (
                  <p className="mt-1 italic text-emerald-800 bg-white/70 p-2 rounded-lg border border-emerald-200/50">
                    &ldquo;{request.reviewNotes}&rdquo;
                  </p>
                )}
              </div>
            )}

            {request.status === ApprovalRequestStatusEnum.REJECTED && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-rose-800">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>{t("alreadyRejectedTitle")}</span>
                </div>
                <div className="text-[11px] text-rose-700">
                  {request.approver && (
                    <span>
                      {t("rejectedBy")}: <strong>{request.approver.name}</strong> •{" "}
                    </span>
                  )}
                  {request.reviewedAt && (
                    <span>{new Date(request.reviewedAt).toLocaleString("vi-VN")}</span>
                  )}
                </div>
                {(request.rejectionReason || request.reviewNotes) && (
                  <div className="mt-1.5 p-2 bg-white rounded-lg border border-rose-200/60 font-semibold text-rose-800">
                    <span className="text-[10px] uppercase font-bold text-rose-500 block">
                      {t("rejectionReasonLabel")}:
                    </span>
                    {request.rejectionReason || request.reviewNotes}
                  </div>
                )}
              </div>
            )}

            {request.status === ApprovalRequestStatusEnum.CANCELLED && (
              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                <span>{t("cancelledByRequester")}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl w-full sm:w-auto"
          >
            {t("close")}
          </Button>

          {request && request.status === ApprovalRequestStatusEnum.PENDING && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onClose();
                  onOpenReview(request, ApprovalReviewDecisionEnum.REJECT);
                }}
                className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 font-bold flex-1 sm:flex-initial cursor-pointer"
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                {t("rejectButton")}
              </Button>

              <Button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReview(request, ApprovalReviewDecisionEnum.APPROVE);
                }}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-600/20 flex-1 sm:flex-initial cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                {t("approveButton")}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
