import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CalendarClock, Inbox } from "lucide-react-native";
import { ContractStatusEnum } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChips } from "@/components/ui/filter-chips";
import { useTranslation } from "@/stores/language.store";
import { useContractDetail } from "@/features/contracts/hooks/useContracts";
import { isWarehouseRackContract } from "@/features/contracts/utils/contractFormat";
import { SelfStorageGuardView } from "@/features/contracts/components/SelfStorageGuardView";
import { useContractMovements } from "@/features/customer-inventory/hooks/useCustomerInventory";
import { MovementRow } from "@/features/customer-inventory/components/MovementRow";
import { useAccessSchedules } from "@/features/access-schedules/hooks/useAccessSchedules";
import { AccessScheduleCard } from "@/features/access-schedules/components/AccessScheduleCard";

type Tab = "movements" | "visits";

/** Activity of one contract: the stock ledger and the warehouse visits booked for it. */
export default function ContractActivityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id: contractId = "" } = useLocalSearchParams<{ id?: string }>();
  const [tab, setTab] = useState<Tab>("movements");

  const contractQuery = useContractDetail(contractId);
  const contract = contractQuery.data;
  const isWarehouse =
    typeof isWarehouseRackContract === "function" ? isWarehouseRackContract(contract) : false;

  const movementQuery = useContractMovements(
    tab === "movements" && isWarehouse ? contractId : undefined
  );
  const visitQuery = useAccessSchedules({ contractId }, tab === "visits" && isWarehouse);
  const visits = useMemo(
    () => visitQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [visitQuery.data]
  );

  const handleRefresh = () => {
    if (tab === "movements") void movementQuery.refetch();
    else void visitQuery.refetch();
  };

  const renderEmpty = (message: string) => (
    <View className="items-center rounded-3xl border border-neutral-border bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
      <Inbox size={28} color="#647B80" />
      <Text variant="muted" className="mt-2 text-center text-xs">
        {message}
      </Text>
    </View>
  );

  const renderList = () => {
    if (tab === "movements") {
      const movements = movementQuery.data?.items ?? [];
      if (movementQuery.isLoading) return <Skeleton className="h-24 w-full rounded-3xl" />;
      return movements.length > 0 ? (
        <View className="gap-2.5">
          {movements.map((movement) => (
            <MovementRow key={movement.id} movement={movement} />
          ))}
        </View>
      ) : (
        renderEmpty(t("contractActivity.emptyMovements"))
      );
    }

    if (visitQuery.isLoading) return <Skeleton className="h-24 w-full rounded-3xl" />;
    return visits.length > 0 ? (
      <View className="gap-2.5">
        {visits.map((visit) => (
          <AccessScheduleCard
            key={visit.id}
            schedule={visit}
            onPress={() =>
              router.push({ pathname: "/access-schedules/[id]", params: { id: visit.id } })
            }
          />
        ))}
      </View>
    ) : (
      renderEmpty(t("accessSchedule.list.empty"))
    );
  };

  if (contract && !isWarehouse) {
    return (
      <SelfStorageGuardView
        contract={contract}
        title={t("contractActivity.title")}
        reason="inventory_not_supported"
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="gap-2.5 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
            <ArrowLeft size={22} color="#0B927E" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
              {t("contractActivity.title")}
            </Text>
            {contract ? (
              <Text variant="muted" className="text-[11px]">
                {t("contractActivity.unitContract", {
                  unit: contract.storageUnit?.unitNumber ?? "",
                  code: contract.contractCode,
                })}
              </Text>
            ) : null}
          </View>
        </View>
        <FilterChips
          value={tab}
          onChange={setTab}
          options={[
            { key: "movements", label: t("contractActivity.tab.movements") },
            { key: "visits", label: t("contractActivity.tab.visits") },
          ]}
        />
      </View>

      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={movementQuery.isRefetching || visitQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor="#0B927E"
          />
        }
      >
        {tab === "visits" && contract?.status === ContractStatusEnum.ACTIVE ? (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/access-schedules/new", params: { contractId } })
            }
            className="flex-row items-center justify-center gap-1.5 rounded-xl bg-cta py-2.5 active:opacity-80"
          >
            <CalendarClock size={14} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">{t("accessSchedule.bookButton")}</Text>
          </Pressable>
        ) : null}
        {renderList()}
      </ScrollView>
    </SafeAreaView>
  );
}
