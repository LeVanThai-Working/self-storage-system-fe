import React from "react";
import { View, Pressable } from "react-native";
import { ChevronRight, ChevronUp, Layers, PackageOpen } from "lucide-react-native";
import type { StorageUnitInventoryTreeResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { findTierInTree, getPositionLabel, getTierDisplayStatus } from "../utils/rackMapFormat";
import { TierStatusBadge } from "./TierStatusBadge";

interface PositionCardProps {
  tree: StorageUnitInventoryTreeResponse;
  /** Tier id, `null` for floor items, `undefined` when nothing is chosen yet. */
  tierId: string | null | undefined;
  /** Text shown while `tierId` is undefined. */
  placeholder?: string;
  /** Makes the card a picker trigger. */
  onPress?: () => void;
  expanded?: boolean;
}

export function PositionCard({ tree, tierId, placeholder, onPress, expanded }: PositionCardProps) {
  const { t } = useTranslation();
  const selected = tierId !== undefined;
  const found = findTierInTree(tree, tierId);

  const title = selected
    ? getPositionLabel(tree, tierId, t("rackMap.form.floor"))
    : (placeholder ?? "");
  const subtitle = found
    ? t("rackMap.position.tierOfRack", { tier: found.tier.tierNumber, rack: found.rack.rackCode })
    : tierId === null
      ? t("rackMap.position.floorHint")
      : null;
  const status = found ? getTierDisplayStatus(found.tier.status, found.tier.items.length) : null;

  const content = (
    <>
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-neutral-900">
        {tierId === null ? (
          <PackageOpen size={18} color="#0B927E" />
        ) : (
          <Layers size={18} color={selected ? "#0B927E" : "#94A3B8"} />
        )}
      </View>
      <View className="flex-1">
        <Text
          numberOfLines={1}
          className={`font-mono text-sm font-bold ${
            selected ? "text-neutral-dark dark:text-neutral-100" : "text-neutral-muted"
          }`}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text variant="muted" className="mt-0.5 text-[11px]">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {status ? <TierStatusBadge status={status} /> : null}
      {onPress ? (
        expanded ? (
          <ChevronUp size={16} color="#647B80" />
        ) : (
          <ChevronRight size={16} color="#647B80" />
        )
      ) : null}
    </>
  );

  const className = `flex-row items-center gap-3 rounded-2xl border p-3 ${
    selected
      ? "border-brand/30 bg-brand-bg dark:bg-brand/10"
      : "border-dashed border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-900"
  }`;

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${className} active:opacity-80`}>
        {content}
      </Pressable>
    );
  }
  return <View className={className}>{content}</View>;
}
