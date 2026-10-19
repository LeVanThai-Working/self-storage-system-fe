import React, { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Layers } from "lucide-react-native";
import { stockMoveRequestSchema, type MessageLocale } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useStockMove } from "../hooks/useCustomerInventory";
import type { StockFormBaseProps } from "../types/rackMap.types";
import {
  INVENTORY_ERROR,
  getPositionLabel,
  isTierLocked,
  resolveInventoryError,
} from "../utils/rackMapFormat";
import { FieldError, FieldLabel, InventoryFormSheet } from "./InventoryFormSheet";
import { QuantityStepper } from "./QuantityStepper";

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

  const item = target.item;
  const maxQuantity = item?.quantity ?? 0;
  const [destination, setDestination] = useState<Destination>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  const floorLabel = t("rackMap.form.floor");
  const sourceLabel = getPositionLabel(tree, target.tierId, floorLabel);

  const handleConfirm = async () => {
    if (!item) return;
    let valid = true;
    if (destination === undefined) {
      setDestinationError(t("rackMap.form.destinationRequired"));
      valid = false;
    }
    if (quantity < 1 || quantity > maxQuantity) {
      setQuantityError(
        quantity < 1
          ? t("rackMap.form.quantityMin")
          : t("rackMap.form.quantityMax", { max: maxQuantity })
      );
      valid = false;
    }
    if (!valid || destination === undefined) return;

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

  const renderOption = (key: string, label: string, value: string | null, disabled: boolean) => {
    const selected = destination === value;
    return (
      <Pressable
        key={key}
        disabled={disabled}
        onPress={() => {
          setDestination(value);
          setDestinationError(null);
        }}
        className={`rounded-xl border px-3 py-2 ${
          selected
            ? "border-brand bg-brand"
            : disabled
              ? "border-neutral-border dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 opacity-40"
              : "border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900"
        }`}
      >
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
      subtitle={item ? `${item.sku.skuCode} · ${sourceLabel}` : sourceLabel}
      isPending={stockMoveMutation.isPending}
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <View>
        <FieldLabel>{t("rackMap.form.destination")}</FieldLabel>
        <View className="gap-2.5">
          {tree.racks.map((rack) => {
            const tiers = rack.tiers.filter((tier) => tier.id !== target.tierId);
            if (tiers.length === 0) return null;
            return (
              <View key={rack.id} className="flex-row items-start gap-2">
                <View className="w-12 flex-row items-center gap-1 pt-2">
                  <Layers size={12} color="#647B80" />
                  <Text className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                    {rack.rackCode}
                  </Text>
                </View>
                <View className="flex-1 flex-row flex-wrap gap-2">
                  {tiers.map((tier) =>
                    renderOption(tier.id, tier.tierCode, tier.id, isTierLocked(tier.status))
                  )}
                </View>
              </View>
            );
          })}
          {target.tierId !== null ? (
            <View className="flex-row">{renderOption("floor", floorLabel, null, false)}</View>
          ) : null}
        </View>
        <FieldError message={destinationError} />
      </View>

      <View>
        <FieldLabel>{t("rackMap.form.quantity")}</FieldLabel>
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
