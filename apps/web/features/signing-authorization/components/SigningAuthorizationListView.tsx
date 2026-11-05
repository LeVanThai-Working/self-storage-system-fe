"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  FileSignature,
  Plus,
  Search,
  Eye,
  Edit2,
  Ban,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Building2,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { useMyFacility } from "@/features/storage-unit-management/hooks";
import { SigningAuthorizationStatusBadge } from "./SigningAuthorizationStatusBadge";
import { SigningAuthorizationDetailModal } from "./SigningAuthorizationDetailModal";
import { CreateSigningAuthorizationModal } from "./CreateSigningAuthorizationModal";
import { EditSigningAuthorizationModal } from "./EditSigningAuthorizationModal";
import { RevokeSigningAuthorizationModal } from "./RevokeSigningAuthorizationModal";
import { useSigningAuthorizations } from "../hooks";
import { formatDateOnly } from "../utils";
import type { SigningAuthorizationResponse } from "../types";

interface SigningAuthorizationListViewProps {
  portalBase: "system-admin" | "business-ops" | "facility-manager";
}

export const SigningAuthorizationListView: React.FC<SigningAuthorizationListViewProps> = ({
  portalBase,
}) => {
  const t = useTranslations("signingAuthorizations");
  const canManage = portalBase === "system-admin" || portalBase === "business-ops";
  const isFacilityManager = portalBase === "facility-manager";

  // Facility Manager user and facility scope
  const currentUser = useAuthStore((s) => s.currentUser);
  const userRecord = currentUser as unknown as Record<string, unknown> | null;
  const userFacilityId =
    (typeof userRecord?.facilityId === "string" && userRecord.facilityId) ||
    (typeof userRecord?.assignedFacilityId === "string" && userRecord.assignedFacilityId) ||
    ((userRecord?.facility as Record<string, unknown>)?.id as string | undefined);

  const { data: myFacility, isLoading: isLoadingFacility } = useMyFacility({
    enabled: isFacilityManager,
  });

  const activeFacilityId = isFacilityManager
    ? myFacility?.id || userFacilityId || undefined
    : undefined;

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "issuedDate" | "validFrom" | "validTo">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Selected item states for Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<SigningAuthorizationResponse | null>(null);
  const [editItem, setEditItem] = useState<SigningAuthorizationResponse | null>(null);
  const [revokeItem, setRevokeItem] = useState<SigningAuthorizationResponse | null>(null);

  const { data, isLoading: isLoadingList } = useSigningAuthorizations(
    {
      page,
      limit,
      status:
        statusFilter === "ALL" ? undefined : (statusFilter as "active" | "revoked" | "expired"),
      facilityId: activeFacilityId,
      sortBy,
      sortOrder,
    },
    {
      // Wait for facility query if in facility manager portal
      enabled: !isFacilityManager || !isLoadingFacility,
    }
  );

  const isLoading = isLoadingList || (isFacilityManager && isLoadingFacility);

  const rawItems = useMemo(() => data?.items || [], [data?.items]);
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Client search and strict facility manager isolation filter
  const filteredItems = useMemo(() => {
    let list = rawItems;

    // Defense-in-depth: If facility manager, strictly include only authorizations referencing their facility
    if (isFacilityManager) {
      if (!activeFacilityId) {
        return [];
      }
      list = list.filter((item) => {
        const facIds = (item.facilityIds || []).map((f) => {
          if (typeof f === "object" && f !== null) {
            const fRef = f as { _id?: string; id?: string };
            return fRef._id || fRef.id || "";
          }
          return String(f);
        });
        return facIds.includes(activeFacilityId);
      });
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter((item) => {
      const matchNumber = item.authorizationNumber?.toLowerCase().includes(q);
      const managerName =
        typeof item.authorizedUserId === "object" && item.authorizedUserId !== null
          ? item.authorizedUserId.name?.toLowerCase() || ""
          : "";
      const entityName =
        typeof item.legalEntityId === "object" && item.legalEntityId !== null
          ? item.legalEntityId.name?.toLowerCase() || ""
          : "";
      return matchNumber || managerName.includes(q) || entityName.includes(q);
    });
  }, [rawItems, searchQuery, isFacilityManager, activeFacilityId]);

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shadow-2xs">
              <FileSignature className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{t("title")}</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">{t("subtitle")}</p>

          {/* Facility Manager Scope Badge */}
          {isFacilityManager && myFacility && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-medium shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {t("facilityScope")}: <strong>{myFacility.name}</strong>
                {myFacility.code && (
                  <span className="font-mono text-emerald-700 ml-1.5 font-bold">
                    [{myFacility.code}]
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {canManage && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-2xl px-5 h-11 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-2 shadow-md shadow-teal-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>{t("addNew")}</span>
          </Button>
        )}
      </div>

      {/* Warning banner if Facility Manager has no assigned facility */}
      {isFacilityManager && !isLoadingFacility && !activeFacilityId && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{t("noFacilityAssigned")}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9 h-10 text-xs rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/80 text-xs font-semibold">
            {[
              { key: "ALL", label: t("allStatuses") },
              { key: "active", label: t("status.active") },
              { key: "revoked", label: t("status.revoked") },
              { key: "expired", label: t("status.expired") },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  statusFilter === tab.key
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "createdAt" | "issuedDate" | "validFrom" | "validTo")
            }
            className="h-9 px-3 rounded-2xl border border-slate-200 bg-white text-xs font-medium text-slate-700"
          >
            <option value="createdAt">{t("columns.createdAt")}</option>
            <option value="issuedDate">{t("modals.issuedDate")}</option>
            <option value="validFrom">{t("modals.validFrom")}</option>
            <option value="validTo">{t("modals.validTo")}</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="w-9 h-9 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50"
            title="Đổi chiều sắp xếp"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[1050px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4 whitespace-nowrap">
                  {t("columns.authorizationNumber")}
                </th>
                <th className="py-3.5 px-4 whitespace-nowrap">{t("columns.legalEntity")}</th>
                <th className="py-3.5 px-4 whitespace-nowrap">{t("columns.authorizedUser")}</th>
                <th className="py-3.5 px-4 whitespace-nowrap">{t("columns.facilities")}</th>
                <th className="py-3.5 px-4 whitespace-nowrap">{t("columns.validity")}</th>
                <th className="py-3.5 px-4 whitespace-nowrap">{t("columns.document")}</th>
                <th className="py-3.5 px-4 whitespace-nowrap">{t("columns.status")}</th>
                <th className="py-3.5 px-4 text-right whitespace-nowrap">{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4">
                      <div className="h-5 bg-slate-100 rounded-lg w-full"></div>
                    </td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileSignature className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium">{t("messages.empty")}</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const legalEntity =
                    typeof item.legalEntityId === "object" && item.legalEntityId !== null
                      ? item.legalEntityId
                      : null;
                  const authorizedUser =
                    typeof item.authorizedUserId === "object" && item.authorizedUserId !== null
                      ? item.authorizedUserId
                      : null;
                  const facilities = (item.facilityIds || []).map((f) =>
                    typeof f === "object" && f !== null ? f : { _id: String(f), name: String(f) }
                  );

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Auth Number */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 font-mono block">
                          {item.authorizationNumber}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDateOnly(item.issuedDate)}
                        </span>
                      </td>

                      {/* Legal Entity */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {legalEntity ? (
                          <div>
                            <span className="font-semibold text-slate-800 line-clamp-1">
                              {legalEntity.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              MST: {legalEntity.taxCode}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-400">
                            {String(item.legalEntityId)}
                          </span>
                        )}
                      </td>

                      {/* Authorized User */}
                      <td className="py-3.5 px-4 max-w-[180px]">
                        {authorizedUser ? (
                          <div>
                            <span className="font-semibold text-slate-800 line-clamp-1">
                              {authorizedUser.name}
                            </span>
                            <span className="text-[11px] text-slate-400 line-clamp-1">
                              {authorizedUser.email}
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-400">
                            {String(item.authorizedUserId)}
                          </span>
                        )}
                      </td>

                      {/* Facilities */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {facilities.slice(0, 2).map((fac, idx) => (
                            <span
                              key={fac._id || idx}
                              className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
                            >
                              {fac.name}
                            </span>
                          ))}
                          {facilities.length > 2 && (
                            <span className="px-1.5 py-0.5 rounded-lg bg-teal-50 text-teal-700 text-[10px] font-bold">
                              +{facilities.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Validity Period */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-[11px] space-y-0.5">
                          <div className="text-emerald-700 font-medium">
                            Từ: {formatDateOnly(item.validFrom)}
                          </div>
                          <div className="text-slate-600">Đến: {formatDateOnly(item.validTo)}</div>
                        </div>
                      </td>

                      {/* Document URL */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => window.open(item.documentUrl, "_blank")}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 hover:text-teal-700 hover:underline"
                        >
                          <span>{t("modals.viewDocument")}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <SigningAuthorizationStatusBadge status={item.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Detail Button */}
                          <button
                            type="button"
                            onClick={() => setDetailItem(item)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title={t("modals.detailTitle")}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Button (active only, manage only) */}
                          {canManage && item.status === "active" && (
                            <button
                              type="button"
                              onClick={() => setEditItem(item)}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                              title={t("modals.editTitle")}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Revoke Button (active only, manage only) */}
                          {canManage && item.status === "active" && (
                            <button
                              type="button"
                              onClick={() => setRevokeItem(item)}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title={t("modals.revokeTitle")}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span>
              {t("pagination.showing")}{" "}
              <strong className="text-slate-800">{filteredItems.length}</strong> /{" "}
              <strong className="text-slate-800">{pagination.totalItems}</strong>{" "}
              {t("pagination.records")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage || page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-xl h-8 px-2.5 text-xs gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>{t("pagination.prev")}</span>
            </Button>
            <span className="font-medium text-slate-700 px-2">
              {pagination.page} / {pagination.totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage || page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl h-8 px-2.5 text-xs gap-1"
            >
              <span>{t("pagination.next")}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateSigningAuthorizationModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <EditSigningAuthorizationModal
        authorization={editItem}
        isOpen={Boolean(editItem)}
        onClose={() => setEditItem(null)}
      />

      <RevokeSigningAuthorizationModal
        authorization={revokeItem}
        isOpen={Boolean(revokeItem)}
        onClose={() => setRevokeItem(null)}
      />

      <SigningAuthorizationDetailModal
        authorization={detailItem}
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
      />
    </div>
  );
};
