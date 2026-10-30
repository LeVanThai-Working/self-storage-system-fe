import React, { useMemo } from "react";
import { Pressable, View } from "react-native";
import { Wrench } from "lucide-react-native";
import {
  StorageUnitStatusEnum,
  groupUnitsByFloorAndZone,
  isUnitBookable,
  type StorageUnitResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface UnitSeatMapProps {
  units: StorageUnitResponse[];
  selectedUnitId?: string | null;
  onSelect: (unit: StorageUnitResponse) => void;
  isEn: boolean;
}

const LEGEND = (isEn: boolean) => [
  { key: "free", label: isEn ? "Available" : "Còn trống", box: "border border-brand bg-white" },
  { key: "picked", label: isEn ? "Your pick" : "Bạn chọn", box: "bg-brand" },
  { key: "taken", label: isEn ? "Taken" : "Đã có người thuê", box: "bg-neutral-200" },
  {
    key: "maint",
    label: isEn ? "Maintenance" : "Bảo trì",
    box: "bg-cta-light border border-cta/50",
  },
];

/** Cinema-style map of a facility's units (one unit type): floors → zones → seats. */
export function UnitSeatMap({ units, selectedUnitId, onSelect, isEn }: UnitSeatMapProps) {
  const floors = useMemo(() => groupUnitsByFloorAndZone(units), [units]);
  const freeCount = units.filter(isUnitBookable).length;

  return (
    <View className="gap-3">
      <View className="items-center rounded-b-[40px] bg-neutral-100 py-2 dark:bg-neutral-800">
        <Text className="text-[10px] font-extrabold tracking-wider text-neutral-500">
          {isEn ? "ENTRANCE · MAIN AISLE" : "CỬA RA VÀO · LỐI ĐI CHÍNH"}
        </Text>
      </View>

      <Text variant="muted" className="text-[11px]">
        {isEn
          ? `${freeCount} of ${units.length} units available`
          : `${freeCount}/${units.length} phòng còn trống`}
      </Text>

      {floors.map((floor) => (
        <View key={floor.floor} className="gap-2">
          <Text className="text-xs font-extrabold text-neutral-dark dark:text-neutral-100">
            {isEn ? `Floor ${floor.floor}` : `Tầng ${floor.floor}`}
          </Text>
          {floor.zones.map((zone) => (
            <View key={zone.zone ?? "none"} className="flex-row gap-2">
              <View className="w-10 items-center pt-2">
                <Text className="text-sm font-extrabold text-brand">{zone.zone ?? "–"}</Text>
              </View>
              <View className="flex-1 flex-row flex-wrap gap-1.5">
                {zone.units.map((unit) => {
                  const bookable = isUnitBookable(unit);
                  const selected = unit.id === selectedUnitId;
                  const maintenance = unit.status === StorageUnitStatusEnum.UNDER_MAINTENANCE;
                  return (
                    <Pressable
                      key={unit.id}
                      disabled={!bookable}
                      onPress={() => onSelect(unit)}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled: !bookable }}
                      className={cn(
                        "h-14 w-[60px] items-center justify-center rounded-lg border",
                        selected
                          ? "border-brand bg-brand"
                          : bookable
                            ? "border-brand/60 bg-white active:opacity-80 dark:bg-neutral-900"
                            : maintenance
                              ? "border-cta/50 bg-cta-light"
                              : "border-neutral-200 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800"
                      )}
                    >
                      {maintenance ? <Wrench size={12} color="#D34D0F" /> : null}
                      <Text
                        numberOfLines={1}
                        className={cn(
                          "text-[11px] font-extrabold",
                          selected
                            ? "text-white"
                            : bookable
                              ? "text-neutral-dark dark:text-neutral-100"
                              : "text-neutral-400"
                        )}
                      >
                        {unit.unitNumber}
                      </Text>
                      {unit.unitType?.area ? (
                        <Text
                          className={cn(
                            "text-[9px]",
                            selected ? "text-white/90" : "text-neutral-muted"
                          )}
                        >
                          {unit.unitType.area} m²
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      ))}

      <View className="flex-row flex-wrap gap-3 border-t border-neutral-border pt-2.5 dark:border-neutral-800">
        {LEGEND(isEn).map((item) => (
          <View key={item.key} className="flex-row items-center gap-1.5">
            <View className={cn("h-3 w-3 rounded", item.box)} />
            <Text variant="muted" className="text-[10px]">
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
