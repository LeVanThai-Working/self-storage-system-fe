"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import { useFacilities } from "@/features/facility-management/hooks";
import { useOfferings } from "../hooks";
import {
  FacilityUnitTypeOfferingStatusEnum,
  type FacilityUnitTypeOfferingResponse,
} from "../types";
import { OfferingFormModal } from "./OfferingFormModal";
import { ConfirmOfferingModal } from "./ConfirmOfferingModal";

export const OfferingTable = () => {
  const t = useTranslations("businessOps.offerings");

  const [page, setPage] = useState(1);
  const [facilityId, setFacilityId] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<FacilityUnitTypeOfferingResponse | null>(null);
  const [deleting, setDeleting] = useState<FacilityUnitTypeOfferingResponse | null>(null);
  const [restoring, setRestoring] = useState<FacilityUnitTypeOfferingResponse | null>(null);

  const { data: facilitiesData } = useFacilities({ limit: 100 });
  const { data, isLoading, isFetching, refetch } = useOfferings({
    page,
    limit: 10,
    facilityId: facilityId !== "ALL" ? facilityId : undefined,
    status: status !== "ALL" ? (status as FacilityUnitTypeOfferingStatusEnum) : undefined,
  });

  const offerings = data?.items || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Tag className="w-5 h-5" />
            </div>
            {t("title")}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t("addOffering")}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
        <select
          value={facilityId}
          onChange={(e) => {
            setFacilityId(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 text-sm font-medium text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200/80 outline-none cursor-pointer"
        >
          <option value="ALL">{t("facilityFilter.all")}</option>
          {facilitiesData?.items.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="bg-slate-50 text-sm font-medium text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200/80 outline-none cursor-pointer"
        >
          <option value="ALL">{t("statusFilter.all")}</option>
          <option value={FacilityUnitTypeOfferingStatusEnum.ACTIVE}>
            {t("statusFilter.active")}
          </option>
          <option value={FacilityUnitTypeOfferingStatusEnum.INACTIVE}>
            {t("statusFilter.inactive")}
          </option>
        </select>

        <button
          type="button"
          onClick={() => refetch()}
          title={t("refresh")}
          className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
        >
          <RotateCw className={`w-4 h-4 ${isFetching ? "animate-spin text-teal-600" : ""}`} />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">{t("table.facility")}</th>
                <th className="py-4 px-6">{t("table.unitType")}</th>
                <th className="py-4 px-6">{t("table.price")}</th>
                <th className="py-4 px-6">{t("table.deposit")}</th>
                <th className="py-4 px-6">{t("table.minRentalDays")}</th>
                <th className="py-4 px-6">{t("table.status")}</th>
                <th className="py-4 px-6 text-right">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-4 px-6" colSpan={7}>
                      <div className="h-4 bg-slate-100 rounded-md w-full" />
                    </td>
                  </tr>
                ))
              ) : offerings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Tag className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">{t("empty.title")}</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {t("empty.description")}
                    </p>
                  </td>
                </tr>
              ) : (
                offerings.map((offering) => (
                  <tr key={offering.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{offering.facility.name}</div>
                      <div className="text-xs text-slate-400">{offering.facility.city}</div>
                    </td>
                    <td className="py-4 px-6">{offering.unitType.name}</td>
                    <td className="py-4 px-6">
                      {formatPrice(offering.pricePerUnit)}
                      <span className="text-xs text-slate-400">
                        /{t(`billingUnit.${offering.billingUnit}`)}
                      </span>
                    </td>
                    <td className="py-4 px-6">{offering.depositMultiplier}x</td>
                    <td className="py-4 px-6">{offering.minRentalDays}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          offering.status === FacilityUnitTypeOfferingStatusEnum.ACTIVE
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {offering.status === FacilityUnitTypeOfferingStatusEnum.ACTIVE
                          ? t("status.active")
                          : t("status.inactive")}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setEditing(offering)}
                          title={t("actions.edit")}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {offering.status === FacilityUnitTypeOfferingStatusEnum.INACTIVE ? (
                          <button
                            type="button"
                            onClick={() => setRestoring(offering)}
                            title={t("actions.restore")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleting(offering)}
                            title={t("actions.delete")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && offerings.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              {t("pagination.page")} {pagination.page}/{pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage || isFetching}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {t("pagination.prev")}
              </button>
              <button
                type="button"
                disabled={!pagination.hasNextPage || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 cursor-pointer"
              >
                {t("pagination.next")}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <OfferingFormModal
        offering={null}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
      <OfferingFormModal
        offering={editing}
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
      />
      <ConfirmOfferingModal mode="delete" offering={deleting} onClose={() => setDeleting(null)} />
      <ConfirmOfferingModal
        mode="restore"
        offering={restoring}
        onClose={() => setRestoring(null)}
      />
    </div>
  );
};
