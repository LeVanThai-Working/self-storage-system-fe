/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Archive,
  ChevronDown,
  ChevronRight,
  Layers,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
  X,
  CheckCircle2,
  DollarSign,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApiErrorMessage } from "@/features/auth/error-message";
import {
  useCreateStorageRack,
  useDeleteStorageRack,
  useUnitStorageRacks,
  useUpdateRackTier,
  useUpdateStorageRack,
} from "../hooks";
import {
  RackStatusEnum,
  RackTierStatusEnum,
  RackZoneEnum,
  type RackTierResponse,
  type StorageRackResponse,
  type StorageUnitResponse,
} from "../types";

interface StorageRackManagementModalProps {
  unit: StorageUnitResponse;
  isOpen: boolean;
  onClose: () => void;
  isManager?: boolean;
}

const ZONE_COLORS: Record<RackZoneEnum, string> = {
  [RackZoneEnum.PRIME]: "bg-amber-50 text-amber-700 border-amber-200",
  [RackZoneEnum.STANDARD]: "bg-blue-50 text-blue-700 border-blue-200",
  [RackZoneEnum.ECONOMY]: "bg-slate-100 text-slate-700 border-slate-200",
};

const RACK_STATUS_STYLES: Record<string, string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  rented: "bg-purple-50 text-purple-700 border-purple-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  maintenance: "bg-orange-50 text-orange-700 border-orange-200",
  inactive: "bg-slate-100 text-slate-500 border-slate-200",
};

export const StorageRackManagementModal: React.FC<StorageRackManagementModalProps> = ({
  unit,
  isOpen,
  onClose,
  isManager = true,
}) => {
  const getErrorMessage = useApiErrorMessage();
  const { data: racks = [], isLoading, isError, error, refetch } = useUnitStorageRacks(unit.id);

  const createRackMutation = useCreateStorageRack();
  const updateRackMutation = useUpdateStorageRack();
  const updateTierMutation = useUpdateRackTier();
  const deleteRackMutation = useDeleteStorageRack();

  const [expandedRackIds, setExpandedRackIds] = useState<Record<string, boolean>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRack, setEditingRack] = useState<StorageRackResponse | null>(null);
  const [editingTier, setEditingTier] = useState<RackTierResponse | null>(null);
  const [deletingRackId, setDeletingRackId] = useState<string | null>(null);

  // Form states for new rack
  const [rackCode, setRackCode] = useState("");
  const [aisle, setAisle] = useState("");
  const [bay, setBay] = useState<number | "">("");
  const [zone, setZone] = useState<RackZoneEnum | "">(RackZoneEnum.STANDARD);
  const [tierCount, setTierCount] = useState<number>(3);
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [defaultMaxWeight, setDefaultMaxWeight] = useState<number | "">("");
  const [defaultLength, setDefaultLength] = useState<number | "">("");
  const [defaultWidth, setDefaultWidth] = useState<number | "">("");
  const [defaultHeight, setDefaultHeight] = useState<number | "">("");
  const [createError, setCreateError] = useState<string | null>(null);

  // Form state for edit tier
  const [tierMaxWeight, setTierMaxWeight] = useState<number | "">("");
  const [tierStatus, setTierStatus] = useState<RackTierStatusEnum>(RackTierStatusEnum.AVAILABLE);
  const [tierLength, setTierLength] = useState<number | "">("");
  const [tierWidth, setTierWidth] = useState<number | "">("");
  const [tierHeight, setTierHeight] = useState<number | "">("");

  const toggleExpand = (rackId: string) => {
    setExpandedRackIds((prev) => ({ ...prev, [rackId]: !prev[rackId] }));
  };

  const handleOpenCreate = () => {
    setRackCode(`RK-${String(racks.length + 1).padStart(2, "0")}`);
    setAisle("A");
    setBay(racks.length + 1);
    setZone(RackZoneEnum.STANDARD);
    setTierCount(3);
    setCustomPrice("");
    setDefaultMaxWeight(250);
    setDefaultLength(1.2);
    setDefaultWidth(0.8);
    setDefaultHeight(0.6);
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleCreateRack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rackCode.trim()) {
      setCreateError("Vui lòng nhập mã kệ (Rack Code)");
      return;
    }
    setCreateError(null);

    try {
      await createRackMutation.mutateAsync({
        storageUnitId: unit.id,
        rackCode: rackCode.trim(),
        aisle: aisle.trim().toUpperCase() || undefined,
        bay: typeof bay === "number" ? bay : undefined,
        zone: zone || undefined,
        customPrice: typeof customPrice === "number" ? customPrice : undefined,
        tierCount: Number(tierCount) || 1,
        defaultTierMaxWeightKg: typeof defaultMaxWeight === "number" ? defaultMaxWeight : undefined,
        defaultTierDimensions:
          typeof defaultLength === "number" &&
          typeof defaultWidth === "number" &&
          typeof defaultHeight === "number"
            ? { length: defaultLength, width: defaultWidth, height: defaultHeight }
            : undefined,
      });

      toast.success(`Đã tạo kệ ${rackCode.trim()} thành công!`);
      setIsCreateOpen(false);
      refetch();
    } catch (err) {
      setCreateError(getErrorMessage(err));
    }
  };

  const handleDeleteRack = async (rackId: string) => {
    try {
      await deleteRackMutation.mutateAsync(rackId);
      toast.success("Đã xóa kệ kho thành công!");
      setDeletingRackId(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleOpenEditTier = (tier: RackTierResponse) => {
    setEditingTier(tier);
    setTierMaxWeight(tier.maxWeightKg ?? "");
    setTierStatus((tier.status as RackTierStatusEnum) || RackTierStatusEnum.AVAILABLE);
    setTierLength(tier.dimensions?.length ?? "");
    setTierWidth(tier.dimensions?.width ?? "");
    setTierHeight(tier.dimensions?.height ?? "");
  };

  const handleSaveTier = async () => {
    if (!editingTier) return;
    try {
      await updateTierMutation.mutateAsync({
        tierId: editingTier.id,
        payload: {
          maxWeightKg: typeof tierMaxWeight === "number" ? tierMaxWeight : undefined,
          status: tierStatus,
          dimensions:
            typeof tierLength === "number" &&
            typeof tierWidth === "number" &&
            typeof tierHeight === "number"
              ? { length: tierLength, width: tierWidth, height: tierHeight }
              : undefined,
        },
      });
      toast.success(`Đã cập nhật tầng kệ ${editingTier.tierCode}!`);
      setEditingTier(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto p-6 rounded-3xl border-slate-100 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Hệ thống Kệ kho · Phòng {unit.unitNumber}
                </DialogTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tầng {unit.floor} {unit.zone ? `· Khu ${unit.zone}` : ""} · Quản lý danh sách kệ
                  và tầng kệ (RackTiers)
                </p>
              </div>
            </div>

            {isManager && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm kệ mới
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Create Rack Form Modal / Accordion */}
        {isCreateOpen && (
          <form
            onSubmit={handleCreateRack}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 my-2 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-800 text-sm">Thêm Kệ Kho Mới</span>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Mã kệ (Rack Code) *
                </label>
                <input
                  type="text"
                  required
                  value={rackCode}
                  onChange={(e) => setRackCode(e.target.value)}
                  placeholder="VD: RK-01"
                  className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dãy (Aisle)</label>
                <input
                  type="text"
                  value={aisle}
                  onChange={(e) => setAisle(e.target.value)}
                  placeholder="VD: A"
                  className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500 uppercase"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Vị trí (Bay)</label>
                <input
                  type="number"
                  min={1}
                  value={bay}
                  onChange={(e) => setBay(e.target.value ? Number(e.target.value) : "")}
                  placeholder="VD: 1"
                  className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Khu vực giá (Zone)
                </label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value as RackZoneEnum)}
                  className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                >
                  <option value={RackZoneEnum.PRIME}>PRIME (Vị trí đắc địa)</option>
                  <option value={RackZoneEnum.STANDARD}>STANDARD (Tiêu chuẩn)</option>
                  <option value={RackZoneEnum.ECONOMY}>ECONOMY (Tiết kiệm)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Số tầng kệ (Tiers)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={tierCount}
                  onChange={(e) => setTierCount(Number(e.target.value))}
                  className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Đơn giá riêng (VNĐ/tháng)
                </label>
                <input
                  type="number"
                  min={0}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Để trống = theo cơ sở"
                  className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="font-semibold text-slate-600 block mb-2">
                Thông số mặc định từng tầng:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">Tải trọng (kg)</label>
                  <input
                    type="number"
                    min={1}
                    value={defaultMaxWeight}
                    onChange={(e) =>
                      setDefaultMaxWeight(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="VD: 250"
                    className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Dài (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.1}
                    value={defaultLength}
                    onChange={(e) => setDefaultLength(e.target.value ? Number(e.target.value) : "")}
                    placeholder="VD: 1.2"
                    className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Rộng (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.1}
                    value={defaultWidth}
                    onChange={(e) => setDefaultWidth(e.target.value ? Number(e.target.value) : "")}
                    placeholder="VD: 0.8"
                    className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Cao (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0.1}
                    value={defaultHeight}
                    onChange={(e) => setDefaultHeight(e.target.value ? Number(e.target.value) : "")}
                    placeholder="VD: 0.6"
                    className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>

            {createError && (
              <p className="text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 text-xs">
                {createError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={createRackMutation.isPending}
                className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition"
              >
                {createRackMutation.isPending ? "Đang tạo..." : "Xác nhận tạo kệ"}
              </button>
            </div>
          </form>
        )}

        {/* Racks List */}
        <div className="space-y-3 py-2">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-rose-500 bg-rose-50 rounded-2xl border border-rose-100 text-xs">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-400" />
              <p className="font-bold">Không thể tải danh sách kệ kho</p>
              <p className="text-slate-500 mt-1">{getErrorMessage(error)}</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-semibold"
              >
                <RotateCw className="w-3.5 h-3.5" /> Thử lại
              </button>
            </div>
          ) : racks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs">
              <Archive className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-600">Phòng này chưa có kệ kho nào</p>
              <p className="mt-0.5">
                Bấm &quot;Thêm kệ mới&quot; để thiết lập sơ đồ kệ và số tầng kệ cho khách thuê.
              </p>
            </div>
          ) : (
            racks.map((rack) => {
              const isExpanded = Boolean(expandedRackIds[rack.id]);
              const zoneStyle = rack.zone ? ZONE_COLORS[rack.zone as RackZoneEnum] : "";
              const statusStyle =
                RACK_STATUS_STYLES[rack.status] ?? "bg-slate-100 text-slate-600 border-slate-200";

              return (
                <div
                  key={rack.id}
                  className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden transition shadow-xs"
                >
                  {/* Rack Header Row */}
                  <div className="p-3.5 flex items-center justify-between gap-3 bg-slate-50/50 hover:bg-slate-50">
                    <button
                      type="button"
                      onClick={() => toggleExpand(rack.id)}
                      className="flex items-center gap-3 text-left flex-1 cursor-pointer"
                    >
                      <div className="p-1 rounded-lg bg-slate-100 text-slate-500">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {rack.rackCode}
                          </span>
                          {rack.zone && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${zoneStyle}`}
                            >
                              {rack.zone}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusStyle}`}
                          >
                            {rack.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-0.5">
                          {rack.aisle ? `Dãy ${rack.aisle}` : "Chưa chia dãy"}
                          {rack.bay ? ` · Bay ${rack.bay}` : ""}
                          {" · "}
                          <span className="font-semibold text-slate-700">
                            {rack.tierCount} tầng kệ
                          </span>
                          {rack.customPrice
                            ? ` · ${rack.customPrice.toLocaleString("vi-VN")} đ/tháng`
                            : ""}
                        </p>
                      </div>
                    </button>

                    {isManager && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteRack(rack.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa kệ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Rack Tiers Sub-list */}
                  {isExpanded && (
                    <div className="p-3 bg-slate-50/30 border-t border-slate-100 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                        Danh sách tầng kệ ({rack.tiers?.length ?? 0} tầng):
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {(rack.tiers ?? []).map((tier) => (
                          <div
                            key={tier.id}
                            className="p-2.5 rounded-xl bg-white border border-slate-200/70 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-800">
                                {tier.tierCode} (T{tier.tierNumber})
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                  tier.status === "available"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : tier.status === "occupied"
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : "bg-slate-100 text-slate-600 border-slate-200"
                                }`}
                              >
                                {tier.status}
                              </span>
                            </div>

                            <p className="text-slate-500 text-[11px]">
                              Tải trọng:{" "}
                              <strong className="text-slate-700">
                                {tier.maxWeightKg ?? "—"} kg
                              </strong>
                            </p>

                            {tier.dimensions && (
                              <p className="text-slate-500 text-[11px]">
                                Kích thước: {tier.dimensions.length}m x {tier.dimensions.width}m x{" "}
                                {tier.dimensions.height}m
                              </p>
                            )}

                            {isManager && (
                              <div className="pt-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditTier(tier)}
                                  className="text-[11px] text-teal-600 hover:text-teal-800 font-semibold cursor-pointer"
                                >
                                  Chỉnh sửa tầng
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Edit Tier Modal */}
        {editingTier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-100 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-sm text-slate-800">
                  Chỉnh sửa Tầng {editingTier.tierCode}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Trạng thái tầng</label>
                <select
                  value={tierStatus}
                  onChange={(e) => setTierStatus(e.target.value as RackTierStatusEnum)}
                  className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none"
                >
                  <option value={RackTierStatusEnum.AVAILABLE}>Còn trống (available)</option>
                  <option value={RackTierStatusEnum.OCCUPIED}>Đang chứa hàng (occupied)</option>
                  <option value={RackTierStatusEnum.MAINTENANCE}>Đang bảo trì (maintenance)</option>
                  <option value={RackTierStatusEnum.INACTIVE}>Ngừng hoạt động (inactive)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tải trọng tối đa (kg)
                </label>
                <input
                  type="number"
                  min={1}
                  value={tierMaxWeight}
                  onChange={(e) => setTierMaxWeight(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-500 block mb-1">Dài (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tierLength}
                    onChange={(e) => setTierLength(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Rộng (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tierWidth}
                    onChange={(e) => setTierWidth(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Cao (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tierHeight}
                    onChange={(e) => setTierHeight(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={updateTierMutation.isPending}
                  onClick={handleSaveTier}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700"
                >
                  {updateTierMutation.isPending ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
