import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowRight, Info, X } from "lucide-react-native";
import type { MessageLocale, TreeTier } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { FieldError, FieldLabel } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";
import { useContractDetail } from "@/features/contracts/hooks/useContracts";
import { useStorageUnitTree } from "@/features/customer-inventory/hooks/useCustomerInventory";
import { SkuThumb } from "@/features/customer-inventory/components/SkuThumb";
import { QuantityStepper } from "@/features/customer-inventory/components/QuantityStepper";
import {
  buildTreeTierLabel,
  canRequestMoveItem,
  formatTierShort,
  getContractRequestRights,
  isTierLocked,
  listTreePositions,
  sortTiersTopDown,
} from "@/features/customer-inventory/utils/rackMapFormat";
import { useCreateSupportTicket } from "@/features/support-tickets/hooks/useSupportTickets";
import { buildMoveRequestTicket } from "@/features/support-tickets/utils/ticketTemplates";
import { resolveRequestError } from "@/features/inventory-requests/utils/requestFormat";

/** C8 — ask staff to move an item to another tier; nothing moves until staff do it. */
export default function MoveRequestScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const params = useLocalSearchParams<{ id?: string; tierId?: string; skuId?: string }>();
  const contractId = params.id ?? "";

  const contractQuery = useContractDetail(contractId);
  const contract = contractQuery.data;
  const treeQuery = useStorageUnitTree(contract?.storageUnitId);
  const tree = treeQuery.data;
  const rights = getContractRequestRights(contract?.status);
  const createTicket = useCreateSupportTicket();

  const positions = useMemo(
    () => listTreePositions(tree).filter((position) => canRequestMoveItem(position.item)),
    [tree]
  );
  const initialKey = useMemo(() => {
    const match = positions.find(
      (position) =>
        (!params.skuId || position.item.sku.id === params.skuId) &&
        (!params.tierId || position.tier.id === params.tierId)
    );
    return match?.key ?? positions[0]?.key ?? null;
  }, [positions, params.skuId, params.tierId]);

  const [sourceKey, setSourceKey] = useState<string | null>(null);
  const [targetTierId, setTargetTierId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const source = positions.find((position) => position.key === (sourceKey ?? initialKey));
  const targetRacks = useMemo(
    () =>
      (tree?.racks ?? [])
        .map((rack) => ({
          rack,
          tiers: sortTiersTopDown(rack.tiers).filter(
            (tier) => tier.id !== source?.tier.id && !isTierLocked(tier.status)
          ),
        }))
        .filter((group) => group.tiers.length > 0),
    [tree, source]
  );
  const target = targetRacks
    .flatMap((group) => group.tiers.map((tier) => ({ rack: group.rack, tier })))
    .find((entry) => entry.tier.id === targetTierId);

  const selectSource = (key: string) => {
    setSourceKey(key);
    setTargetTierId(null);
    setQuantity(1);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!tree || !source || !target) {
      setError(t("inventoryRequest.move.pickTarget"));
      return;
    }
    try {
      const ticket = await createTicket.mutateAsync(
        buildMoveRequestTicket({
          contractId,
          skuCode: source.item.sku.skuCode,
          skuName: source.item.sku.name,
          fromLabel: buildTreeTierLabel(tree, source.rack, source.tier),
          toLabel: buildTreeTierLabel(tree, target.rack, target.tier),
          quantity,
          uom: source.item.sku.uom,
          reason: reason.trim() || undefined,
        })
      );
      toast.success(t("inventoryRequest.move.sent", { code: ticket.ticketCode }));
      router.replace({ pathname: "/support-tickets/[id]", params: { id: ticket.id } });
    } catch (err) {
      setError(resolveRequestError(err, currentLocale).message);
    }
  };

  const renderTierChip = (tier: TreeTier, rackCode: string) => {
    const selected = tier.id === targetTierId;
    return (
      <Pressable
        key={tier.id}
        onPress={() => setTargetTierId(tier.id)}
        className={cn(
          "rounded-xl border px-3 py-2",
          selected
            ? "border-cta bg-cta-light dark:bg-cta/20"
            : "border-neutral-border bg-white dark:border-neutral-700 dark:bg-neutral-900"
        )}
      >
        <Text
          className={cn(
            "text-xs font-bold",
            selected ? "text-cta-dark" : "text-neutral-700 dark:text-neutral-200"
          )}
        >
          {rackCode} · {formatTierShort(tier.tierNumber)}
        </Text>
        <Text variant="muted" className="text-[10px]">
          {tier.items.length > 0
            ? t("inventoryRequest.move.tierItems", { count: tier.items.length })
            : t("rackMap.status.available")}
        </Text>
      </Pressable>
    );
  };

  const loading = contractQuery.isLoading || treeQuery.isLoading;

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="flex-row items-center gap-2 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
          <X size={22} color="#0B927E" />
        </Pressable>
        <Text className="flex-1 text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
          {t("inventoryRequest.move.title")}
        </Text>
      </View>

      {loading ? (
        <View className="gap-3 p-4">
          <Skeleton className="h-24 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-4 p-4 pb-32" keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <FieldLabel>{t("inventoryRequest.move.itemLabel")}</FieldLabel>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-2"
            >
              {positions.map((position) => {
                const selected = position.key === source?.key;
                return (
                  <Pressable
                    key={position.key}
                    onPress={() => selectSource(position.key)}
                    className={cn(
                      "w-48 flex-row items-center gap-2 rounded-2xl border p-2.5",
                      selected
                        ? "border-brand bg-brand-bg dark:bg-brand/10"
                        : "border-neutral-border bg-white dark:border-neutral-800 dark:bg-neutral-900"
                    )}
                  >
                    <SkuThumb imageUrl={position.item.sku.imageUrl} size="sm" />
                    <View className="flex-1">
                      <Text
                        numberOfLines={1}
                        className="text-xs font-bold text-neutral-dark dark:text-neutral-100"
                      >
                        {position.item.sku.skuCode}
                      </Text>
                      <Text variant="muted" className="text-[10px]">
                        {position.rack.rackCode} · {formatTierShort(position.tier.tierNumber)} ·{" "}
                        {position.item.quantity} {position.item.sku.uom}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            {positions.length === 0 ? (
              <Text variant="muted" className="text-xs">
                {t("rackMap.detail.emptyItems")}
              </Text>
            ) : null}
          </View>

          {source && tree ? (
            <View className="flex-row items-center gap-2">
              <View className="flex-1 rounded-xl border-[1.5px] border-brand bg-brand-bg p-2.5 dark:bg-brand/10">
                <Text variant="muted" className="text-[10px]">
                  {t("inventoryRequest.move.from")}
                </Text>
                <Text className="font-mono text-[11px] font-bold text-neutral-dark dark:text-neutral-100">
                  {buildTreeTierLabel(tree, source.rack, source.tier)}
                </Text>
              </View>
              <ArrowRight size={16} color="#FF702E" />
              <View className="flex-1 rounded-xl border-[1.5px] border-cta bg-cta-light/50 p-2.5 dark:bg-cta/10">
                <Text variant="muted" className="text-[10px]">
                  {t("inventoryRequest.move.to")}
                </Text>
                <Text className="font-mono text-[11px] font-bold text-neutral-dark dark:text-neutral-100">
                  {target ? buildTreeTierLabel(tree, target.rack, target.tier) : "—"}
                </Text>
              </View>
            </View>
          ) : null}

          <View className="gap-2">
            <FieldLabel>{t("inventoryRequest.move.pickTarget")}</FieldLabel>
            {targetRacks.map((group) => (
              <View key={group.rack.id} className="gap-1.5">
                <Text variant="muted" className="text-[11px] font-bold">
                  {t("inventoryRequest.move.rack", { code: group.rack.rackCode })}
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {group.tiers.map((tier) => renderTierChip(tier, group.rack.rackCode))}
                </View>
              </View>
            ))}
            <Text variant="muted" className="text-[10px]">
              {t("inventoryRequest.move.onlyYourRacks")}
            </Text>
          </View>

          {source ? (
            <View className="flex-row items-center justify-between">
              <View className="gap-1">
                <FieldLabel>{t("inventoryRequest.move.quantity")}</FieldLabel>
                <QuantityStepper
                  value={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={source.item.quantity}
                />
              </View>
              <Pressable onPress={() => setQuantity(source.item.quantity)}>
                <Text className="text-xs font-bold text-brand">
                  {t("inventoryRequest.move.all", { qty: source.item.quantity })}
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View className="gap-1.5">
            <FieldLabel>{t("inventoryRequest.move.reason")}</FieldLabel>
            <TextInput
              value={reason}
              onChangeText={setReason}
              multiline
              maxLength={500}
              placeholder={t("inventoryRequest.move.reasonPlaceholder")}
              placeholderTextColor="#94A3B8"
              className="min-h-[64px] rounded-xl border border-neutral-border bg-white px-3 py-2.5 text-sm text-neutral-dark dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          <View className="flex-row items-start gap-2 rounded-2xl border border-brand/20 bg-brand-bg p-3 dark:bg-brand/10">
            <Info size={16} color="#0B927E" />
            <Text className="flex-1 text-[11px] leading-4 text-neutral-700 dark:text-neutral-200">
              {t("inventoryRequest.move.staffHint")}
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
          onPress={() => void handleSubmit()}
          disabled={createTicket.isPending || !target || !rights.canRequestMove}
          className={cn(
            "flex-[2] items-center rounded-xl bg-cta py-3 active:opacity-80",
            (createTicket.isPending || !target || !rights.canRequestMove) && "opacity-50"
          )}
        >
          <Text className="text-sm font-bold text-white">
            {createTicket.isPending ? t("common.loading") : t("inventoryRequest.move.submit")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
