"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useQueries } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  PackageCheck,
  Plus,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  InventoryRequestStatusEnum,
  InventoryRequestTypeEnum,
  formatDate,
  type InventoryRequestResponse,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useMyFacility } from "@/features/storage-unit-management/hooks";
import { fetchInventoryRequests } from "../api";
import { inventoryOpsKeys, useInventoryRequests, useVerifyPickupCode } from "../hooks";
import { RequestStatusBadge } from "./StatusBadges";

export type FacilityPortal = "facility-staff" | "facility-manager";

const PAGE_SIZE = 10;
const OTP_PATTERN = /^\d{6}$/;

const KPI_STATUSES = [
  { status: InventoryRequestStatusEnum.PENDING, icon: Clock, tone: "bg-amber-50 text-amber-700" },
  {
    status: InventoryRequestStatusEnum.PROCESSING,
    icon: RefreshCw,
    tone: "bg-sky-50 text-sky-700",
  },
  {
    status: InventoryRequestStatusEnum.READY_TO_PUTAWAY,
    icon: Layers,
    tone: "bg-violet-50 text-violet-700",
  },
  {
    status: InventoryRequestStatusEnum.PENDING_CUSTOMER_CONFIRMATION,
    icon: PackageCheck,
    tone: "bg-orange-50 text-orange-700",
  },
] as const;

const totalQuantity = (request: InventoryRequestResponse) =>
  request.items.reduce((sum, item) => sum + item.quantity, 0);

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

/** S1 — facility queue of inbound / outbound requests with the pickup-code verifier. */
export function RequestQueueView({ portalBase }: { portalBase: FacilityPortal }) {
  const t = useTranslations("inventoryOps");
  const locale = useLocale();
  const router = useRouter();
  const getErrorMessage = useApiErrorMessage();
  const { data: facility } = useMyFacility();
  const facilityId = facility?.id;

  const [type, setType] = useState<InventoryRequestTypeEnum | "all">("all");
  const [status, setStatus] = useState<InventoryRequestStatusEnum | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pickupCode, setPickupCode] = useState("");
  const [requestCode, setRequestCode] = useState("");
  const verifyMutation = useVerifyPickupCode();

  const query = {
    facilityId,
    type: type === "all" ? undefined : type,
    status: status === "all" ? undefined : status,
    search: search.trim() || undefined,
    page,
    limit: PAGE_SIZE,
    sortBy: "createdAt",
    sortOrder: "desc" as const,
  };
  const listQuery = useInventoryRequests(query, Boolean(facilityId));

  const kpiQueries = useQueries({
    queries: KPI_STATUSES.map(({ status: kpiStatus }) => {
      const kpiQuery = { facilityId, status: kpiStatus, page: 1, limit: 1 };
      return {
        queryKey: inventoryOpsKeys.requests(kpiQuery),
        queryFn: () => fetchInventoryRequests(kpiQuery),
        enabled: Boolean(facilityId),
      };
    }),
  });

  const detailHref = (id: string) => `/${locale}/${portalBase}/inventory-requests/${id}`;
  const isOtp = OTP_PATTERN.test(pickupCode.trim());

  const handleVerify = async () => {
    const code = pickupCode.trim();
    if (!code) return;
    if (isOtp && !requestCode.trim()) {
      toast.error(t("queue.otpNeedsRequestCode"));
      return;
    }
    try {
      const verified = await verifyMutation.mutateAsync({
        pickupCode: code,
        requestCode: isOtp ? requestCode.trim() : undefined,
      });
      toast.success(t("queue.verified", { code: verified.requestCode }));
      router.push(detailHref(verified.id));
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const data = listQuery.data;
  const items = data?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            {t("queue.title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t("queue.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-teal-300 bg-white px-3 py-2">
            <QrCode className="h-4 w-4 text-teal-600" />
            <input
              value={pickupCode}
              onChange={(event) => setPickupCode(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && void handleVerify()}
              placeholder={t("queue.codePlaceholder")}
              className="w-56 bg-transparent text-sm outline-none"
            />
          </div>
          {isOtp ? (
            <input
              value={requestCode}
              onChange={(event) => setRequestCode(event.target.value.toUpperCase())}
              placeholder={t("queue.requestCodePlaceholder")}
              className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
          ) : null}
          <Button
            onClick={() => void handleVerify()}
            disabled={!pickupCode.trim() || verifyMutation.isPending}
            className="bg-teal-600 text-white hover:bg-teal-700"
          >
            {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("queue.verify")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPI_STATUSES.map(({ status: kpiStatus, icon: Icon, tone }, index) => (
          <button
            key={kpiStatus}
            type="button"
            onClick={() => {
              setStatus(kpiStatus);
              setPage(1);
            }}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-teal-300"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500">
                {t(`requestStatus.${kpiStatus}`)}
              </p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {kpiQueries[index]?.data?.pagination.totalItems ?? "—"}
              </p>
            </div>
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {(
            ["all", InventoryRequestTypeEnum.OUTBOUND, InventoryRequestTypeEnum.INBOUND] as const
          ).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setType(value);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-bold ${
                type === value ? "bg-white text-teal-700 shadow-sm" : "text-slate-500"
              }`}
            >
              {t(`queue.type.${value}`)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as InventoryRequestStatusEnum | "all");
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">{t("queue.allStatuses")}</option>
            {Object.values(InventoryRequestStatusEnum).map((value) => (
              <option key={value} value={value}>
                {t(`requestStatus.${value}`)}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("queue.searchPlaceholder")}
            className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400"
          />
          <Link href={`/${locale}/${portalBase}/inventory-requests/inbound/new`}>
            <Button className="bg-orange-500 text-white hover:bg-orange-600">
              <Plus className="h-4 w-4" />
              {t("queue.receiveInbound")}
            </Button>
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500">
            <tr>
              <th className="px-4 py-3">{t("queue.col.code")}</th>
              <th className="px-4 py-3">{t("queue.col.type")}</th>
              <th className="px-4 py-3">{t("queue.col.unit")}</th>
              <th className="px-4 py-3 text-center">{t("queue.col.items")}</th>
              <th className="px-4 py-3">{t("queue.col.transporter")}</th>
              <th className="px-4 py-3">{t("queue.col.createdAt")}</th>
              <th className="px-4 py-3">{t("queue.col.status")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading || !facilityId ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={8} className="px-4 py-2">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                  {listQuery.isError ? getErrorMessage(listQuery.error) : t("queue.empty")}
                </td>
              </tr>
            ) : (
              items.map((request) => {
                const outbound = request.type === InventoryRequestTypeEnum.OUTBOUND;
                return (
                  <tr key={request.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">
                      {request.requestCode}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold ${
                          outbound ? "text-orange-600" : "text-teal-700"
                        }`}
                      >
                        {outbound ? (
                          <ArrowUpFromLine className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownToLine className="h-3.5 w-3.5" />
                        )}
                        {t(`queue.type.${request.type}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{request.unitNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {totalQuantity(request)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {request.transporterInfo
                        ? [request.transporterInfo.name, request.transporterInfo.vehiclePlate]
                            .filter(Boolean)
                            .join(" · ")
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatTime(request.createdAt)} {formatDate(request.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <RequestStatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={detailHref(request.id)}>
                        <Button variant="outline" size="sm">
                          {t(
                            request.status === InventoryRequestStatusEnum.READY_TO_PUTAWAY ||
                              (!outbound &&
                                request.status === InventoryRequestStatusEnum.PROCESSING)
                              ? "queue.action.putaway"
                              : request.status === InventoryRequestStatusEnum.PROCESSING
                                ? "queue.action.handover"
                                : "queue.action.detail"
                          )}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {data && data.pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>
              {t("queue.pageInfo", {
                page: data.pagination.page,
                pages: data.pagination.totalPages,
                total: data.pagination.totalItems,
              })}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={!data.pagination.hasPrevPage}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!data.pagination.hasNextPage}
                onClick={() => setPage((value) => value + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
