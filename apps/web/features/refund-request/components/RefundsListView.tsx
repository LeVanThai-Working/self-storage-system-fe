"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store";
import { useRefundRequests } from "../hooks";
import { RefundStatusBadge } from "./RefundStatusBadge";
import { RefundReasonBadge, getRefundReasonLabel } from "./RefundReasonBadge";
import { RefundDetailModal } from "./RefundDetailModal";
import { CreateRefundModal } from "./CreateRefundModal";
import {
  OPS_APPROVAL_THRESHOLD,
  RefundRequestReasonEnum,
  RefundRequestStatusEnum,
  type EntitySummary,
  type RefundRequestResponse,
} from "../types";

interface RefundsListViewProps {
  forcedFacilityId?: string;
  pageTitle?: string;
  pageSubtitle?: string;
}

const formatVND = (num: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);

const formatDate = (isoString?: string | null) => {
  if (!isoString) return "—";
  try {
    return new Date(isoString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

const getEntityName = (entity: EntitySummary | string | null | undefined): string => {
  if (!entity) return "—";
  if (typeof entity === "string") return entity;
  return entity.name || entity.email || entity.id;
};

export const RefundsListView: React.FC<RefundsListViewProps> = ({
  forcedFacilityId,
  pageTitle = "Quản lý Yêu cầu Hoàn tiền",
  pageSubtitle = "Theo dõi, phê duyệt (Maker-Checker) và quản lý quy trình hoàn tiền tập trung",
}) => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const userRecord = currentUser as unknown as Record<string, unknown> | null;
  const userFacilityId =
    forcedFacilityId ||
    (currentUser?.role === "facility_staff" || currentUser?.role === "facility_manager"
      ? (typeof userRecord?.facilityId === "string" && userRecord.facilityId) ||
        (typeof userRecord?.assignedFacilityId === "string" && userRecord.assignedFacilityId) ||
        ((userRecord?.facility as Record<string, unknown>)?.id as string | undefined)
      : undefined);

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedReason, setSelectedReason] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "amount" | "status">("createdAt");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Modals state
  const [selectedRefund, setSelectedRefund] = useState<RefundRequestResponse | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Query
  const queryParams = {
    page,
    limit,
    facilityId: userFacilityId,
    status: selectedStatus !== "ALL" ? (selectedStatus as RefundRequestStatusEnum) : undefined,
    reason: selectedReason !== "ALL" ? (selectedReason as RefundRequestReasonEnum) : undefined,
    search: search.trim() || undefined,
    sortBy,
    sortOrder,
  };

  const { data, isLoading, isFetching, refetch } = useRefundRequests(queryParams);
  const items = data?.items || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  };

  const statusTabs = [
    { key: "ALL", label: "Tất cả" },
    { key: RefundRequestStatusEnum.PENDING_APPROVAL, label: "Chờ duyệt" },
    { key: RefundRequestStatusEnum.APPROVED, label: "Đã duyệt" },
    { key: RefundRequestStatusEnum.PAID, label: "Đã hoàn tất" },
    { key: RefundRequestStatusEnum.REJECTED, label: "Đã từ chối" },
    { key: RefundRequestStatusEnum.CANCELLED, label: "Đã hủy" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <RotateCcw className="w-6 h-6 text-emerald-600" />
            <span>{pageTitle}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">{pageSubtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </Button>

          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Tạo yêu cầu hoàn tiền</span>
          </Button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px">
        {statusTabs.map((tab) => {
          const isActive = selectedStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedStatus(tab.key);
                setPage(1);
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Tìm theo mã hoàn tiền..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 text-sm"
          />
        </div>

        {/* Reason Filter */}
        <Select
          value={selectedReason}
          onValueChange={(val) => {
            if (val) {
              setSelectedReason(val);
              setPage(1);
            }
          }}
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Lý do hoàn tiền" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả lý do</SelectItem>
            {Object.values(RefundRequestReasonEnum).map((r) => (
              <SelectItem key={r} value={r}>
                {getRefundReasonLabel(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select
          value={sortBy}
          onValueChange={(val) => {
            if (val) {
              setSortBy(val as "createdAt" | "amount" | "status");
              setPage(1);
            }
          }}
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Sắp xếp theo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Ngày tạo</SelectItem>
            <SelectItem value="amount">Số tiền</SelectItem>
            <SelectItem value="status">Trạng thái</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order */}
        <Button
          variant="outline"
          className="text-sm flex items-center justify-between"
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
        >
          <span className="text-slate-600">
            {sortOrder === "desc" ? "Giảm dần (Mới nhất)" : "Tăng dần (Cũ nhất)"}
          </span>
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/80">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Mã yêu cầu</TableHead>
              <TableHead className="font-semibold text-slate-700">Khách hàng</TableHead>
              <TableHead className="font-semibold text-slate-700">Lý do</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">Số tiền</TableHead>
              <TableHead className="font-semibold text-slate-700">Người tạo & Ngày</TableHead>
              <TableHead className="font-semibold text-slate-700 text-center">Trạng thái</TableHead>
              <TableHead className="font-semibold text-slate-700 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
                    <span>Đang tải danh sách yêu cầu hoàn tiền...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center text-slate-400">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-600">Không có yêu cầu hoàn tiền nào</p>
                    <p className="text-xs">Không tìm thấy bản ghi phù hợp với bộ lọc hiện tại</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const isOverThreshold = item.amount > OPS_APPROVAL_THRESHOLD;
                return (
                  <TableRow
                    key={item.id}
                    className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedRefund(item);
                      setIsDetailOpen(true);
                    }}
                  >
                    <TableCell className="font-mono font-bold text-slate-900 text-sm">
                      {item.refundCode}
                    </TableCell>

                    <TableCell>
                      <div className="text-sm font-medium text-slate-900">
                        {getEntityName(item.customer)}
                      </div>
                      <div className="text-xs text-slate-400">{getEntityName(item.facility)}</div>
                    </TableCell>

                    <TableCell>
                      <RefundReasonBadge reason={item.reason} />
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="font-bold text-slate-900 text-sm">
                        {formatVND(item.amount)}
                      </div>
                      {isOverThreshold && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 mt-0.5">
                          <ShieldAlert className="w-3 h-3 text-purple-600" />
                          &gt; 10M (Ops)
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500">
                      <div>{getEntityName(item.requestedBy)}</div>
                      <div className="text-[11px] text-slate-400">
                        {formatDate(item.requestedAt || item.createdAt)}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <RefundStatusBadge status={item.status} />
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-slate-600 hover:text-emerald-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRefund(item);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        <span>Xem</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
          <div>
            Hiển thị trang <strong>{pagination.page}</strong> trên tổng số{" "}
            <strong>{pagination.totalPages || 1}</strong> trang ({pagination.totalItems || 0} yêu
            cầu)
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (pagination.totalPages || 1) || isLoading}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 px-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RefundDetailModal
        refund={selectedRefund}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedRefund(null);
        }}
        onRefresh={() => refetch()}
      />

      <CreateRefundModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultFacilityId={userFacilityId}
        onSuccess={() => refetch()}
      />
    </div>
  );
};
