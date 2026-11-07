"use client";

import React from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  RotateCcw,
  Unplug,
} from "lucide-react";
import type { OverviewStatisticsResponse, StatisticsUserRole } from "../types";

interface ActionRequiredSectionProps {
  actionRequired?: OverviewStatisticsResponse["actionRequired"];
  role: StatisticsUserRole;
}

export function ActionRequiredSection({ actionRequired, role }: ActionRequiredSectionProps) {
  const locale = useLocale();

  if (!actionRequired) return null;

  const totalActions =
    (actionRequired.pendingApprovals || 0) +
    (actionRequired.pendingOpsRefunds || 0) +
    (actionRequired.unmatchedSepayTransactions || 0) +
    (actionRequired.openHighCriticalIncidents || 0);

  const basePath =
    role === "facility_manager"
      ? `/${locale}/facility-manager`
      : role === "system_admin"
        ? `/${locale}/system-admin`
        : `/${locale}/business-ops`;

  const items = [
    {
      key: "approvals",
      count: actionRequired.pendingApprovals,
      label: "Đề xuất chờ duyệt",
      sublabel: "Đơn đổi kho, gia hạn hoặc chính sách",
      icon: FileCheck2,
      href: `${basePath}/approvals`,
      color: "text-amber-700 bg-amber-50 border-amber-200",
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      key: "refunds",
      count: actionRequired.pendingOpsRefunds,
      label: "Hoàn tiền chờ xử lý",
      sublabel: "Các lệnh hoàn tiền cần đối soát & chi trả",
      icon: RotateCcw,
      href: `${basePath}/refunds`,
      color: "text-rose-700 bg-rose-50 border-rose-200",
      badgeColor: "bg-rose-100 text-rose-800",
    },
    {
      key: "sepay",
      count: actionRequired.unmatchedSepayTransactions,
      label: "Giao dịch SePay chưa khớp",
      sublabel: "Biến động số dư chưa gán hóa đơn/đơn đặt chỗ",
      icon: Unplug,
      href: `${basePath}/reconciliation`,
      color: "text-blue-700 bg-blue-50 border-blue-200",
      badgeColor: "bg-blue-100 text-blue-800",
    },
    {
      key: "incidents",
      count: actionRequired.openHighCriticalIncidents,
      label: "Sự cố nghiêm trọng chưa đóng",
      sublabel: "Mức độ khẩn cấp (High/Critical) cần xử lý",
      icon: AlertTriangle,
      href: `${basePath}/incidents`,
      color: "text-red-700 bg-red-50 border-red-200",
      badgeColor: "bg-red-100 text-red-800",
    },
  ];

  if (totalActions === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-900 shadow-2xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold">Hệ thống vận hành trơn tru</h4>
          <p className="text-xs text-emerald-700">
            Không có đề xuất phê duyệt tồn đọng, sự cố khẩn cấp hay giao dịch ngân hàng chưa khớp
            nào trong cơ sở.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-xs font-black">
            {totalActions}
          </span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Hạng mục vận hành cần xử lý ngay
          </h3>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all hover:shadow-md ${item.color}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/80 shadow-2xs">
                  <item.icon className="h-4 w-4" />
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-black ${item.badgeColor}`}
                >
                  {item.count}
                </span>
              </div>
              <h4 className="mt-3 text-sm font-bold leading-tight">{item.label}</h4>
              <p className="mt-1 text-xs opacity-80 leading-normal">{item.sublabel}</p>
            </div>

            <div className="mt-4 flex items-center gap-1 text-xs font-bold transition-transform group-hover:translate-x-1">
              <span>Xử lý ngay</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
