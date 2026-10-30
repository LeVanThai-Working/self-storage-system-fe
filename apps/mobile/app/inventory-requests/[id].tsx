import React, { useEffect, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, Share, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import {
  ArrowLeft,
  Check,
  CircleAlert,
  Clock,
  Lock,
  RefreshCw,
  Share2,
  Truck,
} from "lucide-react-native";
import {
  InventoryRequestStatusEnum,
  InventoryRequestTypeEnum,
  formatDate,
  type InventoryRequestResponse,
  type MessageLocale,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { StatusPill } from "@/components/ui/status-pill";
import { FieldError } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";
import { formatTime } from "@/features/customer-inventory/components/MovementRow";
import {
  useCancelInboundRequest,
  useCancelOutboundRequest,
  useConfirmInboundRequest,
  useDisputeInboundRequest,
  useInventoryRequest,
  useRegenerateOtp,
} from "@/features/inventory-requests/hooks/useInventoryRequests";
import { usePickupOtpStore } from "@/features/inventory-requests/stores/pickupOtp.store";
import {
  REQUEST_STATUS_TONE,
  formatCountdown,
  formatItemPosition,
  isPreAdvisedInbound,
  resolveRequestError,
  sumRequestQuantity,
} from "@/features/inventory-requests/utils/requestFormat";

/** BE auto-confirms an inbound request 24h after staff create it. */
const INBOUND_AUTO_CONFIRM_MS = 24 * 60 * 60 * 1000;
const DISPUTE_MIN_LENGTH = 5;

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

function formatDateTime(iso?: string | null): string {
  return iso ? `${formatTime(iso)} ${formatDate(iso)}` : "";
}

/**
 * C6 (outbound: QR + OTP), pre-advised inbound (QR + OTP until the goods arrive) and C7
 * (staff-assisted inbound: confirm or dispute) request detail.
 */
export default function InventoryRequestDetailScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const { id = "" } = useLocalSearchParams<{ id?: string }>();

  const requestQuery = useInventoryRequest(id);
  const request = requestQuery.data;
  const otp = usePickupOtpStore((state) => state.otpByRequestId[id]);
  const cancelOutboundMutation = useCancelOutboundRequest(id);
  const cancelInboundMutation = useCancelInboundRequest(id);
  const regenerateMutation = useRegenerateOtp(id);
  const confirmMutation = useConfirmInboundRequest(id);
  const disputeMutation = useDisputeInboundRequest(id);

  const [sheet, setSheet] = useState<"cancel" | "dispute" | null>(null);
  const [reason, setReason] = useState("");
  const [sheetError, setSheetError] = useState<string | null>(null);

  const isOutbound = request?.type === InventoryRequestTypeEnum.OUTBOUND;
  const isPreAdvised = !isOutbound && Boolean(request && isPreAdvisedInbound(request));
  /** Outbound and pre-advised requests both wait at `pending` behind a one-time QR + OTP. */
  const usesCode = isOutbound || isPreAdvised;
  const cancelMutation = isOutbound ? cancelOutboundMutation : cancelInboundMutation;
  const status = request?.status;
  const ticking =
    status === InventoryRequestStatusEnum.PENDING ||
    status === InventoryRequestStatusEnum.PENDING_CUSTOMER_CONFIRMATION;
  const now = useNow(ticking);

  const closeSheet = () => {
    setSheet(null);
    setReason("");
    setSheetError(null);
  };

  const handleShare = async (req: InventoryRequestResponse) => {
    await Share.share({
      message: t(
        isPreAdvised
          ? "inventoryRequest.preAdvised.shareMessage"
          : "inventoryRequest.pickup.shareMessage",
        {
          code: req.requestCode,
          otp: otp ?? "—",
          facility: req.facilityName ?? "",
        }
      ),
    });
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(reason.trim() || undefined);
      toast.success(
        t(
          isPreAdvised
            ? "inventoryRequest.preAdvised.cancelled"
            : "inventoryRequest.pickup.cancelled"
        )
      );
      closeSheet();
    } catch (error) {
      setSheetError(resolveRequestError(error, currentLocale).message);
    }
  };

  const handleDispute = async () => {
    if (reason.trim().length < DISPUTE_MIN_LENGTH) {
      setSheetError(t("inventoryRequest.inbound.disputeTooShort"));
      return;
    }
    try {
      await disputeMutation.mutateAsync(reason.trim());
      toast.success(t("inventoryRequest.inbound.disputed"));
      closeSheet();
    } catch (error) {
      setSheetError(resolveRequestError(error, currentLocale).message);
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerateMutation.mutateAsync();
      toast.success(t("inventoryRequest.pickup.otpRegenerated"));
    } catch (error) {
      toast.error(resolveRequestError(error, currentLocale).message);
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmMutation.mutateAsync();
      toast.success(t("inventoryRequest.inbound.confirmed"));
    } catch (error) {
      toast.error(resolveRequestError(error, currentLocale).message);
    }
  };

  if (requestQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 gap-3 bg-neutral-bg p-4 dark:bg-neutral-950">
        <Skeleton className="h-16 w-full rounded-3xl" />
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-bg p-6 dark:bg-neutral-950">
        <CircleAlert size={32} color="#EF4444" />
        <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
          {requestQuery.error
            ? resolveRequestError(requestQuery.error, currentLocale).message
            : t("inventoryRequest.loadError")}
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4 rounded-xl bg-brand px-5 py-2.5">
          <Text className="text-xs font-bold text-white">{t("common.back")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const countdown = usesCode
    ? formatCountdown(request.expiresAt, now)
    : formatCountdown(
        new Date(new Date(request.createdAt).getTime() + INBOUND_AUTO_CONFIRM_MS).toISOString(),
        now
      );
  const totalQuantity = sumRequestQuantity(request.items);

  const renderTimeline = () => {
    const steps = isPreAdvised
      ? [
          {
            done: true,
            label: t("inventoryRequest.timeline.preAdvised"),
            meta: formatDateTime(request.createdAt),
          },
          {
            done: Boolean(request.verifiedAt),
            label: t("inventoryRequest.timeline.arrived"),
            meta: formatDateTime(request.verifiedAt),
          },
          {
            done: status === InventoryRequestStatusEnum.COMPLETED,
            label: t("inventoryRequest.timeline.putaway"),
            meta: formatDateTime(request.completedAt),
          },
        ]
      : isOutbound
        ? [
            {
              done: true,
              label: t("inventoryRequest.timeline.created"),
              meta: formatDateTime(request.createdAt),
            },
            {
              done: Boolean(request.verifiedAt),
              label: t("inventoryRequest.timeline.verified"),
              meta: formatDateTime(request.verifiedAt),
            },
            {
              done: status === InventoryRequestStatusEnum.COMPLETED,
              label: t("inventoryRequest.timeline.handedOver"),
              meta: formatDateTime(request.completedAt),
            },
          ]
        : [
            {
              done: true,
              label: t("inventoryRequest.timeline.received"),
              meta: formatDateTime(request.createdAt),
            },
            {
              done:
                status === InventoryRequestStatusEnum.READY_TO_PUTAWAY ||
                status === InventoryRequestStatusEnum.COMPLETED,
              label: request.isAutoConfirmed
                ? t("inventoryRequest.timeline.autoConfirmed")
                : t("inventoryRequest.timeline.confirmed"),
              meta: "",
            },
            {
              done: status === InventoryRequestStatusEnum.COMPLETED,
              label: t("inventoryRequest.timeline.putaway"),
              meta: formatDateTime(request.completedAt),
            },
          ];
    return (
      <View className="gap-3 rounded-3xl border border-neutral-border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        {steps.map((step) => (
          <View key={step.label} className="flex-row items-center gap-3">
            <View
              className={cn(
                "h-7 w-7 items-center justify-center rounded-xl",
                step.done ? "bg-brand-light dark:bg-brand/20" : "bg-neutral-100 dark:bg-neutral-800"
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
    );
  };

  const renderItems = () => (
    <View className="rounded-3xl border border-neutral-border bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
      {request.items.map((item) => (
        <View
          key={`${item.skuId}-${item.rackTierId ?? "none"}`}
          className="flex-row items-center gap-3 border-b border-neutral-border py-2.5 dark:border-neutral-800"
        >
          <View className="flex-1">
            <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
              {item.skuCode ?? item.skuId}
            </Text>
            <Text variant="muted" className="text-[11px]">
              {[item.name, formatItemPosition(item)].filter(Boolean).join(" · ")}
            </Text>
          </View>
          <Text className="text-xs font-extrabold text-neutral-dark dark:text-neutral-100">
            {item.actualQuantity !== undefined && item.actualQuantity !== item.quantity
              ? `${item.actualQuantity}/${item.quantity}`
              : item.quantity}{" "}
            {item.uom ?? ""}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderCode = () => {
    if (status === InventoryRequestStatusEnum.PENDING && request.pickupQrPayload) {
      return (
        <View className="items-center gap-2 rounded-3xl border border-neutral-border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <View className="rounded-2xl bg-white p-2">
            <QRCode value={request.pickupQrPayload} size={180} />
          </View>
          <Text variant="muted" className="text-xs font-bold">
            {t("inventoryRequest.pickup.otpLabel")}
          </Text>
          {otp ? (
            <>
              <Text className="text-3xl font-black tracking-[8px] text-neutral-dark dark:text-neutral-100">
                {otp}
              </Text>
              <Text className="text-center text-[11px] text-cta-dark">
                {t("inventoryRequest.pickup.otpOnce")}
              </Text>
            </>
          ) : (
            <Text variant="muted" className="text-center text-[11px]">
              {t("inventoryRequest.pickup.otpHidden")}
            </Text>
          )}
          <Pressable
            onPress={() => void handleRegenerate()}
            disabled={regenerateMutation.isPending}
            className={cn(
              "mt-1 flex-row items-center gap-1.5 rounded-xl border border-brand/30 px-3 py-2 active:opacity-70",
              regenerateMutation.isPending && "opacity-50"
            )}
          >
            <RefreshCw size={13} color="#0B927E" />
            <Text className="text-xs font-bold text-brand">
              {t("inventoryRequest.pickup.regenerateOtp")}
            </Text>
          </Pressable>
        </View>
      );
    }
    if (status === InventoryRequestStatusEnum.PROCESSING) {
      return (
        <View className="flex-row items-start gap-2 rounded-2xl border border-cta/30 bg-cta-light/60 p-3 dark:bg-cta/10">
          <Lock size={14} color="#D34D0F" />
          <Text className="flex-1 text-xs text-cta-dark">
            {isPreAdvised
              ? t("inventoryRequest.preAdvised.processingBanner")
              : t("inventoryRequest.pickup.processingBanner")}
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderInboundEvidence = () => (
    <View className="gap-2">
      <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
        {t("inventoryRequest.inbound.evidence", { count: request.evidenceImages?.length ?? 0 })}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2"
      >
        {(request.evidenceImages ?? []).map((url) => (
          <Image key={url} source={{ uri: url }} className="h-20 w-24 rounded-xl bg-neutral-100" />
        ))}
      </ScrollView>
    </View>
  );

  const pendingConfirmation = status === InventoryRequestStatusEnum.PENDING_CUSTOMER_CONFIRMATION;
  const canCancel = usesCode && status === InventoryRequestStatusEnum.PENDING;

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="flex-row items-center gap-2 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
          <ArrowLeft size={22} color="#0B927E" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
            {isOutbound
              ? t("inventoryRequest.pickup.title")
              : isPreAdvised
                ? t("inventoryRequest.preAdvised.detailTitle")
                : t("inventoryRequest.inbound.title")}
          </Text>
          <Text variant="muted" className="font-mono text-[11px]">
            {request.requestCode}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-36"
        refreshControl={
          <RefreshControl
            refreshing={requestQuery.isRefetching}
            onRefresh={() => void requestQuery.refetch()}
            tintColor="#0B927E"
          />
        }
      >
        <View className="flex-row items-center justify-between">
          <StatusPill
            label={t(`inventoryRequest.status.${request.status}`)}
            tone={REQUEST_STATUS_TONE[request.status]}
          />
          {countdown && (canCancel || pendingConfirmation) ? (
            <Text className="text-xs font-bold text-amber-700">
              {usesCode
                ? t("inventoryRequest.pickup.expiresIn", { time: countdown })
                : t("inventoryRequest.inbound.autoConfirmIn", { time: countdown })}
            </Text>
          ) : null}
        </View>

        {usesCode ? renderCode() : null}

        {!isOutbound && pendingConfirmation ? (
          <View className="flex-row items-start gap-2 rounded-2xl border border-cta/30 bg-cta-light/60 p-3 dark:bg-cta/10">
            <CircleAlert size={14} color="#D34D0F" />
            <Text className="flex-1 text-xs text-cta-dark">
              {t("inventoryRequest.inbound.notCountedYet")}
            </Text>
          </View>
        ) : null}

        {!isOutbound && (!isPreAdvised || request.evidenceImages?.length)
          ? renderInboundEvidence()
          : null}

        <View className="gap-2">
          <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {t("inventoryRequest.itemsSummary", {
              count: request.items.length,
              qty: totalQuantity,
            })}
          </Text>
          {renderItems()}
        </View>

        {request.transporterInfo ? (
          <View className="flex-row items-start gap-3 rounded-3xl border border-neutral-border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <Truck size={16} color="#647B80" />
            <View className="flex-1 gap-0.5">
              <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                {isOutbound
                  ? t("inventoryRequest.recipient.title")
                  : t("inventoryRequest.inbound.deliverer")}
              </Text>
              <Text className="text-xs text-neutral-700 dark:text-neutral-200">
                {[
                  request.transporterInfo.name,
                  request.transporterInfo.phoneNumber,
                  request.transporterInfo.vehiclePlate,
                  request.transporterInfo.deliveryCompany,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              {request.staffNotes ? (
                <Text variant="muted" className="text-[11px]">
                  {request.staffNotes}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {request.discrepancyReason ? (
          <View className="rounded-2xl border border-cta/30 bg-cta-light/60 p-3 dark:bg-cta/10">
            <Text className="text-xs font-bold text-cta-dark">
              {t("inventoryRequest.discrepancy", { reason: request.discrepancyReason })}
            </Text>
          </View>
        ) : null}

        {isOutbound &&
        status === InventoryRequestStatusEnum.COMPLETED &&
        request.evidenceImages?.length
          ? renderInboundEvidence()
          : null}

        {renderTimeline()}
      </ScrollView>

      {canCancel ? (
        <View className="absolute bottom-0 left-0 right-0 gap-2 border-t border-neutral-border bg-white px-4 pb-6 pt-3 dark:border-neutral-800 dark:bg-neutral-900">
          <Pressable
            onPress={() => void handleShare(request)}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-cta py-3 active:opacity-80"
          >
            <Share2 size={15} color="#FFFFFF" />
            <Text className="text-sm font-bold text-white">
              {isPreAdvised
                ? t("inventoryRequest.preAdvised.share")
                : t("inventoryRequest.pickup.share")}
            </Text>
          </Pressable>
          <Pressable onPress={() => setSheet("cancel")} className="items-center py-1.5">
            <Text className="text-xs font-bold text-red-600">
              {t("inventoryRequest.pickup.cancel")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {!isOutbound && pendingConfirmation ? (
        <View className="absolute bottom-0 left-0 right-0 flex-row gap-2.5 border-t border-neutral-border bg-white px-4 pb-6 pt-3 dark:border-neutral-800 dark:bg-neutral-900">
          <Pressable
            onPress={() => setSheet("dispute")}
            className="flex-1 items-center rounded-xl border border-red-200 py-3 active:opacity-70 dark:border-red-900"
          >
            <Text className="text-sm font-bold text-red-600">
              {t("inventoryRequest.inbound.dispute")}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void handleConfirm()}
            disabled={confirmMutation.isPending}
            className={cn(
              "flex-[1.4] items-center rounded-xl bg-cta py-3 active:opacity-80",
              confirmMutation.isPending && "opacity-60"
            )}
          >
            <Text className="text-sm font-bold text-white">
              {t("inventoryRequest.inbound.confirm")}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <BottomSheet
        visible={sheet !== null}
        onClose={closeSheet}
        title={
          sheet === "dispute"
            ? t("inventoryRequest.inbound.disputeTitle")
            : isPreAdvised
              ? t("inventoryRequest.preAdvised.cancelTitle")
              : t("inventoryRequest.pickup.cancelTitle")
        }
        closeDisabled={cancelMutation.isPending || disputeMutation.isPending}
        footer={
          <Pressable
            onPress={() => void (sheet === "dispute" ? handleDispute() : handleCancel())}
            disabled={cancelMutation.isPending || disputeMutation.isPending}
            className="items-center rounded-xl bg-cta py-3 active:opacity-80"
          >
            <Text className="text-sm font-bold text-white">
              {sheet === "dispute"
                ? t("inventoryRequest.inbound.disputeSubmit")
                : t("inventoryRequest.pickup.cancelSubmit")}
            </Text>
          </Pressable>
        }
      >
        <TextInput
          value={reason}
          onChangeText={setReason}
          multiline
          maxLength={sheet === "dispute" ? 1000 : 500}
          placeholder={
            sheet === "dispute"
              ? t("inventoryRequest.inbound.disputePlaceholder")
              : t("inventoryRequest.pickup.cancelPlaceholder")
          }
          placeholderTextColor="#94A3B8"
          className="min-h-[88px] rounded-xl border border-neutral-border bg-white px-3 py-2.5 text-sm text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          style={{ textAlignVertical: "top" }}
        />
        <FieldError message={sheetError} />
      </BottomSheet>
    </SafeAreaView>
  );
}
