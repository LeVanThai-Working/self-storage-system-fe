import React from "react";
import { View, Pressable } from "react-native";
import { CircleAlert, Clock } from "lucide-react-native";
import {
  type InventoryMovementResponse,
  type StorageUnitInventoryTreeResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/stores/language.store";
import { useTierMovements } from "../hooks/useCustomerInventory";
import { getPositionLabel } from "../utils/rackMapFormat";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { MovementRow } from "./MovementRow";

interface TierHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  tree: StorageUnitInventoryTreeResponse;
  tierId: string;
}

export function TierHistoryModal({ visible, onClose, tree, tierId }: TierHistoryModalProps) {
  const { t } = useTranslation();
  const movementsQuery = useTierMovements(tierId);
  const movements = movementsQuery.data?.items ?? [];
  const locationLabel = getPositionLabel(tree, tierId, t("rackMap.form.floor"));

  const renderMovement = (movement: InventoryMovementResponse) => (
    <MovementRow key={movement.id} movement={movement} />
  );

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
