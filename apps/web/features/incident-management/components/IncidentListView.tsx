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
  FileText,
  Plus,
  Search,
} from "lucide-react";
import {
  IncidentCategoryEnum,
  IncidentSeverityEnum,
  IncidentStatusEnum,
} from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { FacilityPortal } from "@/features/inventory-operations/components/RequestQueueView";
import { formatDateTime, refName } from "@/features/support-desk/utils";
import { fetchIncidents } from "../api";
import { incidentKeys, useIncidents } from "../hooks";
import {
  IncidentCategoryLabel,
  IncidentSeverityBadge,
  IncidentStatusBadge,
} from "./IncidentBadges";
import { ReportIncidentDialog } from "./ReportIncidentDialog";

const PAGE_SIZE = 10;
const SELECT = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";

const KPIS = [
  {
    key: "reported",
    filter: { status: IncidentStatusEnum.REPORTED },
    icon: Clock,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    key: "investigating",
    filter: { status: IncidentStatusEnum.INVESTIGATING },
    icon: Search,
    tone: "bg-sky-50 text-sky-700",
  },
  {
    key: "resolved",
    filter: { status: IncidentStatusEnum.RESOLVED },
    icon: CheckCircle2,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "critical",
    filter: { severity: IncidentSeverityEnum.CRITICAL, status: IncidentStatusEnum.REPORTED },
    icon: Bell,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    key: "closed",
    filter: { status: IncidentStatusEnum.CLOSED },
    icon: FileText,
    tone: "bg-slate-100 text-slate-600",
  },
] as const;

const location = (incident: {
  storageUnit?: { unitNumber?: string } | null;
  storageRack?: { rackCode?: string } | null;
  rackTier?: { tierNumber?: number } | null;
}) =>
  [
    incident.storageUnit?.unitNumber,
    incident.storageRack?.rackCode,
    incident.rackTier?.tierNumber
      ? `T${String(incident.rackTier.tierNumber).padStart(2, "0")}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ") || "—";

/** W1 — facility incidents: KPIs, filters, table and a "report incident" dialog. */
export function IncidentListView({ portalBase }: { portalBase: FacilityPortal }) {
  const t = useTranslations("incidentDesk");
  const locale = useLocale();
  const [status, setStatus] = useState<IncidentStatusEnum | "">("");
  const [category, setCategory] = useState<IncidentCategoryEnum | "">("");
  const [severity, setSeverity] = useState<IncidentSeverityEnum | "">("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reportOpen, setReportOpen] = useState(false);

  const listQuery = useIncidents({
    status: status || undefined,
    category: category || undefined,
    severity: severity || undefined,
    search: search.trim() || undefined,
    page,
    limit: PAGE_SIZE,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const kpiQueries = useQueries({
    queries: KPIS.map(({ filter }) => {
      const kpiQuery = { ...filter, page: 1, limit: 1 };
      return { queryKey: incidentKeys.list(kpiQuery), queryFn: () => fetchIncidents(kpiQuery) };
    }),
  });

  const data = listQuery.data;
  const items = data?.items ?? [];
  const resetPage = () => setPage(1);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => setReportOpen(true)}
          className="bg-orange-500 text-white hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          {t("report")}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {KPIS.map(({ key, icon: Icon, tone }, index) => (
          <div
            key={key}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-500">{t(`kpi.${key}`)}</p>
              <p className="text-2xl font-extrabold text-slate-900">
                {kpiQueries[index]?.data?.pagination.totalItems ?? "—"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 p-3">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPage();
            }}
            placeholder={t("searchPlaceholder")}
            className="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-400"
          />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as IncidentStatusEnum | "");
              resetPage();
            }}
            className={SELECT}
          >
            <option value="">{t("filter.allStatuses")}</option>
            {Object.values(IncidentStatusEnum).map((value) => (
              <option key={value} value={value}>
                {t(`status.${value}`)}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as IncidentCategoryEnum | "");
              resetPage();
            }}
            className={SELECT}
          >
            <option value="">{t("filter.allCategories")}</option>
            {Object.values(IncidentCategoryEnum).map((value) => (
              <option key={value} value={value}>
                {t(`category.${value}`)}
              </option>
            ))}
          </select>
          <select
            value={severity}
            onChange={(event) => {
              setSeverity(event.target.value as IncidentSeverityEnum | "");
              resetPage();
            }}
            className={SELECT}
          >
            <option value="">{t("filter.allSeverities")}</option>
            {Object.values(IncidentSeverityEnum).map((value) => (
              <option key={value} value={value}>
                {t(`severity.${value}`)}
              </option>
            ))}
          </select>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500">
            <tr>
              {(
                [
                  "code",
                  "severity",
                  "category",
                  "title",
                  "location",
                  "reporter",
                  "assignee",
                  "createdAt",
                  "status",
                ] as const
              ).map((col) => (
                <th key={col} className="px-4 py-3">
                  {t(`col.${col}`)}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  <td colSpan={10} className="px-4 py-2">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              items.map((incident) => {
                const needsAssign = incident.status === IncidentStatusEnum.REPORTED;
                return (
                  <tr key={incident.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">
                      {incident.incidentCode}
                    </td>
                    <td className="px-4 py-3">
                      <IncidentSeverityBadge severity={incident.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <IncidentCategoryLabel category={incident.category} />
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-3 font-semibold text-slate-800">
                      {incident.title}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{location(incident)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {refName(incident.reporter) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {incident.assignedStaff?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDateTime(incident.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <IncidentStatusBadge status={incident.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/${locale}/${portalBase}/incidents/${incident.id}`}>
                        <Button
                          size="sm"
                          variant={
                            needsAssign && portalBase === "facility-manager" ? "default" : "outline"
                          }
                          className={
                            needsAssign && portalBase === "facility-manager"
                              ? "bg-orange-500 text-white hover:bg-orange-600"
                              : ""
                          }
                        >
                          {needsAssign && portalBase === "facility-manager"
                            ? t("action.assign")
                            : t("action.view")}
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

      {reportOpen ? <ReportIncidentDialog onClose={() => setReportOpen(false)} /> : null}
    </div>
  );
}
