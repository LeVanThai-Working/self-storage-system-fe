"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, CheckCircle2, Loader2, TriangleAlert, Truck } from "lucide-react";
import { toast } from "sonner";
import {
  CloudinaryFolderEnum,
  InventoryRequestStatusEnum,
  InventoryRequestTypeEnum,
  completeOutboundHandoverSchema,
  formatDate,
  putawayInboundRequestSchema,
  type CompleteOutboundHandoverRequest,
  type InventoryRequestItemResponse,
  type InventoryRequestResponse,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CloudinaryUploader } from "@/components/common/CloudinaryUploader";
import { SignaturePad } from "@/components/common/SignaturePad";
import { useApiErrorMessage } from "@/features/auth/error-message";
import {
  useCompleteOutbound,
  useInventoryRequest,
  usePutawayInbound,
  useUnitRacks,
} from "../hooks";
import { RequestStatusBadge } from "./StatusBadges";
import { TierSelect, type TierChoice } from "./TierSelect";
import type { FacilityPortal } from "./RequestQueueView";

const LABEL = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700";
const CARD = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm";

const itemKey = (item: InventoryRequestItemResponse) => `${item.skuId}:${item.rackTierId ?? "-"}`;

const position = (item: InventoryRequestItemResponse) =>
  item.rackCode
    ? `${item.rackCode}${item.tierNumber ? ` · T${String(item.tierNumber).padStart(2, "0")}` : ""}`
    : "—";

/** S2 (outbound handover) and S3 putaway, plus a read-only view for every other state. */
export function RequestDetailView({ id, portalBase }: { id: string; portalBase: FacilityPortal }) {
  const t = useTranslations("inventoryOps");
  const locale = useLocale();
  const requestQuery = useInventoryRequest(id);
  const request = requestQuery.data;

  if (requestQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!request) {
    return <p className="text-sm text-slate-500">{t("detail.notFound")}</p>;
  }

  const outbound = request.type === InventoryRequestTypeEnum.OUTBOUND;

  return (
    <div className="space-y-5">
      <div>
        <Link
          href={`/${locale}/${portalBase}/inventory-requests`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("queue.title")}
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {t(outbound ? "detail.outboundTitle" : "detail.inboundTitle", {
                code: request.requestCode,
              })}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {t("detail.subtitle", {
                unit: request.unitNumber ?? "—",
                date: formatDate(request.createdAt),
              })}
            </p>
          </div>
          <RequestStatusBadge status={request.status} />
        </div>
      </div>

      {outbound && request.status === InventoryRequestStatusEnum.PROCESSING ? (
        <HandoverForm request={request} />
      ) : !outbound &&
        // Pre-advised inbound goes straight to `processing` once staff scan the INBOUND: code.
        (request.status === InventoryRequestStatusEnum.READY_TO_PUTAWAY ||
          request.status === InventoryRequestStatusEnum.PROCESSING) ? (
        <PutawayForm request={request} />
      ) : (
        <RequestSummary request={request} />
      )}
    </div>
  );
}

function ItemsTable({
  items,
  renderExtra,
  extraHeader,
}: {
  items: InventoryRequestItemResponse[];
  renderExtra?: (item: InventoryRequestItemResponse) => React.ReactNode;
  extraHeader?: string;
}) {
  const t = useTranslations("inventoryOps.detail");
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500">
        <tr>
          <th className="px-3 py-2">{t("col.position")}</th>
          <th className="px-3 py-2">{t("col.sku")}</th>
          <th className="px-3 py-2 text-center">{t("col.requested")}</th>
          {extraHeader ? <th className="px-3 py-2">{extraHeader}</th> : null}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={itemKey(item)} className="border-t border-slate-100">
            <td className="px-3 py-2 font-mono text-xs font-bold">{position(item)}</td>
            <td className="px-3 py-2">
              <p className="font-mono text-xs font-bold">{item.skuCode ?? item.skuId}</p>
              <p className="text-xs text-slate-500">{item.name}</p>
            </td>
            <td className="px-3 py-2 text-center">
              {item.quantity} {item.uom ?? ""}
            </td>
            {renderExtra ? <td className="px-3 py-2">{renderExtra(item)}</td> : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TransporterCard({ request }: { request: InventoryRequestResponse }) {
  const t = useTranslations("inventoryOps.detail");
  if (!request.transporterInfo) return null;
  const info = request.transporterInfo;
  return (
    <div className={CARD}>
      <p className={LABEL}>
        {request.type === InventoryRequestTypeEnum.OUTBOUND ? t("recipient") : t("deliverer")}
      </p>
      <div className="flex items-start gap-3">
        <Truck className="mt-0.5 h-4 w-4 text-slate-400" />
        <div className="text-sm">
          <p className="font-bold text-slate-900">{info.name}</p>
          <p className="text-slate-600">
            {[info.phoneNumber, info.vehiclePlate, info.deliveryCompany]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
    </div>
  );
}

function HandoverForm({ request }: { request: InventoryRequestResponse }) {
  const t = useTranslations("inventoryOps.handover");
  const getErrorMessage = useApiErrorMessage();
  const completeMutation = useCompleteOutbound(request.id);

  const [actual, setActual] = useState<Record<string, number>>(() =>
    Object.fromEntries(request.items.map((item) => [itemKey(item), item.quantity]))
  );
  const [evidence, setEvidence] = useState<string[]>([]);
  const [discrepancyImages, setDiscrepancyImages] = useState<string[]>([]);
  const [discrepancyReason, setDiscrepancyReason] = useState("");
  const [signatureUrl, setSignatureUrl] = useState<string | undefined>();
  const [staffNotes, setStaffNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const shortItems = request.items.filter((item) => (actual[itemKey(item)] ?? 0) < item.quantity);
  const handedTotal = Object.values(actual).reduce((sum, qty) => sum + qty, 0);

  const handleComplete = async () => {
    setError(null);
    if (shortItems.length > 0 && !discrepancyReason.trim()) {
      setError(t("discrepancyRequired"));
      return;
    }
    const payload: CompleteOutboundHandoverRequest = {
      evidenceImages: evidence,
      signatureUrl,
      staffNotes: staffNotes.trim() || undefined,
      actualItems: request.items.map((item) => ({
        skuId: item.skuId,
        actualQuantity: actual[itemKey(item)] ?? 0,
        storageRackId: item.storageRackId,
        rackTierId: item.rackTierId,
      })),
      discrepancyReason: shortItems.length > 0 ? discrepancyReason.trim() : undefined,
      discrepancyImages: shortItems.length > 0 ? discrepancyImages : undefined,
    };
    const parsed = completeOutboundHandoverSchema.safeParse(payload);
    if (!parsed.success) {
      setError(t("evidenceRequired"));
      return;
    }
    try {
      await completeMutation.mutateAsync(payload);
      toast.success(t("completed"));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          {t("verifiedAt", {
            time: request.verifiedAt ? formatDate(request.verifiedAt) : "",
          })}
        </div>
        <div className={CARD}>
          <p className={LABEL}>{t("pickList")}</p>
          <ItemsTable
            items={request.items}
            extraHeader={t("actual")}
            renderExtra={(item) => (
              <input
                type="number"
                min={0}
                max={item.quantity}
                value={actual[itemKey(item)] ?? 0}
                onChange={(event) =>
                  setActual((prev) => ({
                    ...prev,
                    [itemKey(item)]: Math.max(
                      0,
                      Math.min(item.quantity, Number(event.target.value) || 0)
                    ),
                  }))
                }
                className={`w-20 rounded-lg border px-2 py-1.5 text-sm font-bold ${
                  (actual[itemKey(item)] ?? 0) < item.quantity
                    ? "border-orange-300 bg-orange-50 text-orange-700"
                    : "border-slate-200"
                }`}
              />
            )}
          />
        </div>

        {shortItems.length > 0 ? (
          <div className={`${CARD} border-orange-200`}>
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-orange-700">
              <TriangleAlert className="h-4 w-4" />
              {t("discrepancyTitle", { count: shortItems.length })}
            </p>
            <label className={LABEL}>{t("discrepancyReason")} *</label>
            <textarea
              value={discrepancyReason}
              onChange={(event) => setDiscrepancyReason(event.target.value)}
              maxLength={500}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="mt-3">
              <CloudinaryUploader
                value={discrepancyImages}
                onChange={setDiscrepancyImages}
                folder={CloudinaryFolderEnum.INVENTORY_REQUESTS}
                multiple
                maxFiles={5}
                accept="image/*"
                label={t("discrepancyImages")}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-5">
        <TransporterCard request={request} />
        <div className={CARD}>
          <CloudinaryUploader
            value={evidence}
            onChange={setEvidence}
            folder={CloudinaryFolderEnum.INVENTORY_REQUESTS}
            multiple
            maxFiles={5}
            accept="image/*"
            label={`${t("evidence")} *`}
            description={t("evidenceHint")}
          />
        </div>
        <div className={`${CARD} space-y-3`}>
          <SignaturePad
            value={signatureUrl}
            onChange={setSignatureUrl}
            label={t("signature")}
            clearLabel={t("signatureClear")}
            hint={t("signatureHint")}
          />
          <div>
            <label className={LABEL}>{t("staffNotes")}</label>
            <input
              value={staffNotes}
              onChange={(event) => setStaffNotes(event.target.value)}
              maxLength={500}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <Button
          onClick={() => void handleComplete()}
          disabled={completeMutation.isPending}
          className="w-full bg-orange-500 text-white hover:bg-orange-600"
        >
          {completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("complete", { count: handedTotal })}
        </Button>
      </div>
    </div>
  );
}

function PutawayForm({ request }: { request: InventoryRequestResponse }) {
  const t = useTranslations("inventoryOps.putaway");
  const getErrorMessage = useApiErrorMessage();
  const racksQuery = useUnitRacks(request.storageUnitId);
  const putawayMutation = usePutawayInbound(request.id);
  const [error, setError] = useState<string | null>(null);

  const [placements, setPlacements] = useState<Record<string, TierChoice | null>>(() =>
    Object.fromEntries(
      request.items.map((item) => [
        itemKey(item),
        item.storageRackId && item.rackTierId
          ? { storageRackId: item.storageRackId, rackTierId: item.rackTierId }
          : null,
      ])
    )
  );
  const missing = useMemo(
    () => request.items.filter((item) => !placements[itemKey(item)]).length,
    [placements, request.items]
  );

  const handlePutaway = async () => {
    setError(null);
    const payload = {
      placements: request.items.flatMap((item) => {
        const choice = placements[itemKey(item)];
        return choice ? [{ skuId: item.skuId, quantity: item.quantity, ...choice }] : [];
      }),
    };
    if (missing > 0 || !putawayInboundRequestSchema.safeParse(payload).success) {
      setError(t("missingTier", { count: missing }));
      return;
    }
    try {
      await putawayMutation.mutateAsync(payload);
      toast.success(t("done"));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className={CARD}>
        <p className={LABEL}>{t("title")}</p>
        <ItemsTable
          items={request.items}
          extraHeader={t("tier")}
          renderExtra={(item) => (
            <TierSelect
              racks={racksQuery.data ?? []}
              value={placements[itemKey(item)]}
              disabled={racksQuery.isLoading}
              onChange={(choice) =>
                setPlacements((prev) => ({
                  ...prev,
                  [itemKey(item)]: choice && choice !== "holding" ? choice : null,
                }))
              }
            />
          )}
        />
        <p className="mt-3 text-xs text-slate-500">{t("hint")}</p>
      </div>
      <div className="space-y-5">
        <TransporterCard request={request} />
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <Button
          onClick={() => void handlePutaway()}
          disabled={putawayMutation.isPending}
          className="w-full bg-orange-500 text-white hover:bg-orange-600"
        >
          {putawayMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("submit")}
        </Button>
      </div>
    </div>
  );
}

function RequestSummary({ request }: { request: InventoryRequestResponse }) {
  const t = useTranslations("inventoryOps.detail");
  const images = [...(request.evidenceImages ?? []), ...(request.discrepancyImages ?? [])];
  const hint =
    request.status === InventoryRequestStatusEnum.PENDING
      ? t("hint.pending")
      : request.status === InventoryRequestStatusEnum.PENDING_CUSTOMER_CONFIRMATION
        ? t("hint.pendingConfirmation")
        : request.status === InventoryRequestStatusEnum.DISPUTED
          ? t("hint.disputed")
          : null;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        {hint ? (
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm text-sky-800">
            {hint}
          </div>
        ) : null}
        <div className={CARD}>
          <ItemsTable
            items={request.items}
            extraHeader={t("col.actual")}
            renderExtra={(item) => item.actualQuantity ?? "—"}
          />
        </div>
        {request.discrepancyReason ? (
          <div className={`${CARD} border-orange-200 text-sm text-orange-800`}>
            {t("discrepancy", { reason: request.discrepancyReason })}
          </div>
        ) : null}
      </div>
      <div className="space-y-5">
        <TransporterCard request={request} />
        {images.length > 0 || request.signatureUrl ? (
          <div className={CARD}>
            <p className={LABEL}>{t("evidence")}</p>
            <div className="grid grid-cols-3 gap-2">
              {images.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" className="h-20 w-full rounded-lg object-cover" />
              ))}
            </div>
            {request.signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={request.signatureUrl}
                alt=""
                className="mt-3 h-20 w-full rounded-lg border border-slate-200 object-contain"
              />
            ) : null}
          </div>
        ) : null}
        {request.staffNotes ? (
          <div className={`${CARD} text-sm text-slate-700`}>{request.staffNotes}</div>
        ) : null}
      </div>
    </div>
  );
}
