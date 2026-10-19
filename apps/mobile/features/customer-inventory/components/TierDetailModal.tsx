import React from "react";
import { Modal, View, ScrollView, Pressable, Image } from "react-native";
import {
  ArrowLeftRight,
  ClipboardCheck,
  Info,
  Package,
  PackageMinus,
  PackagePlus,
  X,
} from "lucide-react-native";
import type {
  StorageUnitInventoryTreeResponse,
  TreeTierItem,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import type { StockActionType } from "../types/rackMap.types";
import {
  findTierInTree,
  formatWeightKg,
  getPositionItems,
  getPositionLabel,
  getTierVisual,
  getTierWeight,
} from "../utils/rackMapFormat";

interface TierDetailModalProps {
  visible: boolean;
  onClose: () => void;
  tree: StorageUnitInventoryTreeResponse;
  /** Tier being viewed, or `null` for floor (unracked) items. */
  tierId: string | null;
  readOnly: boolean;
  onAction: (type: StockActionType, item?: TreeTierItem) => void;
  /** Optional footer link (e.g. tier history). */
  footerAccessory?: React.ReactNode;
}

export function TierDetailModal({
  visible,
  onClose,
  tree,
  tierId,
  readOnly,
  onAction,
  footerAccessory,
}: TierDetailModalProps) {
  const { t } = useTranslation();
  const found = findTierInTree(tree, tierId);
  const tier = found?.tier ?? null;
  const items = getPositionItems(tree, tierId);
  const visual = tier ? getTierVisual(tier.status) : null;
  const locked = Boolean(visual?.locked);
  const canAct = !readOnly && !locked;
  const weight = tier ? getTierWeight(tier) : null;
  const title = getPositionLabel(tree, tierId, t("rackMap.unracked.title"));

  const actionButtons: { type: StockActionType; labelKey: string; icon: React.ReactNode }[] = [
    {
      type: "out",
      labelKey: "rackMap.action.stockOut",
      icon: <PackageMinus size={13} color="#0B927E" />,
    },
    {
      type: "move",
      labelKey: "rackMap.action.move",
      icon: <ArrowLeftRight size={13} color="#0B927E" />,
    },
    {
      type: "adjust",
      labelKey: "rackMap.action.adjust",
      icon: <ClipboardCheck size={13} color="#0B927E" />,
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[88%] rounded-t-3xl bg-white dark:bg-neutral-900 border-t border-neutral-border dark:border-neutral-800">
          <View className="flex-row items-center justify-between border-b border-neutral-border dark:border-neutral-800 px-5 py-4">
            <View className="flex-1 pr-3">
              <Text className="font-mono text-base font-bold text-neutral-dark dark:text-neutral-100">
                {title}
              </Text>
              {visual ? (
                <Text variant="muted" className="text-xs mt-0.5">
                  {t(visual.labelKey)}
                  {tier ? ` · ${t("rackMap.tierTitle", { number: tier.tierNumber })}` : ""}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <X size={16} color="#647B80" />
            </Pressable>
          </View>

          <ScrollView contentContainerClassName="p-5 pb-8 gap-4">
            {weight && weight.maxWeightKg ? (
              <View className="gap-1">
                <View className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <View
                    className={`h-2 rounded-full ${
                      weight.level === "over"
                        ? "bg-cta"
                        : weight.level === "near"
                          ? "bg-cta/60"
                          : "bg-brand"
                    }`}
                    style={{ width: `${Math.min(100, Math.round((weight.ratio ?? 0) * 100))}%` }}
                  />
                </View>
                <Text variant="muted" className="text-[11px]">
                  {t("rackMap.weight.load", {
                    weight: formatWeightKg(weight.weightKg),
                    max: formatWeightKg(weight.maxWeightKg),
                  })}
                </Text>
              </View>
            ) : null}

            {readOnly || locked ? (
              <View className="flex-row items-start gap-2 rounded-2xl border border-sky-200 dark:border-sky-900 bg-sky-50/80 dark:bg-sky-950/30 p-3">
                <Info size={14} color="#0284C7" />
                <Text className="flex-1 text-[11px] leading-4 text-sky-800 dark:text-sky-300">
                  {readOnly ? t("rackMap.readOnlyBanner") : t("rackMap.lockedTier")}
                </Text>
              </View>
            ) : null}

            <View>
              <Text className="text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 mb-2">
                {t("rackMap.detail.itemsTitle")}
              </Text>

              {items.length === 0 ? (
                <View className="items-center rounded-2xl border border-dashed border-neutral-border dark:border-neutral-700 p-5">
                  <Package size={24} color="#647B80" />
                  <Text variant="muted" className="mt-1.5 text-xs">
                    {t("rackMap.detail.emptyItems")}
                  </Text>
                </View>
              ) : (
                <View className="gap-2.5">
                  {items.map((item) => (
                    <View
                      key={item.inventoryId}
                      className="rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 p-3 gap-2.5"
                    >
                      <View className="flex-row items-center gap-3">
                        {item.sku.imageUrl ? (
                          <Image
                            source={{ uri: item.sku.imageUrl }}
                            className="h-11 w-11 rounded-xl bg-neutral-100"
                          />
                        ) : (
                          <View className="h-11 w-11 items-center justify-center rounded-xl bg-white dark:bg-neutral-900">
                            <Package size={18} color="#647B80" />
                          </View>
                        )}
                        <View className="flex-1">
                          <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                            {item.sku.skuCode}
                          </Text>
                          <Text numberOfLines={1} variant="muted" className="text-xs">
                            {item.sku.name}
                          </Text>
                        </View>
                        <Text className="text-sm font-extrabold text-brand">
                          {item.quantity} {item.sku.uom}
                        </Text>
                      </View>

                      {canAct ? (
                        <View className="flex-row gap-2">
                          {actionButtons.map((action) => (
                            <Pressable
                              key={action.type}
                              onPress={() => onAction(action.type, item)}
                              className="flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-brand/40 bg-white dark:bg-neutral-900 py-2 active:opacity-80"
                            >
                              {action.icon}
                              <Text className="text-[11px] font-bold text-brand">
                                {t(action.labelKey)}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {footerAccessory}

            {canAct ? (
              <Pressable
                onPress={() => onAction("in")}
                className="flex-row items-center justify-center gap-1.5 rounded-xl bg-cta py-3.5 shadow-sm active:opacity-90"
              >
                <PackagePlus size={16} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">
                  {tierId === null ? t("rackMap.unracked.stockIn") : t("rackMap.action.stockIn")}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
