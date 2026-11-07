"use client";

import React from "react";
import { DoorOpen, Truck } from "lucide-react";
import { formatCurrency } from "@self-storage-system-fe/shared";
import type { ProductAndOperationsResponse } from "../types";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductOperationsTabProps {
  data?: ProductAndOperationsResponse;
  isLoading: boolean;
}

export function ProductOperationsTab({ data, isLoading }: ProductOperationsTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    unitTypePerformance,
    rackZonePerformance,
    amenityPerformance,
    bookingFunnel,
    warehouseTraffic,
  } = data;

  return (
    <div className="space-y-6">
      {/* 1. Booking Funnel */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h4 className="text-base font-extrabold text-slate-900">Phễu chuyển đổi đặt chỗ</h4>
            <p className="text-xs text-slate-500">Theo dõi tỷ lệ rớt khách qua từng bước đặt kho</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-teal-600">
              {bookingFunnel.overallConversionRate}%
            </span>
            <div className="text-[11px] font-semibold text-slate-400">Tỷ lệ hoàn tất toàn phễu</div>
          </div>
        </div>

        {/* Funnel Stage Bar */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-xl bg-slate-50 p-3.5 text-center text-xs">
            <span className="text-slate-500 font-medium">1. Khởi tạo</span>
            <div className="mt-1 text-lg font-black text-slate-900">
              {bookingFunnel.totalCreated}
            </div>
            <span className="text-[10px] text-slate-400">100%</span>
          </div>

          <div className="rounded-xl bg-blue-50/70 p-3.5 text-center text-xs">
            <span className="text-blue-700 font-medium">2. Đã cọc/thanh toán</span>
            <div className="mt-1 text-lg font-black text-blue-900">{bookingFunnel.paidCount}</div>
            <span className="text-[10px] text-blue-600 font-bold">
              {bookingFunnel.totalCreated > 0
                ? Math.round((bookingFunnel.paidCount / bookingFunnel.totalCreated) * 100)
                : 0}
              %
            </span>
          </div>

          <div className="rounded-xl bg-indigo-50/70 p-3.5 text-center text-xs">
            <span className="text-indigo-700 font-medium">3. Cơ sở xác nhận</span>
            <div className="mt-1 text-lg font-black text-indigo-900">
              {bookingFunnel.confirmedCount}
            </div>
            <span className="text-[10px] text-indigo-600 font-bold">
              {bookingFunnel.totalCreated > 0
                ? Math.round((bookingFunnel.confirmedCount / bookingFunnel.totalCreated) * 100)
                : 0}
              %
            </span>
          </div>

          <div className="rounded-xl bg-amber-50/70 p-3.5 text-center text-xs">
            <span className="text-amber-700 font-medium">4. Khách có mặt</span>
            <div className="mt-1 text-lg font-black text-amber-900">
              {bookingFunnel.arrivedCount}
            </div>
            <span className="text-[10px] text-amber-600 font-bold">
              {bookingFunnel.totalCreated > 0
                ? Math.round((bookingFunnel.arrivedCount / bookingFunnel.totalCreated) * 100)
                : 0}
              %
            </span>
          </div>

          <div className="rounded-xl bg-emerald-50/70 p-3.5 text-center text-xs">
            <span className="text-emerald-700 font-bold">5. Check-in hoàn tất</span>
            <div className="mt-1 text-lg font-black text-emerald-900">
              {bookingFunnel.completedCount}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold">
              {bookingFunnel.overallConversionRate}%
            </span>
          </div>
        </div>

        {/* Dropouts */}
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/40 p-3 text-xs text-rose-800">
          <span className="font-bold">Đơn không thành công:</span>
          <span>
            Hết hạn: <strong>{bookingFunnel.expiredCount}</strong>
          </span>
          <span>•</span>
          <span>
            Khách hủy: <strong>{bookingFunnel.cancelledCount}</strong>
          </span>
          <span>•</span>
          <span>
            Lỗi cơ sở hủy: <strong>{bookingFunnel.facilityFaultCancelCount}</strong>
          </span>
          <span>•</span>
          <span>
            Quá hạn nhận: <strong>{bookingFunnel.overdueCount}</strong>
          </span>
        </div>
      </div>

      {/* 2. Unit Types Performance */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mb-4">
          Hiệu suất danh mục loại kho
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3">Loại kho</th>
                <th className="py-3 px-3">Phân loại</th>
                <th className="py-3 px-3 text-right">Tổng số</th>
                <th className="py-3 px-3 text-right">Khả dụng</th>
                <th className="py-3 px-3 text-right">Đang thuê</th>
                <th className="py-3 px-3 text-right">Lấp đầy</th>
                <th className="py-3 px-3 text-right">Có hiệu lực</th>
                <th className="py-3 px-3 text-right">Doanh thu kỳ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {unitTypePerformance.map((ut) => (
                <tr key={ut.unitTypeId} className="hover:bg-slate-50/70">
                  <td className="py-3 px-3 font-bold text-slate-900">{ut.name}</td>
                  <td className="py-3 px-3 uppercase text-[11px] text-slate-500">
                    {ut.category} ({ut.area}m²)
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">{ut.totalUnits}</td>
                  <td className="py-3 px-3 text-right text-blue-600 font-bold">
                    {ut.availableUnits}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {ut.occupiedOrReservedUnits}
                  </td>
                  <td className="py-3 px-3 text-right font-black text-teal-600">
                    {ut.occupancyRate}%
                  </td>
                  <td className="py-3 px-3 text-right text-slate-800">{ut.activeContractCount}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">
                    {formatCurrency(ut.periodicRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Rack Zones & Amenities */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rack Zones */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mb-4">
            Hiệu quả phân khu kệ cho thuê
          </h4>
          <div className="space-y-3">
            {rackZonePerformance.map((rz, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 text-xs"
              >
                <div>
                  <div className="font-extrabold text-slate-900">Phân khu {rz.zone}</div>
                  <div className="text-[11px] text-slate-500">
                    Tổng: {rz.totalRacks} kệ | Trống: {rz.availableRacks} | Đang thuê:{" "}
                    {rz.rentedRacks}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-indigo-700">{rz.occupancyRate}%</span>
                  <div className="text-[10px] text-slate-400">Tỷ lệ lấp đầy</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Amenity Performance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
              Hiệu suất tiện ích & dịch vụ cộng thêm
            </h4>
            <span className="text-xs text-teal-700 font-bold">
              Gắn HĐ: {amenityPerformance.contractAttachRate}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="rounded-xl bg-slate-50 p-2.5">
              <span className="text-slate-500 text-[11px]">Tổng số lượng:</span>
              <div className="font-extrabold text-slate-900 text-sm">
                {amenityPerformance.totalQuantity}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5">
              <span className="text-slate-500 text-[11px]">Đang sử dụng:</span>
              <div className="font-extrabold text-teal-600 text-sm">
                {amenityPerformance.inUseQuantity} ({amenityPerformance.utilizationRate}%)
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Top tiện ích mang lại doanh thu
            </span>
            {amenityPerformance.topAmenities.slice(0, 4).map((am) => (
              <div
                key={am.amenityId}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-2 text-xs"
              >
                <span className="font-semibold text-slate-800">{am.name}</span>
                <span className="font-bold text-slate-900">{formatCurrency(am.totalRevenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Warehouse Traffic */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 mb-4">
          Lưu lượng khách & Biến động hàng hóa tại kho
        </h4>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Access Schedules */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold">
              <DoorOpen className="h-4 w-4 text-teal-600" />
              Lịch hẹn ra vào kho
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                Tổng lịch hẹn: <strong>{warehouseTraffic.accessSchedules.totalScheduled}</strong>
              </div>
              <div>
                Hoàn tất:{" "}
                <strong className="text-emerald-600">
                  {warehouseTraffic.accessSchedules.completedCount}
                </strong>
              </div>
              <div>
                Vắng mặt:{" "}
                <strong className="text-amber-600">
                  {warehouseTraffic.accessSchedules.noShowCount}
                </strong>
              </div>
              <div>
                Tổng lượt khách: <strong>{warehouseTraffic.accessSchedules.totalVisitors}</strong>
              </div>
            </div>
            <div className="pt-1 text-slate-500 text-[11px]">
              Tỷ lệ khách đến đúng hẹn:{" "}
              <strong>{warehouseTraffic.accessSchedules.completionRate}%</strong>
            </div>
          </div>

          {/* Movements */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-extrabold">
              <Truck className="h-4 w-4 text-indigo-600" />
              Giao nhận & Luân chuyển hàng hóa
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                Phiếu nhập kho:{" "}
                <strong>
                  {warehouseTraffic.inventoryMovements.inboundCount} (
                  {warehouseTraffic.inventoryMovements.inboundQuantity} món)
                </strong>
              </div>
              <div>
                Phiếu xuất kho:{" "}
                <strong>
                  {warehouseTraffic.inventoryMovements.outboundCount} (
                  {warehouseTraffic.inventoryMovements.outboundQuantity} món)
                </strong>
              </div>
              <div>
                Di dời kệ: <strong>{warehouseTraffic.inventoryMovements.moveCount}</strong>
              </div>
              <div>
                Điều chỉnh tồn kho:{" "}
                <strong>{warehouseTraffic.inventoryMovements.adjustCount}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
