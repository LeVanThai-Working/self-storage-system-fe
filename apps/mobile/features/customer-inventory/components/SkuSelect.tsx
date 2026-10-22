import React, { useState } from "react";
import { View, Pressable, TextInput } from "react-native";
import {
  ChevronDown,
  Package,
  ScanBarcode,
  Search,
  Square,
  SquareCheck,
} from "lucide-react-native";
import type { TreeTierItemSku } from "@self-storage-system-fe/shared";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";
import { SkuThumb } from "./SkuThumb";

export interface SkuOption {
  sku: TreeTierItemSku;
  /** Quantity shown as stock (in the whole unit or at one position). */
  quantity: number;
}

interface SkuSelectListProps {
  options: SkuOption[];
  selectedId: string | null;
  onSelect: (skuId: string) => void;
  emptyText: string;
  /** Shows a code / name search box above the list. */
  searchable?: boolean;
  /** Shows a barcode button inside the search box. */
  onScanPress?: () => void;
}

export function SkuSelectList({
  options,
  selectedId,
  onSelect,
  emptyText,
  searchable = false,
  onScanPress,
}: SkuSelectListProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const filtered = normalized
    ? options.filter(
        (option) =>
          option.sku.skuCode.toLowerCase().includes(normalized) ||
          option.sku.name.toLowerCase().includes(normalized)
      )
    : options;

  return (
    <View className="gap-2.5">
      {searchable ? (
        <View className="h-11 flex-row items-center gap-2 rounded-xl border border-neutral-border bg-white pl-3 pr-1.5 dark:border-neutral-700 dark:bg-neutral-900">
          <Search size={15} color="#94A3B8" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("rackMap.form.searchSku")}
            placeholderTextColor="#94A3B8"
            className="flex-1 py-0 text-xs text-neutral-dark dark:text-neutral-100"
          />
          {onScanPress ? (
            <Pressable
              onPress={onScanPress}
              hitSlop={6}
              className="h-8 w-8 items-center justify-center rounded-lg bg-brand-light dark:bg-brand/20"
            >
              <ScanBarcode size={16} color="#0B927E" />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {filtered.length === 0 ? (
        <View className="flex-row items-center gap-2 rounded-xl border border-dashed border-neutral-border p-3 dark:border-neutral-700">
          <Package size={16} color="#647B80" />
          <Text variant="muted" className="flex-1 text-xs leading-4">
            {normalized ? t("rackMap.form.noSkuMatch") : emptyText}
          </Text>
        </View>
      ) : (
        <View className="overflow-hidden rounded-2xl border border-neutral-border dark:border-neutral-800">
          {filtered.map((option, index) => {
            const selected = option.sku.id === selectedId;
            return (
              <Pressable
                key={option.sku.id}
                onPress={() => onSelect(option.sku.id)}
                className={`flex-row items-center gap-3 px-3 py-2.5 ${
                  index > 0 ? "border-t border-neutral-border dark:border-neutral-800" : ""
                } ${selected ? "bg-brand-bg dark:bg-brand/10" : "bg-white dark:bg-neutral-900"}`}
              >
                <SkuThumb imageUrl={option.sku.imageUrl} size="sm" />
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-xs font-bold text-neutral-dark dark:text-neutral-100">
                      {option.sku.skuCode}
                    </Text>
                    <Text numberOfLines={1} variant="muted" className="flex-1 text-[11px]">
                      {option.sku.name}
                    </Text>
                  </View>
                  <Text variant="muted" className="mt-0.5 text-[11px]">
                    {t("rackMap.form.stock", { qty: option.quantity, uom: option.sku.uom })}
                  </Text>
                </View>
                {selected ? (
                  <SquareCheck size={20} color="#0B927E" />
                ) : (
                  <Square size={20} color="#CBD5E1" />
                )}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

interface SkuSelectFieldProps {
  options: SkuOption[];
  selectedId: string | null;
  onSelect: (skuId: string) => void;
  emptyText: string;
}

/** Collapsed card of the chosen SKU that expands into the list to change it. */
export function SkuSelectField({ options, selectedId, onSelect, emptyText }: SkuSelectFieldProps) {
  const { t } = useTranslation();
  const selected = options.find((option) => option.sku.id === selectedId) ?? null;
  const [expanded, setExpanded] = useState(false);

  if (!selected || expanded) {
    return (
      <SkuSelectList
        options={options}
        selectedId={selectedId}
        emptyText={emptyText}
        onSelect={(skuId) => {
          onSelect(skuId);
          setExpanded(false);
        }}
      />
    );
  }

  const canChange = options.length > 1;

  return (
    <Pressable
      onPress={() => setExpanded(true)}
      disabled={!canChange}
      className="flex-row items-center gap-3 rounded-2xl border border-neutral-border bg-white p-3 active:opacity-80 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <SkuThumb imageUrl={selected.sku.imageUrl} size="md" />
      <View className="flex-1">
        <Text className="text-sm font-bold text-neutral-dark dark:text-neutral-100">
          {selected.sku.skuCode}
        </Text>
        <Text numberOfLines={1} variant="muted" className="text-xs">
          {selected.sku.name}
        </Text>
        <Text className="mt-0.5 text-xs font-semibold text-brand">
          {t("rackMap.form.stock", { qty: selected.quantity, uom: selected.sku.uom })}
        </Text>
      </View>
      {canChange ? <ChevronDown size={16} color="#647B80" /> : null}
    </Pressable>
  );
}
