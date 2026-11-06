import React from "react";
import { Pressable, View } from "react-native";
import { Box, ChevronRight, Map as MapIcon, PackageOpen } from "lucide-react-native";
import type { SkuLocationItem, SkuLocatorItem } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { formatTierShort } from "../utils/rackMapFormat";
import { ItemStatusBadge } from "./ItemStatusBadge";
import { SkuThumb } from "./SkuThumb";

interface SkuLocatorCardProps {
  item: SkuLocatorItem;
  onOpenSku: () => void;
  onOpenLocation: (location: SkuLocationItem) => void;
}

function PathStep({ label, value }: { label: string; value: string }) {
  return (
    <View className="shrink">
      <Text variant="muted" className="text-[10px]">
        {label}
      </Text>
      <Text numberOfLines={2} className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
        {value}
      </Text>
    </View>
  );
}

/** One SKU of the locator: its stock state, then every position under any contract. */
export function SkuLocatorCard({ item, onOpenSku, onOpenLocation }: SkuLocatorCardProps) {
  const { t } = useTranslation();
  const { sku, totalQuantity, rackQuantity, holdingQuantity, locations } = item;
  const stored = totalQuantity > 0;
  const rackLocationCount = locations.filter((location) => location.rackTier).length;

  const formatArea = (location: SkuLocationItem) => {
    const unit = location.storageUnit?.unitNumber;
    const aisle = location.storageRack?.aisle;
    return [
      unit ? t("sku.locator.area.unit", { unit }) : null,
      aisle ? t("sku.locator.area.aisle", { aisle }) : null,
    ]
      .filter(Boolean)
      .join(" · ");
  };

  const renderContractLine = (location: SkuLocationItem) => (
    <View className="mt-2 flex-row items-center gap-2">
      <Text
        numberOfLines={1}
        className="shrink rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-bold text-neutral-muted dark:bg-neutral-800"
      >
        {t("rackMap.contractLabel", { code: location.contract?.contractCode ?? "" })}
      </Text>
      <View className="flex-1" />
      <MapIcon size={12} color="#0B927E" />
      <Text className="text-[11px] font-bold text-brand">{t("sku.locator.viewOnMap")}</Text>
      <ChevronRight size={13} color="#0B927E" />
    </View>
  );

  const renderRackLocation = (location: SkuLocationItem) => (
    <>
      <View className="flex-row items-start gap-2">
        <View className="flex-1 gap-1">
          <PathStep label={t("sku.locator.step.facility")} value={location.facility?.name ?? "—"} />
          <View className="flex-row flex-wrap items-center gap-x-1.5 gap-y-1">
            <PathStep label={t("sku.locator.step.area")} value={formatArea(location) || "—"} />
            <ChevronRight size={12} color="#94A3B8" />
            <PathStep
              label={t("sku.locator.step.rack")}
              value={location.storageRack?.rackCode ?? "—"}
            />
            <ChevronRight size={12} color="#94A3B8" />
            <PathStep
              label={t("sku.locator.step.tier")}
              value={formatTierShort(location.rackTier?.tierNumber ?? 0)}
            />
          </View>
        </View>
        <Text className="text-xs font-extrabold text-brand">
          {location.quantity} {sku.uom}
        </Text>
      </View>
      <ItemStatusBadge status={location.status} />
    </>
  );

  const renderHoldingLocation = (location: SkuLocationItem) => (
    <View className="flex-row items-start gap-2">
      <Box size={16} color="#E1601C" />
      <View className="flex-1">
        <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
          {location.facility?.name}
        </Text>
        <Text variant="muted" className="mt-0.5 text-[11px]">
          {t("sku.detail.holdingHint", { unit: location.storageUnit?.unitNumber ?? "" })}
        </Text>
      </View>
      <Text className="text-xs font-extrabold text-cta-dark">
        {location.quantity} {sku.uom}
      </Text>
    </View>
  );

  return (
    <View className="rounded-3xl border border-neutral-border bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
      <Pressable onPress={onOpenSku} className="flex-row gap-3 active:opacity-80">
        <SkuThumb imageUrl={sku.imageUrl} size="sm" />
        <View className="flex-1 gap-0.5">
          <Text
            numberOfLines={1}
            className="text-sm font-bold text-neutral-dark dark:text-neutral-100"
          >
            {sku.name}
          </Text>
          <Text numberOfLines={1} className="font-mono text-[11px] font-bold text-neutral-muted">
            {sku.skuCode}
          </Text>
        </View>
        <Text
          className={cn(
            "self-start rounded-full px-2.5 py-1 text-[11px] font-bold",
            rackQuantity > 0
              ? "bg-brand-light text-brand dark:bg-brand/20"
              : holdingQuantity > 0
                ? "bg-cta-light text-cta-dark dark:bg-cta/20"
                : "bg-neutral-100 text-neutral-muted dark:bg-neutral-800"
          )}
        >
          {totalQuantity} {sku.uom}
        </Text>
      </Pressable>

      <View className="mt-2 flex-row flex-wrap gap-1.5">
        {rackQuantity > 0 ? (
          <Text className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-bold text-brand dark:bg-brand/20">
            {t("sku.locator.badge.onRack", { count: rackLocationCount })}
          </Text>
        ) : null}
        {holdingQuantity > 0 ? (
          <Text className="rounded-full bg-cta-light px-2 py-0.5 text-[10px] font-bold text-cta-dark dark:bg-cta/20">
            {t("sku.locator.filter.holding")}
          </Text>
        ) : null}
        {!stored ? (
          <Text className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-muted dark:bg-neutral-800">
            {t("sku.locator.filter.notStored")}
          </Text>
        ) : null}
      </View>

      {stored ? (
        locations.map((location) => (
          <Pressable
            key={location.inventoryId}
            onPress={() => onOpenLocation(location)}
            className="mt-3 gap-1 border-t border-neutral-border pt-3 active:opacity-70 dark:border-neutral-800"
          >
            {location.rackTier ? renderRackLocation(location) : renderHoldingLocation(location)}
            {renderContractLine(location)}
          </Pressable>
        ))
      ) : (
        <Pressable
          onPress={onOpenSku}
          className="mt-3 flex-row items-start gap-2 rounded-2xl border border-dashed border-neutral-border p-3 active:opacity-70 dark:border-neutral-700"
        >
          <PackageOpen size={16} color="#647B80" />
          <View className="flex-1 gap-1">
            <Text variant="muted" className="text-[11px] leading-4">
              {t("sku.locator.notStoredHint")}
            </Text>
            <Text className="text-[11px] font-bold text-brand">{t("sku.locator.viewSku")}</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}
