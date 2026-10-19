import React from "react";
import { Modal, View, ScrollView, Pressable } from "react-native";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  Clock,
  PencilLine,
  X,
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

interface TierHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  tree: StorageUnitInventoryTreeResponse;
  tierId: string;
}

const MOVEMENT_ICON: Record<MovementTypeEnum, React.ReactNode> = {
  [MovementTypeEnum.IN]: <ArrowDownToLine size={14} color="#0B927E" />,
  [MovementTypeEnum.OUT]: <ArrowUpFromLine size={14} color="#FF702E" />,
  [MovementTypeEnum.MOVE]: <ArrowLeftRight size={14} color="#3B82F6" />,
  [MovementTypeEnum.ADJUST]: <PencilLine size={14} color="#647B80" />,
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

  const renderMovement = (movement: InventoryMovementResponse) => (
    <View
      key={movement.id}
      className="flex-row items-start gap-3 rounded-2xl border border-neutral-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 p-3"
    >
      <View className="h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-neutral-900">
        {MOVEMENT_ICON[movement.type]}
      </View>
      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="max-h-[88%] rounded-t-3xl bg-white dark:bg-neutral-900 border-t border-neutral-border dark:border-neutral-800">
          <View className="flex-row items-center justify-between border-b border-neutral-border dark:border-neutral-800 px-5 py-4">
            <View className="flex-1 pr-3">
              <Text className="text-base font-bold text-neutral-dark dark:text-neutral-100">
                {t("rackMap.history.title")}
              </Text>
              <Text variant="muted" className="font-mono text-xs mt-0.5">
                {locationLabel}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <X size={16} color="#647B80" />
            </Pressable>
          </View>

          <ScrollView contentContainerClassName="p-5 pb-8 gap-2.5">
            {movementsQuery.isLoading ? (
              <>
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </>
            ) : movementsQuery.isError ? (
              <View className="items-center rounded-2xl border border-red-200 dark:border-red-900 p-5">
                <AlertCircle size={24} color="#EF4444" />
                <Pressable
                  onPress={() => movementsQuery.refetch()}
                  className="mt-3 rounded-xl bg-brand px-5 py-2.5"
                >
                  <Text className="text-xs font-bold text-white">{t("rackMap.retry")}</Text>
                </Pressable>
              </View>
            ) : movements.length === 0 ? (
              <View className="items-center rounded-2xl border border-dashed border-neutral-border dark:border-neutral-700 p-5">
                <Clock size={24} color="#647B80" />
                <Text variant="muted" className="mt-1.5 text-xs">
                  {t("rackMap.history.empty")}
                </Text>
              </View>
            ) : (
              movements.map(renderMovement)
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
