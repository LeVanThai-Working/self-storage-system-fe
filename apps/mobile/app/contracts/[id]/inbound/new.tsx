import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Info, Plus, Search, Trash2, X } from "lucide-react-native";
import {
  CustomerSkuStatusEnum,
  createPreAdvisedInboundRequestSchema,
  type CreatePreAdvisedInboundRequest,
  type CustomerSkuResponse,
  type MessageLocale,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { FieldError, FieldLabel } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";
import { useContractDetail } from "@/features/contracts/hooks/useContracts";
import { useCustomerSkuList } from "@/features/customer-sku/hooks/useCustomerSkus";
import { SkuThumb } from "@/features/customer-inventory/components/SkuThumb";
import { QuantityStepper } from "@/features/customer-inventory/components/QuantityStepper";
import { getContractRequestRights } from "@/features/customer-inventory/utils/rackMapFormat";
import { useCreatePreAdvisedInbound } from "@/features/inventory-requests/hooks/useInventoryRequests";
import {
  REQUEST_VALIDITY_DAYS,
  resolveRequestError,
  validityToExpiresAt,
  type RequestValidityDays,
} from "@/features/inventory-requests/utils/requestFormat";

const MAX_LINE_QUANTITY = 9999;
const inputClass =
  "rounded-xl border border-neutral-border bg-white px-3 py-2.5 text-sm text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

/**
 * Pre-advised inbound (BE G2): the customer lists the SKUs on their way and gets a QR + OTP.
 * The deliverer shows the code at the warehouse; staff count the goods and put them away.
 */
export default function CreatePreAdvisedInboundScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const params = useLocalSearchParams<{ id?: string }>();
  const contractId = params.id ?? "";

  const contractQuery = useContractDetail(contractId);
  const contract = contractQuery.data;
  const rights = getContractRequestRights(contract?.status);
  const createMutation = useCreatePreAdvisedInbound();

  const [search, setSearch] = useState("");
  const skuQuery = useCustomerSkuList({
    status: CustomerSkuStatusEnum.ACTIVE,
    search: search.trim() || undefined,
  });
  const skus = useMemo(
    () => skuQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [skuQuery.data]
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  /** skuId → line, in the order the customer added them. */
  const [lines, setLines] = useState<Map<string, { sku: CustomerSkuResponse; quantity: number }>>(
    () => new Map()
  );
  const [deliverer, setDeliverer] = useState({ name: "", phone: "", plate: "", company: "" });
  const [validityDays, setValidityDays] = useState<RequestValidityDays>(7);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const totalQuantity = Array.from(lines.values()).reduce((sum, line) => sum + line.quantity, 0);

  const toggleSku = (sku: CustomerSkuResponse) => {
    setLines((prev) => {
      const next = new Map(prev);
      if (next.has(sku.id)) next.delete(sku.id);
      else next.set(sku.id, { sku, quantity: 1 });
      return next;
    });
  };

  const setQuantity = (skuId: string, quantity: number) => {
    setLines((prev) => {
      const line = prev.get(skuId);
      return line ? new Map(prev).set(skuId, { ...line, quantity }) : prev;
    });
  };

  const handleSubmit = async () => {
    setError(null);
    const hasDeliverer = Object.values(deliverer).some((value) => value.trim());
    const payload: CreatePreAdvisedInboundRequest = {
      contractId,
      items: Array.from(lines.values()).map((line) => ({
        skuId: line.sku.id,
        quantity: line.quantity,
      })),
      transporterInfo: hasDeliverer
        ? {
            name: deliverer.name.trim(),
            phoneNumber: deliverer.phone.trim(),
            vehiclePlate: deliverer.plate.trim() || undefined,
            deliveryCompany: deliverer.company.trim() || undefined,
          }
        : undefined,
      expiresAt: validityToExpiresAt(validityDays),
      notes: notes.trim() || undefined,
    };

    const parsed = createPreAdvisedInboundRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const path = parsed.error.issues[0]?.path[0];
      setError(
        path === "transporterInfo"
          ? t("inventoryRequest.preAdvised.delivererInvalid")
          : t("inventoryRequest.preAdvised.itemsRequired")
      );
      return;
    }

    try {
      const request = await createMutation.mutateAsync(payload);
      toast.success(t("inventoryRequest.preAdvised.created", { code: request.requestCode }));
      router.replace({ pathname: "/inventory-requests/[id]", params: { id: request.id } });
    } catch (err) {
      setError(resolveRequestError(err, currentLocale).message);
    }
  };

  const renderDelivererField = (
    key: keyof typeof deliverer,
    label: string,
    keyboardType: "default" | "phone-pad" = "default"
  ) => (
    <View className="flex-1 gap-1">
      <Text variant="muted" className="text-[11px]">
        {label}
      </Text>
      <TextInput
        value={deliverer[key]}
        onChangeText={(value) => setDeliverer((prev) => ({ ...prev, [key]: value }))}
        keyboardType={keyboardType}
        placeholderTextColor="#94A3B8"
        className={inputClass}
      />
    </View>
  );

  const submitDisabled = createMutation.isPending || lines.size === 0 || !rights.canNotifyInbound;

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="gap-0.5 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
            <X size={22} color="#0B927E" />
          </Pressable>
          <Text className="flex-1 text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
            {t("inventoryRequest.preAdvised.title")}
          </Text>
        </View>
        {contract ? (
          <Text variant="muted" className="pl-9 text-[11px]">
            {t("inventoryRequest.unitContract", {
              unit: contract.storageUnit?.unitNumber ?? "",
              code: contract.contractCode,
            })}
          </Text>
        ) : null}
      </View>

      {contractQuery.isLoading ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-32 w-full rounded-3xl" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-4 p-4 pb-32" keyboardShouldPersistTaps="handled">
          {!rights.canNotifyInbound ? (
            <View className="flex-row items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50/80 p-3 dark:border-sky-900 dark:bg-sky-950/30">
              <Info size={14} color="#0284C7" />
              <Text className="flex-1 text-xs text-sky-800 dark:text-sky-300">
                {t("inventoryRequest.preAdvised.activeOnly")}
              </Text>
            </View>
          ) : null}

          <View className="gap-2">
            <FieldLabel>
              {t("inventoryRequest.preAdvised.itemsTitle", { count: lines.size })}
            </FieldLabel>
            <View className="rounded-3xl border border-neutral-border bg-white px-3 dark:border-neutral-800 dark:bg-neutral-900">
              {lines.size === 0 ? (
                <Text variant="muted" className="py-5 text-center text-xs">
                  {t("inventoryRequest.preAdvised.noItems")}
                </Text>
              ) : (
                Array.from(lines.values()).map(({ sku, quantity }) => (
                  <View
                    key={sku.id}
                    className="flex-row items-center gap-2.5 border-b border-neutral-border py-2.5 dark:border-neutral-800"
                  >
                    <SkuThumb imageUrl={sku.imageUrl} size="sm" />
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                        {sku.skuCode}
                      </Text>
                      <Text numberOfLines={1} variant="muted" className="text-[11px]">
                        {sku.name} · {sku.uom}
                      </Text>
                    </View>
                    <QuantityStepper
                      value={quantity}
                      onChange={(qty) => setQuantity(sku.id, qty)}
                      min={1}
                      max={MAX_LINE_QUANTITY}
                    />
                    <Pressable onPress={() => toggleSku(sku)} hitSlop={8}>
                      <Trash2 size={16} color="#94A3B8" />
                    </Pressable>
                  </View>
                ))
              )}
              <Pressable
                onPress={() => setPickerOpen(true)}
                className="my-2.5 flex-row items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-brand/40 bg-brand-bg py-2.5 active:opacity-70 dark:bg-brand/10"
              >
                <Plus size={14} color="#0B927E" />
                <Text className="text-xs font-bold text-brand">
                  {t("inventoryRequest.preAdvised.addItems")}
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="gap-2">
            <FieldLabel>{t("inventoryRequest.preAdvised.delivererTitle")}</FieldLabel>
            <View className="flex-row gap-2">
              {renderDelivererField("name", t("inventoryRequest.recipient.name"))}
              {renderDelivererField("phone", t("inventoryRequest.recipient.phone"), "phone-pad")}
            </View>
            <View className="flex-row gap-2">
              {renderDelivererField("plate", t("inventoryRequest.recipient.plate"))}
              {renderDelivererField("company", t("inventoryRequest.recipient.company"))}
            </View>
          </View>

          <View className="gap-2">
            <FieldLabel>{t("inventoryRequest.preAdvised.deadline")}</FieldLabel>
            <View className="flex-row gap-2">
              {REQUEST_VALIDITY_DAYS.map((days) => (
                <Pressable
                  key={days}
                  onPress={() => setValidityDays(days)}
                  className={cn(
                    "flex-1 items-center rounded-xl border py-2.5 active:opacity-80",
                    validityDays === days
                      ? "border-brand bg-brand-bg dark:bg-brand/10"
                      : "border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-900"
                  )}
                >
                  <Text
                    className={cn(
                      "text-xs font-bold",
                      validityDays === days
                        ? "text-brand"
                        : "text-neutral-dark dark:text-neutral-200"
                    )}
                  >
                    {t("inventoryRequest.validity.days", { count: days })}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="gap-1.5">
            <FieldLabel>{t("inventoryRequest.outbound.notes")}</FieldLabel>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={500}
              placeholder={t("inventoryRequest.preAdvised.notesPlaceholder")}
              placeholderTextColor="#94A3B8"
              className={cn(inputClass, "min-h-[64px]")}
              style={{ textAlignVertical: "top" }}
            />
          </View>

          <View className="flex-row items-start gap-2 rounded-2xl border border-brand/20 bg-brand-bg p-3 dark:bg-brand/10">
            <Info size={16} color="#0B927E" />
            <Text className="flex-1 text-[11px] leading-4 text-neutral-700 dark:text-neutral-200">
              {t("inventoryRequest.preAdvised.otpHint")}
            </Text>
          </View>

          <FieldError message={error} />
        </ScrollView>
      )}

      <View className="absolute bottom-0 left-0 right-0 flex-row gap-2.5 border-t border-neutral-border bg-white px-4 pb-6 pt-3 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable
          onPress={() => router.back()}
          className="flex-1 items-center rounded-xl border border-neutral-border py-3 active:opacity-70 dark:border-neutral-700"
        >
          <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-200">
            {t("common.cancel")}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={submitDisabled}
          className={cn(
            "flex-[2] items-center rounded-xl bg-cta py-3 active:opacity-80",
            submitDisabled && "opacity-50"
          )}
        >
          <Text className="text-sm font-bold text-white">
            {createMutation.isPending
              ? t("common.loading")
              : t("inventoryRequest.preAdvised.submit", { count: totalQuantity })}
          </Text>
        </Pressable>
      </View>

      <BottomSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t("inventoryRequest.preAdvised.pickerTitle")}
        footer={
          <Pressable
            onPress={() => setPickerOpen(false)}
            className="items-center rounded-xl bg-brand py-3 active:opacity-80"
          >
            <Text className="text-sm font-bold text-white">{t("common.confirm")}</Text>
          </Pressable>
        }
      >
        <View className="flex-row items-center gap-2 rounded-xl border border-neutral-border bg-white px-3 dark:border-neutral-700 dark:bg-neutral-900">
          <Search size={14} color="#94A3B8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("inventoryRequest.preAdvised.searchPlaceholder")}
            placeholderTextColor="#94A3B8"
            className="flex-1 py-2.5 text-sm text-neutral-dark dark:text-neutral-100"
          />
        </View>
        {skuQuery.isLoading ? (
          <ActivityIndicator color="#0B927E" className="py-4" />
        ) : skus.length === 0 ? (
          <View className="items-center gap-2 py-4">
            <Text variant="muted" className="text-center text-xs">
              {t("inventoryRequest.preAdvised.noSkus")}
            </Text>
            <Pressable
              onPress={() => {
                setPickerOpen(false);
                router.push("/skus/new");
              }}
              className="rounded-xl bg-brand px-4 py-2 active:opacity-80"
            >
              <Text className="text-xs font-bold text-white">
                {t("inventoryRequest.preAdvised.createSku")}
              </Text>
            </Pressable>
          </View>
        ) : (
          skus.map((sku) => {
            const checked = lines.has(sku.id);
            return (
              <Pressable
                key={sku.id}
                onPress={() => toggleSku(sku)}
                className={cn(
                  "flex-row items-center gap-2.5 rounded-2xl border p-2.5",
                  checked
                    ? "border-brand bg-brand-bg dark:bg-brand/10"
                    : "border-neutral-border dark:border-neutral-800"
                )}
              >
                <SkuThumb imageUrl={sku.imageUrl} size="sm" />
                <View className="flex-1 gap-0.5">
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                    {sku.skuCode} · {sku.name}
                  </Text>
                  <Text variant="muted" className="text-[10px]">
                    {sku.uom}
                  </Text>
                </View>
                <View
                  className={cn(
                    "h-5 w-5 items-center justify-center rounded-md border",
                    checked ? "border-brand bg-brand" : "border-neutral-300"
                  )}
                >
                  {checked ? <Text className="text-[11px] font-bold text-white">✓</Text> : null}
                </View>
              </Pressable>
            );
          })
        )}
        {skuQuery.hasNextPage ? (
          <Pressable
            onPress={() => void skuQuery.fetchNextPage()}
            disabled={skuQuery.isFetchingNextPage}
            className="items-center py-2"
          >
            <Text className="text-xs font-bold text-brand">
              {skuQuery.isFetchingNextPage ? t("common.loading") : t("common.loadMore")}
            </Text>
          </Pressable>
        ) : null}
      </BottomSheet>
    </SafeAreaView>
  );
}
