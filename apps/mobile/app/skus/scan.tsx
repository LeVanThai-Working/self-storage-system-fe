import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Info, Plus } from "lucide-react-native";
import type {
  CustomerSkuResponse,
  MessageLocale,
  SkuLocationsResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";
import { BarcodeScannerView } from "@/features/customer-inventory/components/BarcodeScannerView";
import { SkuThumb } from "@/features/customer-inventory/components/SkuThumb";
import { useLocateSku } from "@/features/customer-inventory/hooks/useCustomerInventory";
import { useLookupSkuByBarcode } from "@/features/customer-sku/hooks/useCustomerSkus";
import {
  SKU_ERROR,
  isApiErrorCode,
  resolveSkuError,
} from "@/features/customer-sku/utils/skuFormat";

type ScanResult =
  | { kind: "found"; sku: CustomerSkuResponse; locations: SkuLocationsResponse | null }
  | { kind: "missing"; barcode: string };

/** C13 — scan a barcode, then jump to the SKU, its rack location, or create it. */
export default function SkuScanScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const lookupBarcode = useLookupSkuByBarcode();
  const { locateBySkuId } = useLocateSku();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleScanned = async (barcode: string) => {
    setBusy(true);
    try {
      const sku = await lookupBarcode(barcode);
      const locations = await locateBySkuId(sku.id).catch(() => null);
      setResult({ kind: "found", sku, locations });
    } catch (error) {
      if (isApiErrorCode(error, SKU_ERROR.NOT_FOUND)) {
        setResult({ kind: "missing", barcode });
      } else {
        toast.error(resolveSkuError(error, currentLocale).message);
      }
    } finally {
      setBusy(false);
    }
  };

  const renderFound = (sku: CustomerSkuResponse, locations: SkuLocationsResponse | null) => {
    const items = locations?.locations ?? [];
    const firstContractId = items.find((item) => item.contract?.id)?.contract?.id;
    const total = locations?.sku.totalQuantity ?? 0;
    return (
      <View className="gap-3">
        <Pressable
          onPress={() => router.push({ pathname: "/skus/[id]", params: { id: sku.id } })}
          className="flex-row items-center gap-3 active:opacity-80"
        >
          <SkuThumb imageUrl={sku.imageUrl} />
          <View className="flex-1">
            <Text className="text-sm font-extrabold text-neutral-dark dark:text-neutral-100">
              {sku.name}
            </Text>
            <Text variant="muted" className="text-[11px]">
              {sku.skuCode} · {sku.barcode}
            </Text>
          </View>
        </Pressable>

        <View className="items-center rounded-2xl border border-brand/20 bg-brand-bg p-2.5 dark:bg-brand/10">
          <Text className="text-xs text-neutral-dark dark:text-neutral-100">
            {t("sku.scan.totalAt", { qty: total, uom: sku.uom, count: items.length })}
          </Text>
        </View>

        {items.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5">
            {items.map((item) => {
              const holding = !item.rackTier;
              return (
                <Text
                  key={item.inventoryId}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold",
                    holding ? "bg-cta-light text-cta-dark" : "bg-brand-light text-brand"
                  )}
                >
                  {holding
                    ? t("sku.detail.holdingArea")
                    : `${item.storageRack?.rackCode ?? ""}·T${String(item.rackTier!.tierNumber).padStart(2, "0")}`}{" "}
                  · {item.quantity}
                </Text>
              );
            })}
          </View>
        ) : null}

        <View className="flex-row gap-2.5">
          <Pressable
            disabled={!firstContractId}
            onPress={() =>
              firstContractId &&
              router.push({ pathname: "/contracts/[id]/rack-map", params: { id: firstContractId } })
            }
            className={cn(
              "flex-1 items-center rounded-xl border border-brand/40 py-3 active:opacity-70",
              !firstContractId && "opacity-50"
            )}
          >
            <Text className="text-xs font-bold text-brand">{t("sku.scan.viewOnMap")}</Text>
          </Pressable>
          <Pressable
            disabled={!firstContractId || total === 0}
            onPress={() =>
              firstContractId &&
              router.push({
                pathname: "/contracts/[id]/outbound/new",
                params: { id: firstContractId, skuId: sku.id },
              })
            }
            className={cn(
              "flex-1 items-center rounded-xl bg-cta py-3 active:opacity-80",
              (!firstContractId || total === 0) && "opacity-50"
            )}
          >
            <Text className="text-xs font-bold text-white">{t("sku.scan.requestOutbound")}</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderMissing = (barcode: string) => (
    <View className="gap-4">
      <View className="flex-row items-start gap-3">
        <Info size={22} color="#0B927E" />
        <View className="flex-1">
          <Text className="text-sm font-extrabold text-neutral-dark dark:text-neutral-100">
            {t("sku.scan.notFoundTitle")}
          </Text>
          <Text variant="muted" className="mt-1 text-xs leading-5">
            {t("sku.scan.notFoundDesc", { barcode })}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => router.replace({ pathname: "/skus/new", params: { barcode } })}
        className="flex-row items-center justify-center gap-2 rounded-xl bg-cta py-3 active:opacity-80"
      >
        <Plus size={15} color="#FFFFFF" />
        <Text className="text-xs font-bold text-white">{t("sku.scan.createWithBarcode")}</Text>
      </Pressable>
      <Pressable onPress={() => setResult(null)} className="items-center py-1">
        <Text className="text-xs font-bold text-brand">{t("sku.scan.rescan")}</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="flex-row items-center gap-2 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
          <ArrowLeft size={22} color="#0B927E" />
        </Pressable>
        <Text className="flex-1 text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
          {t("sku.scan.title")}
        </Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4">
        <BarcodeScannerView
          onScanned={(code) => void handleScanned(code)}
          onClose={() => router.back()}
          busy={busy}
        />

        {result ? (
          <View className="rounded-3xl border border-neutral-border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            {result.kind === "found"
              ? renderFound(result.sku, result.locations)
              : renderMissing(result.barcode)}
          </View>
        ) : (
          <Text variant="muted" className="text-center text-xs">
            {t("sku.scan.hint")}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
