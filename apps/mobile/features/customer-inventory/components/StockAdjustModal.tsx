import React, { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { stockAdjustRequestSchema, type MessageLocale } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useStockAdjust } from "../hooks/useCustomerInventory";
import type { StockFormBaseProps } from "../types/rackMap.types";
import { getPositionItems, getPositionLabel, resolveInventoryError } from "../utils/rackMapFormat";
import { FieldError, FieldLabel, InventoryFormSheet } from "./InventoryFormSheet";
import { PositionCard } from "./PositionCard";
import { QuantityStepper } from "./QuantityStepper";
import { SkuSelectField } from "./SkuSelect";

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

  const items = getPositionItems(tree, target.tierId);
  const options = items.map((entry) => ({ sku: entry.sku, quantity: entry.quantity }));
  const initialItem = target.item ?? (items.length === 1 ? items[0] : null);
  const [skuId, setSkuId] = useState<string | null>(initialItem?.sku.id ?? null);
  const item = items.find((entry) => entry.sku.id === skuId) ?? null;
  const currentQuantity = item?.quantity ?? 0;

  const [newQuantity, setNewQuantity] = useState(initialItem?.quantity ?? 0);
  const [reason, setReason] = useState("");
  const [skuError, setSkuError] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);

  const locationLabel = getPositionLabel(tree, target.tierId, t("rackMap.form.floor"));
  const unchanged = !item || newQuantity === currentQuantity;

  const handleConfirm = async () => {
    if (!item) {
      setSkuError(t("rackMap.form.skuRequired"));
      return;
    }
    if (unchanged) return;
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
      isPending={stockAdjustMutation.isPending}
      confirmDisabled={unchanged}
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <PositionCard tree={tree} tierId={target.tierId} />

      <View className="gap-2">
        <FieldLabel>{t("rackMap.form.current")}</FieldLabel>
        <SkuSelectField
          options={options}
          selectedId={skuId}
          emptyText={t("rackMap.detail.emptyItems")}
          onSelect={(id) => {
            setSkuId(id);
            setNewQuantity(items.find((entry) => entry.sku.id === id)?.quantity ?? 0);
            setSkuError(null);
          }}
        />
        <FieldError message={skuError} />
      </View>

      <View className="gap-2">
        <FieldLabel>{t("rackMap.form.actualQuantity")}</FieldLabel>
        <QuantityStepper
          size="lg"
          value={newQuantity}
          min={0}
          disabled={!item}
          onChange={setNewQuantity}
        />
        {item ? (
          <Text variant="muted" className="text-[11px]">
            {newQuantity === currentQuantity
              ? t("rackMap.form.unchanged")
              : t("rackMap.form.currentQuantity", { qty: currentQuantity, uom: item.sku.uom })}
          </Text>
        ) : null}
      </View>

      <View className="gap-2">
        <FieldLabel>{t("rackMap.form.reason")}</FieldLabel>
        <View className="flex-row flex-wrap gap-2">
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
                className={`rounded-full border px-3 py-1.5 ${
                  selected
                    ? "border-brand bg-brand-light/40 dark:bg-brand/20"
                    : "border-neutral-border bg-white dark:border-neutral-800 dark:bg-neutral-900"
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
          placeholder={t("rackMap.form.reasonPlaceholder")}
          placeholderTextColor="#94A3B8"
          className="min-h-[80px] rounded-xl border border-neutral-border bg-white p-3.5 text-xs text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <FieldError message={reasonError} />
      </View>
    </InventoryFormSheet>
  );
}
