import React, { useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import {
  CalendarCheck,
  Building2,
  Boxes,
  Clock,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react-native";

interface ReservationRecord {
  id: string;
  code: string;
  unitCode: string;
  facilityName: string;
  moveInDate: string;
  durationMonths: number;
  depositAmount: string;
  monthlyRent: string;
  status: "pending" | "confirmed";
}

export default function ReservationsScreen() {
  const { t } = useTranslation();
  const toast = useToast();

  // Booking Form State
  const [selectedFacility, setSelectedFacility] = useState<"facilityHanoi" | "facilityHcm">(
    "facilityHanoi"
  );
  const [selectedUnitType, setSelectedUnitType] = useState<"mini" | "family" | "business">(
    "family"
  );
  const [selectedDuration, setSelectedDuration] = useState<1 | 3 | 6 | 12>(3);

  // Active User Reservations
  const [reservations, setReservations] = useState<ReservationRecord[]>([
    {
      id: "res-1",
      code: "RES-2026-8812",
      unitCode: "FAM-204",
      facilityName: "StorageHub Cầu Giấy",
      moveInDate: "15/10/2026",
      durationMonths: 3,
      depositAmount: "2.800.000",
      monthlyRent: "2.660.000",
      status: "pending",
    },
  ]);

  // Price calculations based on selection
  const unitPrices = {
    mini: { base: 1200000, code: "MINI-102", nameKey: "explore.miniStorage" },
    family: { base: 2800000, code: "FAM-204", nameKey: "explore.familyStorage" },
    business: { base: 6500000, code: "BIZ-501", nameKey: "explore.businessStorage" },
  };

  const discountRates = {
    1: 0,
    3: 0.05,
    6: 0.1,
    12: 0.15,
  };

  const selectedBasePrice = unitPrices[selectedUnitType].base;
  const discountRate = discountRates[selectedDuration];
  const discountedMonthlyRent = selectedBasePrice * (1 - discountRate);
  const deposit = selectedBasePrice; // 1 month deposit
  const totalInitial = deposit + discountedMonthlyRent;

  const handleCreateReservation = () => {
    const newReservation: ReservationRecord = {
      id: `res-${Date.now()}`,
      code: `RES-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      unitCode: unitPrices[selectedUnitType].code,
      facilityName:
        selectedFacility === "facilityHanoi" ? "StorageHub Cầu Giấy" : "StorageHub Quận 7",
      moveInDate: "20/10/2026",
      durationMonths: selectedDuration,
      depositAmount: deposit.toLocaleString("vi-VN"),
      monthlyRent: discountedMonthlyRent.toLocaleString("vi-VN"),
      status: "pending",
    };

    setReservations((prev) => [newReservation, ...prev]);
    toast.success(t("reservation.bookingSuccess", { code: newReservation.unitCode }));
  };

  const handleCancelReservation = (id: string, code: string) => {
    setReservations((prev) => prev.filter((item) => item.id !== id));
    toast.info(t("reservation.cancelSuccess", { code }));
  };

  const handleGuidePress = (unitCode: string) => {
    toast.info(`${t("reservation.checkinGuide")}: #${unitCode}`);
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <ScrollView contentContainerClassName="p-4 pb-14">
        {/* Header Introduction */}
        <View className="mb-4">
          <Text variant="heading2" className="text-neutral-dark dark:text-neutral-100 font-bold">
            {t("customerTabs.reservationTitle")}
          </Text>
          <Text variant="muted" className="mt-1 text-sm">
            {t("customerTabs.reservationDesc")}
          </Text>
        </View>

        {/* Booking Form Card */}
        <View className="mb-6 rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <View className="flex-row items-center gap-2 mb-4">
            <CalendarCheck size={20} color="#0B927E" />
            <Text variant="title" className="font-bold text-neutral-dark dark:text-neutral-100">
              {t("reservation.formTitle")}
            </Text>
          </View>

          {/* Step 1: Select Facility */}
          <View className="mb-4">
            <View className="flex-row items-center gap-1.5 mb-2">
              <Building2 size={15} color="#647B80" />
              <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {t("reservation.step1Facility")}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setSelectedFacility("facilityHanoi")}
                className={`flex-1 rounded-xl p-3 border ${
                  selectedFacility === "facilityHanoi"
                    ? "border-brand bg-brand-light dark:bg-brand/20"
                    : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedFacility === "facilityHanoi"
                      ? "text-brand"
                      : "text-neutral-dark dark:text-neutral-200"
                  }`}
                >
                  {t("explore.facilityHanoi")}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedFacility("facilityHcm")}
                className={`flex-1 rounded-xl p-3 border ${
                  selectedFacility === "facilityHcm"
                    ? "border-brand bg-brand-light dark:bg-brand/20"
                    : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedFacility === "facilityHcm"
                      ? "text-brand"
                      : "text-neutral-dark dark:text-neutral-200"
                  }`}
                >
                  {t("explore.facilityHcm")}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Step 2: Select Unit Type */}
          <View className="mb-4">
            <View className="flex-row items-center gap-1.5 mb-2">
              <Boxes size={15} color="#647B80" />
              <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {t("reservation.step2UnitType")}
              </Text>
            </View>
            <View className="gap-2">
              <Pressable
                onPress={() => setSelectedUnitType("mini")}
                className={`flex-row items-center justify-between rounded-xl p-3 border ${
                  selectedUnitType === "mini"
                    ? "border-brand bg-brand-light dark:bg-brand/20"
                    : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                }`}
              >
                <View>
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                    {t("explore.miniStorage")}
                  </Text>
                  <Text variant="muted" className="text-xs">
                    1.5m x 1.5m • 2.25 m²
                  </Text>
                </View>
                <Text className="text-xs font-bold text-brand">1.200.000 đ</Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedUnitType("family")}
                className={`flex-row items-center justify-between rounded-xl p-3 border ${
                  selectedUnitType === "family"
                    ? "border-brand bg-brand-light dark:bg-brand/20"
                    : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                }`}
              >
                <View>
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                    {t("explore.familyStorage")}
                  </Text>
                  <Text variant="muted" className="text-xs">
                    3.0m x 2.5m • 7.5 m²
                  </Text>
                </View>
                <Text className="text-xs font-bold text-brand">2.800.000 đ</Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedUnitType("business")}
                className={`flex-row items-center justify-between rounded-xl p-3 border ${
                  selectedUnitType === "business"
                    ? "border-brand bg-brand-light dark:bg-brand/20"
                    : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                }`}
              >
                <View>
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                    {t("explore.businessStorage")}
                  </Text>
                  <Text variant="muted" className="text-xs">
                    5.0m x 4.0m • 20.0 m²
                  </Text>
                </View>
                <Text className="text-xs font-bold text-brand">6.500.000 đ</Text>
              </Pressable>
            </View>
          </View>

          {/* Step 3: Select Duration */}
          <View className="mb-4">
            <View className="flex-row items-center gap-1.5 mb-2">
              <Clock size={15} color="#647B80" />
              <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                {t("reservation.step3Duration")}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {[1, 3, 6, 12].map((months) => (
                <Pressable
                  key={months}
                  onPress={() => setSelectedDuration(months as any)}
                  className={`flex-1 min-w-[45%] rounded-xl p-2.5 border ${
                    selectedDuration === months
                      ? "border-brand bg-brand-light dark:bg-brand/20"
                      : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/60"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      selectedDuration === months
                        ? "text-brand"
                        : "text-neutral-dark dark:text-neutral-200"
                    }`}
                  >
                    {t(`reservation.duration${months}` as any)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Step 4: Summary Card */}
          <View className="rounded-2xl bg-neutral-100 dark:bg-neutral-800/90 p-4 mb-4">
            <Text className="text-xs font-bold uppercase text-neutral-dark dark:text-neutral-200 mb-2">
              {t("reservation.summaryTitle")}
            </Text>
            <View className="gap-1.5">
              <View className="flex-row justify-between">
                <Text variant="muted" className="text-xs">
                  {t("reservation.depositLabel")}
                </Text>
                <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                  {deposit.toLocaleString("vi-VN")} đ
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text variant="muted" className="text-xs">
                  {t("reservation.monthlyRentLabel")}
                </Text>
                <Text className="text-xs font-semibold text-neutral-dark dark:text-neutral-200">
                  {discountedMonthlyRent.toLocaleString("vi-VN")} đ / tháng
                </Text>
              </View>
              <View className="flex-row justify-between border-t border-neutral-200 dark:border-neutral-700 pt-2 mt-1">
                <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                  {t("reservation.totalInitialDue")}
                </Text>
                <Text className="text-sm font-bold text-brand">
                  {totalInitial.toLocaleString("vi-VN")} đ
                </Text>
              </View>
            </View>
          </View>

          {/* Confirm Button */}
          <Pressable
            onPress={handleCreateReservation}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-cta py-3.5 shadow-sm active:opacity-90"
          >
            <CheckCircle size={18} color="#FFFFFF" />
            <Text className="text-sm font-bold text-white">{t("reservation.confirmButton")}</Text>
          </Pressable>
        </View>

        {/* Active Reservations Section */}
        <View className="gap-3">
          <Text variant="title" className="font-bold text-neutral-dark dark:text-neutral-100">
            {t("reservation.recentReservations")}
          </Text>

          {reservations.map((item) => (
            <View
              key={item.id}
              className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-xs font-semibold text-neutral-400">
                    {t("reservation.code", { code: item.code })}
                  </Text>
                  <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
                    #{item.unitCode} • {item.facilityName}
                  </Text>
                </View>
                <Badge variant="outline" className="border-cta/40 bg-cta-light/30">
                  <Text className="text-xs font-semibold text-cta">
                    {t("reservation.statusPending")}
                  </Text>
                </Badge>
              </View>

              <View className="flex-row justify-between border-t border-b border-neutral-border/60 dark:border-neutral-800/80 py-2.5 mb-3">
                <Text variant="muted" className="text-xs">
                  {t("reservation.startDateLabel")} {item.moveInDate}
                </Text>
                <Text className="text-xs font-semibold text-brand">
                  {item.depositAmount} đ (Deposit)
                </Text>
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => handleGuidePress(item.unitCode)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-brand bg-brand-light dark:bg-brand/20 py-2.5"
                >
                  <Info size={14} color="#0B927E" />
                  <Text className="text-xs font-bold text-brand">
                    {t("reservation.checkinGuide")}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleCancelReservation(item.id, item.code)}
                  className="flex-row items-center justify-center gap-1 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2.5"
                >
                  <XCircle size={14} color="#EF4444" />
                  <Text className="text-xs font-bold text-red-600 dark:text-red-400">
                    {t("reservation.cancel")}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
