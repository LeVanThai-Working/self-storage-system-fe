"use client";

import React, { useState, useMemo } from "react";
import {
  Clock,
  Building2,
  Plus,
  RefreshCw,
  Calendar,
  List,
  Users,
  CheckCircle2,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { useFacilities } from "@/features/facility-management/hooks";
import type { FacilityResponse } from "@/features/facility-management/types";
import {
  useFacilityTimeSlots,
  useCreateFacilityTimeSlot,
  useUpdateFacilityTimeSlot,
  useDeleteFacilityTimeSlot,
} from "../hooks";
import type {
  FacilityTimeSlot,
  CreateFacilityTimeSlotRequest,
  UpdateFacilityTimeSlotRequest,
  DayOfWeek,
} from "../types";
import { WeeklyScheduleView } from "./WeeklyScheduleView";
import { TimeSlotListView } from "./TimeSlotListView";
import { TimeSlotFormModal } from "./TimeSlotFormModal";
import { DeleteTimeSlotModal } from "./DeleteTimeSlotModal";

interface FacilityTimeSlotsManagerProps {
  initialFacilityId?: string;
  hideFacilitySelector?: boolean;
}

export const FacilityTimeSlotsManager: React.FC<FacilityTimeSlotsManagerProps> = ({
  initialFacilityId,
  hideFacilitySelector = false,
}) => {
  // Fetch facilities list
  const { data: facilitiesData, isLoading: isLoadingFacilities } = useFacilities({
    limit: 100,
  });

  const facilities: FacilityResponse[] = useMemo(
    () => facilitiesData?.items || [],
    [facilitiesData]
  );

  // Selected facility state
  const [selectedFacilityIdState, setSelectedFacilityId] = useState<string>(
    initialFacilityId || ""
  );

  const selectedFacilityId = useMemo(() => {
    if (selectedFacilityIdState) return selectedFacilityIdState;
    if (facilities.length > 0) {
      const activeFac = facilities.find((f) => f.status === "active") || facilities[0];
      return activeFac.id;
    }
    return "";
  }, [selectedFacilityIdState, facilities]);

  const selectedFacility = useMemo(() => {
    return facilities.find((f) => f.id === selectedFacilityId) || null;
  }, [facilities, selectedFacilityId]);

  // Fetch slots for selected facility
  const {
    data: slots = [],
    isLoading: isLoadingSlots,
    isFetching: isFetchingSlots,
    refetch: refetchSlots,
  } = useFacilityTimeSlots(selectedFacilityId);

  // Mutations
  const createMutation = useCreateFacilityTimeSlot();
  const updateMutation = useUpdateFacilityTimeSlot();
  const deleteMutation = useDeleteFacilityTimeSlot();

  // View mode
  const [viewMode, setViewMode] = useState<"weekly" | "list">("weekly");

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingSlot, setEditingSlot] = useState<FacilityTimeSlot | null>(null);
  const [initialDayForNewSlot, setInitialDayForNewSlot] = useState<DayOfWeek>("ALL");
  const [deletingSlot, setDeletingSlot] = useState<FacilityTimeSlot | null>(null);

  // Summary Metrics
  const activeSlots = useMemo(() => slots.filter((s) => s.isActive), [slots]);
  const totalDailyCapacity = useMemo(
    () => activeSlots.reduce((acc, slot) => acc + (slot.maxCapacity ?? slot.slotCapacity ?? 0), 0),
    [activeSlots]
  );

  // Handlers
  const handleOpenCreateModal = (day: DayOfWeek = "ALL") => {
    setEditingSlot(null);
    setInitialDayForNewSlot(day);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (slot: FacilityTimeSlot) => {
    setEditingSlot(slot);
    setInitialDayForNewSlot((slot.dayOfWeek as DayOfWeek) || "ALL");
    setIsFormModalOpen(true);
  };

  const handleOpenDeleteModal = (slot: FacilityTimeSlot) => {
    setDeletingSlot(slot);
  };

  const handleFormSubmit = async (
    data: CreateFacilityTimeSlotRequest | { id: string; payload: UpdateFacilityTimeSlotRequest }
  ) => {
    if ("id" in data) {
      await updateMutation.mutateAsync({ id: data.id, payload: data.payload });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deletingSlot) {
      await deleteMutation.mutateAsync(deletingSlot.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Khung giờ Làm việc & Tiếp đón Khách hàng
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Cấu hình thời gian phục vụ, phân ca nhận kho và giới hạn lượt tiếp đón check-in/out theo
            ngày trong tuần.
          </p>
        </div>

        {/* Facility Selector Dropdown */}
        {!hideFacilitySelector && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative min-w-[280px]">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                <Building2 className="h-4 w-4" />
              </div>
              <select
                value={selectedFacilityId}
                onChange={(e) => setSelectedFacilityId(e.target.value)}
                disabled={isLoadingFacilities}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-10 py-2.5 text-xs font-bold text-slate-800 shadow-2xs transition-all hover:bg-slate-100 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {isLoadingFacilities ? (
                  <option>Đang tải danh sách cơ sở...</option>
                ) : facilities.length === 0 ? (
                  <option>Không có cơ sở</option>
                ) : (
                  facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code || f.city})
                    </option>
                  ))
                )}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleOpenCreateModal("ALL")}
              disabled={!selectedFacilityId}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 transition-all shrink-0"
            >
              <Plus className="h-4 w-4" />
              Thêm khung giờ
            </button>
          </div>
        )}
      </div>

      {/* Selected Facility Banner & Info */}
      {selectedFacility && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {selectedFacility.address}, {selectedFacility.city}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              Giờ mở cửa cơ sở:{" "}
              <strong className="text-slate-900 dark:text-slate-100 font-bold">
                {selectedFacility.operatingHours?.open || "07:00"} -{" "}
                {selectedFacility.operatingHours?.close || "22:00"}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1 */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Tổng số khung giờ
            </p>
            <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {isLoadingSlots ? "..." : slots.length}{" "}
              <span className="text-xs font-normal text-slate-400">ca</span>
            </h4>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Đang hoạt động
            </p>
            <h4 className="text-xl font-bold text-teal-600 dark:text-teal-400">
              {isLoadingSlots ? "..." : activeSlots.length}{" "}
              <span className="text-xs font-normal text-slate-400">ca</span>
            </h4>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Năng lực tiếp đón
            </p>
            <h4 className="text-xl font-bold text-amber-600 dark:text-amber-400">
              {isLoadingSlots ? "..." : totalDailyCapacity}{" "}
              <span className="text-xs font-normal text-slate-400">lượt/ngày</span>
            </h4>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Lịch đón tiếp
            </p>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {activeSlots.length > 0 ? "7 ngày / tuần" : "Chưa kích hoạt"}
            </h4>
          </div>
        </div>
      </div>

      {/* Control Bar: View Toggle & Refetch */}
      <div className="flex items-center justify-between gap-3">
        {/* View Switcher: Weekly Schedule vs List View */}
        <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setViewMode("weekly")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === "weekly"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Lịch tuần
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              viewMode === "list"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Danh sách chi tiết
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetchSlots()}
            disabled={isFetchingSlots}
            title="Làm mới dữ liệu"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-colors shadow-2xs"
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetchingSlots ? "animate-spin text-emerald-600" : ""}`}
            />
          </button>

          {hideFacilitySelector && (
            <button
              type="button"
              onClick={() => handleOpenCreateModal("ALL")}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm khung giờ
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {isLoadingSlots ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 animate-pulse mb-3">
            <Clock className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Đang tải dữ liệu khung giờ...
          </p>
          <p className="text-xs text-slate-400 mt-1">Vui lòng chờ trong giây lát</p>
        </div>
      ) : !selectedFacilityId ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm text-center p-6">
          <Building2 className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Chưa chọn cơ sở
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Vui lòng chọn một cơ sở kho từ danh sách phía trên để xem và cấu hình lịch tiếp đón.
          </p>
        </div>
      ) : slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm text-center p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-3">
            <Clock className="h-7 w-7" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Chưa có khung giờ làm việc nào
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Cơ sở này hiện chưa được thiết lập các khung giờ check-in/out đón khách. Hãy thiết lập
            khung giờ để khách hàng có thể đặt hẹn.
          </p>
          <button
            type="button"
            onClick={() => handleOpenCreateModal("ALL")}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            Tạo khung giờ đầu tiên
          </button>
        </div>
      ) : viewMode === "weekly" ? (
        <WeeklyScheduleView
          slots={slots}
          onAddSlot={(day) => handleOpenCreateModal(day || "ALL")}
          onEditSlot={handleOpenEditModal}
          onDeleteSlot={handleOpenDeleteModal}
        />
      ) : (
        <TimeSlotListView
          slots={slots}
          onEditSlot={handleOpenEditModal}
          onDeleteSlot={handleOpenDeleteModal}
        />
      )}

      {/* Form Modal (Create / Edit) */}
      <TimeSlotFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        facilityId={selectedFacilityId}
        facilityName={selectedFacility?.name}
        initialSlot={editingSlot}
        initialDayOfWeek={initialDayForNewSlot}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTimeSlotModal
        isOpen={Boolean(deletingSlot)}
        onClose={() => setDeletingSlot(null)}
        onConfirm={handleDeleteConfirm}
        slot={deletingSlot}
        facilityName={selectedFacility?.name}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
