import React, { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { ChevronDown, ChevronUp, Lock, PackageOpen } from "lucide-react-native";
import { stockMoveRequestSchema, type MessageLocale } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useStockMove } from "../hooks/useCustomerInventory";
import type { StockFormBaseProps } from "../types/rackMap.types";
import {
  INVENTORY_ERROR,
  formatTierShort,
  getPositionItems,
  getPositionLabel,
  isTierLocked,
  resolveInventoryError,
} from "../utils/rackMapFormat";
import { FieldError, FieldLabel, InventoryFormSheet } from "./InventoryFormSheet";
import { PositionCard } from "./PositionCard";
import { QuantityStepper } from "./QuantityStepper";
import { SkuSelectField } from "./SkuSelect";

/** `undefined` = no destination chosen yet, `null` = floor. */
type Destination = string | null | undefined;

export function StockMoveModal({
  visible,
  onClose,
  contractId,
  storageUnitId,
  tree,
  target,
  onApiError,
}: StockFormBaseProps) {
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const toast = useToast();
  const stockMoveMutation = useStockMove(storageUnitId);

  const items = getPositionItems(tree, target.tierId);
  const options = items.map((entry) => ({ sku: entry.sku, quantity: entry.quantity }));
  const [skuId, setSkuId] = useState<string | null>(
    target.item?.sku.id ?? (items.length === 1 ? items[0].sku.id : null)
  );
  const item = items.find((entry) => entry.sku.id === skuId) ?? null;
  const maxQuantity = item?.quantity ?? 0;

  const [destination, setDestination] = useState<Destination>(undefined);
  const [pickingDestination, setPickingDestination] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [showReason, setShowReason] = useState(false);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  const floorLabel = t("rackMap.form.floor");
  const sourceLabel = getPositionLabel(tree, target.tierId, floorLabel);

  const chooseDestination = (value: string | null) => {
    setDestination(value);
    setDestinationError(null);
    setPickingDestination(false);
  };

  const handleConfirm = async () => {
    let valid = true;
    if (destination === undefined) {
      setDestinationError(t("rackMap.form.destinationRequired"));
      valid = false;
    }
    if (!item) {
      setSkuError(t("rackMap.form.skuRequired"));
      valid = false;
    } else if (quantity < 1 || quantity > maxQuantity) {
      setQuantityError(
        quantity < 1
          ? t("rackMap.form.quantityMin")
          : t("rackMap.form.quantityMax", { max: maxQuantity })
      );
      valid = false;
    }
    if (!valid || destination === undefined || !item) return;

    const parsed = stockMoveRequestSchema.safeParse({
      contractId,
      skuId: item.sku.id,
      fromRackTierId: target.tierId,
      toRackTierId: destination,
      quantity,
      reason: reason.trim() || undefined,
    });
    if (!parsed.success) {
      setDestinationError(t("rackMap.form.samePosition"));
      return;
    }

    try {
      await stockMoveMutation.mutateAsync(parsed.data);
      toast.success(
        t("rackMap.toast.move", {
          qty: quantity,
          uom: item.sku.uom,
          sku: item.sku.skuCode,
          from: sourceLabel,
          to: getPositionLabel(tree, destination, floorLabel),
        })
      );
      onClose();
    } catch (error) {
      const resolved = resolveInventoryError(error, currentLocale);
      onApiError(resolved.messageCode);
      if (resolved.messageCode === INVENTORY_ERROR.INSUFFICIENT_QUANTITY) {
        setQuantityError(resolved.message);
        return;
      }
      if (resolved.messageCode === INVENTORY_ERROR.SAME_POSITION) {
        setDestinationError(resolved.message);
        return;
      }
      toast.error(resolved.message);
      if (resolved.messageCode !== undefined) onClose();
    }
  };

  const renderOption = (key: string, label: string, value: string | null, locked: boolean) => {
    const selected = destination === value;
    return (
      <Pressable
        key={key}
        disabled={locked}
        onPress={() => chooseDestination(value)}
        className={`min-w-[56px] flex-row items-center justify-center gap-1 rounded-xl border px-3 py-2 ${
          selected
            ? "border-brand bg-brand"
            : locked
              ? "border-neutral-border bg-neutral-100 opacity-40 dark:border-neutral-800 dark:bg-neutral-800"
              : "border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-900"
        }`}
      >
        {locked ? <Lock size={11} color="#647B80" /> : null}
        <Text
          className={`text-xs font-bold ${
            selected ? "text-white" : "text-neutral-700 dark:text-neutral-200"
          }`}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <InventoryFormSheet
      visible={visible}
      title={t("rackMap.form.moveTitle")}
      isPending={stockMoveMutation.isPending}
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <View className="gap-2">
        <FieldLabel>{t("rackMap.form.from")}</FieldLabel>
        <PositionCard tree={tree} tierId={target.tierId} />
      </View>

      <View className="gap-2">
        <FieldLabel>{t("rackMap.form.to")}</FieldLabel>
        <PositionCard
          tree={tree}
          tierId={destination}
          placeholder={t("rackMap.form.chooseDestination")}
          expanded={pickingDestination}
          onPress={() => setPickingDestination((prev) => !prev)}
        />
        {pickingDestination ? (
          <View className="gap-2.5 rounded-2xl border border-neutral-border bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-800/60">
            {tree.racks.map((rack) => {
              const tiers = rack.tiers
                .filter((tier) => tier.id !== target.tierId)
                .sort((a, b) => a.tierNumber - b.tierNumber);
              if (tiers.length === 0) return null;
              return (
                <View key={rack.id} className="flex-row items-start gap-2">
                  <Text className="w-10 pt-2 text-xs font-extrabold text-neutral-dark dark:text-neutral-100">
                    {rack.rackCode}
                  </Text>
                  <View className="flex-1 flex-row flex-wrap gap-2">
                    {tiers.map((tier) =>
                      renderOption(
                        tier.id,
                        formatTierShort(tier.tierNumber),
                        tier.id,
                        isTierLocked(tier.status)
                      )
                    )}
                  </View>
                </View>
              );
            })}
            {target.tierId !== null ? (
              <Pressable
                onPress={() => chooseDestination(null)}
                className={`flex-row items-center gap-2 rounded-xl border px-3 py-2.5 ${
                  destination === null
                    ? "border-brand bg-brand"
                    : "border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-900"
                }`}
              >
                <PackageOpen size={14} color={destination === null ? "#FFFFFF" : "#0B927E"} />
                <Text
                  className={`text-xs font-bold ${
                    destination === null ? "text-white" : "text-neutral-700 dark:text-neutral-200"
                  }`}
                >
                  {floorLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <FieldError message={destinationError} />
      </View>

      <View className="gap-2">
        <FieldLabel>{t("rackMap.form.chooseSku")}</FieldLabel>
        <SkuSelectField
          options={options}
          selectedId={skuId}
          emptyText={t("rackMap.detail.emptyItems")}
          onSelect={(id) => {
            setSkuId(id);
            setQuantity(1);
            setSkuError(null);
            setQuantityError(null);
          }}
        />
        <FieldError message={skuError} />
      </View>

      <View className="gap-2">
        <FieldLabel>{t("rackMap.form.quantity")}</FieldLabel>
        <QuantityStepper
          value={quantity}
          min={1}
          max={maxQuantity}
          disabled={!item}
          onChange={(value) => {
            setQuantity(value);
            setQuantityError(null);
          }}
        />
        {item ? (
          <Text variant="muted" className="text-[11px]">
            {t("rackMap.form.maxQuantity", { max: maxQuantity, uom: item.sku.uom })}
          </Text>
        ) : null}
        <FieldError message={quantityError} />
      </View>

      <Pressable
        onPress={() => setShowReason((prev) => !prev)}
        className="flex-row items-center gap-1.5 self-start"
      >
        {showReason ? (
          <ChevronUp size={14} color="#0B927E" />
        ) : (
          <ChevronDown size={14} color="#0B927E" />
        )}
        <Text className="text-xs font-bold text-brand">{t("rackMap.form.addReason")}</Text>
      </Pressable>

      {showReason ? (
        <TextInput
          value={reason}
          onChangeText={(val) => setReason(val.slice(0, 1000))}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          placeholder={t("rackMap.form.reasonPlaceholder")}
          placeholderTextColor="#94A3B8"
          className="min-h-[64px] rounded-xl border border-neutral-border bg-white p-3.5 text-xs text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      ) : null}
    </InventoryFormSheet>
  );
}
