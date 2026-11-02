"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import {
  Building2,
  CreditCard,
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Landmark,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store";
import { RoleEnum } from "@self-storage-system-fe/shared";
import { useDeleteLegalEntity, useLegalEntities } from "../hooks";
import { CreateLegalEntityModal } from "./CreateLegalEntityModal";
import { EditLegalEntityModal } from "./EditLegalEntityModal";
import type { LegalEntityItem } from "../types";

export const LegalEntityListView: React.FC = () => {
  const locale = useLocale();
  const isEn = locale === "en";

  const currentUser = useAuthStore((s) => s.currentUser);
  const userRole = String(currentUser?.role ?? "").toLowerCase();
  const isSystemAdmin = userRole === RoleEnum.SYSTEM_ADMIN;

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "">("");
  const [sortBy, setSortBy] = useState<"createdAt" | "companyName" | "taxCode">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<LegalEntityItem | null>(null);
  const [deletingEntity, setDeletingEntity] = useState<LegalEntityItem | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useLegalEntities({
    search: searchInput.trim() || undefined,
    status: statusFilter || undefined,
    sortBy,
    sortOrder,
    page,
    limit: 10,
  });

  const deleteMutation = useDeleteLegalEntity();

  const handleDelete = async () => {
    if (!deletingEntity) return;
    try {
      await deleteMutation.mutateAsync(deletingEntity.id);
      toast.success(isEn ? "Legal entity deleted successfully." : "Đã xóa pháp nhân thành công.");
      setDeletingEntity(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        (isEn ? "Failed to delete legal entity." : "Không thể xóa pháp nhân.");
      toast.error(msg);
    }
  };

  const entities = data?.items || [];
  const pagination = data?.pagination;

  const activeCount = entities.filter((e) => e.status === "active").length;
  const inactiveCount = entities.filter((e) => e.status === "inactive").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Landmark className="w-7 h-7 text-emerald-600" />
            {isEn ? "Legal Business Entities" : "Quản lý Pháp nhân Doanh nghiệp"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isEn
              ? "Manage company legal entities, tax codes, and banking details for contracts & signing authorizations."
              : "Quản lý thông tin pháp nhân công ty, mã số thuế và tài khoản ngân hàng phục vụ lập hợp đồng và ủy quyền ký số."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-600 ${isFetching ? "animate-spin" : ""}`} />
            {isEn ? "Refresh" : "Làm mới"}
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            {isEn ? "+ Add Legal Entity" : "+ Thêm mới Pháp nhân"}
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {isEn ? "Total Entities" : "Tổng số pháp nhân"}
            </span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">
              {pagination?.totalItems ?? entities.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">
              {isEn ? "Active Entities" : "Đang hoạt động"}
            </span>
            <span className="text-2xl font-black text-emerald-800 mt-0.5 block">{activeCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              {isEn ? "Inactive / Suspended" : "Tạm ngưng"}
            </span>
            <span className="text-2xl font-black text-slate-700 mt-0.5 block">{inactiveCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
            placeholder={
              isEn
                ? "Search by company name or tax code..."
                : "Tìm kiếm theo tên công ty hoặc mã số thuế..."
            }
            className="w-full bg-slate-50 focus:bg-white text-xs text-slate-900 pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none transition-all"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as "active" | "inactive" | "");
            setPage(1);
          }}
          className="bg-slate-50 focus:bg-white text-xs text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
        >
          <option value="">{isEn ? "All Statuses" : "Tất cả trạng thái"}</option>
          <option value="active">{isEn ? "Active" : "Hoạt động"}</option>
          <option value="inactive">{isEn ? "Inactive" : "Tạm ngưng"}</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as "createdAt" | "companyName" | "taxCode");
            setPage(1);
          }}
          className="bg-slate-50 focus:bg-white text-xs text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
        >
          <option value="createdAt">
            {isEn ? "Sort by: Creation Date" : "Xếp theo: Ngày tạo"}
          </option>
          <option value="companyName">
            {isEn ? "Sort by: Company Name" : "Xếp theo: Tên công ty"}
          </option>
          <option value="taxCode">{isEn ? "Sort by: Tax Code" : "Xếp theo: Mã số thuế"}</option>
        </select>

        {/* Sort Order */}
        <button
          type="button"
          onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
          className="bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200 font-bold"
        >
          {sortOrder === "desc" ? "↓ Mới nhất" : "↑ Cũ nhất"}
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 mx-auto mb-2" />
            {isEn ? "Loading legal entities..." : "Đang tải danh sách pháp nhân..."}
          </div>
        ) : isError ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              {isEn ? "Failed to load legal entities." : "Không thể tải danh sách pháp nhân."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isEn ? "Retry" : "Thử lại"}
            </button>
          </div>
        ) : entities.length === 0 ? (
          <div className="p-14 text-center space-y-2">
            <Landmark className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              {isEn ? "No legal entities found" : "Chưa có pháp nhân doanh nghiệp nào"}
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {isEn
                ? "Click '+ Add Legal Entity' above to register the first business entity."
                : "Nhấn nút '+ Thêm mới Pháp nhân' ở góc trên để đăng ký pháp nhân đầu tiên."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">
                    {isEn ? "Company & Tax Code" : "Doanh nghiệp & MST"}
                  </th>
                  <th className="py-3.5 px-4">
                    {isEn ? "Registered Address" : "Trụ sở chính & Liên hệ"}
                  </th>
                  <th className="py-3.5 px-4">
                    {isEn ? "Legal Representative" : "Người đại diện pháp luật"}
                  </th>
                  <th className="py-3.5 px-4">{isEn ? "Bank Account" : "Tài khoản ngân hàng"}</th>
                  <th className="py-3.5 px-4">{isEn ? "Status" : "Trạng thái"}</th>
                  <th className="py-3.5 px-4 text-right">{isEn ? "Actions" : "Thao tác"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entities.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Company & Tax Code */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-xs leading-snug">
                        {item.companyName}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-mono text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          MST: {item.taxCode}
                        </span>
                      </div>
                    </td>

                    {/* Address & Contact */}
                    <td className="py-4 px-4 max-w-[240px]">
                      <div className="flex items-start gap-1 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2 leading-relaxed">
                          {item.registeredAddress}
                        </span>
                      </div>
                      {(item.phone || item.email) && (
                        <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                          {item.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{item.phone}</span>
                            </div>
                          )}
                          {item.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[200px]">{item.email}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Legal Representative */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>{item.legalRepresentative?.name || "—"}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 pl-4.5">
                        {item.legalRepresentative?.title || "—"}
                        {item.legalRepresentative?.idNumber && (
                          <span className="block font-mono text-[10px] text-slate-400">
                            CCCD: {item.legalRepresentative.idNumber}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Bank Account */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        <span>{item.bankAccount?.bankName || "—"}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-600 font-semibold mt-0.5">
                        STK: {item.bankAccount?.accountNumber || "—"}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        {item.bankAccount?.accountHolder || ""}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {item.status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          {isEn ? "Active" : "Hoạt động"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3 h-3" />
                          {isEn ? "Inactive" : "Tạm ngưng"}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingEntity(item)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-500" />
                          {isEn ? "Edit" : "Sửa"}
                        </button>

                        {isSystemAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeletingEntity(item)}
                            className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                            title={isEn ? "Delete" : "Xóa"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              {isEn
                ? `Showing page ${pagination.page} of ${pagination.totalPages} (${pagination.totalItems} total)`
                : `Trang ${pagination.page} / ${pagination.totalPages} (Tổng ${pagination.totalItems} pháp nhân)`}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 disabled:opacity-40"
              >
                {isEn ? "Previous" : "Trước"}
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 disabled:opacity-40"
              >
                {isEn ? "Next" : "Tiếp theo"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateLegalEntityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Edit Modal */}
      <EditLegalEntityModal
        isOpen={Boolean(editingEntity)}
        onClose={() => setEditingEntity(null)}
        entity={editingEntity}
      />

      {/* Delete Confirmation Modal */}
      {deletingEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">
                {isEn ? "Delete Legal Entity?" : "Xóa pháp nhân doanh nghiệp?"}
              </h3>
              <p className="text-xs text-slate-500">
                {isEn
                  ? `Are you sure you want to delete "${deletingEntity.companyName}"? This action can be audited.`
                  : `Bạn có chắc chắn muốn xóa pháp nhân "${deletingEntity.companyName}" (MST: ${deletingEntity.taxCode})?`}
              </p>
            </div>
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingEntity(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
              >
                {isEn ? "Cancel" : "Hủy"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {deleteMutation.isPending
                  ? isEn
                    ? "Deleting..."
                    : "Đang xóa..."
                  : isEn
                    ? "Confirm Delete"
                    : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
