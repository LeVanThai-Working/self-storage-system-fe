import React, { useState } from "react";
import { View, ScrollView, TextInput, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useRouter } from "expo-router";
import {
  Search,
  MapPin,
  ShieldCheck,
  KeyRound,
  Wind,
  CheckCircle2,
  Warehouse,
  ArrowRight,
} from "lucide-react-native";

interface StorageUnitItem {
  id: string;
  code: string;
  nameKey: "miniStorage" | "familyStorage" | "businessStorage" | "climateControlled";
  facilityKey: "facilityHanoi" | "facilityHcm";
  dimensions: string;
  price: string;
  availableCount: number;
  features: ("cctv" | "smartLock" | "climate" | "insurance")[];
}

const STORAGE_UNITS: StorageUnitItem[] = [
  {
    id: "unit-1",
    code: "MINI-102",
    nameKey: "miniStorage",
    facilityKey: "facilityHanoi",
    dimensions: "1.5m x 1.5m x 2.4m (2.25 m²)",
    price: "1.200.000",
    availableCount: 4,
    features: ["cctv", "smartLock", "insurance"],
  },
  {
    id: "unit-2",
    code: "FAM-204",
    nameKey: "familyStorage",
    facilityKey: "facilityHanoi",
    dimensions: "3.0m x 2.5m x 2.8m (7.5 m²)",
    price: "2.800.000",
    availableCount: 2,
    features: ["cctv", "smartLock", "climate", "insurance"],
  },
  {
    id: "unit-3",
    code: "CLIM-301",
    nameKey: "climateControlled",
    facilityKey: "facilityHcm",
    dimensions: "2.0m x 2.0m x 2.5m (4.0 m²)",
    price: "2.100.000",
    availableCount: 5,
    features: ["climate", "cctv", "smartLock", "insurance"],
  },
  {
    id: "unit-4",
    code: "BIZ-501",
    nameKey: "businessStorage",
    facilityKey: "facilityHcm",
    dimensions: "5.0m x 4.0m x 3.0m (20.0 m²)",
    price: "6.500.000",
    availableCount: 1,
    features: ["cctv", "smartLock", "insurance"],
  },
];

type CategoryFilter =
  "all" | "miniStorage" | "familyStorage" | "businessStorage" | "climateControlled";

export default function ExploreScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedFacility, setSelectedFacility] = useState<"all" | "facilityHanoi" | "facilityHcm">(
    "all"
  );

  const categories: { id: CategoryFilter; label: string }[] = [
    { id: "all", label: t("explore.all") },
    { id: "miniStorage", label: t("explore.miniStorage") },
    { id: "familyStorage", label: t("explore.familyStorage") },
    { id: "businessStorage", label: t("explore.businessStorage") },
    { id: "climateControlled", label: t("explore.climateControlled") },
  ];

  const filteredUnits = STORAGE_UNITS.filter((unit) => {
    const matchesCategory = selectedCategory === "all" || unit.nameKey === selectedCategory;
    const matchesFacility = selectedFacility === "all" || unit.facilityKey === selectedFacility;
    const matchesSearch =
      searchQuery.trim() === "" ||
      unit.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t(`explore.${unit.nameKey}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
      t(`explore.${unit.facilityKey}`).toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesFacility && matchesSearch;
  });

  const handleBookPress = (unit: StorageUnitItem) => {
    toast.success(t("explore.bookSelectedUnit", { code: unit.code }));
    // Navigate to Reservations tab
    router.push("/reservations" as any);
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <ScrollView contentContainerClassName="p-4 pb-12" keyboardShouldPersistTaps="handled">
        {/* Header Introduction */}
        <View className="mb-4">
          <Text variant="heading2" className="text-neutral-dark dark:text-neutral-100 font-bold">
            {t("customerTabs.exploreTitle")}
          </Text>
          <Text variant="muted" className="mt-1 text-sm">
            {t("customerTabs.exploreDesc")}
          </Text>
        </View>

        {/* Search Bar */}
        <View className="mb-4 flex-row items-center rounded-2xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3.5 py-2.5 shadow-sm">
          <Search size={18} color="#0B927E" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t("explore.searchPlaceholder")}
            placeholderTextColor="#8C9E9E"
            className="ml-2.5 flex-1 text-sm text-neutral-dark dark:text-neutral-100"
          />
        </View>

        {/* Facility Segment Filter */}
        <View className="mb-3 flex-row gap-2">
          <Pressable
            onPress={() => setSelectedFacility("all")}
            className={`rounded-full px-3 py-1.5 border ${
              selectedFacility === "all"
                ? "border-brand bg-brand-light dark:bg-brand/20"
                : "border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedFacility === "all"
                  ? "text-brand"
                  : "text-neutral-main dark:text-neutral-400"
              }`}
            >
              {t("explore.allFacilities")}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedFacility("facilityHanoi")}
            className={`rounded-full px-3 py-1.5 border ${
              selectedFacility === "facilityHanoi"
                ? "border-brand bg-brand-light dark:bg-brand/20"
                : "border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedFacility === "facilityHanoi"
                  ? "text-brand"
                  : "text-neutral-main dark:text-neutral-400"
              }`}
            >
              StorageHub Hanoi
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedFacility("facilityHcm")}
            className={`rounded-full px-3 py-1.5 border ${
              selectedFacility === "facilityHcm"
                ? "border-brand bg-brand-light dark:bg-brand/20"
                : "border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                selectedFacility === "facilityHcm"
                  ? "text-brand"
                  : "text-neutral-main dark:text-neutral-400"
              }`}
            >
              StorageHub HCMC
            </Text>
          </Pressable>
        </View>

        {/* Category Horizontal Scroll Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-5 flex-row"
          contentContainerClassName="gap-2 pr-4"
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                className={`rounded-xl px-3.5 py-2 border ${
                  isSelected
                    ? "border-brand bg-brand"
                    : "border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? "text-white" : "text-neutral-main dark:text-neutral-300"
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Storage Units List */}
        <View className="gap-4">
          {filteredUnits.map((unit) => (
            <View
              key={unit.id}
              className="rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm"
            >
              {/* Top Row: Unit Code and Stock Badge */}
              <View className="flex-row items-center justify-between mb-2.5">
                <View className="flex-row items-center gap-2">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-light dark:bg-brand/20">
                    <Warehouse size={18} color="#0B927E" />
                  </View>
                  <View>
                    <Text className="text-xs font-semibold text-neutral-400">#{unit.code}</Text>
                    <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
                      {t(`explore.${unit.nameKey}`)}
                    </Text>
                  </View>
                </View>

                <Badge variant="outline" className="border-brand/40 bg-brand-light/30">
                  <Text className="text-xs font-semibold text-brand">
                    {t("explore.availableUnits", { count: unit.availableCount })}
                  </Text>
                </Badge>
              </View>

              {/* Location & Dimensions */}
              <View className="mb-3.5 gap-1.5 border-t border-b border-neutral-border/60 dark:border-neutral-800/80 py-3">
                <View className="flex-row items-center gap-1.5">
                  <MapPin size={14} color="#647B80" />
                  <Text className="text-xs font-medium text-neutral-main dark:text-neutral-300">
                    {t(`explore.${unit.facilityKey}`)}
                  </Text>
                </View>
                <Text variant="muted" className="text-xs">
                  {t("explore.dimensions", { dim: unit.dimensions })}
                </Text>
              </View>

              {/* Amenity Badges */}
              <View className="flex-row flex-wrap gap-2 mb-4">
                {unit.features.map((feature) => (
                  <View
                    key={feature}
                    className="flex-row items-center gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 px-2 py-1"
                  >
                    {feature === "smartLock" && <KeyRound size={12} color="#0B927E" />}
                    {feature === "cctv" && <ShieldCheck size={12} color="#0B927E" />}
                    {feature === "climate" && <Wind size={12} color="#0B927E" />}
                    {feature === "insurance" && <CheckCircle2 size={12} color="#0B927E" />}
                    <Text className="text-xs text-neutral-dark dark:text-neutral-300">
                      {t(`explore.${feature}`)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Pricing & CTA */}
              <View className="flex-row items-center justify-between pt-1">
                <View>
                  <Text className="text-lg font-bold text-brand">{unit.price} đ</Text>
                  <Text variant="muted" className="text-xs">
                    {t("explore.perMonth")}
                  </Text>
                </View>

                <Pressable
                  onPress={() => handleBookPress(unit)}
                  className="flex-row items-center gap-1.5 rounded-xl bg-cta px-4 py-2.5 shadow-sm active:opacity-90"
                >
                  <Text className="text-xs font-bold text-white">{t("explore.bookNow")}</Text>
                  <ArrowRight size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
