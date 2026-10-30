import React from "react";
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { RackZoneEnum, type StorageRackResponse } from "@self-storage-system-fe/shared";
import { useUnitStorageRacks } from "../hooks/useReservations";
import { Archive, CheckCircle2, Layers } from "lucide-react-native";

interface MobileRackPickerProps {
  unitId: string | null;
  selectedRackIds: string[];
  onChangeSelectedRacks: (rackIds: string[]) => void;
  isEn: boolean;
}

const ZONE_BADGES: Record<RackZoneEnum, { bg: string; text: string }> = {
  [RackZoneEnum.PRIME]: {
    bg: "bg-amber-100 dark:bg-amber-950/60 border-amber-300",
    text: "text-amber-800 dark:text-amber-300",
  },
  [RackZoneEnum.STANDARD]: {
    bg: "bg-blue-100 dark:bg-blue-950/60 border-blue-300",
    text: "text-blue-800 dark:text-blue-300",
  },
  [RackZoneEnum.ECONOMY]: {
    bg: "bg-neutral-100 dark:bg-neutral-800 border-neutral-300",
    text: "text-neutral-700 dark:text-neutral-300",
  },
};

export const MobileRackPicker: React.FC<MobileRackPickerProps> = ({
  unitId,
  selectedRackIds,
  onChangeSelectedRacks,
  isEn,
}) => {
  const { data: racks = [], isLoading } = useUnitStorageRacks(unitId ?? undefined, Boolean(unitId));

  const availableRacks = racks.filter(
    (r) => r.status === "available" || r.status === ("active" as any)
  );

  const toggleRack = (rackId: string) => {
    if (selectedRackIds.includes(rackId)) {
      onChangeSelectedRacks(selectedRackIds.filter((id) => id !== rackId));
    } else {
      onChangeSelectedRacks([...selectedRackIds, rackId]);
    }
  };

  if (!unitId) return null;

  return (
    <View className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Archive size={18} color="#0B927E" />
          <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {isEn ? "Select Storage Racks" : "Chọn kệ kho thuê (Warehouse Rack)"}
          </Text>
        </View>

        {selectedRackIds.length > 0 && (
          <Badge variant="outline" className="border-brand">
            <Text className="text-[11px] font-bold text-brand">
              {isEn
                ? `${selectedRackIds.length} rack(s) selected`
                : `Đã chọn ${selectedRackIds.length} kệ`}
            </Text>
          </Badge>
        )}
      </View>

      <Text variant="muted" className="text-xs">
        {isEn
          ? "This is a shared warehouse room. Choose the individual racks you wish to rent:"
          : "Đây là mô hình kho chia sẻ. Vui lòng chọn một hoặc nhiều kệ kho bạn muốn thuê:"}
      </Text>

      {isLoading ? (
        <View className="py-6 items-center justify-center">
          <ActivityIndicator size="small" color="#0B927E" />
        </View>
      ) : availableRacks.length === 0 ? (
        <View className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200">
          <Text className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
            {isEn
              ? "All racks in this room are currently occupied."
              : "Hiện toàn bộ kệ trong phòng kho này đã có khách thuê."}
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2.5 py-1"
        >
          {availableRacks.map((rack) => {
            const isSelected = selectedRackIds.includes(rack.id);
            const zoneInfo = rack.zone ? ZONE_BADGES[rack.zone as RackZoneEnum] : null;

            return (
              <Pressable
                key={rack.id}
                onPress={() => toggleRack(rack.id)}
                className={`rounded-2xl border p-3 w-40 justify-between ${
                  isSelected
                    ? "border-brand bg-brand-light/40 dark:bg-brand/20 shadow-sm"
                    : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                }`}
              >
                <View className="flex-row items-center justify-between mb-1">
                  <Text
                    className={`font-mono font-bold text-sm ${isSelected ? "text-brand" : "text-neutral-dark dark:text-neutral-100"}`}
                  >
                    {rack.rackCode}
                  </Text>
                  {isSelected && <CheckCircle2 size={16} color="#0B927E" />}
                </View>

                <View className="flex-row items-center gap-1.5 my-1">
                  {zoneInfo && (
                    <View className={`px-2 py-0.5 rounded-full border ${zoneInfo.bg}`}>
                      <Text className={`text-[10px] font-bold ${zoneInfo.text}`}>{rack.zone}</Text>
                    </View>
                  )}
                  <Text variant="muted" className="text-[10px]">
                    {rack.tierCount} {isEn ? "tiers" : "tầng"}
                  </Text>
                </View>

                <Text className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  {rack.aisle ? `${isEn ? "Aisle" : "Dãy"} ${rack.aisle}` : ""}
                  {rack.bay ? ` · Bay ${rack.bay}` : ""}
                </Text>

                {rack.customPrice ? (
                  <Text className="text-xs font-extrabold text-brand mt-1">
                    {rack.customPrice.toLocaleString("vi-VN")} đ/{isEn ? "mo" : "tháng"}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};
