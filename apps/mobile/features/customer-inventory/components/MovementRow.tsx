import React from "react";
import { View } from "react-native";
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, PencilLine } from "lucide-react-native";
import {
  MovementTypeEnum,
  formatDate,
  type InventoryMovementResponse,
} from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";

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

export function formatTime(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

interface MovementRowProps {
  movement: InventoryMovementResponse;
}

/** One ledger entry: type icon, SKU, quantity change, code, reason, performer and time. */
export function MovementRow({ movement }: MovementRowProps) {
  const { t } = useTranslation();
  const style = MOVEMENT_STYLE[movement.type];

  return (
    <View className="flex-row items-start gap-3 rounded-2xl border border-neutral-border bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
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
          {movement.referenceCode ? ` · ${movement.referenceCode}` : ""}
        </Text>
        {movement.reason ? (
          <Text numberOfLines={2} className="text-[11px] text-neutral-600 dark:text-neutral-300">
            {movement.reason}
          </Text>
        ) : null}
        <Text variant="muted" className="text-[11px]">
          {formatDate(movement.createdAt)} {formatTime(movement.createdAt)}
          {movement.performer?.name
            ? ` · ${t("rackMap.history.by", { name: movement.performer.name })}`
            : ""}
        </Text>
      </View>
    </View>
  );
}
