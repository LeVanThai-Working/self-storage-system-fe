import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "@/stores/language.store";
import { DetailHeader } from "@/components/layout/DetailHeader";
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
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {/* Header */}
      <DetailHeader
        title={isEn ? "Create Storage Reservation" : "Tạo đơn đặt chỗ kho"}
        onBack={handleBack}
      />

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
