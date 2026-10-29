import React, { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BellRing, ChevronRight, TriangleAlert, X } from "lucide-react-native";
import {
  CloudinaryFolderEnum,
  IncidentCategoryEnum,
  IncidentSeverityEnum,
  reportIncidentSchema,
  type ContractResponse,
  type MessageLocale,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { FieldError, FieldLabel } from "@/components/ui/form-field";
import { ImagePickerField } from "@/components/ui/image-picker-field";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";
import { ContractPicker } from "@/features/contracts/components/ContractPicker";
import { useContractDetail } from "@/features/contracts/hooks/useContracts";
import { useStorageUnitTree } from "@/features/customer-inventory/hooks/useCustomerInventory";
import {
  formatTierShort,
  sortTiersTopDown,
} from "@/features/customer-inventory/utils/rackMapFormat";
import { useReportIncident } from "@/features/incidents/hooks/useIncidents";
import { INCIDENT_CATEGORY_ICON } from "@/features/incidents/utils/incidentFormat";
import { resolveRequestError } from "@/features/inventory-requests/utils/requestFormat";

const SEVERITY_DOT: Record<IncidentSeverityEnum, string> = {
  [IncidentSeverityEnum.LOW]: "bg-neutral-400",
  [IncidentSeverityEnum.MEDIUM]: "bg-amber-400",
  [IncidentSeverityEnum.HIGH]: "bg-cta",
  [IncidentSeverityEnum.CRITICAL]: "bg-red-500",
};

const inputClass =
  "rounded-xl border border-neutral-border bg-white px-3 py-2.5 text-sm text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

/** I1 — customer reports an incident on a rented unit (optionally a rack / tier), with photos. */
export default function ReportIncidentScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const params = useLocalSearchParams<{ contractId?: string; rackId?: string; tierId?: string }>();

  const [contractId, setContractId] = useState(params.contractId ?? "");
  const [rackId, setRackId] = useState(params.rackId ?? "");
  const [tierId, setTierId] = useState(params.tierId ?? "");
  const [category, setCategory] = useState<IncidentCategoryEnum | null>(null);
  const [severity, setSeverity] = useState<IncidentSeverityEnum>(IncidentSeverityEnum.LOW);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const contractQuery = useContractDetail(contractId || undefined);
  const contract = contractQuery.data;
  const treeQuery = useStorageUnitTree(contract?.storageUnitId);
  const racks = treeQuery.data?.racks ?? [];
  const rack = racks.find((item) => item.id === rackId);
  const reportMutation = useReportIncident();

  const pickContract = (next: ContractResponse) => {
    setContractId(next.id);
    setRackId("");
    setTierId("");
  };

  const handleSubmit = async () => {
    setError(null);
    if (!contract) {
      setError(t("incident.form.contractRequired"));
      return;
    }
    if (!category) {
      setError(t("incident.form.categoryRequired"));
      return;
    }
    const parsed = reportIncidentSchema.safeParse({
      facilityId: contract.facilityId,
      contractId: contract.id,
      storageUnitId: contract.storageUnitId,
      storageRackId: rackId || undefined,
      rackTierId: rackId && tierId ? tierId : undefined,
      category,
      severity,
      title: title.trim(),
      description: description.trim(),
      images,
    });
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      setError(
        field === "images"
          ? t("incident.form.imagesRequired")
          : field === "title"
            ? t("incident.form.titleInvalid")
            : t("incident.form.descriptionInvalid")
      );
      return;
    }
    try {
      const incident = await reportMutation.mutateAsync(parsed.data);
      toast.success(t("incident.form.created", { code: incident.incidentCode }));
      router.replace({ pathname: "/incidents/[id]", params: { id: incident.id } });
    } catch (err) {
      setError(resolveRequestError(err, currentLocale).message);
    }
  };

  const chip = (active: boolean) =>
    cn(
      "rounded-xl border px-3 py-2",
      active
        ? "border-brand bg-brand-bg dark:bg-brand/10"
        : "border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-900"
    );

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="flex-row items-center gap-2 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
          <X size={22} color="#0B927E" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
            {t("incident.form.title")}
          </Text>
          <Text variant="muted" className="text-[11px]">
            {t("incident.form.subtitle")}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerClassName="gap-4 p-4 pb-32" keyboardShouldPersistTaps="handled">
        <View className="gap-1.5">
          <FieldLabel>{t("incident.form.contract")} *</FieldLabel>
          <ContractPicker value={contractId} onChange={pickContract} />
        </View>

        {contract ? (
          <View className="gap-2">
            <FieldLabel>{t("incident.form.location")}</FieldLabel>
            <View className="flex-row flex-wrap items-center gap-1.5">
              <View className={chip(true)}>
                <Text className="text-xs font-bold text-brand">
                  {t("incident.form.unit", { unit: contract.storageUnit?.unitNumber ?? "" })}
                </Text>
              </View>
              {racks.length > 0 ? (
                <>
                  <ChevronRight size={14} color="#94A3B8" />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="gap-1.5"
                  >
                    {racks.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          setRackId(item.id === rackId ? "" : item.id);
                          setTierId("");
                        }}
                        className={chip(item.id === rackId)}
                      >
                        <Text
                          className={cn(
                            "text-xs font-bold",
                            item.id === rackId ? "text-brand" : "text-neutral-600"
                          )}
                        >
                          {t("incident.form.rack", { rack: item.rackCode })}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              ) : null}
            </View>
            {rack ? (
              <View className="flex-row flex-wrap gap-1.5">
                {sortTiersTopDown(rack.tiers).map((tier) => (
                  <Pressable
                    key={tier.id}
                    onPress={() => setTierId(tier.id === tierId ? "" : tier.id)}
                    className={chip(tier.id === tierId)}
                  >
                    <Text
                      className={cn(
                        "text-xs font-bold",
                        tier.id === tierId ? "text-brand" : "text-neutral-600"
                      )}
                    >
                      {formatTierShort(tier.tierNumber)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <Text variant="muted" className="text-[11px]">
              {t("incident.form.locationHint")}
            </Text>
          </View>
        ) : null}

        <View className="gap-2">
          <FieldLabel>{t("incident.form.category")} *</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {Object.values(IncidentCategoryEnum).map((value) => {
              const Icon = INCIDENT_CATEGORY_ICON[value];
              const active = value === category;
              return (
                <Pressable
                  key={value}
                  onPress={() => setCategory(value)}
                  className={cn(
                    "w-[31.5%] items-center gap-1.5 rounded-2xl border py-3",
                    active
                      ? "border-brand bg-brand-bg dark:bg-brand/10"
                      : "border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-900"
                  )}
                >
                  <Icon size={22} color={active ? "#0B927E" : "#647B80"} />
                  <Text
                    className={cn(
                      "text-xs font-bold",
                      active ? "text-brand" : "text-neutral-600 dark:text-neutral-300"
                    )}
                  >
                    {t(`incident.category.${value}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <FieldLabel>{t("incident.form.severity")}</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {Object.values(IncidentSeverityEnum).map((value) => {
              const active = value === severity;
              const critical = value === IncidentSeverityEnum.CRITICAL;
              return (
                <Pressable
                  key={value}
                  onPress={() => setSeverity(value)}
                  className={cn(
                    "flex-row items-center gap-1.5 rounded-xl border px-3 py-2",
                    active
                      ? critical
                        ? "border-red-400 bg-red-50"
                        : "border-cta bg-cta-light/60"
                      : "border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-900"
                  )}
                >
                  {critical ? (
                    <BellRing size={13} color="#DC2626" />
                  ) : (
                    <View className={cn("h-2.5 w-2.5 rounded-full", SEVERITY_DOT[value])} />
                  )}
                  <Text className="text-xs font-bold text-neutral-700 dark:text-neutral-200">
                    {t(`incident.severity.${value}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text variant="muted" className="text-[11px]">
            {t("incident.form.criticalHint")}
          </Text>
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("incident.form.titleLabel")} *</FieldLabel>
          <TextInput
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            placeholder={t("incident.form.titlePlaceholder")}
            placeholderTextColor="#94A3B8"
            className={inputClass}
          />
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("incident.form.description")} *</FieldLabel>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={2000}
            placeholder={t("incident.form.descriptionPlaceholder")}
            placeholderTextColor="#94A3B8"
            className={cn(inputClass, "min-h-[84px]")}
            style={{ textAlignVertical: "top" }}
          />
        </View>

        <View className="gap-1.5">
          <FieldLabel>{t("incident.form.images")} *</FieldLabel>
          <ImagePickerField
            value={images}
            onChange={setImages}
            folder={CloudinaryFolderEnum.INCIDENTS}
            max={5}
          />
        </View>

        <View className="flex-row items-start gap-2 rounded-2xl border border-cta/30 bg-cta-light/60 p-3 dark:bg-cta/10">
          <TriangleAlert size={16} color="#D34D0F" />
          <Text className="flex-1 text-[11px] leading-4 text-cta-dark">
            {t("incident.form.holdingHint")}
          </Text>
        </View>

        <FieldError message={error} />
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-neutral-border bg-white px-4 pb-6 pt-3 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable
          onPress={() => void handleSubmit()}
          disabled={reportMutation.isPending}
          className={cn(
            "items-center rounded-xl bg-cta py-3.5 active:opacity-80",
            reportMutation.isPending && "opacity-60"
          )}
        >
          <Text className="text-sm font-bold text-white">
            {reportMutation.isPending ? t("common.loading") : t("incident.form.submit")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
