"use client";

import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApprovalRequestStatusEnum, type ApprovalRequestResponse } from "../types";

interface RequestDetailModalProps {
  request: ApprovalRequestResponse | null;
  onClose: () => void;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
    <span className="text-xs text-slate-500 shrink-0">{label}</span>
    <span className="text-sm text-slate-800 text-right break-words">{value}</span>
  </div>
);

type TFn = ReturnType<typeof useTranslations>;

const formatValue = (t: TFn, key: string, value: unknown): string => {
  if (key === "billingUnit") return t(`catalog.billingUnit.${value}`);
  if (key === "pricePerUnit" && typeof value === "number") {
    return `${value.toLocaleString("vi-VN")} ₫`;
  }
  if (key === "dimensions" && value && typeof value === "object") {
    const { length, width, height } = value as Record<string, number>;
    return `${length} × ${width} × ${height} m`;
  }
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
};

// Ẩn các trường *Id (mã kỹ thuật, người dùng không đọc được).
const PayloadBlock = ({
  t,
  title,
  data,
}: {
  t: TFn;
  title: string;
  data: Record<string, unknown>;
}) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
    <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1">
      {Object.entries(data)
        .filter(([key, value]) => !key.endsWith("Id") && value != null)
        .map(([key, value]) => (
          <Row
            key={key}
            label={t.has(`detailModal.fields.${key}`) ? t(`detailModal.fields.${key}`) : key}
            value={formatValue(t, key, value)}
          />
        ))}
    </div>
  </div>
);

export const RequestDetailModal = ({ request, onClose }: RequestDetailModalProps) => {
  const t = useTranslations("facilityManager.requests");

  return (
    <Dialog open={Boolean(request)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            {t("detailModal.title")}
          </DialogTitle>
        </DialogHeader>

        {request && (
          <div className="space-y-4">
            <div>
              <Row label={t("table.target")} value={t(`targetType.${request.targetType}`)} />
              <Row label={t("detailModal.actionLabel")} value={t(`action.${request.action}`)} />
              <Row label={t("table.status")} value={t(`status.${request.status}`)} />
              <Row
                label={t("table.createdAt")}
                value={
                  request.createdAt ? new Date(request.createdAt).toLocaleString("vi-VN") : "—"
                }
              />
              {request.requester && (
                <Row label={t("detailModal.requesterLabel")} value={request.requester.name} />
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t("table.reason")}
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{request.reason}</p>
            </div>

            <PayloadBlock t={t} title={t("detailModal.payloadLabel")} data={request.payload} />

            {request.targetCurrentData && (
              <PayloadBlock
                t={t}
                title={t("detailModal.currentDataLabel")}
                data={request.targetCurrentData}
              />
            )}

            {request.status === ApprovalRequestStatusEnum.REJECTED && request.rejectionReason && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                <p className="text-xs font-bold uppercase tracking-wider mb-1">
                  {t("rejectionReasonPrefix")}
                </p>
                {request.rejectionReason}
              </div>
            )}

            {request.status === ApprovalRequestStatusEnum.APPROVED && (
              <div className="space-y-2">
                {request.approver && (
                  <Row label={t("detailModal.approverLabel")} value={request.approver.name} />
                )}
                {request.reviewNotes && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                    <p className="text-xs font-bold uppercase tracking-wider mb-1">
                      {t("detailModal.reviewNotesLabel")}
                    </p>
                    {request.reviewNotes}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
