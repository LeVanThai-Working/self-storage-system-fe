import React, { useMemo, useState } from "react";
import { Modal, View, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ChevronRight,
  CircleX,
  MapPin,
  Package,
  ScanBarcode,
  Search,
} from "lucide-react-native";
import type {
  MessageLocale,
  SkuLocationItem,
  SkuLocationsResponse,
  StorageUnitInventoryTreeResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useLocateSku } from "../hooks/useCustomerInventory";
import {
  buildFloorLabel,
  buildLocationLabel,
  getRoomSkuOptions,
  getTierDisplayStatus,
  resolveInventoryError,
} from "../utils/rackMapFormat";
import { BarcodeScannerView } from "./BarcodeScannerView";
import { SkuThumb } from "./SkuThumb";
import { TierStatusBadge } from "./TierStatusBadge";

interface LocateSheetProps {
  visible: boolean;
  onClose: () => void;
  tree: StorageUnitInventoryTreeResponse;
  /**
   * Called with the lookup result. `focusTierId` is the location the user tapped
   * (`null` for floor items, `undefined` to just highlight every location).
   */
  onLocated: (result: SkuLocationsResponse, focusTierId?: string | null) => void;
}

/** Full-screen "find items" page: search SKUs in the unit or scan a barcode. */
export function LocateSheet({ visible, onClose, tree, onLocated }: LocateSheetProps) {
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const toast = useToast();
  const { locateByBarcode, locateBySkuId } = useLocateSku();

  const skuOptions = useMemo(() => getRoomSkuOptions(tree), [tree]);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SkuLocationsResponse | null>(null);
  const [scanning, setScanning] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? skuOptions.filter(
        (option) =>
          option.sku.skuCode.toLowerCase().includes(normalized) ||
          option.sku.name.toLowerCase().includes(normalized)
      )
    : skuOptions;

  const runLookup = async (key: string, lookup: () => Promise<SkuLocationsResponse>) => {
    setPendingKey(key);
    try {
      const found = await lookup();
      setResult(found);
      setQuery(found.sku.skuCode);
      setScanning(false);
    } catch (error) {
      toast.error(resolveInventoryError(error, currentLocale).message);
    } finally {
      setPendingKey(null);
    }
  };

  const renderLocation = (location: SkuLocationItem, index: number) => {
    if (!result) return null;
    const inUnit = location.storageUnit?.id === tree.storageUnit.id;
    const unitNumber = location.storageUnit?.unitNumber;
    // Only the tree response carries the facility code, so other units fall back to it when BE adds it
    const facilityCode = location.facility?.code ?? (inUnit ? tree.facility?.code : null);
    const title = location.rackTier
      ? buildLocationLabel({
          facilityCode,
          unitNumber,
          rackCode: location.storageRack?.rackCode,
          tierCode: location.rackTier.tierCode,
        })
      : buildFloorLabel(facilityCode, unitNumber);
    const position = location.rackTier
      ? t("rackMap.position.tierOfRack", {
          tier: location.rackTier.tierNumber,
          rack: location.storageRack?.rackCode ?? "",
        })
      : t("rackMap.position.floorHint");
    const place = inUnit ? "" : ` · ${location.facility?.name ?? t("rackMap.locate.otherUnit")}`;
    const status = location.rackTier
      ? getTierDisplayStatus(location.rackTier.status, location.quantity)
      : null;

    const content = (
      <>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-light dark:bg-brand/20">
          <MapPin size={18} color="#0B927E" />
        </View>
        <View className="flex-1">
          <Text className="font-mono text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {title}
          </Text>
          <Text variant="muted" numberOfLines={1} className="mt-0.5 text-[11px]">
            {`${position} · ${location.quantity} ${result.sku.uom}${place}`}
          </Text>
        </View>
        {status ? <TierStatusBadge status={status} /> : null}
        {inUnit ? <ChevronRight size={16} color="#647B80" /> : null}
      </>
    );

    const className = `flex-row items-center gap-3 px-3.5 py-3 ${
      index > 0 ? "border-t border-neutral-border dark:border-neutral-800" : ""
    }`;

    return inUnit ? (
      <Pressable
        key={location.inventoryId}
        onPress={() => onLocated(result, location.rackTier?.id ?? null)}
        className={`${className} active:bg-neutral-50 dark:active:bg-neutral-800`}
      >
        {content}
      </Pressable>
    ) : (
      <View key={location.inventoryId} className={className}>
        {content}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView edges={["top"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
        <View className="flex-row items-center gap-3 px-4 py-3">
          <Pressable onPress={onClose} hitSlop={10} className="p-1 active:opacity-70">
            <ArrowLeft size={22} color="#0B927E" />
          </Pressable>
          <Text className="text-lg font-bold text-neutral-dark dark:text-neutral-100">
            {t("rackMap.locate.title")}
          </Text>
        </View>

        <View className="px-4 pb-3">
          <View className="h-12 flex-row items-center gap-2 rounded-2xl border border-neutral-border bg-white px-3.5 dark:border-neutral-700 dark:bg-neutral-900">
            <Search size={17} color="#94A3B8" />
            <TextInput
              value={query}
              onChangeText={(value) => {
                setQuery(value);
                setResult(null);
              }}
              placeholder={t("rackMap.locate.searchPlaceholder")}
              placeholderTextColor="#94A3B8"
              className="flex-1 py-0 text-sm text-neutral-dark dark:text-neutral-100"
            />
            {query ? (
              <Pressable
                onPress={() => {
                  setQuery("");
                  setResult(null);
                }}
                hitSlop={8}
              >
                <CircleX size={18} color="#94A3B8" />
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView contentContainerClassName="gap-3 px-4 pb-6" keyboardShouldPersistTaps="handled">
          {scanning ? (
            <BarcodeScannerView
              busy={pendingKey !== null}
              onScanned={(barcode) =>
                runLookup(`barcode:${barcode}`, () => locateByBarcode(barcode))
              }
              onClose={() => setScanning(false)}
            />
          ) : null}

          {result ? (
            <>
              <Pressable
                onPress={() => onLocated(result)}
                className="flex-row items-center gap-3 rounded-2xl border border-neutral-border bg-white p-3.5 active:opacity-80 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <SkuThumb imageUrl={result.sku.imageUrl} size="md" />
                <View className="flex-1">
                  <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
                    {result.sku.skuCode}
                  </Text>
                  <Text numberOfLines={1} variant="muted" className="text-xs">
                    {result.sku.name}
                  </Text>
                  <Text className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                    {t("rackMap.locate.total", {
                      qty: result.sku.totalQuantity,
                      uom: result.sku.uom,
                    })}
                  </Text>
                </View>
                <ChevronRight size={16} color="#647B80" />
              </Pressable>

              <Text className="mt-1 text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {t("rackMap.locate.found", { count: result.locations.length })}
              </Text>

              {result.locations.length === 0 ? (
                <View className="items-center rounded-2xl border border-dashed border-neutral-border p-5 dark:border-neutral-700">
                  <Package size={24} color="#647B80" />
                  <Text variant="muted" className="mt-1.5 text-center text-xs">
                    {t("rackMap.locate.resultNone", { sku: result.sku.skuCode })}
                  </Text>
                </View>
              ) : (
                <View className="overflow-hidden rounded-2xl border border-neutral-border bg-white dark:border-neutral-800 dark:bg-neutral-900">
                  {result.locations.map(renderLocation)}
                </View>
              )}
            </>
          ) : filtered.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-neutral-border p-5 dark:border-neutral-700">
              <Package size={24} color="#647B80" />
              <Text variant="muted" className="mt-1.5 text-center text-xs">
                {normalized ? t("rackMap.form.noSkuMatch") : t("rackMap.locate.pickEmpty")}
              </Text>
            </View>
          ) : (
            <>
              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {t("rackMap.locate.skuListTitle")}
              </Text>
              <View className="overflow-hidden rounded-2xl border border-neutral-border bg-white dark:border-neutral-800 dark:bg-neutral-900">
                {filtered.map((option, index) => {
                  const key = `sku:${option.sku.id}`;
                  return (
                    <Pressable
                      key={option.sku.id}
                      disabled={pendingKey !== null}
                      onPress={() => runLookup(key, () => locateBySkuId(option.sku.id))}
                      className={`flex-row items-center gap-3 px-3.5 py-3 active:bg-neutral-50 dark:active:bg-neutral-800 ${
                        index > 0 ? "border-t border-neutral-border dark:border-neutral-800" : ""
                      }`}
                    >
                      <SkuThumb imageUrl={option.sku.imageUrl} size="sm" />
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                          {option.sku.skuCode}
                        </Text>
                        <Text numberOfLines={1} variant="muted" className="text-xs">
                          {option.sku.name}
                        </Text>
                      </View>
                      {pendingKey === key ? (
                        <ActivityIndicator size="small" color="#0B927E" />
                      ) : (
                        <Text className="text-xs font-bold text-brand">
                          {option.totalQuantity} {option.sku.uom}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>

        {!scanning ? (
          <View className="px-4 pb-6 pt-2">
            <Pressable
              onPress={() => setScanning(true)}
              className="h-12 flex-row items-center justify-center gap-2 rounded-2xl bg-brand-light active:opacity-80 dark:bg-brand/20"
            >
              <ScanBarcode size={18} color="#0B927E" />
              <Text className="text-sm font-bold text-brand">{t("rackMap.locate.scan")}</Text>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}
