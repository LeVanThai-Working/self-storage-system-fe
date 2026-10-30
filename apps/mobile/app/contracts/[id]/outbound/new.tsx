import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Info, Plus, Trash2, X } from "lucide-react-native";
import {
  createOutboundRequestSchema,
  type CreateOutboundRequest,
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
import { useStorageUnitTree } from "@/features/customer-inventory/hooks/useCustomerInventory";
import { SkuThumb } from "@/features/customer-inventory/components/SkuThumb";
import { QuantityStepper } from "@/features/customer-inventory/components/QuantityStepper";
import { ItemStatusBadge } from "@/features/customer-inventory/components/ItemStatusBadge";
import {
  canRequestOutboundItem,
  formatTierShort,
  getAvailableQuantity,
  getContractRequestRights,
  listTreePositions,
  type TreePosition,
} from "@/features/customer-inventory/utils/rackMapFormat";
import { useCreateOutboundRequest } from "@/features/inventory-requests/hooks/useInventoryRequests";
import {
  REQUEST_VALIDITY_DAYS,
  resolveRequestError,
  validityToExpiresAt,
  type RequestValidityDays,
} from "@/features/inventory-requests/utils/requestFormat";

/** Normal items with stock not already held by another pending request. */
const canPick = (position: TreePosition) =>
  canRequestOutboundItem(position.item) && getAvailableQuantity(position.item) > 0;

const inputClass =
  "rounded-xl border border-neutral-border bg-white px-3 py-2.5 text-sm text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

/** C5 — customer creates an outbound (pickup) request; staff hand the goods over. */
export default function CreateOutboundRequestScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const params = useLocalSearchParams<{ id?: string; tierId?: string; skuId?: string }>();
  const contractId = params.id ?? "";

  const contractQuery = useContractDetail(contractId);
  const contract = contractQuery.data;
  const treeQuery = useStorageUnitTree(contract?.storageUnitId);
  const positions = useMemo(() => listTreePositions(treeQuery.data), [treeQuery.data]);
  const rights = getContractRequestRights(contract?.status);
  const createMutation = useCreateOutboundRequest();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [recipient, setRecipient] = useState({ name: "", phone: "", plate: "", company: "" });
  const [notes, setNotes] = useState("");
  const [validityDays, setValidityDays] = useState<RequestValidityDays>(1);
  const [error, setError] = useState<string | null>(null);

  // Preselect what was tapped on the rack map (an item, or every item of a tier).
  const initialSelection = useMemo(() => {
    const next = new Map<string, number>();
    positions
      .filter(canPick)
      .filter((position) =>
        params.skuId
          ? position.item.sku.id === params.skuId &&
            (!params.tierId || position.tier.id === params.tierId)
          : position.tier.id === params.tierId
      )
      .forEach((position) => next.set(position.key, getAvailableQuantity(position.item)));
    return next;
  }, [positions, params.skuId, params.tierId]);
  /** position key → requested quantity; `null` until the customer edits the preselection. */
  const [edited, setEdited] = useState<Map<string, number> | null>(null);
  const selected = edited ?? initialSelection;

  const selectedPositions = positions.filter((position) => selected.has(position.key));
  const totalQuantity = Array.from(selected.values()).reduce((sum, qty) => sum + qty, 0);

  const togglePosition = (position: TreePosition) => {
    setEdited((prev) => {
      const next = new Map(prev ?? initialSelection);
      if (next.has(position.key)) next.delete(position.key);
      else next.set(position.key, getAvailableQuantity(position.item));
      return next;
    });
  };

  const setQuantity = (key: string, quantity: number) => {
    setEdited((prev) => new Map(prev ?? initialSelection).set(key, quantity));
  };

  const handleSubmit = async () => {
    setError(null);
    const hasRecipient = Object.values(recipient).some((value) => value.trim());
    const payload: CreateOutboundRequest = {
      contractId,
      items: selectedPositions.map((position) => ({
        skuId: position.item.sku.id,
        quantity: selected.get(position.key) ?? 0,
        storageRackId: position.rack.id,
        rackTierId: position.tier.id,
      })),
      transporterInfo: hasRecipient
        ? {
            name: recipient.name.trim(),
            phoneNumber: recipient.phone.trim(),
            vehiclePlate: recipient.plate.trim() || undefined,
            deliveryCompany: recipient.company.trim() || undefined,
          }
        : undefined,
      expiresAt: validityToExpiresAt(validityDays),
      notes: notes.trim() || undefined,
    };

    const parsed = createOutboundRequestSchema.safeParse(payload);
    if (!parsed.success) {
      const path = parsed.error.issues[0]?.path[0];
      setError(
        path === "transporterInfo"
          ? t("inventoryRequest.outbound.recipientInvalid")
          : t("inventoryRequest.outbound.itemsRequired")
      );
      return;
    }

    try {
      const request = await createMutation.mutateAsync(payload);
      toast.success(t("inventoryRequest.outbound.created", { code: request.requestCode }));
      router.replace({ pathname: "/inventory-requests/[id]", params: { id: request.id } });
    } catch (err) {
      setError(resolveRequestError(err, currentLocale).message);
    }
  };

  const renderPositionLabel = (position: TreePosition) =>
    `${position.rack.rackCode} · ${formatTierShort(position.tier.tierNumber)}`;

  const renderRecipientField = (
    key: keyof typeof recipient,
    label: string,
    keyboardType: "default" | "phone-pad" = "default"
  ) => (
    <View className="flex-1 gap-1">
      <Text variant="muted" className="text-[11px]">
        {label}
      </Text>
      <TextInput
        value={recipient[key]}
        onChangeText={(value) => setRecipient((prev) => ({ ...prev, [key]: value }))}
        keyboardType={keyboardType}
        placeholderTextColor="#94A3B8"
        className={inputClass}
      />
    </View>
  );

  const loading = contractQuery.isLoading || treeQuery.isLoading;

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="gap-0.5 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
            <X size={22} color="#0B927E" />
          </Pressable>
          <Text className="flex-1 text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
            {t("inventoryRequest.outbound.title")}
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

      {loading ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-4 p-4 pb-32" keyboardShouldPersistTaps="handled">
          {!rights.canRequestOutbound ? (
            <View className="flex-row items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50/80 p-3 dark:border-sky-900 dark:bg-sky-950/30">
              <Info size={14} color="#0284C7" />
              <Text className="flex-1 text-xs text-sky-800 dark:text-sky-300">
                {t("rackMap.readOnlyBanner")}
              </Text>
            </View>
          ) : null}

          <View className="gap-2">
            <FieldLabel>
              {t("inventoryRequest.outbound.itemsTitle", { count: selectedPositions.length })}
            </FieldLabel>
            <View className="rounded-3xl border border-neutral-border bg-white px-3 dark:border-neutral-800 dark:bg-neutral-900">
              {selectedPositions.length === 0 ? (
                <Text variant="muted" className="py-5 text-center text-xs">
                  {t("inventoryRequest.outbound.noItems")}
                </Text>
              ) : (
                selectedPositions.map((position) => (
                  <View
                    key={position.key}
                    className="flex-row items-center gap-2.5 border-b border-neutral-border py-2.5 dark:border-neutral-800"
                  >
                    <SkuThumb imageUrl={position.item.sku.imageUrl} size="sm" />
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                        {position.item.sku.skuCode}
                      </Text>
                      <Text numberOfLines={1} variant="muted" className="text-[11px]">
                        {position.item.sku.name}
                      </Text>
                      <Text variant="muted" className="text-[10px]">
                        {renderPositionLabel(position)} ·{" "}
                        {t("inventoryRequest.outbound.available", {
                          qty: getAvailableQuantity(position.item),
                          uom: position.item.sku.uom,
                        })}
                      </Text>
                      {position.item.pendingOutboundQuantity ? (
                        <Text className="text-[10px] text-amber-700">
                          {t("inventoryRequest.outbound.heldByOthers", {
                            qty: position.item.pendingOutboundQuantity,
                            uom: position.item.sku.uom,
                          })}
                        </Text>
                      ) : null}
                    </View>
                    <QuantityStepper
                      value={selected.get(position.key) ?? 1}
                      onChange={(qty) => setQuantity(position.key, qty)}
                      min={1}
                      max={getAvailableQuantity(position.item)}
                    />
                    <Pressable onPress={() => togglePosition(position)} hitSlop={8}>
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
                  {t("inventoryRequest.outbound.addItems")}
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="gap-2">
            <FieldLabel>{t("inventoryRequest.outbound.recipientTitle")}</FieldLabel>
            <View className="flex-row gap-2">
              {renderRecipientField("name", t("inventoryRequest.recipient.name"))}
              {renderRecipientField("phone", t("inventoryRequest.recipient.phone"), "phone-pad")}
            </View>
            <View className="flex-row gap-2">
              {renderRecipientField("plate", t("inventoryRequest.recipient.plate"))}
              {renderRecipientField("company", t("inventoryRequest.recipient.company"))}
            </View>
          </View>

          <View className="gap-2">
            <FieldLabel>{t("inventoryRequest.validity.title")}</FieldLabel>
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
              placeholder={t("inventoryRequest.outbound.notesPlaceholder")}
              placeholderTextColor="#94A3B8"
              className={cn(inputClass, "min-h-[64px]")}
              style={{ textAlignVertical: "top" }}
            />
          </View>

          <View className="flex-row items-start gap-2 rounded-2xl border border-brand/20 bg-brand-bg p-3 dark:bg-brand/10">
            <Info size={16} color="#0B927E" />
            <Text className="flex-1 text-[11px] leading-4 text-neutral-700 dark:text-neutral-200">
              {t("inventoryRequest.outbound.otpHint")}
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
          disabled={
            createMutation.isPending || selectedPositions.length === 0 || !rights.canRequestOutbound
          }
          className={cn(
            "flex-[2] items-center rounded-xl bg-cta py-3 active:opacity-80",
            (createMutation.isPending ||
              selectedPositions.length === 0 ||
              !rights.canRequestOutbound) &&
              "opacity-50"
          )}
        >
          <Text className="text-sm font-bold text-white">
            {createMutation.isPending
              ? t("common.loading")
              : t("inventoryRequest.outbound.submit", { count: totalQuantity })}
          </Text>
        </Pressable>
      </View>

      <BottomSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={t("inventoryRequest.outbound.pickerTitle")}
        footer={
          <Pressable
            onPress={() => setPickerOpen(false)}
            className="items-center rounded-xl bg-brand py-3 active:opacity-80"
          >
            <Text className="text-sm font-bold text-white">{t("common.confirm")}</Text>
          </Pressable>
        }
      >
        {positions.length === 0 ? (
          <Text variant="muted" className="py-4 text-center text-xs">
            {t("rackMap.detail.emptyItems")}
          </Text>
        ) : (
          positions.map((position) => {
            const allowed = canPick(position);
            const checked = selected.has(position.key);
            return (
              <Pressable
                key={position.key}
                disabled={!allowed}
                onPress={() => togglePosition(position)}
                className={cn(
                  "flex-row items-center gap-2.5 rounded-2xl border p-2.5",
                  checked
                    ? "border-brand bg-brand-bg dark:bg-brand/10"
                    : "border-neutral-border dark:border-neutral-800",
                  !allowed && "opacity-50"
                )}
              >
                <SkuThumb imageUrl={position.item.sku.imageUrl} size="sm" />
                <View className="flex-1 gap-0.5">
                  <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                    {position.item.sku.skuCode} · {position.item.sku.name}
                  </Text>
                  <Text variant="muted" className="text-[10px]">
                    {renderPositionLabel(position)} · {getAvailableQuantity(position.item)}/
                    {position.item.quantity} {position.item.sku.uom}
                  </Text>
                  <ItemStatusBadge status={position.item.status} />
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
        <Text variant="muted" className="text-center text-[10px]">
          {t("inventoryRequest.outbound.holdingNote")}
        </Text>
      </BottomSheet>
    </SafeAreaView>
  );
}
