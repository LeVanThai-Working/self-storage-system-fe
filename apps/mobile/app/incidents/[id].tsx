import React, { useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Box,
  Check,
  CircleAlert,
  FileText,
  MapPin,
  Phone,
  TriangleAlert,
} from "lucide-react-native";
import {
  IncidentLiablePartyEnum,
  IncidentStatusEnum,
  formatCurrency,
  formatDate,
  type MessageLocale,
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
  useCancelIncident,
  useCloseIncident,
  useIncident,
} from "@/features/incidents/hooks/useIncidents";
import {
  INCIDENT_CATEGORY_ICON,
  INCIDENT_SEVERITY_TONE,
  INCIDENT_STATUS_TONE,
  INCIDENT_STEPS,
  getIncidentStepIndex,
} from "@/features/incidents/utils/incidentFormat";
import { resolveRequestError } from "@/features/inventory-requests/utils/requestFormat";

const CANCEL_MIN = 5;

/** I2 — incident detail: stepper, assignee, investigation notes, resolution report, accept/cancel. */
export default function IncidentDetailScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const { id = "" } = useLocalSearchParams<{ id?: string }>();
  const incidentQuery = useIncident(id);
  const closeMutation = useCloseIncident(id);
  const cancelMutation = useCancelIncident(id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const incident = incidentQuery.data;

  if (incidentQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 gap-3 bg-neutral-bg p-4 dark:bg-neutral-950">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-56 w-full rounded-3xl" />
      </SafeAreaView>
    );
  }
  if (!incident) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-bg p-6 dark:bg-neutral-950">
        <CircleAlert size={32} color="#EF4444" />
        <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
          {incidentQuery.error
            ? resolveRequestError(incidentQuery.error, currentLocale).message
            : t("incident.loadError")}
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4 rounded-xl bg-brand px-5 py-2.5">
          <Text className="text-xs font-bold text-white">{t("common.back")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const CategoryIcon = INCIDENT_CATEGORY_ICON[incident.category];
  const stepIndex = getIncidentStepIndex(incident.status);
  const location = [
    incident.storageUnit?.unitNumber &&
      t("incident.form.unit", { unit: incident.storageUnit.unitNumber }),
    incident.storageRack?.rackCode &&
      t("incident.form.rack", { rack: incident.storageRack.rackCode }),
    incident.rackTier?.tierNumber && `T${String(incident.rackTier.tierNumber).padStart(2, "0")}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const resolution = incident.resolution;
  const canClose = incident.status === IncidentStatusEnum.RESOLVED;
  const canCancel = incident.status === IncidentStatusEnum.REPORTED;
  const resolvedBy =
    resolution && typeof resolution.resolvedBy === "object"
      ? resolution.resolvedBy.name
      : undefined;

  const handleClose = async () => {
    try {
      await closeMutation.mutateAsync(undefined);
      toast.success(t("incident.detail.closed"));
    } catch (err) {
      toast.error(resolveRequestError(err, currentLocale).message);
    }
  };

  const handleCancel = async () => {
    setError(null);
    if (reason.trim().length < CANCEL_MIN) {
      setError(t("incident.detail.cancelTooShort", { min: CANCEL_MIN }));
      return;
    }
    try {
      await cancelMutation.mutateAsync(reason.trim());
      toast.success(t("incident.detail.cancelled"));
      setCancelOpen(false);
    } catch (err) {
      setError(resolveRequestError(err, currentLocale).message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="flex-row items-center gap-2 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
          <ArrowLeft size={22} color="#0B927E" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
            {t("incident.detail.title")}
          </Text>
          <Text variant="muted" className="font-mono text-[11px]">
            {incident.incidentCode}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-36"
        refreshControl={
          <RefreshControl
            refreshing={incidentQuery.isRefetching}
            onRefresh={() => void incidentQuery.refetch()}
            tintColor="#0B927E"
          />
        }
      >
        <View className="gap-2 rounded-3xl border border-neutral-border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <View className="flex-row flex-wrap items-center gap-2">
            <StatusPill
              label={t(`incident.severity.${incident.severity}`)}
              tone={INCIDENT_SEVERITY_TONE[incident.severity]}
            />
            <StatusPill
              label={t(`incident.status.${incident.status}`)}
              tone={INCIDENT_STATUS_TONE[incident.status]}
            />
            <View className="flex-row items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 dark:bg-neutral-800">
              <CategoryIcon size={12} color="#647B80" />
              <Text className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300">
                {t(`incident.category.${incident.category}`)}
              </Text>
            </View>
          </View>
          <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100">
            {incident.title}
          </Text>
          {location ? (
            <View className="flex-row items-center gap-1.5">
              <MapPin size={13} color="#647B80" />
              <Text variant="muted" className="text-xs">
                {location}
              </Text>
            </View>
          ) : null}
          <Text className="text-xs leading-5 text-neutral-700 dark:text-neutral-200">
            {incident.description}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2"
          >
            {incident.images.map((url) => (
              <Image
                key={url}
                source={{ uri: url }}
                className="h-24 w-32 rounded-xl bg-neutral-100"
              />
            ))}
          </ScrollView>
        </View>

        {incident.assignedStaff ? (
          <View className="flex-row items-center gap-3 rounded-3xl border border-neutral-border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-light">
              <Text className="text-xs font-extrabold text-brand">
                {(incident.assignedStaff.name ?? "NV")
                  .split(" ")
                  .slice(-2)
                  .map((part) => part[0])
                  .join("")}
              </Text>
            </View>
            <View className="flex-1">
              <Text variant="muted" className="text-[11px]">
                {t("incident.detail.assignee")}
              </Text>
              <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                {incident.assignedStaff.name}
              </Text>
            </View>
            {incident.assignedStaff.phoneNumber ? (
              <Pressable
                onPress={() => void Linking.openURL(`tel:${incident.assignedStaff!.phoneNumber}`)}
                className="h-10 w-10 items-center justify-center rounded-xl border border-neutral-border active:opacity-70"
              >
                <Phone size={16} color="#0B927E" />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {stepIndex >= 0 ? (
          <View className="flex-row items-start justify-between px-1">
            {INCIDENT_STEPS.map((step, index) => {
              const done = index < stepIndex || (index === stepIndex && step === "closed");
              const current = index === stepIndex && step !== "closed";
              return (
                <View key={step} className="flex-1 items-center gap-1">
                  <View
                    className={cn(
                      "h-6 w-6 items-center justify-center rounded-full border-2",
                      done
                        ? "border-brand bg-brand"
                        : current
                          ? "border-blue-500 bg-blue-500"
                          : "border-neutral-300 bg-white"
                    )}
                  >
                    {done ? <Check size={12} color="#FFFFFF" /> : null}
                  </View>
                  <Text
                    className={cn(
                      "text-center text-[10px]",
                      current ? "font-bold text-blue-600" : "text-neutral-muted"
                    )}
                  >
                    {t(`incident.step.${step}`)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        {incident.investigationNotes ? (
          <View className="gap-2 rounded-3xl border border-neutral-border bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <FileText size={15} color="#647B80" />
                <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                  {t("incident.detail.investigation")}
                </Text>
              </View>
              {incident.requiresRelocation ? (
                <View className="flex-row items-center gap-1 rounded-full bg-cta-light px-2 py-0.5">
                  <TriangleAlert size={11} color="#D34D0F" />
                  <Text className="text-[10px] font-bold text-cta-dark">
                    {t("incident.detail.needsRelocation")}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text className="text-xs leading-5 text-neutral-700 dark:text-neutral-200">
              {incident.investigationNotes}
            </Text>
            {incident.requiresRelocation && incident.contract?.id ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/contracts/[id]/attention",
                    params: { id: incident.contract!.id },
                  })
                }
                className="flex-row items-center gap-2 border-t border-neutral-border pt-2 dark:border-neutral-800"
              >
                <Box size={14} color="#0B927E" />
                <Text className="text-xs font-bold text-brand">
                  {t("incident.detail.goodsInHolding")}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {resolution ? (
          <View className="gap-2 rounded-3xl border border-brand/20 bg-brand-bg p-4 dark:bg-brand/10">
            <Text className="text-sm font-bold text-brand">{t("incident.detail.resolution")}</Text>
            {(
              [
                [t("incident.detail.solution"), resolution.resolutionNotes],
                [t("incident.detail.liable"), t(`incident.liable.${resolution.liableParty}`)],
                [t("incident.detail.repairCost"), formatCurrency(resolution.repairCost)],
                [t("incident.detail.damageFee"), formatCurrency(resolution.damageFee)],
                [
                  t("incident.detail.resolvedBy"),
                  [
                    resolvedBy,
                    `${formatTime(resolution.resolvedAt)} ${formatDate(resolution.resolvedAt)}`,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                ],
              ] as const
            ).map(([label, value]) => (
              <View key={label} className="flex-row justify-between gap-3">
                <Text variant="muted" className="text-xs">
                  {label}
                </Text>
                <Text className="flex-1 text-right text-xs font-semibold text-neutral-dark dark:text-neutral-100">
                  {value}
                </Text>
              </View>
            ))}
            {resolution.liableParty === IncidentLiablePartyEnum.CUSTOMER &&
            resolution.damageFee > 0 ? (
              <Text className="text-[11px] text-red-600">{t("incident.detail.feeNote")}</Text>
            ) : null}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
            >
              {resolution.staffEvidenceImages.map((url) => (
                <Image
                  key={url}
                  source={{ uri: url }}
                  className="h-20 w-24 rounded-xl bg-neutral-100"
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {!canClose &&
        !canCancel &&
        incident.status !== IncidentStatusEnum.CLOSED &&
        incident.status !== IncidentStatusEnum.CANCELLED ? (
          <Text variant="muted" className="text-center text-xs">
            {t("incident.detail.cancelUnavailable")}
          </Text>
        ) : null}
        {incident.cancellationReason ? (
          <Text variant="muted" className="text-xs">
            {t("incident.detail.cancelReason", { reason: incident.cancellationReason })}
          </Text>
        ) : null}
      </ScrollView>

      {canClose || canCancel ? (
        <View className="absolute bottom-0 left-0 right-0 gap-1.5 border-t border-neutral-border bg-white px-4 pb-6 pt-3 dark:border-neutral-800 dark:bg-neutral-900">
          {canClose ? (
            <>
              <Text variant="muted" className="text-center text-[10px]">
                {t("incident.detail.closeHint")}
              </Text>
              <Pressable
                onPress={() => void handleClose()}
                disabled={closeMutation.isPending}
                className={cn(
                  "items-center rounded-xl bg-cta py-3.5 active:opacity-80",
                  closeMutation.isPending && "opacity-60"
                )}
              >
                <Text className="text-sm font-bold text-white">{t("incident.detail.close")}</Text>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={() => setCancelOpen(true)} className="items-center py-2">
              <Text className="text-sm font-bold text-red-600">{t("incident.detail.cancel")}</Text>
            </Pressable>
          )}
        </View>
      ) : null}

      <BottomSheet
        visible={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={t("incident.detail.cancelTitle")}
        closeDisabled={cancelMutation.isPending}
        footer={
          <Pressable
            onPress={() => void handleCancel()}
            disabled={cancelMutation.isPending}
            className="items-center rounded-xl bg-cta py-3 active:opacity-80"
          >
            <Text className="text-sm font-bold text-white">
              {t("incident.detail.cancelConfirm")}
            </Text>
          </Pressable>
        }
      >
        <TextInput
          value={reason}
          onChangeText={setReason}
          multiline
          maxLength={500}
          placeholder={t("incident.detail.cancelPlaceholder")}
          placeholderTextColor="#94A3B8"
          className="min-h-[80px] rounded-xl border border-neutral-border bg-white px-3 py-2.5 text-sm text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          style={{ textAlignVertical: "top" }}
        />
        <FieldError message={error} />
      </BottomSheet>
    </SafeAreaView>
  );
}
