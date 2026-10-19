import React, { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { stockAdjustRequestSchema, type MessageLocale } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useStockAdjust } from "../hooks/useCustomerInventory";
import type { StockFormBaseProps } from "../types/rackMap.types";
import { getPositionLabel, resolveInventoryError } from "../utils/rackMapFormat";
import { FieldError, FieldLabel, InventoryFormSheet } from "./InventoryFormSheet";
import { QuantityStepper } from "./QuantityStepper";

const REASON_MIN_LENGTH = 3;
const REASON_CHIP_KEYS = [
  "rackMap.reasonChip.periodic",
  "rackMap.reasonChip.damaged",
  "rackMap.reasonChip.wrongEntry",
];

export function StockAdjustModal({
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
  const stockAdjustMutation = useStockAdjust(storageUnitId);

  const item = target.item;
  const currentQuantity = item?.quantity ?? 0;
  const [newQuantity, setNewQuantity] = useState(currentQuantity);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const locationLabel = getPositionLabel(tree, target.tierId, t("rackMap.form.floor"));
  const unchanged = newQuantity === currentQuantity;

  const handleConfirm = async () => {
    if (!item || unchanged) return;
    const trimmed = reason.trim();
    if (trimmed.length < REASON_MIN_LENGTH) {
      setReasonError(t("rackMap.form.reasonMin"));
      return;
    }

    const parsed = stockAdjustRequestSchema.safeParse({
      contractId,
      skuId: item.sku.id,
      rackTierId: target.tierId,
      newQuantity,
      reason: trimmed,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("rackMap.loadError"));
      return;
    }

    try {
      await stockAdjustMutation.mutateAsync(parsed.data);
      toast.success(
        t("rackMap.toast.adjust", {
          qty: newQuantity,
          uom: item.sku.uom,
          sku: item.sku.skuCode,
          location: locationLabel,
        })
      );
      onClose();
    } catch (error) {
      const resolved = resolveInventoryError(error, currentLocale);
      onApiError(resolved.messageCode);
      toast.error(resolved.message);
      if (resolved.messageCode !== undefined) onClose();
    }
  };

  return (
    <InventoryFormSheet
      visible={visible}
      title={t("rackMap.form.adjustTitle")}
      subtitle={item ? `${item.sku.skuCode} · ${locationLabel}` : locationLabel}
      isPending={stockAdjustMutation.isPending}
      confirmDisabled={unchanged}
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <View>
        <FieldLabel>{t("rackMap.form.actualQuantity")}</FieldLabel>
        <QuantityStepper
          value={newQuantity}
          min={0}
          unitLabel={item?.sku.uom}
          onChange={setNewQuantity}
        />
        <Text variant="muted" className="mt-1 text-[11px]">
          {unchanged
            ? t("rackMap.form.unchanged")
            : t("rackMap.form.currentQuantity", { qty: currentQuantity, uom: item?.sku.uom ?? "" })}
        </Text>
      </View>

      <View>
        <FieldLabel>{t("rackMap.form.reason")}</FieldLabel>
        <View className="flex-row flex-wrap gap-2 mb-2.5">
          {REASON_CHIP_KEYS.map((key) => {
            const label = t(key);
            const selected = reason === label;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  setReason(label);
                  setReasonError(null);
                }}
                className={`rounded-xl border px-3 py-1.5 ${
                  selected
                    ? "border-brand bg-brand-light/40 dark:bg-brand/20"
                    : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selected ? "text-brand" : "text-neutral-600 dark:text-neutral-300"
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          value={reason}
          onChangeText={(val) => {
            setReason(val.slice(0, 1000));
            setReasonError(null);
          }}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          placeholderTextColor="#94A3B8"
          className="min-h-[72px] rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-3.5 text-xs text-neutral-dark dark:text-neutral-100"
        />
        <FieldError message={reasonError} />
      </View>
    </InventoryFormSheet>
  );
}
