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
import { CustomerSkuStatusEnum } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChips, type FilterChipOption } from "@/components/ui/filter-chips";
import { useTranslation } from "@/stores/language.store";
import { useDebounce } from "@/features/storage-explore/hooks/useDebounce";
import {
  useCustomerSkuList,
  type CustomerSkuListFilters,
} from "@/features/customer-sku/hooks/useCustomerSkus";
import {
  useCustomerInventorySummary,
  useSkuStockTotals,
} from "@/features/customer-inventory/hooks/useCustomerInventory";
import { SkuListItem } from "@/features/customer-sku/components/SkuListItem";
import { SKU_CATEGORY_PRESETS } from "@/features/customer-sku/utils/skuFormat";

const FILTER_ALL = "all";
const FILTER_INACTIVE = "inactive";

/** C10 — the customer's personal SKU catalog. */
export default function SkuCatalogScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>(FILTER_ALL);
  const debouncedSearch = useDebounce(search.trim(), 400);

  const filters = useMemo<Partial<CustomerSkuListFilters>>(() => {
    if (filter === FILTER_INACTIVE) {
      return { status: CustomerSkuStatusEnum.INACTIVE, search: debouncedSearch || undefined };
    }
    return {
      status: CustomerSkuStatusEnum.ACTIVE,
      category: filter === FILTER_ALL ? undefined : filter,
      search: debouncedSearch || undefined,
    };
  }, [filter, debouncedSearch]);

  const listQuery = useCustomerSkuList(filters);
  const stockQuery = useSkuStockTotals();
  const summaryQuery = useCustomerInventorySummary();

  const skus = useMemo(
    () => listQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [listQuery.data]
  );
  const totalSkus = listQuery.data?.pages[0]?.pagination.totalItems ?? 0;

  const filterOptions: FilterChipOption<string>[] = [
    { key: FILTER_ALL, label: t("sku.filter.all") },
    ...SKU_CATEGORY_PRESETS.map((category) => ({ key: category, label: category })),
    { key: FILTER_INACTIVE, label: t("sku.status.inactive") },
  ];

  const handleRefresh = () => {
    void listQuery.refetch();
    void stockQuery.refetch();
    void summaryQuery.refetch();
  };

  const renderEmpty = () => {
    if (listQuery.isLoading) {
      return (
        <View className="gap-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-28 w-full rounded-3xl" />
          ))}
        </View>
      );
    }
    if (listQuery.isError) {
      return (
        <View className="items-center rounded-3xl border border-red-200 bg-white p-8 dark:border-red-900 dark:bg-neutral-900">
          <CircleAlert size={32} color="#EF4444" />
          <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {t("sku.loadError")}
          </Text>
          <Pressable onPress={handleRefresh} className="mt-4 rounded-xl bg-brand px-5 py-2.5">
            <Text className="text-xs font-bold text-white">{t("rackMap.retry")}</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View className="items-center rounded-3xl border border-neutral-border bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
        <PackageOpen size={32} color="#647B80" />
        <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
          {debouncedSearch ? t("sku.emptySearch") : t("sku.empty")}
        </Text>
        {!debouncedSearch ? (
          <Text variant="muted" className="mt-1 text-center text-xs">
            {t("sku.emptyHint")}
          </Text>
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
              {t("sku.catalogTitle")}
            </Text>
            <Text variant="muted" className="text-[11px]">
              {t("sku.catalogSubtitle", {
                skus: totalSkus,
                qty: summaryQuery.data?.totalQuantity ?? 0,
              })}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center rounded-xl border border-neutral-border bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
            <Search size={15} color="#647B80" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("sku.searchPlaceholder")}
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
            onPress={() => router.push("/skus/scan")}
            accessibilityLabel={t("sku.scan.title")}
            className="h-10 w-10 items-center justify-center rounded-xl bg-brand active:opacity-80"
          >
            <Barcode size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <FilterChips options={filterOptions} value={filter} onChange={setFilter} />
      </View>

      <FlatList
        data={skus}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 p-4 pb-28"
        renderItem={({ item }) => (
          <SkuListItem
            sku={item}
            stock={stockQuery.data?.get(item.id)}
            onPress={() => router.push({ pathname: "/skus/[id]", params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={renderEmpty}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (listQuery.hasNextPage && !listQuery.isFetchingNextPage) {
            void listQuery.fetchNextPage();
          }
        }}
        ListFooterComponent={
          listQuery.isFetchingNextPage ? <ActivityIndicator color="#0B927E" /> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={listQuery.isRefetching && !listQuery.isFetchingNextPage}
            onRefresh={handleRefresh}
            tintColor="#0B927E"
          />
        }
      />

      <Pressable
        onPress={() => router.push("/skus/new")}
        accessibilityLabel={t("sku.form.createTitle")}
        className="absolute bottom-8 right-5 h-14 w-14 items-center justify-center rounded-full bg-cta shadow-lg active:opacity-80"
      >
        <Plus size={26} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}
