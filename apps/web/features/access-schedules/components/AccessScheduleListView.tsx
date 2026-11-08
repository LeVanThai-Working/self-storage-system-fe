"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useQueries } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  UserX,
} from "lucide-react";
import { AccessScheduleStatusEnum } from "@self-storage-system-fe/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiErrorMessage } from "@/features/auth/error-message";
import type { FacilityPortal } from "@/features/inventory-operations/types";
import { formatDateTime } from "@/features/support-desk/utils";
import { fetchAccessSchedules } from "../api";
import { accessScheduleKeys, useAccessSchedules } from "../hooks";
import { formatScheduleDate } from "../utils";
import { AccessScheduleStatusBadge } from "./AccessScheduleStatusBadge";

const PAGE_SIZE = 10;
const FIELD = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";

const KPIS = [
  {
    key: "pending",
    status: AccessScheduleStatusEnum.PENDING,
    icon: CalendarClock,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    key: "checkedIn",
    status: AccessScheduleStatusEnum.CHECKED_IN,
    icon: DoorOpen,
    tone: "bg-sky-50 text-sky-700",
  },
  {
    key: "completed",
    status: AccessScheduleStatusEnum.COMPLETED,
    icon: CheckCircle2,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "noShow",
    status: AccessScheduleStatusEnum.NO_SHOW,
    icon: UserX,
    tone: "bg-rose-50 text-rose-700",
  },
] as const;

/** Warehouse visits booked at the facility (view only): KPIs, filters, table and paging. */
export function AccessScheduleListView({ portalBase }: { portalBase: FacilityPortal }) {
  const t = useTranslations("accessScheduleDesk");
  const locale = useLocale();
  const getErrorMessage = useApiErrorMessage();
  const [status, setStatus] = useState<AccessScheduleStatusEnum | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const listQuery = useAccessSchedules({
    status: status || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit: PAGE_SIZE,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const kpiQueries = useQueries({
    queries: KPIS.map(({ status: kpiStatus }) => {
      const kpiQuery = { status: kpiStatus, page: 1, limit: 1 };
      return {
        queryKey: accessScheduleKeys.list(kpiQuery),
        queryFn: () => fetchAccessSchedules(kpiQuery),
      };
    }),
  });

  const data = listQuery.data;
  const items = data?.items ?? [];
  const resetPage = () => setPage(1);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 p-3">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AccessScheduleStatusEnum | "");
              resetPage();
            }}
            className={FIELD}
          >
            <option value="">{t("filter.allStatuses")}</option>
            {Object.values(AccessScheduleStatusEnum).map((value) => (
              <option key={value} value={value}>
                {t(`status.${value}`)}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            {t("filter.from")}
            <input
              type="date"
              value={startDate}
              onChange={(event) => {
                setStartDate(event.target.value);
                resetPage();
              }}
              className={FIELD}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            {t("filter.to")}
            <input
              type="date"
              value={endDate}
              onChange={(event) => {
                setEndDate(event.target.value);
                resetPage();
              }}
              className={FIELD}
            />
          </label>
        </div>

        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500">
            <tr>
              {(
                [
                  "code",
                  "customer",
                  "contract",
                  "slot",
                  "people",
                  "vehicle",
                  "checkedIn",
                  "checkedOut",
                  "status",
                ] as const
              ).map((col) => (
                <th key={col} className="whitespace-nowrap px-4 py-3">
                  {t(`col.${col}`)}
                </th>
              ))}
              <th className="whitespace-nowrap px-4 py-3" />
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
            ) : listQuery.isError ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-rose-700">
                  {getErrorMessage(listQuery.error)}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-500">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              items.map((schedule) => (
                <tr key={schedule.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-800">
                    {schedule.scheduleCode}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {schedule.customerName ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {schedule.contractCode ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatScheduleDate(schedule.scheduledDate)} · {schedule.startTime}–
                    {schedule.endTime}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{schedule.numberOfPeople}</td>
                  <td className="px-4 py-3 text-slate-600">{schedule.vehiclePlate ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {schedule.checkedInAt ? formatDateTime(schedule.checkedInAt) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {schedule.checkedOutAt ? formatDateTime(schedule.checkedOutAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <AccessScheduleStatusBadge status={schedule.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/${locale}/${portalBase}/access-schedules/${schedule.id}`}>
                      <Button size="sm" variant="outline">
                        {t("view")}
                      </Button>
                    </Link>
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
    </div>
  );
}
