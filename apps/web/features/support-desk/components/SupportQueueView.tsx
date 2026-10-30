"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQueries } from "@tanstack/react-query";
import {
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  UserRound,
  Warehouse,
} from "lucide-react";
import { toast } from "sonner";
import {
  CloudinaryFolderEnum,
  RoleEnum,
  SupportTicketCategoryEnum,
  SupportTicketPriorityEnum,
  SupportTicketStatusEnum,
  completeSupportTicketSchema,
  type SupportTicketResponse,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CloudinaryUploader } from "@/components/common/CloudinaryUploader";
import { useApiErrorMessage } from "@/features/auth/error-message";
import { useAuthStore } from "@/features/auth/store";
import { useContractDetail, useFacilityStaffs } from "@/features/contract-management/hooks";
import type { FacilityPortal } from "@/features/inventory-operations/components/RequestQueueView";
import { fetchSupportTickets } from "../api";
import {
  supportDeskKeys,
  useCompleteSupportTicket,
  useProcessSupportTicket,
  useSupportTicket,
  useSupportTickets,
} from "../hooks";
import {
  TICKET_PRIORITY_STYLE,
  TICKET_STATUS_STYLE,
  contractCode,
  formatDateTime,
  isMoveRequestTicket,
  refId,
  refName,
  refPhone,
} from "../utils";

/** Move tickets carry only the contract; its unit tells staff which rack map to open. */
function MoveTicketRackLink({
  contractId,
  locale,
  portalBase,
}: {
  contractId: string;
  locale: string;
  portalBase: FacilityPortal;
}) {
  const t = useTranslations("supportDesk");
  const contractQuery = useContractDetail(contractId);
  const unitId = contractQuery.data?.storageUnitId;
  if (!unitId) return null;
  return (
    <Link
      href={`/${locale}/${portalBase}/storage-units/${unitId}/racks?tab=goods`}
      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
    >
      <Warehouse className="h-3.5 w-3.5" />
      {t("sheet.openRackMap")}
    </Link>
  );
}

const PAGE_SIZE = 10;
const RESPONSE_MIN = 5;
const MAX_ATTACHMENTS = 5;
const SELECT = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";

const KPIS = [
  { status: SupportTicketStatusEnum.PENDING, icon: Clock, tone: "bg-amber-50 text-amber-700" },
  { status: SupportTicketStatusEnum.PROCESSING, icon: UserRound, tone: "bg-sky-50 text-sky-700" },
  {
    status: SupportTicketStatusEnum.COMPLETED,
    icon: CheckCircle2,
    tone: "bg-emerald-50 text-emerald-700",
  },
] as const;

function Pill({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${className}`}
    >
      {children}
    </span>
  );
}

/** W3 — facility support ticket queue with a detail sheet to accept and answer tickets. */
export function SupportQueueView({ portalBase }: { portalBase: FacilityPortal }) {
  const t = useTranslations("supportDesk");
  const [status, setStatus] = useState<SupportTicketStatusEnum | "all">("all");
  const [category, setCategory] = useState<SupportTicketCategoryEnum | "">("");
  const [priority, setPriority] = useState<SupportTicketPriorityEnum | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const query = {
    status: status === "all" ? undefined : status,
    category: category || undefined,
    priority: priority || undefined,
    search: search.trim() || undefined,
    page,
    limit: PAGE_SIZE,
    sortBy: "createdAt",
    sortOrder: "desc" as const,
  };
  const listQuery = useSupportTickets(query);
  const kpiQueries = useQueries({
    queries: [
      ...KPIS.map(({ status: kpiStatus }) => ({ status: kpiStatus })),
      { status: SupportTicketStatusEnum.PENDING, priority: SupportTicketPriorityEnum.URGENT },
    ].map((filter) => {
      const kpiQuery = { ...filter, page: 1, limit: 1 };
      return {
        queryKey: supportDeskKeys.list(kpiQuery),
        queryFn: () => fetchSupportTickets(kpiQuery),
      };
    }),
  });

  const data = listQuery.data;
  const items = data?.items ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map(({ status: kpiStatus, icon: Icon, tone }, index) => (
          <div
            key={kpiStatus}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-500">{t(`status.${kpiStatus}`)}</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {kpiQueries[index]?.data?.pagination.totalItems ?? "—"}
              </p>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold text-slate-500">{t("kpi.urgentPending")}</p>
            <p className="text-2xl font-extrabold text-slate-900">
              {kpiQueries[3]?.data?.pagination.totalItems ?? "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-5 border-b border-slate-100 px-4 pt-3">
          {(["all", ...Object.values(SupportTicketStatusEnum)] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
              className={`border-b-2 pb-2.5 text-sm font-semibold ${
                status === value
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-500"
              }`}
            >
              {value === "all" ? t("tabs.all") : t(`status.${value}`)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 p-3">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("searchPlaceholder")}
            className="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400"
          />
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as SupportTicketCategoryEnum | "");
              setPage(1);
            }}
            className={SELECT}
          >
            <option value="">{t("filter.allCategories")}</option>
            {Object.values(SupportTicketCategoryEnum).map((value) => (
              <option key={value} value={value}>
                {t(`category.${value}`)}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value as SupportTicketPriorityEnum | "");
              setPage(1);
            }}
            className={SELECT}
          >
            <option value="">{t("filter.allPriorities")}</option>
            {Object.values(SupportTicketPriorityEnum).map((value) => (
              <option key={value} value={value}>
                {t(`priority.${value}`)}
              </option>
            ))}
          </select>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500">
            <tr>
              <th className="px-4 py-3">{t("col.code")}</th>
              <th className="px-4 py-3">{t("col.customer")}</th>
              <th className="px-4 py-3">{t("col.category")}</th>
              <th className="px-4 py-3">{t("col.title")}</th>
              <th className="px-4 py-3">{t("col.priority")}</th>
              <th className="px-4 py-3">{t("col.contract")}</th>
              <th className="px-4 py-3">{t("col.assignee")}</th>
              <th className="px-4 py-3">{t("col.createdAt")}</th>
              <th className="px-4 py-3">{t("col.status")}</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={9} className="px-4 py-2">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-500">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              items.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => setOpenId(ticket.id)}
                  className={`cursor-pointer border-t border-slate-100 hover:bg-slate-50/70 ${
                    openId === ticket.id ? "bg-teal-50/60" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">
                    {ticket.ticketCode}
                  </td>
                  <td className="px-4 py-3">{refName(ticket.customer) ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{t(`category.${ticket.category}`)}</td>
                  <td className="max-w-[280px] truncate px-4 py-3 font-semibold text-slate-800">
                    {ticket.title}
                  </td>
                  <td className="px-4 py-3">
                    <Pill className={TICKET_PRIORITY_STYLE[ticket.priority]}>
                      {t(`priority.${ticket.priority}`)}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {contractCode(ticket.contract) ?? "—"}
                  </td>
                  <td className="px-4 py-3">{refName(ticket.assignedStaff) ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(ticket.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Pill className={TICKET_STATUS_STYLE[ticket.status]}>
                      {t(`status.${ticket.status}`)}
                    </Pill>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {data && data.pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span>
              {t("pageInfo", {
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

      {openId ? (
        <TicketSheet id={openId} portalBase={portalBase} onClose={() => setOpenId(null)} />
      ) : null}
    </div>
  );
}

function TicketSheet({
  id,
  portalBase,
  onClose,
}: {
  id: string;
  portalBase: FacilityPortal;
  onClose: () => void;
}) {
  const t = useTranslations("supportDesk");
  const locale = useLocale();
  const getErrorMessage = useApiErrorMessage();
  const currentUser = useAuthStore((state) => state.currentUser);
  const isManager =
    String(currentUser?.role ?? "").toLowerCase() === RoleEnum.FACILITY_MANAGER &&
    portalBase === "facility-manager";
  const ticketQuery = useSupportTicket(id);
  const staffQuery = useFacilityStaffs(undefined, isManager);
  const processMutation = useProcessSupportTicket(id);
  const completeMutation = useCompleteSupportTicket(id);

  const [assigneeId, setAssigneeId] = useState("");
  const [response, setResponse] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const ticket = ticketQuery.data;
  const open = ticket?.status === SupportTicketStatusEnum.PENDING;
  const answerable =
    ticket?.status === SupportTicketStatusEnum.PENDING ||
    ticket?.status === SupportTicketStatusEnum.PROCESSING;

  const handleProcess = async () => {
    setError(null);
    try {
      await processMutation.mutateAsync(
        isManager && assigneeId ? { assignedStaffId: assigneeId } : {}
      );
      toast.success(t("sheet.accepted"));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleComplete = async () => {
    setError(null);
    const payload = { responseMessage: response.trim(), attachments };
    if (!completeSupportTicketSchema.safeParse(payload).success) {
      setError(t("sheet.responseMin", { min: RESPONSE_MIN }));
      return;
    }
    try {
      await completeMutation.mutateAsync(payload);
      toast.success(t("sheet.completed"));
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const renderTicket = (value: SupportTicketResponse) => {
    const contractId = refId(value.contract);
    return (
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        <section className="rounded-xl border border-slate-200 p-4">
          <p className="mb-2 text-sm font-bold text-slate-800">{t("sheet.customer")}</p>
          <p className="font-semibold">{refName(value.customer) ?? "—"}</p>
          <p className="text-sm text-slate-500">
            {[refPhone(value.customer), contractCode(value.contract)].filter(Boolean).join(" · ")}
          </p>
        </section>
        <section className="space-y-2 rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-bold text-slate-800">{t("sheet.content")}</p>
          <p className="font-semibold">{value.title}</p>
          <p className="text-xs text-slate-500">
            {t(`category.${value.category}`)} · {formatDateTime(value.createdAt)}
          </p>
          <p className="whitespace-pre-line text-sm text-slate-600">{value.description}</p>
          {value.attachments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {value.attachments.map((url) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={url} src={url} alt="" className="h-20 w-24 rounded-lg object-cover" />
              ))}
            </div>
          ) : null}
          {contractId ? (
            <div className="flex flex-wrap gap-2">
              {isMoveRequestTicket(value) ? (
                <MoveTicketRackLink
                  contractId={contractId}
                  locale={locale}
                  portalBase={portalBase}
                />
              ) : null}
              <Link
                href={`/${locale}/${portalBase}/contracts/${contractId}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {t("sheet.openContract")}
              </Link>
            </div>
          ) : null}
        </section>

        {open ? (
          <section className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/40 p-4">
            <p className="text-sm font-bold text-slate-800">{t("sheet.acceptTitle")}</p>
            {isManager ? (
              <select
                value={assigneeId}
                onChange={(event) => setAssigneeId(event.target.value)}
                className={`${SELECT} w-full`}
              >
                <option value="">{t("sheet.assignSelf")}</option>
                {(staffQuery.data?.items ?? []).map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
            ) : null}
            <Button
              onClick={() => void handleProcess()}
              disabled={processMutation.isPending}
              className="bg-teal-600 text-white hover:bg-teal-700"
            >
              {processMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("sheet.accept")}
            </Button>
          </section>
        ) : null}

        {value.staffResponse ? (
          <section className="space-y-2 rounded-xl border-l-4 border-teal-600 bg-teal-50/50 p-4">
            <p className="text-xs font-semibold text-slate-500">
              {refName(value.staffResponse.respondedBy) ?? t("sheet.staff")} ·{" "}
              {formatDateTime(value.staffResponse.respondedAt)}
            </p>
            <p className="whitespace-pre-line text-sm">{value.staffResponse.responseMessage}</p>
          </section>
        ) : answerable ? (
          <section className="space-y-3 rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-slate-800">{t("sheet.responseTitle")} *</p>
            <textarea
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              rows={4}
              maxLength={3000}
              placeholder={t("sheet.responsePlaceholder")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
            <CloudinaryUploader
              value={attachments}
              onChange={setAttachments}
              folder={CloudinaryFolderEnum.SUPPORT_TICKETS}
              multiple
              maxFiles={MAX_ATTACHMENTS}
              accept="image/*"
              label={t("sheet.attachments", { max: MAX_ATTACHMENTS })}
            />
            <Button
              onClick={() => void handleComplete()}
              disabled={completeMutation.isPending}
              className="w-full bg-teal-600 text-white hover:bg-teal-700"
            >
              {completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("sheet.complete")}
            </Button>
          </section>
        ) : null}

        {value.cancellationReason ? (
          <p className="text-sm text-slate-500">
            {t("sheet.cancelReason", { reason: value.cancellationReason })}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
      </div>
    );
  };

  return (
    <Sheet open onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:!max-w-xl">
        <SheetHeader className="border-b border-slate-100 px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {t("sheet.kicker")}
          </p>
          <SheetTitle className="font-mono text-xl font-extrabold">
            {ticket?.ticketCode ?? "…"}
          </SheetTitle>
          {ticket ? (
            <div className="flex gap-2">
              <Pill className={TICKET_STATUS_STYLE[ticket.status]}>
                {t(`status.${ticket.status}`)}
              </Pill>
              <Pill className={TICKET_PRIORITY_STYLE[ticket.priority]}>
                {t(`priority.${ticket.priority}`)}
              </Pill>
            </div>
          ) : null}
        </SheetHeader>
        {ticket ? (
          renderTicket(ticket)
        ) : (
          <div className="space-y-3 p-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
