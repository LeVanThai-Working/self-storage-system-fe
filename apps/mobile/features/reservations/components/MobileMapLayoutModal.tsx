import React, { useMemo } from "react";
import { Modal, View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { StorageUnitStatusEnum, type StorageUnitResponse } from "@self-storage-system-fe/shared";
import { useFacilityMapLayout } from "../hooks/useReservations";
import { X, Layers, CheckCircle2, AlertCircle } from "lucide-react-native";

interface MobileMapLayoutModalProps {
  visible: boolean;
  onClose: () => void;
  facilityId: string;
  selectedUnitId: string | null;
  onSelectUnit: (unit: StorageUnitResponse) => void;
  isEn: boolean;
  targetUnitTypeId?: string;
}

const TILE_STYLES: Record<
  StorageUnitStatusEnum,
  { bg: string; border: string; text: string; dot: string; labelEn: string; labelVi: string }
> = {
  [StorageUnitStatusEnum.AVAILABLE]: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-500",
    text: "text-emerald-800 dark:text-emerald-300",
    dot: "#10B981",
    labelEn: "Available",
    labelVi: "Còn trống",
  },
  [StorageUnitStatusEnum.RESERVED]: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-400",
    text: "text-amber-800 dark:text-amber-300",
    dot: "#F59E0B",
    labelEn: "Reserved",
    labelVi: "Đã giữ chỗ",
  },
  [StorageUnitStatusEnum.OCCUPIED]: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-400",
    text: "text-rose-800 dark:text-rose-300",
    dot: "#EF4444",
    labelEn: "Occupied",
    labelVi: "Đang thuê",
  },
  [StorageUnitStatusEnum.UNDER_MAINTENANCE]: {
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-300 dark:border-slate-700",
    text: "text-slate-600 dark:text-slate-400",
    dot: "#64748B",
    labelEn: "Maintenance",
    labelVi: "Bảo trì",
  },
  [StorageUnitStatusEnum.PENDING_CLEARANCE]: {
    bg: "bg-red-900/10 dark:bg-red-950/60",
    border: "border-red-800",
    text: "text-red-900 dark:text-red-300",
    dot: "#7F1D1D",
    labelEn: "Clearance",
    labelVi: "Chờ dọn kho",
  },
  [StorageUnitStatusEnum.INACTIVE]: {
    bg: "bg-slate-50 dark:bg-neutral-900",
    border: "border-slate-200 dark:border-neutral-800",
    text: "text-slate-400 dark:text-slate-500",
    dot: "#94A3B8",
    labelEn: "Inactive",
    labelVi: "Ngừng dùng",
  },
};

const NO_ZONE = "__no_zone__";

export const MobileMapLayoutModal: React.FC<MobileMapLayoutModalProps> = ({
  visible,
  onClose,
  facilityId,
  selectedUnitId,
  onSelectUnit,
  isEn,
  targetUnitTypeId,
}) => {
  const {
    data: units = [],
    isLoading,
    isError,
    refetch,
  } = useFacilityMapLayout(facilityId, visible);

  // Group by floor -> zone
  const floorMap = useMemo(() => {
    const map = new Map<number, Map<string, StorageUnitResponse[]>>();
    for (const unit of units) {
      if (!map.has(unit.floor)) {
        map.set(unit.floor, new Map());
      }
      const zoneMap = map.get(unit.floor)!;
      const zoneKey = unit.zone?.trim() || NO_ZONE;
      if (!zoneMap.has(zoneKey)) {
        zoneMap.set(zoneKey, []);
      }
      zoneMap.get(zoneKey)!.push(unit);
    }
    return map;
  }, [units]);

  const sortedFloors = useMemo(() => Array.from(floorMap.keys()).sort((a, b) => a - b), [floorMap]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-white dark:bg-neutral-900 rounded-t-3xl max-h-[88%] min-h-[50%] p-4 border-t border-neutral-border dark:border-neutral-800">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-neutral-border dark:border-neutral-800">
            <View className="flex-row items-center gap-2">
              <Layers size={20} color="#0B927E" />
              <View>
                <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100">
                  {isEn ? "2D Floor Plan Layout" : "Sơ đồ mặt bằng 2D"}
                </Text>
                <Text variant="muted" className="text-xs">
                  {isEn
                    ? "Tap a green unit to select your room"
                    : "Chạm vào ô màu xanh lá để chọn vị trí kho"}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={10}
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 items-center justify-center"
            >
              <X size={18} color="#64748B" />
            </Pressable>
          </View>

          {/* Color Legend */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-3 py-2.5 items-center"
          >
            {Object.entries(TILE_STYLES).map(([statusKey, style]) => (
              <View key={statusKey} className="flex-row items-center gap-1.5">
                <View style={{ backgroundColor: style.dot }} className="w-2.5 h-2.5 rounded-full" />
                <Text className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400">
                  {isEn ? style.labelEn : style.labelVi}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Body Content */}
          {isLoading ? (
            <View className="py-20 items-center justify-center gap-3">
              <ActivityIndicator size="large" color="#0B927E" />
              <Text variant="muted" className="text-xs">
                {isEn ? "Loading 2D map layout..." : "Đang tải sơ đồ mặt bằng..."}
              </Text>
            </View>
          ) : isError ? (
            <View className="py-16 items-center justify-center gap-2">
              <AlertCircle size={32} color="#EF4444" />
              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {isEn ? "Failed to load floor plan" : "Không thể tải sơ đồ"}
              </Text>
              <Pressable onPress={() => refetch()} className="mt-2 px-4 py-2 bg-brand rounded-xl">
                <Text className="text-xs font-bold text-white">{isEn ? "Retry" : "Thử lại"}</Text>
              </Pressable>
            </View>
          ) : units.length === 0 ? (
            <View className="py-16 items-center justify-center">
              <Text variant="muted" className="text-xs">
                {isEn ? "No storage units found" : "Chưa có dữ liệu phòng kho"}
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerClassName="pb-10 pt-2 gap-4"
            >
              {sortedFloors.map((floor) => {
                const zoneMap = floorMap.get(floor)!;
                const sortedZones = Array.from(zoneMap.keys()).sort((a, b) => {
                  if (a === NO_ZONE) return 1;
                  if (b === NO_ZONE) return -1;
                  return a.localeCompare(b);
                });

                return (
                  <View
                    key={floor}
                    className="rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 p-3.5 gap-3"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-extrabold uppercase tracking-wider text-brand">
                        {isEn ? `Floor ${floor}` : `Tầng ${floor}`}
                      </Text>
                      <Text variant="muted" className="text-[11px]">
                        {Array.from(zoneMap.values()).reduce((sum, list) => sum + list.length, 0)}{" "}
                        {isEn ? "units" : "phòng"}
                      </Text>
                    </View>

                    {sortedZones.map((zoneKey) => {
                      const zoneUnits = zoneMap.get(zoneKey) || [];
                      const displayZoneTitle =
                        zoneKey === NO_ZONE
                          ? isEn
                            ? "General Area"
                            : "Khu vực chung"
                          : isEn
                            ? `Zone ${zoneKey}`
                            : `Khu ${zoneKey}`;

                      return (
                        <View key={zoneKey} className="gap-2">
                          <Text className="text-[10px] font-bold uppercase text-neutral-400">
                            {displayZoneTitle}
                          </Text>

                          <View className="flex-row flex-wrap gap-2">
                            {zoneUnits.map((u) => {
                              const isAvailable = u.status === StorageUnitStatusEnum.AVAILABLE;
                              const isSelected = selectedUnitId === u.id;
                              const style =
                                TILE_STYLES[u.status] ??
                                TILE_STYLES[StorageUnitStatusEnum.INACTIVE];
                              const matchesOfferingType =
                                !targetUnitTypeId || u.unitTypeId === targetUnitTypeId;

                              return (
                                <Pressable
                                  key={u.id}
                                  disabled={!isAvailable}
                                  onPress={() => {
                                    if (isAvailable) {
                                      onSelectUnit(u);
                                      onClose();
                                    }
                                  }}
                                  className={`rounded-2xl border p-2.5 w-[30%] min-h-[70px] justify-between ${
                                    style.bg
                                  } ${
                                    isSelected
                                      ? "border-brand ring-2 ring-brand bg-brand-light/40"
                                      : style.border
                                  } ${!isAvailable ? "opacity-60" : "active:scale-95"}`}
                                >
                                  <View className="flex-row items-center justify-between">
                                    <Text
                                      className={`font-mono font-extrabold text-xs ${style.text}`}
                                    >
                                      #{u.unitNumber}
                                    </Text>
                                    {isSelected ? (
                                      <CheckCircle2 size={13} color="#0B927E" />
                                    ) : (
                                      <View
                                        style={{ backgroundColor: style.dot }}
                                        className="w-1.5 h-1.5 rounded-full"
                                      />
                                    )}
                                  </View>

                                  <View>
                                    <Text numberOfLines={1} className="text-[9px] text-neutral-500">
                                      {u.unitType?.name ?? "—"}
                                    </Text>
                                    <Text className={`text-[9px] font-semibold ${style.text}`}>
                                      {isEn ? style.labelEn : style.labelVi}
                                    </Text>
                                  </View>
                                </Pressable>
                              );
                            })}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};
