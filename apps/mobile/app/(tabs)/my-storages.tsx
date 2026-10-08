import React, { useState } from "react";
import { View, ScrollView, Pressable, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import {
  Package,
  QrCode,
  KeyRound,
  RefreshCw,
  Thermometer,
  Droplets,
  Video,
  X,
  Lock,
} from "lucide-react-native";

interface ActiveStorageUnit {
  id: string;
  code: string;
  facility: string;
  floor: string;
  dimensions: string;
  pin: string;
  remainingDays: number;
  expiryDate: string;
}

export default function MyStoragesScreen() {
  const { t } = useTranslation();
  const toast = useToast();

  const [hasCheckinPending, setHasCheckinPending] = useState(true);
  const [openingUnitId, setOpeningUnitId] = useState<string | null>(null);
  const [pinModalUnit, setPinModalUnit] = useState<ActiveStorageUnit | null>(null);

  const [activeUnits, setActiveUnits] = useState<ActiveStorageUnit[]>([
    {
      id: "unit-active-1",
      code: "SHUB-HN-A102",
      facility: "StorageHub Cầu Giấy",
      floor: "Tầng 1 - Dãy A",
      dimensions: "2.0m x 2.5m x 2.8m (5.0 m²)",
      pin: "849201",
      remainingDays: 42,
      expiryDate: "15/11/2026",
    },
  ]);

  // Handle self check-in confirmation
  const handlePerformCheckin = () => {
    const newUnit: ActiveStorageUnit = {
      id: "unit-active-2",
      code: "SHUB-HN-A108",
      facility: "StorageHub Cầu Giấy",
      floor: "Tầng 1 - Dãy A",
      dimensions: "1.5m x 2.0m x 2.5m (3.0 m²)",
      pin: "419823",
      remainingDays: 90,
      expiryDate: "04/01/2027",
    };

    setHasCheckinPending(false);
    setActiveUnits((prev) => [newUnit, ...prev]);
    toast.success(t("myStorages.checkinSuccess", { code: "SHUB-HN-A108" }));
  };

  // Simulate IoT Smart Lock unlock signal
  const handleUnlockSmartLock = (unit: ActiveStorageUnit) => {
    setOpeningUnitId(unit.id);
    setTimeout(() => {
      setOpeningUnitId(null);
      toast.success(t("myStorages.lockOpenedSuccess", { code: unit.code }));
    }, 1200);
  };

  // Handle contract renewal request
  const handleExtendLease = (unit: ActiveStorageUnit) => {
    toast.info(t("myStorages.extendSuccess", { code: unit.code }));
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <ScrollView contentContainerClassName="p-4 pb-14">
        {/* Header Introduction */}
        <View className="mb-4">
          <Text variant="heading2" className="text-neutral-dark dark:text-neutral-100 font-bold">
            {t("customerTabs.myUnitsTitle")}
          </Text>
          <Text variant="muted" className="mt-1 text-sm">
            {t("customerTabs.myUnitsDesc")}
          </Text>
        </View>

        {/* 1. Self Check-in Banner Alert */}
        {hasCheckinPending && (
          <View className="mb-5 rounded-3xl border border-cta/30 bg-cta-light/20 dark:bg-cta/15 p-5 shadow-sm">
            <View className="flex-row items-center gap-2 mb-2">
              <QrCode size={20} color="#FF702E" />
              <Text className="text-sm font-bold text-cta">
                {t("myStorages.checkinAlertTitle")}
              </Text>
            </View>

            <Text className="text-xs text-neutral-main dark:text-neutral-300 mb-3.5 leading-5">
              {t("myStorages.checkinAlertSubtitle", {
                code: "SHUB-HN-A108",
                facility: "StorageHub Cầu Giấy",
              })}
            </Text>

            <Pressable
              onPress={handlePerformCheckin}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-cta py-3 shadow-sm active:opacity-90"
            >
              <QrCode size={16} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">{t("myStorages.checkinButton")}</Text>
            </Pressable>
          </View>
        )}

        {/* 2. Active Storage Units List */}
        <View className="gap-4">
          <Text variant="title" className="font-bold text-neutral-dark dark:text-neutral-100">
            {t("myStorages.activeListTitle")}
          </Text>

          {activeUnits.map((unit) => {
            const isUnlocking = openingUnitId === unit.id;
            return (
              <View
                key={unit.id}
                className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm"
              >
                {/* Header Row */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center gap-2.5">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-light dark:bg-brand/20">
                      <Package size={20} color="#0B927E" />
                    </View>
                    <View>
                      <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
                        #{unit.code}
                      </Text>
                      <Text variant="muted" className="text-xs">
                        {unit.facility} • {unit.floor}
                      </Text>
                    </View>
                  </View>

                  <Badge variant="outline" className="border-brand/40 bg-brand-light/30">
                    <Text className="text-xs font-semibold text-brand">
                      {t("myStorages.statusActive")}
                    </Text>
                  </Badge>
                </View>

                {/* Telemetry Sensor Badges */}
                <View className="flex-row flex-wrap items-center gap-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/80 p-3 mb-4">
                  <View className="flex-row items-center gap-1">
                    <Thermometer size={13} color="#0B927E" />
                    <Text className="text-xs text-neutral-dark dark:text-neutral-300">
                      {t("myStorages.temp")}
                    </Text>
                  </View>
                  <Text className="text-xs text-neutral-300 dark:text-neutral-700">•</Text>
                  <View className="flex-row items-center gap-1">
                    <Droplets size={13} color="#0B927E" />
                    <Text className="text-xs text-neutral-dark dark:text-neutral-300">
                      {t("myStorages.humidity")}
                    </Text>
                  </View>
                  <Text className="text-xs text-neutral-300 dark:text-neutral-700">•</Text>
                  <View className="flex-row items-center gap-1">
                    <Video size={13} color="#0B927E" />
                    <Text className="text-xs text-neutral-dark dark:text-neutral-300">
                      {t("myStorages.security")}
                    </Text>
                  </View>
                </View>

                {/* Lease Period */}
                <View className="mb-4">
                  <Text variant="muted" className="text-xs">
                    {t("myStorages.remainingDays", {
                      days: unit.remainingDays,
                      date: unit.expiryDate,
                    })}
                  </Text>
                </View>

                {/* Smart Lock Unlock CTA */}
                <Pressable
                  onPress={() => handleUnlockSmartLock(unit)}
                  disabled={isUnlocking}
                  className="mb-2.5 flex-row items-center justify-center gap-2 rounded-xl bg-brand py-3.5 shadow-sm active:opacity-90"
                >
                  {isUnlocking ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white">
                        {t("myStorages.openingLock")}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Lock size={16} color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white">
                        {t("myStorages.openLock")}
                      </Text>
                    </>
                  )}
                </Pressable>

                {/* Bottom Secondary Actions */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => setPinModalUnit(unit)}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 py-2.5"
                  >
                    <KeyRound size={14} color="#647B80" />
                    <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                      {t("myStorages.viewPin")}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleExtendLease(unit)}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 py-2.5"
                  >
                    <RefreshCw size={14} color="#647B80" />
                    <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                      {t("myStorages.extendContract")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Access PIN Modal */}
      {pinModalUnit && (
        <Modal
          visible={!!pinModalUnit}
          transparent
          animationType="fade"
          onRequestClose={() => setPinModalUnit(null)}
        >
          <View className="flex-1 items-center justify-center bg-black/60 p-6">
            <View className="w-full max-w-sm rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-2xl">
              <View className="flex-row items-center justify-between pb-3 border-b border-neutral-border dark:border-neutral-800">
                <Text variant="title" className="font-bold text-neutral-dark dark:text-neutral-100">
                  {t("myStorages.pinModalTitle")}
                </Text>
                <Pressable
                  onPress={() => setPinModalUnit(null)}
                  hitSlop={8}
                  className="rounded-full p-1"
                >
                  <X size={18} color="#647B80" />
                </Pressable>
              </View>

              <Text variant="muted" className="text-xs mt-3 leading-5">
                {t("myStorages.pinModalDesc")}
              </Text>

              {/* High-visibility PIN display */}
              <View className="my-5 items-center justify-center rounded-2xl bg-brand-light dark:bg-brand/20 p-5">
                <Text className="text-3xl font-extrabold tracking-widest text-brand">
                  {pinModalUnit.pin}
                </Text>
                <Text variant="muted" className="text-xs mt-1">
                  #{pinModalUnit.code}
                </Text>
              </View>

              <Pressable
                onPress={() => setPinModalUnit(null)}
                className="items-center justify-center rounded-xl bg-neutral-900 dark:bg-neutral-100 py-3"
              >
                <Text className="text-xs font-bold text-white dark:text-neutral-900">
                  {t("common.close")}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
