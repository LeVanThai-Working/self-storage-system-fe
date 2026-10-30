import React, { useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, CircleAlert, Clock } from "lucide-react-native";
import {
  SupportTicketStatusEnum,
  formatDate,
  type MessageLocale,
  type TicketUserRef,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { FieldError } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";
import { formatTime } from "@/features/customer-inventory/components/MovementRow";
import {
  useCancelSupportTicket,
  useSupportTicket,
} from "@/features/support-tickets/hooks/useSupportTickets";
import { TICKET_STATUS_TONE } from "@/features/support-tickets/utils/ticketTemplates";
import { resolveRequestError } from "@/features/inventory-requests/utils/requestFormat";

function refName(ref: TicketUserRef | string | null | undefined): string | undefined {
  if (!ref) return undefined;
  return typeof ref === "string" ? undefined : ref.name;
}

function formatDateTime(iso?: string | null): string {
  return iso ? `${formatTime(iso)} ${formatDate(iso)}` : "";
}

/** H3 — support ticket detail: content, timeline, staff response, cancel while pending. */
export default function SupportTicketDetailScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const { id = "" } = useLocalSearchParams<{ id?: string }>();
  const ticketQuery = useSupportTicket(id);
  const cancelMutation = useCancelSupportTicket(id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const ticket = ticketQuery.data;

  const handleCancel = async () => {
    setError(null);
    try {
      await cancelMutation.mutateAsync(reason.trim() || undefined);
      toast.success(t("supportTicket.detail.cancelled"));
      setCancelOpen(false);
    } catch (err) {
      setError(resolveRequestError(err, currentLocale).message);
    }
  };

  if (ticketQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 gap-3 bg-neutral-bg p-4 dark:bg-neutral-950">
        <Skeleton className="h-20 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-bg p-6 dark:bg-neutral-950">
        <CircleAlert size={32} color="#EF4444" />
        <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
          {ticketQuery.error
            ? resolveRequestError(ticketQuery.error, currentLocale).message
            : t("supportTicket.loadError")}
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4 rounded-xl bg-brand px-5 py-2.5">
          <Text className="text-xs font-bold text-white">{t("common.back")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const staffName = refName(ticket.assignedStaff);
  const contract = typeof ticket.contract === "object" ? ticket.contract : null;
  const facility = typeof ticket.facility === "object" ? ticket.facility : null;
  const steps = [
    {
      done: true,
      label: t("supportTicket.detail.stepSent"),
      meta: formatDateTime(ticket.createdAt),
    },
    {
      done: ticket.status !== SupportTicketStatusEnum.PENDING,
      label:
        ticket.status === SupportTicketStatusEnum.CANCELLED
          ? t("supportTicket.detail.stepCancelled")
          : staffName
            ? t("supportTicket.detail.stepAcceptedBy", { name: staffName })
            : t("supportTicket.detail.stepAccepted"),
      meta: formatDateTime(ticket.cancelledAt),
    },
    {
      done: ticket.status === SupportTicketStatusEnum.COMPLETED,
      label: t("supportTicket.detail.stepResponded"),
      meta: formatDateTime(ticket.completedAt),
    },
  ];
  const response = ticket.staffResponse;

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="flex-row items-center gap-2 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
          <ArrowLeft size={22} color="#0B927E" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
            {t("supportTicket.detail.title")}
          </Text>
          <Text variant="muted" className="font-mono text-[11px]">
            {ticket.ticketCode}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-32"
        refreshControl={
          <RefreshControl
            refreshing={ticketQuery.isRefetching}
            onRefresh={() => void ticketQuery.refetch()}
            tintColor="#0B927E"
          />
        }
      >
        <View className="gap-2 rounded-3xl border border-neutral-border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <View className="flex-row flex-wrap items-center gap-2">
            <StatusPill
              label={t(`supportTicket.status.${ticket.status}`)}
              tone={TICKET_STATUS_TONE[ticket.status]}
            />
            <Text className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {t(`supportTicket.category.${ticket.category}`)}
            </Text>
            <Text className="rounded-full bg-brand-light px-2.5 py-0.5 text-[11px] font-bold text-brand dark:bg-brand/20">
              {t(`supportTicket.priority.${ticket.priority}`)}
            </Text>
          </View>
          <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100">
            {ticket.title}
          </Text>
          <Text className="text-xs leading-5 text-neutral-700 dark:text-neutral-200">
            {ticket.description}
          </Text>
          {ticket.attachments.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
            >
              {ticket.attachments.map((url) => (
                <Image
                  key={url}
                  source={{ uri: url }}
                  className="h-20 w-20 rounded-xl bg-neutral-100"
                />
              ))}
            </ScrollView>
          ) : null}
          {contract || facility ? (
            <Text variant="muted" className="text-[11px]">
              {[contract?.contractCode, facility?.name].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
        </View>

        <View className="gap-3 rounded-3xl border border-neutral-border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          {steps.map((step) => (
            <View key={step.label} className="flex-row items-center gap-3">
              <View
                className={cn(
                  "h-7 w-7 items-center justify-center rounded-xl",
                  step.done
                    ? "bg-brand-light dark:bg-brand/20"
                    : "bg-neutral-100 dark:bg-neutral-800"
                )}
              >
                {step.done ? (
                  <Check size={14} color="#0B927E" />
                ) : (
                  <Clock size={14} color="#94A3B8" />
                )}
              </View>
              <View className="flex-1">
                <Text
                  className={cn(
                    "text-xs font-bold",
                    step.done ? "text-neutral-dark dark:text-neutral-100" : "text-neutral-muted"
                  )}
                >
                  {step.label}
                </Text>
                {step.meta ? (
                  <Text variant="muted" className="text-[10px]">
                    {step.meta}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {response ? (
          <View className="gap-2 rounded-3xl border border-l-4 border-brand/30 border-l-brand bg-brand-bg p-4 dark:bg-brand/10">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
              {refName(response.respondedBy) ?? t("supportTicket.detail.staff")} ·{" "}
              {formatDateTime(response.respondedAt)}
            </Text>
            <Text className="text-xs leading-5 text-neutral-700 dark:text-neutral-200">
              {response.responseMessage}
            </Text>
            {response.attachments.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2"
              >
                {response.attachments.map((url) => (
                  <Image
                    key={url}
                    source={{ uri: url }}
                    className="h-20 w-20 rounded-xl bg-neutral-100"
                  />
                ))}
              </ScrollView>
            ) : null}
          </View>
        ) : null}

        {ticket.cancellationReason ? (
          <Text variant="muted" className="text-xs">
            {t("supportTicket.detail.cancelReason", { reason: ticket.cancellationReason })}
          </Text>
        ) : null}
      </ScrollView>

      {ticket.status === SupportTicketStatusEnum.PENDING ? (
        <View className="absolute bottom-0 left-0 right-0 border-t border-neutral-border bg-white px-4 pb-6 pt-3 dark:border-neutral-800 dark:bg-neutral-900">
          <Pressable onPress={() => setCancelOpen(true)} className="items-center py-2">
            <Text className="text-sm font-bold text-red-600">
              {t("supportTicket.detail.cancel")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <BottomSheet
        visible={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t("supportTicket.detail.cancelTitle")}
        closeDisabled={cancelMutation.isPending}
        footer={
          <Pressable
            onPress={() => void handleCancel()}
            disabled={cancelMutation.isPending}
            className="items-center rounded-xl bg-cta py-3 active:opacity-80"
          >
            <Text className="text-sm font-bold text-white">
              {t("supportTicket.detail.cancelConfirm")}
            </Text>
          </Pressable>
        }
      >
        <TextInput
          value={reason}
          onChangeText={setReason}
          multiline
          maxLength={500}
          placeholder={t("supportTicket.detail.cancelPlaceholder")}
          placeholderTextColor="#94A3B8"
          className="min-h-[80px] rounded-xl border border-neutral-border bg-white px-3 py-2.5 text-sm text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          style={{ textAlignVertical: "top" }}
        />
        <FieldError message={error} />
      </BottomSheet>
    </SafeAreaView>
  );
}
