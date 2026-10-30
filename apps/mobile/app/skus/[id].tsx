import React, { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Box,
  ChevronRight,
  CircleAlert,
  Lock,
  MapPin,
  Pencil,
  Trash2,
} from "lucide-react-native";
import {
  CustomerSkuStatusEnum,
  type MessageLocale,
  type SkuLocationItem,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/stores/language.store";
import { toast } from "@/stores/toast.store";
import { SkuThumb } from "@/features/customer-inventory/components/SkuThumb";
import { MovementRow } from "@/features/customer-inventory/components/MovementRow";
import {
  useSkuLocations,
  useSkuMovements,
} from "@/features/customer-inventory/hooks/useCustomerInventory";
import { buildLocationLabel } from "@/features/customer-inventory/utils/rackMapFormat";
import {
  useCustomerSku,
  useDeleteCustomerSku,
} from "@/features/customer-sku/hooks/useCustomerSkus";
import {
  computeSkuVolume,
  formatSkuDimensions,
  formatSkuVolume,
  formatSkuWeight,
  resolveSkuError,
} from "@/features/customer-sku/utils/skuFormat";

type DetailTab = "locations" | "history";

/** C12 — SKU detail: specs, where it is stored, recent movements, guarded delete. */
export default function SkuDetailScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";
  const { id = "" } = useLocalSearchParams<{ id?: string }>();
  const [tab, setTab] = useState<DetailTab>("locations");

  const skuQuery = useCustomerSku(id);
  const locationsQuery = useSkuLocations(id);
  const movementsQuery = useSkuMovements(id);
  const deleteMutation = useDeleteCustomerSku();

  const sku = skuQuery.data;
  const locations = locationsQuery.data?.locations ?? [];
  const totalQuantity = locationsQuery.data?.sku.totalQuantity ?? 0;
  const hasStock = totalQuantity > 0;

  const handleRefresh = () => {
    void skuQuery.refetch();
    void locationsQuery.refetch();
    void movementsQuery.refetch();
  };

  const handleDelete = () => {
    if (!sku || hasStock) return;
    Alert.alert(t("sku.detail.deleteTitle"), t("sku.detail.deleteConfirm", { code: sku.skuCode }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("sku.detail.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(sku.id);
            toast.success(t("sku.detail.deleted", { code: sku.skuCode }));
            router.back();
          } catch (error) {
            toast.error(resolveSkuError(error, currentLocale).message);
          }
        },
      },
    ]);
  };

  const openLocation = (location: SkuLocationItem) => {
    if (!location.contract?.id) return;
    router.push({
      pathname: "/contracts/[id]/rack-map",
      params: { id: location.contract.id },
    });
  };

  if (skuQuery.isLoading) {
    return (
      <SafeAreaView className="flex-1 gap-3 bg-neutral-bg p-4 dark:bg-neutral-950">
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-52 w-full rounded-3xl" />
      </SafeAreaView>
    );
  }

  if (!sku) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-neutral-bg p-6 dark:bg-neutral-950">
        <CircleAlert size={32} color="#EF4444" />
        <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
          {skuQuery.error
            ? resolveSkuError(skuQuery.error, currentLocale).message
            : t("sku.loadError")}
        </Text>
        <Pressable onPress={() => router.back()} className="mt-4 rounded-xl bg-brand px-5 py-2.5">
          <Text className="text-xs font-bold text-white">{t("common.back")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const specs: { label: string; value: string | null; highlight?: boolean }[] = [
    { label: t("sku.detail.barcode"), value: sku.barcode ?? null },
    { label: t("sku.detail.uom"), value: sku.uom },
    { label: t("sku.detail.dimensions"), value: formatSkuDimensions(sku.dimensions) },
    {
      label: t("sku.detail.volume"),
      value: formatSkuVolume(sku.volume ?? computeSkuVolume(sku.dimensions)),
    },
    { label: t("sku.detail.weight"), value: formatSkuWeight(sku.weightKg) },
    { label: t("sku.detail.totalStock"), value: `${totalQuantity} ${sku.uom}`, highlight: true },
  ];

  const renderLocation = (location: SkuLocationItem) => {
    const inHolding = !location.rackTier;
    const label = inHolding
      ? t("sku.detail.holdingArea")
      : buildLocationLabel({
          facilityCode: location.facility?.code,
          unitNumber: location.storageUnit?.unitNumber,
          rackCode: location.storageRack?.rackCode,
          tierCode: location.rackTier!.tierCode,
        });
    const description = inHolding
      ? t("sku.detail.holdingHint", { unit: location.storageUnit?.unitNumber ?? "" })
      : t("rackMap.position.tierOfRack", {
          tier: location.rackTier!.tierNumber,
          rack: location.storageRack?.rackCode ?? "",
        });
    return (
      <Pressable
        key={location.inventoryId}
        onPress={() => openLocation(location)}
        className="flex-row items-center gap-3 border-b border-neutral-border py-3 active:opacity-70 dark:border-neutral-800"
      >
        {inHolding ? <Box size={16} color="#E1601C" /> : <MapPin size={16} color="#0B927E" />}
        <View className="flex-1">
          <Text className="font-mono text-xs font-bold text-neutral-dark dark:text-neutral-100">
            {label}
          </Text>
          <Text variant="muted" className="text-[11px]">
            {description}
          </Text>
        </View>
        <Text className={cn("text-xs font-extrabold", inHolding ? "text-cta-dark" : "text-brand")}>
          {location.quantity} {sku.uom}
        </Text>
        <ChevronRight size={14} color="#94A3B8" />
      </Pressable>
    );
  };

  const movements = movementsQuery.data?.items ?? [];

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      <View className="flex-row items-center gap-2 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable onPress={() => router.back()} hitSlop={10} className="p-1 active:opacity-70">
          <ArrowLeft size={22} color="#0B927E" />
        </Pressable>
        <Text className="flex-1 font-mono text-lg font-extrabold text-neutral-dark dark:text-neutral-100">
          {sku.skuCode}
        </Text>
        <Pressable
          onPress={() => router.push({ pathname: "/skus/[id]/edit", params: { id: sku.id } })}
          className="flex-row items-center gap-1.5 rounded-full border border-brand/40 px-3 py-1.5 active:opacity-70"
        >
          <Pencil size={13} color="#0B927E" />
          <Text className="text-xs font-bold text-brand">{t("sku.detail.edit")}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="gap-4 p-4 pb-36"
        refreshControl={
          <RefreshControl
            refreshing={skuQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor="#0B927E"
          />
        }
      >
        <View className="flex-row items-center gap-3">
          <SkuThumb imageUrl={sku.imageUrl} size="md" />
          <View className="flex-1 gap-1.5">
            <Text className="text-base font-extrabold text-neutral-dark dark:text-neutral-100">
              {sku.name}
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {sku.category ? (
                <Text className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  {sku.category}
                </Text>
              ) : null}
              <Text
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-bold",
                  sku.status === CustomerSkuStatusEnum.ACTIVE
                    ? "bg-brand-light text-brand"
                    : "bg-neutral-100 text-neutral-muted"
                )}
              >
                {t(`sku.status.${sku.status}`)}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap gap-2 rounded-3xl border border-neutral-border bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-900">
          {specs.map((spec) => (
            <View
              key={spec.label}
              className={cn(
                "min-h-[52px] w-[31.5%] rounded-xl px-2 py-1.5",
                spec.highlight
                  ? "bg-brand-light dark:bg-brand/20"
                  : "bg-neutral-50 dark:bg-neutral-800"
              )}
            >
              <Text variant="muted" className="text-[10px]">
                {spec.label}
              </Text>
              <Text
                numberOfLines={2}
                className={cn(
                  "mt-1 text-[11px] font-extrabold",
                  spec.highlight ? "text-brand" : "text-neutral-dark dark:text-neutral-100"
                )}
              >
                {spec.value ?? "—"}
              </Text>
            </View>
          ))}
        </View>

        {sku.description ? (
          <Text className="text-xs leading-5 text-neutral-600 dark:text-neutral-300">
            {sku.description}
          </Text>
        ) : null}

        <View className="flex-row border-b border-neutral-border dark:border-neutral-800">
          {(["locations", "history"] as const).map((key) => (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              className={cn(
                "flex-1 items-center border-b-[3px] py-2",
                tab === key ? "border-brand" : "border-transparent"
              )}
            >
              <Text
                className={cn(
                  "text-xs font-bold",
                  tab === key ? "text-brand" : "text-neutral-muted"
                )}
              >
                {t(`sku.detail.tab.${key}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "locations" ? (
          <View className="rounded-3xl border border-neutral-border bg-white px-4 dark:border-neutral-800 dark:bg-neutral-900">
            {locationsQuery.isLoading ? (
              <Skeleton className="my-3 h-20 w-full rounded-2xl" />
            ) : locations.length > 0 ? (
              locations.map(renderLocation)
            ) : (
              <Text variant="muted" className="py-6 text-center text-xs">
                {t("sku.detail.noLocations")}
              </Text>
            )}
          </View>
        ) : (
          <View className="gap-2.5">
            {movementsQuery.isLoading ? (
              <Skeleton className="h-20 w-full rounded-2xl" />
            ) : movements.length > 0 ? (
              movements.map((movement) => <MovementRow key={movement.id} movement={movement} />)
            ) : (
              <Text variant="muted" className="py-6 text-center text-xs">
                {t("rackMap.history.empty")}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 gap-1.5 border-t border-neutral-border bg-white px-4 pb-6 pt-3 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable
          onPress={handleDelete}
          disabled={hasStock || deleteMutation.isPending || locationsQuery.isLoading}
          className={cn(
            "flex-row items-center justify-center gap-2 rounded-xl border py-3 active:opacity-70",
            hasStock || locationsQuery.isLoading
              ? "border-neutral-border opacity-50 dark:border-neutral-700"
              : "border-red-200 dark:border-red-900"
          )}
        >
          {hasStock ? <Lock size={14} color="#647B80" /> : <Trash2 size={14} color="#DC2626" />}
          <Text
            className={cn(
              "text-sm font-bold",
              hasStock ? "text-neutral-muted" : "text-red-600 dark:text-red-400"
            )}
          >
            {t("sku.detail.delete")}
          </Text>
        </Pressable>
        {hasStock ? (
          <Text className="text-center text-[11px] text-red-500">
            {t("sku.detail.deleteBlocked", { qty: totalQuantity, uom: sku.uom })}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
