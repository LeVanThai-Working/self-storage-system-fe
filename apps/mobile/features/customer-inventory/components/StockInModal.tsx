import React, { useMemo, useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import { ChevronDown, ChevronUp, TriangleAlert } from "lucide-react-native";
import {
  stockInRequestSchema,
  type MessageLocale,
  type TreeTierItemSku,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useLocateSku, useStockIn } from "../hooks/useCustomerInventory";
import type { StockFormBaseProps } from "../types/rackMap.types";
import {
  INVENTORY_ERROR,
  findTierInTree,
  formatWeightKg,
  getPositionLabel,
  getRoomSkuOptions,
  getWeightLevel,
  resolveInventoryError,
  sumItemsWeight,
} from "../utils/rackMapFormat";
import { BarcodeScannerView } from "./BarcodeScannerView";
import { FieldError, FieldLabel, InventoryFormSheet } from "./InventoryFormSheet";
import { PositionCard } from "./PositionCard";
import { QuantityStepper } from "./QuantityStepper";
import { SkuSelectList, type SkuOption } from "./SkuSelect";

export function StockInModal({
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
  const stockInMutation = useStockIn(storageUnitId);
  const { locateByBarcode } = useLocateSku();

  // SKU picked by scanning that is not stored in this unit yet.
  const [scannedSku, setScannedSku] = useState<TreeTierItemSku | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);

  const skuOptions = useMemo<SkuOption[]>(() => {
    const options = getRoomSkuOptions(tree).map((option) => ({
      sku: option.sku,
      quantity: option.totalQuantity,
    }));
    if (scannedSku && !options.some((option) => option.sku.id === scannedSku.id)) {
      return [{ sku: scannedSku, quantity: 0 }, ...options];
    }
    return options;
  }, [tree, scannedSku]);

  // The screen mounts a fresh form each time it opens, so state starts from the target.
  const [skuId, setSkuId] = useState<string | null>(target.item?.sku.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [referenceCode, setReferenceCode] = useState("");
  const [notes, setNotes] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);

  const locationLabel = getPositionLabel(tree, target.tierId, t("rackMap.form.floor"));
  const tier = findTierInTree(tree, target.tierId)?.tier ?? null;
  const selectedSku = skuOptions.find((option) => option.sku.id === skuId)?.sku ?? null;

  const projectedWeight = useMemo(() => {
    if (!tier) return null;
    const added = quantity * (selectedSku?.weightKg ?? 0);
    return getWeightLevel(sumItemsWeight(tier.items) + added, tier.maxWeightKg);
  }, [tier, quantity, selectedSku]);

  const handleScanned = async (barcode: string) => {
    setLookingUp(true);
    try {
      const result = await locateByBarcode(barcode);
      setScannedSku(result.sku);
      setSkuId(result.sku.id);
      setSkuError(null);
      setScanning(false);
    } catch (error) {
      toast.error(resolveInventoryError(error, currentLocale).message);
    } finally {
      setLookingUp(false);
    }
  };

  const handleConfirm = async () => {
    let valid = true;
    if (!skuId) {
      setSkuError(t("rackMap.form.skuRequired"));
      valid = false;
    }
    if (quantity < 1) {
      setQuantityError(t("rackMap.form.quantityMin"));
      valid = false;
    }
    if (!valid || !skuId) return;

    const parsed = stockInRequestSchema.safeParse({
      contractId,
      skuId,
      rackTierId: target.tierId,
      quantity,
      referenceCode: referenceCode.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("rackMap.loadError"));
      return;
    }

    try {
      await stockInMutation.mutateAsync(parsed.data);
      toast.success(
        t("rackMap.toast.stockIn", {
          qty: quantity,
          uom: selectedSku?.uom ?? "",
          sku: selectedSku?.skuCode ?? "",
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
      title={t("rackMap.form.stockInTitle")}
      isPending={stockInMutation.isPending}
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      <PositionCard tree={tree} tierId={target.tierId} />

      <View className="gap-2">
        <FieldLabel>{t("rackMap.form.chooseSku")}</FieldLabel>
        {scanning ? (
          <BarcodeScannerView
            busy={lookingUp}
            onScanned={handleScanned}
            onClose={() => setScanning(false)}
          />
        ) : null}
        <SkuSelectList
          options={skuOptions}
          selectedId={skuId}
          emptyText={t("rackMap.form.selectSkuEmpty")}
          searchable
          onScanPress={() => setScanning((prev) => !prev)}
          onSelect={(id) => {
            setSkuId(id);
            setSkuError(null);
          }}
        />
        <FieldError message={skuError} />
      </View>

      <View className="gap-2">
        <View className="flex-row gap-3">
          <View className="flex-1 gap-2">
            <FieldLabel>{t("rackMap.form.quantity")}</FieldLabel>
            <QuantityStepper
              value={quantity}
              min={1}
              onChange={(value) => {
                setQuantity(value);
                setQuantityError(null);
              }}
            />
          </View>
          <View className="w-28 gap-2">
            <FieldLabel>{t("rackMap.form.unit")}</FieldLabel>
            <View className="h-11 justify-center rounded-xl border border-neutral-border bg-neutral-50 px-3 dark:border-neutral-700 dark:bg-neutral-800">
              <Text
                numberOfLines={1}
                className="text-sm font-semibold text-neutral-700 dark:text-neutral-200"
              >
                {selectedSku?.uom ?? "—"}
              </Text>
            </View>
          </View>
        </View>
        <FieldError message={quantityError} />
        {projectedWeight?.level === "over" && projectedWeight.maxWeightKg ? (
          <View className="flex-row items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
            <TriangleAlert size={14} color="#D97706" />
            <Text className="flex-1 text-[11px] leading-4 text-amber-800 dark:text-amber-300">
              {t("rackMap.weight.warning", {
                weight: formatWeightKg(projectedWeight.weightKg),
                max: formatWeightKg(projectedWeight.maxWeightKg),
              })}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        onPress={() => setShowMore((prev) => !prev)}
        className="flex-row items-center gap-1.5 self-start"
      >
        {showMore ? (
          <ChevronUp size={14} color="#0B927E" />
        ) : (
          <ChevronDown size={14} color="#0B927E" />
        )}
        <Text className="text-xs font-bold text-brand">{t("rackMap.form.moreInfo")}</Text>
      </Pressable>

      {showMore ? (
        <View className="gap-3">
          <View className="gap-2">
            <FieldLabel>{t("rackMap.form.referenceCode")}</FieldLabel>
            <TextInput
              value={referenceCode}
              onChangeText={(val) => setReferenceCode(val.slice(0, 100))}
              placeholderTextColor="#94A3B8"
              className="rounded-xl border border-neutral-border bg-white px-3.5 py-3 text-xs text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </View>
          <View className="gap-2">
            <FieldLabel>{t("rackMap.form.notes")}</FieldLabel>
            <TextInput
              value={notes}
              onChangeText={(val) => setNotes(val.slice(0, 1000))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholder={t("rackMap.form.notesPlaceholder")}
              placeholderTextColor="#94A3B8"
              className="min-h-[72px] rounded-xl border border-neutral-border bg-white p-3.5 text-xs text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </View>
        </View>
      ) : null}
    </InventoryFormSheet>
  );
}
