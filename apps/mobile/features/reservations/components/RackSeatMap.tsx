import React, { useMemo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Wrench } from "lucide-react-native";
import {
  RackStatusEnum,
  RackZoneEnum,
  formatShortMillion,
  getRackPrice,
  groupRacksByAisle,
  isRackBookable,
  type StorageRackResponse,
  type ZonePricing,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface RackSeatMapProps {
  racks: StorageRackResponse[];
  pricing: ZonePricing;
  /** Offering `pricePerUnit`, BE last-resort rack price. */
  fallbackPrice?: number | null;
  selectedRackIds: string[];
  onToggle: (rack: StorageRackResponse) => void;
  isEn: boolean;
}

const ZONE_STYLE: Record<RackZoneEnum, { border: string; text: string; label: string }> = {
  [RackZoneEnum.PRIME]: { border: "border-amber-500", text: "text-amber-700", label: "★ PRIME" },
  [RackZoneEnum.STANDARD]: { border: "border-brand", text: "text-brand", label: "STANDARD" },
  [RackZoneEnum.ECONOMY]: { border: "border-slate-400", text: "text-slate-500", label: "ECONOMY" },
};

/** Cinema-style rack picker inside a shared rack warehouse: aisles are rows, bays are seats. */
export function RackSeatMap({
  racks,
  pricing,
  fallbackPrice,
  selectedRackIds,
  onToggle,
  isEn,
}: RackSeatMapProps) {
  const aisles = useMemo(() => groupRacksByAisle(racks), [racks]);
  const selected = new Set(selectedRackIds);

  return (
    <View className="gap-3">
      <View className="items-center rounded-b-[40px] bg-neutral-100 py-2 dark:bg-neutral-800">
        <Text className="text-[10px] font-extrabold tracking-wider text-neutral-500">
          {isEn ? "ENTRANCE · MAIN AISLE" : "CỬA RA VÀO · LỐI ĐI CHÍNH"}
        </Text>
      </View>

      {aisles.map((aisle) => {
        const zoneStyle = aisle.zone ? ZONE_STYLE[aisle.zone] : null;
        const zonePrice = aisle.racks[0]
          ? getRackPrice({ ...aisle.racks[0], customPrice: null }, pricing, fallbackPrice)
          : 0;
        return (
          <View key={aisle.aisle} className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text
                className={cn("text-base font-extrabold", zoneStyle?.text ?? "text-neutral-500")}
              >
                {aisle.aisle}
              </Text>
              {zoneStyle ? (
                <Text className={cn("text-[10px] font-extrabold", zoneStyle.text)}>
                  {zoneStyle.label} · {formatShortMillion(zonePrice)}
                  {isEn ? "/month" : "/tháng"}
                </Text>
              ) : null}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-1.5"
            >
              {aisle.racks.map((rack) => {
                const bookable = isRackBookable(rack);
                const picked = selected.has(rack.id);
                const maintenance = rack.status === RackStatusEnum.MAINTENANCE;
                const style = rack.zone ? ZONE_STYLE[rack.zone] : null;
                return (
                  <Pressable
                    key={rack.id}
                    disabled={!bookable}
                    onPress={() => onToggle(rack)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: picked, disabled: !bookable }}
                    className={cn(
                      "h-14 w-11 items-center justify-center rounded-md border-[1.5px]",
                      picked
                        ? "border-brand bg-brand"
                        : bookable
                          ? cn(
                              "bg-white active:opacity-80 dark:bg-neutral-900",
                              style?.border ?? "border-slate-400"
                            )
                          : maintenance
                            ? "border-cta/50 bg-cta-light"
                            : "border-neutral-200 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800"
                    )}
                  >
                    {maintenance ? <Wrench size={12} color="#D34D0F" /> : null}
                    <Text
                      numberOfLines={1}
                      className={cn(
                        "text-[10px] font-extrabold",
                        picked
                          ? "text-white"
                          : bookable
                            ? "text-neutral-dark dark:text-neutral-100"
                            : "text-neutral-400"
                      )}
                    >
                      {rack.rackCode}
                    </Text>
                    <Text
                      className={cn("text-[8px]", picked ? "text-white/90" : "text-neutral-muted")}
                    >
                      {bookable || picked
                        ? formatShortMillion(getRackPrice(rack, pricing, fallbackPrice))
                        : maintenance
                          ? ""
                          : isEn
                            ? "Taken"
                            : "Đã thuê"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        );
      })}

      <View className="flex-row flex-wrap gap-3 border-t border-neutral-border pt-2.5 dark:border-neutral-800">
        {[
          {
            key: "free",
            label: isEn ? "Available" : "Còn trống",
            box: "border border-brand bg-white",
          },
          { key: "picked", label: isEn ? "Your pick" : "Bạn chọn", box: "bg-brand" },
          { key: "taken", label: isEn ? "Taken" : "Đã thuê", box: "bg-neutral-200" },
          {
            key: "maint",
            label: isEn ? "Maintenance" : "Bảo trì",
            box: "bg-cta-light border border-cta/50",
          },
        ].map((item) => (
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
