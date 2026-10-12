import React, { useState } from "react";
import { Modal, View, ScrollView, Pressable, TextInput } from "react-native";
import {
  X,
  MapPin,
  Sparkles,
  Check,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react-native";
import type { AmenityResponse } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import type { FacilitySortBy, SortOrder } from "../hooks/useStorageExplore";
import { getAmenityTypeLabel } from "../utils/storageFormat";

interface FacilityFilterModalProps {
  visible: boolean;
  onClose: () => void;
  city: string;
  selectedAmenityIds: string[];
  matchAll: boolean;
  sortBy: FacilitySortBy;
  sortOrder: SortOrder;
  amenities: AmenityResponse[];
  isAmenitiesLoading: boolean;
  suggestedCities: string[];
  onApply: (next: {
    city: string;
    selectedAmenityIds: string[];
    matchAll: boolean;
    sortBy: FacilitySortBy;
    sortOrder: SortOrder;
  }) => void;
  onReset: () => void;
}

const DEFAULT_CITIES = ["Hà Nội", "Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ"];

export function FacilityFilterModal({
  visible,
  onClose,
  city,
  selectedAmenityIds,
  matchAll,
  sortBy,
  sortOrder,
  amenities,
  isAmenitiesLoading,
  suggestedCities,
  onApply,
  onReset,
}: FacilityFilterModalProps) {
  const { t } = useTranslation();

  const [draftCity, setDraftCity] = useState<string>(city);
  const [draftAmenityIds, setDraftAmenityIds] = useState<string[]>(selectedAmenityIds);
  const [draftMatchAll, setDraftMatchAll] = useState<boolean>(matchAll);
  const [draftSortBy, setDraftSortBy] = useState<FacilitySortBy>(sortBy);
  const [draftSortOrder, setDraftSortOrder] = useState<SortOrder>(sortOrder);

  const toggleAmenity = (id: string) => {
    setDraftAmenityIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleResetLocal = () => {
    setDraftCity("");
    setDraftAmenityIds([]);
    setDraftMatchAll(false);
    setDraftSortBy("createdAt");
    setDraftSortOrder("desc");
    onReset();
    onClose();
  };

  const handleApplyPress = () => {
    onApply({
      city: draftCity.trim(),
      selectedAmenityIds: draftAmenityIds,
      matchAll: draftMatchAll,
      sortBy: draftSortBy,
      sortOrder: draftSortOrder,
    });
    onClose();
  };

  const citySuggestions = Array.from(new Set([...suggestedCities, ...DEFAULT_CITIES])).slice(0, 8);

  const sortOptions: { value: FacilitySortBy; label: string }[] = [
    { value: "createdAt", label: t("storageExplore.sortByCreatedAt") },
    { value: "name", label: t("storageExplore.sortByName") },
    { value: "city", label: t("storageExplore.sortByCity") },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        {/* Backdrop area: tap outside bottom sheet to close */}
        <Pressable className="flex-1" onPress={onClose} />

        {/* Bottom Sheet Content */}
        <View className="max-h-[88%] w-full rounded-t-3xl border-t border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 px-5 pb-8 pt-5">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between border-b border-neutral-border dark:border-neutral-800 pb-4">
            <View className="flex-row items-center gap-2">
              <SlidersHorizontal size={18} color="#0B927E" />
              <Text variant="title" className="font-bold text-neutral-dark dark:text-neutral-100">
                {t("storageExplore.filterButton")}
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} className="rounded-full p-1.5">
              <X size={20} color="#647B80" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="py-4 gap-5"
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. City Filter */}
            <View className="gap-2.5">
              <View className="flex-row items-center gap-1.5">
                <MapPin size={15} color="#0B927E" />
                <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {t("storageExplore.cityLabel")}
                </Text>
              </View>

              <View className="flex-row items-center rounded-xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 px-3.5 py-2">
                <TextInput
                  value={draftCity}
                  onChangeText={setDraftCity}
                  placeholder={t("storageExplore.cityPlaceholder")}
                  placeholderTextColor="#8C9E9E"
                  className="flex-1 text-sm text-neutral-dark dark:text-neutral-100"
                />
                {draftCity.length > 0 && (
                  <Pressable onPress={() => setDraftCity("")} hitSlop={8}>
                    <X size={16} color="#647B80" />
                  </Pressable>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                <Pressable
                  onPress={() => setDraftCity("")}
                  className={`rounded-full px-3 py-1.5 border ${
                    draftCity === ""
                      ? "border-brand bg-brand-light dark:bg-brand-dark"
                      : "border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-800"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      draftCity === ""
                        ? "text-brand dark:text-white"
                        : "text-neutral-main dark:text-neutral-300"
                    }`}
                  >
                    {t("storageExplore.allCities")}
                  </Text>
                </Pressable>
                {citySuggestions.map((cityItem) => {
                  const isSelected = draftCity.toLowerCase() === cityItem.toLowerCase();
                  return (
                    <Pressable
                      key={cityItem}
                      onPress={() => setDraftCity(isSelected ? "" : cityItem)}
                      className={`rounded-full px-3 py-1.5 border ${
                        isSelected
                          ? "border-brand bg-brand-light dark:bg-brand-dark"
                          : "border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected
                            ? "text-brand dark:text-white"
                            : "text-neutral-main dark:text-neutral-300"
                        }`}
                      >
                        {cityItem}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. Amenities Filter & matchAll Mode */}
            <View className="gap-2.5 border-t border-neutral-border dark:border-neutral-800 pt-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Sparkles size={15} color="#0B927E" />
                  <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    {t("storageExplore.amenitiesFilterTitle")}
                  </Text>
                </View>
                {draftAmenityIds.length > 0 ? (
                  <View
                    key="amenity-count-badge"
                    className="rounded-full border border-brand bg-brand-light dark:bg-brand-dark px-2.5 py-0.5"
                  >
                    <Text className="text-xs font-bold text-brand dark:text-white">
                      {draftAmenityIds.length}
                    </Text>
                  </View>
                ) : null}
              </View>

              {isAmenitiesLoading ? (
                <View key="amenities-loading" className="gap-2">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </View>
              ) : amenities.length === 0 ? (
                <View
                  key="amenities-empty"
                  className="items-center justify-center rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 p-5"
                >
                  <Sparkles size={22} color="#647B80" />
                  <Text variant="muted" className="mt-2 text-center text-xs">
                    {t("storageExplore.amenitiesEmpty")}
                  </Text>
                </View>
              ) : (
                <View key="amenities-list" className="flex-row flex-wrap gap-2">
                  {amenities.map((amenity) => {
                    const isSelected = draftAmenityIds.includes(amenity.id);
                    return (
                      <Pressable
                        key={amenity.id}
                        onPress={() => toggleAmenity(amenity.id)}
                        className={`flex-row items-center gap-1.5 rounded-xl border px-3 py-2 ${
                          isSelected
                            ? "border-brand bg-brand-light dark:bg-brand-dark"
                            : "border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                        }`}
                      >
                        <View className="flex-row items-center gap-1.5">
                          {isSelected ? <Check size={13} color="#0B927E" /> : null}
                          <Text
                            className={`text-xs font-semibold ${
                              isSelected
                                ? "text-brand dark:text-white"
                                : "text-neutral-dark dark:text-neutral-200"
                            }`}
                          >
                            {amenity.name}
                          </Text>
                          <Text className="text-[10px] text-neutral-400 dark:text-neutral-500">
                            • {getAmenityTypeLabel(amenity.type, t)}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* MatchAll Toggle */}
              {draftAmenityIds.length > 0 ? (
                <View
                  key="match-all-toggle"
                  className="mt-2 rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 p-3 gap-2"
                >
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                    {t("storageExplore.matchAllLabel")}
                  </Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => setDraftMatchAll(false)}
                      className={`flex-1 rounded-xl border p-2.5 items-center ${
                        !draftMatchAll
                          ? "border-brand bg-brand"
                          : "border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold text-center ${
                          !draftMatchAll ? "text-white" : "text-neutral-main dark:text-neutral-300"
                        }`}
                      >
                        {t("storageExplore.matchAllFalse")}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setDraftMatchAll(true)}
                      className={`flex-1 rounded-xl border p-2.5 items-center ${
                        draftMatchAll
                          ? "border-brand bg-brand"
                          : "border-neutral-border dark:border-neutral-700 bg-white dark:bg-neutral-900"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold text-center ${
                          draftMatchAll ? "text-white" : "text-neutral-main dark:text-neutral-300"
                        }`}
                      >
                        {t("storageExplore.matchAllTrue")}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
            </View>

            {/* 3. Sort By & Sort Order */}
            <View className="gap-2.5 border-t border-neutral-border dark:border-neutral-800 pt-4">
              <View className="flex-row items-center gap-1.5">
                <ArrowUpDown size={15} color="#0B927E" />
                <Text className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  {t("storageExplore.sortByLabel")}
                </Text>
              </View>

              <View className="flex-row gap-2">
                {sortOptions.map((opt) => {
                  const isSelected = draftSortBy === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setDraftSortBy(opt.value)}
                      className={`flex-1 items-center justify-center rounded-xl border py-2.5 px-2 ${
                        isSelected
                          ? "border-brand bg-brand-light dark:bg-brand-dark"
                          : "border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold text-center ${
                          isSelected
                            ? "text-brand dark:text-white"
                            : "text-neutral-dark dark:text-neutral-300"
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text className="mt-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                {t("storageExplore.sortOrderLabel")}
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setDraftSortOrder("desc")}
                  className={`flex-1 items-center justify-center rounded-xl border py-2.5 px-2 ${
                    draftSortOrder === "desc"
                      ? "border-brand bg-brand-light dark:bg-brand-dark"
                      : "border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      draftSortOrder === "desc"
                        ? "text-brand dark:text-white"
                        : "text-neutral-dark dark:text-neutral-300"
                    }`}
                  >
                    {t("storageExplore.sortOrderDesc")}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setDraftSortOrder("asc")}
                  className={`flex-1 items-center justify-center rounded-xl border py-2.5 px-2 ${
                    draftSortOrder === "asc"
                      ? "border-brand bg-brand-light dark:bg-brand-dark"
                      : "border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      draftSortOrder === "asc"
                        ? "text-brand dark:text-white"
                        : "text-neutral-dark dark:text-neutral-300"
                    }`}
                  >
                    {t("storageExplore.sortOrderAsc")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="flex-row gap-3 border-t border-neutral-border dark:border-neutral-800 pt-4">
            <Pressable
              onPress={handleResetLocal}
              className="flex-row items-center justify-center gap-1.5 rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-3.5"
            >
              <RotateCcw size={15} color="#647B80" />
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-200">
                {t("storageExplore.resetFilters")}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleApplyPress}
              className="flex-1 items-center justify-center rounded-xl bg-brand py-3.5"
            >
              <Text className="text-sm font-bold text-white">
                {t("storageExplore.applyFilters")}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
