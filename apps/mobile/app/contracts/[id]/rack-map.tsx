import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpFromLine,
  CircleAlert,
  ClipboardList,
  Info,
  LayoutGrid,
  Package,
  Plus,
  Search,
  ShieldAlert,
  Truck,
  TriangleAlert,
} from "lucide-react-native";
import {
  InventoryItemStatusEnum,
  type MessageLocale,
  type SkuLocationsResponse,
  type TreeTier,
  type TreeTierItem,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { useContractDetail } from "@/features/contracts/hooks/useContracts";
import { isWarehouseRackContract } from "@/features/contracts/utils/contractFormat";
import { SelfStorageGuardView } from "@/features/contracts/components/SelfStorageGuardView";
import {
  useCustomerInventoryRecords,
  useSkuLocations,
  useStorageUnitTree,
} from "@/features/customer-inventory/hooks/useCustomerInventory";
import { RackMapSummaryBar } from "@/features/customer-inventory/components/RackMapSummaryBar";
import { RackCard } from "@/features/customer-inventory/components/RackCard";
import { UnrackedSection } from "@/features/customer-inventory/components/UnrackedSection";
import { TierDetailModal } from "@/features/customer-inventory/components/TierDetailModal";
import { LocateSheet } from "@/features/customer-inventory/components/LocateSheet";
import { LocateResultBanner } from "@/features/customer-inventory/components/LocateResultBanner";
import { TierHistoryModal } from "@/features/customer-inventory/components/TierHistoryModal";
import type { RequestActionType } from "@/features/customer-inventory/types/rackMap.types";
import {
  INVENTORY_ERROR,
  buildFloorLabel,
  findTierInTree,
  getContractRequestRights,
  resolveInventoryError,
  sortTiersTopDown,
} from "@/features/customer-inventory/utils/rackMapFormat";

/** `undefined` = detail sheet closed, `null` = floor (unracked) items. */
type DetailTarget = string | null | undefined;

/** Wait for expanded racks to lay out before scrolling to them. */
const SCROLL_AFTER_LAYOUT_MS = 350;
/** Rack card geometry used to scroll a located tier into view (see RackCard: h-14 rows). */
const RACK_BODY_OFFSET = 70;
const TIER_ROW_HEIGHT = 56;
/** Keep some of the map above the located tier visible. */
const SCROLL_CONTEXT_OFFSET = 160;

export default function ContractRackMapScreen() {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const currentLocale: MessageLocale = locale === "en" ? "en" : "vi";

  /** `skuId` opens the map with that SKU located; no `tierId` then means its holding-area stock. */
  const params = useLocalSearchParams<{ id?: string; skuId?: string; tierId?: string }>();
  const contractId = params.id ?? "";

  const contractQuery = useContractDetail(contractId);
  const contract = contractQuery.data;
  const isWarehouse =
    typeof isWarehouseRackContract === "function" ? isWarehouseRackContract(contract) : false;
  const storageUnitId = isWarehouse ? contract?.storageUnitId : undefined;
  const treeQuery = useStorageUnitTree(storageUnitId, contractId);
  const tree = treeQuery.data;
  const linkedSkuQuery = useSkuLocations(params.skuId);

  const [detailTarget, setDetailTarget] = useState<DetailTarget>(undefined);
  const [historyTierId, setHistoryTierId] = useState<string | null>(null);
  const [collapsedRackIds, setCollapsedRackIds] = useState<Set<string>>(() => new Set());
  const [locateOpen, setLocateOpen] = useState(false);
  const [locateResult, setLocateResult] = useState<SkuLocationsResponse | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const rackOffsetsRef = useRef<Map<string, number>>(new Map());
  const linkedSkuLocatedRef = useRef(false);

  const rights = getContractRequestRights(contract?.status);
  const readOnly = !rights.canRequestOutbound && !rights.canRequestMove;
  const attentionQuery = useCustomerInventoryRecords(
    { contractId, minQuantity: 1, limit: 100 },
    Boolean(contractId)
  );
  const attentionCount = useMemo(
    () =>
      (attentionQuery.data?.items ?? []).filter(
        (item) => item.status && item.status !== InventoryItemStatusEnum.NORMAL
      ).length,
    [attentionQuery.data]
  );
  const { refetch: refetchContract } = contractQuery;
  const { refetch: refetchTree } = treeQuery;

  useFocusEffect(
    useCallback(() => {
      if (contractId) {
        refetchContract();
      }
    }, [contractId, refetchContract])
  );

  const treeError = useMemo(
    () => (treeQuery.error ? resolveInventoryError(treeQuery.error, currentLocale) : null),
    [treeQuery.error, currentLocale]
  );
  const contractError = useMemo(
    () => (contractQuery.error ? resolveInventoryError(contractQuery.error, currentLocale) : null),
    [contractQuery.error, currentLocale]
  );

  const highlightedTierIds = useMemo(() => {
    const ids = new Set<string>();
    locateResult?.locations.forEach((location) => {
      if (location.rackTier) ids.add(location.rackTier.id);
    });
    return ids;
  }, [locateResult]);

  const floorHighlighted = Boolean(locateResult?.locations.some((location) => !location.rackTier));
  const highlightActive = highlightedTierIds.size > 0 || floorHighlighted;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (contractId) {
      router.replace({ pathname: "/contracts/[id]" as any, params: { id: contractId } });
    } else {
      router.replace("/(tabs)/my-storages" as any);
    }
  };

  const handleRefresh = () => {
    refetchContract();
    if (storageUnitId) refetchTree();
  };

  const toggleRack = (rackId: string) => {
    setCollapsedRackIds((prev) => {
      const next = new Set(prev);
      if (next.has(rackId)) {
        next.delete(rackId);
      } else {
        next.add(rackId);
      }
      return next;
    });
  };

  const handleLocated = useCallback(
    (result: SkuLocationsResponse, focusTierId?: string | null) => {
      // The SKU may also sit under other contracts; this map only marks the current one.
      const locations = result.locations.filter((location) => location.contract?.id === contractId);
      setLocateResult({ ...result, locations });
      setLocateOpen(false);
      if (!tree || locations.length === 0) return;

      const tierIds = new Set(
        locations.map((location) => location.rackTier?.id).filter((id): id is string => Boolean(id))
      );
      const targetRacks = tree.racks.filter((rack) =>
        rack.tiers.some((tier) => tierIds.has(tier.id))
      );

      setCollapsedRackIds((prev) => {
        const next = new Set(prev);
        targetRacks.forEach((rack) => next.delete(rack.id));
        return next;
      });

      // Tier to bring into view: the tapped one, else the top-most located tier of the first rack.
      const firstRack = targetRacks[0];
      const scrollTierId =
        focusTierId !== undefined
          ? focusTierId
          : firstRack
            ? (sortTiersTopDown(firstRack.tiers).find((tier) => tierIds.has(tier.id))?.id ?? null)
            : null;

      setTimeout(() => {
        if (scrollTierId === null) {
          scrollRef.current?.scrollToEnd({ animated: true });
          return;
        }
        const rack = tree.racks.find((item) => item.tiers.some((tier) => tier.id === scrollTierId));
        const rackOffset = rack ? rackOffsetsRef.current.get(rack.id) : undefined;
        if (!rack || rackOffset === undefined) return;
        const tierIndex = sortTiersTopDown(rack.tiers).findIndex(
          (tier) => tier.id === scrollTierId
        );
        const y =
          rackOffset + RACK_BODY_OFFSET + tierIndex * TIER_ROW_HEIGHT - SCROLL_CONTEXT_OFFSET;
        scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
      }, SCROLL_AFTER_LAYOUT_MS);
    },
    [contractId, tree]
  );

  useEffect(() => {
    if (linkedSkuLocatedRef.current || !tree || !linkedSkuQuery.data) return;
    linkedSkuLocatedRef.current = true;
    handleLocated(linkedSkuQuery.data, params.tierId ?? null);
  }, [tree, linkedSkuQuery.data, params.tierId, handleLocated]);

  const handleTierPress = (tier: TreeTier) => setDetailTarget(tier.id);

  /** Opens the request form for a tier (optionally preselecting one item). */
  const handleRequest = (type: RequestActionType, item?: TreeTierItem) => {
    const tierId = typeof detailTarget === "string" ? detailTarget : undefined;
    setDetailTarget(undefined);
    const params = { id: contractId, tierId, skuId: item?.sku.id };
    if (type === "outbound") {
      router.push({ pathname: "/contracts/[id]/outbound/new", params });
    } else {
      router.push({ pathname: "/contracts/[id]/move-request", params });
    }
  };

  const isLoading = contractQuery.isLoading || (Boolean(storageUnitId) && treeQuery.isLoading);
  const forbidden = treeError?.messageCode === INVENTORY_ERROR.FORBIDDEN;
  const loadError = contractError ?? treeError;

  const facilityName = tree?.facility?.name || contract?.facility?.name || "";
  const facilityCode = tree?.facility?.code;
  const facilityLabel = facilityCode ? `[${facilityCode}] ${facilityName}` : facilityName;

  const renderHeader = () => (
    <View className="gap-1 border-b border-neutral-border bg-white px-4 pb-3 pt-2 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={handleBack}
          hitSlop={10}
          className="items-center justify-center p-1 active:opacity-70"
        >
          <ArrowLeft size={22} color="#0B927E" />
        </Pressable>
        <Text
          numberOfLines={1}
          className="flex-1 text-lg font-extrabold text-neutral-dark dark:text-neutral-100"
        >
          {t("rackMap.title")}
        </Text>
        <Pressable
          onPress={() =>
            router.push({ pathname: "/contracts/[id]/requests", params: { id: contractId } })
          }
          hitSlop={6}
          accessibilityLabel={t("inventoryRequest.list.title")}
          className="h-8 w-8 items-center justify-center rounded-full border border-brand/40 active:opacity-70"
        >
          <ClipboardList size={15} color="#0B927E" />
        </Pressable>
        <Pressable
          onPress={() => router.push("/skus")}
          hitSlop={6}
          accessibilityLabel={t("rackMap.skuButton")}
          className="h-8 flex-row items-center gap-1.5 rounded-full border border-brand/40 bg-white px-2.5 active:opacity-70 dark:bg-neutral-900"
        >
          <Package size={14} color="#0B927E" />
          <Text className="text-xs font-bold text-brand">{t("rackMap.skuButton")}</Text>
        </Pressable>
        {tree ? (
          <Pressable
            onPress={() => setLocateOpen(true)}
            className="flex-row items-center gap-1.5 rounded-full border border-brand/40 bg-white px-3 py-1.5 active:opacity-70 dark:bg-neutral-900"
          >
            <Search size={14} color="#0B927E" />
            <Text className="text-xs font-bold text-brand">{t("rackMap.locate.button")}</Text>
          </Pressable>
        ) : null}
      </View>
      {contract ? (
        <Text numberOfLines={1} variant="muted" className="pl-9 text-[11px]">
          {t("rackMap.unitSubtitle", {
            facility: facilityLabel,
            unit: tree?.storageUnit.unitNumber ?? contract.storageUnit?.unitNumber ?? "",
          })}
          {" · "}
          {t("rackMap.contractLabel", { code: contract.contractCode })}
        </Text>
      ) : null}
    </View>
  );

  const renderBody = () => {
    if (isLoading) {
      return (
        <View className="gap-4 p-4">
          <Skeleton className="h-36 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-3xl" />
        </View>
      );
    }

    if (forbidden) {
      return (
        <View className="m-4 items-center rounded-3xl border border-red-200 bg-white p-8 dark:border-red-900 dark:bg-neutral-900">
          <ShieldAlert size={36} color="#EF4444" />
          <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {t("rackMap.forbidden")}
          </Text>
          <Pressable onPress={handleBack} className="mt-4 rounded-xl bg-brand px-5 py-2.5">
            <Text className="text-xs font-bold text-white">{t("common.back")}</Text>
          </Pressable>
        </View>
      );
    }

    if (loadError || !tree) {
      return (
        <View className="m-4 items-center rounded-3xl border border-red-200 bg-white p-8 dark:border-red-900 dark:bg-neutral-900">
          <CircleAlert size={36} color="#EF4444" />
          <Text className="mt-3 text-center text-sm font-bold text-neutral-dark dark:text-neutral-100">
            {t("rackMap.loadError")}
          </Text>
          {loadError?.message ? (
            <Text variant="muted" className="mt-1 text-center text-xs">
              {loadError.message}
            </Text>
          ) : null}
          <Pressable onPress={handleRefresh} className="mt-4 rounded-xl bg-brand px-5 py-2.5">
            <Text className="text-xs font-bold text-white">{t("rackMap.retry")}</Text>
          </Pressable>
        </View>
      );
    }

    const hasRacks = tree.racks.length > 0;

    return (
      <ScrollView
        ref={scrollRef}
        contentContainerClassName={`gap-4 p-4 ${locateResult ? "pb-28" : "pb-16"}`}
        refreshControl={
          <RefreshControl
            refreshing={treeQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor="#0B927E"
          />
        }
      >
        {readOnly ? (
          <View className="flex-row items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50/80 p-3 dark:border-sky-900 dark:bg-sky-950/30">
            <Info size={14} color="#0284C7" />
            <Text className="flex-1 text-xs leading-4 text-sky-800 dark:text-sky-300">
              {t("rackMap.readOnlyBanner")}
            </Text>
          </View>
        ) : rights.overdue ? (
          <View className="flex-row items-start gap-2 rounded-2xl border border-cta/30 bg-cta-light/60 p-3 dark:bg-cta/10">
            <Info size={14} color="#D34D0F" />
            <Text className="flex-1 text-xs leading-4 text-cta-dark">
              {t("rackMap.overdueBanner")}
            </Text>
          </View>
        ) : null}

        {attentionCount > 0 ? (
          <Pressable
            onPress={() =>
              router.push({ pathname: "/contracts/[id]/attention", params: { id: contractId } })
            }
            className="flex-row items-center gap-2.5 rounded-2xl border border-cta/30 bg-cta-light/60 p-3 active:opacity-80 dark:bg-cta/10"
          >
            <TriangleAlert size={16} color="#D34D0F" />
            <Text className="flex-1 text-xs font-bold text-cta-dark">
              {t("rackMap.attentionBanner", { count: attentionCount })}
            </Text>
            <Text className="text-xs font-bold text-cta-dark">{t("rackMap.view")}</Text>
          </Pressable>
        ) : null}

        <RackMapSummaryBar
          summary={tree.summary}
          showTiers={hasRacks}
          onPressSkus={() => router.push("/skus")}
        />

        {tree.summary.totalSkus === 0 && !readOnly ? (
          <View className="rounded-3xl border border-brand/30 bg-brand-light/25 p-4 dark:bg-brand/10">
            <View className="flex-row items-start gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand/15">
                <Package size={22} color="#0B927E" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
                  {t("rackMap.preCreateSkuTitle")}
                </Text>
                <Text variant="muted" className="mt-0.5 text-xs leading-4">
                  {t("rackMap.preCreateSkuHint")}
                </Text>
              </View>
            </View>
            <View className="mt-3 flex-row gap-2">
              <Pressable
                onPress={() => router.push("/skus/new")}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brand py-2.5 active:opacity-80"
              >
                <Plus size={15} color="#FFFFFF" />
                <Text className="text-xs font-bold text-white">{t("rackMap.createSkuButton")}</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push("/skus")}
                className="flex-row items-center justify-center rounded-xl border border-brand/40 bg-white px-3.5 py-2.5 active:opacity-80 dark:bg-neutral-900"
              >
                <Text className="text-xs font-bold text-brand">{t("rackMap.viewSkuList")}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {hasRacks ? (
          tree.racks.map((rack) => (
            <RackCard
              key={rack.id}
              rack={rack}
              collapsed={collapsedRackIds.has(rack.id)}
              onToggle={() => toggleRack(rack.id)}
              highlightedTierIds={highlightedTierIds}
              highlightActive={highlightActive}
              onTierPress={handleTierPress}
              isRented={true}
              onLayout={(event) => {
                rackOffsetsRef.current.set(rack.id, event.nativeEvent.layout.y);
              }}
            />
          ))
        ) : (
          <View className="items-center rounded-3xl border border-neutral-border bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
            <LayoutGrid size={28} color="#647B80" />
            <Text variant="muted" className="mt-2 text-center text-xs">
              {t("rackMap.noRentedRacks")}
            </Text>
          </View>
        )}

        <UnrackedSection
          items={tree.unrackedItems}
          locationLabel={buildFloorLabel(tree.facility?.code, tree.storageUnit.unitNumber)}
          highlighted={floorHighlighted}
          dimmed={highlightActive && !floorHighlighted}
          onPress={() => setDetailTarget(null)}
        />
      </ScrollView>
    );
  };

  if (contract && !isWarehouse) {
    return (
      <SelfStorageGuardView
        contract={contract}
        title={t("rackMap.title")}
        reason="rack_not_supported"
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-bg dark:bg-neutral-950">
      {renderHeader()}
      {renderBody()}

      {tree && detailTarget !== undefined ? (
        <TierDetailModal
          key={String(detailTarget)}
          visible={!historyTierId}
          onClose={() => setDetailTarget(undefined)}
          tree={tree}
          tierId={detailTarget}
          rights={rights}
          onRequest={handleRequest}
          onReportIncident={() => {
            const found =
              typeof detailTarget === "string" ? findTierInTree(tree, detailTarget) : null;
            setDetailTarget(undefined);
            router.push({
              pathname: "/incidents/new",
              params: { contractId, rackId: found?.rack.id, tierId: found?.tier.id },
            });
          }}
          onShowHistory={
            typeof detailTarget === "string" ? () => setHistoryTierId(detailTarget) : undefined
          }
        />
      ) : null}

      {tree && historyTierId ? (
        <TierHistoryModal
          visible
          onClose={() => setHistoryTierId(null)}
          tree={tree}
          tierId={historyTierId}
        />
      ) : null}

      {tree && !locateResult ? (
        <View className="gap-2 border-t border-neutral-border bg-white px-4 pb-5 pt-2.5 dark:border-neutral-800 dark:bg-neutral-900">
          <Text variant="muted" className="text-center text-[10px]">
            {t("rackMap.staffOperatedHint")}
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              disabled={!rights.canRequestMove}
              onPress={() => handleRequest("move")}
              className={`flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-neutral-border py-2.5 active:opacity-80 dark:border-neutral-700 ${
                rights.canRequestMove ? "" : "opacity-40"
              }`}
            >
              <ArrowLeftRight size={13} color="#0B927E" />
              <Text className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
                {t("rackMap.action.requestMove")}
              </Text>
            </Pressable>
            <Pressable
              disabled={!rights.canNotifyInbound}
              onPress={() =>
                router.push({
                  pathname: "/contracts/[id]/inbound/new",
                  params: { id: contractId },
                })
              }
              className={`flex-1 flex-row items-center justify-center gap-1 rounded-xl border border-neutral-border py-2.5 active:opacity-80 dark:border-neutral-700 ${
                rights.canNotifyInbound ? "" : "opacity-40"
              }`}
            >
              <Truck size={13} color="#0B927E" />
              <Text className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
                {t("rackMap.action.notifyInbound")}
              </Text>
            </Pressable>
            <Pressable
              disabled={!rights.canRequestOutbound}
              onPress={() => handleRequest("outbound")}
              className={`flex-1 flex-row items-center justify-center gap-1 rounded-xl bg-cta py-2.5 active:opacity-80 ${
                rights.canRequestOutbound ? "" : "opacity-40"
              }`}
            >
              <ArrowUpFromLine size={13} color="#FFFFFF" />
              <Text className="text-[11px] font-bold text-white">
                {t("rackMap.action.requestOutbound")}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {tree && locateOpen ? (
        <LocateSheet
          visible
          onClose={() => setLocateOpen(false)}
          tree={tree}
          onLocated={handleLocated}
        />
      ) : null}

      {tree && locateResult ? (
        <LocateResultBanner result={locateResult} onClear={() => setLocateResult(null)} />
      ) : null}
    </SafeAreaView>
  );
}
