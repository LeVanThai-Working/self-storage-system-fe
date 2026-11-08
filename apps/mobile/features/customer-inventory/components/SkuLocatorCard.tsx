import React from "react";
import { Pressable, View } from "react-native";
import { Box, ChevronRight, MapPin } from "lucide-react-native";
import {
  ContractStatusEnum,
  type SkuLocationItem,
  type SkuLocatorItem,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { getContractStatusMeta } from "@/features/contracts/utils/contractFormat";
import { buildFloorLabel, buildLocationLabel, formatTierShort } from "../utils/rackMapFormat";
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
  const { t, locale } = useTranslation();
  const { sku, totalQuantity, rackQuantity, holdingQuantity, locations } = item;
  const stored = totalQuantity > 0;
  const rackLocationCount = locations.filter((location) => location.rackTier).length;

  // Stock can stay on the rack after its contract ended; say so instead of implying a live rental.
  const renderContractLine = (location: SkuLocationItem) => {
    const status = location.contract?.status;
    const ended =
      !!status && status !== ContractStatusEnum.ACTIVE && status !== ContractStatusEnum.OVERDUE;
    const statusMeta = ended ? getContractStatusMeta(status, locale) : null;
    return (
      <View className="mt-2 flex-row items-center gap-2">
        <Text
          numberOfLines={1}
          className="shrink rounded-full bg-brand-bg px-2 py-0.5 font-mono text-[10px] font-bold text-brand dark:bg-brand/15"
        >
          {t("sku.locator.contractChip", { code: location.contract?.contractCode ?? "" })}
        </Text>
        {statusMeta ? (
          <Text
            numberOfLines={1}
            className={cn("shrink text-[10px] font-bold", statusMeta.badgeTextClass)}
          >
            {statusMeta.label}
          </Text>
        ) : null}
        <View className="flex-1" />
        <Text className="text-[11px] font-bold text-brand">{t("sku.locator.viewOnMap")}</Text>
        <ChevronRight size={13} color="#0B927E" />
      </View>
    );
  };

  // The area of a position is its address: facility › unit › rack › tier, or the unit's holding area.
  const renderLocation = (location: SkuLocationItem) => {
    const tier = location.rackTier;
    const facilityCode = location.facility?.code;
    const unitNumber = location.storageUnit?.unitNumber;
    const address = tier
      ? buildLocationLabel({
          facilityCode,
          unitNumber,
          rackCode: location.storageRack?.rackCode,
          tierCode: tier.tierCode,
        })
      : buildFloorLabel(facilityCode, unitNumber);
    return (
      <>
        <View className="flex-row items-center gap-1.5">
          {tier ? <MapPin size={13} color="#0B927E" /> : <Box size={13} color="#E1601C" />}
          <Text variant="muted" className="text-[11px]">
            {t("sku.locator.address")}
          </Text>
          <Text
            numberOfLines={1}
            className="flex-1 font-mono text-[11px] font-bold text-neutral-dark dark:text-neutral-100"
          >
            {address}
          </Text>
          <Text className={cn("text-xs font-extrabold", tier ? "text-brand" : "text-cta-dark")}>
            {location.quantity} {sku.uom}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="flex-1">
            <PathStep
              label={t("sku.locator.step.facility")}
              value={location.facility?.name ?? "—"}
            />
          </View>
          <ChevronRight size={12} color="#94A3B8" />
          <PathStep label={t("sku.locator.step.unit")} value={unitNumber ?? "—"} />
          <ChevronRight size={12} color="#94A3B8" />
          {tier ? (
            <>
              <PathStep
                label={t("sku.locator.step.rack")}
                value={location.storageRack?.rackCode ?? "—"}
              />
              <ChevronRight size={12} color="#94A3B8" />
              <PathStep
                label={t("sku.locator.step.tier")}
                value={formatTierShort(tier.tierNumber)}
              />
            </>
          ) : (
            <PathStep
              label={t("sku.locator.step.position")}
              value={t("sku.locator.filter.holding")}
            />
          )}
        </View>
        {tier ? <ItemStatusBadge status={location.status} /> : null}
      </>
    );
  };

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
          <View className="mt-1 flex-row flex-wrap gap-1.5">
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
                {t("sku.locator.badge.notStored")}
              </Text>
            ) : null}
          </View>
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

      {stored ? (
        locations.map((location) => (
          <Pressable
            key={location.inventoryId}
            onPress={() => onOpenLocation(location)}
            className="mt-3 gap-1.5 border-t border-neutral-border pt-3 active:opacity-70 dark:border-neutral-800"
          >
            {renderLocation(location)}
            {renderContractLine(location)}
          </Pressable>
        ))
      ) : (
        <Pressable
          onPress={onOpenSku}
          className="mt-3 items-center gap-1 rounded-xl border border-dashed border-neutral-border bg-neutral-50 p-3 active:opacity-70 dark:border-neutral-700 dark:bg-neutral-800"
        >
          <Text variant="muted" className="text-center text-[11px] leading-4">
            {t("sku.locator.notStoredHint")}
          </Text>
          <Text className="text-[11px] font-bold text-brand">{t("sku.locator.viewSku")}</Text>
        </Pressable>
      )}
    </View>
  );
}
