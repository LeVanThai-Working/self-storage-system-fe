import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpFromLine,
  CircleAlert,
  Inbox,
} from "lucide-react-native";
import {
  InventoryRequestStatusEnum,
  InventoryRequestTypeEnum,
  formatDate,
  type InventoryRequestResponse,
  type SupportTicketResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { FilterChips } from "@/components/ui/filter-chips";
import { useTranslation } from "@/stores/language.store";
import { useContractDetail } from "@/features/contracts/hooks/useContracts";
import { useContractMovements } from "@/features/customer-inventory/hooks/useCustomerInventory";
import { MovementRow, formatTime } from "@/features/customer-inventory/components/MovementRow";
import { useInventoryRequests } from "@/features/inventory-requests/hooks/useInventoryRequests";
import {
  REQUEST_STATUS_TONE,
  sumRequestQuantity,
} from "@/features/inventory-requests/utils/requestFormat";
import { useSupportTicketList } from "@/features/support-tickets/hooks/useSupportTickets";
import {
  TICKET_STATUS_TONE,
  isMoveRequestTicket,
} from "@/features/support-tickets/utils/ticketTemplates";

type Tab = "outbound" | "inbound" | "move" | "activity";

const REQUEST_LIMIT = 30;

/** C9 — every warehouse request of one contract plus the staff activity feed. */
export default function ContractRequestsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { id: contractId = "" } = useLocalSearchParams<{ id?: string }>();
  const [tab, setTab] = useState<Tab>("outbound");

  const contractQuery = useContractDetail(contractId);
  const requestQuery = useInventoryRequests(
    {
      contractId,
      page: 1,
      limit: REQUEST_LIMIT,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    Boolean(contractId)
  );
  const ticketQuery = useSupportTicketList({ contractId }, tab === "move");
  const movementQuery = useContractMovements(tab === "activity" ? contractId : undefined);

  const requests = requestQuery.data?.items ?? [];
  const pendingInbound = requests.filter(
    (request) => request.status === InventoryRequestStatusEnum.PENDING_CUSTOMER_CONFIRMATION
  );
  const visibleRequests = requests.filter((request) =>
    tab === "outbound"
      ? request.type === InventoryRequestTypeEnum.OUTBOUND
      : request.type === InventoryRequestTypeEnum.INBOUND
  );
  const moveTickets = useMemo(
    () =>
      (ticketQuery.data?.pages.flatMap((page) => page.items) ?? []).filter((ticket) =>
        isMoveRequestTicket(ticket)
      ),
    [ticketQuery.data]
  );

  const handleRefresh = () => {
    void requestQuery.refetch();
    if (tab === "move") void ticketQuery.refetch();
    if (tab === "activity") void movementQuery.refetch();
  };

  const renderRequest = (request: InventoryRequestResponse) => {
    const outbound = request.type === InventoryRequestTypeEnum.OUTBOUND;
    return (
      <Pressable
        key={request.id}
        onPress={() =>
          router.push({ pathname: "/inventory-requests/[id]", params: { id: request.id } })
        }
        className="flex-row items-center gap-3 border-b border-neutral-border py-3 active:opacity-70 dark:border-neutral-800"
      >
        <View
          className={`h-9 w-9 items-center justify-center rounded-xl ${
            outbound ? "bg-cta-light dark:bg-cta/20" : "bg-brand-light dark:bg-brand/20"
          }`}
        >
          {outbound ? (
            <ArrowUpFromLine size={16} color="#FF702E" />
          ) : (
            <ArrowDownToLine size={16} color="#0B927E" />
          )}
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-mono text-[11px] font-bold text-neutral-dark dark:text-neutral-100">
            {request.requestCode}
          </Text>
          <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
            {t(
              outbound ? "inventoryRequest.list.outboundLine" : "inventoryRequest.list.inboundLine",
              {
                qty: sumRequestQuantity(request.items),
              }
            )}
          </Text>
          <Text variant="muted" className="text-[10px]">
            {request.transporterInfo?.name ? `${request.transporterInfo.name} · ` : ""}
            {formatTime(request.createdAt)} {formatDate(request.createdAt)}
          </Text>
        </View>
        <StatusPill
          label={t(`inventoryRequest.status.${request.status}`)}
          tone={REQUEST_STATUS_TONE[request.status]}
        />
      </Pressable>
    );
  };

  const renderTicket = (ticket: SupportTicketResponse) => (
    <Pressable
      key={ticket.id}
      onPress={() => router.push({ pathname: "/support-tickets/[id]", params: { id: ticket.id } })}
      className="flex-row items-center gap-3 border-b border-neutral-border py-3 active:opacity-70 dark:border-neutral-800"
    >
      <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50">
        <ArrowLeftRight size={16} color="#3B82F6" />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-mono text-[11px] font-bold text-neutral-dark dark:text-neutral-100">
          {ticket.ticketCode}
        </Text>
        <Text
          numberOfLines={1}
          className="text-xs font-bold text-neutral-dark dark:text-neutral-100"
        >
          {ticket.title}
        </Text>
        <Text variant="muted" className="text-[10px]">
          {formatTime(ticket.createdAt)} {formatDate(ticket.createdAt)}
        </Text>
      </View>
      <StatusPill
        label={t(`supportTicket.status.${ticket.status}`)}
        tone={TICKET_STATUS_TONE[ticket.status]}
      />
    </Pressable>
  );

  const renderList = () => {
    if (tab === "activity") {
      const movements = movementQuery.data?.items ?? [];
      if (movementQuery.isLoading) return <Skeleton className="h-24 w-full rounded-3xl" />;
      return movements.length > 0 ? (
        <View className="gap-2.5">
          {movements.map((movement) => (
            <MovementRow key={movement.id} movement={movement} />
          ))}
        </View>
      ) : (
        renderEmpty()
      );
    }

    const loading = tab === "move" ? ticketQuery.isLoading : requestQuery.isLoading;
    if (loading) return <Skeleton className="h-40 w-full rounded-3xl" />;
    const rows =
      tab === "move" ? moveTickets.map(renderTicket) : visibleRequests.map(renderRequest);
    return rows.length > 0 ? (
      <View className="rounded-3xl border border-neutral-border bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
        {rows}
      </View>
    ) : (
      renderEmpty()
    );
  };

  const renderEmpty = () => (
    <View className="items-center rounded-3xl border border-neutral-border bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
      <Inbox size={28} color="#647B80" />
      <Text variant="muted" className="mt-2 text-center text-xs">
        {t("inventoryRequest.list.empty")}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="gap-2.5 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
            <ArrowLeft size={22} color="#0B927E" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
              {t("inventoryRequest.list.title")}
            </Text>
            {contractQuery.data ? (
              <Text variant="muted" className="text-[11px]">
                {t("inventoryRequest.unitContract", {
                  unit: contractQuery.data.storageUnit?.unitNumber ?? "",
                  code: contractQuery.data.contractCode,
                })}
              </Text>
            ) : null}
          </View>
        </View>
        <FilterChips
          value={tab}
          onChange={setTab}
          options={[
            { key: "outbound", label: t("inventoryRequest.list.tab.outbound") },
            { key: "inbound", label: t("inventoryRequest.list.tab.inbound") },
            { key: "move", label: t("inventoryRequest.list.tab.move") },
            { key: "activity", label: t("inventoryRequest.list.tab.activity") },
          ]}
        />
      </View>

      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-12"
        refreshControl={
          <RefreshControl
            refreshing={requestQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor="#0B927E"
          />
        }
      >
        {pendingInbound.length > 0 ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/inventory-requests/[id]",
                params: { id: pendingInbound[0].id },
              })
            }
            className="flex-row items-center gap-2.5 rounded-2xl border border-cta/30 bg-cta-light/60 p-3 active:opacity-80 dark:bg-cta/10"
          >
            <CircleAlert size={18} color="#D34D0F" />
            <Text className="flex-1 text-xs font-bold text-cta-dark">
              {t("inventoryRequest.list.pendingInbound", { count: pendingInbound.length })}
            </Text>
            <Text className="text-xs font-bold text-cta-dark">{t("rackMap.view")}</Text>
          </Pressable>
        ) : null}

        {renderList()}
      </ScrollView>
    </SafeAreaView>
  );
}
