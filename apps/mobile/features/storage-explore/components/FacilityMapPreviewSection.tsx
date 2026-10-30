import React, { useMemo, useState } from "react";
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Layers, CheckCircle2, AlertCircle, Maximize2, Sparkles, Boxes } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { StorageUnitStatusEnum, type StorageUnitResponse } from "@self-storage-system-fe/shared";
import { useFacilityMapLayout } from "@/features/reservations/hooks/useReservations";

interface FacilityMapPreviewSectionProps {
  facilityId: string;
  facilityName: string;
  onSelectUnit: (unit: StorageUnitResponse) => void;
  selectedUnitId?: string | null;
  onOpenFullMap: () => void;
}

const NO_ZONE = "__no_zone__";

export function FacilityMapPreviewSection({
  facilityId,
  facilityName,
  onSelectUnit,
  selectedUnitId,
  onOpenFullMap,
}: FacilityMapPreviewSectionProps) {
  const { t, locale } = useTranslation();
  const isEn = locale === "en";

  const {
    data: units = [],
    isLoading,
    isError,
    refetch,
  } = useFacilityMapLayout(facilityId, Boolean(facilityId));

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

  // Active Floor state: default to floor that has available units, or first floor
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);

  const activeFloor = useMemo(() => {
    if (selectedFloor !== null && floorMap.has(selectedFloor)) {
      return selectedFloor;
    }
    // Find first floor with available units
    for (const floor of sortedFloors) {
      const zoneMap = floorMap.get(floor)!;
      for (const list of zoneMap.values()) {
        if (list.some((u) => u.status === StorageUnitStatusEnum.AVAILABLE)) {
          return floor;
        }
      }
    }
    return sortedFloors[0] ?? 1;
  }, [selectedFloor, floorMap, sortedFloors]);

  // Counts
  const availableCount = useMemo(
    () => units.filter((u) => u.status === StorageUnitStatusEnum.AVAILABLE).length,
    [units]
  );

  return (
    <View className="gap-3.5">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 flex-1">
          <Layers size={18} color="#0B927E" />
          <Text
            numberOfLines={1}
            className="flex-1 text-base font-bold text-neutral-dark dark:text-neutral-100"
          >
            {t("facilityDetail.mapSectionTitle")}
          </Text>
        </View>

        <Badge variant="outline" className="border-brand/40 bg-brand-light/40 dark:bg-brand/20">
          <Text className="text-xs font-semibold text-brand">
            {t("facilityDetail.mapSectionBadge")}
          </Text>
        </Badge>
      </View>

      {/* Main Preview Card */}
      <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
        {/* Banner with available count & prompt */}
        <View className="flex-row items-center justify-between gap-2 pb-1 border-b border-neutral-border/60 dark:border-neutral-800">
          <View className="flex-1">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
              {t("facilityDetail.mapSectionSubtitle")}
            </Text>
            <Text variant="muted" className="text-[11px] mt-0.5">
              {t("facilityDetail.mapSelectUnitPrompt")}
            </Text>
          </View>
          <View className="items-end">
            <View className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700">
              <View className="w-2 h-2 rounded-full bg-emerald-500" />
              <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                {availableCount} {isEn ? "vacant" : "trống"}
              </Text>
            </View>
          </View>
        </View>

        {/* Color Legend */}
        <View className="flex-row items-center gap-4 py-1">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <Text className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
              {isEn ? "Available (Tap to book)" : "Còn trống (Chạm để chọn)"}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <Text className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              {isEn ? "Reserved" : "Đã giữ"}
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <View className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <Text className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
              {isEn ? "Occupied" : "Đang thuê"}
            </Text>
          </View>
        </View>

        {/* Content body */}
        {isLoading ? (
          <View className="py-6 gap-3">
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </View>
        ) : isError ? (
          <View className="py-6 items-center justify-center gap-2">
            <AlertCircle size={28} color="#EF4444" />
            <Text className="text-xs text-neutral-500">
              {isEn ? "Unable to load floor plan" : "Không thể tải sơ đồ cơ sở"}
            </Text>
            <Pressable onPress={() => refetch()} className="px-3 py-1.5 bg-brand rounded-xl">
              <Text className="text-xs font-bold text-white">{isEn ? "Retry" : "Thử lại"}</Text>
            </Pressable>
          </View>
        ) : units.length === 0 ? (
          <View className="py-8 items-center justify-center">
            <Text variant="muted" className="text-xs text-center">
              {t("facilityDetail.mapNoUnitsAvailable")}
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {/* Floor Tabs */}
            {sortedFloors.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                {sortedFloors.map((floor) => {
                  const isActive = floor === activeFloor;
                  return (
                    <Pressable
                      key={floor}
                      onPress={() => setSelectedFloor(floor)}
                      className={`px-3 py-1.5 rounded-xl border ${
                        isActive
                          ? "bg-brand border-brand"
                          : "bg-neutral-50 dark:bg-neutral-800 border-neutral-border dark:border-neutral-700"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isActive ? "text-white" : "text-neutral-600 dark:text-neutral-300"
                        }`}
                      >
                        {isEn ? `Floor ${floor}` : `Tầng ${floor}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* Units on Active Floor */}
            {(() => {
              const zoneMap = floorMap.get(activeFloor);
              if (!zoneMap) return null;

              const sortedZones = Array.from(zoneMap.keys()).sort((a, b) => {
                if (a === NO_ZONE) return 1;
                if (b === NO_ZONE) return -1;
                return a.localeCompare(b);
              });

              return (
                <View className="gap-3 pt-1">
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
                        <Text className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">
                          {displayZoneTitle} ({zoneUnits.length})
                        </Text>

                        <View className="flex-row flex-wrap gap-2">
                          {zoneUnits.map((u) => {
                            const isAvailable = u.status === StorageUnitStatusEnum.AVAILABLE;
                            const isSelected = selectedUnitId === u.id;

                            return (
                              <Pressable
                                key={u.id}
                                disabled={!isAvailable}
                                onPress={() => {
                                  if (isAvailable) {
                                    onSelectUnit(u);
                                  }
                                }}
                                className={`rounded-2xl border p-2.5 w-[31%] min-h-[68px] justify-between ${
                                  isSelected
                                    ? "border-brand bg-brand-light/40 dark:bg-brand/20 shadow-sm ring-2 ring-brand"
                                    : isAvailable
                                      ? "border-emerald-500 bg-emerald-50/90 dark:bg-emerald-950/40 active:scale-95"
                                      : u.status === StorageUnitStatusEnum.RESERVED
                                        ? "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 opacity-60"
                                        : "border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60 opacity-50"
                                }`}
                              >
                                <View className="flex-row items-center justify-between">
                                  <Text
                                    className={`font-mono font-extrabold text-xs ${
                                      isSelected
                                        ? "text-brand"
                                        : isAvailable
                                          ? "text-emerald-800 dark:text-emerald-300"
                                          : "text-neutral-500 dark:text-neutral-400"
                                    }`}
                                  >
                                    #{u.unitNumber}
                                  </Text>
                                  {isSelected ? (
                                    <CheckCircle2 size={13} color="#0B927E" />
                                  ) : isAvailable ? (
                                    <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  ) : (
                                    <View className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                                  )}
                                </View>

                                <View>
                                  <Text
                                    numberOfLines={1}
                                    className="text-[9px] text-neutral-500 dark:text-neutral-400"
                                  >
                                    {u.unitType?.name ?? "—"}
                                  </Text>
                                  <Text
                                    className={`text-[9px] font-bold ${
                                      isAvailable
                                        ? "text-emerald-700 dark:text-emerald-300"
                                        : "text-neutral-400"
                                    }`}
                                  >
                                    {isAvailable
                                      ? isEn
                                        ? "Select"
                                        : "Chọn kho"
                                      : isEn
                                        ? "Occupied"
                                        : "Đã kín"}
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
            })()}
          </View>
        )}

        {/* Footer: Open Fullscreen 2D Map Button */}
        <Pressable
          onPress={onOpenFullMap}
          className="flex-row items-center justify-center gap-2 rounded-2xl border border-brand/40 bg-brand-light/30 dark:bg-brand/15 py-3 mt-1 active:opacity-80"
        >
          <Maximize2 size={15} color="#0B927E" />
          <Text className="text-xs font-bold text-brand">{t("facilityDetail.mapOpenFullBtn")}</Text>
        </Pressable>
      </View>
    </View>
  );
}
