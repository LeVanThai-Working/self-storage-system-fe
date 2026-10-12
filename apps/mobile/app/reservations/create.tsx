import React from "react";
import { View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { ArrowLeft } from "lucide-react-native";
import { CreateReservationView } from "@/features/reservations/components/CreateReservationView";

export default function CreateReservationScreen() {
  const router = useRouter();
  const { locale } = useTranslation();
  const isEn = locale === "en";

  const params = useLocalSearchParams<{
    facilityId?: string;
    facilityUnitTypeOfferingId?: string;
    unitTypeId?: string;
  }>();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/reservations" as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {/* Header with borderless ArrowLeft back button */}
      <View className="flex-row items-center gap-3 px-4 py-3 bg-white dark:bg-neutral-900 border-b border-neutral-border dark:border-neutral-800">
        <Pressable onPress={handleBack} hitSlop={10} className="p-1 active:opacity-70">
          <ArrowLeft size={22} color="#0F172A" />
        </Pressable>
        <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100">
          {isEn ? "Create Storage Reservation" : "Tạo đơn đặt chỗ kho"}
        </Text>
      </View>

      <CreateReservationView
        initialFacilityId={params.facilityId}
        initialOfferingId={params.facilityUnitTypeOfferingId}
        initialUnitTypeId={params.unitTypeId}
        onSuccessNavigate={(reservationId) => {
          router.replace({
            pathname: "/reservations/[id]" as any,
            params: { id: reservationId },
          });
        }}
      />
    </SafeAreaView>
  );
}
