import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  FlatList,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { useToast } from "@/stores/toast.store";
import { useDebounce } from "@/features/storage-explore/hooks/useDebounce";
import {
  ContractSourceEnum,
  ContractStatusEnum,
  type ContractResponse,
  type MessageLocale,
} from "@self-storage-system-fe/shared";
import {
  AlertCircle,
  ArrowUpDown,
  Compass,
  Inbox,
  QrCode,
  RefreshCw,
  Search,
  X,
} from "lucide-react-native";
import {
  useMyContractsInfinite,
  type ContractFilterTabKey,
  type ContractSortBy,
  type ContractSortOrder,
} from "@/features/contracts/hooks/useContracts";
import { ContractCard } from "@/features/contracts/components/ContractCard";

function derivePinFromContract(contract: ContractResponse): string {
  const digits = contract.id.replace(/\D/g, "");
  if (digits.length >= 6) {
    return digits.slice(-6);
  }
  return (digits + "849201").slice(0, 6);
}

export default function MyStoragesScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const toast = useToast();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const isEn = currentLocale === "en";

  const [filterTab, setFilterTab] = useState<ContractFilterTabKey>("ALL");
  const [searchCode, setSearchCode] = useState<string>("");
  const debouncedSearchCode = useDebounce(searchCode, 350);

  const [sortBy, setSortBy] = useState<ContractSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<ContractSortOrder>("desc");
  const [showSortOptions, setShowSortOptions] = useState<boolean>(false);

  const [openingContractId, setOpeningContractId] = useState<string | null>(null);
  const [pinModalContract, setPinModalContract] = useState<ContractResponse | null>(null);

  const contractsQuery = useMyContractsInfinite({
    filterTab,
    contractCode: debouncedSearchCode,
    sortBy,
    sortOrder,
    limit: 10,
    enabled: true,
  });

  const { refetch: refetchContracts } = contractsQuery;

  useFocusEffect(
    useCallback(() => {
      void refetchContracts();
    }, [refetchContracts])
  );

  const filterTabs: { key: ContractFilterTabKey; label: string }[] = [
    { key: "ALL", label: isEn ? "All Contracts" : "Tất cả" },
    { key: "DRAFT", label: isEn ? "Pending Check-in" : "Chờ Check-in" },
    { key: "ACTIVE", label: isEn ? "Active Lease" : "Đang thuê" },
    { key: "OVERDUE", label: isEn ? "Overdue" : "Quá hạn" },
    { key: "COMPLETED", label: isEn ? "Completed" : "Đã trả kho" },
    { key: "CLOSED", label: isEn ? "Cancelled / Terminated" : "Đã hủy / Chấm dứt" },
  ];

  const sortOptions: {
    label: string;
    sortBy: ContractSortBy;
    sortOrder: ContractSortOrder;
  }[] = [
    {
      label: isEn ? "Newest Created" : "Mới tạo nhất",
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    {
      label: isEn ? "Earliest End Date" : "Sắp hết hạn nhất",
      sortBy: "endDate",
      sortOrder: "asc",
    },
    {
      label: isEn ? "Highest Rental Value" : "Giá trị cao nhất",
      sortBy: "totalRentalAmount",
      sortOrder: "desc",
    },
  ];

  const activeSortLabel =
    sortOptions.find((opt) => opt.sortBy === sortBy && opt.sortOrder === sortOrder)?.label ??
    (isEn ? "Newest Created" : "Mới tạo nhất");

  const contractItems = contractsQuery.items;
  const firstDraftContract = useMemo(
    () => contractItems.find((item) => item.status === ContractStatusEnum.DRAFT) ?? null,
    [contractItems]
  );

  const handleOpenDetail = useCallback(
    (contract: ContractResponse) => {
      router.push({
        pathname: "/contracts/[id]" as any,
        params: { id: contract.id },
      });
    },
    [router]
  );

  const handleUnlockSmartLock = useCallback(
    (contract: ContractResponse) => {
      setOpeningContractId(contract.id);
      setTimeout(() => {
        setOpeningContractId(null);
        toast.success(
          t("myStorages.lockOpenedSuccess", {
            code: contract.storageUnit?.unitNumber || contract.contractCode,
          })
        );
      }, 1000);
    },
    [toast, t]
  );

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {/* Top Filter & Search Bar */}
      <View className="bg-white dark:bg-neutral-900 px-4 pt-3 pb-2.5 border-b border-neutral-border dark:border-neutral-800 gap-2.5">
        <View>
          <Text variant="heading2" className="text-neutral-dark dark:text-neutral-100 font-bold">
            {t("customerTabs.myUnitsTitle")}
          </Text>
          <Text variant="muted" className="mt-0.5 text-xs">
            {t("customerTabs.myUnitsDesc")}
          </Text>
        </View>

        {/* Search by contractCode + Sort Button */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center rounded-xl border border-neutral-border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2">
            <Search size={15} color="#647B80" />
            <TextInput
              value={searchCode}
              onChangeText={setSearchCode}
              placeholder={
                isEn
                  ? "Search by contract code (e.g. CTR-2026...)"
                  : "Tìm theo mã hợp đồng (VD: CTR-2026...)"
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

        {showSortOptions ? (
          <View className="flex-row flex-wrap gap-1.5 pt-0.5">
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

      {/* Contracts List */}
      {contractsQuery.isLoading ? (
        <View className="p-4 gap-3">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </View>
      ) : (
        <FlatList
          data={contractItems}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-4 pb-16 gap-3"
          refreshControl={
            <RefreshControl
              refreshing={contractsQuery.isRefetching}
              onRefresh={contractsQuery.refetch}
              tintColor="#0B927E"
            />
          }
          onEndReachedThreshold={0.35}
          onEndReached={() => {
            if (contractsQuery.hasNextPage && !contractsQuery.isFetchingNextPage) {
              contractsQuery.fetchNextPage();
            }
          }}
          ListHeaderComponent={
            firstDraftContract ? (
              <View className="mb-1 rounded-3xl border bg-[#F1E9E5] border-cta/30 bg-cta-light/20 dark:bg-cta/15 p-4 shadow-sm">
                <View className="flex-row items-center gap-2 mb-1.5">
                  <QrCode size={18} color="#FF702E" />
                  <Text className="text-xs font-bold text-cta">
                    {t("myStorages.checkinAlertTitle")}
                  </Text>
                </View>

                <Text className="text-xs text-neutral-main dark:text-neutral-300 mb-3 leading-5">
                  {firstDraftContract.source === ContractSourceEnum.RESERVATION
                    ? isEn
                      ? `Contract #${firstDraftContract.contractCode} is ready. Visit the facility counter to complete check-in handover.`
                      : `Hợp đồng #${firstDraftContract.contractCode} đã được tạo. Vui lòng đến quầy cơ sở gặp nhân viên phụ trách để hoàn tất Check-in nhận kho.`
                    : isEn
                      ? `Contract #${firstDraftContract.contractCode} is ready. Visit the facility counter to complete deposit & check-in handover.`
                      : `Hợp đồng #${firstDraftContract.contractCode} đã sẵn sàng. Vui lòng đến quầy cơ sở để hoàn tất đặt cọc & nhận bàn giao kho.`}
                </Text>

                <Pressable
                  onPress={() => handleOpenDetail(firstDraftContract)}
                  className="flex-row items-center justify-center gap-2 rounded-xl bg-cta py-2.5 shadow-sm active:opacity-90"
                >
                  <QrCode size={15} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">
                    {isEn ? "View Check-in Contract" : "Xem hợp đồng chờ Check-in"}
                  </Text>
                </Pressable>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <ContractCard
              contract={item}
              locale={currentLocale}
              onPress={handleOpenDetail}
              onUnlockPress={handleUnlockSmartLock}
              onViewPinPress={(c) => setPinModalContract(c)}
              isUnlocking={openingContractId === item.id}
            />
          )}
          ListEmptyComponent={
            contractsQuery.isError ? (
              <View className="mt-8 items-center justify-center rounded-3xl border border-red-200 dark:border-red-900 bg-white dark:bg-neutral-900 p-8">
                <AlertCircle size={32} color="#EF4444" />
                <Text className="mt-3 text-sm font-bold text-neutral-dark dark:text-neutral-100 text-center">
                  {isEn ? "Failed to load storage contracts" : "Không thể tải danh sách hợp đồng"}
                </Text>
                <Pressable
                  onPress={() => contractsQuery.refetch()}
                  className="mt-4 flex-row items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5"
                >
                  <RefreshCw size={14} color="#FFFFFF" />
                  <Text className="text-xs font-bold text-white">
                    {isEn ? "Try Again" : "Thử lại"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="mt-8 items-center justify-center rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-light/40 dark:bg-brand/20 mb-3">
                  <Inbox size={26} color="#0B927E" />
                </View>
                <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100 text-center">
                  {isEn ? "No storage contracts found" : "Chưa có hợp đồng thuê kho nào"}
                </Text>
                <Text variant="muted" className="mt-1 text-xs text-center leading-4">
                  {isEn
                    ? "Once your reservation is confirmed and converted into a lease contract, your storage units will appear here."
                    : "Sau khi đơn đặt chỗ được xác nhận và tạo hợp đồng bàn giao kho, danh sách kho đang thuê của bạn sẽ hiển thị tại đây."}
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
                </View>
              </View>
            )
          }
          ListFooterComponent={
            contractsQuery.isFetchingNextPage ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#0B927E" />
              </View>
            ) : null
          }
        />
      )}

      {/* Access PIN Modal */}
      {pinModalContract ? (
        <Modal
          visible={Boolean(pinModalContract)}
          transparent
          animationType="fade"
          onRequestClose={() => setPinModalContract(null)}
        >
          <View className="flex-1 items-center justify-center bg-black/60 p-6">
            <View className="w-full max-w-sm rounded-3xl border border-neutral-border dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-2xl">
              <View className="flex-row items-center justify-between pb-3 border-b border-neutral-border dark:border-neutral-800">
                <Text variant="title" className="font-bold text-neutral-dark dark:text-neutral-100">
                  {t("myStorages.pinModalTitle")}
                </Text>
                <Pressable
                  onPress={() => setPinModalContract(null)}
                  hitSlop={8}
                  className="rounded-full p-1"
                >
                  <X size={18} color="#647B80" />
                </Pressable>
              </View>

              <Text variant="muted" className="text-xs mt-3 leading-5">
                {t("myStorages.pinModalDesc")}
              </Text>

              <View className="my-5 items-center justify-center rounded-2xl bg-brand-light dark:bg-brand/20 p-5">
                <Text className="text-3xl font-extrabold tracking-widest text-brand">
                  {derivePinFromContract(pinModalContract)}
                </Text>
                <Text variant="muted" className="text-xs mt-1">
                  #{pinModalContract.contractCode}
                </Text>
              </View>

              <Pressable
                onPress={() => setPinModalContract(null)}
                className="items-center justify-center rounded-xl bg-neutral-900 dark:bg-neutral-100 py-3"
              >
                <Text className="text-xs font-bold text-white dark:text-neutral-900">
                  {t("common.close")}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}
