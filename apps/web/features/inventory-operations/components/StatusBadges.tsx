"use client";

import { useTranslations } from "next-intl";
import { InventoryItemStatusEnum } from "@self-storage-system-fe/shared";

export type Tone = "yellow" | "orange" | "blue" | "purple" | "green" | "red" | "gray" | "brown";

const TONE: Record<Tone, { badge: string; dot: string }> = {
  yellow: { badge: "bg-amber-50 text-amber-700 border-amber-200/80", dot: "bg-amber-500" },
  orange: { badge: "bg-orange-50 text-orange-700 border-orange-200/80", dot: "bg-orange-500" },
  blue: { badge: "bg-sky-50 text-sky-700 border-sky-200/80", dot: "bg-sky-500" },
  purple: { badge: "bg-violet-50 text-violet-700 border-violet-200/80", dot: "bg-violet-500" },
  green: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200/80", dot: "bg-emerald-500" },
  red: { badge: "bg-rose-50 text-rose-700 border-rose-200/80", dot: "bg-rose-500" },
  gray: { badge: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  brown: { badge: "bg-stone-100 text-stone-700 border-stone-200", dot: "bg-stone-500" },
};

const ITEM_TONE: Record<InventoryItemStatusEnum, Tone> = {
  [InventoryItemStatusEnum.NORMAL]: "green",
  [InventoryItemStatusEnum.TEMPORARY_HOLDING]: "orange",
  [InventoryItemStatusEnum.DAMAGED]: "red",
  [InventoryItemStatusEnum.DISPUTED]: "gray",
};

export function Pill({ tone, label }: { tone: Tone; label: string }) {
  const style = TONE[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

/** Inventory item status (normal / holding / damaged / disputed). */
export const ItemStatusBadge = ({ status }: { status?: InventoryItemStatusEnum | null }) => {
  const t = useTranslations("inventoryOps.itemStatus");
  const value = status ?? InventoryItemStatusEnum.NORMAL;
  return <Pill tone={ITEM_TONE[value]} label={t(value)} />;
};
