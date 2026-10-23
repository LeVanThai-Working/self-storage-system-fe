"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useReviewApprovalRequest } from "../hooks";
import { ApprovalReviewDecisionEnum, type ApprovalRequestDetail } from "../types";

interface ReviewConfirmModalProps {
  request: ApprovalRequestDetail | null;
  decision: ApprovalReviewDecisionEnum | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReviewConfirmModal = ({
  request,
  decision,
  isOpen,
  onClose,
  onSuccess,
}: ReviewConfirmModalProps) => {
  const t = useTranslations("businessOps.approvals.reviewModal");
  const commonT = useTranslations("businessOps.approvals");

  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reviewMutation = useReviewApprovalRequest();

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotes("");
      setRejectionReason("");
      setError(null);
    }
  }, [isOpen]);

  if (!request || !decision) return null;

  const isApprove = decision === ApprovalReviewDecisionEnum.APPROVE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isApprove && !rejectionReason.trim()) {
      setError(t("rejectionReasonRequired"));
      return;
    }

    try {
      await reviewMutation.mutateAsync({
        id: request.id,
        payload: isApprove
          ? {
              action: ApprovalReviewDecisionEnum.APPROVE,
              notes: notes.trim() || undefined,
            }
          : {
              action: ApprovalReviewDecisionEnum.REJECT,
              rejectionReason: rejectionReason.trim(),
              notes: rejectionReason.trim(),
            },
      });

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : t("genericError");
      setError(msg);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !reviewMutation.isPending && onClose()}>
      <DialogContent className="sm:max-w-lg p-6 rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                isApprove ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              {isApprove ? (
                <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <XCircle className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {isApprove ? t("approveTitle") : t("rejectTitle")}
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isApprove ? t("approveSubtitle") : t("rejectSubtitle")}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 my-2">
          {/* Summary Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t("targetLabel")}:</span>
              <span className="font-bold text-slate-800">
                {commonT(`targetType.${request.targetType}`)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t("actionLabel")}:</span>
              <span className="font-semibold text-slate-700">
                {commonT(`action.${request.action}`)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">{t("facilityLabel")}:</span>
              <span className="font-medium text-slate-800">
                {request.facility?.name || "Toàn hệ thống"}
              </span>
            </div>
            {request.requester && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">{t("requesterLabel")}:</span>
                <span className="font-medium text-slate-700">{request.requester.name}</span>
              </div>
            )}
          </div>

          {/* Form input */}
          {isApprove ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t("approveNotesLabel")}{" "}
                <span className="text-[11px] font-normal text-slate-400">({t("optional")})</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={t("approveNotesPlaceholder")}
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 p-3 rounded-xl border border-slate-200/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
              />
              <p className="text-[11px] text-slate-500 italic">{t("approveAutoApplyNotice")}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {t("rejectionReasonLabel")} <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder={t("rejectionReasonPlaceholder")}
                className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 p-3 rounded-xl border border-slate-200/80 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all resize-none"
              />
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{t("rejectWarning")}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          <DialogFooter className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={reviewMutation.isPending}
              className="rounded-xl"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={reviewMutation.isPending}
              className={`rounded-xl font-bold cursor-pointer text-white shadow-md ${
                isApprove
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/20"
                  : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
              }`}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("processing")}
                </>
              ) : isApprove ? (
                t("confirmApprove")
              ) : (
                t("confirmReject")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
