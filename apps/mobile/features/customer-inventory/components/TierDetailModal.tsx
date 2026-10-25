import React, { useState } from "react";
import { View, Pressable } from "react-native";
import {
  ArrowUpFromLine,
  ChevronRight,
  Clock,
  Ellipsis,
  Info,
  Move,
  Package,
  PackageOpen,
  PackagePlus,
  SquarePen,
  Weight,
} from "lucide-react-native";
import type {
  StorageUnitInventoryTreeResponse,
  TreeTierItem,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import type { StockActionType } from "../types/rackMap.types";
import {
  buildFloorLabel,
  buildTreeTierLabel,
  findTierInTree,
  formatWeightKg,
  getPositionItems,
  getTierDisplayStatus,
  getTierWeight,
  isTierLocked,
  sumItemsQuantity,
} from "../utils/rackMapFormat";
import { BottomSheet } from "./BottomSheet";
import { SkuThumb } from "./SkuThumb";
import { TierStatusBadge } from "./TierStatusBadge";

const ITEM_ACTIONS: { type: StockActionType; labelKey: string; Icon: typeof Move }[] = [
  { type: "out", labelKey: "rackMap.action.stockOut", Icon: ArrowUpFromLine },
  { type: "move", labelKey: "rackMap.action.move", Icon: Move },
  { type: "adjust", labelKey: "rackMap.action.adjust", Icon: SquarePen },
];

interface TierDetailModalProps {
  visible: boolean;
  onClose: () => void;
  tree: StorageUnitInventoryTreeResponse;
  /** Tier being viewed, or `null` for floor (unracked) items. */
  tierId: string | null;
  readOnly: boolean;
  onAction: (type: StockActionType, item?: TreeTierItem) => void;
  onShowHistory?: () => void;
}

export function TierDetailModal({
  visible,
  onClose,
  tree,
  tierId,
  readOnly,
  onAction,
  onShowHistory,
}: TierDetailModalProps) {
  const { t } = useTranslation();
  // The screen remounts this sheet per position, so the open menu never leaks across tiers.
  const [menuItemId, setMenuItemId] = useState<string | null>(null);

  const isFloor = tierId === null;
  const found = findTierInTree(tree, tierId);
  const tier = found?.tier ?? null;
  const items = getPositionItems(tree, tierId);
  const status = tier ? getTierDisplayStatus(tier.status, tier.items.length) : null;
  const locked = tier ? isTierLocked(tier.status) : false;
  const canAct = !readOnly && !locked;
  const weight = tier ? getTierWeight(tier) : null;
  const weightPercent = weight && weight.ratio !== null ? Math.round(weight.ratio * 100) : 0;

  const title = isFloor ? t("rackMap.unracked.title") : (tier?.tierCode ?? "");
  const subtitle = found
    ? `${buildTreeTierLabel(tree, found.rack, found.tier)} · ${t("rackMap.tierTitle", {
        number: found.tier.tierNumber,
      })}`
    : buildFloorLabel(tree.facility?.code, tree.storageUnit.unitNumber);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      badge={status ? <TierStatusBadge status={status} /> : null}
    >
      {isFloor ? (
        <View className="flex-row items-center gap-3 rounded-2xl border border-brand/30 bg-brand-bg p-3.5 dark:bg-brand/10">
          <View className="h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-neutral-900">
            <PackageOpen size={20} color="#0B927E" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {t("rackMap.unracked.summary", { qty: sumItemsQuantity(items) })}
            </Text>
            <Text variant="muted" className="mt-0.5 text-xs">
              {t("rackMap.unracked.skuCount", { count: items.length })}
            </Text>
          </View>
        </View>
      ) : null}

      {weight && weight.maxWeightKg ? (
        <View className="gap-2 rounded-2xl border border-neutral-border bg-neutral-50 p-3.5 dark:border-neutral-800 dark:bg-neutral-800/60">
          <View className="flex-row items-center gap-2">
            <Weight size={16} color="#647B80" />
            <Text className="flex-1 text-sm font-bold text-neutral-dark dark:text-neutral-100">
              {t("rackMap.weight.load", {
                weight: formatWeightKg(weight.weightKg),
                max: formatWeightKg(weight.maxWeightKg),
              })}
            </Text>
          </View>
          <View className="flex-row items-center gap-2.5">
            <View className="h-2.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <View
                className={`h-2.5 rounded-full ${
                  weight.level === "over"
                    ? "bg-cta"
                    : weight.level === "near"
                      ? "bg-cta/70"
                      : "bg-brand"
                }`}
                style={{ width: `${Math.min(100, weightPercent)}%` }}
              />
            </View>
            <Text className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
              {weightPercent}%
            </Text>
          </View>
          {weight.level === "near" || weight.level === "over" ? (
            <View
              className={`self-start rounded-full px-2.5 py-0.5 ${
                weight.level === "over" ? "bg-cta" : "bg-cta-light dark:bg-cta/20"
              }`}
            >
              <Text
                className={`text-[11px] font-bold ${
                  weight.level === "over" ? "text-white" : "text-cta-dark"
                }`}
              >
                {t(weight.level === "over" ? "rackMap.weight.over" : "rackMap.weight.nearFull")}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {readOnly || locked ? (
        <View className="flex-row items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50/80 p-3 dark:border-sky-900 dark:bg-sky-950/30">
          <Info size={14} color="#0284C7" />
          <Text className="flex-1 text-[11px] leading-4 text-sky-800 dark:text-sky-300">
            {readOnly ? t("rackMap.readOnlyBanner") : t("rackMap.lockedTier")}
          </Text>
        </View>
      ) : null}

      <View className="gap-2.5">
        <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
          {t("rackMap.detail.itemsCount", { count: items.length })}
        </Text>

        {items.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-neutral-border p-5 dark:border-neutral-700">
            <Package size={24} color="#647B80" />
            <Text variant="muted" className="mt-1.5 text-xs">
              {t("rackMap.detail.emptyItems")}
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const menuOpen = menuItemId === item.inventoryId;
            return (
              <View
                key={item.inventoryId}
                className="gap-2.5 rounded-2xl border border-neutral-border bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <View className="flex-row items-center gap-3">
                  <SkuThumb imageUrl={item.sku.imageUrl} size="md" />
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                      {item.sku.skuCode}
                    </Text>
                    <Text numberOfLines={1} variant="muted" className="text-xs">
                      {item.sku.name}
                    </Text>
                    <Text className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-300">
                      <Text className="text-sm font-extrabold text-neutral-dark dark:text-neutral-100">
                        {`x ${item.quantity}`}
                      </Text>
                      {`  ${item.sku.uom}`}
                    </Text>
                  </View>
                  {canAct ? (
                    <Pressable
                      onPress={() => setMenuItemId(menuOpen ? null : item.inventoryId)}
                      hitSlop={8}
                      className={`h-9 w-9 items-center justify-center rounded-full ${
                        menuOpen
                          ? "bg-brand-light dark:bg-brand/20"
                          : "bg-neutral-100 dark:bg-neutral-800"
                      }`}
                    >
                      <Ellipsis size={16} color={menuOpen ? "#0B927E" : "#647B80"} />
                    </Pressable>
                  ) : null}
                </View>

                {menuOpen ? (
                  <View className="flex-row gap-2">
                    {ITEM_ACTIONS.map((action) => (
                      <Pressable
                        key={action.type}
                        onPress={() => onAction(action.type, item)}
                        className="flex-1 flex-row items-center justify-center gap-1 rounded-xl bg-brand-bg py-2 active:opacity-80 dark:bg-brand/10"
                      >
                        <action.Icon size={13} color="#0B927E" />
                        <Text className="text-[11px] font-bold text-brand">
                          {t(action.labelKey)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>

      {canAct ? (
        <View className="flex-row gap-2.5">
          {ITEM_ACTIONS.map((action) => (
            <Pressable
              key={action.type}
              disabled={items.length === 0}
              onPress={() => onAction(action.type)}
              className={`flex-1 items-center gap-1.5 rounded-2xl border border-neutral-border bg-white py-3.5 active:opacity-80 dark:border-neutral-800 dark:bg-neutral-900 ${
                items.length === 0 ? "opacity-40" : ""
              }`}
            >
              <action.Icon size={20} color="#0B927E" />
              <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                {t(action.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {canAct ? (
        <Pressable
          onPress={() => onAction("in")}
          className="h-12 flex-row items-center justify-center gap-2 rounded-xl bg-cta shadow-sm active:opacity-90"
        >
          <PackagePlus size={18} color="#FFFFFF" />
          <Text className="text-sm font-bold text-white">
            {isFloor ? t("rackMap.unracked.stockIn") : t("rackMap.action.stockIn")}
          </Text>
        </Pressable>
      ) : null}

      {onShowHistory && !isFloor ? (
        <Pressable
          onPress={onShowHistory}
          className="h-12 flex-row items-center gap-2 rounded-xl border border-neutral-border px-3.5 active:opacity-80 dark:border-neutral-700"
        >
          <Clock size={16} color="#647B80" />
          <Text className="flex-1 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
            {t("rackMap.history.link")}
          </Text>
          <ChevronRight size={16} color="#647B80" />
        </Pressable>
      ) : null}
    </BottomSheet>
  );
}
