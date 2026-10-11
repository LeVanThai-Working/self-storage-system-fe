"use client";

import React, { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Sparkles,
  Search,
  SlidersHorizontal,
  RotateCw,
  CheckCircle2,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Wrench,
  ShieldCheck,
  Tag,
  Eye,
  Plus,
  X,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAmenities } from "../hooks";
import { AmenityTypeEnum, AmenityStatusEnum, type AmenityItem } from "../types";
import { CreateAmenityModal } from "./CreateAmenityModal";
import { AmenityThumbnail } from "./AmenityThumbnail";
import { AmenityDetailModal } from "./AmenityDetailModal";
import { EditAmenityModal } from "./EditAmenityModal";
import { DeleteAmenityModal } from "./DeleteAmenityModal";
import { RestoreAmenityModal } from "./RestoreAmenityModal";

export const AmenityTable = () => {
  const t = useTranslations("businessOps.amenities");

  // Query state
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "type" | "status">("createdAt");
  const [sortOrder] = useState<"asc" | "desc">("desc");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [detailAmenity, setDetailAmenity] = useState<AmenityItem | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [editingAmenityId, setEditingAmenityId] = useState<string | null>(null);
  const [deletingAmenity, setDeletingAmenity] = useState<AmenityItem | null>(null);
  const [restoringAmenity, setRestoringAmenity] = useState<AmenityItem | null>(null);

  // Debounce search input
  const [, startTransition] = useTransition();
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    startTransition(() => {
      setDebouncedSearch(val);
      setPage(1);
    });
  };

  // Fetch amenities via TanStack Query
  const { data, isLoading, isFetching, refetch } = useAmenities({
    page,
    limit: pageSize,
    sortBy,
    sortOrder,
    search: debouncedSearch || undefined,
    type: selectedType !== "ALL" ? selectedType : undefined,
    status: selectedStatus !== "ALL" ? selectedStatus : undefined,
  });

  const amenities = data?.items || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: pageSize,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  };

  // Helper: Format type badge
  // Rule: Badge màu xanh blue cho PHYSICAL, màu tím cho SERVICE
  const renderTypeBadge = (type: string) => {
    if (type === AmenityTypeEnum.PHYSICAL) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs">
          <Wrench className="w-3.5 h-3.5 text-blue-600" />
          {t("type.physical")}
        </span>
      );
    }
    if (type === AmenityTypeEnum.SERVICE) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
          {t("type.service")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {type}
      </span>
    );
  };

  // Helper: Status badge
  const renderStatusBadge = (status: string) => {
    const isActive = status === AmenityStatusEnum.ACTIVE;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isActive
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
            : "bg-slate-100 text-slate-600 border border-slate-200"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
          }`}
        />
        {isActive ? t("status.active") : t("status.inactive")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            {t("title")}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{t("subtitle")}</p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t("addAmenity")}
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Amenities */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("stats.total")}
            </p>
            <p className="text-2xl font-black text-slate-900 mt-1">{pagination.totalItems}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Physical Equipment (Blue) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("stats.physical")}
            </p>
            <p className="text-2xl font-black text-blue-600 mt-1">
              {amenities.filter((a: AmenityItem) => a.type === AmenityTypeEnum.PHYSICAL).length}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        {/* Support Services (Purple) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("stats.service")}
            </p>
            <p className="text-2xl font-black text-purple-600 mt-1">
              {amenities.filter((a: AmenityItem) => a.type === AmenityTypeEnum.SERVICE).length}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Active Amenities (Emerald) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("stats.active")}
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {amenities.filter((a: AmenityItem) => a.status === AmenityStatusEnum.ACTIVE).length}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all duration-200"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Classification Filter (Category) */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
            >
              <option value="ALL">{t("typeFilter.all")}</option>
              <option value={AmenityTypeEnum.PHYSICAL}>{t("typeFilter.physical")}</option>
              <option value={AmenityTypeEnum.SERVICE}>{t("typeFilter.service")}</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
          >
            <option value="ALL">{t("statusFilter.all")}</option>
            <option value={AmenityStatusEnum.ACTIVE}>{t("statusFilter.active")}</option>
            <option value={AmenityStatusEnum.INACTIVE}>{t("statusFilter.inactive")}</option>
          </select>

          {/* Sort By Filter */}
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as "createdAt" | "name" | "type" | "status");
              setPage(1);
            }}
            className="bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs sm:text-sm font-medium text-slate-700 py-2.5 px-3.5 rounded-xl border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all cursor-pointer"
          >
            <option value="createdAt">{t("sortBy.createdAt")}</option>
            <option value="name">{t("sortBy.name")}</option>
            <option value="type">{t("sortBy.type")}</option>
            <option value="status">{t("sortBy.status")}</option>
          </select>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => refetch()}
            title={t("refresh")}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${isFetching ? "animate-spin text-teal-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Amenities Data Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">{t("table.name")}</th>
                <th className="py-4 px-6">{t("table.type")}</th>
                <th className="py-4 px-6">{t("table.tags")}</th>
                <th className="py-4 px-6">{t("table.status")}</th>
                <th className="py-4 px-6">{t("table.createdAt")}</th>
                <th className="py-4 px-6 text-right">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
              {isLoading ? (
                // Skeleton Rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="animate-pulse">
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-44 mb-1.5" />
                      <div className="h-3 bg-slate-50 rounded-md w-32" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-6 bg-slate-100 rounded-full w-28" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-24" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-6 bg-slate-100 rounded-full w-20" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="h-4 bg-slate-100 rounded-md w-24" />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="h-8 bg-slate-100 rounded-lg w-16 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : amenities.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">{t("empty.title")}</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      {t("empty.description")}
                    </p>
                  </td>
                </tr>
              ) : (
                // Data Rows
                amenities.map((amenity: AmenityItem) => (
                  <tr
                    key={amenity.id}
                    className="hover:bg-slate-50/70 transition-colors duration-150 group"
                  >
                    {/* Name & Description */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <AmenityThumbnail
                          images={amenity.images}
                          type={amenity.type}
                          name={amenity.name}
                          size="md"
                          onPreview={(url) => setPreviewImage({ url, title: amenity.name })}
                        />
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setDetailAmenity(amenity)}
                            className="font-bold text-slate-900 hover:text-teal-700 transition-colors text-left block truncate cursor-pointer"
                          >
                            {amenity.name}
                          </button>
                          {amenity.description && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-sm">
                              {amenity.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Classification Type (Blue for PHYSICAL, Purple for SERVICE) */}
                    <td className="py-4 px-6">{renderTypeBadge(amenity.type)}</td>

                    {/* Tags */}
                    <td className="py-4 px-6">
                      {amenity.tags && amenity.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {amenity.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                            >
                              <Tag className="w-2.5 h-2.5 text-slate-400" />
                              {tag}
                            </span>
                          ))}
                          {amenity.tags.length > 3 && (
                            <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md">
                              +{amenity.tags.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">{renderStatusBadge(amenity.status)}</td>

                    {/* Created Date */}
                    <td className="py-4 px-6 text-xs text-slate-500 font-medium">
                      {new Date(amenity.createdAt).toLocaleDateString("vi-VN")}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => setDetailAmenity(amenity)}
                          title={t("actions.viewDetails")}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => setEditingAmenityId(amenity.id)}
                          title={t("actions.edit")}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Restore Button (khi inactive) */}
                        {amenity.status === AmenityStatusEnum.INACTIVE && (
                          <button
                            type="button"
                            onClick={() => setRestoringAmenity(amenity)}
                            title={t("actions.restore")}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => setDeletingAmenity(amenity)}
                          title={t("actions.delete")}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && amenities.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              {t("pagination.showing")}{" "}
              <span className="font-bold text-slate-800">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              {t("pagination.to")}{" "}
              <span className="font-bold text-slate-800">
                {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
              </span>{" "}
              {t("pagination.of")}{" "}
              <span className="font-bold text-slate-800">{pagination.totalItems}</span>{" "}
              {t("pagination.amenities")}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!pagination.hasPrevPage || isFetching}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                {t("pagination.prev")}
              </button>

              <span className="px-3 py-1 font-bold text-slate-700 bg-slate-50 rounded-xl border border-slate-200/50">
                {pagination.page} / {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={!pagination.hasNextPage || isFetching}
                onClick={() => setPage((prev) => prev + 1)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
              >
                {t("pagination.next")}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Amenity Modal */}
      <CreateAmenityModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      {/* Amenity Detail Modal */}
      <AmenityDetailModal
        amenity={detailAmenity}
        isOpen={!!detailAmenity}
        onClose={() => setDetailAmenity(null)}
      />

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-2xl p-2 bg-slate-950/95 border-slate-800 rounded-3xl overflow-hidden text-white shadow-2xl">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="w-full max-h-[75vh] object-contain rounded-2xl"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-semibold text-white max-w-[80%] truncate">
                {previewImage.title}
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors"
                  title="Mở trong tab mới"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Amenity Modal */}
      <EditAmenityModal
        amenityId={editingAmenityId}
        isOpen={Boolean(editingAmenityId)}
        onClose={() => setEditingAmenityId(null)}
      />

      {/* Delete Amenity Modal */}
      <DeleteAmenityModal
        amenity={deletingAmenity}
        isOpen={Boolean(deletingAmenity)}
        onClose={() => setDeletingAmenity(null)}
      />

      {/* Restore Amenity Modal */}
      <RestoreAmenityModal
        amenity={restoringAmenity}
        isOpen={Boolean(restoringAmenity)}
        onClose={() => setRestoringAmenity(null)}
      />
    </div>
  );
};
