import React, { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { stockOutRequestSchema, type MessageLocale } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useStockOut } from "../hooks/useCustomerInventory";
import type { StockFormBaseProps } from "../types/rackMap.types";
import { INVENTORY_ERROR, getPositionLabel, resolveInventoryError } from "../utils/rackMapFormat";
import { FieldError, FieldLabel, InventoryFormSheet } from "./InventoryFormSheet";
import { QuantityStepper } from "./QuantityStepper";

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

  const item = target.item;
  const maxQuantity = item?.quantity ?? 0;
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [quantityError, setQuantityError] = useState<string | null>(null);

  const locationLabel = getPositionLabel(tree, target.tierId, t("rackMap.form.floor"));

  const handleConfirm = async () => {
    if (!item) return;
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
      subtitle={t("rackMap.form.positionLabel", { location: locationLabel })}
      isPending={stockOutMutation.isPending}
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      {item ? (
        <View className="rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 p-3.5">
          <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {item.sku.skuCode}
          </Text>
          <Text variant="muted" className="text-xs">
            {item.sku.name}
          </Text>
          <Text className="mt-1 text-xs font-semibold text-brand">
            {t("rackMap.form.currentQuantity", { qty: item.quantity, uom: item.sku.uom })}
          </Text>
        </View>
      ) : null}

      <View>
        <View className="flex-row items-center justify-between">
          <FieldLabel>{t("rackMap.form.quantity")}</FieldLabel>
          <Pressable
            onPress={() => {
              setQuantity(maxQuantity);
              setQuantityError(null);
            }}
            className="mb-2 rounded-lg border border-brand/40 bg-brand-light/30 px-2.5 py-1"
          >
            <Text className="text-[11px] font-bold text-brand">{t("rackMap.form.takeAll")}</Text>
          </Pressable>
        </View>
        <QuantityStepper
          value={quantity}
          min={1}
          max={maxQuantity}
          unitLabel={item?.sku.uom}
          onChange={(value) => {
            setQuantity(value);
            setQuantityError(null);
          }}
        />
        <Text variant="muted" className="mt-1 text-[11px]">
          {t("rackMap.form.maxQuantity", { max: maxQuantity, uom: item?.sku.uom ?? "" })}
        </Text>
        <FieldError message={quantityError} />
      </View>

      <View>
        <FieldLabel>{t("rackMap.form.reasonOptional")}</FieldLabel>
        <TextInput
          value={reason}
          onChangeText={(val) => setReason(val.slice(0, 1000))}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
          placeholderTextColor="#94A3B8"
          className="min-h-[64px] rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-3.5 text-xs text-neutral-dark dark:text-neutral-100"
        />
      </View>
    </InventoryFormSheet>
  );
}
