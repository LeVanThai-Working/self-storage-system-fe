import React from "react";
import { View, Pressable, Image } from "react-native";
import { MapPin, Clock, Phone, Mail, ArrowRight } from "lucide-react-native";
import type { FacilityResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";

interface FacilityCardProps {
  facility: FacilityResponse & {
    imageUrl?: string | null;
    images?: string[] | null;
  };
  onPress: (facility: FacilityResponse) => void;
}

export function FacilityCard({ facility, onPress }: FacilityCardProps) {
  const { t } = useTranslation();

  const operatingHoursText = facility.operatingHours
    ? `${facility.operatingHours.open} - ${facility.operatingHours.close}`
    : t("storageExplore.contactForHours");

  const imageUri = facility.imageUrl || facility.images?.[0] || null;

  return (
    <Pressable
      onPress={() => onPress(facility)}
      className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-sm active:opacity-95"
    >
      {/* 1. Ảnh cơ sở (Để trống khung ảnh nếu chưa có ảnh) */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          className="mb-3.5 h-40 w-full rounded-2xl bg-neutral-100 dark:bg-neutral-800"
          resizeMode="cover"
        />
      ) : (
        <View className="mb-3.5 h-40 w-full rounded-2xl bg-neutral-100 dark:bg-neutral-800/70" />
      )}

      {/* 2. Tên cơ sở (Không dùng icon location ở phần tên cơ sở) */}
      <Text className="mb-2.5 text-lg font-bold text-neutral-dark dark:text-neutral-100">
        {facility.name}
      </Text>

      {/* 3. Cụm thông tin cơ sở */}
      <View className="mb-4 gap-2 rounded-2xl bg-neutral-50 dark:bg-neutral-800/70 p-3.5 border border-neutral-border/50 dark:border-neutral-800">
        {/* Địa chỉ & Thành phố */}
        <View className="flex-row items-start gap-2">
          <MapPin size={14} color="#647B80" />
          <Text className="flex-1 text-xs text-neutral-dark dark:text-neutral-200 leading-4">
            {facility.address}, {facility.city}
          </Text>
        </View>

        {/* Giờ hoạt động */}
        <View className="flex-row items-center gap-2">
          <Clock size={14} color="#0B927E" />
          <Text className="text-xs font-medium text-neutral-main dark:text-neutral-300">
            {t("storageExplore.operatingHours", { hours: operatingHoursText })}
          </Text>
        </View>

        {/* Điện thoại & Email */}
        {(facility.phone || facility.email) && (
          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 border-t border-neutral-border/60 dark:border-neutral-700/60">
            {facility.phone ? (
              <View className="flex-row items-center gap-1.5">
                <Phone size={13} color="#647B80" />
                <Text className="text-xs text-neutral-main dark:text-neutral-300">
                  {facility.phone}
                </Text>
              </View>
            ) : null}

            {facility.email ? (
              <View className="flex-row items-center gap-1.5">
                <Mail size={13} color="#647B80" />
                <Text className="text-xs text-neutral-main dark:text-neutral-300">
                  {facility.email}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* 4. Nút View Details (Màu nút CTA) */}
      <Pressable
        onPress={() => onPress(facility)}
        className="w-full flex-row items-center justify-center gap-1.5 rounded-xl bg-cta py-3 shadow-sm active:opacity-90"
      >
        <Text className="text-xs font-bold text-white">{t("storageExplore.viewDetail")}</Text>
        <ArrowRight size={14} color="#FFFFFF" />
      </Pressable>
    </Pressable>
  );
}
