import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Inbox,
  MessageCircleMore,
  Plus,
  Tag,
  TriangleAlert,
} from "lucide-react-native";
import {
  IncidentStatusEnum,
  SupportTicketStatusEnum,
  type IncidentResponse,
  type SupportTicketResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { FilterChips, type FilterChipOption } from "@/components/ui/filter-chips";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { formatTime } from "@/features/customer-inventory/components/MovementRow";
import { useSupportTicketList } from "@/features/support-tickets/hooks/useSupportTickets";
import { TICKET_STATUS_TONE } from "@/features/support-tickets/utils/ticketTemplates";
import { useIncidentList } from "@/features/incidents/hooks/useIncidents";
import {
  INCIDENT_CATEGORY_ICON,
  INCIDENT_SEVERITY_TONE,
  INCIDENT_STATUS_TONE,
} from "@/features/incidents/utils/incidentFormat";

type Segment = "tickets" | "incidents";
type TicketFilter = "all" | SupportTicketStatusEnum;
type IncidentFilter = "all" | "open" | IncidentStatusEnum.RESOLVED | IncidentStatusEnum.CLOSED;

const formatWhen = (iso: string) => {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} · ${formatTime(iso)}`;
};

/** H1 — Support tab: support requests and incident reports of the customer, with quick create. */
export default function SupportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [segment, setSegment] = useState<Segment>("tickets");
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>("all");
  const [incidentFilter, setIncidentFilter] = useState<IncidentFilter>("all");

  const ticketsQuery = useSupportTicketList(
    { status: ticketFilter === "all" ? undefined : ticketFilter },
    segment === "tickets"
  );
  const incidentsQuery = useIncidentList(
    {
      status:
        incidentFilter === IncidentStatusEnum.RESOLVED ||
        incidentFilter === IncidentStatusEnum.CLOSED
          ? incidentFilter
          : undefined,
    },
    segment === "incidents"
  );
  const ticketCountQuery = useSupportTicketList({});
  const incidentCountQuery = useIncidentList({});

  const tickets = useMemo(
    () => ticketsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [ticketsQuery.data]
  );
  const incidents = useMemo(() => {
    const items = incidentsQuery.data?.pages.flatMap((page) => page.items) ?? [];
    if (incidentFilter !== "open") return items;
    return items.filter(
      (item) =>
        item.status !== IncidentStatusEnum.RESOLVED &&
        item.status !== IncidentStatusEnum.CLOSED &&
        item.status !== IncidentStatusEnum.CANCELLED
    );
  }, [incidentsQuery.data, incidentFilter]);

  const ticketTotal = ticketCountQuery.data?.pages[0]?.pagination.totalItems;
  const incidentTotal = incidentCountQuery.data?.pages[0]?.pagination.totalItems;

  const ticketFilters: FilterChipOption<TicketFilter>[] = [
    { key: "all", label: t("supportHub.filter.all") },
    { key: SupportTicketStatusEnum.PENDING, label: t("supportTicket.status.pending") },
    { key: SupportTicketStatusEnum.PROCESSING, label: t("supportTicket.status.processing") },
    { key: SupportTicketStatusEnum.COMPLETED, label: t("supportTicket.status.completed") },
  ];
  const incidentFilters: FilterChipOption<IncidentFilter>[] = [
    { key: "all", label: t("supportHub.filter.all") },
    { key: "open", label: t("supportHub.filter.open") },
    { key: IncidentStatusEnum.RESOLVED, label: t("incident.status.resolved") },
    { key: IncidentStatusEnum.CLOSED, label: t("incident.status.closed") },
  ];

  const activeQuery = segment === "tickets" ? ticketsQuery : incidentsQuery;

  const renderTicket = (ticket: SupportTicketResponse) => (
    <Pressable
      onPress={() => router.push({ pathname: "/support-tickets/[id]", params: { id: ticket.id } })}
      className="gap-2 rounded-3xl border border-neutral-border bg-white p-4 active:opacity-80 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-light/60 dark:bg-brand/20">
          <MessageCircleMore size={18} color="#0B927E" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-mono text-[11px] text-neutral-muted">{ticket.ticketCode}</Text>
          <Text
            numberOfLines={1}
            className="text-sm font-bold text-neutral-dark dark:text-neutral-100"
          >
            {ticket.title}
          </Text>
          <Text numberOfLines={2} variant="muted" className="text-xs">
            {ticket.description}
          </Text>
        </View>
        <StatusPill
          label={t(`supportTicket.status.${ticket.status}`)}
          tone={TICKET_STATUS_TONE[ticket.status]}
        />
      </View>
      <View className="flex-row flex-wrap items-center gap-2 border-t border-neutral-border pt-2 dark:border-neutral-800">
        <View className="flex-row items-center gap-1 rounded-full bg-brand-light/50 px-2 py-0.5">
          <Tag size={11} color="#0B927E" />
          <Text className="text-[10px] font-bold text-brand">
            {t(`supportTicket.category.${ticket.category}`)}
          </Text>
        </View>
        <Text className="text-[10px] font-bold text-neutral-600">
          {t(`supportTicket.priority.${ticket.priority}`)}
        </Text>
        <Text variant="muted" className="ml-auto text-[10px]">
          {ticket.staffResponse ? t("supportHub.hasResponse") : formatWhen(ticket.createdAt)}
        </Text>
      </View>
    </Pressable>
  );

  const renderIncident = (incident: IncidentResponse) => {
    const Icon = INCIDENT_CATEGORY_ICON[incident.category];
    return (
      <Pressable
        onPress={() => router.push({ pathname: "/incidents/[id]", params: { id: incident.id } })}
        className="flex-row items-start gap-3 rounded-3xl border border-neutral-border bg-white p-4 active:opacity-80 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/40">
          <Icon size={18} color="#DC2626" />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="font-mono text-[11px] text-neutral-muted">{incident.incidentCode}</Text>
          <Text
            numberOfLines={1}
            className="text-sm font-bold text-neutral-dark dark:text-neutral-100"
          >
            {incident.title}
          </Text>
          <Text numberOfLines={2} variant="muted" className="text-xs">
            {incident.description}
          </Text>
          <Text variant="muted" className="text-[10px]">
            {formatWhen(incident.createdAt)}
          </Text>
        </View>
        <View className="items-end gap-1">
          <StatusPill
            label={t(`incident.severity.${incident.severity}`)}
            tone={INCIDENT_SEVERITY_TONE[incident.severity]}
          />
          <StatusPill
            label={t(`incident.status.${incident.status}`)}
            tone={INCIDENT_STATUS_TONE[incident.status]}
          />
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () =>
    activeQuery.isLoading ? (
      <View className="gap-3">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-28 w-full rounded-3xl" />
      </View>
    ) : (
      <View className="items-center rounded-3xl border border-neutral-border bg-white p-8 dark:border-neutral-800 dark:bg-neutral-900">
        <Inbox size={28} color="#647B80" />
        <Text variant="muted" className="mt-2 text-center text-xs">
          {segment === "tickets" ? t("supportHub.emptyTickets") : t("supportHub.emptyIncidents")}
        </Text>
      </View>
    );

  const header = (
    <View className="gap-4 pb-1">
      <View>
        <Text variant="heading2" className="font-bold text-neutral-dark dark:text-neutral-100">
          {t("customerTabs.supportTitle")}
        </Text>
        <Text variant="muted" className="mt-1 text-sm">
          {t("supportHub.subtitle")}
        </Text>
      </View>

      <View className="flex-row gap-3">
        <Pressable
          onPress={() => router.push("/support-tickets/new")}
          className="flex-1 gap-2 rounded-3xl border border-brand/20 bg-brand-bg p-4 active:opacity-80 dark:bg-brand/10"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-light">
            <MessageCircleMore size={18} color="#0B927E" />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-brand">{t("supportHub.newTicket")}</Text>
            <ChevronRight size={16} color="#0B927E" />
          </View>
          <Text variant="muted" numberOfLines={1} className="text-[11px]">
            {t("supportHub.newTicketHint")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/incidents/new")}
          className="flex-1 gap-2 rounded-3xl border border-cta/30 bg-cta-light/60 p-4 active:opacity-80 dark:bg-cta/10"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-cta-light">
            <TriangleAlert size={18} color="#E1601C" />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-cta-dark">{t("supportHub.newIncident")}</Text>
            <ChevronRight size={16} color="#D34D0F" />
          </View>
          <Text variant="muted" numberOfLines={1} className="text-[11px]">
            {t("supportHub.newIncidentHint")}
          </Text>
        </Pressable>
      </View>

      <View className="flex-row rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-800">
        {(["tickets", "incidents"] as const).map((key) => (
          <Pressable
            key={key}
            onPress={() => setSegment(key)}
            className={cn(
              "flex-1 items-center rounded-xl py-2.5",
              segment === key && "bg-white shadow-sm dark:bg-neutral-900"
            )}
          >
            <Text
              className={cn(
                "text-sm font-bold",
                segment === key ? "text-brand" : "text-neutral-muted"
              )}
            >
              {t(`supportHub.segment.${key}`, {
                count: (key === "tickets" ? ticketTotal : incidentTotal) ?? "…",
              })}
            </Text>
          </Pressable>
        ))}
      </View>

      {segment === "tickets" ? (
        <FilterChips options={ticketFilters} value={ticketFilter} onChange={setTicketFilter} />
      ) : (
        <FilterChips
          options={incidentFilters}
          value={incidentFilter}
          onChange={setIncidentFilter}
        />
      )}
    </View>
  );

  const loadMore = () => {
    if (activeQuery.hasNextPage && !activeQuery.isFetchingNextPage)
      void activeQuery.fetchNextPage();
  };

  return (
    <SafeAreaView edges={["bottom"]} className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {segment === "tickets" ? (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderTicket(item)}
          ListHeaderComponent={header}
          ListEmptyComponent={renderEmpty}
          contentContainerClassName="gap-3 p-4 pb-28"
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListFooterComponent={
            ticketsQuery.isFetchingNextPage ? <ActivityIndicator color="#0B927E" /> : null
          }
          refreshControl={
            <RefreshControl
              refreshing={ticketsQuery.isRefetching}
              onRefresh={() => void ticketsQuery.refetch()}
              tintColor="#0B927E"
            />
          }
        />
      ) : (
        <FlatList
          data={incidents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderIncident(item)}
          ListHeaderComponent={header}
          ListEmptyComponent={renderEmpty}
          contentContainerClassName="gap-3 p-4 pb-28"
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListFooterComponent={
            incidentsQuery.isFetchingNextPage ? <ActivityIndicator color="#0B927E" /> : null
          }
          refreshControl={
            <RefreshControl
              refreshing={incidentsQuery.isRefetching}
              onRefresh={() => void incidentsQuery.refetch()}
              tintColor="#0B927E"
            />
          }
        />
      )}

      <Pressable
        onPress={() =>
          router.push(segment === "tickets" ? "/support-tickets/new" : "/incidents/new")
        }
        accessibilityLabel={
          segment === "tickets" ? t("supportHub.newTicket") : t("supportHub.newIncident")
        }
        className="absolute bottom-6 right-5 h-14 w-14 items-center justify-center rounded-full bg-cta shadow-lg active:opacity-80"
      >
        <Plus size={26} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}
