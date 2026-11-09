"use client";

import React from "react";
import { Boxes, CalendarCheck, CheckCircle, FileSignature, Layers, Scale } from "lucide-react";
import type { OverviewStatisticsResponse } from "../types";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewTabProps {
  data?: OverviewStatisticsResponse;
  isLoading: boolean;
}

function ProgressItem({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="font-bold text-slate-900">
          {value} ({percent}%)
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function OverviewTab({ data, isLoading }: OverviewTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const { occupancy, contractsAndBookings } = data;

  return (
    <div className="space-y-6">
      {/* 1. Occupancy Metrics & Capacity Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Storage Units */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Lấp đầy phòng kho</h4>
                <p className="text-xs text-slate-500">
                  Tổng quy mô: {occupancy.storageUnits.total} phòng kho
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-teal-600">
                {occupancy.storageUnits.occupancyRate}%
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Lấp đầy diện tích: {occupancy.storageUnits.areaOccupancyRate}%
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <ProgressItem
              label="Đang thuê"
              value={occupancy.storageUnits.occupied}
              total={occupancy.storageUnits.total}
              color="bg-emerald-500"
            />
            <ProgressItem
              label="Đặt trước chờ nhận"
              value={occupancy.storageUnits.reserved}
              total={occupancy.storageUnits.total}
              color="bg-amber-500"
            />
            <ProgressItem
              label="Sẵn sàng cho thuê"
              value={occupancy.storageUnits.available}
              total={occupancy.storageUnits.total}
              color="bg-blue-500"
            />
            <ProgressItem
              label="Bảo trì / Chờ dọn kho"
              value={
                occupancy.storageUnits.underMaintenance + occupancy.storageUnits.pendingClearance
              }
              total={occupancy.storageUnits.total}
              color="bg-slate-400"
            />
          </div>
        </div>

        {/* Storage Racks */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900">Lấp đầy kệ cho thuê</h4>
                <p className="text-xs text-slate-500">
                  Tổng hệ thống kệ: {occupancy.storageRacks.total} kệ
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-indigo-600">
                {occupancy.storageRacks.occupancyRate}%
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <ProgressItem
              label="Đang cho thuê"
              value={occupancy.storageRacks.rented}
              total={occupancy.storageRacks.total}
              color="bg-indigo-600"
            />
            <ProgressItem
              label="Đặt trước chờ check-in"
              value={occupancy.storageRacks.reserved}
              total={occupancy.storageRacks.total}
              color="bg-amber-500"
            />
            <ProgressItem
              label="Kệ trống khả dụng"
              value={occupancy.storageRacks.available}
              total={occupancy.storageRacks.total}
              color="bg-blue-500"
            />
            <ProgressItem
              label="Đang bảo dưỡng / Khóa"
              value={occupancy.storageRacks.maintenance + occupancy.storageRacks.inactive}
              total={occupancy.storageRacks.total}
              color="bg-slate-400"
            />
          </div>
        </div>
      </div>

      {/* 3. Contracts & Bookings Lifecycle */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-4">
          Hợp đồng & Đơn đặt chỗ phát sinh trong kỳ
        </h4>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-xs text-slate-500 font-medium">Hợp đồng đang hiệu lực</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {contractsAndBookings.activeContracts}
              </span>
              <FileSignature className="h-4 w-4 text-emerald-600" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-xs text-slate-500 font-medium">Hợp đồng nợ quá hạn</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600">
                {contractsAndBookings.overdueContracts}
              </span>
              <Scale className="h-4 w-4 text-rose-500" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-xs text-slate-500 font-medium">Đơn đặt chỗ mới</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-600">
                {contractsAndBookings.newReservationsInPeriod}
              </span>
              <CalendarCheck className="h-4 w-4 text-blue-500" />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <span className="text-xs text-slate-500 font-medium">Nhận phòng hoàn tất</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-teal-600">
                {contractsAndBookings.completedReservationsInPeriod}
              </span>
              <CheckCircle className="h-4 w-4 text-teal-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
