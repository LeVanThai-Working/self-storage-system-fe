import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  FlatList,
  ScrollView,
  Pressable,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useDebounce } from "@/features/storage-explore/hooks/useDebounce";
import { useReservationHandoffStore } from "@/features/storage-explore/stores/reservationHandoff.store";
import {
  ReservationStatusEnum,
  type ContractResponse,
  type MessageLocale,
  type ReservationResponse,
} from "@self-storage-system-fe/shared";
import {
  Search,
  PlusCircle,
  ListFilter,
  ArrowUpDown,
  X,
  Inbox,
  Compass,
} from "lucide-react-native";
import { useCustomerContractsByReservationMap } from "@/features/contracts/hooks/useContracts";
import {
  useMyReservationsInfinite,
  type ReservationFilterTabKey,
  type ReservationSortBy,
  type ReservationSortOrder,
} from "@/features/reservations/hooks/useReservations";
import { CreateReservationView } from "@/features/reservations/components/CreateReservationView";
import { ReservationCard } from "@/features/reservations/components/ReservationCard";
import { retryReservationPaymentApi } from "@/features/reservations/api/reservations.api";
import { resolveReservationErrorMessage } from "@/features/reservations/utils/reservationFormat";

type ScreenMode = "list" | "create";

export default function ReservationsTabScreen() {
  const router = useRouter();
  const toast = useToast();
  const { locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const isEn = currentLocale === "en";

  const params = useLocalSearchParams<{
    facilityId?: string;
    facilityUnitTypeOfferingId?: string;
    unitTypeId?: string;
    mode?: string;
  }>();

  const handoffPayload = useReservationHandoffStore((s) => s.handoffPayload);

  const [mode, setMode] = useState<ScreenMode>(() =>
    handoffPayload || params.facilityId || params.mode === "create" ? "create" : "list"
  );

  // Automatically switch to Create view when user arrives from Facility Detail / Offerings with a handoff package
  useEffect(() => {
    const unsubscribe = useReservationHandoffStore.subscribe((state, prevState) => {
      if (state.handoffPayload && state.handoffPayload !== prevState.handoffPayload) {
        setMode("create");
      }
    });
    return unsubscribe;
  }, []);

  // ── Filter, Search & Sort State for MyReservationsScreen (Section 2.1) ──
  const [filterTab, setFilterTab] = useState<ReservationFilterTabKey>("ALL");
  const [searchCode, setSearchCode] = useState<string>("");
  const debouncedSearchCode = useDebounce(searchCode, 350);

  const [sortBy, setSortBy] = useState<ReservationSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<ReservationSortOrder>("desc");
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false);

  const reservationsQuery = useMyReservationsInfinite({
    filterTab,
    reservationCode: debouncedSearchCode,
    sortBy,
    sortOrder,
    limit: 10,
    enabled: mode === "list",
  });

  const { contractByReservationId, refetch: refetchContractsMap } =
    useCustomerContractsByReservationMap(mode === "list");

  const { refetch: refetchReservations } = reservationsQuery;

  useFocusEffect(
    useCallback(() => {
      if (mode === "list") {
        void refetchReservations();
        void refetchContractsMap();
      }
    }, [mode, refetchReservations, refetchContractsMap])
  );

  const filterTabs: { key: ReservationFilterTabKey; label: string }[] = [
    { key: "ALL", label: isEn ? "All" : "Tất cả" },
    { key: "PROCESSING", label: isEn ? "Processing" : "Chờ xử lý" },
    { key: "PENDING_DEPOSIT", label: isEn ? "Awaiting Deposit" : "Chờ đặt cọc" },
    {
      key: "PAID_CONFIRMED",
      label: isEn ? "Paid / Confirmed" : "Đã cọc / Xác nhận",
    },
    { key: "COMPLETED", label: isEn ? "Completed" : "Hoàn tất" },
    {
      key: "TERMINATED",
      label: isEn ? "Cancelled / Rejected / Expired" : "Đã hủy / Từ chối / Hết hạn",
    },
  ];

  const sortOptions: {
    label: string;
    sortBy: ReservationSortBy;
    sortOrder: ReservationSortOrder;
  }[] = [
    {
      label: isEn ? "Newest Created" : "Mới tạo nhất",
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    {
      label: isEn ? "Oldest Created" : "Cũ nhất",
      sortBy: "createdAt",
      sortOrder: "asc",
    },
    {
      label: isEn ? "Earliest Start Date" : "Ngày nhận kho gần nhất",
      sortBy: "startDate",
      sortOrder: "asc",
    },
    {
      label: isEn ? "Highest Total Amount" : "Tổng tiền cao nhất",
      sortBy: "totalAmount",
      sortOrder: "desc",
    },
    {
      label: isEn ? "Lowest Total Amount" : "Tổng tiền thấp nhất",
      sortBy: "totalAmount",
      sortOrder: "asc",
    },
  ];

  const handleOpenDetail = useCallback(
    (reservation: ReservationResponse) => {
      router.push({
        pathname: "/reservations/[id]" as any,
        params: { id: reservation.id },
      });
    },
    [router]
  );

  const handleOpenContractDetail = useCallback(
    (contract: ContractResponse) => {
      router.push({
        pathname: "/contracts/[id]" as any,
        params: { id: contract.id },
      });
    },
    [router]
  );

  const handleQuickPayDeposit = useCallback(
    async (reservation: ReservationResponse) => {
      if (reservation.status === ReservationStatusEnum.PAYMENT_FAILED) {
        try {
          await retryReservationPaymentApi(reservation.id);
          reservationsQuery.refetch();
        } catch (err) {
          const resolved = resolveReservationErrorMessage(err, currentLocale, "reservation");
          toast.error(resolved.message);
          return;
        }
      }

      router.push({
        pathname: "/reservations/[id]/payment" as any,
        params: { id: reservation.id },
      });
    },
    [router, reservationsQuery, currentLocale, toast]
  );

  const activeSortLabel =
    sortOptions.find((opt) => opt.sortBy === sortBy && opt.sortOrder === sortOrder)?.label ??
    (isEn ? "Newest Created" : "Mới tạo nhất");

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {/* Top Mode Switcher: "Đơn đặt chỗ của tôi" vs "+ Đặt chỗ mới" */}
      <View className="px-4 py-2.5 bg-white dark:bg-neutral-900 border-b border-neutral-border dark:border-neutral-800">
        <View className="flex-row rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 p-1">
          <Pressable
            onPress={() => setMode("list")}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2 ${
              mode === "list" ? "bg-brand" : "bg-transparent"
            }`}
          >
            <ListFilter size={14} color={mode === "list" ? "#FFFFFF" : "#647B80"} />
            <Text
              className={`text-xs font-bold ${
                mode === "list" ? "text-white" : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {isEn ? "My Reservations" : "Đơn đặt chỗ của tôi"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setMode("create")}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2 ${
              mode === "create" ? "bg-brand" : "bg-transparent"
            }`}
          >
            <PlusCircle size={14} color={mode === "create" ? "#FFFFFF" : "#647B80"} />
            <Text
              className={`text-xs font-bold ${
                mode === "create" ? "text-white" : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {isEn ? "New Reservation" : "Đặt chỗ mới"}
            </Text>
            {handoffPayload ? <View className="h-2 w-2 rounded-full bg-cta" /> : null}
          </Pressable>
        </View>
      </View>

      {mode === "create" ? (
        <CreateReservationView
          key="reservations-tab-create-view"
          initialFacilityId={params.facilityId}
          initialOfferingId={params.facilityUnitTypeOfferingId}
          initialUnitTypeId={params.unitTypeId}
          onSuccessNavigate={(newReservationId) => {
            setMode("list");
            router.push({
              pathname: "/reservations/[id]" as any,
              params: { id: newReservationId },
            });
          }}
        />
      ) : (
        <View key="reservations-tab-list-view" className="flex-1">
          {/* ── Section 2.1: Search, Sort & Horizontal Status Filter Tabs ── */}
          <View className="bg-white dark:bg-neutral-900 px-4 pt-3 pb-2.5 border-b border-neutral-border dark:border-neutral-800 gap-2.5">
            {/* Search by reservationCode + Sort Button */}
            <View className="flex-row items-center gap-2">
              <View className="flex-1 flex-row items-center rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2">
                <Search size={15} color="#647B80" />
                <TextInput
                  value={searchCode}
                  onChangeText={setSearchCode}
                  placeholder={
                    isEn ? "Search by code (e.g. RES-2026...)" : "Tìm theo mã đơn (VD: RES-2026...)"
                  }
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  className="ml-2 flex-1 text-xs font-semibold text-neutral-dark dark:text-neutral-100 py-0"
                />
                {searchCode.length > 0 ? (
                  <Pressable onPress={() => setSearchCode("")} hitSlop={8}>
                    <X size={14} color="#647B80" />
                  </Pressable>
                ) : null}
              </View>

              <Pressable
                onPress={() => setShowSortOptions((prev) => !prev)}
                className={`flex-row items-center gap-1.5 rounded-xl border px-3 py-2.5 ${
                  showSortOptions
                    ? "border-brand bg-brand-light/40 dark:bg-brand/20"
                    : "border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                }`}
              >
                <ArrowUpDown size={14} color="#0B927E" />
                <Text
                  className="text-[11px] font-bold text-neutral-dark dark:text-neutral-200 max-w-[100px]"
                  numberOfLines={1}
                >
                  {activeSortLabel}
                </Text>
              </Pressable>
            </View>

            {/* Expandable Sort Selector */}
            {showSortOptions ? (
              <View key="sort-options-panel" className="flex-row flex-wrap gap-1.5 pt-0.5">
                {sortOptions.map((opt) => {
                  const active = opt.sortBy === sortBy && opt.sortOrder === sortOrder;
                  return (
                    <Pressable
                      key={`${opt.sortBy}-${opt.sortOrder}`}
                      onPress={() => {
                        setSortBy(opt.sortBy);
                        setSortOrder(opt.sortOrder);
                        setShowSortOptions(false);
                      }}
                      className={`rounded-lg border px-2.5 py-1.5 ${
                        active
                          ? "border-brand bg-brand-light/40 dark:bg-brand/20"
                          : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-semibold ${
                          active ? "text-brand" : "text-neutral-600 dark:text-neutral-300"
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {/* Horizontal Status Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
            >
              {filterTabs.map((tab) => {
                const active = filterTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setFilterTab(tab.key)}
                    className={`rounded-full border px-3.5 py-1.5 ${
                      active
                        ? "border-brand bg-brand"
                        : "border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800"
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        active ? "text-white" : "text-neutral-600 dark:text-neutral-300"
                      }`}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Section 2.2: Reservations List (Infinite Scroll & Pull-to-Refresh) ── */}
          {reservationsQuery.isLoading ? (
            <View key="reservations-list-loading" className="p-4 gap-3">
              <Skeleton className="h-44 w-full rounded-3xl" />
              <Skeleton className="h-44 w-full rounded-3xl" />
              <Skeleton className="h-44 w-full rounded-3xl" />
            </View>
          ) : (
            <FlatList
              key="reservations-list-flatlist"
              data={reservationsQuery.items}
              keyExtractor={(item) => item.id}
              contentContainerClassName="p-4 pb-16 gap-3"
              refreshControl={
                <RefreshControl
                  refreshing={reservationsQuery.isRefetching}
                  onRefresh={() => {
                    void reservationsQuery.refetch();
                    void refetchContractsMap();
                  }}
                  tintColor="#0B927E"
                />
              }
              onEndReachedThreshold={0.35}
              onEndReached={() => {
                if (reservationsQuery.hasNextPage && !reservationsQuery.isFetchingNextPage) {
                  reservationsQuery.fetchNextPage();
                }
              }}
              renderItem={({ item }) => (
                <ReservationCard
                  reservation={item}
                  linkedContract={contractByReservationId.get(item.id) ?? null}
                  locale={currentLocale}
                  onPress={handleOpenDetail}
                  onPayDepositPress={handleQuickPayDeposit}
                  onViewContractPress={handleOpenContractDetail}
                />
              )}
              ListEmptyComponent={
                <View className="mt-8 items-center justify-center rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8">
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-light/40 dark:bg-brand/20 mb-3">
                    <Inbox size={26} color="#0B927E" />
                  </View>
                  <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100 text-center">
                    {isEn ? "No reservations found" : "Chưa có đơn đặt chỗ nào phù hợp"}
                  </Text>
                  <Text variant="muted" className="mt-1 text-xs text-center leading-4">
                    {isEn
                      ? "Explore active storage facilities or create a new reservation right now."
                      : "Khám phá các cơ sở kho đang hoạt động hoặc tạo yêu cầu đặt chỗ mới ngay."}
                  </Text>

                  <View className="mt-4 flex-row gap-2.5">
                    <Pressable
                      onPress={() => router.push("/(tabs)" as any)}
                      className="flex-row items-center gap-1.5 rounded-xl border border-brand bg-brand-light/30 px-4 py-2.5"
                    >
                      <Compass size={14} color="#0B927E" />
                      <Text className="text-xs font-bold text-brand">
                        {isEn ? "Explore Facilities" : "Khám phá kho"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => setMode("create")}
                      className="flex-row items-center gap-1.5 rounded-xl bg-cta px-4 py-2.5"
                    >
                      <PlusCircle size={14} color="#FFFFFF" />
                      <Text className="text-xs font-bold text-white">
                        {isEn ? "Create Reservation" : "Tạo đặt chỗ"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              }
              ListFooterComponent={
                reservationsQuery.isFetchingNextPage ? (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#0B927E" />
                  </View>
                ) : null
              }
            />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
