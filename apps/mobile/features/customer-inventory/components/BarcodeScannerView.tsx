import React, { useRef } from "react";
import { View, Pressable, ActivityIndicator, Linking } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { Camera, X } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";

const BARCODE_TYPES = [
  "ean13",
  "ean8",
  "upc_a",
  "upc_e",
  "code128",
  "code39",
  "code93",
  "itf14",
  "codabar",
  "qr",
] as const;

/** The camera reports the same code many times per second; ignore repeats inside this window. */
const SAME_CODE_COOLDOWN_MS = 2500;

interface BarcodeScannerViewProps {
  /** Called with the decoded barcode text (repeats of the same code are debounced). */
  onScanned: (barcode: string) => void;
  onClose: () => void;
  /** While true the camera stays open but ignores further codes (e.g. lookup in progress). */
  busy?: boolean;
}

/** Inline camera barcode scanner (rendered inside an existing sheet, not as its own modal). */
export function BarcodeScannerView({ onScanned, onClose, busy = false }: BarcodeScannerViewProps) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  const handleScanned = (result: BarcodeScanningResult) => {
    const code = result.data?.trim();
    if (busy || !code) return;
    const now = Date.now();
    const last = lastScanRef.current;
    if (last && last.code === code && now - last.at < SAME_CODE_COOLDOWN_MS) return;
    lastScanRef.current = { code, at: now };
    onScanned(code);
  };

  const renderPermission = () => {
    if (!permission) {
      return (
        <View className="h-56 items-center justify-center">
          <ActivityIndicator color="#0B927E" />
        </View>
      );
    }

    return (
      <View className="items-center gap-2 p-5">
        <Camera size={28} color="#647B80" />
        <Text className="text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
          {t("rackMap.scanner.permissionTitle")}
        </Text>
        <Text variant="muted" className="text-center text-xs leading-4">
          {permission.canAskAgain
            ? t("rackMap.scanner.permissionDesc")
            : t("rackMap.scanner.permissionDenied")}
        </Text>
        <Pressable
          onPress={() => (permission.canAskAgain ? requestPermission() : Linking.openSettings())}
          className="mt-1 rounded-xl bg-brand px-5 py-2.5"
        >
          <Text className="text-xs font-bold text-white">
            {permission.canAskAgain
              ? t("rackMap.scanner.grant")
              : t("rackMap.scanner.openSettings")}
          </Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View className="overflow-hidden rounded-2xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
      {permission?.granted ? (
        <View className="h-56">
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
            onBarcodeScanned={handleScanned}
          />
          <View
            pointerEvents="none"
            className="absolute inset-x-8 top-1/2 -mt-12 h-24 rounded-xl border-2 border-cta"
          />
          {busy ? (
            <View className="absolute inset-0 items-center justify-center bg-black/40">
              <ActivityIndicator color="#FFFFFF" />
            </View>
          ) : null}
        </View>
      ) : (
        renderPermission()
      )}

      <View className="flex-row items-center justify-between px-3.5 py-2.5">
        <Text variant="muted" className="flex-1 text-[11px]">
          {t("rackMap.scanner.hint")}
        </Text>
        <Pressable onPress={onClose} className="flex-row items-center gap-1 px-1 py-0.5">
          <X size={14} color="#647B80" />
          <Text className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
            {t("rackMap.scanner.close")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
