import React, { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { stockOutRequestSchema, type MessageLocale } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useStockOut } from "../hooks/useCustomerInventory";
import type { StockFormBaseProps } from "../types/rackMap.types";
import {
  INVENTORY_ERROR,
  getPositionItems,
  getPositionLabel,
  resolveInventoryError,
} from "../utils/rackMapFormat";
import { FieldError, FieldLabel, InventoryFormSheet } from "./InventoryFormSheet";
import { PositionCard } from "./PositionCard";
import { QuantityStepper } from "./QuantityStepper";
import { SkuSelectField } from "./SkuSelect";

export function StockOutModal({
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
  const stockOutMutation = useStockOut(storageUnitId);

  const items = getPositionItems(tree, target.tierId);
  const options = items.map((entry) => ({ sku: entry.sku, quantity: entry.quantity }));
  const [skuId, setSkuId] = useState<string | null>(
    target.item?.sku.id ?? (items.length === 1 ? items[0].sku.id : null)
  );
  const item = items.find((entry) => entry.sku.id === skuId) ?? null;
  const maxQuantity = item?.quantity ?? 0;

  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [skuError, setSkuError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  const locationLabel = getPositionLabel(tree, target.tierId, t("rackMap.form.floor"));

  const handleConfirm = async () => {
    if (!item) {
      setSkuError(t("rackMap.form.skuRequired"));
      return;
    }
    if (quantity < 1) {
      setQuantityError(t("rackMap.form.quantityMin"));
      return;
    }
    if (quantity > maxQuantity) {
      setQuantityError(t("rackMap.form.quantityMax", { max: maxQuantity }));
      return;
    }

    const parsed = stockOutRequestSchema.safeParse({
      contractId,
      skuId: item.sku.id,
      rackTierId: target.tierId,
      quantity,
      reason: reason.trim() || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("rackMap.loadError"));
      return;
    }

    try {
      await stockOutMutation.mutateAsync(parsed.data);
      toast.success(
        t("rackMap.toast.stockOut", {
          qty: quantity,
          uom: item.sku.uom,
          sku: item.sku.skuCode,
          location: locationLabel,
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
      toast.error(resolved.message);
      if (resolved.messageCode !== undefined) onClose();
    }
  };

  return (
    <InventoryFormSheet
      visible={visible}
      title={t("rackMap.form.stockOutTitle")}
      isPending={stockOutMutation.isPending}
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <PositionCard tree={tree} tierId={target.tierId} />

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
        <View className="flex-row items-center justify-between">
          <FieldLabel>{t("rackMap.form.quantity")}</FieldLabel>
          <Pressable
            disabled={!item}
            onPress={() => {
              setQuantity(maxQuantity);
              setQuantityError(null);
            }}
            className={`rounded-lg border border-brand/40 bg-brand-light/30 px-2.5 py-1 ${
              item ? "" : "opacity-40"
            }`}
          >
            <Text className="text-[11px] font-bold text-brand">{t("rackMap.form.takeAll")}</Text>
          </Pressable>
        </View>
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

      <View className="gap-2">
        <FieldLabel>{t("rackMap.form.reasonOptional")}</FieldLabel>
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
      </View>
    </InventoryFormSheet>
  );
}
