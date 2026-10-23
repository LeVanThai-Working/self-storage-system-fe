import React from "react";
import { View, Pressable, type LayoutChangeEvent } from "react-native";
import { ChevronDown, ChevronUp, MapPin } from "lucide-react-native";
import type { TreeRack, TreeTier } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { formatTierShort, sortTiersTopDown } from "../utils/rackMapFormat";
import { TierCell } from "./TierCell";

interface RackCardProps {
  rack: TreeRack;
  collapsed: boolean;
  onToggle: () => void;
  highlightedTierIds?: Set<string>;
  /** A "find items" result is shown, so tiers outside it fade out. */
  highlightActive?: boolean;
  onTierPress: (tier: TreeTier) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}

/** A rack drawn as a real shelf: highest tier on top, uprights on both sides. */
export function RackCard({
  rack,
  collapsed,
  onToggle,
  highlightedTierIds,
  highlightActive = false,
  onTierPress,
  onLayout,
}: RackCardProps) {
  const { t } = useTranslation();
  const occupied = rack.tiers.filter((tier) => tier.items.length > 0).length;
  const tiers = sortTiersTopDown(rack.tiers);

  return (
    <View
      onLayout={onLayout}
      className="rounded-3xl border border-neutral-border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <Pressable onPress={onToggle} className="flex-row items-center gap-3 active:opacity-80">
        <View className="flex-1">
          <View className="flex-row items-baseline gap-2">
            <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100">
              {rack.rackCode}
            </Text>
            {rack.name ? (
              <Text numberOfLines={1} variant="muted" className="flex-1 text-xs">
                {rack.name}
              </Text>
            ) : null}
          </View>
          <Text variant="muted" className="mt-0.5 text-[11px]">
            {t("rackMap.rackUsage", { used: occupied, total: rack.tiers.length })}
          </Text>
        </View>
        <View className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
          {collapsed ? (
            <ChevronDown size={16} color="#647B80" />
          ) : (
            <ChevronUp size={16} color="#647B80" />
          )}
        </View>
      </Pressable>

      {collapsed ? null : (
        <View className="mt-3 flex-row">
          <View className="w-10">
            {tiers.map((tier) => {
              const highlighted = highlightedTierIds?.has(tier.id) ?? false;
              return (
                <View key={tier.id} className="h-14 flex-row items-center gap-0.5 pb-2 pt-1">
                  {highlighted ? <MapPin size={11} color="#FF702E" /> : null}
                  <Text
                    className={`text-[11px] ${
                      highlighted
                        ? "font-extrabold text-cta"
                        : `font-bold text-neutral-muted ${highlightActive ? "opacity-40" : ""}`
                    }`}
                  >
                    {formatTierShort(tier.tierNumber)}
                  </Text>
                </View>
              );
            })}
          </View>

          <View className="flex-1 rounded-sm border-x-4 border-neutral-dark px-1.5 dark:border-neutral-600">
            {tiers.map((tier) => {
              const highlighted = highlightedTierIds?.has(tier.id) ?? false;
              return (
                <View key={tier.id} className="h-14 justify-end">
                  <TierCell
                    tier={tier}
                    highlighted={highlighted}
                    dimmed={highlightActive && !highlighted}
                    onPress={onTierPress}
                  />
                  <View className="mt-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
