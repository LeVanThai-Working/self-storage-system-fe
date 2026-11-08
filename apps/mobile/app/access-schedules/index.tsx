import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, CalendarX, CircleAlert } from "lucide-react-native";
import { AccessScheduleStatusEnum, type MessageLocale } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChips, type FilterChipOption } from "@/components/ui/filter-chips";
import { resolveRequestError } from "@/lib/apiError";
import { useTranslation } from "@/stores/language.store";
import { useAccessSchedules } from "@/features/access-schedules/hooks/useAccessSchedules";
import { AccessScheduleCard } from "@/features/access-schedules/components/AccessScheduleCard";

const FILTER_ALL = "all";
type StatusFilter = AccessScheduleStatusEnum | typeof FILTER_ALL;

const STATUS_FILTERS: AccessScheduleStatusEnum[] = [
  AccessScheduleStatusEnum.PENDING,
  AccessScheduleStatusEnum.CHECKED_IN,
  AccessScheduleStatusEnum.COMPLETED,
  AccessScheduleStatusEnum.CANCELLED,
  AccessScheduleStatusEnum.NO_SHOW,
];

/** Every warehouse visit the customer booked, across contracts. */
export default function AccessScheduleListScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const [status, setStatus] = useState<StatusFilter>(FILTER_ALL);

  const query = useAccessSchedules({ status: status === FILTER_ALL ? undefined : status });
  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  const options: FilterChipOption<StatusFilter>[] = [
    { key: FILTER_ALL, label: t("accessSchedule.list.all") },
    ...STATUS_FILTERS.map((value) => ({ key: value, label: t(`accessSchedule.status.${value}`) })),
  ];

  const renderEmpty = () => {
    if (query.isLoading) {
      return (
        <View className="gap-3">
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} className="h-20 w-full rounded-3xl" />
          ))}
        </View>
      );
    }
    if (query.isError) {
      return (
        <View className="items-center rounded-3xl border border-red-200 bg-white p-8 dark:border-red-900 dark:bg-neutral-900">
          <CircleAlert size={30} color="#EF4444" />
          <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {resolveRequestError(query.error, currentLocale).message}
          </Text>
          <Pressable
            onPress={() => query.refetch()}
            className="mt-4 rounded-xl bg-brand px-5 py-2.5"
          >
            <Text className="text-xs font-bold text-white">{t("rackMap.retry")}</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View className="items-center rounded-3xl border border-neutral-border bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
        <CalendarX size={32} color="#647B80" />
        <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
          {t("accessSchedule.list.empty")}
        </Text>
        <Text variant="muted" className="mt-1 text-center text-xs">
          {t("accessSchedule.list.emptyHint")}
        </Text>
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
              {t("accessSchedule.list.title")}
            </Text>
            <Text variant="muted" className="text-[11px]">
              {t("accessSchedule.list.subtitle")}
            </Text>
          </View>
        </View>
        <FilterChips options={options} value={status} onChange={setStatus} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 p-4 pb-10"
        renderItem={({ item }) => (
          <AccessScheduleCard
            schedule={item}
            onPress={() =>
              router.push({ pathname: "/access-schedules/[id]", params: { id: item.id } })
            }
          />
        )}
        ListEmptyComponent={renderEmpty}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        ListFooterComponent={
          query.isFetchingNextPage ? <ActivityIndicator color="#0B927E" className="py-3" /> : null
        }
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
            tintColor="#0B927E"
          />
        }
      />
    </SafeAreaView>
  );
}
