import React, { useMemo, useState } from "react";
import { Modal, View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { ListChecks, Package, ScanBarcode, X } from "lucide-react-native";
import type {
  MessageLocale,
  SkuLocationsResponse,
  StorageUnitInventoryTreeResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useLocateSku } from "../hooks/useCustomerInventory";
import { getRoomSkuOptions, resolveInventoryError } from "../utils/rackMapFormat";
import { BarcodeScannerView } from "./BarcodeScannerView";

type LocateMode = "scan" | "pick";

interface LocateSheetProps {
  visible: boolean;
  onClose: () => void;
  tree: StorageUnitInventoryTreeResponse;
  onLocated: (result: SkuLocationsResponse) => void;
}

export function LocateSheet({ visible, onClose, tree, onLocated }: LocateSheetProps) {
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const toast = useToast();
  const { locateByBarcode, locateBySkuId } = useLocateSku();

  const skuOptions = useMemo(() => getRoomSkuOptions(tree), [tree]);
  const [mode, setMode] = useState<LocateMode>("scan");
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const runLookup = async (key: string, lookup: () => Promise<SkuLocationsResponse>) => {
    setPendingKey(key);
    try {
      const result = await lookup();
      onLocated(result);
    } catch (error) {
      toast.error(resolveInventoryError(error, currentLocale).message);
    } finally {
      setPendingKey(null);
    }
  };

  const modes: { key: LocateMode; labelKey: string; icon: (active: boolean) => React.ReactNode }[] =
    [
      {
        key: "scan",
        labelKey: "rackMap.locate.scan",
        icon: (active) => <ScanBarcode size={14} color={active ? "#FFFFFF" : "#647B80"} />,
      },
      {
        key: "pick",
        labelKey: "rackMap.locate.pick",
        icon: (active) => <ListChecks size={14} color={active ? "#FFFFFF" : "#647B80"} />,
      },
    ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[88%] rounded-t-3xl bg-white dark:bg-neutral-900 border-t border-neutral-border dark:border-neutral-800">
          <View className="flex-row items-center justify-between border-b border-neutral-border dark:border-neutral-800 px-5 py-4">
            <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
              {t("rackMap.locate.title")}
            </Text>
            <Pressable
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <X size={16} color="#647B80" />
            </Pressable>
          </View>

          <ScrollView contentContainerClassName="p-5 pb-8 gap-4">
            <View className="flex-row rounded-2xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1">
              {modes.map((item) => {
                const active = mode === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setMode(item.key)}
                    className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5 ${
                      active ? "bg-brand" : ""
                    }`}
                  >
                    {item.icon(active)}
                    <Text
                      className={`text-xs font-bold ${
                        active ? "text-white" : "text-neutral-600 dark:text-neutral-300"
                      }`}
                    >
                      {t(item.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {mode === "scan" ? (
              visible ? (
                <BarcodeScannerView
                  busy={pendingKey !== null}
                  onScanned={(barcode) =>
                    runLookup(`barcode:${barcode}`, () => locateByBarcode(barcode))
                  }
                  onClose={() => setMode("pick")}
                />
              ) : null
            ) : skuOptions.length === 0 ? (
              <View className="items-center rounded-2xl border border-dashed border-neutral-border dark:border-neutral-700 p-5">
                <Package size={24} color="#647B80" />
                <Text variant="muted" className="mt-1.5 text-center text-xs">
                  {t("rackMap.locate.pickEmpty")}
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {skuOptions.map((option) => {
                  const key = `sku:${option.sku.id}`;
                  return (
                    <Pressable
                      key={option.sku.id}
                      disabled={pendingKey !== null}
                      onPress={() => runLookup(key, () => locateBySkuId(option.sku.id))}
                      className="flex-row items-center justify-between rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 px-3.5 py-3 active:opacity-80"
                    >
                      <View className="flex-1 pr-3">
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
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
