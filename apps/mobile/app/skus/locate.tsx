import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Barcode, CircleAlert, PackageOpen, Plus, Search, X } from "lucide-react-native";
import { SkuPlacementEnum, type SkuLocationItem } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChips, type FilterChipOption } from "@/components/ui/filter-chips";
import { useTranslation } from "@/stores/language.store";
import { useDebounce } from "@/features/storage-explore/hooks/useDebounce";
import { useSkuLocator } from "@/features/customer-inventory/hooks/useCustomerInventory";
import { BarcodeScannerView } from "@/features/customer-inventory/components/BarcodeScannerView";
import { SkuLocatorCard } from "@/features/customer-inventory/components/SkuLocatorCard";

const FILTER_ALL = "all";

type PlacementFilter = SkuPlacementEnum | typeof FILTER_ALL;

/** Finds where the customer's SKUs are stored, whichever contract they fall under. */
export default function SkuLocatorScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [placement, setPlacement] = useState<PlacementFilter>(FILTER_ALL);
  const [scanning, setScanning] = useState(false);
  const debouncedSearch = useDebounce(search.trim(), 400);

  const locatorQuery = useSkuLocator({
    search: debouncedSearch || undefined,
    placement: placement === FILTER_ALL ? undefined : placement,
  });

  const items = useMemo(
    () => locatorQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [locatorQuery.data]
  );
  const counts = locatorQuery.data?.pages[0]?.counts;

  const withCount = (label: string, count?: number) =>
    count === undefined ? label : `${label} ${count}`;
  const filterOptions: FilterChipOption<PlacementFilter>[] = [
    { key: FILTER_ALL, label: withCount(t("sku.locator.filter.all"), counts?.all) },
    {
      key: SkuPlacementEnum.ON_RACK,
      label: withCount(t("sku.locator.filter.onRack"), counts?.onRack),
    },
    {
      key: SkuPlacementEnum.HOLDING,
      label: withCount(t("sku.locator.filter.holding"), counts?.holding),
    },
    {
      key: SkuPlacementEnum.NOT_STORED,
      label: withCount(t("sku.locator.filter.notStored"), counts?.notStored),
    },
  ];

  const openLocation = (skuId: string, location: SkuLocationItem) => {
    if (!location.contract?.id) return;
    router.push({
      pathname: "/contracts/[id]/rack-map",
      params: { id: location.contract.id, skuId, tierId: location.rackTier?.id },
    });
  };

  const renderEmpty = () => {
    if (locatorQuery.isLoading) {
      return (
        <View className="gap-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-36 w-full rounded-3xl" />
          ))}
        </View>
      );
    }
    if (locatorQuery.isError) {
      return (
        <View className="items-center rounded-3xl border border-red-200 bg-white p-8 dark:border-red-900 dark:bg-neutral-900">
          <CircleAlert size={32} color="#EF4444" />
          <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {t("sku.locator.loadError")}
          </Text>
          <Pressable
            onPress={() => void locatorQuery.refetch()}
            className="mt-4 rounded-xl bg-brand px-5 py-2.5"
          >
            <Text className="text-xs font-bold text-white">{t("rackMap.retry")}</Text>
          </Pressable>
        </View>
      );
    }

    const noSkus = counts?.all === 0 && !debouncedSearch;
    return (
      <View className="items-center rounded-3xl border border-neutral-border bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
        <PackageOpen size={38} color="#0B927E" />
        <Text className="mt-3 text-center text-base font-bold text-neutral-dark dark:text-neutral-100">
          {noSkus
            ? t("sku.locator.empty")
            : debouncedSearch
              ? t("sku.locator.emptyResult")
              : t("sku.locator.emptyFilter")}
        </Text>
        {debouncedSearch ? (
          <Text variant="muted" className="mt-1.5 px-2 text-center text-xs">
            {t("sku.locator.emptyResultHint")}
          </Text>
        ) : null}
        {noSkus ? (
          <>
            <Text variant="muted" className="mt-1.5 px-2 text-center text-xs">
              {t("sku.emptyHint")}
            </Text>
            <Pressable
              onPress={() => router.push("/skus/new")}
              className="mt-5 flex-row items-center gap-2 rounded-xl bg-brand px-5 py-2.5 active:opacity-80"
            >
              <Plus size={16} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">{t("sku.createButton")}</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="gap-2.5 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
            <ArrowLeft size={22} color="#0B927E" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
              {t("sku.locator.title")}
            </Text>
            <Text variant="muted" className="text-[11px]">
              {t("sku.locator.subtitle")}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center rounded-xl border border-neutral-border bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
            <Search size={15} color="#647B80" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("sku.locator.searchPlaceholder")}
              placeholderTextColor="#94A3B8"
              className="ml-2 flex-1 py-0 text-xs font-semibold text-neutral-dark dark:text-neutral-100"
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch("")} hitSlop={8}>
                <X size={14} color="#647B80" />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setScanning((prev) => !prev)}
            accessibilityLabel={t("sku.scan.title")}
            className="h-10 w-10 items-center justify-center rounded-xl bg-brand active:opacity-80"
          >
            <Barcode size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <FilterChips options={filterOptions} value={placement} onChange={setPlacement} />
      </View>

      {scanning ? (
        <View className="px-4 pt-3">
          <BarcodeScannerView
            onScanned={(barcode) => {
              setSearch(barcode);
              setPlacement(FILTER_ALL);
              setScanning(false);
            }}
            onClose={() => setScanning(false)}
          />
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.sku.id}
        contentContainerClassName="gap-3 p-4 pb-10"
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <SkuLocatorCard
            item={item}
            onOpenSku={() => router.push({ pathname: "/skus/[id]", params: { id: item.sku.id } })}
            onOpenLocation={(location) => openLocation(item.sku.id, location)}
          />
        )}
        ListEmptyComponent={renderEmpty}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (locatorQuery.hasNextPage && !locatorQuery.isFetchingNextPage) {
            void locatorQuery.fetchNextPage();
          }
        }}
        ListFooterComponent={
          locatorQuery.isFetchingNextPage ? (
            <ActivityIndicator color="#0B927E" className="py-3" />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={locatorQuery.isRefetching && !locatorQuery.isFetchingNextPage}
            onRefresh={() => void locatorQuery.refetch()}
            tintColor="#0B927E"
          />
        }
      />
    </SafeAreaView>
  );
}
