import React from "react";
import { View, Pressable } from "react-native";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  CircleAlert,
  Clock,
  PencilLine,
} from "lucide-react-native";
import {
  MovementTypeEnum,
  formatDate,
  type InventoryMovementResponse,
  type StorageUnitInventoryTreeResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { useTierMovements } from "../hooks/useCustomerInventory";
import { getPositionLabel } from "../utils/rackMapFormat";
import { BottomSheet } from "./BottomSheet";

interface TierHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  tree: StorageUnitInventoryTreeResponse;
  tierId: string;
}

const MOVEMENT_STYLE: Record<MovementTypeEnum, { icon: React.ReactNode; box: string }> = {
  [MovementTypeEnum.IN]: {
    icon: <ArrowDownToLine size={15} color="#0B927E" />,
    box: "bg-brand-light dark:bg-brand/20",
  },
  [MovementTypeEnum.OUT]: {
    icon: <ArrowUpFromLine size={15} color="#FF702E" />,
    box: "bg-cta-light dark:bg-cta/20",
  },
  [MovementTypeEnum.MOVE]: {
    icon: <ArrowLeftRight size={15} color="#3B82F6" />,
    box: "bg-blue-100 dark:bg-blue-950/50",
  },
  [MovementTypeEnum.ADJUST]: {
    icon: <PencilLine size={15} color="#647B80" />,
    box: "bg-neutral-100 dark:bg-neutral-800",
  },
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TierHistoryModal({ visible, onClose, tree, tierId }: TierHistoryModalProps) {
  const { t } = useTranslation();
  const movementsQuery = useTierMovements(tierId);
  const movements = movementsQuery.data?.items ?? [];
  const locationLabel = getPositionLabel(tree, tierId, t("rackMap.form.floor"));

  const renderMovement = (movement: InventoryMovementResponse) => {
    const style = MOVEMENT_STYLE[movement.type];
    return (
      <View
        key={movement.id}
        className="flex-row items-start gap-3 rounded-2xl border border-neutral-border bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <View className={`h-9 w-9 items-center justify-center rounded-xl ${style.box}`}>
          {style.icon}
        </View>
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-xs font-bold text-neutral-dark dark:text-neutral-100">
              {t(`rackMap.history.type.${movement.type}`)} · {movement.sku?.skuCode ?? ""}
            </Text>
            <Text className="text-xs font-extrabold text-brand">
              {t("rackMap.history.change", {
                from: movement.previousQuantity,
                to: movement.newQuantity,
              })}
            </Text>
          </View>
          <Text variant="muted" className="font-mono text-[11px]">
            {movement.movementCode}
          </Text>
          {movement.reason ? (
            <Text numberOfLines={2} className="text-[11px] text-neutral-600 dark:text-neutral-300">
              {movement.reason}
            </Text>
          ) : null}
          <Text variant="muted" className="text-[11px]">
            {formatDate(movement.createdAt)} {formatTime(movement.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t("rackMap.history.title")}
      subtitle={locationLabel}
    >
      {movementsQuery.isLoading ? (
        <View className="gap-2.5">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </View>
      ) : movementsQuery.isError ? (
        <View className="items-center rounded-2xl border border-red-200 p-5 dark:border-red-900">
          <CircleAlert size={24} color="#EF4444" />
          <Pressable
            onPress={() => movementsQuery.refetch()}
            className="mt-3 rounded-xl bg-brand px-5 py-2.5"
          >
            <Text className="text-xs font-bold text-white">{t("rackMap.retry")}</Text>
          </Pressable>
        </View>
      ) : movements.length === 0 ? (
        <View className="items-center rounded-2xl border border-dashed border-neutral-border p-5 dark:border-neutral-700">
          <Clock size={24} color="#647B80" />
          <Text variant="muted" className="mt-1.5 text-xs">
            {t("rackMap.history.empty")}
          </Text>
        </View>
      ) : (
        <View className="gap-2.5">{movements.map(renderMovement)}</View>
      )}
    </BottomSheet>
  );
}
