import React from "react";
import { View } from "react-native";
import { Lock, TriangleAlert } from "lucide-react-native";
import { InventoryItemStatusEnum } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";

const BADGE_STYLE: Record<
  Exclude<InventoryItemStatusEnum, InventoryItemStatusEnum.NORMAL>,
  { container: string; text: string; icon?: React.ReactNode }
> = {
  [InventoryItemStatusEnum.TEMPORARY_HOLDING]: {
    container: "bg-cta-light dark:bg-cta/20",
    text: "text-cta-dark",
  },
  [InventoryItemStatusEnum.DAMAGED]: {
    container: "bg-red-100 dark:bg-red-950/50",
    text: "text-red-700 dark:text-red-300",
    icon: <TriangleAlert size={10} color="#B91C1C" />,
  },
  [InventoryItemStatusEnum.DISPUTED]: {
    container: "bg-neutral-200 dark:bg-neutral-800",
    text: "text-neutral-600 dark:text-neutral-300",
    icon: <Lock size={10} color="#525252" />,
  },
};

/** Badge for a non-normal inventory item (Lưu tạm / Hư hỏng / Tranh chấp); renders nothing for normal. */
export function ItemStatusBadge({ status }: { status?: InventoryItemStatusEnum | null }) {
  const { t } = useTranslation();
  if (!status || status === InventoryItemStatusEnum.NORMAL) return null;
  const style = BADGE_STYLE[status];

  return (
    <View
      className={`flex-row items-center gap-1 self-start rounded-full px-2 py-0.5 ${style.container}`}
    >
      {style.icon}
      <Text className={`text-[10px] font-bold ${style.text}`}>
        {t(`rackMap.itemStatus.${status}`)}
      </Text>
    </View>
  );
}
